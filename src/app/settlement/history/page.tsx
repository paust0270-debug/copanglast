'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Settlement {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string;
  payer_name: string;
  payment_amount: number;
  payment_date: string;
  usage_days: number;
  memo: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SettlementHistoryPage() {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [deletingItem, setDeletingItem] = useState<Set<number>>(new Set());
  
  // 매출 통계 상태
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    thisMonth: 0,
    lastMonth: 0,
    twoMonthsAgo: 0,
    thisWeek: 0,
    lastWeek: 0,
    twoWeeksAgo: 0
  });
  
  // 총판 선택 상태
  const [selectedDistributor, setSelectedDistributor] = useState<string>('all');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      console.log('정산 내역 데이터 가져오는 중...');
      
      const response = await fetch('/api/settlements');
      console.log('정산 내역 API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('정산 내역 API 에러 응답:', errorText);
        throw new Error(`정산 내역 API 요청 실패: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('정산 내역 JSON 파싱 에러:', parseError);
        console.error('정산 내역 응답 내용:', responseText);
        throw new Error('서버에서 잘못된 응답을 받았습니다. JSON이 아닌 응답이 반환되었습니다.');
      }

      if (result.success) {
        console.log('정산 내역 데이터 로드 완료:', result.data?.length || 0, '개');
        const settlementsData = result.data || [];
        setSettlements(settlementsData);
        calculateSalesStats(settlementsData);
      } else {
        console.error('정산 내역 API 에러:', result.error);
        setError(result.error || '정산 내역 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('정산 내역 데이터 가져오기 에러:', err);
      setError(`서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 상태 업데이트 함수
  const handleStatusChange = async (settlementId: number, newStatus: string) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(settlementId));
      
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`상태 업데이트 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 로컬 상태 업데이트
        setSettlements(prev => 
          prev.map(item => 
            item.id === settlementId 
              ? { ...item, status: newStatus }
              : item
          )
        );
        alert('상태가 성공적으로 업데이트되었습니다.');
      } else {
        throw new Error(result.error || '상태 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 업데이트 에러:', error);
      alert(`상태 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(settlementId);
        return newSet;
      });
    }
  };

  // 삭제 함수
  const handleDelete = async (settlementId: number) => {
    if (!confirm('정말로 이 정산 내역을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingItem(prev => new Set(prev).add(settlementId));
      
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`삭제 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // 로컬 상태에서 제거
        setSettlements(prev => prev.filter(item => item.id !== settlementId));
        alert('정산 내역이 성공적으로 삭제되었습니다.');
      } else {
        throw new Error(result.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 에러:', error);
      alert(`삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setDeletingItem(prev => {
        const newSet = new Set(prev);
        newSet.delete(settlementId);
        return newSet;
      });
    }
  };

  // 상세 내역 보기 함수
  const handleViewDetails = (settlement: Settlement) => {
    alert(`정산 상세 내역\n\nID: ${settlement.id}\n고객명: ${settlement.customer_name || settlement.customer_id}\n슬롯타입: ${settlement.slot_type}\n슬롯수: ${settlement.slot_count}개\n입금액: ${formatAmount(settlement.payment_amount)}\n입금자명: ${settlement.payer_name}\n입금일: ${formatDate(settlement.payment_date)}\n사용일수: ${settlement.usage_days}일\n메모: ${settlement.memo || '-'}\n상태: ${settlement.status}`);
  };

  // 수정 함수
  const handleEdit = (settlement: Settlement) => {
    // 정산 수정 페이지로 이동
    router.push(`/settlement/edit?id=${settlement.id}`);
  };

  // 상태 배지 색상 함수
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case '승인대기':
        return 'bg-yellow-100 text-yellow-800';
      case '승인':
      case '구동중':
      case 'active':
        return 'bg-green-100 text-green-800';
      case '취소':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  // 고객 목록 가져오기
  const getCustomerList = () => {
    const customers = new Set(settlements.map(item => item.customer_name || item.customer_id));
    return Array.from(customers).sort();
  };

  // 정산 요청 페이지로 이동
  const handleSettlementRequest = () => {
    router.push('/settlement/unsettled');
  };

  // 필터링된 정산 내역
  const filteredSettlements = selectedDistributor === 'all' 
    ? settlements 
    : settlements.filter(item => (item.customer_name || item.customer_id) === selectedDistributor);

  // 매출 통계 계산 함수
  const calculateSalesStats = (settlements: Settlement[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    // 이번주 시작일 (월요일)
    const thisWeekStart = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisWeekStart.setDate(currentDate - daysToMonday);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    // 지난주 시작일
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    // 2주전 시작일
    const twoWeeksAgoStart = new Date(thisWeekStart);
    twoWeeksAgoStart.setDate(thisWeekStart.getDate() - 14);
    
    // 이번달 시작일
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    
    // 지난달 시작일
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    
    // 2달전 시작일
    const twoMonthsAgoStart = new Date(currentYear, currentMonth - 2, 1);
    
    let totalSales = 0;
    let thisMonthSales = 0;
    let lastMonthSales = 0;
    let twoMonthsAgoSales = 0;
    let thisWeekSales = 0;
    let lastWeekSales = 0;
    let twoWeeksAgoSales = 0;
    
    settlements.forEach(settlement => {
      const depositDate = new Date(settlement.payment_date);
      const amount = settlement.payment_amount || 0;
      
      // 총 매출
      totalSales += amount;
      
      // 이번주 매출
      if (depositDate >= thisWeekStart) {
        thisWeekSales += amount;
      }
      
      // 지난주 매출
      if (depositDate >= lastWeekStart && depositDate < thisWeekStart) {
        lastWeekSales += amount;
      }
      
      // 2주전 매출
      if (depositDate >= twoWeeksAgoStart && depositDate < lastWeekStart) {
        twoWeeksAgoSales += amount;
      }
      
      // 이번달 매출
      if (depositDate >= thisMonthStart) {
        thisMonthSales += amount;
      }
      
      // 지난달 매출
      if (depositDate >= lastMonthStart && depositDate < thisMonthStart) {
        lastMonthSales += amount;
      }
      
      // 2달전 매출
      if (depositDate >= twoMonthsAgoStart && depositDate < lastMonthStart) {
        twoMonthsAgoSales += amount;
      }
    });
    
    setSalesStats({
      totalSales,
      thisMonth: thisMonthSales,
      lastMonth: lastMonthSales,
      twoMonthsAgo: twoMonthsAgoSales,
      thisWeek: thisWeekSales,
      lastWeek: lastWeekSales,
      twoWeeksAgo: twoWeeksAgoSales
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">정산 내역을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">정산 내역</h1>
            <div className="text-sm text-gray-500">
              총 {filteredSettlements.length}건의 정산 내역
            </div>
          </div>
          
          {/* 매출 통계 섹션 */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">매출 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {/* 총 매출 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">총 매출</div>
                <div className="text-lg font-bold text-green-600">{formatAmount(salesStats.totalSales)}</div>
              </div>
              
              {/* 이번달 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">이번달</div>
                <div className="text-lg font-bold text-blue-600">{formatAmount(salesStats.thisMonth)}</div>
              </div>
              
              {/* 지난달 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">지난달</div>
                <div className="text-lg font-bold text-purple-600">{formatAmount(salesStats.lastMonth)}</div>
              </div>
              
              {/* 2달전 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">2달전</div>
                <div className="text-lg font-bold text-indigo-600">{formatAmount(salesStats.twoMonthsAgo)}</div>
              </div>
              
              {/* 이번주 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">이번주</div>
                <div className="text-lg font-bold text-orange-600">{formatAmount(salesStats.thisWeek)}</div>
              </div>
              
              {/* 지난주 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">지난주</div>
                <div className="text-lg font-bold text-red-600">{formatAmount(salesStats.lastWeek)}</div>
              </div>
              
              {/* 2주전 */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">2주전</div>
                <div className="text-lg font-bold text-pink-600">{formatAmount(salesStats.twoWeeksAgo)}</div>
              </div>
            </div>
          </div>
          
          {/* 고객 선택 및 정산 요청 섹션 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">고객 선택:</label>
                <select
                  value={selectedDistributor}
                  onChange={(e) => setSelectedDistributor(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체 고객</option>
                  {getCustomerList().map((customer) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSettlementRequest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 shadow-sm"
              >
                정산 요청
              </button>
            </div>
          </div>
          
          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">고객명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">슬롯타입</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">슬롯수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">입금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">입금자명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">입금일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">사용일수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">메모</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSettlements.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-medium">{item.id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-medium">{item.customer_name || item.customer_id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.slot_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.slot_count?.toLocaleString()}개
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-bold text-green-600">
                        {formatAmount(item.payment_amount || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {item.payer_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {formatDate(item.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.usage_days}일
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="max-w-xs truncate block" title={item.memo || ''}>
                        {item.memo || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <select
                        value={item.status || '승인대기'}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={updatingStatus.has(item.id)}
                        className={`text-xs px-2 py-1 rounded border ${
                          updatingStatus.has(item.id) 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="승인대기">승인대기</option>
                        <option value="승인">승인</option>
                        <option value="취소">취소</option>
                      </select>
                      {updatingStatus.has(item.id) && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="상세 내역 보기"
                        >
                          내역
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          title="수정"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingItem.has(item.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            deletingItem.has(item.id)
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title="삭제"
                        >
                          {deletingItem.has(item.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          ) : (
                            '삭제'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSettlements.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">정산 내역이 없습니다</h3>
              <p className="text-gray-500">
                {selectedDistributor === 'all' 
                  ? '아직 완료된 정산 내역이 없습니다.' 
                  : `선택한 총판(${selectedDistributor})의 정산 내역이 없습니다.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

