'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface SettlementItem {
  id: string;
  sequential_number: number;
  category: string; // 구분 필드 추가
  distributor_name: string;
  customer_id: string;
  slot_addition_date: string;
  slot_type: string;
  slot_count: number; // number_of_slots → slot_count로 통합
  payer_name: string; // depositor_name → payer_name으로 통합
  payment_amount: number; // deposit_amount → payment_amount로 통합
  usage_days: number; // days_used → usage_days로 통합
  memo: string;
  status: 'requested' | 'approved' | 'cancelled';
}

export default function SettlementEditPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const settlementId = searchParams.get('id');

  const [settlementItems, setSettlementItems] = useState<SettlementItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [distributorFilter, setDistributorFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 정산 계산 관련 상태
  const [selectedSlotCount, setSelectedSlotCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [includeTaxInvoice, setIncludeTaxInvoice] = useState<boolean>(false);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]); // 오늘 날짜를 기본값으로 설정
  const [memo, setMemo] = useState<string>('');
  const [payer_name, setPayerName] = useState<string>(''); // depositor_name → payer_name으로 통합

  useEffect(() => {
    // 정산요청 데이터 로드
    fetchSettlementRequests();
  }, []);

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchSettlementRequests();
  }, [statusFilter, distributorFilter]);

  // 페이지 로드 시 해당 정산 데이터 로드 (실제로는 API 호출)
  useEffect(() => {
    if (settlementId) {
      // TODO: 실제 API 호출로 정산 데이터 로드
      console.log('Loading settlement data for ID:', settlementId);
      
      // 예시: 기존 데이터로 폼 필드 채우기
      setPayerName('김철수');
      setTotalAmount(125000);
      setDepositDate('2024-01-15');
      setMemo('정산 수정 요청');
      setIncludeTaxInvoice(true);
      
      // 예시: 해당 정산에 포함된 항목들 선택 상태로 설정
      setSelectedItems(['1', '2']);
    }
  }, [settlementId]);

  // 정산요청 데이터 가져오기 (정산수정용)
  const fetchSettlementRequests = async () => {
    try {
      setLoading(true);
      
      if (settlementId) {
        // 정산 수정용: 특정 settlement_history ID와 연결된 개별 항목들만 조회
        const response = await fetch(`/api/settlement-requests/edit/${settlementId}`);
        const result = await response.json();

        if (result.success) {
          console.log('정산 수정용 데이터 로드 성공:', result.data?.length || 0, '개');
          const items = (result.data || []).map((item: any, index: number) => ({
            ...item,
            sequential_number: item.sequential_number || (index + 1), // 순번 추가
            slot_addition_date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0], // 슬롯추가일을 created_at에서 가져오기
            category: item.payment_type === 'extension' ? '연장' : 
                     item.payment_type === 'deposit' ? '입금' : 
                     item.payment_type || '일반' // payment_type을 한글 구분으로 변환
          }));
          setSettlementItems(items);
          
          // 로드된 모든 항목을 자동으로 선택 상태로 설정
          const itemIds = items.map((item: SettlementItem) => item.id);
          setSelectedItems(itemIds);
          console.log('자동 선택된 항목 IDs:', itemIds);
          
          // 기존 정산 정보가 있으면 폼 필드에 설정
          if (result.settlementInfo) {
            const info = result.settlementInfo;
            setPayerName(info.payer_name || '');
            setDepositDate(info.deposit_date || new Date().toISOString().split('T')[0]);
            setMemo(info.memo || '');
            setIncludeTaxInvoice(info.include_tax_invoice || false);
            console.log('기존 정산 정보 설정:', info);
          }
        } else {
          console.error('정산 수정용 데이터 로드 실패:', result.error);
          console.log('임시 테스트 데이터 사용');
          
          // API 데이터가 없을 때 임시 테스트 데이터 사용
          const mockData: SettlementItem[] = [
            {
              id: '1',
              sequential_number: 1,
              category: '일반',
              distributor_name: '총판A',
              customer_id: 'CUST001',
              slot_addition_date: '2024-01-15',
              slot_type: 'coupang',
              slot_count: 5,
              payer_name: '김철수',
              payment_amount: 50000,
              usage_days: 30,
              memo: '정상 결제',
              status: 'requested'
            },
            {
              id: '2',
              sequential_number: 2,
              category: '연장',
              distributor_name: '본사',
              customer_id: 'CUST002',
              slot_addition_date: '2024-01-20',
              slot_type: 'coupang-vip',
              slot_count: 3,
              payer_name: '이영희',
              payment_amount: 75000,
              usage_days: 60,
              memo: 'VIP 슬롯 연장',
              status: 'approved'
            }
          ];
          
          setSettlementItems(mockData);
          setSelectedItems(mockData.map(item => item.id));
          setPayerName('홍길동');
          setMemo('테스트 정산 수정');
          console.log('임시 데이터로 총입금액 테스트:', mockData.reduce((sum, item) => sum + item.payment_amount, 0));
        }
      } else {
        // 정산 ID가 없으면 빈 데이터
        setSettlementItems([]);
      }
    } catch (err) {
      console.error('정산요청 데이터 로드 오류:', err);
      console.log('에러 발생으로 임시 테스트 데이터 사용');
      
      // 에러 시에도 테스트할 수 있도록 임시 데이터 제공
      const mockData: SettlementItem[] = [
        {
          id: '1',
          sequential_number: 1,
          category: '일반',
          distributor_name: '총판A',
          customer_id: 'CUST001',
          slot_addition_date: '2024-01-15',
          slot_type: 'coupang',
          slot_count: 5,
          payer_name: '김철수',
          payment_amount: 50000,
          usage_days: 30,
          memo: '정상 결제',
          status: 'requested'
        }
      ];
      
      setSettlementItems(mockData);
      setSelectedItems(mockData.map(item => item.id));
      setPayerName('홍길동');
      setMemo('에러 시 테스트 데이터');
    } finally {
      setLoading(false);
    }
  };

  // 슬롯 타입을 한글로 변환하는 함수
  const getSlotTypeKorean = (slot_type: string) => {
    const typeMap: { [key: string]: string } = {
      'coupang': '쿠팡',
      'coupang-vip': '쿠팡 VIP',
      'coupang-app': '쿠팡 앱',
      'naver-shopping': '네이버 쇼핑',
      'place': '플레이스',
      'today-house': '오늘의집',
      'aliexpress': '알리익스프레스'
    };
    return typeMap[slot_type] || slot_type;
  };

  // 선택된 슬롯 수 계산 (실제 슬롯수의 총합)
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
    const totalSlots = selectedItemsData.reduce((sum, item) => sum + item.slot_count, 0);
    setSelectedSlotCount(totalSlots);
  }, [selectedItems, settlementItems]);

  // 선택된 항목들의 입금액 합산 계산
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
    const totalDepositAmount = selectedItemsData.reduce((sum, item) => sum + item.payment_amount, 0);
    setTotalAmount(totalDepositAmount);
  }, [selectedItems, settlementItems]);

  // 세액 계산 (총금액 + 10%)
  useEffect(() => {
    setTaxAmount(totalAmount * 0.1);
  }, [totalAmount]);

  // 최종 입금액 계산
  useEffect(() => {
    if (includeTaxInvoice) {
      setFinalAmount(totalAmount + taxAmount);
    } else {
      setFinalAmount(totalAmount);
    }
  }, [includeTaxInvoice, totalAmount, taxAmount]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = settlementItems;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      alert('정산할 항목을 선택해주세요.');
      return;
    }
    if (totalAmount === 0) {
      alert('총금액을 입력해주세요.');
      return;
    }
    if (!depositDate) {
      alert('입금일을 선택해주세요.');
      return;
    }
    if (!payer_name.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    try {
      // 선택된 항목들의 데이터 준비
      const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
      
      // 정산 수정 데이터 생성
      const settlementData = {
        payerName: payer_name,
        depositDate,
        memo,
        includeTaxInvoice,
        totalAmount: finalAmount,
        baseAmount: totalAmount,
        taxAmount: taxAmount
      };

      console.log('정산 수정 데이터:', {
        id: settlementId,
        selectedItems: selectedItems,
        settlementData
      });

      // 정산대기 페이지와 동일한 정산 요청 API 호출 (수정 모드)
      const response = await fetch('/api/settlement-requests/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotIds: selectedItems,
          settlementData: settlementData,
          isEditMode: true, // 수정 모드 플래그 추가
          settlementHistoryId: settlementId // 수정할 settlement_history ID
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('정산 수정 API 에러 응답:', errorText);
        throw new Error(`정산 수정 API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('정산 수정 처리 결과:', result);

      if (!result.success) {
        throw new Error(result.error || '정산 수정 처리 중 오류가 발생했습니다.');
      }

      alert('정산이 성공적으로 수정되었습니다.');
      // 수정 후 정산내역 페이지로 이동하며 강제 새로고침
      window.location.href = '/settlement/history';
    } catch (error) {
      console.error('정산수정 처리 에러:', error);
      alert(`정산수정 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleCancel = () => {
    router.push('/settlement');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
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
            <h1 className="text-2xl font-bold">정산수정</h1>
            {settlementId && (
              <p className="text-sm text-blue-600">
                정산 ID: {settlementId}
              </p>
            )}
          </div>
          
          {/* 필터 */}
          <div className="mb-6 flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="">전체</option>
                <option value="requested">정산요청</option>
                <option value="approved">승인</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대상총판</label>
              <select
                value={distributorFilter}
                onChange={(e) => setDistributorFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="">전체</option>
                <option value="총판선택">총판선택</option>
                <option value="본사">본사</option>
              </select>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">순번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">소속총판</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">아이디</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">슬롯추가일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">슬롯유형</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">슬롯수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">입금자명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">입금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">사용일수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">메모</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.sequential_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.category === '연장' ? 'bg-orange-100 text-orange-800' :
                        item.category === '입금' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.category || '일반'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.distributor_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.customer_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{formatDate(item.slot_addition_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.slot_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.slot_count}개</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.payer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{formatAmount(item.payment_amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.usage_days}일</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.memo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(item.status)}`}>
                        {item.status === 'requested' ? '정산요청' : 
                         item.status === 'approved' ? '승인' : 
                         item.status === 'cancelled' ? '취소' : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              정산 요청 내역이 없습니다.
            </div>
          )}

          {/* 정산 계산 섹션 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">정산 계산</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">총금액</label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">세액 (10%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={taxAmount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금액</label>
                <div className="relative">
                  <input
                    type="number"
                    value={finalAmount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">세금계산서</label>
                <div className="flex items-center h-10">
                  <input
                    type="checkbox"
                    id="taxInvoice"
                    checked={includeTaxInvoice}
                    onChange={(e) => setIncludeTaxInvoice(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="taxInvoice" className="ml-2 text-sm font-medium text-gray-700">
                    포함
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">총 슬롯수</label>
                <div className="relative">
                  <input
                    type="number"
                    value={selectedSlotCount}
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-8 bg-gray-100"
                    readOnly
                  />
                  <span className="absolute right-3 top-2 text-gray-500">개</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">입금자명</label>
                <input
                  type="text"
                  value={payer_name}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="입금자명을 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금일</label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="메모를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
              >
                정산 수정
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}