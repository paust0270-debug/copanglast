'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoupangAppStats {
  totalProducts: number;
  mobileProducts: number;
  desktopProducts: number;
  todayChecks: number;
  rankChanges: number;
  averageResponseTime: number;
  successRate: number;
  mobileVsDesktop: {
    mobileBetter: number;
    desktopBetter: number;
    same: number;
  };
}

export default function CoupangAppStats() {
  const [stats, setStats] = useState<CoupangAppStats>({
    totalProducts: 0,
    mobileProducts: 0,
    desktopProducts: 0,
    todayChecks: 0,
    rankChanges: 0,
    averageResponseTime: 0,
    successRate: 0,
    mobileVsDesktop: {
      mobileBetter: 0,
      desktopBetter: 0,
      same: 0
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 통계 데이터 로드 시뮬레이션
    const loadStats = async () => {
      setIsLoading(true);
      
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalProducts: 89,
        mobileProducts: 67,
        desktopProducts: 22,
        todayChecks: 156,
        rankChanges: 34,
        averageResponseTime: 32.1,
        successRate: 94.2,
        mobileVsDesktop: {
          mobileBetter: 45,
          desktopBetter: 28,
          same: 16
        }
      });
      
      setIsLoading(false);
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'totalProducts': return '📦';
      case 'mobileProducts': return '📱';
      case 'desktopProducts': return '💻';
      case 'todayChecks': return '🔍';
      case 'rankChanges': return '📈';
      case 'averageResponseTime': return '⚡';
      case 'successRate': return '✅';
      case 'mobileVsDesktop': return '🔄';
      default: return '📊';
    }
  };

  const getStatColor = (statName: string, value: number) => {
    switch (statName) {
      case 'successRate':
        return value >= 95 ? 'text-green-600' : value >= 80 ? 'text-yellow-600' : 'text-red-600';
      case 'averageResponseTime':
        return value <= 30 ? 'text-green-600' : value <= 50 ? 'text-yellow-600' : 'text-red-600';
      case 'rankChanges':
        return value > 0 ? 'text-blue-600' : 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatUnit = (statName: string) => {
    switch (statName) {
      case 'averageResponseTime': return '초';
      case 'successRate': return '%';
      case 'totalProducts':
      case 'mobileProducts':
      case 'desktopProducts':
      case 'todayChecks':
      case 'rankChanges':
        return '개';
      default: return '';
    }
  };

  const formatStatValue = (statName: string, value: number) => {
    switch (statName) {
      case 'successRate':
      case 'averageResponseTime':
        return value.toFixed(1);
      default:
        return value.toLocaleString();
    }
  };

  const statConfigs = [
    { key: 'totalProducts', label: '총 상품 수', description: '추적 중인 상품' },
    { key: 'mobileProducts', label: '모바일 상품', description: '모바일 최적화' },
    { key: 'desktopProducts', label: '데스크톱 상품', description: 'PC 전용' },
    { key: 'todayChecks', label: '오늘 체크', description: '24시간 내 순위 확인' },
    { key: 'rankChanges', label: '랭킹 변화', description: '순위 변동 감지' },
    { key: 'averageResponseTime', label: '평균 응답시간', description: '순위 조회 속도' },
    { key: 'successRate', label: '성공률', description: '정상 처리 비율' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* 기본 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statConfigs.map(({ key, label, description }) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                <span className="text-lg">{getStatIcon(key)}</span>
                <span>{label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-bold ${getStatColor(key, stats[key])}`}>
                  {formatStatValue(key, stats[key])}
                </span>
                <span className="text-sm text-gray-500">{getStatUnit(key)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
              
              {/* 변화 표시 (시뮬레이션) */}
              {key === 'rankChanges' && stats[key] > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <span className="text-green-600 text-sm">🔼 +{stats[key]}</span>
                  <span className="text-xs text-gray-500">이번 주</span>
                </div>
              )}
              
              {key === 'successRate' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stats[key] >= 95 ? 'bg-green-600' : 
                        stats[key] >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${stats[key]}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 모바일 vs 데스크톱 비교 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>🔄</span>
            <span>모바일 vs 데스크톱 순위 비교</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.mobileVsDesktop.mobileBetter}
              </div>
              <div className="text-sm text-blue-700 mb-1">모바일이 더 높음</div>
              <div className="text-xs text-blue-600">
                {Math.round((stats.mobileVsDesktop.mobileBetter / stats.totalProducts) * 100)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.mobileVsDesktop.desktopBetter}
              </div>
              <div className="text-sm text-orange-700 mb-1">데스크톱이 더 높음</div>
              <div className="text-xs text-orange-600">
                {Math.round((stats.mobileVsDesktop.desktopBetter / stats.totalProducts) * 100)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {stats.mobileVsDesktop.same}
              </div>
              <div className="text-sm text-gray-700 mb-1">동일한 순위</div>
              <div className="text-xs text-gray-600">
                {Math.round((stats.mobileVsDesktop.same / stats.totalProducts) * 100)}%
              </div>
            </div>
          </div>
          
          {/* 인사이트 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">💡 인사이트</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {stats.mobileVsDesktop.mobileBetter > stats.mobileVsDesktop.desktopBetter ? (
                <p>• 모바일 사용자가 많은 키워드에서는 모바일 최적화가 효과적입니다</p>
              ) : (
                <p>• 데스크톱 사용자가 많은 키워드에서는 PC 최적화가 효과적입니다</p>
              )}
              <p>• 총 {stats.totalProducts}개 상품 중 {stats.rankChanges}개에서 순위 변화가 감지되었습니다</p>
              <p>• 평균 응답시간 {stats.averageResponseTime}초로 쿠팡APP 특화 크롤링이 진행 중입니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
