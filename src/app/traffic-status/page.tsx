'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function TrafficStatusPage() {
  const [filters, setFilters] = useState({
    statusCode: '전체',
    endpoint: '',
    userId: '',
    dateRange: '오늘'
  });

  const [trafficLogs] = useState([
    {
      id: 1,
      time: '2024. 1. 15. 오후 7:00:00',
      endpoint: '/api/check-ranking',
      method: 'POST',
      status: 200,
      responseTime: '150ms',
      user: 'user001',
      ipAddress: '192.168.1.100',
      requestSize: '1 KB',
      responseSize: '2 KB'
    },
    {
      id: 2,
      time: '2024. 1. 15. 오후 7:01:00',
      endpoint: '/api/tracked-items',
      method: 'GET',
      status: 200,
      responseTime: '89ms',
      user: 'user002',
      ipAddress: '192.168.1.101',
      requestSize: '512 Bytes',
      responseSize: '4 KB'
    },
    {
      id: 3,
      time: '2024. 1. 15. 오후 7:02:00',
      endpoint: '/api/check-ranking',
      method: 'POST',
      status: 500,
      responseTime: '2.50s',
      user: 'user003',
      ipAddress: '192.168.1.102',
      requestSize: '1 KB',
      responseSize: '256 Bytes'
    },
    {
      id: 4,
      time: '2024. 1. 15. 오후 7:03:00',
      endpoint: '/api/instant-rank',
      method: 'GET',
      status: 200,
      responseTime: '120ms',
      user: '익명',
      ipAddress: '192.168.1.103',
      requestSize: '256 Bytes',
      responseSize: '1 KB'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            트래픽 현황
          </h1>
          <p className="text-lg text-gray-600">
            API 요청 및 응답 현황을 모니터링하세요
          </p>
        </div>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-gray-600">전체 요청</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">3</div>
            <div className="text-gray-600">성공 요청</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">1</div>
            <div className="text-gray-600">실패 요청</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">715ms</div>
            <div className="text-gray-600">평균 응답시간</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">3</div>
            <div className="text-gray-600">고유 사용자</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">10:00</div>
            <div className="text-gray-600">피크 시간</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-teal-600 mb-2">10 KB</div>
            <div className="text-gray-600">총 대역폭</div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">필터</h2>
          <p className="text-gray-600 mb-4">트래픽 데이터를 필터링하여 분석합니다</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태 코드
              </label>
              <select
                value={filters.statusCode}
                onChange={(e) => setFilters({...filters, statusCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                <option value="200">200 (성공)</option>
                <option value="400">400 (클라이언트 오류)</option>
                <option value="500">500 (서버 오류)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                엔드포인트
              </label>
              <input
                type="text"
                placeholder="엔드포인트 검색"
                value={filters.endpoint}
                onChange={(e) => setFilters({...filters, endpoint: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                날짜 범위
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="오늘">오늘</option>
                <option value="어제">어제</option>
                <option value="이번 주">이번 주</option>
                <option value="이번 달">이번 달</option>
              </select>
            </div>
          </div>
        </div>

        {/* 트래픽 로그 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">트래픽 로그</h2>
          <p className="text-gray-600 mb-6">실시간 API 요청 및 응답 로그를 확인할 수 있습니다</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    엔드포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메서드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    응답시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP 주소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청/응답 크기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trafficLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.status === 200 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.responseTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      요청: {log.requestSize}, 응답: {log.responseSize}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                          상세보기
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                          재시도
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 실시간 모니터링 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">정상</div>
              <p className="text-gray-600">모든 서비스가 정상 작동 중</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">현재 부하</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">낮음</div>
              <p className="text-gray-600">CPU: 15%, 메모리: 45%</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">응답 시간</h3>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">715ms</div>
              <p className="text-gray-600">평균 응답 시간</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
