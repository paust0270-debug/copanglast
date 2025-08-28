import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import CoupangRankTracker from '@/components/CoupangRankTracker';
import RankingHistory from '@/components/RankingHistory';
import DashboardStats from '@/components/DashboardStats';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 쿠팡 랭킹 체커
          </h1>
          <p className="text-gray-600">
            키워드 입력만으로 자사 상품의 실제 검색 노출 순위를 즉시 확인하세요
          </p>
        </div>

        {/* 대시보드 통계 */}
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardStats />
        </Suspense>

        {/* 메인 기능 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 쿠팡 랭킹 추적 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📊 쿠팡 랭킹 추적
              </h2>
              <CoupangRankTracker />
            </div>
          </div>

          {/* 순위 히스토리 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                📈 순위 변화 추이
              </h2>
              <RankingHistory />
            </div>
          </div>
        </div>

        {/* 추가 기능 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 빠른 검색 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🔍 빠른 검색
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              상품 ID와 키워드만 입력하면 즉시 순위 확인
            </p>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              시작하기
            </button>
          </div>

          {/* 자동 모니터링 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⏰ 자동 모니터링
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              6시간 주기로 순위 변화 자동 추적
            </p>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              설정하기
            </button>
          </div>

          {/* 리포트 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📋 리포트
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              CSV/Excel로 순위 데이터 내보내기
            </p>
            <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              다운로드
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
