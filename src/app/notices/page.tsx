'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isMasterAdmin, type UserPermissions } from '@/lib/auth';

interface Notice {
  id: number;
  title: string;
  content: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImportantOnly, setShowImportantOnly] = useState(false);
  const [userInfo, setUserInfo] = useState<UserPermissions | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  const isAdmin = isMasterAdmin(userInfo);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notices');

      if (!response.ok) {
        throw new Error(
          `공지사항 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success) {
        setNotices(result.data || []);
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
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  const handleEdit = (noticeId: number) => {
    router.push(`/notices/edit/${noticeId}`);
  };

  const handleDelete = async (noticeId: number, noticeTitle: string) => {
    if (confirm(`"${noticeTitle}" 공지사항을 삭제하시겠습니까?`)) {
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
          // 목록에서 삭제된 항목 제거
          setNotices(prev => prev.filter(notice => notice.id !== noticeId));
          alert('공지사항이 삭제되었습니다.');
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

  const filteredNotices = showImportantOnly
    ? notices.filter(notice => notice.is_important)
    : notices;

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
                onClick={fetchNotices}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                다시 시도
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
        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                공지사항
              </h1>
              <p className="text-gray-600">
                총 {filteredNotices.length}개의 공지사항
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/notices/write"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                글쓰기
              </Link>
            )}
          </div>

          {/* 필터 */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showImportantOnly}
                  onChange={e => setShowImportantOnly(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  중요 공지사항만 보기
                </span>
              </label>
            </div>
          </div>

          {/* 공지사항 목록 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {filteredNotices.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-2">
                  등록된 공지사항이 없습니다
                </p>
                <p className="text-gray-400">
                  첫 번째 공지사항을 작성해보세요!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotices.map(notice => (
                  <div
                    key={notice.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {notice.is_important && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            중요
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(notice.created_at)}
                        </span>
                        <Link
                          href={`/notices/${notice.id}`}
                          className="flex-1 text-center"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {notice.title}
                          </h3>
                        </Link>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(notice.id)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
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
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(notice.id, notice.title)
                            }
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
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
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
