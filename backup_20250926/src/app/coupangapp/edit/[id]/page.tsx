'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// 슬롯 번들 인터페이스 (ERD 기반)
interface SlotBundle {
  id: string;
  userId: string;
  customerName: string;
  groupId: string;
  groupName: string;
  serviceId: string;
  serviceName: string;
  slotCount: number;
  startDate: string;
  expireDate: string;
  status: '작동중' | '만료' | '정지' | '취소';
  memo: string;
  createdAt: string;
  linkUrl: string;
  currentRank?: number;
  initialRank?: number;
  remainingDays: number;
  paymentAmount: number;
  paymentType: '현금' | '카드' | '외상';
  refundStatus: boolean;
  keyword: string;
}

export default function SlotEditPage() {
  const router = useRouter();
  const params = useParams();
  const slotId = params.id as string;
  
  // 폼 상태
  const [form, setForm] = useState<Partial<SlotBundle>>({
    id: '',
    userId: '',
    customerName: '',
    groupId: '',
    groupName: '',
    serviceId: '',
    serviceName: '',
    slotCount: 1,
    startDate: '',
    expireDate: '',
    status: '작동중',
    memo: '',
    linkUrl: '',
    keyword: '',
    paymentType: '현금',
    paymentAmount: 0,
    refundStatus: false
  });

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 고객 목록 (예시)
  const customers = [
    { id: 'user001', name: '김고객', groupId: 'group1', groupName: '총판A' },
    { id: 'user002', name: '이고객', groupId: 'group2', groupName: '총판B' },
    { id: 'user003', name: '박고객', groupId: '본사', groupName: '본사' }
  ];

  // 서비스 목록
  const services = [
    { id: 'coupang_app', name: '쿠팡 APP' },
    { id: 'naver_shopping', name: '네이버 쇼핑 Real' },
    { id: 'coupang_web', name: '쿠팡 웹' }
  ];

  // 슬롯 데이터 불러오기 (예시)
  useEffect(() => {
    // 실제로는 API 호출하여 데이터 불러오기
    const mockSlotData: SlotBundle = {
      id: slotId,
      userId: 'user001',
      customerName: '김고객',
      groupId: 'group1',
      groupName: '총판A',
      serviceId: 'coupang_app',
      serviceName: '쿠팡 APP',
      slotCount: 5,
      startDate: '2024-01-15',
      expireDate: '2024-02-14',
      status: '작동중',
      memo: '전자렌지 선반 랭킹 상승',
      createdAt: '2024-01-15',
      linkUrl: 'https://www.coupang.com/vp/products/8470784672',
      currentRank: 15,
      initialRank: 18,
      remainingDays: 25,
      paymentAmount: 50000,
      paymentType: '현금',
      refundStatus: false,
      keyword: '전자렌지 선반'
    };

    setForm(mockSlotData);
    setIsLoading(false);
  }, [slotId]);

  // 고객 선택 시 자동으로 그룹 정보 설정
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setForm(prev => ({
        ...prev,
        userId: customer.id,
        customerName: customer.name,
        groupId: customer.groupId,
        groupName: customer.groupName
      }));
    }
  };

  // 서비스 선택 시 자동으로 서비스명 설정
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setForm(prev => ({
        ...prev,
        serviceId: service.id,
        serviceName: service.name
      }));
    }
  };

  // 만료일 계산
  const calculateExpireDate = () => {
    if (form.startDate) {
      const startDate = new Date(form.startDate);
      const expireDate = new Date(startDate);
      // 기본 30일로 설정 (실제로는 DB에서 가져온 값 사용)
      expireDate.setDate(startDate.getDate() + 30);
      return expireDate.toISOString().split('T')[0];
    }
    return '';
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    if (!form.userId || !form.linkUrl || !form.slotCount || !form.startDate) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 실제로는 API 호출하여 DB에 업데이트
    console.log('슬롯 수정:', {
      ...form,
      expireDate: calculateExpireDate()
    });

    // 성공 시 슬롯 관리 페이지로 이동
    alert('슬롯이 성공적으로 수정되었습니다.');
    router.push('/coupangapp');
  };

  // 취소
  const handleCancel = () => {
    router.push('/coupangapp');
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            슬롯 수정
          </h1>
          <p className="text-lg text-gray-600">
            기존 슬롯 정보를 수정하세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 기본 정보 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customer">고객 선택 *</Label>
                  <Select value={form.userId} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="고객을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.groupName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.customerName && (
                    <div className="mt-2 text-sm text-gray-600">
                      선택된 고객: {form.customerName} ({form.groupName})
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="service">서비스 유형 *</Label>
                  <Select value={form.serviceId} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="서비스를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="keyword">검색어(상품키워드)</Label>
                  <Input
                    id="keyword"
                    placeholder="예: 전자렌지 선반"
                    value={form.keyword || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, keyword: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="linkUrl">링크주소(쿠팡 실제 URL) *</Label>
                  <Input
                    id="linkUrl"
                    type="url"
                    placeholder="https://www.coupang.com/vp/products/..."
                    value={form.linkUrl || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 슬롯 설정 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>슬롯 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="slotCount">슬롯 개수 *</Label>
                  <Input
                    id="slotCount"
                    type="number"
                    min="1"
                    value={form.slotCount || 1}
                    onChange={(e) => setForm(prev => ({ ...prev, slotCount: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">시작일 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="expireDate">만료일</Label>
                  <Input
                    id="expireDate"
                    type="date"
                    value={form.expireDate || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, expireDate: e.target.value }))}
                  />
                </div>
              </div>

              {form.startDate && form.expireDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>시작일:</strong> {form.startDate} | <strong>만료일:</strong> {form.expireDate}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 상태 및 결제 정보 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>상태 및 결제 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="status">상태</Label>
                  <Select value={form.status} onValueChange={(value: '작동중' | '만료' | '정지' | '취소') => 
                    setForm(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="작동중">작동중</SelectItem>
                      <SelectItem value="만료">만료</SelectItem>
                      <SelectItem value="정지">정지</SelectItem>
                      <SelectItem value="취소">취소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentType">결제 수단</Label>
                  <Select value={form.paymentType} onValueChange={(value: '현금' | '카드' | '외상') => 
                    setForm(prev => ({ ...prev, paymentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="현금">현금</SelectItem>
                      <SelectItem value="카드">카드</SelectItem>
                      <SelectItem value="외상">외상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentAmount">결제 금액</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={form.paymentAmount || 0}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentAmount: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="currentRank">현재 순위</Label>
                  <Input
                    id="currentRank"
                    type="number"
                    placeholder="현재 순위"
                    value={form.currentRank || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, currentRank: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refundStatus"
                    checked={form.refundStatus || false}
                    onCheckedChange={(checked) => 
                      setForm(prev => ({ ...prev, refundStatus: checked as boolean }))
                    }
                  />
                  <Label htmlFor="refundStatus">환불 여부</Label>
                </div>
                {form.refundStatus && (
                  <div className="mt-2 text-sm text-orange-600">
                    환불 처리된 슬롯입니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 메모 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>메모</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="관리자가 참고용으로 적는 내용을 입력하세요"
                rows={4}
                value={form.memo || ''}
                onChange={(e) => setForm(prev => ({ ...prev, memo: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              슬롯 수정
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
