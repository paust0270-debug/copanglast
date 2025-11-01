'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    kakaoId: '',
    distributor: '', // 소속총판 추가
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // 현재 사용자 정보
  const [isDistributorUser, setIsDistributorUser] = useState(false); // 총판회원 여부

  useEffect(() => {
    // 현재 사용자 정보 확인
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // 총판회원인 경우 소속총판 자동 기입
        if (user.grade === '총판회원' && user.distributor) {
          setIsDistributorUser(true);
          setFormData(prev => ({
            ...prev,
            distributor: user.distributor,
          }));
        }
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 에러 메시지 초기화
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.id.trim()) {
      newErrors.id = '아이디를 입력해주세요.';
    } else if (formData.id.length < 4) {
      newErrors.id = '아이디는 4자 이상이어야 합니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 4) {
      newErrors.password = '비밀번호는 4자 이상이어야 합니다.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (formData.phone && !/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '올바른 휴대폰번호 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: any = {
        username: formData.id,
        password: formData.password,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        kakaoId: formData.kakaoId,
      };

      // 총판회원이 회원가입하는 경우 추가 정보 전달
      if (isDistributorUser && currentUser) {
        requestBody.registrantType = 'distributor'; // 총판회원이 등록하는 것임을 표시
        requestBody.registrantDistributor = currentUser.distributor; // 총판회원의 소속총판
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        router.push('/customer?newSignup=true'); // 새로 가입한 사용자 표시를 위한 파라미터 추가
      } else {
        // Rate limiting 오류 처리
        if (result.code === 'RATE_LIMIT') {
          alert(
            `회원가입 요청이 너무 빈번합니다.\n${result.retryAfter}초 후에 다시 시도해주세요.`
          );
        } else if (result.code === 'USER_EXISTS') {
          alert('이미 등록된 사용자입니다. 다른 아이디를 사용해주세요.');
        } else {
          alert(result.error || '회원가입에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 메인 콘텐츠 */}
        <div className="max-w-md mx-auto mt-20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                아이디 *
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={formData.id}
                onChange={e => handleInputChange('id', e.target.value)}
                placeholder="아이디를 입력하세요"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.id ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.id && (
                <p className="mt-1 text-sm text-red-600">{errors.id}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인 *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={e =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                placeholder="비밀번호를 다시 입력하세요"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="이메일을 입력하세요 (선택사항)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                휴대폰번호
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                placeholder="휴대폰번호를 입력하세요 (선택사항)"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="kakaoId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                카카오톡 아이디
              </label>
              <input
                type="text"
                id="kakaoId"
                name="kakaoId"
                value={formData.kakaoId}
                onChange={e => handleInputChange('kakaoId', e.target.value)}
                placeholder="카카오톡 아이디를 입력하세요 (선택사항)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            {/* 소속총판 필드 (총판회원인 경우만 표시 및 자동 기입) */}
            {isDistributorUser && (
              <div>
                <label
                  htmlFor="distributor"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  소속총판 *
                </label>
                <input
                  type="text"
                  id="distributor"
                  name="distributor"
                  value={formData.distributor}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-sm text-gray-500">
                  소속총판은 자동으로 설정됩니다.
                </p>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-md transition-colors font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isSubmitting ? '처리중...' : '가입신청'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
