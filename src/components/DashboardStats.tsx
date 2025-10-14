'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  totalProducts: number;
  todayChecks: number;
  rankChanges: number;
  averageResponseTime: number;
  successRate: number;
  activeUsers: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    todayChecks: 0,
    rankChanges: 0,
    averageResponseTime: 0,
    successRate: 0,
    activeUsers: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 통계 데이터 로드 시뮬레이션
    const loadStats = async () => {
      setIsLoading(true);
      
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalProducts: 127,
        todayChecks: 89,
        rankChanges: 23,
        averageResponseTime: 28.5,
        successRate: 96.8,
        activeUsers: 45
      });
      
      setIsLoading(false);
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
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
      case 'todayChecks': return '🔍';
      case 'rankChanges': return '📈';
      case 'averageResponseTime': return '⚡';
      case 'successRate': return '✅';
      case 'activeUsers': return '👥';
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
      case 'todayChecks':
      case 'rankChanges':
      case 'activeUsers':
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
    { key: 'todayChecks', label: '오늘 체크', description: '24시간 내 순위 확인' },
    { key: 'rankChanges', label: '랭킹 변화', description: '순위 변동 감지' },
    { key: 'averageResponseTime', label: '평균 응답시간', description: '순위 조회 속도' },
    { key: 'successRate', label: '성공률', description: '정상 처리 비율' },
    { key: 'activeUsers', label: '활성 사용자', description: '현재 접속 중' }
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
  );
}
