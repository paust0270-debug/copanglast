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
  pausedSlots?: number; // 일시 중지된 슬롯 수
  totalPaymentAmount: number; // 총 입금액
  remainingDays: number; // 잔여일수 (기존 호환성)
  remainingHours: number; // 잔여시간
  remainingMinutes: number; // 잔여분
  remainingTimeString: string; // 잔여기간 문자열
  registrationDate: string; // 등록일
  expiryDate: string; // 만료일
  addDate: string;
  status: 'pending' | 'active' | 'completed' | 'inactive' | 'expired' | 'paused';
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
  
  // 연장 모달 상태
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [extendForm, setExtendForm] = useState({
    paymentType: 'deposit',
    payerName: '',
    paymentAmount: '',
    paymentDate: '',
    usageDays: ''
  });

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
      
      // API 엔드포인트 호출 (원래대로)
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
      
    } catch (error) {
      console.error('슬롯 데이터 조회 오류:', error);
      setError('슬롯 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotData();
    
    // 1분마다 자동 새로고침 (실시간 잔여기간 업데이트)
    const interval = setInterval(() => {
      fetchSlotData();
    }, 60000); // 60초 = 1분
    
    return () => clearInterval(interval);
  }, []);

  // 필터링 (깜빡임 방지를 위해 즉시 적용)
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
    console.log('🔍 슬롯타입 버튼 클릭:', {
      slotType: slot.slotType,
      remainingSlots: slot.remainingSlots,
      customerId: slot.customerId,
      customerName: slot.customerName
    });
    
    if (slot.remainingSlots > 0) {
      // URL에서 전달받은 파라미터들 사용
      const actualCustomerId = searchParams.get('customerId');
      const username = searchParams.get('username');
      
      const params = new URLSearchParams({
        customerId: actualCustomerId || slot.customerId, // UUID 우선 사용
        username: username || slot.customerId, // username 추가
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
      
      console.log('🚀 슬롯타입 클릭 - 이동할 URL:', targetUrl);
      console.log('📋 전달되는 파라미터:', {
        customerId: actualCustomerId || slot.customerId,
        username: username || slot.customerId,
        slotCount: slot.remainingSlots,
        customerName: slot.customerName,
        slotType: slot.slotType
      });
      
      router.push(targetUrl);
    } else {
      console.log('❌ 사용 가능한 슬롯이 없어서 이동할 수 없습니다.');
      alert('사용 가능한 슬롯이 없습니다.');
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
    setSelectedSlot(slot);
    setExtendForm({
      paymentType: 'deposit',
      payerName: '',
      paymentAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      usageDays: ''
    });
    setShowExtendModal(true);
  };

  // 연장 처리 함수
  const handleExtendSubmit = async () => {
    if (!selectedSlot) return;
    
    // 필수 필드 검증
    if (!extendForm.usageDays || parseInt(extendForm.usageDays) <= 0) {
      alert('사용일수를 올바르게 입력해주세요.');
      return;
    }
    
    try {
      console.log('슬롯 연장 요청:', {
        slotId: selectedSlot.id,
        customerName: selectedSlot.customerName,
        currentExpiry: selectedSlot.expiryDate,
        extendDays: extendForm.usageDays
      });

      const response = await fetch('/api/slots/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          paymentType: extendForm.paymentType,
          payerName: extendForm.payerName,
          paymentAmount: parseInt(extendForm.paymentAmount) || 0,
          paymentDate: extendForm.paymentDate,
          usageDays: parseInt(extendForm.usageDays)
        }),
      });

      const result = await response.json();

      if (result.success) {
        const extendedDays = parseInt(extendForm.usageDays);
        alert(
          `슬롯이 성공적으로 연장되었습니다!\n\n` +
          `고객: ${selectedSlot.customerName}\n` +
          `슬롯 타입: ${selectedSlot.slotType}\n` +
          `연장 일수: ${extendedDays}일\n` +
          `이전 만료일: ${new Date(result.data.previousExpiryDate).toLocaleDateString('ko-KR')}\n` +
          `새 만료일: ${new Date(result.data.newExpiryDate).toLocaleDateString('ko-KR')}\n\n` +
          `잔여기간이 ${extendedDays}일 연장되었습니다.`
        );
        
        setShowExtendModal(false);
        
        // 데이터 새로고침 (연장된 잔여기간 반영)
        await fetchSlotData();
        
        console.log('연장 완료 후 데이터 새로고침 완료');
      } else {
        alert(`연장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('연장 처리 오류:', error);
      alert('연장 처리 중 오류가 발생했습니다.');
    }
  };

  // 연장 모달 닫기
  const handleExtendCancel = () => {
    setShowExtendModal(false);
    setSelectedSlot(null);
    setExtendForm({
      paymentType: 'deposit',
      payerName: '',
      paymentAmount: '',
      paymentDate: '',
      usageDays: ''
    });
  };

  // 슬롯 상태 변경 처리 (중지/재개)
  const handleSlotStatusChange = async (slot: SlotData, newStatus: string) => {
    const action = newStatus === 'inactive' ? '중지' : '재개';
    const actionText = newStatus === 'inactive' ? '중지하시겠습니까' : '재개하시겠습니까';
    
    try {
      console.log(`${action} 버튼 클릭:`, slot);
      
      // 확인 대화상자
      const confirmed = window.confirm(
        `정말로 "${slot.slotType}" 슬롯을 ${actionText}?\n\n` +
        `고객: ${slot.customerName}\n` +
        `슬롯 개수: ${slot.slotCount}개\n` +
        `잔여 슬롯: ${slot.remainingSlots}개\n\n` +
        `${newStatus === 'inactive' ? '중지된 슬롯은 사용가능한 슬롯 수에서 차감됩니다.' : '재개된 슬롯은 사용가능한 슬롯 수에 추가됩니다.'}`
      );
      
      if (!confirmed) {
        console.log(`${action} 취소됨`);
        return;
      }

      // 슬롯 상태 변경 (새로운 API 사용)
      const response = await fetch('/api/slots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: slot.id,
          status: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ 슬롯 ${action} 성공:`, result);
        
        // 성공 알림
        alert(
          `슬롯이 성공적으로 ${action}되었습니다!\n\n` +
          `고객: ${slot.customerName}\n` +
          `슬롯 유형: ${slot.slotType}\n` +
          `${action}된 슬롯: ${slot.slotCount}개\n\n` +
          `사용가능한 슬롯 수가 자동으로 업데이트됩니다.`
        );

        // 페이지 새로고침하여 최신 데이터 표시
        window.location.reload();
      } else {
        console.error(`❌ 슬롯 ${action} 실패:`, result.error);
        alert(`슬롯 ${action}에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ 슬롯 ${action} 중 오류 발생:`, error);
      alert(`슬롯 ${action} 중 오류가 발생했습니다. 다시 시도해주세요.`);
    }
  };

  // 중지 버튼 클릭 처리 (기존 함수명 유지)
  const handleStopClick = (slot: SlotData) => {
    handleSlotStatusChange(slot, 'inactive');
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
      case 'paused':
        return <Badge className="bg-orange-100 text-orange-800">중지</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  // 로딩 중이거나 고객별 필터링이 적용되는 중이면 로딩 화면 표시
  if (loading || (isFilteredByCustomer && filteredCustomerInfo && slotData.length > 0 && filteredData.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-600 text-lg">
              {isFilteredByCustomer ? `${filteredCustomerInfo?.name || '고객'}님의 데이터를 불러오는 중...` : '데이터를 불러오는 중...'}
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
            <h3 className="text-lg font-semibold text-gray-900">일시 중지</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {filteredData.reduce((sum, slot) => sum + (slot.pausedSlots || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">만료됨</h3>
            <p className="text-3xl font-bold text-red-600">
              {filteredData.filter(slot => slot.status === 'expired').reduce((sum, slot) => sum + slot.slotCount, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {filteredData.filter(slot => slot.remainingDays === 0 && slot.remainingHours > 0).length}개 시간 단위
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
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            slot.remainingDays > 7 ? 'text-green-600' : 
                            slot.remainingDays > 3 ? 'text-yellow-600' : 
                            slot.remainingDays > 0 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {slot.remainingTimeString}
                          </span>
                          {slot.remainingDays > 0 && slot.remainingDays <= 3 && (
                            <span className="text-xs text-red-500 mt-1">⚠️ 곧 만료</span>
                          )}
                          {slot.remainingDays === 0 && slot.remainingHours > 0 && (
                            <span className="text-xs text-orange-500 mt-1">⏰ 시간 단위 남음</span>
                          )}
                          {slot.remainingDays === 0 && slot.remainingHours === 0 && slot.remainingMinutes > 0 && (
                            <span className="text-xs text-red-500 mt-1">🔥 분 단위 남음</span>
                          )}
                        </div>
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
                            onClick={() => handleSlotStatusChange(slot, slot.status === 'inactive' ? 'active' : 'inactive')}
                            variant="ghost"
                            size="sm"
                            disabled={slot.status === 'expired'}
                            className={`h-8 px-3 text-xs font-medium rounded-md transition-all duration-200 ${
                              slot.status === 'expired'
                                ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                                : slot.status === 'inactive'
                                ? 'text-white bg-green-600 hover:bg-green-700 border border-green-600 hover:border-green-700'
                                : 'text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700'
                            }`}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {slot.status === 'inactive' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                            {slot.status === 'inactive' ? '재개' : slot.status === 'expired' ? '만료됨' : '중지'}
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
      
      {/* 연장 모달 */}
      {showExtendModal && selectedSlot && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">슬롯 연장</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
                  <p className="text-sm text-blue-800 font-medium">
                    현재 잔여기간: <span className="text-blue-900">{selectedSlot.remainingDays}일</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    만료일: {new Date(selectedSlot.expiryDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExtendCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 슬롯 정보 */}
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div>아이디: {selectedSlot.customerId}</div>
                  <div>고객명: {selectedSlot.customerName}</div>
                  <div>슬롯 타입: {selectedSlot.slotType}</div>
                  <div>슬롯 수: {selectedSlot.slotCount}개</div>
                  <div>현재 잔여기간: {selectedSlot.remainingTimeString}</div>
                </div>
              </div>
              
              {/* 입금구분 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금구분</label>
                <select
                  value={extendForm.paymentType}
                  onChange={(e) => setExtendForm({...extendForm, paymentType: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="deposit">입금</option>
                  <option value="coupon">쿠폰</option>
                </select>
              </div>
              
              {/* 입금자명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금자명</label>
                <input
                  type="text"
                  value={extendForm.payerName}
                  onChange={(e) => setExtendForm({...extendForm, payerName: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="입금자명을 입력하세요"
                />
              </div>
              
              {/* 입금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금액</label>
                <div className="relative">
                  <input
                    type="number"
                    value={extendForm.paymentAmount}
                    onChange={(e) => setExtendForm({...extendForm, paymentAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">원</span>
                </div>
              </div>
              
              {/* 입금일자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금일자</label>
                <input
                  type="date"
                  value={extendForm.paymentDate}
                  onChange={(e) => setExtendForm({...extendForm, paymentDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 사용일수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사용일수 (연장할 일수)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={extendForm.usageDays}
                    onChange={(e) => setExtendForm({...extendForm, usageDays: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="연장할 일수를 입력하세요"
                    min="1"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500 text-sm">일</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  입력한 일수만큼 현재 잔여기간에 추가됩니다
                </p>
                {extendForm.usageDays && parseInt(extendForm.usageDays) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-2">
                    <p className="text-sm text-green-800 font-medium">
                      연장 후 예상 잔여기간: <span className="text-green-900">
                        {selectedSlot.remainingDays + parseInt(extendForm.usageDays)}일
                      </span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      새 만료일: {new Date(new Date(selectedSlot.expiryDate).getTime() + parseInt(extendForm.usageDays) * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
              
            </div>
            
            {/* 버튼 */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleExtendCancel}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleExtendSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                연장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
