'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface UnsettledItem {
  id: number;
  slot_id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_amount: number;
  usage_days: number;
  memo: string;
  created_at: string;
  distributor_name: string;
}

export default function SettlementRequestPage() {
  const router = useRouter();
  const [unsettledItems, setUnsettledItems] = useState<UnsettledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUnsettledItems();
  }, []);

  const fetchUnsettledItems = async () => {
    try {
      setLoading(true);
      console.log('미정산 내역 데이터 가져오는 중...');
      
      const response = await fetch('/api/settlements/unsettled');
      console.log('미정산 내역 API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('미정산 내역 API 에러 응답:', errorText);
        throw new Error(`미정산 내역 API 요청 실패: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const responseText = await response.text();
        console.error('미정산 내역 JSON 파싱 에러:', parseError);
        console.error('미정산 내역 응답 내용:', responseText);
        throw new Error('서버에서 잘못된 응답을 받았습니다. JSON이 아닌 응답이 반환되었습니다.');
      }

      if (result.success) {
        console.log('미정산 내역 데이터 로드 완료:', result.data?.length || 0, '개');
        setUnsettledItems(result.data || []);
      } else {
        console.error('미정산 내역 API 에러:', result.error);
        setError(result.error || '미정산 내역 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('미정산 내역 데이터 가져오기 에러:', err);
      setError(`서버 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === unsettledItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(unsettledItems.map(item => item.id)));
    }
  };

  const handleCreateSettlement = async () => {
    if (selectedItems.size === 0) {
      alert('정산할 항목을 선택해주세요.');
      return;
    }

    try {
      setProcessing(true);
      
      const selectedItemsData = unsettledItems.filter(item => selectedItems.has(item.id));
      
      const response = await fetch('/api/settlements/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: selectedItemsData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`정산 생성 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('정산이 성공적으로 생성되었습니다.');
        router.push('/settlement/history');
      } else {
        throw new Error(result.error || '정산 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('정산 생성 에러:', error);
      alert(`정산 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getSlotTypeKorean = (slotType: string) => {
    switch (slotType.toLowerCase()) {
      case 'coupang':
        return '쿠팡';
      case 'coupang-vip':
        return '쿠팡VIP';
      case 'naver':
        return '네이버';
      case 'gmarket':
        return '지마켓';
      case 'auction':
        return '옥션';
      case '11st':
        return '11번가';
      case 'lotte':
        return '롯데온';
      case 'ssg':
        return 'SSG';
      case 'wemakeprice':
        return '위메프';
      case 'tmon':
        return '티몬';
      case 'musinsa':
        return '무신사';
      case 'zigzag':
        return '지그재그';
      case 'stylenanda':
        return '스타일난다';
      case 'abcmart':
        return 'ABC마트';
      case 'shinsegae':
        return '신세계';
      case 'hyundai':
        return '현대백화점';
      case 'lotte_department':
        return '롯데백화점';
      case 'emart':
        return '이마트';
      case 'homeplus':
        return '홈플러스';
      case 'costco':
        return '코스트코';
      case 'oliveyoung':
        return '올리브영';
      case 'lalavla':
        return '랄라블라';
      case 'watsons':
        return '왓슨스';
      case 'boots':
        return '부츠';
      case 'innisfree':
        return '이니스프리';
      case 'thefaceshop':
        return '더페이스샵';
      case 'nature_republic':
        return '네이처리퍼블릭';
      default:
        return slotType;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  const getTotalAmount = () => {
    return unsettledItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.payment_amount || 0), 0);
  };

  const getTotalSlots = () => {
    return unsettledItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.slot_count || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">미정산 내역을 불러오는 중...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">미정산 내역</h1>
            <div className="text-sm text-gray-500">
              총 {unsettledItems.length}건의 미정산 내역
            </div>
          </div>
          
          {/* 선택된 항목 요약 */}
          {selectedItems.size > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-blue-800">
                  선택된 항목: {selectedItems.size}건 | 
                  총 슬롯: {getTotalSlots()}개 | 
                  총 금액: <span className="font-bold">{formatAmount(getTotalAmount())}</span>
                </div>
                <button
                  onClick={handleCreateSettlement}
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  {processing ? '정산 생성 중...' : '정산 생성'}
                </button>
              </div>
            </div>
          )}
          
          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === unsettledItems.length && unsettledItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">총판명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">고객ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">고객명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">슬롯유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">슬롯수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">사용일수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">생성일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {unsettledItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-medium">{item.slot_id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-medium">{item.distributor_name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {item.customer_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {getSlotTypeKorean(item.slot_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {item.slot_count}개
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="font-bold text-green-600">
                        {formatAmount(item.payment_amount || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {item.usage_days}일
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                      <span className="max-w-xs truncate block" title={item.memo || ''}>
                        {item.memo || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {unsettledItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">미정산 내역이 없습니다</h3>
              <p className="text-gray-500">정산할 수 있는 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
