'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 메인 제목 및 설명 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            쿠팡 랭킹 체커 대시보드
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            쿠팡 상품 랭킹을 실시간으로 추적하고 관리하는 통합 플랫폼입니다.
            <br />
            무료 서비스부터 고급 관리 기능까지 한 곳에서 확인하세요.
          </p>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">156</div>
            <div className="text-gray-600">전체 사용자</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">89</div>
            <div className="text-gray-600">활성 슬롯</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">342</div>
            <div className="text-gray-600">추적 상품</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">1280</div>
            <div className="text-gray-600">성공 체크</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">23</div>
            <div className="text-gray-600">실패 체크</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">715ms</div>
            <div className="text-gray-600">평균 응답시간</div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">빠른 액션</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">랭킹 추적</h3>
              <p className="text-gray-600 mb-4">상품 랭킹을 추적하고 관리합니다.</p>
              <Link href="/dashboard" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                이동
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">쿠팡 APP</h3>
              <p className="text-gray-600 mb-4">쿠팡 모바일 앱 랭킹 트래커.</p>
              <Link href="/coupang-app" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                이동
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">고객 관리</h3>
              <p className="text-gray-600 mb-4">사용자 정보와 슬롯을 관리합니다.</p>
              <Link href="/customer" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                이동
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">순위체크현황</h3>
              <p className="text-gray-600 mb-4">랭킹 체크 상태를 모니터링합니다.</p>
              <Link href="/ranking-status" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                이동
              </Link>
            </div>
          </div>
        </div>

        {/* 무료 서비스 및 관리 기능 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">무료 서비스</h3>
            </div>
            <p className="text-gray-600 mb-4">기본 랭킹 추적 기능을 무료로 이용할 수 있습니다.</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">랭킹 추적</span>
                <Link href="/dashboard" className="text-gray-800 hover:text-gray-600">이동</Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">쿠팡 APP</span>
                <Link href="/coupang-app" className="text-gray-800 hover:text-gray-600">이동</Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">관리 기능</h3>
            </div>
            <p className="text-gray-600 mb-4">시스템 관리 및 모니터링을 위한 고급 기능입니다.</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">고객 관리</span>
                <Link href="/customer" className="text-gray-800 hover:text-gray-600">이동</Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">슬롯 관리</span>
                <Link href="/slot-management" className="text-gray-800 hover:text-gray-600">이동</Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">총판 관리</span>
                <Link href="/distributor" className="text-gray-800 hover:text-gray-600">이동</Link>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 관리 */}
        <div className="bg-white rounded-lg shadow p-6 mb-12">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">작업 관리</h3>
          </div>
          <p className="text-gray-600 mb-6">시스템 작업 상태를 실시간으로 모니터링하고 관리합니다.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">순위체크현황</h4>
              <p className="text-gray-600 mb-4">상품 랭킹 체크 상태와 결과를 모니터링합니다.</p>
              <Link href="/ranking-status" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                순위체크현황 보기
              </Link>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">트래픽현황</h4>
              <p className="text-gray-600 mb-4">API 요청 및 응답 상태를 실시간으로 확인합니다.</p>
              <Link href="/traffic-status" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
                트래픽현황 보기
              </Link>
            </div>
          </div>
        </div>

        {/* 최신 공지사항 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">최신 공지사항</h3>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800">
              새로운 기능이 추가되었습니다! 쿠팡 APP 전용 랭킹 트래커를 사용해보세요.
            </p>
          </div>
          <Link href="/notices" className="inline-block bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
            전체 공지사항 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
