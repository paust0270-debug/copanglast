'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface SettlementItem {
  id: string;
  sequentialNumber: number;
  distributorName: string;
  customerId: string;
  slotAdditionDate: string;
  slotType: string;
  numberOfSlots: number;
  depositorName: string;
  depositAmount: number;
  daysUsed: number;
  memo: string;
  status: '승인대기' | '승인' | '취소';
}

interface Settlement {
  id: number;
  sequential_number: number;
  distributor_name: string;
  total_slots: number;
  total_deposit_amount: number;
  depositor_name: string;
  deposit_date: string;
  request_date: string;
  memo: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SettlementEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const settlementId = searchParams.get('id');

  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [settlementItems, setSettlementItems] = useState<SettlementItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 정산 계산 관련 상태
  const [selectedSlotCount, setSelectedSlotCount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [includeTaxInvoice, setIncludeTaxInvoice] = useState<boolean>(false);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]); // 오늘 날짜를 기본값으로 설정
  const [memo, setMemo] = useState<string>('');
  const [depositorName, setDepositorName] = useState<string>('');

  useEffect(() => {
    if (settlementId) {
      fetchSettlementData();
    } else {
      alert('정산 ID가 필요합니다.');
      setLoading(false);
    }
  }, [settlementId]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      
      // 정산 기본 정보 조회
      const response = await fetch(`/api/settlements/modify?id=${settlementId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '정산 데이터를 불러오는데 실패했습니다.');
      }

      const settlementData = result.data.settlement;
      const itemsData = result.data.items || [];

      setSettlement(settlementData);
      
      // 정산 상세 내역을 슬롯 형태로 변환 (있는 경우만)
      let convertedItems: SettlementItem[] = [];
      if (itemsData.length > 0) {
        convertedItems = itemsData.map((item: any) => ({
          id: item.slot_id.toString(),
          sequentialNumber: item.id,
          distributorName: settlementData.distributor_name,
          customerId: item.customer_id,
          slotAdditionDate: item.created_at.split('T')[0],
          slotType: item.slot_type,
          numberOfSlots: item.slot_count,
          depositorName: item.depositor_name || settlementData.depositor_name || '',
          depositAmount: item.payment_amount || 0,
          daysUsed: item.usage_days || 0,
          memo: item.memo || '',
          status: '승인대기' as const
        }));
      } else {
        // 상세 내역이 없는 경우 정산 데이터로 기본 아이템 생성
        console.log('상세 내역이 없어서 기본 아이템 생성');
        convertedItems = [{
          id: settlementData.id.toString(),
          sequentialNumber: settlementData.id,
          distributorName: settlementData.distributor_name,
          customerId: 'N/A',
          slotAdditionDate: settlementData.created_at.split('T')[0],
          slotType: 'coupang',
          numberOfSlots: settlementData.total_slots,
          depositorName: settlementData.depositor_name || '',
          depositAmount: settlementData.total_deposit_amount,
          daysUsed: 0,
          memo: settlementData.memo || '',
          status: '승인대기' as const
        }];
      }

      setSettlementItems(convertedItems);
      
      // 기존 정산 데이터로 폼 초기화
      setTotalAmount(settlementData.total_deposit_amount || 0);
      setDepositDate(settlementData.deposit_date || new Date().toISOString().split('T')[0]);
      setMemo(settlementData.memo || '');
      setDepositorName(settlementData.depositor_name || '');
      
      // 모든 아이템 선택
      setSelectedItems(convertedItems.map(item => item.id));

    } catch (error) {
      console.error('정산 데이터 로드 에러:', error);
      alert(`정산 데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      router.push('/settlement/history');
    } finally {
      setLoading(false);
    }
  };

  // 선택된 슬롯 수 계산
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
    const totalSlots = selectedItemsData.reduce((sum, item) => sum + item.numberOfSlots, 0);
    setSelectedSlotCount(totalSlots);
  }, [selectedItems, settlementItems]);

  // 선택된 항목들의 입금액 합산 계산
  useEffect(() => {
    const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
    const totalDepositAmount = selectedItemsData.reduce((sum, item) => sum + item.depositAmount, 0);
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
    if (selectedItems.length === settlementItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(settlementItems.map(item => item.id));
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  // 슬롯 유형을 한글로 변환하는 함수
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
        return slotType; // 알 수 없는 유형은 그대로 표시
    }
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
    if (!depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      
      // 선택된 항목들의 데이터 준비
      const selectedItemsData = settlementItems.filter(item => selectedItems.includes(item.id));
      
      // 정산 데이터 생성
      const settlementData = {
        sequential_number: settlement?.sequential_number || 1,
        distributor_name: settlement?.distributor_name || '총판A',
        total_slots: selectedSlotCount,
        total_deposit_amount: finalAmount,
        depositor_name: depositorName,
        deposit_date: depositDate,
        request_date: depositDate,
        memo: memo,
        status: 'completed'
      };

      // 정산 상세 내역 데이터
      const settlementItemsData = selectedItemsData.map(item => ({
        slot_id: parseInt(item.id),
        customer_id: item.customerId,
        customer_name: item.customerId, // customer_name이 없으므로 customer_id 사용
        slot_type: item.slotType,
        slot_count: item.numberOfSlots,
        payment_amount: item.depositAmount,
        usage_days: item.daysUsed,
        memo: item.memo
      }));

      // 정산 수정 API 호출
      const response = await fetch('/api/settlements/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSettlementId: settlementId,
          settlementData: settlementData,
          settlementItems: settlementItemsData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`정산 수정 API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '정산 수정 중 오류가 발생했습니다.');
      }

      alert('정산이 성공적으로 수정되었습니다.');
      router.push('/settlement/history');
      
    } catch (error) {
      console.error('정산 수정 에러:', error);
      alert(`정산 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/settlement/history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">정산 데이터를 불러오는 중...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">정산 수정</h1>
            <div className="text-sm text-gray-500">
              정산 ID: {settlementId}
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
                      checked={selectedItems.length === settlementItems.length && settlementItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">순번</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">총판명</th>
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
                {settlementItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.sequentialNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.distributorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.customerId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{formatDate(item.slotAdditionDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{getSlotTypeKorean(item.slotType)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.numberOfSlots}개</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.depositorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{formatAmount(item.depositAmount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.daysUsed}일</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{item.memo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {settlementItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              정산 상세 내역이 없습니다.
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
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
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
                disabled={saving}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                {saving ? '수정 중...' : '정산 수정'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
