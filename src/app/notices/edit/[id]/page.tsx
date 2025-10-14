'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Notice {
  id: number;
  title: string;
  content: string;
  target: string;
  author: string;
}

export default function EditNoticePage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.id as string;

  const [formData, setFormData] = useState({
    target: '전체',
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotice();
  }, [noticeId]);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notices/${noticeId}`);
      
      if (!response.ok) {
        throw new Error(`공지사항 조회 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const notice = result.data;
        setFormData({
          target: notice.target || '전체',
          title: notice.title,
          content: notice.content
        });
      } else {
        setError(result.error || '공지사항을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 조회 에러:', error);
      setError(`서버 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: formData.target,
          title: formData.title,
          content: formData.content
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', errorText);
        throw new Error(`공지사항 수정 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('공지사항이 수정되었습니다.');
        router.push('/notices');
      } else {
        console.error('API 에러 상세:', result);
        throw new Error(result.error || result.details || '공지사항 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 수정 에러:', error);
      alert(`공지사항 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/notices');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/notices')}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">공지사항 수정</h1>
            <button
              onClick={handleCancel}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
          </div>

          {/* 폼 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* 대상 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상
              </label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="전체">전체</option>
                <option value="총판">총판</option>
                <option value="고객">고객</option>
                <option value="관리자">관리자</option>
              </select>
            </div>

            {/* 제목 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            {/* 내용 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '수정 중...' : '수정'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
