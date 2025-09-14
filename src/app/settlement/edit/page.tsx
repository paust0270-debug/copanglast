'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Settlement {
  id: number;
  sequential_number: number;
  category: string;
  distributor_name: string;
  customer_id: string;
  customer_name: string;
  slot_addition_date: string;
  slot_type: string;
  slot_count: number;
  payer_name: string;
  payment_amount: number;
  usage_days: number;
  memo: string;
  status: 'requested' | 'approved' | 'cancelled';
  payment_type: string;
  created_at: string;
  completed_at: string;
  settlement_batch_id: string;
}

export default function SettlementEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [deletingItem, setDeletingItem] = useState<Set<number>>(new Set());
  const [settlement, setSettlement] = useState<any>(null);

  // 정산 폼 상태
  const [formData, setFormData] = useState({
    payer_name: '',
    memo: '',
    payment_amount: 0,
    usage_days: 0
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        const resolvedParams = await params;
        const settlementId = resolvedParams.id;
        
        if (!settlementId) {
          setError('정산 ID가 제공되지 않았습니다.');
          setLoading(false);
          return;
        }

        console.log('정산 데이터 조회 시작:', settlementId);
        
        // 정산 데이터 조회
        const response = await fetch(`/api/settlements/${settlementId}`);
        if (!response.ok) {
          throw new Error(`정산 데이터 조회 실패: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('정산 데이터 조회 결과:', result);
        
        if (result.success && result.data) {
          setSettlement(result.data);
          
          // 합산된 데이터를 정산대기 페이지 형식으로 변환
          const convertedItem = {
            id: result.data.id,
            sequential_number: result.data.sequential_number || 1,
            category: result.data.category,
            distributor_name: result.data.distributor_name,
            customer_id: result.data.customer_id,
            customer_name: result.data.customer_name,
            slot_addition_date: result.data.slot_addition_date,
            slot_type: result.data.slot_type,
            slot_count: result.data.slot_count,
            payer_name: result.data.payer_name,
            payment_amount: result.data.payment_amount,
            usage_days: result.data.usage_days,
            memo: result.data.memo,
            status: 'requested' as 'requested' | 'approved' | 'cancelled',
            payment_type: 'batch',
            created_at: result.data.created_at,
            completed_at: result.data.completed_at,
            settlement_batch_id: result.data.settlement_batch_id
          };
          
          console.log('변환된 정산 데이터:', convertedItem);
          setSettlements([convertedItem]);
          
          // 폼 데이터 초기화
          setFormData({
            payer_name: result.data.payer_name || '',
            memo: result.data.memo || '',
            payment_amount: result.data.payment_amount || 0,
            usage_days: result.data.usage_days || 0
          });
        } else {
          setError(result.error || '정산 데이터를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('정산 데이터 초기화 오류:', err);
        setError(`서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [params]);

  // 정산 수정 처리
  const handleSave = async () => {
    if (!settlement) return;

    try {
      setUpdatingStatus(new Set([settlement.id]));
      
      const updateData = {
        payment_amount: formData.payment_amount,
        usage_days: formData.usage_days,
        memo: formData.memo,
        payer_name: formData.payer_name
      };

      console.log('정산 수정 요청:', updateData);

      const response = await fetch(`/api/settlements/${settlement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('정산 수정 API 에러 응답:', errorText);
        throw new Error(`정산 수정 API 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('정산 수정 결과:', result);

      if (result.success) {
        alert('정산이 성공적으로 수정되었습니다.');
        router.push('/settlement/history');
      } else {
        throw new Error(result.error || '정산 수정 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('정산 수정 오류:', err);
      alert(`정산 수정 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setUpdatingStatus(new Set());
    }
  };

  // 정산 삭제 처리
  const handleDelete = async (settlementId: number) => {
    if (!confirm('정말로 이 정산을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingItem(new Set([settlementId]));
      
      const response = await fetch(`/api/settlements/${settlementId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('정산 삭제 API 에러 응답:', errorText);
        throw new Error(`정산 삭제 API 요청 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('정산 삭제 결과:', result);

      if (result.success) {
        alert('정산이 성공적으로 삭제되었습니다.');
        router.push('/settlement/history');
      } else {
        throw new Error(result.error || '정산 삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('정산 삭제 오류:', err);
      alert(`정산 삭제 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setDeletingItem(new Set());
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

  // 선택된 항목들 계산
  const selectedItems = settlements.filter(item => item.status === 'requested');
  const totalSlotCount = selectedItems.reduce((sum, item) => sum + (item.slot_count || 0), 0);
  const totalPaymentAmount = selectedItems.reduce((sum, item) => sum + (item.payment_amount || 0), 0);
  const totalUsageDays = selectedItems.reduce((sum, item) => sum + (item.usage_days || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">정산 데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
            <button
              onClick={() => router.push('/settlement/history')}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              정산 내역으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">정산 수정</h1>
          <p className="mt-2 text-gray-600">정산 내역을 수정할 수 있습니다.</p>
        </div>

        {/* 정산 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">정산 정보 수정</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금자명
              </label>
              <input
                type="text"
                value={formData.payer_name}
                onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="입금자명을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입금액
              </label>
              <input
                type="number"
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="입금액을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용일수
              </label>
              <input
                type="number"
                value={formData.usage_days}
                onChange={(e) => setFormData({ ...formData, usage_days: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="사용일수를 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="메모를 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 정산 계산 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">정산 계산</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600 mb-1">총 슬롯 수</div>
              <div className="text-2xl font-bold text-blue-900">{totalSlotCount.toLocaleString()}개</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600 mb-1">총 입금액</div>
              <div className="text-2xl font-bold text-green-900">{formatAmount(totalPaymentAmount)}</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600 mb-1">총 사용일수</div>
              <div className="text-2xl font-bold text-purple-900">{totalUsageDays}일</div>
            </div>
          </div>
        </div>

        {/* 정산 데이터 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">정산 데이터</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총판명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯추가일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금자명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용일수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.sequential_number || item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.category === '연장' ? 'bg-green-100 text-green-800' :
                        item.category === '입금' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.distributor_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.customer_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.slot_addition_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.slot_type === 'mixed' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.slot_type === 'mixed' ? '혼합' : item.slot_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.slot_count?.toLocaleString()}개
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.payer_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-bold text-green-600">
                        {formatAmount(item.payment_amount || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.usage_days}일
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="max-w-xs truncate block" title={item.memo || ''}>
                        {item.memo || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingItem.has(item.id)}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                      >
                        {deletingItem.has(item.id) ? '삭제 중...' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 버튼 섹션 */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={() => router.push('/settlement/history')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={updatingStatus.has(settlement?.id || 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            {updatingStatus.has(settlement?.id || 0) ? '수정 중...' : '정산수정'}
          </button>
        </div>
      </div>
    </div>
  );
}