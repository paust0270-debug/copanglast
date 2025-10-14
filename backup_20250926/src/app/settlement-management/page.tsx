'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function SettlementManagementPage() {
  const [filters, setFilters] = useState({
    targetDistributor: '전체',
    status: '전체',
    dateRange: '전체'
  });

  const [settlementItems] = useState([
    {
      id: 1,
      targetDistributor: '본사',
      status: '승인대기',
      refundStatus: '환불',
      customerId: 'CUST001',
      slotAdditionDate: '2024-01-15',
      slotType: '기본슬롯',
      slotCount: 5,
      daysUsed: '30일',
      depositorName: '김철수',
      depositAmount: '50,000원',
      depositDate: '2024-01-15',
      memo: '정상 결제',
      requestDate: '2024-01-15',
      processor: '-'
    },
    {
      id: 2,
      targetDistributor: '본사',
      status: '승인',
      refundStatus: '환불',
      customerId: 'CUST002',
      slotAdditionDate: '2024-01-20',
      slotType: '프리미엄슬롯',
      slotCount: 3,
      daysUsed: '25일',
      depositorName: '이영희',
      depositAmount: '75,000원',
      depositDate: '2024-01-20',
      memo: '정상 결제',
      requestDate: '2024-01-20',
      processor: '관리자'
    },
    {
      id: 3,
      targetDistributor: '본사',
      status: '취소',
      refundStatus: '환불',
      customerId: 'CUST003',
      slotAdditionDate: '2024-01-25',
      slotType: '기본슬롯',
      slotCount: 2,
      daysUsed: '0일',
      depositorName: '박민수',
      depositAmount: '20,000원',
      depositDate: '2024-01-25',
      memo: '고객 요청 취소',
      requestDate: '2024-01-25',
      processor: '관리자'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            정산관리
          </h1>
          <p className="text-lg text-gray-600">
            정산 요청 및 처리를 통합 관리하세요
          </p>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
            <div className="text-gray-600">전체 정산</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">1</div>
            <div className="text-gray-600">승인대기</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1</div>
            <div className="text-gray-600">승인 완료</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">1</div>
            <div className="text-gray-600">취소 처리</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">145,000원</div>
            <div className="text-gray-600">총 정산액</div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">필터</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상총판
              </label>
              <select
                value={filters.targetDistributor}
                onChange={(e) => setFilters({...filters, targetDistributor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="본사">본사</option>
                <option value="기타총판">기타총판</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="승인대기">승인대기</option>
                <option value="승인">승인</option>
                <option value="취소">취소</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 범위
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="오늘">오늘</option>
                <option value="이번 주">이번 주</option>
                <option value="이번 달">이번 달</option>
              </select>
            </div>
          </div>
        </div>

        {/* 정산 관리 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">정산 관리 목록</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    대상총판
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    환불여부
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고객ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯추가일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    슬롯수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용일수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    입금자명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    입금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    입금일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메모
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    처리자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlementItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input type="radio" name="selectedItem" className="mr-2" />
                        <span className="text-sm text-gray-900">{item.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.targetDistributor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === '승인' 
                          ? 'bg-green-100 text-green-800'
                          : item.status === '승인대기'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                        {item.refundStatus}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.slotAdditionDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.slotType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.slotCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.daysUsed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.depositorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.depositAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.depositDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.memo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.requestDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.processor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {item.status === '승인대기' && (
                          <>
                            <button className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                              승인
                            </button>
                            <button className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">
                              거부
                            </button>
                          </>
                        )}
                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                          상세보기
                        </button>
                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-6 flex justify-between">
            <div className="flex space-x-2">
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                요청 취소 (0개)
              </button>
              <button className="px-6 py-2 bg-red-200 text-red-700 rounded-md hover:bg-red-300 transition-colors">
                선택 삭제
              </button>
            </div>
            <div className="flex space-x-2">
              <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                엑셀 다운로드
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                정산 요약 리포트
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
