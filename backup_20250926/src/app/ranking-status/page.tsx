'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Search, Link as LinkIcon, Package, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';

// 임시 데이터 타입 정의
interface KeywordData {
  id: number;
  slotType: string;
  searchTerm: string;
  linkUrl: string;
  productCode: string;
  priceComparison: string;
  previousRank: number;
  previousCheckDate: string;
}

export default function RankingStatusPage() {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalKeywords, setTotalKeywords] = useState(0);

  useEffect(() => {
    // 임시 데이터 로드
    loadMockData();
  }, []);

  const loadMockData = () => {
    // 임시 데이터 생성
    const mockData: KeywordData[] = [
      {
        id: 1,
        slotType: 'VIP',
        searchTerm: '노트북',
        linkUrl: 'https://www.coupang.com/vp/products/123456',
        productCode: 'CP001',
        priceComparison: '저가',
        previousRank: 5,
        previousCheckDate: '2024-01-15'
      },
      {
        id: 2,
        slotType: '일반',
        searchTerm: '스마트폰',
        linkUrl: 'https://www.coupang.com/vp/products/789012',
        productCode: 'CP002',
        priceComparison: '고가',
        previousRank: 12,
        previousCheckDate: '2024-01-14'
      },
      {
        id: 3,
        slotType: 'VIP',
        searchTerm: '헤드폰',
        linkUrl: 'https://www.coupang.com/vp/products/345678',
        productCode: 'CP003',
        priceComparison: '중가',
        previousRank: 8,
        previousCheckDate: '2024-01-13'
      },
      {
        id: 4,
        slotType: '일반',
        searchTerm: '키보드',
        linkUrl: 'https://www.coupang.com/vp/products/901234',
        productCode: 'CP004',
        priceComparison: '저가',
        previousRank: 15,
        previousCheckDate: '2024-01-12'
      },
      {
        id: 5,
        slotType: 'VIP',
        searchTerm: '마우스',
        linkUrl: 'https://www.coupang.com/vp/products/567890',
        productCode: 'CP005',
        priceComparison: '고가',
        previousRank: 3,
        previousCheckDate: '2024-01-11'
      }
    ];

    setKeywords(mockData);
    setTotalKeywords(mockData.length);
    setLoading(false);
  };

  const getSlotTypeBadge = (slotType: string) => {
    return slotType === 'VIP' ? (
      <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">일반</Badge>
    );
  };

  const getPriceComparisonBadge = (priceComparison: string) => {
    switch (priceComparison) {
      case '저가':
        return <Badge className="bg-green-100 text-green-800">저가</Badge>;
      case '중가':
        return <Badge className="bg-yellow-100 text-yellow-800">중가</Badge>;
      case '고가':
        return <Badge className="bg-red-100 text-red-800">고가</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priceComparison}</Badge>;
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">순위체크 현황</h1>
            <p className="text-gray-600">키워드 순위 체크 현황을 확인할 수 있습니다.</p>
          </div>

          {/* 대기열 정보 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">대기열</p>
                    <p className="text-2xl font-bold text-gray-900">{keywords.length}개</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Search className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 키워드</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKeywords}개</p>
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
                          키워드ID
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          슬롯유형
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          검색어
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          링크주소
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상품코드
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          가격비교
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
                      {keywords.map((keyword) => (
                        <tr key={keyword.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {keyword.id}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getSlotTypeBadge(keyword.slotType)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {keyword.searchTerm}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="max-w-xs truncate" title={keyword.linkUrl}>
                              <a 
                                href={keyword.linkUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {keyword.linkUrl}
                              </a>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Package className="h-3 w-3 mr-1 text-gray-400" />
                              {keyword.productCode}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getPriceComparisonBadge(keyword.priceComparison)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1 text-gray-400" />
                              {keyword.previousRank}위
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {keyword.previousCheckDate}
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
