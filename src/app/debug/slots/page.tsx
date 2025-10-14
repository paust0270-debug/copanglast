'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

interface Slot {
  id: number;
  status: string;
  customer_id: string;
  slot_type: string;
}

interface StatusStats {
  [key: string]: number;
}

export default function DebugSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/slots');
      const result = await response.json();

      if (result.success) {
        setSlots(result.data.slots);
        setStatusStats(result.data.statusStats);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('슬롯 데이터를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fixSlotStatus = async (slotId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/debug/fix-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: slotId,
          newStatus: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('슬롯 상태가 수정되었습니다.');
        fetchSlots(); // 데이터 다시 로드
      } else {
        alert(`슬롯 상태 수정 실패: ${result.error}`);
      }
    } catch (err) {
      alert('슬롯 상태 수정 중 오류가 발생했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case '구동중':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-green-100 text-green-800'; // inactive도 구동중으로 표시
      case 'expired':
      case '만료':
        return 'bg-red-100 text-red-800';
      case 'completed':
      case '완료':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">슬롯 상태 디버깅</h1>
          
          {/* 상태별 통계 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">상태별 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="bg-gray-50 p-4 rounded-lg">
                  <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(status)} mb-2`}>
                    {status}
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 슬롯 목록 */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">고객ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">슬롯타입</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">수정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{slot.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(slot.status)}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{slot.customer_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">{slot.slot_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      <select
                        onChange={(e) => fixSlotStatus(slot.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                        defaultValue=""
                      >
                        <option value="" disabled>상태 변경</option>
                        <option value="active">구동중</option>
                        <option value="inactive">구동중</option>
                        <option value="expired">만료</option>
                        <option value="completed">완료</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {slots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              슬롯 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


