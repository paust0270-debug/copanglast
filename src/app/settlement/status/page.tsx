'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Slot {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string | null;
  payer_name: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  usage_days: number | null;
  memo: string | null;
  status: string;
  created_at: string;
}

function StatusPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slotId = searchParams.get('slotId');
    if (slotId) {
      fetchSlot(slotId);
    }
  }, [searchParams]);

  const fetchSlot = async (slotId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/slots/${slotId}`);
      const result = await response.json();

      if (result.success) {
        setSlot(result.data);
      } else {
        setError(result.error || '슬롯 정보를 가져올 수 없습니다.');
      }
    } catch (err) {
      console.error('슬롯 정보 로딩 실패:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSlotTypeKorean = (slotType: string) => {
    const typeMap: { [key: string]: string } = {
      coupang: '쿠팡',
      'coupang-vip': '쿠팡 VIP',
      'coupang-app': '쿠팡 앱',
      'naver-shopping': '네이버 쇼핑',
      place: '플레이스',
      'today-house': '오늘의집',
      aliexpress: '알리익스프레스',
    };
    return typeMap[slotType] || slotType;
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '0원';
    return `${amount.toLocaleString()}원`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">슬롯 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !slot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center">
            <p className="text-red-600">
              {error || '슬롯 정보를 찾을 수 없습니다.'}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">슬롯 현황</h1>
              <button
                onClick={() => router.back()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                뒤로 가기
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    아이디
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.customer_id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    순번
                  </label>
                  <p className="mt-1 text-lg text-gray-900">{slot.id}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    슬롯유형
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {getSlotTypeKorean(slot.slot_type)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    입금액
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {formatAmount(slot.payment_amount)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    고객명
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.customer_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    사용일수
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.usage_days ? `${slot.usage_days}일` : '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    상태
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        slot.status === 'active' || slot.status === '구동중'
                          ? 'bg-green-100 text-green-800'
                          : slot.status === 'inactive'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {slot.status === 'active' || slot.status === '구동중'
                        ? '구동중'
                        : slot.status === 'inactive'
                          ? '구동중'
                          : '만료'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    메모
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.memo || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                추가 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    슬롯수
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.slot_count}개
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    입금자명
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.payer_name || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    입금일
                  </label>
                  <p className="mt-1 text-lg text-gray-900">
                    {slot.payment_date ? formatDate(slot.payment_date) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      }
    >
      <StatusPageContent />
    </Suspense>
  );
}
