'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';

export default function CoupangAppPage() {
  const [singleForm, setSingleForm] = useState({
    keyword: '',
    url: 'https://www.coupang.com/vp/products/...',
    slots: '1',
    days: '30'
  });

  const [bulkInput, setBulkInput] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            쿠팡APP 랭킹 트래커
          </h1>
          <p className="text-lg text-gray-600">
            쿠팡 모바일 앱에서 상품 랭킹을 추적하고 관리하세요
          </p>
        </div>

        {/* 단일 등록 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">단일 등록</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                검색어(상품키워드)
              </label>
              <input
                type="text"
                placeholder="예: 전자렌지 선반"
                value={singleForm.keyword}
                onChange={(e) => setSingleForm({...singleForm, keyword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                링크주소(쿠팡 실제 URL)
              </label>
              <input
                type="text"
                value={singleForm.url}
                onChange={(e) => setSingleForm({...singleForm, url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용슬롯(개수)
              </label>
              <input
                type="number"
                value={singleForm.slots}
                onChange={(e) => setSingleForm({...singleForm, slots: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일수
              </label>
              <input
                type="number"
                value={singleForm.days}
                onChange={(e) => setSingleForm({...singleForm, days: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
              등록
            </button>
            <button className="bg-white text-black px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
              대량 등록
            </button>
          </div>
        </div>

        {/* 대량 등록 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">대량 등록</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              대량 등록 입력 (한 줄당: 키워드 | URL | 슬롯 | 일수)
            </label>
            <textarea
              rows={6}
              placeholder="예) 전자렌지 선반 | https://www.coupang.com/vp/products/8470784672 | 1 | 30"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
            대량 등록
          </button>
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">등록된 상품 목록</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순번
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    검색어
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    링크주소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최초 시작순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용슬롯
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* 데이터가 없을 때 표시할 메시지 */}
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    등록된 상품이 없습니다. 위의 폼을 사용하여 상품을 등록해주세요.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
