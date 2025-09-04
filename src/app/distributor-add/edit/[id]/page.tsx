'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { getDistributor, updateDistributor, checkDistributorsTable } from '@/lib/supabase';

interface DistributorForm {
  name: string;
  type: string;
  domain: string;
  ip: string;
  siteName: string;
  menuAbbr: string;
  defaultDays: string;
  couponDays: string;
  memo: string;
}

export default function EditDistributorPage() {
  const router = useRouter();
  const params = useParams();
  const distributorId = params.id as string;
  
  const [formData, setFormData] = useState<DistributorForm>({
    name: '',
    type: '',
    domain: '',
    ip: '',
    siteName: '',
    menuAbbr: '',
    defaultDays: '',
    couponDays: '',
    memo: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  useEffect(() => {
    loadDistributorData();
  }, [distributorId]);

  const loadDistributorData = async () => {
    try {
      // 테이블 존재 여부 확인
      const tableCheck = await checkDistributorsTable();
      setTableExists(tableCheck.exists);
      
      if (!tableCheck.exists) {
        console.error('distributors 테이블이 존재하지 않습니다:', tableCheck.error);
        setInitialLoading(false);
        return;
      }

      // 총판 데이터 로드
      const distributor = await getDistributor(parseInt(distributorId));
      
      if (distributor) {
        setFormData({
          name: distributor.name || '',
          type: distributor.type || '',
          domain: distributor.domain || '',
          ip: distributor.ip || '',
          siteName: distributor.site_name || '',
          menuAbbr: distributor.menu_abbr || '',
          defaultDays: distributor.default_days?.toString() || '',
          couponDays: distributor.coupon_days?.toString() || '',
          memo: distributor.memo || ''
        });
      } else {
        alert('총판 정보를 찾을 수 없습니다.');
        router.push('/distributor-add');
      }
      
      setInitialLoading(false);
    } catch (error) {
      console.error('총판 데이터 로드 실패:', error);
      alert('총판 정보를 불러오는데 실패했습니다.');
      router.push('/distributor-add');
    }
  };

  const handleInputChange = (field: keyof DistributorForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.defaultDays || !formData.couponDays) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 테이블 존재 여부 재확인
    const tableCheck = await checkDistributorsTable();
    if (!tableCheck.exists) {
      alert('데이터베이스 테이블이 없습니다. Supabase에서 distributors 테이블을 생성해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const distributorData = {
        name: formData.name,
        type: formData.type || '선택안함',
        domain: formData.domain || '',
        ip: formData.ip || '',
        site_name: formData.siteName || '',
        menu_abbr: formData.menuAbbr || '',
        default_days: parseInt(formData.defaultDays),
        coupon_days: parseInt(formData.couponDays),
        memo: formData.memo || ''
      };

      await updateDistributor(parseInt(distributorId), distributorData);
      
      alert('총판이 성공적으로 수정되었습니다.');
      router.push('/distributor-add');
    } catch (error) {
      console.error('총판 수정 실패:', error);
      alert('총판 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('수정을 취소하시겠습니까? 변경된 내용이 모두 사라집니다.')) {
      router.push('/distributor-add');
    }
  };

  if (initialLoading) {
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

  if (tableExists === false) {
    return (
      <div className="wrapper">
        <Navigation />
        <div className="content-wrapper">
          <div className="container mx-auto p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터베이스 테이블이 없습니다</h3>
              <p className="text-gray-600 mb-4">
                distributors 테이블이 Supabase에 생성되지 않았습니다.
              </p>
              <Button 
                onClick={() => router.push('/distributor-add')} 
                className="bg-blue-600 hover:bg-blue-700"
              >
                총판관리로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <Navigation />
      <div className="content-wrapper">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/distributor-add')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              총판관리로 돌아가기
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">총판수정</h1>
            <p className="text-gray-600">총판 정보를 수정해주세요.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">총판 정보 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 총판명 */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">총판명 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="총판명을 입력하세요"
                      className="w-full"
                      required
                    />
                  </div>

                  {/* 상부 셀렉트박스 */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">상부</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="선택안함">선택안함</SelectItem>
                        <SelectItem value="본사">본사</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 도메인 */}
                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-sm font-medium text-gray-700">도메인</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      placeholder="도메인을 입력하세요 (예: coupang.com)"
                      className="w-full"
                    />
                  </div>

                  {/* IP */}
                  <div className="space-y-2">
                    <Label htmlFor="ip" className="text-sm font-medium text-gray-700">IP</Label>
                    <Input
                      id="ip"
                      value={formData.ip}
                      onChange={(e) => handleInputChange('ip', e.target.value)}
                      placeholder="IP 주소를 입력하세요 (예: 192.168.1.100)"
                      className="w-full"
                    />
                  </div>

                  {/* 사이트명 */}
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-sm font-medium text-gray-700">사이트명</Label>
                    <Input
                      id="siteName"
                      value={formData.siteName}
                      onChange={(e) => handleInputChange('siteName', e.target.value)}
                      placeholder="사이트명을 입력하세요"
                      className="w-full"
                    />
                  </div>

                  {/* 접힌메뉴약어 */}
                  <div className="space-y-2">
                    <Label htmlFor="menuAbbr" className="text-sm font-medium text-gray-700">접힌메뉴약어</Label>
                    <Input
                      id="menuAbbr"
                      value={formData.menuAbbr}
                      onChange={(e) => handleInputChange('menuAbbr', e.target.value)}
                      placeholder="메뉴 약어를 입력하세요 (예: CP)"
                      className="w-full"
                    />
                  </div>

                  {/* 기본일수 */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultDays" className="text-sm font-medium text-gray-700">기본일수 *</Label>
                    <div className="relative">
                      <Input
                        id="defaultDays"
                        type="number"
                        value={formData.defaultDays}
                        onChange={(e) => handleInputChange('defaultDays', e.target.value)}
                        placeholder="기본일수를 입력하세요"
                        min="1"
                        className="w-full pr-12"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 text-sm">일</span>
                      </div>
                    </div>
                  </div>

                  {/* 쿠폰일수 */}
                  <div className="space-y-2">
                    <Label htmlFor="couponDays" className="text-sm font-medium text-gray-700">쿠폰일수 *</Label>
                    <div className="relative">
                      <Input
                        id="couponDays"
                        type="number"
                        value={formData.couponDays}
                        onChange={(e) => handleInputChange('couponDays', e.target.value)}
                        placeholder="쿠폰일수를 입력하세요"
                        min="0"
                        className="w-full pr-12"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500 text-sm">일</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                <div className="space-y-2">
                  <Label htmlFor="memo" className="text-sm font-medium text-gray-700">메모</Label>
                  <Textarea
                    id="memo"
                    value={formData.memo}
                    onChange={(e) => handleInputChange('memo', e.target.value)}
                    placeholder="추가 메모를 입력하세요"
                    rows={4}
                    className="w-full"
                  />
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center px-6 py-2"
                  >
                    <X className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 flex items-center px-6 py-2"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? '수정 중...' : '수정'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
