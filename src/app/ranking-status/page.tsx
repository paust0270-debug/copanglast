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

// 키워드 데이터 타입 정의 (실제 DB 스키마와 일치)
interface KeywordData {
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

export default function RankingStatusPage() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalKeywords, setTotalKeywords] = useState(0);

  useEffect(() => {
    // 실제 API에서 키워드 데이터 로드
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      console.log('🔄 키워드 목록 조회 중...');

      const response = await fetch('/api/keywords');
      const result = await response.json();

      if (result.success) {
        console.log('✅ 키워드 목록 조회 완료:', result.data);
        setKeywords(result.data);
        setTotalKeywords(result.data.length);
      } else {
        console.error('❌ 키워드 목록 조회 실패:', result.error);
        setKeywords([]);
        setTotalKeywords(0);
      }
    } catch (error) {
      console.error('❌ 키워드 목록 조회 예외:', error);
      setKeywords([]);
      setTotalKeywords(0);
    } finally {
      setLoading(false);
    }
  };

  const getSlotTypeBadge = (slotType: string) => {
    return slotType === 'coupang' ? (
      <Badge className="bg-orange-100 text-orange-800">쿠팡</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">{slotType}</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getRankDisplay = (rank: number | null) => {
    if (rank === null) return '-';
    return `${rank}위`;
  };

  if (loading) {
    return (
      <div className="wrapper">
        <Navigation />
        <div className="content-wrapper">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <Navigation />
      <div className="content-wrapper">
        <div className="container mx-auto p-2 pt-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  순위체크 현황
                </h1>
                <p className="text-gray-600">
                  키워드 순위 체크 현황을 확인할 수 있습니다.
                </p>
              </div>
              <button
                onClick={loadKeywords}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>

          {/* 대기열 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">대기열</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {keywords.length}개
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Search className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      총 키워드
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalKeywords}개
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 키워드 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">키워드 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">등록된 키워드가 없습니다.</p>
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
                      {keywords.map((keyword, index) => (
                        <tr key={keyword.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getSlotTypeBadge(keyword.slot_type)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {keyword.keyword}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Package className="h-3 w-3 mr-1 text-gray-400" />
                              {keyword.slot_count}개
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div
                              className="max-w-xs truncate"
                              title={keyword.link_url}
                            >
                              <a
                                href={keyword.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {keyword.link_url}
                              </a>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-gray-400" />
                              {getRankDisplay(keyword.current_rank)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {formatDate(keyword.last_check_date)}
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
    </div>
  );
}
