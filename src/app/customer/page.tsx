import { Suspense } from 'react';
import Navigation from '@/components/Navigation';
import CustomerManagement from '@/components/CustomerManagement';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CustomerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            👥 고객관리 시스템
          </h1>
          <p className="text-gray-600">
            고객 정보, 슬롯 관리, 결제 현황을 체계적으로 관리하세요
          </p>
        </div>

        {/* 고객관리 메인 컴포넌트 */}
        <Suspense fallback={<LoadingSpinner />}>
          <CustomerManagement />
        </Suspense>
      </main>
    </div>
  );
}
