'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Search, Link as LinkIcon, Package, DollarSign, TrendingUp, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import Navigation from '@/components/Navigation';

// 키워드 데이터 타입
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<KeywordData | null>(null);
  const [formData, setFormData] = useState({
    slot_type: 'coupang',
    keyword: '',
    link_url: '',
    slot_count: '1',
    current_rank: ''
  });

  useEffect(() => {
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

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slot_count: parseInt(formData.slot_count),
          current_rank: formData.current_rank ? parseInt(formData.current_rank) : null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadKeywords();
        setIsAddDialogOpen(false);
        setFormData({
          slot_type: 'coupang',
          keyword: '',
          link_url: '',
          slot_count: '1',
          current_rank: ''
        });
      } else {
        console.error('키워드 추가 실패:', result.error);
        alert('키워드 추가에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('키워드 추가 오류:', error);
      alert('키워드 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword) return;

    try {
      const response = await fetch(`/api/keywords/${editingKeyword.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          slot_count: parseInt(formData.slot_count),
          current_rank: formData.current_rank ? parseInt(formData.current_rank) : null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await loadKeywords();
        setIsEditDialogOpen(false);
        setEditingKeyword(null);
        setFormData({
          slot_type: 'coupang',
          keyword: '',
          link_url: '',
          slot_count: '1',
          current_rank: ''
        });
      } else {
        console.error('키워드 수정 실패:', result.error);
        alert('키워드 수정에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('키워드 수정 오류:', error);
      alert('키워드 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    if (!confirm('정말로 이 키워드를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await loadKeywords();
      } else {
        console.error('키워드 삭제 실패:', result.error);
        alert('키워드 삭제에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('키워드 삭제 오류:', error);
      alert('키워드 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditDialog = (keyword: KeywordData) => {
    setEditingKeyword(keyword);
    setFormData({
      slot_type: keyword.slot_type,
      keyword: keyword.keyword,
      link_url: keyword.link_url,
      slot_count: keyword.slot_count?.toString() || '1',
      current_rank: keyword.current_rank?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <p className="text-gray-600">키워드별 순위 체크 현황을 확인할 수 있습니다.</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 키워드</p>
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
                    <p className="text-sm font-medium text-gray-600">전체 키워드</p>
                    <p className="text-2xl font-bold text-gray-900">{totalKeywords}개</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 키워드 목록 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">키워드 목록</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    키워드 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 키워드 추가</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddKeyword} className="space-y-4">
                    <div>
                      <Label htmlFor="slot_type">슬롯 유형</Label>
                      <select
                        id="slot_type"
                        value={formData.slot_type}
                        onChange={(e) => setFormData({ ...formData, slot_type: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="coupang">쿠팡</option>
                        <option value="naver">네이버</option>
                        <option value="gmarket">G마켓</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="keyword">검색어</Label>
                      <Input
                        id="keyword"
                        value={formData.keyword}
                        onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                        placeholder="검색어를 입력하세요"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slot_count">슬롯 개수</Label>
                      <Input
                        id="slot_count"
                        type="number"
                        min="1"
                        value={formData.slot_count}
                        onChange={(e) => setFormData({ ...formData, slot_count: e.target.value })}
                        placeholder="슬롯 개수"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="link_url">링크 주소</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder="상품 링크를 입력하세요"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_rank">현재 순위</Label>
                      <Input
                        id="current_rank"
                        type="number"
                        value={formData.current_rank}
                        onChange={(e) => setFormData({ ...formData, current_rank: e.target.value })}
                        placeholder="현재 순위 (선택사항)"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        취소
                      </Button>
                      <Button type="submit">추가</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
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
                            <Badge className="bg-blue-100 text-blue-800">{keyword.slot_type}</Badge>
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
                            <div className="max-w-xs truncate" title={keyword.link_url}>
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
                              {keyword.current_rank ? `${keyword.current_rank}위` : '미확인'}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {formatDate(keyword.last_check_date)}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(keyword)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteKeyword(keyword.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

          {/* 수정 다이얼로그 */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>키워드 수정</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditKeyword} className="space-y-4">
                <div>
                  <Label htmlFor="edit_slot_type">슬롯 유형</Label>
                  <select
                    id="edit_slot_type"
                    value={formData.slot_type}
                    onChange={(e) => setFormData({ ...formData, slot_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="coupang">쿠팡</option>
                    <option value="naver">네이버</option>
                    <option value="gmarket">G마켓</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit_keyword">검색어</Label>
                  <Input
                    id="edit_keyword"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    placeholder="검색어를 입력하세요"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_slot_count">슬롯 개수</Label>
                  <Input
                    id="edit_slot_count"
                    type="number"
                    min="1"
                    value={formData.slot_count}
                    onChange={(e) => setFormData({ ...formData, slot_count: e.target.value })}
                    placeholder="슬롯 개수"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_link_url">링크 주소</Label>
                  <Input
                    id="edit_link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="상품 링크를 입력하세요"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_current_rank">현재 순위</Label>
                  <Input
                    id="edit_current_rank"
                    type="number"
                    value={formData.current_rank}
                    onChange={(e) => setFormData({ ...formData, current_rank: e.target.value })}
                    placeholder="현재 순위 (선택사항)"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit">수정</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
