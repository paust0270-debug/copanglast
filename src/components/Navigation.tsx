'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();

  const navigation = [
    {
      name: '무료 서비스',
      href: '/',
      description: '쿠팡 랭킹 체커'
    },
    {
      name: '메인서비스',
      href: '/coupang-app',
      description: '쿠팡APP 순위체커'
    },
    {
      name: '고객관리',
      href: '/customer',
      description: '고객 및 슬롯 관리'
    },
    {
      name: '총판관리',
      href: '/dealer',
      description: '총판 및 수익 관리'
    },
    {
      name: '작업관리',
      href: '/work',
      description: '크롤링 작업 관리'
    },
    {
      name: '공지사항',
      href: '/notice',
      description: '시스템 공지 및 업데이트'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 및 메인 네비게이션 */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">쿠팡랭킹체커</span>
              </Link>
            </div>
            
            {/* 메인 네비게이션 링크 */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200',
                    pathname === item.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  <div className="text-center">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 우측 버튼들 */}
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
              로그인
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium">
              회원가입
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 (간단한 형태) */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
