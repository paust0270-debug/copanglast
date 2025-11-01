'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Notice {
  id: number;
  title: string;
  content: string;
  target: string;
  author: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export default function NoticeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noticeId = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
    fetchNotice();
  }, [noticeId]);

  // 수정/삭제 버튼 표시 여부 (최고관리자 또는 관리자만)
  const canEdit =
    currentUser &&
    (currentUser.grade === '최고관리자' || currentUser.grade === '관리자');

  const fetchNotice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notices/${noticeId}`);

      if (!response.ok) {
        throw new Error(
          `공지사항 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success) {
        setNotice(result.data);
      } else {
        setError(result.error || '공지사항을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('공지사항 조회 에러:', error);
      setError(
        `서버 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleEdit = () => {
    router.push(`/notices/edit/${noticeId}`);
  };

  const handleDelete = async () => {
    if (!notice) return;

    if (confirm(`"${notice.title}" 공지사항을 삭제하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/notices/${noticeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(
            `공지사항 삭제 실패: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.success) {
          alert('공지사항이 삭제되었습니다.');
          router.push('/notices');
        } else {
          throw new Error(result.error || '공지사항 삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('공지사항 삭제 중 오류:', error);
        alert(
          `공지사항 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
      }
    }
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

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">
                {error || '공지사항을 찾을 수 없습니다.'}
              </p>
              <button
                onClick={() => router.push('/notices')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
            <Link
              href="/notices"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              목록으로
            </Link>
            {canEdit && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* 공지사항 내용 */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* 헤더 정보 */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {notice.target}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {notice.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>작성일: {formatDate(notice.created_at)}</span>
                {notice.updated_at !== notice.created_at && (
                  <span>수정일: {formatDate(notice.updated_at)}</span>
                )}
              </div>
            </div>

            {/* 본문 내용 */}
            <div className="px-6 py-8">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {notice.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
