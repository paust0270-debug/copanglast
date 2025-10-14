'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // 클라이언트 상태 정리
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  };

  const navigationItems = [
    { 
      name: '무료 서비스', 
      href: '/dashboard',
      subItems: []
    },
    { 
      name: '메인서비스', 
      href: '/coupangapp',
      subItems: [
        { name: '쿠팡', href: '/coupangapp/add' },
        { name: '쿠팡VIP', href: '/coupangapp/vip' },
        { name: '쿠팡APP', href: '/coupangapp/app' }
      ]
    },
    { 
      name: '고객관리', 
      href: '/customer',
      subItems: [
        { name: '고객관리', href: '/customer' },
        { name: '슬롯관리', href: '/admin/slots' },
        { name: '슬롯현황', href: '/slot-status' }
      ]
    },
    { 
      name: '정산관리', 
      href: '/settlement/history',
      subItems: [
        { name: '정산내역', href: '/settlement/history' },
        { name: '정산대기', href: '/settlement' },
        { name: '미정산내역', href: '/settlement/unsettled' }
      ]
    },
    { 
      name: '총판관리', 
      href: '/distributor',
      subItems: [
        { name: '총판 대시보드', href: '/distributor' },
        { name: '총판관리', href: '/distributor-add' },
        { name: '총판추가', href: '/distributor-add/add' }
      ]
    },
    { 
      name: '작업관리', 
      href: '/ranking-status',
      subItems: [
        { name: '순위체크현황', href: '/ranking-status' },
        { name: '트래픽현황', href: '/traffic-status' }
      ]
    },
    { 
      name: '공지사항', 
      href: '/notices',
      subItems: []
    }
  ];

  // 현재 활성화된 메인 탭 찾기
  const activeMainTab = navigationItems.find(item => 
    pathname.startsWith(item.href) || 
    item.subItems.some(sub => pathname.startsWith(sub.href))
  );

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* 왼쪽 로고 */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">쿠팡 랭킹 체커</span>
            </Link>
          </div>

          {/* 중앙 네비게이션 메뉴 */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = activeMainTab === item;
              const hasSubItems = item.subItems.length > 0;
              
              return (
                <div 
                  key={item.name} 
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                  
                  {/* 드롭다운 서브메뉴 */}
                  {hasSubItems && hoveredItem === item.name && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname.startsWith(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                              isSubActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 우측 사용자 영역 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {user.name} ({user.grade})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
