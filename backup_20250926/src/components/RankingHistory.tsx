'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RankingData {
  date: string;
  rank: number;
  change: number;
}

interface ProductHistory {
  id: string;
  productName: string;
  keyword: string;
  history: RankingData[];
  currentRank: number;
  previousRank: number;
}

export default function RankingHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [mockData] = useState<ProductHistory[]>([
    {
      id: '1',
      productName: '통풍치료제',
      keyword: '통풍',
      currentRank: 15,
      previousRank: 23,
      history: [
        { date: '2024-01-01', rank: 25, change: 0 },
        { date: '2024-01-02', rank: 22, change: -3 },
        { date: '2024-01-03', rank: 20, change: -2 },
        { date: '2024-01-04', rank: 18, change: -2 },
        { date: '2024-01-05', rank: 23, change: 5 },
        { date: '2024-01-06', rank: 19, change: -4 },
        { date: '2024-01-07', rank: 15, change: -4 },
      ]
    },
    {
      id: '2',
      productName: '비타민D',
      keyword: '비타민',
      currentRank: 8,
      previousRank: 12,
      history: [
        { date: '2024-01-01', rank: 15, change: 0 },
        { date: '2024-01-02', rank: 14, change: -1 },
        { date: '2024-01-03', rank: 11, change: -3 },
        { date: '2024-01-04', rank: 9, change: -2 },
        { date: '2024-01-05', rank: 12, change: 3 },
        { date: '2024-01-06', rank: 10, change: -2 },
        { date: '2024-01-07', rank: 8, change: -2 },
      ]
    }
  ]);

  const getPeriodDays = (period: string) => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change < 0) return '🔼'; // 순위 상승 (숫자 감소)
    if (change > 0) return '🔽'; // 순위 하락 (숫자 증가)
    return '➖'; // 변화 없음
  };

  const getRankChangeColor = (change: number) => {
    if (change < 0) return 'text-green-600'; // 순위 상승
    if (change > 0) return 'text-red-600'; // 순위 하락
    return 'text-gray-500'; // 변화 없음
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex space-x-2">
        {(['7d', '30d', '90d'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' ? '7일' : period === '30d' ? '30일' : '90일'}
          </Button>
        ))}
      </div>

      {/* 순위 히스토리 */}
      {mockData.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{product.productName}</span>
              <span className="text-sm text-gray-500">키워드: {product.keyword}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 현재 순위 요약 */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">현재 순위</p>
                <p className="text-2xl font-bold text-blue-600">{product.currentRank}위</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">이전 순위</p>
                <p className="text-2xl font-bold text-gray-600">{product.previousRank}위</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">변화</p>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-2xl">{getRankChangeIcon(product.currentRank - product.previousRank)}</span>
                  <span className={`text-2xl font-bold ${getRankChangeColor(product.currentRank - product.previousRank)}`}>
                    {Math.abs(product.currentRank - product.previousRank)}
                  </span>
                </div>
              </div>
            </div>

            {/* 순위 변화 그래프 (간단한 버전) */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">순위 변화 추이</h4>
              <div className="flex items-end space-x-2 h-32">
                {product.history.slice(-getPeriodDays(selectedPeriod)).map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {formatDate(data.date)}
                    </div>
                    <div 
                      className="w-full bg-blue-200 rounded-t"
                      style={{ 
                        height: `${Math.max(10, (100 - data.rank) * 0.8)}px`,
                        backgroundColor: data.change < 0 ? '#10b981' : data.change > 0 ? '#ef4444' : '#6b7280'
                      }}
                    />
                    <div className="text-xs font-medium mt-1">{data.rank}위</div>
                    {data.change !== 0 && (
                      <div className={`text-xs ${getRankChangeColor(data.change)}`}>
                        {getRankChangeIcon(data.change)} {Math.abs(data.change)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 상세 통계 */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">최고 순위</p>
                <p className="text-lg font-semibold text-green-600">
                  {Math.min(...product.history.map(h => h.rank))}위
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">최저 순위</p>
                <p className="text-lg font-semibold text-red-600">
                  {Math.max(...product.history.map(h => h.rank))}위
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">평균 순위</p>
                <p className="text-lg font-semibold text-blue-600">
                  {Math.round(product.history.reduce((sum, h) => sum + h.rank, 0) / product.history.length)}위
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">변화 횟수</p>
                <p className="text-lg font-semibold text-purple-600">
                  {product.history.filter(h => h.change !== 0).length}회
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 빈 상태 */}
      {mockData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">순위 히스토리가 없습니다</h3>
            <p className="text-gray-500">
              상품을 추가하고 순위를 체크하면 변화 추이를 확인할 수 있습니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
