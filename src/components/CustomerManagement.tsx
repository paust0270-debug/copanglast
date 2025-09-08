'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  username: string;
  password_hash?: string; // 비밀번호 해시 (보안상 표시하지 않음)
  name: string;
  email?: string;
  status: 'pending' | 'active' | 'rejected';
  slot_used: number;
  additional_count: number;
  distributor: string;
  grade: string;
  phone?: string;
  kakao_id?: string;
  created_at: string;
  updated_at: string;
}

interface SlotWork {
  id: string;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string;
  payer_name?: string;
  amount: number;
  payment_date?: string;
  working_days: number;
  memo?: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slotWorks, setSlotWorks] = useState<SlotWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    slot_type: '쿠팡',
    slot_count: 1,
    payment_type: '입금',
    payer_name: '',
    amount: 0,
    payment_date: '',
    working_days: 30,
    memo: ''
  });

  // 고객 데이터 로드
  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('고객 데이터 로드 오류:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('고객 데이터 로드 중 예외 발생:', error);
    }
  };

  // 슬롯 작업 데이터 로드
  const loadSlotWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('slot_works')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('슬롯 작업 데이터 로드 오류:', error);
        return;
      }

      setSlotWorks(data || []);
    } catch (error) {
      console.error('슬롯 작업 데이터 로드 중 예외 발생:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadCustomers(), loadSlotWorks()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const addSlot = async (customerId: string) => {
    if (!newSlot.slot_type.trim() || newSlot.slot_count <= 0) {
      alert('슬롯 타입과 개수를 모두 입력해주세요.');
      return;
    }

    setIsAddingSlot(true);
    
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      // slots 테이블에 저장할 데이터 준비
      const now = new Date();
      const expiryDate = new Date(now.getTime() + newSlot.working_days * 24 * 60 * 60 * 1000);
      
      const slotData = {
        customer_id: customerId,
        customer_name: customer.name,
        slot_type: newSlot.slot_type,
        slot_count: newSlot.slot_count,
        payment_amount: newSlot.amount,
        usage_days: newSlot.working_days,
        memo: newSlot.memo,
        status: 'inactive' as const, // 슬롯 추가 시 기본 상태를 inactive로 설정
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      const { data, error } = await supabase
        .from('slots')
        .insert([slotData])
        .select()
        .single();

      if (error) {
        console.error('❌ 슬롯 추가 오류:', error);
        alert('슬롯 추가에 실패했습니다.');
        return;
      }

      console.log('✅ 슬롯 추가 성공! 저장된 데이터:', data);
      alert(`슬롯이 성공적으로 추가되었습니다!\n슬롯 ID: ${data.id}\n고객: ${data.customer_name}\n슬롯 유형: ${data.slot_type}\n슬롯 개수: ${data.slot_count}개`);

      // 고객 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          slot_used: customer.slot_used + newSlot.slot_count,
          additional_count: customer.additional_count + newSlot.slot_count
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('고객 정보 업데이트 오류:', updateError);
      }

      // 데이터 다시 로드
      await Promise.all([loadCustomers(), loadSlotWorks()]);

      setNewSlot({
        slot_type: '쿠팡',
        slot_count: 1,
        payment_type: '입금',
        payer_name: '',
        amount: 0,
        payment_date: '',
        working_days: 30,
        memo: ''
      });
      setSelectedCustomer(null);

      // 슬롯현황 페이지로 이동
      const slotStatusUrl = `/slot-status?customerId=${customerId}&username=${customer.username}&name=${encodeURIComponent(customer.name)}`;
      window.open(slotStatusUrl, '_blank');
    } catch (error) {
      console.error('슬롯 추가 중 예외 발생:', error);
      alert('슬롯 추가에 실패했습니다.');
    } finally {
      setIsAddingSlot(false);
    }
  };

  const removeSlot = async (slotId: string) => {
    if (!confirm('정말로 이 슬롯을 삭제하시겠습니까?')) return;

    try {
      const slotToRemove = slotWorks.find(s => s.id === slotId);
      if (!slotToRemove) return;

      const { error } = await supabase
        .from('slot_works')
        .delete()
        .eq('id', slotId);

      if (error) {
        console.error('슬롯 삭제 오류:', error);
        alert('슬롯 삭제에 실패했습니다.');
        return;
      }

      // 고객 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          slot_used: slotToRemove.customer_id ? 
            (customers.find(c => c.id === slotToRemove.customer_id)?.slot_used || 0) - slotToRemove.slot_count : 0
        })
        .eq('id', slotToRemove.customer_id);

      if (updateError) {
        console.error('고객 정보 업데이트 오류:', updateError);
      }

      // 데이터 다시 로드
      await Promise.all([loadCustomers(), loadSlotWorks()]);
    } catch (error) {
      console.error('슬롯 삭제 중 예외 발생:', error);
      alert('슬롯 삭제에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '승인됨';
      case 'pending': return '승인 대기';
      case 'rejected': return '거부됨';
      default: return status;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '일반회원': return 'bg-blue-100 text-blue-800';
      case '프리미엄': return 'bg-purple-100 text-purple-800';
      case 'VIP': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">데이터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">고객 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer, index) => (
              <div key={customer.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">순번: {index + 1}</span>
                        <span className="text-sm text-gray-500">|</span>
                        <span className="text-sm text-gray-600">아이디: {customer.username}</span>
                        <span className="text-sm text-gray-500">|</span>
                        <span className="text-sm text-gray-600">비밀번호: ********</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(customer.status)}>
                          {getStatusText(customer.status)}
                        </Badge>
                        <Badge className={getGradeColor(customer.grade)}>
                          {customer.grade}
                        </Badge>
                        <Badge variant="outline">
                          {customer.distributor}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">가입일: {new Date(customer.created_at).toLocaleDateString()}</p>
                    {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                    {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                    {customer.kakao_id && <p className="text-sm text-gray-500">카카오: {customer.kakao_id}</p>}
                  </div>
                </div>

                {/* 슬롯 정보 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">슬롯 현황</h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        사용 중: {customer.slot_used}개 / 추가: {customer.additional_count}개
                      </span>
                      <Button
                        onClick={() => setSelectedCustomer(customer)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ➕ 슬롯 추가
                      </Button>
                    </div>
                  </div>
                  
                  {/* 슬롯 작업 목록 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slotWorks
                      .filter(slot => slot.customer_id === customer.id)
                      .map((slot) => (
                        <div key={slot.id} className="border rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🛒</span>
                              <span className="font-medium text-sm">{slot.slot_type}</span>
                            </div>
                            <Button
                              onClick={() => removeSlot(slot.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              삭제
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>슬롯 수: {slot.slot_count}개</p>
                            <p>결제: {slot.payment_type} {slot.amount > 0 ? `(${slot.amount.toLocaleString()}원)` : ''}</p>
                            <p>작업일: {slot.working_days}일</p>
                            {slot.payment_date && <p>결제일: {slot.payment_date}</p>}
                            {slot.memo && <p>메모: {slot.memo}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 슬롯 추가 모달 */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              ➕ {selectedCustomer.name}님에게 슬롯 추가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="slotType">슬롯 타입</Label>
                <select
                  id="slotType"
                  value={newSlot.slot_type}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, slot_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="쿠팡">쿠팡</option>
                  <option value="네이버쇼핑">네이버 쇼핑</option>
                  <option value="G마켓">G마켓</option>
                  <option value="11번가">11번가</option>
                  <option value="티몬">티몬</option>
                  <option value="위메프">위메프</option>
                </select>
              </div>
              <div>
                <Label htmlFor="slotCount">슬롯 개수</Label>
                <Input
                  id="slotCount"
                  type="number"
                  min="1"
                  value={newSlot.slot_count}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, slot_count: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentType">결제 방식</Label>
                <select
                  id="paymentType"
                  value={newSlot.payment_type}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, payment_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="입금">입금</option>
                  <option value="쿠폰">쿠폰</option>
                  <option value="신용카드">신용카드</option>
                  <option value="계좌이체">계좌이체</option>
                </select>
              </div>
              <div>
                <Label htmlFor="payerName">결제자명</Label>
                <Input
                  id="payerName"
                  placeholder="결제자명 입력"
                  value={newSlot.payer_name}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, payer_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="amount">결제 금액</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={newSlot.amount}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="workingDays">작업 일수</Label>
                <Input
                  id="workingDays"
                  type="number"
                  min="1"
                  value={newSlot.working_days}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, working_days: parseInt(e.target.value) || 30 }))}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="memo">메모</Label>
                <Input
                  id="memo"
                  placeholder="메모 입력 (선택사항)"
                  value={newSlot.memo}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, memo: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
              >
                취소
              </Button>
              <Button
                onClick={() => addSlot(selectedCustomer.id)}
                disabled={isAddingSlot}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAddingSlot ? '추가 중...' : '슬롯 추가'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {customers.length}
            </div>
            <p className="text-sm text-gray-500">총 고객 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <p className="text-sm text-gray-500">승인된 고객</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {customers.filter(c => c.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-500">승인 대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {customers.reduce((sum, c) => sum + c.slot_used, 0)}
            </div>
            <p className="text-sm text-gray-500">총 사용 슬롯</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
