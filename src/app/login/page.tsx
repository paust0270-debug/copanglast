'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveSession, getSession, canLogin } from '@/lib/session';
import { validateUserPermissions } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
    saveUsername: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 페이지 로드 시 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    const checkExistingSession = () => {
      const user = getSession();
      if (user && validateUserPermissions(user)) {
        console.log('✅ 이미 로그인된 사용자:', user.username);
        // 로그인 후 대시보드로 리다이렉트
        router.push('/dashboard');
      }
    };

    // 저장된 아이디 확인
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
      setFormData(prev => ({
        ...prev,
        username: savedUsername,
        saveUsername: true,
      }));
    }

    checkExistingSession();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // 사용자 권한 검증
        if (!validateUserPermissions(result.user)) {
          setError('사용자 정보가 올바르지 않습니다.');
          return;
        }

        // 로그인 가능 여부 확인 (status === 'active')
        if (result.user.status !== 'active') {
          setError(
            '계정이 승인되지 않았거나 정지되었습니다. 관리자에게 문의하세요.'
          );
          return;
        }

        // 아이디 저장 처리
        if (formData.saveUsername) {
          localStorage.setItem('savedUsername', formData.username);
        } else {
          localStorage.removeItem('savedUsername');
        }

        // 세션 저장 (세션 유틸리티 사용)
        saveSession(result.user);

        console.log('✅ 로그인 성공:', result.user.username);

        // 로그인 후 대시보드로 리다이렉트
        router.push('/dashboard');
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 메인 콘텐츠 */}
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            {/* 애드팡팡 로고 */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 mb-6">
              {/* AD 로고 */}
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <span className="text-white text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                    AD
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>

              {/* 애드팡팡 텍스트 */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent pb-1">
                애드팡팡
              </h1>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                아이디
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="아이디를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            {/* 로그인 유지 체크박스 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveUsername"
                  name="saveUsername"
                  checked={formData.saveUsername}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="saveUsername"
                  className="ml-2 block text-sm text-gray-700"
                >
                  아이디 저장
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700"
                >
                  로그인 유지
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="w-full bg-white text-black py-3 px-4 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
              >
                가입신청
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
