'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Customer {
  id: string;
  username: string;
  name: string;
  distributor: string;
  status: string;
}

export default function SlotAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    slotType: '',
    slotCount: '',
    paymentType: 'deposit', // 기본값을 '입금'으로 설정
    payerName: '',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로 설정
    usageDays: '30', // 기본값을 30일로 설정
    memo: ''
  });

  // URL 파라미터에서 고객 정보 받아오기
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    const username = searchParams.get('username');
    const name = searchParams.get('name');
    
    if (customerId && username && name) {
      setFormData(prev => ({
        ...prev,
        customerId: username,
        customerName: decodeURIComponent(name)
      }));
    }
  }, [searchParams]);

  // 고객 목록 가져오기
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        
        if (result.success) {
          setCustomers(result.data);
        }
      } catch (error) {
        console.error('고객 목록 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 검증
    if (!formData.customerId || !formData.customerName || !formData.slotType || !formData.slotCount) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      // 1. 미정산내역에 슬롯 데이터 저장
      const slotResponse = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const slotResult = await slotResponse.json();

      if (slotResult.success) {
        // 2. 쿠팡APP 페이지로 이동 (슬롯 개수와 함께)
        const params = new URLSearchParams({
          customerId: formData.customerId,
          slotCount: formData.slotCount,
          customerName: formData.customerName,
          slotType: formData.slotType
        });
        
        alert('슬롯이 성공적으로 추가되었습니다. 쿠팡APP 페이지로 이동합니다.');
        router.push(`/coupangapp/add?${params.toString()}`);
      } else {
        alert(`슬롯 추가 실패: ${slotResult.error}`);
      }
    } catch (error) {
      console.error('슬롯 추가 중 오류:', error);
      alert('슬롯 추가 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    router.push('/customer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">슬롯 추가</h1>
          <p className="text-gray-600 mt-2">고객에게 새로운 슬롯을 추가합니다.</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">
                  아이디 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerId"
                  type="text"
                  value={formData.customerId}
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                  placeholder="고객관리에서 슬롯추가 버튼을 클릭하세요"
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  고객명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  className="mt-1 bg-gray-100 cursor-not-allowed"
                  placeholder="고객관리에서 슬롯추가 버튼을 클릭하세요"
                  readOnly
                />
              </div>
            </div>

            {/* 슬롯 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="slotType" className="text-sm font-medium text-gray-700">
                  슬롯유형 <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.slotType} onValueChange={(value) => handleInputChange('slotType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="슬롯 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupang">쿠팡</SelectItem>
                    <SelectItem value="coupang-vip">쿠팡VIP</SelectItem>
                    <SelectItem value="coupang-app">쿠팡APP</SelectItem>
                    <SelectItem value="naver-shopping">네이버쇼핑</SelectItem>
                    <SelectItem value="place">플레이스</SelectItem>
                    <SelectItem value="today-house">오늘의집</SelectItem>
                    <SelectItem value="aliexpress">알리</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="slotCount" className="text-sm font-medium text-gray-700">
                  슬롯개수 <span className="text-red-500">*</span>
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="slotCount"
                    type="number"
                    value={formData.slotCount}
                    onChange={(e) => handleInputChange('slotCount', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    개
                  </span>
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="paymentType" className="text-sm font-medium text-gray-700">
                  입금구분
                </Label>
                <Select value={formData.paymentType} onValueChange={(value) => handleInputChange('paymentType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="입금 구분을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">💳 입금</SelectItem>
                    <SelectItem value="coupon">🎫 쿠폰</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payerName" className="text-sm font-medium text-gray-700">
                  입금자명
                </Label>
                <Input
                  id="payerName"
                  type="text"
                  value={formData.payerName}
                  onChange={(e) => handleInputChange('payerName', e.target.value)}
                  placeholder="입금자명을 입력하세요"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700">
                  입금액
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="paymentAmount"
                    type="number"
                    value={formData.paymentAmount}
                    onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    원
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentDate" className="text-sm font-medium text-gray-700">
                  입금일자
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="usageDays" className="text-sm font-medium text-gray-700">
                  사용일수
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="usageDays"
                    type="number"
                    value={formData.usageDays}
                    onChange={(e) => handleInputChange('usageDays', e.target.value)}
                    placeholder="0"
                    className="rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    일
                  </span>
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div>
              <Label htmlFor="memo" className="text-sm font-medium text-gray-700">
                메모
              </Label>
              <Textarea
                id="memo"
                value={formData.memo}
                onChange={(e) => handleInputChange('memo', e.target.value)}
                placeholder="추가 메모를 입력하세요"
                rows={4}
                className="mt-1"
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="px-6 bg-green-600 hover:bg-green-700 text-white"
              >
                추가
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
