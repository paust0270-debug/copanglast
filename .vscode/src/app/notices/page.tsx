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

// 공지사항 데이터 타입
interface NoticeData {
  id: number;
  title: string;
  content: string;
  target: string;
  created_at: string;
  updated_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeData | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target: '일반'
  });

  // 타겟 목록을 반환하는 함수
  const getTargetList = () => {
    return ['일반', '중요', '긴급'];
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      console.log('🔄 공지사항 목록 조회 중...');
      
      // 임시 데이터 (실제로는 API 호출)
      const mockData: NoticeData[] = [
        {
          id: 1,
          title: '시스템 점검 안내',
          content: '시스템 점검으로 인한 서비스 일시 중단 안내입니다.',
          target: '중요',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: '새로운 기능 업데이트',
          content: '사용자 편의를 위한 새로운 기능이 추가되었습니다.',
          target: '일반',
          created_at: '2024-01-14T15:30:00Z',
          updated_at: '2024-01-14T15:30:00Z'
        }
      ];
      
      setNotices(mockData);
    } catch (error) {
      console.error('❌ 공지사항 목록 조회 예외:', error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 실제로는 API 호출
      const newNotice: NoticeData = {
        id: Date.now(),
        title: formData.title,
        content: formData.content,
        target: formData.target,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setNotices(prev => [newNotice, ...prev]);
      setIsAddDialogOpen(false);
      setFormData({
        title: '',
        content: '',
        target: '일반'
      });
    } catch (error) {
      console.error('공지사항 추가 오류:', error);
      alert('공지사항 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;

    try {
      // 실제로는 API 호출
      setNotices(prev => prev.map(notice => 
        notice.id === editingNotice.id 
          ? { ...notice, ...formData, updated_at: new Date().toISOString() }
          : notice
      ));
      
      setIsEditDialogOpen(false);
      setEditingNotice(null);
      setFormData({
        title: '',
        content: '',
        target: '일반'
      });
    } catch (error) {
      console.error('공지사항 수정 오류:', error);
      alert('공지사항 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteNotice = async (id: number) => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;

    try {
      // 실제로는 API 호출
      setNotices(prev => prev.filter(notice => notice.id !== id));
    } catch (error) {
      console.error('공지사항 삭제 오류:', error);
      alert('공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditDialog = (notice: NoticeData) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      target: notice.target
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

  const getTargetBadgeColor = (target: string) => {
    switch (target) {
      case '긴급':
        return 'bg-red-100 text-red-800';
      case '중요':
        return 'bg-orange-100 text-orange-800';
      case '일반':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotices = notices;

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항</h1>
            <p className="text-gray-600">중요한 공지사항을 확인할 수 있습니다.</p>
          </div>

          {/* 추가 버튼 */}
          <div className="flex justify-end items-center mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  공지사항 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 공지사항 추가</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddNotice} className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="공지사항 제목을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="target">대상</Label>
                    <select
                      id="target"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {getTargetList().map((target, index) => (
                        <option key={`add-${target}-${index}`} value={target}>{target}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="content">내용</Label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요"
                      className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
                      required
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
          </div>

          {/* 공지사항 목록 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">공지사항 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredNotices.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotices.map((notice) => (
                    <div key={notice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                          <Badge className={getTargetBadgeColor(notice.target)}>
                            {notice.target}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(notice)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{notice.content}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        작성일: {formatDate(notice.created_at)}
                        {notice.updated_at !== notice.created_at && (
                          <>
                            <span className="mx-2">|</span>
                            수정일: {formatDate(notice.updated_at)}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 수정 다이얼로그 */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>공지사항 수정</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditNotice} className="space-y-4">
                <div>
                  <Label htmlFor="edit_title">제목</Label>
                  <Input
                    id="edit_title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="공지사항 제목을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_target">대상</Label>
                  <select
                    id="edit_target"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {getTargetList().map((target, index) => (
                      <option key={`edit-${target}-${index}`} value={target}>{target}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit_content">내용</Label>
                  <textarea
                    id="edit_content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="공지사항 내용을 입력하세요"
                    className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
                    required
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
