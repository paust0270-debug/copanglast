"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingCart, 
  Plus, 
  X,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Edit,
  Save,
  Filter,
  Search
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Slot {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type?: string;
  payer_name?: string;
  payment_amount?: number;
  payment_date?: string;
  usage_days?: number;
  memo?: string;
  status: 'active' | 'expired' | 'suspended';
  distributor?: string;
  created_at: string;
  updated_at?: string;
  
  // 계산된 필드들
  extension_count?: number;
  total_used_days?: number;
  remaining_days?: number;
  expiry_date?: string;
  username?: string; // customer_name과 동일
}

export function SlotsPageContent() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Slot>>({});
  const [selectedDistributor, setSelectedDistributor] = useState<string>('all');
  const [selectedSlotType, setSelectedSlotType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const distributors = ['총판선택', '본사'];
  const slotTypes = ['쿠팡', '쿠팡VIP', '쿠팡APP', '네이버쇼핑', '플레이스', '오늘의집', '알리'];

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    try {
      setLoading(true);
      const response = await fetch('/api/slots');
      if (!response.ok) {
        throw new Error('Failed to fetch slots');
      }
      const result = await response.json();
      
      // API 응답 구조에 맞게 데이터 추출
      if (result.success && Array.isArray(result.data)) {
        setSlots(result.data);
      } else if (Array.isArray(result)) {
        // 직접 배열로 응답하는 경우
        setSlots(result);
      } else {
        console.error('Unexpected API response structure:', result);
        setSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('슬롯 데이터를 불러오는데 실패했습니다.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }

  const handleEditSlot = (slot: Slot) => {
    setEditingId(slot.id);
    setEditForm({
      slot_type: slot.slot_type,
      slot_count: slot.slot_count,
      payment_amount: slot.payment_amount,
      memo: slot.memo,
      status: slot.status
    });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update slot');
      }

      await fetchSlots();
      setEditingId(null);
      setEditForm({});
      alert("슬롯 정보가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error('Error updating slot:', error);
      alert("슬롯 정보 수정에 실패했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("정말로 이 슬롯을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/slots/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete slot');
      }

      await fetchSlots();
      alert("슬롯이 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert("슬롯 삭제에 실패했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case '구동중':
        return <Badge className="bg-green-500 text-white">구동중</Badge>;
      case 'expired':
      case '만료':
        return <Badge className="bg-red-500 text-white">만료</Badge>;
      case 'suspended':
      case '정지':
        return <Badge className="bg-yellow-500 text-white">정지</Badge>;
      case 'inactive':
        return <Badge className="bg-green-500 text-white">구동중</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 필터링된 슬롯 목록
  const filteredSlots = slots.filter(slot => {
    const matchesDistributor = selectedDistributor === 'all' || slot.distributor === selectedDistributor;
    const matchesSlotType = selectedSlotType === 'all' || slot.slot_type === selectedSlotType;
    const matchesKeyword = searchKeyword === '' || 
      (slot.customer_name && slot.customer_name.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (slot.memo && slot.memo.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    return matchesDistributor && matchesSlotType && matchesKeyword;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">슬롯 관리</h1>
        </div>

        {/* 필터 섹션 */}
        <Card className="mb-6">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 총판 선택 */}
              <div>
                <Label htmlFor="distributor" className="text-sm font-medium">총판 선택</Label>
                <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="총판을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {distributors.map(distributor => (
                      <SelectItem key={distributor} value={distributor}>{distributor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 슬롯 유형 */}
              <div>
                <Label htmlFor="slotType" className="text-sm font-medium">슬롯 유형</Label>
                <Select value={selectedSlotType} onValueChange={setSelectedSlotType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="슬롯 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {slotTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 검색 */}
              <div>
                <Label htmlFor="search" className="text-sm font-medium">검색</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="아이디 또는 메모 검색"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 슬롯 목록 테이블 */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              슬롯 목록 ({filteredSlots.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">순번</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">아이디</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">슬롯유형</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">슬롯수</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">입금액</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">연장횟수</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">총사용일수</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">남은일수</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">등록일</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">만료일</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">메모</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">상태</th>
                      <th className="border border-gray-300 p-3 text-center text-sm font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlots.length > 0 ? filteredSlots.map((slot, index) => (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 text-center text-sm">{index + 1}</td>
                        <td className="border border-gray-300 p-3 text-center text-sm font-medium">{slot.customer_name}</td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {editingId === slot.id ? (
                            <Select 
                              value={editForm.slot_type || slot.slot_type} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, slot_type: value }))}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {slotTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="text-xs">{slot.slot_type}</Badge>
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {editingId === slot.id ? (
                            <Input 
                              type="number"
                              min="1"
                              value={editForm.slot_count || slot.slot_count} 
                              onChange={(e) => setEditForm(prev => ({ ...prev, slot_count: parseInt(e.target.value) || 1 }))}
                              className="w-16 h-8 text-xs text-center"
                            />
                          ) : (
                            slot.slot_count
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {editingId === slot.id ? (
                            <Input 
                              type="number"
                              min="0"
                              value={editForm.payment_amount || slot.payment_amount || 0} 
                              onChange={(e) => setEditForm(prev => ({ ...prev, payment_amount: parseInt(e.target.value) || 0 }))}
                              className="w-20 h-8 text-xs text-center"
                            />
                          ) : (
                            <span className="text-green-600 font-medium">{formatCurrency(slot.payment_amount || 0)}원</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">{slot.extension_count || 0}</td>
                        <td className="border border-gray-300 p-3 text-center text-sm">{slot.total_used_days || slot.usage_days || 0}일</td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            (slot.remaining_days || 0) <= 7 ? 'bg-red-100 text-red-800' : 
                            (slot.remaining_days || 0) <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {slot.remaining_days || 0}일
                          </span>
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">{formatDate(slot.created_at)}</td>
                        <td className="border border-gray-300 p-3 text-center text-sm">{slot.expiry_date ? formatDate(slot.expiry_date) : '-'}</td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {editingId === slot.id ? (
                            <Input 
                              value={editForm.memo || slot.memo || ''} 
                              onChange={(e) => setEditForm(prev => ({ ...prev, memo: e.target.value }))}
                              className="w-32 h-8 text-xs"
                              placeholder="메모 입력"
                            />
                          ) : (
                            <div className="max-w-32 truncate" title={slot.memo}>
                              {slot.memo || '-'}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          {editingId === slot.id ? (
                            <Select 
                              value={editForm.status || slot.status} 
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}
                            >
                              <SelectTrigger className="w-20 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">활성</SelectItem>
                                <SelectItem value="expired">만료</SelectItem>
                                <SelectItem value="suspended">정지</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge(slot.status)
                          )}
                        </td>
                        <td className="border border-gray-300 p-3 text-center text-sm">
                          <div className="flex justify-center space-x-2">
                            {editingId === slot.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveEdit(slot.id)}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                  title="저장"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  title="취소"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSlot(slot)}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                  title="수정"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  title="삭제"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-gray-500">
                          등록된 슬롯이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
