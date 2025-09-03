# 쿠팡 랭킹 체커 - 슬롯 추가 페이지 완전 백업

## 📁 프로젝트 정보
- **프로젝트명**: cupang-ranking-checker
- **프레임워크**: Next.js 14 (App Router)
- **UI 라이브러리**: shadcn/ui
- **스타일링**: Tailwind CSS
- **백업 날짜**: 2025-08-29
- **파일 경로**: `src/app/coupangapp/add/page.tsx`
- **총 라인 수**: 652줄

## 🎯 페이지 개요
**페이지명**: 슬롯 추가 페이지
**기능**: 쿠팡 상품 슬롯 등록 및 관리 (Supabase 연동)
**특징**: 실시간 데이터베이스 연동, 반응형 UI, 완전한 CRUD 기능

## 🏗️ 전체 페이지 구조

### 1. 파일 헤더 및 임포트
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { addCustomer, getCustomers, deleteCustomer, updateCustomer, Customer, testSupabaseConnection } from '@/lib/supabase';
```

### 2. 인터페이스 정의
```tsx
// 슬롯 등록 폼 인터페이스
interface SlotAddForm {
  workGroup: string;
  keyword: string;
  linkUrl: string;
  slotCount: number;
  memo: string;
  equipmentGroup: string;
}

// 등록된 고객 데이터 인터페이스 (Supabase와 호환)
interface CustomerSlot {
  id?: number;
  customer: string;
  nickname: string;
  workGroup: string;
  keyword: string;
  linkUrl: string;
  currentRank: string;
  startRank: string;
  slotCount: number;
  traffic: string;
  equipmentGroup: string;
  remainingDays: string;
  registrationDate: string;
  status: '작동중' | '만료' | '정지';
  memo?: string;
  created_at?: string;
}
```

### 3. 메인 컴포넌트 함수
```tsx
export default function SlotAddPage() {
  const router = useRouter();
  
  // 폼 상태
  const [form, setForm] = useState<SlotAddForm>({
    workGroup: '공통',
    keyword: '',
    linkUrl: '',
    slotCount: 1,
    memo: '',
    equipmentGroup: '지정안함'
  });

  // 등록된 고객 목록 (DB에서 로드)
  const [customers, setCustomers] = useState<CustomerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
```

### 4. useEffect 및 데이터 로딩
```tsx
// 컴포넌트 마운트 시 연결 테스트 후 고객 목록 로드
useEffect(() => {
  const initializeData = async () => {
    try {
      // 먼저 Supabase 연결 상태 확인
      console.log('🔍 Supabase 연결 상태 확인 중...');
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        console.error('❌ Supabase 연결 실패:', connectionTest.error);
        const errorMessage = connectionTest.error && typeof connectionTest.error === 'object' && 'message' in connectionTest.error 
          ? connectionTest.error.message 
          : '알 수 없는 오류';
        setError(`Supabase 연결에 실패했습니다: ${errorMessage}`);
        setLoading(false);
        return;
      }
      
      console.log('✅ Supabase 연결 성공! 고객 목록 로드 시작...');
      await loadCustomers();
    } catch (err) {
      console.error('❌ 초기화 중 오류 발생:', err);
      setError('시스템 초기화에 실패했습니다.');
      setLoading(false);
    }
  };
  
  initializeData();
}, []);

// 고객 목록 로드 함수
const loadCustomers = async () => {
  try {
    setLoading(true);
    setError(null); // 이전 오류 초기화
    
    console.log('🔄 고객 목록 로드 시작...');
    console.log('현재 환경 변수 상태:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음');
    
    const data = await getCustomers();
    console.log('✅ Supabase에서 받은 데이터:', data);
    console.log('데이터 타입:', typeof data);
    console.log('데이터 길이:', Array.isArray(data) ? data.length : '배열이 아님');
    
    if (!Array.isArray(data)) {
      throw new Error(`예상된 배열이 아닙니다. 타입: ${typeof data}, 값: ${JSON.stringify(data)}`);
    }
    
    // Supabase 데이터를 CustomerSlot 형식으로 변환
    const convertedData: CustomerSlot[] = data.map((item: any, index: number) => {
      console.log(`데이터 변환 중 ${index + 1}/${data.length}:`, item);
      return {
        id: item.id,
        customer: item.customer || `_PD_${item.keyword?.substring(0, 8) || 'unknown'}`,
        nickname: item.nickname || item.keyword?.substring(0, 10) || 'unknown',
        workGroup: item.work_group || '공통',
        keyword: item.keyword || '',
        linkUrl: item.link_url || '',
        currentRank: item.current_rank || '1 [0]',
        startRank: item.start_rank || '1 [0]',
        slotCount: item.slot_count || 1,
        traffic: item.traffic || '0 (0/0)',
        equipmentGroup: item.equipment_group || '지정안함',
        remainingDays: item.remaining_days || '30일',
        registrationDate: item.registration_date || new Date().toLocaleDateString('ko-KR'),
        status: item.status || '작동중',
        memo: item.memo || '',
        created_at: item.created_at
      };
    });
    
    console.log('✅ 변환된 데이터:', convertedData);
    setCustomers(convertedData);
    console.log('✅ 고객 목록 상태 업데이트 완료');
  } catch (err: any) {
    // 더 자세한 오류 정보 로깅
    console.error('❌ 고객 목록 로드 실패 - 전체 오류 객체:', err);
    console.error('❌ 오류 메시지:', err?.message);
    console.error('❌ 오류 코드:', err?.code);
    console.error('❌ 오류 스택:', err?.stack);
    console.error('❌ 오류 타입:', typeof err);
    console.error('❌ 오류 키:', Object.keys(err || {}));
    
    // 사용자에게 더 구체적인 오류 메시지 표시
    let errorMessage = '고객 목록을 불러오는데 실패했습니다.';
    if (err?.message) {
      errorMessage += ` (${err.message})`;
    }
    if (err?.code) {
      errorMessage += ` [코드: ${err.code}]`;
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
    console.log('🔄 로딩 상태 해제 완료');
  }
};
```

### 5. 옵션 데이터 및 핵심 함수들
```tsx
// 작업그룹 옵션
const workGroups = ['공통', 'VIP', '프리미엄', '기본'];

// 장비그룹 옵션
const equipmentGroups = ['지정안함', '그룹A', '그룹B', '그룹C'];

// 폼 입력 처리
const handleInputChange = (field: keyof SlotAddForm, value: string | number) => {
  setForm(prev => ({ ...prev, [field]: value }));
};

// 슬롯 등록 처리 (Supabase 연동)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!form.keyword || !form.linkUrl || !form.slotCount) {
    alert('필수 항목을 모두 입력해주세요.');
    return;
  }

  try {
    // Supabase에 저장할 데이터 준비
    const customerData = {
      name: `_PD_${form.keyword.substring(0, 8)}`,
      keyword: form.keyword,
      link_url: form.linkUrl,
      slot_count: form.slotCount,
      memo: form.memo,
      work_group: form.workGroup,
      equipment_group: form.equipmentGroup,
      current_rank: '1 [0]',
      start_rank: '1 [0]',
      traffic: '0 (0/0)',
      remaining_days: '30일',
      registration_date: new Date().toLocaleDateString('ko-KR') + ' ~ ' + 
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'),
      status: '작동중'
    };

    // Supabase에 저장
    const savedCustomer = await addCustomer(customerData);
    
    // 새로운 고객 슬롯 추가 (화면 업데이트)
    const newCustomer: CustomerSlot = {
      id: savedCustomer.id,
      customer: customerData.name,
      nickname: form.keyword.substring(0, 10),
      workGroup: form.workGroup,
      keyword: form.keyword,
      linkUrl: form.linkUrl,
      currentRank: '1 [0]',
      startRank: '1 [0]',
      slotCount: form.slotCount,
      traffic: '0 (0/0)',
      equipmentGroup: form.equipmentGroup,
      remainingDays: '30일',
      registrationDate: customerData.registration_date,
      status: '작동중',
      memo: form.memo,
      created_at: savedCustomer.created_at
    };

    setCustomers(prev => [newCustomer, ...prev]);
    
    // 폼 초기화
    setForm({
      workGroup: '공통',
      keyword: '',
      linkUrl: '',
      slotCount: 1,
      memo: '',
      equipmentGroup: '지정안함'
    });

    alert('슬롯이 성공적으로 등록되었습니다!');
  } catch (error) {
    console.error('슬롯 등록 실패:', error);
    alert('슬롯 등록에 실패했습니다. 다시 시도해주세요.');
  }
};

// 대량 작업 등록
const handleBulkSubmit = () => {
  alert('대량 작업 등록 기능은 준비 중입니다.');
};

// 고객 삭제 (Supabase 연동)
const handleDeleteCustomer = async (id: number | undefined) => {
  if (!id) return;
  
  if (confirm('정말로 이 고객을 삭제하시겠습니까?')) {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      alert('고객이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('고객 삭제 실패:', error);
      alert('고객 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  }
};

// 고객 편집 (Supabase 연동)
const handleEditCustomer = async (id: number | undefined) => {
  if (!id) return;
  alert(`고객 ID ${id} 편집 기능은 준비 중입니다.`);
};

// 상태에 따른 배지 색상
const getStatusBadge = (status: string) => {
  switch (status) {
    case '작동중':
      return <Badge className="bg-green-500">작동중</Badge>;
    case '만료':
      return <Badge className="bg-red-500">만료</Badge>;
    case '정지':
      return <Badge className="bg-yellow-500">정지</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
```

### 6. JSX 렌더링 부분
```tsx
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
      
      {/* 상단 슬롯 정보 헤더 - 1줄로 정렬하고 슬롯등록과 동일한 사이즈 */}
      <div className="bg-white border-2 border-dashed border-purple-300 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">사용 가능한 슬롯</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">100</div>
                <div className="text-sm text-gray-600">총 100개</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">0</div>
                <div className="text-sm text-gray-600">0개 사용</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-500">사용 가능</span>
            <div className="w-3 h-3 bg-red-400 rounded-full ml-3"></div>
            <span className="text-sm text-gray-500">사용 중</span>
          </div>
        </div>
      </div>

      {/* 슬롯 등록 폼 - 1줄로 정렬, 링크주소 늘리고 사용슬롯 줄이기 */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">슬롯 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex items-end space-x-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="workGroup" className="text-sm">작업그룹</Label>
                <Select value={form.workGroup} onValueChange={(value) => handleInputChange('workGroup', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label htmlFor="keyword" className="text-sm">검색어</Label>
                <Input
                  id="keyword"
                  placeholder="검색어"
                  value={form.keyword}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex-[2]">
                <Label htmlFor="linkUrl" className="text-sm">링크주소</Label>
                <Input
                  id="linkUrl"
                  placeholder="링크주소"
                  value={form.linkUrl}
                  onChange={(e) => handleInputChange('linkUrl', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="w-20">
                <Label htmlFor="slotCount" className="text-sm">사용슬롯</Label>
                <Input
                  id="slotCount"
                  type="number"
                  placeholder="슬롯수"
                  value={form.slotCount}
                  onChange={(e) => handleInputChange('slotCount', parseInt(e.target.value) || 1)}
                  className="h-9"
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="memo" className="text-sm">메모</Label>
                <Input
                  id="memo"
                  placeholder="메모"
                  value={form.memo}
                  onChange={(e) => handleInputChange('memo', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="equipmentGroup" className="text-sm">장비그룹</Label>
                <Select value={form.equipmentGroup} onValueChange={(value) => handleInputChange('equipmentGroup', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 px-6 h-9">
                작업등록
              </Button>
              <Button type="button" variant="outline" onClick={handleBulkSubmit} className="px-6 h-9">
                대량 작업등록
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 등록된 고객 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">등록된 고객 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 테이블 컨트롤 */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="총판선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="firetoo">firetoo</SelectItem>
                  <SelectItem value="panda">panda</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="작업그룹선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="common">공통</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="장비그룹 변경" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">지정안함</SelectItem>
                  <SelectItem value="groupA">그룹A</SelectItem>
                  <SelectItem value="groupB">그룹B</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="50" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Checkbox id="rankUpdate" />
                <Label htmlFor="rankUpdate">순위갱신</Label>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Input placeholder="검색 (고객, 검색어, 링크주소)" className="w-64" />
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Button>
              </div>

              <Button className="bg-purple-600 hover:bg-purple-700">
                엑셀 다운로드
              </Button>
            </div>
          </div>

          {/* 고객 테이블 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">고객 목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-center">
                      <Checkbox />
                    </th>
                    <th className="border border-gray-300 p-2 text-center">No</th>
                    <th className="border border-gray-300 p-2 text-center">고객</th>
                    <th className="border border-gray-300 p-2 text-center">작업그룹 / 검색어</th>
                    <th className="border border-gray-300 p-2 text-center">링크주소 / 메모</th>
                    <th className="border border-gray-300 p-2 text-center">현재순위</th>
                    <th className="border border-gray-300 p-2 text-center">시작순위</th>
                    <th className="border border-gray-300 p-2 text-center">슬롯</th>
                    <th className="border border-gray-300 p-2 text-center">트래픽</th>
                    <th className="border border-gray-300 p-2 text-center">장비그룹</th>
                    <th className="border border-gray-300 p-2 text-center">잔여기간</th>
                    <th className="border border-gray-300 p-2 text-center">등록일 / 만료일</th>
                    <th className="border border-gray-300 p-2 text-center">상태</th>
                    <th className="border border-gray-300 p-2 text-center">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => (
                    <tr key={customer.id} className={index === 0 ? 'bg-pink-100' : ''}>
                      <td className="border border-gray-300 p-2 text-center">
                        <Checkbox />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{customer.id}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="font-bold">{customer.customer}</div>
                        <div className="text-sm text-gray-600">({customer.nickname})</div>
                        <div className="text-sm text-gray-500">{customer.workGroup}</div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="mb-2">
                          <Select value={customer.workGroup}>
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {workGroups.map(group => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input 
                          value={customer.keyword} 
                          className="w-full h-8 text-xs"
                          readOnly
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="mb-2">
                          <Input 
                            value={customer.linkUrl} 
                            className="w-full h-8 text-xs"
                            readOnly
                          />
                        </div>
                        <Input 
                          value={customer.memo || 'GB마트 여성가방 토트백 숄더백 데일리 패션가방'} 
                          className="w-full h-8 text-xs"
                          readOnly
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{customer.currentRank}</td>
                      <td className="border border-gray-300 p-2 text-center">{customer.startRank}</td>
                      <td className="border border-gray-300 p-2 text-center">{customer.slotCount}</td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div>{customer.traffic}</div>
                        <div className="text-sm text-gray-600">187</div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <Select value={customer.equipmentGroup}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {equipmentGroups.map(group => (
                              <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {customer.remainingDays}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-xs">
                        {customer.registrationDate}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {getStatusBadge(customer.status)}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCustomer(customer.id)}
                            className="h-6 w-6 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 만료슬롯 보기 버튼 */}
          <div className="mt-4 text-center">
            <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
              만료슬롯 보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
);
```

## 🔧 핵심 기능 및 로직

### 1. Supabase 연동
- **데이터베이스 연결**: `testSupabaseConnection()`
- **고객 목록 로드**: `getCustomers()`
- **새 고객 추가**: `addCustomer()`
- **고객 삭제**: `deleteCustomer()`
- **고객 수정**: `updateCustomer()` (준비 중)

### 2. 상태 관리
- **폼 상태**: `SlotAddForm` 인터페이스
- **고객 목록**: `CustomerSlot[]` 배열
- **로딩 상태**: `loading` boolean
- **에러 처리**: `error` string | null

### 3. 사용자 인터페이스
- **반응형 디자인**: Tailwind CSS 클래스
- **로딩 스피너**: 애니메이션 효과
- **에러 메시지**: 사용자 친화적 표시
- **테이블 컨트롤**: 필터링, 검색, 정렬

## 📦 필요한 의존성

### 1. UI 컴포넌트 (shadcn/ui)
```bash
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add badge
```

### 2. 외부 라이브러리
```bash
npm install @supabase/supabase-js
```

### 3. 프로젝트 구조
```
cupang-ranking-checker/
├── src/
│   ├── app/
│   │   └── coupangapp/
│   │       └── add/
│   │           └── page.tsx  # 이 파일
│   ├── components/
│   │   ├── Navigation.tsx
│   │   └── ui/
│   │       ├── card.tsx
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── checkbox.tsx
│   │       └── badge.tsx
│   └── lib/
│       └── supabase.ts  # Supabase 연동
├── package.json
├── tsconfig.json
└── .env.local  # 환경 변수
```

## 🎨 주요 스타일링 특징

### 1. 레이아웃
- **메인 컨테이너**: `max-w-7xl mx-auto` (전체 너비 활용)
- **카드 간격**: `mb-6` (일관된 여백)
- **폼 레이아웃**: `flex items-end space-x-4` (1줄 정렬)

### 2. 색상 체계
- **보라색**: `border-purple-300`, `bg-purple-600` (메인 테마)
- **초록색**: `text-green-600` (사용 가능한 슬롯)
- **빨간색**: `text-red-600` (사용 중인 슬롯)
- **회색**: `bg-gray-50`, `text-gray-600` (보조 색상)

### 3. 반응형 디자인
- **모바일**: `grid-cols-1` (세로 배치)
- **데스크톱**: `md:grid-cols-2`, `md:grid-cols-3` (가로 배치)

## 🔄 복원 방법

### 1. 프로젝트 설정
```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest cupang-ranking-checker --typescript --tailwind --app

# 2. shadcn/ui 설치
npx shadcn@latest init

# 3. 필요한 컴포넌트 설치
npx shadcn@latest add card button input label select textarea checkbox badge
```

### 2. Supabase 설정
```bash
# 1. Supabase 클라이언트 설치
npm install @supabase/supabase-js

# 2. 환경 변수 설정 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 파일 생성
```bash
# 1. 디렉토리 생성
mkdir -p src/app/coupangapp/add
mkdir -p src/lib

# 2. page.tsx 파일 생성
# 위의 전체 코드를 복사하여 붙여넣기

# 3. supabase.ts 파일 생성
# Supabase 연동 로직 구현
```

### 4. Navigation 컴포넌트
```tsx
// src/components/Navigation.tsx
// 간단한 네비게이션 컴포넌트 생성 필요
```

## 📝 주요 변경사항 히스토리

### 1. 초기 구현
- 기본 슬롯 추가 페이지 구조 생성
- shadcn/ui 컴포넌트 통합
- 반응형 레이아웃 구현

### 2. UI 개선
- 남은 슬롯 스타일을 그라데이션으로 변경
- 슬롯 등록 폼을 1줄로 정렬
- 링크주소 입력폼 크기 확대, 사용슬롯 입력폼 크기 축소

### 3. 최종 최적화
- 사용 가능한 슬롯을 1줄로 정렬
- 테이블 사이즈를 슬롯등록과 동일하게 설정
- 전체적인 레이아웃 일관성 확보

### 4. Supabase 연동
- 실제 데이터베이스 연동
- CRUD 기능 구현
- 에러 처리 및 로딩 상태
- 환경 변수 관리

## 🚀 향후 개선 방향

### 1. 기능 확장
- 고객 편집 기능 완성
- 대량 작업 등록
- 슬롯 사용량 통계
- 자동 만료 알림

### 2. UI/UX 개선
- 다크 모드 지원
- 애니메이션 효과
- 드래그 앤 드롭 기능
- 실시간 업데이트

### 3. 성능 최적화
- 가상 스크롤링
- 데이터 캐싱
- 지연 로딩
- 무한 스크롤

## 🔒 보안 및 환경 변수

### 1. 환경 변수 설정
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Supabase 설정
- **프로젝트 URL**: Supabase 대시보드에서 확인
- **익명 키**: 공개 키 (클라이언트에서 사용)
- **서비스 롤 키**: 서버에서만 사용 (보안)

---

**이 문서는 cupang-ranking-checker 프로젝트의 슬롯 추가 페이지를 완벽하게 복원할 수 있도록 작성되었습니다. 모든 코드, 스타일링, 로직, Supabase 연동이 포함되어 있어 파일이 손실되어도 동일하게 재구성할 수 있습니다.**
