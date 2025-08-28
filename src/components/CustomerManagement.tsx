'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: 'basic' | 'premium' | 'enterprise';
  slots: Slot[];
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
}

interface Slot {
  id: string;
  name: string;
  type: 'coupang' | 'naver' | 'gmarket' | 'elevenst';
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  expiresAt: string;
  productCount: number;
  lastUsed: string;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: '김철수',
      email: 'kim@company.com',
      phone: '010-1234-5678',
      company: 'ABC 쇼핑몰',
      joinDate: '2024-01-15',
      status: 'active',
      subscription: 'premium',
      totalSlots: 10,
      usedSlots: 7,
      availableSlots: 3,
      slots: [
        {
          id: 'slot1',
          name: '쿠팡 메인 슬롯',
          type: 'coupang',
          status: 'active',
          createdAt: '2024-01-15',
          expiresAt: '2024-12-31',
          productCount: 150,
          lastUsed: '2024-08-28'
        },
        {
          id: 'slot2',
          name: '네이버 쇼핑 슬롯',
          type: 'naver',
          status: 'active',
          createdAt: '2024-01-15',
          expiresAt: '2024-12-31',
          productCount: 89,
          lastUsed: '2024-08-27'
        }
      ]
    },
    {
      id: '2',
      name: '이영희',
      email: 'lee@shop.com',
      phone: '010-9876-5432',
      company: 'XYZ 마켓',
      joinDate: '2024-02-20',
      status: 'active',
      subscription: 'enterprise',
      totalSlots: 20,
      usedSlots: 15,
      availableSlots: 5,
      slots: [
        {
          id: 'slot3',
          name: '쿠팡 엔터프라이즈',
          type: 'coupang',
          status: 'active',
          createdAt: '2024-02-20',
          expiresAt: '2024-12-31',
          productCount: 300,
          lastUsed: '2024-08-28'
        }
      ]
    }
  ]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    name: '',
    type: 'coupang' as const,
    expiresAt: ''
  });

  const addSlot = async (customerId: string) => {
    if (!newSlot.name.trim() || !newSlot.expiresAt) {
      alert('슬롯 이름과 만료일을 모두 입력해주세요.');
      return;
    }

    setIsAddingSlot(true);
    
    // 새 슬롯 추가 (시뮬레이션)
    const slot: Slot = {
      id: `slot_${Date.now()}`,
      name: newSlot.name.trim(),
      type: newSlot.type,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: newSlot.expiresAt,
      productCount: 0,
      lastUsed: new Date().toISOString().split('T')[0]
    };

    setCustomers(prev => prev.map(customer => {
      if (customer.id === customerId) {
        return {
          ...customer,
          usedSlots: customer.usedSlots + 1,
          availableSlots: customer.availableSlots - 1,
          slots: [...customer.slots, slot]
        };
      }
      return customer;
    }));

    setNewSlot({ name: '', type: 'coupang', expiresAt: '' });
    setIsAddingSlot(false);
  };

  const removeSlot = (customerId: string, slotId: string) => {
    setCustomers(prev => prev.map(customer => {
      if (customer.id === customerId) {
        const slotToRemove = customer.slots.find(s => s.id === slotId);
        if (slotToRemove) {
          return {
            ...customer,
            usedSlots: customer.usedSlots - 1,
            availableSlots: customer.availableSlots + 1,
            slots: customer.slots.filter(s => s.id !== slotId)
          };
        }
      }
      return customer;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotTypeIcon = (type: string) => {
    switch (type) {
      case 'coupang': return '🛒';
      case 'naver': return '🟢';
      case 'gmarket': return '🟡';
      case 'elevenst': return '🟠';
      default: return '📦';
    }
  };

  return (
    <div className="space-y-6">
      {/* 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">고객 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
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
                      <p className="text-sm text-gray-500">{customer.company}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status === 'active' ? '활성' : 
                           customer.status === 'inactive' ? '비활성' : '정지'}
                        </Badge>
                        <Badge className={getSubscriptionColor(customer.subscription)}>
                          {customer.subscription === 'basic' ? '기본' :
                           customer.subscription === 'premium' ? '프리미엄' : '엔터프라이즈'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">가입일: {customer.joinDate}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>

                {/* 슬롯 정보 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">슬롯 현황</h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        총 {customer.totalSlots}개 / 사용 {customer.usedSlots}개 / 남음 {customer.availableSlots}개
                      </span>
                      {customer.availableSlots > 0 && (
                        <Button
                          onClick={() => setSelectedCustomer(customer)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          ➕ 슬롯 추가
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* 슬롯 목록 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {customer.slots.map((slot) => (
                      <div key={slot.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getSlotTypeIcon(slot.type)}</span>
                            <span className="font-medium text-sm">{slot.name}</span>
                          </div>
                          <Button
                            onClick={() => removeSlot(customer.id, slot.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            삭제
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>상품 수: {slot.productCount}개</p>
                          <p>만료일: {slot.expiresAt}</p>
                          <p>마지막 사용: {slot.lastUsed}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="slotName">슬롯 이름</Label>
                <Input
                  id="slotName"
                  placeholder="슬롯 이름 입력"
                  value={newSlot.name}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="slotType">슬롯 타입</Label>
                <select
                  id="slotType"
                  value={newSlot.type}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="coupang">쿠팡</option>
                  <option value="naver">네이버 쇼핑</option>
                  <option value="gmarket">G마켓</option>
                  <option value="elevenst">11번가</option>
                </select>
              </div>
              <div>
                <Label htmlFor="expiresAt">만료일</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={newSlot.expiresAt}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, expiresAt: e.target.value }))}
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
            <p className="text-sm text-gray-500">활성 고객</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {customers.reduce((sum, c) => sum + c.totalSlots, 0)}
            </div>
            <p className="text-sm text-gray-500">총 슬롯 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {customers.reduce((sum, c) => sum + c.usedSlots, 0)}
            </div>
            <p className="text-sm text-gray-500">사용 중인 슬롯</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
