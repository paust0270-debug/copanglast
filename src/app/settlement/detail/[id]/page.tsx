'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface SettlementDetail {
  id: string;
  status: '승인대기' | '승인' | '취소';
  targetDistributor: string;
  refundStatus: boolean;
  processDate: string;
  totalSlots: number;
  totalAmount: number;
  taxInvoice: boolean;
  depositorName: string;
  depositAmount: number;
  memo: string;
  targetSlots: TargetSlot[];
}

interface TargetSlot {
  id: string;
  sequentialNumber: number;
  distributor: string;
  customerId: string;
  slotAdditionDate: string;
  slotType: string;
  slotCount: number;
  depositInfo: string;
  daysUsed: string;
  status: string;
  memo: string;
}

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [settlementDetail, setSettlementDetail] = useState<SettlementDetail | null>(null);

  useEffect(() => {
    // 임시 데이터 로드 (실제로는 API에서 가져와야 함)
    setSettlementDetail({
      id: params.id as string,
      status: '승인대기',
      targetDistributor: '총판선택',
      refundStatus: false,
      processDate: '2024-01-25',
      totalSlots: 8,
      totalAmount: 125000,
      taxInvoice: false,
      depositorName: '김철수',
      depositAmount: 125000,
      memo: '정상 결제',
      targetSlots: [
        {
          id: '1',
          sequentialNumber: 1,
          distributor: '총판A',
          customerId: 'CUST001',
          slotAdditionDate: '2024-01-15',
          slotType: '기본슬롯',
          slotCount: 5,
          depositInfo: '50,000원',
          daysUsed: '30일',
          status: '작동중',
          memo: '정상 결제'
        },
        {
          id: '2',
          sequentialNumber: 2,
          distributor: '본사',
          customerId: 'CUST002',
          slotAdditionDate: '2024-01-20',
          slotType: '프리미엄슬롯',
          slotCount: 3,
          depositInfo: '75,000원',
          daysUsed: '25일',
          status: '작동중',
          memo: '정상 결제'
        }
      ]
    });
  }, [params.id]);

  const handleStatusChange = (status: string) => {
    if (settlementDetail) {
      setSettlementDetail({ ...settlementDetail, status: status as any });
    }
  };

  const handleDistributorChange = (distributor: string) => {
    if (settlementDetail) {
      setSettlementDetail({ ...settlementDetail, targetDistributor: distributor });
    }
  };

  const handleRefundStatusChange = (checked: boolean) => {
    if (settlementDetail) {
      setSettlementDetail({ ...settlementDetail, refundStatus: checked });
    }
  };

  const handleTaxInvoiceChange = (checked: boolean) => {
    if (settlementDetail) {
      setSettlementDetail({ ...settlementDetail, taxInvoice: checked });
    }
  };

  if (!settlementDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  const taxAmount = settlementDetail.taxInvoice ? Math.round(settlementDetail.totalAmount * 0.1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            정산 상세보기
          </h1>
          <p className="text-lg text-gray-600">
            정산 항목의 상세 정보를 확인하고 관리하세요
          </p>
        </div>

        {/* 정산 정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">정산 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={settlementDetail.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="승인대기">승인대기</option>
                  <option value="승인">승인</option>
                  <option value="취소">취소</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">대상총판</label>
                <select
                  value={settlementDetail.targetDistributor}
                  onChange={(e) => handleDistributorChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="총판선택">총판선택</option>
                  <option value="본사">본사</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="refundStatus"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settlementDetail.refundStatus}
                  onChange={(e) => handleRefundStatusChange(e.target.checked)}
                />
                <label htmlFor="refundStatus" className="text-sm font-medium text-gray-700">환불여부</label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">처리일</label>
                <input
                  type="date"
                  value={settlementDetail.processDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">총 슬롯수:</span>
                <span className="text-lg font-bold text-blue-600">{settlementDetail.totalSlots}개</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">총 금액:</span>
                <span className="text-lg font-bold text-green-600">{settlementDetail.totalAmount.toLocaleString()}원</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="taxInvoice"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={settlementDetail.taxInvoice}
                  onChange={(e) => handleTaxInvoiceChange(e.target.checked)}
                />
                <label htmlFor="taxInvoice" className="text-sm font-medium text-gray-700">세금계산서</label>
              </div>
              
              {settlementDetail.taxInvoice && (
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                  <span className="font-medium">세액 (10%):</span>
                  <span className="text-lg font-bold text-orange-600">{taxAmount.toLocaleString()}원</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입금자명</label>
                <input
                  type="text"
                  value={settlementDetail.depositorName}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입금액</label>
                <input
                  type="text"
                  value={settlementDetail.depositAmount.toLocaleString() + '원'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <textarea
                  value={settlementDetail.memo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* 대상슬롯 테이블 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">대상슬롯</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속총판</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯추가일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용일수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlementDetail.targetSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.sequentialNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.distributor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.customerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.slotAdditionDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.slotType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.slotCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.depositInfo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.daysUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slot.memo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-between">
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-gray-400 text-gray-700 rounded-md hover:bg-gray-500 transition-colors"
          >
            뒤로가기
          </button>
          <div className="flex space-x-2">
            <button className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
