'use client';

import { Suspense } from 'react';
import { CustomerPageContent } from './CustomerPageContent';

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <CustomerPageContent />
    </Suspense>
  );
}
