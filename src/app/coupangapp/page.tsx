import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import CoupangAppRankTracker from '@/components/CoupangAppRankTracker';
import CoupangAppStats from '@/components/CoupangAppStats';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CoupangAppPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📱 쿠팡APP 순위체커
          </h1>
          <p className="text-gray-600">
            쿠팡 모바일 앱에서의 상품 검색 순위를 실시간으로 모니터링하세요
          </p>
        </div>

        {/* 쿠팡APP 전용 통계 */}
        <Suspense fallback={<LoadingSpinner />}>
          <CoupangAppStats />
        </Suspense>

        {/* 메인 기능 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 랭킹 추적 (메인) */}
          <div className="lg:col-span-2">
            <CoupangAppRankTracker />
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 작업 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚡ 빠른 작업
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  새 상품 추가
                </button>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                  일괄 체크
                </button>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
                  리포트 생성
                </button>
              </div>
            </div>

            {/* 쿠팡APP 특징 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📱 쿠팡APP 특징
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>모바일 최적화 검색</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>실시간 순위 변화</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>앱 전용 알고리즘</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>사용자 행동 분석</span>
                </div>
              </div>
            </div>

            {/* 도움말 */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                💡 사용 팁
              </h3>
              <p className="text-sm text-blue-700">
                쿠팡APP는 모바일 사용자 중심의 검색 결과를 제공합니다. 
                모바일 키워드와 데스크톱 키워드가 다를 수 있으니 
                각각 따로 모니터링하는 것을 권장합니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
