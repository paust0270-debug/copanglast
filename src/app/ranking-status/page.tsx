'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function RankingStatusPage() {
  const [filters, setFilters] = useState({
    status: '전체',
    userId: '',
    keyword: ''
  });

  const [rankingChecks] = useState([
    {
      id: 1,
      keyword: '전자렌지 선반',
      user: 'user001',
      currentRank: 15,
      previousRank: 18,
      rankChange: 3,
      status: '성공',
      usedSlots: 1,
      lastCheck: '2024. 1. 15. 오후 7:30:00'
    },
    {
      id: 2,
      keyword: '노트북 거치대',
      user: 'user002',
      currentRank: 25,
      previousRank: 22,
      rankChange: -3,
      status: '성공',
      usedSlots: 2,
      lastCheck: '2024. 1. 15. 오후 7:35:00'
    },
    {
      id: 3,
      keyword: '무선 이어폰',
      user: 'user003',
      currentRank: '-',
      previousRank: 45,
      rankChange: 0,
      status: '실패',
      usedSlots: 1,
      lastCheck: '2024. 1. 15. 오후 7:40:00'
    },
    {
      id: 4,
      keyword: '스마트폰 케이스',
      user: 'user001',
      currentRank: '-',
      previousRank: '-',
      rankChange: 0,
      status: '대기중',
      usedSlots: 1,
      lastCheck: '2024. 1. 15. 오후 7:45:00'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            순위체크현황
          </h1>
          <p className="text-lg text-gray-600">
            상품 랭킹 체크 상태와 결과를 모니터링하세요
          </p>
        </div>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-gray-600">전체 체크</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">2</div>
            <div className="text-gray-600">성공</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">1</div>
            <div className="text-gray-600">실패</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">1</div>
            <div className="text-gray-600">대기중</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
            <div className="text-gray-600">평균 순위변화</div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">필터</h2>
          <p className="text-gray-600 mb-4">검색 조건을 설정하여 결과를 필터링합니다</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <option value="성공">성공</option>
                <option value="실패">실패</option>
                <option value="대기중">대기중</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID
              </label>
              <input
                type="text"
                placeholder="사용자 ID 검색"
                value={filters.userId}
                onChange={(e) => setFilters({...filters, userId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                키워드
              </label>
              <input
                type="text"
                placeholder="키워드 검색"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 순위체크 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">순위체크 목록</h2>
          <p className="text-gray-600 mb-6">실시간 순위체크 상태와 결과를 확인할 수 있습니다</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    키워드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이전순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순위변화
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용슬롯
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마지막체크
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankingChecks.map((check) => (
                  <tr key={check.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.keyword}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.currentRank !== '-' ? check.currentRank : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.previousRank !== '-' ? check.previousRank : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {check.rankChange !== 0 ? (
                        <span className={`inline-flex items-center text-sm ${
                          check.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {check.rankChange > 0 ? '▲' : '▼'} {Math.abs(check.rankChange)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        check.status === '성공' 
                          ? 'bg-green-100 text-green-800'
                          : check.status === '실패'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {check.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.usedSlots}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {check.lastCheck}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                          재체크
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                          상세보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
