'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Search,
  Link as LinkIcon,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import Navigation from '@/components/Navigation';

// 트래픽 데이터 타입 정의 (keywords 테이블과 동일한 구조)
interface TrafficData {
  id: number;
  slot_type: string;
  keyword: string;
  link_url: string;
  slot_count: number;
  current_rank: number | null;
  last_check_date: string;
  created_at: string;
  updated_at: string;
}

export default function TrafficStatusPage() {
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTraffic, setTotalTraffic] = useState(0);

  useEffect(() => {
    // 실제 API에서 트래픽 데이터 로드
    loadTraffic();
  }, []);

  const loadTraffic = async () => {
    try {
      setLoading(true);
      console.log('🔄 트래픽 목록 조회 중...');

      const response = await fetch('/api/traffic');
      const result = await response.json();

      if (result.success) {
        console.log('✅ 트래픽 목록 조회 완료:', result.data);
        setTraffic(result.data);
        setTotalTraffic(result.data.length);
      } else {
        console.error('❌ 트래픽 목록 조회 실패:', result.error);
        setTraffic([]);
        setTotalTraffic(0);
      }
    } catch (error) {
      console.error('❌ 트래픽 목록 조회 예외:', error);
      setTraffic([]);
      setTotalTraffic(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">트래픽 현황을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">트래픽 현황</h1>
          <p className="text-gray-600">
            등록된 트래픽 키워드들의 현황을 확인할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 트래픽</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTraffic}</div>
              <p className="text-xs text-muted-foreground">등록된 키워드 수</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 트래픽</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {traffic.filter(t => t.current_rank !== null).length}
              </div>
              <p className="text-xs text-muted-foreground">순위 확인 완료</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기 중</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {traffic.filter(t => t.current_rank === null).length}
              </div>
              <p className="text-xs text-muted-foreground">순위 확인 대기</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">상위권</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  traffic.filter(
                    t => t.current_rank !== null && t.current_rank <= 10
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">1-10위</p>
            </CardContent>
          </Card>
        </div>

        {/* 트래픽 현황 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">트래픽 현황 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {traffic.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 트래픽이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        순번
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        슬롯유형
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        검색어
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        슬롯개수
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        링크주소
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이전순위
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이전체크일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {traffic.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Badge variant="outline">{item.slot_type}</Badge>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.keyword}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-400" />
                            {item.slot_count}개
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div
                            className="max-w-xs truncate"
                            title={item.link_url}
                          >
                            <a
                              href={item.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {item.link_url}
                            </a>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-gray-400" />
                            {item.current_rank ? `${item.current_rank}위` : '-'}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDate(item.last_check_date)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
