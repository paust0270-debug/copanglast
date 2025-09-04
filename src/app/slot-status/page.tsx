'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SlotData {
  id: number;
  customerId: string;
  customerName: string;
  slotType: string;
  slotCount: number;
  usedSlots: number;
  remainingSlots: number;
  totalPaymentAmount: number; // 총 입금액
  remainingDays: number; // 잔여기간
  registrationDate: string; // 등록일
  expiryDate: string; // 만료일
  addDate: string;
  status: 'pending' | 'active' | 'completed' | 'inactive' | 'expired';
  userGroup: string;
}

export default function SlotStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slotData, setSlotData] = useState<SlotData[]>([]);
  const [filteredData, setFilteredData] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilteredByCustomer, setIsFilteredByCustomer] = useState(false);
  const [filteredCustomerInfo, setFilteredCustomerInfo] = useState<{id: string, username: string, name: string} | null>(null);

  // URL 파라미터에서 고객 정보 확인
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    const username = searchParams.get('username');
    const name = searchParams.get('name');
    
    if (customerId && username && name) {
      setIsFilteredByCustomer(true);
      setFilteredCustomerInfo({
        id: customerId,
        username: decodeURIComponent(username),
        name: decodeURIComponent(name)
      });
      console.log('고객 필터링 모드:', { customerId, username: decodeURIComponent(username), name: decodeURIComponent(name) });
    } else {
      setIsFilteredByCustomer(false);
      setFilteredCustomerInfo(null);
    }
  }, [searchParams]);

  // Supabase에서 슬롯 데이터 가져오기
  const fetchSlotData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('슬롯 데이터 조회 시작...');
      
      // API 엔드포인트 호출
      const response = await fetch('/api/slot-status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '데이터 조회에 실패했습니다.');
      }
      
      console.log('조회된 슬롯 데이터:', result.data);
      setSlotData(result.data);
      
      // 고객별 필터링이 적용된 경우 즉시 필터링된 데이터만 설정
      if (isFilteredByCustomer && filteredCustomerInfo) {
        const filtered = result.data.filter((slot: SlotData) => 
          slot.customerId === filteredCustomerInfo.username || 
          slot.customerName === filteredCustomerInfo.name
        );
        setFilteredData(filtered);
        console.log('고객별 필터링 즉시 적용:', filteredCustomerInfo.username, '결과:', filtered.length, '개');
      } else {
        setFilteredData(result.data);
      }
    } catch (error) {
      console.error('슬롯 데이터 조회 오류:', error);
      setError('슬롯 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotData();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = slotData;

    // 고객별 필터링 (URL 파라미터로 전달된 경우)
    if (isFilteredByCustomer && filteredCustomerInfo) {
      filtered = filtered.filter(slot => 
        slot.customerId === filteredCustomerInfo.username || 
        slot.customerName === filteredCustomerInfo.name
      );
      console.log('고객별 필터링 적용:', filteredCustomerInfo.username, '결과:', filtered.length, '개');
    }

    setFilteredData(filtered);
  }, [slotData, isFilteredByCustomer, filteredCustomerInfo]);

  const handleRefresh = () => {
    fetchSlotData();
  };

  const handleClearFilter = () => {
    setIsFilteredByCustomer(false);
    setFilteredCustomerInfo(null);
    // URL에서 파라미터 제거
    router.replace('/slot-status');
  };

  // 슬롯타입 버튼 클릭 핸들러
  const handleSlotTypeClick = (slot: SlotData) => {
    if (slot.remainingSlots > 0) {
      // URL에서 전달받은 customerId (UUID)를 사용
      const actualCustomerId = searchParams.get('customerId');
      
      const params = new URLSearchParams({
        customerId: actualCustomerId || slot.customerId, // UUID 우선 사용
        slotCount: slot.remainingSlots.toString(),
        customerName: slot.customerName,
        slotType: slot.slotType
      });
      
      // 슬롯타입에 따라 다른 페이지로 이동
      let targetUrl = '';
      switch (slot.slotType) {
        case '쿠팡':
          targetUrl = `/coupangapp/add?${params.toString()}`;
          break;
        case '쿠팡VIP':
          targetUrl = `/coupangapp/vip?${params.toString()}`;
          break;
        case '쿠팡 앱':
          targetUrl = `/coupangapp/app?${params.toString()}`;
          break;
        default:
          targetUrl = `/coupangapp/add?${params.toString()}`;
          break;
      }
      
      console.log('슬롯타입 클릭 - 이동할 URL:', targetUrl);
      console.log('전달되는 파라미터:', {
        customerId: actualCustomerId || slot.customerId,
        slotCount: slot.remainingSlots,
        customerName: slot.customerName,
        slotType: slot.slotType
      });
      
      router.push(targetUrl);
    }
  };

  // 내역 버튼 클릭 처리
  const handleDetailClick = (slot: SlotData) => {
    console.log('내역 버튼 클릭:', slot);
    // TODO: 내역 페이지로 이동 또는 모달 표시
  };

  // 연장 버튼 클릭 처리
  const handleExtendClick = (slot: SlotData) => {
    console.log('연장 버튼 클릭:', slot);
    // TODO: 연장 기능 구현
  };

  // 수정 버튼 클릭 처리
  const handleEditClick = (slot: SlotData) => {
    console.log('수정 버튼 클릭:', slot);
    // TODO: 수정 페이지로 이동 또는 모달 표시
  };

  // 중지 버튼 클릭 처리
  const handleStopClick = (slot: SlotData) => {
    console.log('중지 버튼 클릭:', slot);
    // TODO: 중지 기능 구현
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">활성</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">완료</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">비활성</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">만료</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-600 text-lg">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 text-lg">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isFilteredByCustomer && filteredCustomerInfo 
                ? `${filteredCustomerInfo.name} 고객 슬롯 현황`
                : '슬롯 현황'
              }
            </h1>
            {isFilteredByCustomer && filteredCustomerInfo && (
              <p className="text-sm text-gray-600 mt-1">
                고객 ID: {filteredCustomerInfo.username} | 총 {filteredData.length}개 슬롯
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            {isFilteredByCustomer && (
              <Button onClick={handleClearFilter} variant="outline">
                전체 보기
              </Button>
            )}
            <Button onClick={handleRefresh} variant="outline">
              새로고침
            </Button>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">총 슬롯</h3>
            <p className="text-3xl font-bold text-blue-600">
              {filteredData.reduce((sum, slot) => sum + slot.slotCount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">사용 중</h3>
            <p className="text-3xl font-bold text-green-600">
              {filteredData.reduce((sum, slot) => sum + slot.usedSlots, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">잔여</h3>
            <p className="text-3xl font-bold text-orange-600">
              {filteredData.reduce((sum, slot) => sum + slot.remainingSlots, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">총 고객</h3>
            <p className="text-3xl font-bold text-purple-600">
              {filteredData.length}
            </p>
          </div>
        </div>

        {/* 슬롯 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총판
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    아이디
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 입금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯 타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 슬롯
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용 중
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔여
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    잔여기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일/만료일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
                      {isFilteredByCustomer ? '해당 고객의 슬롯 데이터가 없습니다.' : '조회된 슬롯 데이터가 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((slot, index) => (
                    <tr key={slot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{filteredData.length - index}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.userGroup}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.customerId}</td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                         {(slot.totalPaymentAmount || 0).toLocaleString()}원
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button
                          onClick={() => handleSlotTypeClick(slot)}
                          disabled={slot.remainingSlots === 0}
                          variant="outline"
                          size="sm"
                          className={`${
                            slot.remainingSlots === 0 
                              ? 'text-gray-400 border-gray-200 cursor-not-allowed' 
                              : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {slot.slotType}
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.slotCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.usedSlots}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        slot.remainingSlots > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {slot.remainingSlots}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {slot.remainingDays > 0 ? `${slot.remainingDays}일` : '만료'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>등록: {slot.registrationDate}</div>
                          <div>만료: {slot.expiryDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(slot.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            onClick={() => handleDetailClick(slot)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-md transition-all duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            내역
                          </Button>
                          <Button
                            onClick={() => handleExtendClick(slot)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 rounded-md transition-all duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            연장
                          </Button>
                          <Button
                            onClick={() => handleStopClick(slot)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 rounded-md transition-all duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            중지
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
