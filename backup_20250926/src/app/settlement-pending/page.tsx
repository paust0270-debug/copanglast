'use client';

import { useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';

interface PendingItem {
  id: string;
  sequentialNumber: number;
  targetDistributor: string;
  status: string;
  refundStatus: boolean;
  customerId: string;
  slotAdditionDate: string;
  slotType: string;
  slotCount: number;
  daysUsed: string;
  depositorName: string;
  depositAmount: number;
  depositDate: string;
  memo: string;
  isSelected: boolean;
}

export default function SettlementPendingPage() {
  const [targetDistributorFilter, setTargetDistributorFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [taxInvoice, setTaxInvoice] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState('');
  const [memo, setMemo] = useState('');

  const [pendingItems, setPendingItems] = useState<PendingItem[]>([
    {
      id: '1',
      sequentialNumber: 1,
      targetDistributor: '총판선택',
      status: '승인대기',
      refundStatus: false,
      customerId: 'CUST001',
      slotAdditionDate: '2024-01-15',
      slotType: '기본슬롯',
      slotCount: 5,
      daysUsed: '30일',
      depositorName: '김철수',
      depositAmount: 50000,
      depositDate: '2024-01-15',
      memo: '정상 결제',
      isSelected: false
    },
    {
      id: '2',
      sequentialNumber: 2,
      targetDistributor: '본사',
      status: '승인대기',
      refundStatus: false,
      customerId: 'CUST002',
      slotAdditionDate: '2024-01-20',
      slotType: '프리미엄슬롯',
      slotCount: 3,
      daysUsed: '25일',
      depositorName: '이영희',
      depositAmount: 75000,
      depositDate: '2024-01-20',
      memo: '정상 결제',
      isSelected: false
    }
  ]);

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    setPendingItems(items => 
      items.map(item => ({ ...item, isSelected: checked }))
    );
  };

  // 개별 선택/해제
  const handleSelectItem = (id: string, checked: boolean) => {
    setPendingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, isSelected: checked } : item
      )
    );
  };

  // 환불여부 변경
  const handleRefundStatusChange = (id: string, checked: boolean) => {
    setPendingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, refundStatus: checked } : item
      )
    );
  };

  // 상태 변경
  const handleStatusChange = (id: string, status: string) => {
    setPendingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, status } : item
      )
    );
  };

  // 대상총판 변경
  const handleDistributorChange = (id: string, distributor: string) => {
    setPendingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, targetDistributor: distributor } : item
      )
    );
  };

  // 계산된 값들
  const selectedItems = useMemo(() => pendingItems.filter(item => item.isSelected), [pendingItems]);
  const totalSlots = useMemo(() => selectedItems.reduce((sum, item) => sum + item.slotCount, 0), [selectedItems]);
  const totalAmount = useMemo(() => selectedItems.reduce((sum, item) => sum + item.depositAmount, 0), [selectedItems]);
  const taxAmount = useMemo(() => taxInvoice ? Math.round(totalAmount * 0.1) : 0, [totalAmount, taxInvoice]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            정산대기
          </h1>
          <p className="text-lg text-gray-600">
            정산 요청된 항목들을 관리하고 승인/취소 처리를 진행하세요
          </p>
        </div>

        {/* 필터 및 요약 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">필터 및 요약</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상총판
              </label>
              <select
                value={targetDistributorFilter}
                onChange={(e) => setTargetDistributorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="본사">본사</option>
                <option value="총판선택">총판선택</option>
                <option value="사용자1">사용자1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="승인대기">승인대기</option>
                <option value="승인">승인</option>
                <option value="취소">취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* 정산대기 목록 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">정산대기 목록</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={pendingItems.length > 0 && pendingItems.every(item => item.isSelected)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총판명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯추가일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">슬롯수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">외상여부</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용일수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대상총판</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">환불여부</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={item.isSelected}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sequentialNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">총판명</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customerId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.slotAdditionDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.slotType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.slotCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.depositAmount.toLocaleString()}원</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">외상</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.daysUsed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">작동중</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.memo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select 
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.targetDistributor}
                        onChange={(e) => handleDistributorChange(item.id, e.target.value)}
                      >
                        <option value="총판선택">총판선택</option>
                        <option value="본사">본사</option>
                        <option value="사용자1">사용자1</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select 
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      >
                        <option value="승인대기">승인대기</option>
                        <option value="승인">승인</option>
                        <option value="취소">취소</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={item.refundStatus}
                        onChange={(e) => handleRefundStatusChange(item.id, e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-600">환불</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 정산 요약 및 입력 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">정산 요약</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 왼쪽: 계산된 값들 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">총 슬롯수:</span>
                <span className="text-lg font-bold text-blue-600">{totalSlots}개</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">총 금액:</span>
                <span className="text-lg font-bold text-green-600">{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">세액 (10%):</span>
                <span className="text-lg font-bold text-orange-600">{taxAmount.toLocaleString()}원</span>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="taxInvoice"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={taxInvoice}
                  onChange={(e) => setTaxInvoice(e.target.checked)}
                />
                <label htmlFor="taxInvoice" className="text-sm font-medium text-gray-700">세금계산서</label>
              </div>
            </div>

            {/* 오른쪽: 입력 필드들 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입금자명</label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="입금자명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입금액</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="입금액을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입금일</label>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(e) => setDepositDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="메모를 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-6 flex justify-between">
            <button className="px-6 py-2 bg-gray-400 text-gray-700 rounded-md hover:bg-gray-500 transition-colors">
              요청 취소 ({selectedItems.length}개)
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              정산 요청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
