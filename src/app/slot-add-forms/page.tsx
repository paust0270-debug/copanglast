'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SlotAddForm {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type?: string;
  payer_name?: string;
  payment_amount?: number;
  payment_date?: string;
  usage_days?: number;
  memo?: string;
  created_at: string;
}

export default function SlotAddFormsPage() {
  const [forms, setForms] = useState<SlotAddForm[]>([]);
  const [loading, setLoading] = useState(true);

  const loadForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/slot-add-forms');
      const result = await response.json();
      
      if (result.success) {
        setForms(result.data || []);
        console.log(`✅ 저장된 폼 데이터 로드 성공: ${result.data?.length || 0}개`);
      } else {
        console.error('❌ 폼 데이터 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 폼 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">슬롯 추가 폼 데이터</h1>
          <p className="text-gray-600 mt-2">저장된 모든 슬롯 추가 요청을 확인할 수 있습니다.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>저장된 폼 데이터 ({forms.length}개)</span>
              <Button onClick={loadForms} variant="outline" size="sm">
                새로고침
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">로딩 중...</p>
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>저장된 폼 데이터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.map((form) => (
                  <div key={form.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">고객:</span>
                        <p className="text-gray-900">{form.customer_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">슬롯 유형:</span>
                        <p className="text-gray-900">{form.slot_type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">슬롯 개수:</span>
                        <p className="text-gray-900">{form.slot_count}개</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">사용일수:</span>
                        <p className="text-gray-900">{form.usage_days || 30}일</p>
                      </div>
                    </div>
                    {form.memo && (
                      <div className="mt-2">
                        <span className="font-medium text-gray-700">메모:</span>
                        <p className="text-gray-900 text-sm">{form.memo}</p>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      신청일: {new Date(form.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
