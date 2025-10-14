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

// 대량 등록을 위한 인터페이스
interface BulkSlotData {
  workGroup: string;
  keywords: string[];
  linkUrl: string;
  slotCount: number;
  memo: string;
  equipmentGroup: string;
  bulkData: string;
}

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

  // 대량 등록 모달 상태
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkSlotData>({
    workGroup: '공통',
    keywords: [''],
    linkUrl: '',
    slotCount: 1,
    memo: '',
    equipmentGroup: '지정안함',
    bulkData: ''
  });

  // 실시간 잔여기간 카운팅을 위한 상태
  const [currentTime, setCurrentTime] = useState(new Date());

  // 컴포넌트 마운트 시 연결 테스트 후 고객 목록 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 먼저 Supabase 연결 상태 확인
        console.log('🔍 Supabase 연결 상태 확인 중...');
        const connectionTest = await testSupabaseConnection();
        
        if (!connectionTest.success) {
          console.error('❌ Supabase 연결 실패:', connectionTest.error);
          
          // 더 자세한 오류 정보 추출
          let errorMessage = 'Supabase 연결에 실패했습니다';
          let errorDetails = '';
          
          if (connectionTest.error) {
            const error = connectionTest.error as any;
            if (typeof error === 'object' && error !== null) {
              if ('message' in error && typeof error.message === 'string') {
                errorMessage = error.message;
              }
              if ('code' in error && typeof error.code === 'string') {
                errorDetails += ` [코드: ${error.code}]`;
              }
              if ('details' in error && typeof error.details === 'string') {
                errorDetails += ` [세부사항: ${error.details}]`;
              }
            } else if (typeof error === 'string') {
              errorMessage = error;
            }
          }
          
          // 환경 변수 관련 오류인지 확인
          if (errorMessage.includes('환경 변수') || errorMessage.includes('.env.local')) {
            errorMessage = '환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.';
            errorDetails = '설정 방법: node setup-env.js 실행 또는 수동으로 .env.local 파일 생성';
          }
          
          // 테이블 관련 오류인지 확인
          if (errorMessage.includes('customers 테이블') || errorMessage.includes('PGRST116')) {
            errorMessage = '데이터베이스 테이블이 생성되지 않았습니다.';
            errorDetails = 'Supabase SQL Editor에서 supabase-schema.sql을 실행하세요.';
          }
          
          setError(`${errorMessage}${errorDetails ? `\n\n${errorDetails}` : ''}`);
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

  // 실시간 시간 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 잔여기간 계산 함수 (24시간 기준 실시간 카운팅)
  const calculateRemainingTime = (registrationDate: string) => {
    try {
      // 등록일에서 만료일 추출 (예: "2025-08-31 03:23:45 ~ 2025-09-28 17:21:30")
      const dateRange = registrationDate.split(' ~ ');
      if (dateRange.length !== 2) return '30일';

      const expiryDateStr = dateRange[1];
      const expiryDate = new Date(expiryDateStr);
      
      if (isNaN(expiryDate.getTime())) return '30일';

      const now = currentTime;
      const diffMs = expiryDate.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        return '만료됨';
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (diffDays > 0) {
        return `${diffDays}일 ${diffHours}시간 ${diffMinutes}분 ${diffSeconds}초`;
      } else if (diffHours > 0) {
        return `${diffHours}시간 ${diffMinutes}분 ${diffSeconds}초`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}분 ${diffSeconds}초`;
      } else {
        return `${diffSeconds}초`;
      }
    } catch (error) {
      return '30일';
    }
  };

  // 등록일과 만료일 생성 함수 (시간/분/초 포함)
  const generateRegistrationDateRange = () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return `${formatDate(now)} ~ ${formatDate(expiryDate)}`;
  };

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
          registrationDate: item.registration_date || generateRegistrationDateRange(),
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

  // 작업그룹 옵션
  const workGroups = ['공통', 'VIP', '프리미엄', '기본'];

  // 장비그룹 옵션
  const equipmentGroups = ['지정안함', '그룹A', '그룹B', '그룹C'];

  // 폼 입력 처리
  const handleInputChange = (field: keyof SlotAddForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 대량 등록 폼 입력 처리
  const handleBulkInputChange = (field: keyof BulkSlotData, value: any) => {
    setBulkForm(prev => ({ ...prev, [field]: value }));
  };

  // 대량 등록에서 검색어 추가
  const addKeyword = () => {
    setBulkForm(prev => ({
      ...prev,
      keywords: [...prev.keywords, '']
    }));
  };

  // 대량 등록에서 검색어 제거
  const removeKeyword = (index: number) => {
    setBulkForm(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }));
  };

  // 대량 등록에서 검색어 변경
  const updateKeyword = (index: number, value: string) => {
    setBulkForm(prev => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) => i === index ? value : keyword)
    }));
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
        username: `_PD_${form.keyword.substring(0, 8)}`, // username 속성 추가
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
        registration_date: generateRegistrationDateRange(),
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
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // bulkData 파싱
    const lines = bulkForm.bulkData.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      alert('대량 등록 데이터를 입력해주세요.');
      return;
    }

    const parsedData: Array<{keyword: string, linkUrl: string, slotCount: number}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 공백과 탭 모두 구분자로 사용
      const parts = line.split(/[\s\t]+/);
      
      if (parts.length < 3) {
        alert(`${i + 1}번째 줄의 형식이 잘못되었습니다. 형식: 검색어 링크주소 슬롯수`);
        return;
      }
      
      const slotCount = parseInt(parts[parts.length - 1]);
      if (isNaN(slotCount)) {
        alert(`${i + 1}번째 줄의 슬롯수가 숫자가 아닙니다.`);
        return;
      }
      
      const keyword = parts[0];
      const linkUrl = parts.slice(1, -1).join(' ');
      
      parsedData.push({ keyword, linkUrl, slotCount });
    }

    try {
      setBulkLoading(true);
      
      // 각 파싱된 데이터에 대해 슬롯 등록
      const promises = parsedData.map(async (data) => {
        const customerData = {
          name: `_PD_${data.keyword.substring(0, 8)}`,
          username: `_PD_${data.keyword.substring(0, 8)}`, // username 속성 추가
          keyword: data.keyword,
          link_url: data.linkUrl,
          slot_count: data.slotCount,
          memo: bulkForm.memo,
          work_group: bulkForm.workGroup,
          equipment_group: bulkForm.equipmentGroup,
          current_rank: '1 [0]',
          start_rank: '1 [0]',
          traffic: '0 (0/0)',
          remaining_days: '30일',
          registration_date: generateRegistrationDateRange(),
          status: '작동중'
        };

        return await addCustomer(customerData);
      });

      const savedCustomers = await Promise.all(promises);
      
      // 새로운 고객 슬롯들을 화면에 추가
      const newCustomers: CustomerSlot[] = savedCustomers.map((savedCustomer, index) => ({
        id: savedCustomer.id,
        customer: savedCustomer.name,
        nickname: parsedData[index].keyword.substring(0, 10),
        workGroup: bulkForm.workGroup,
        keyword: parsedData[index].keyword,
        linkUrl: parsedData[index].linkUrl,
        currentRank: '1 [0]',
        startRank: '1 [0]',
        slotCount: parsedData[index].slotCount,
        traffic: '0 (0/0)',
        equipmentGroup: bulkForm.equipmentGroup,
        remainingDays: '30일',
        registrationDate: generateRegistrationDateRange(),
        status: '작동중',
        memo: bulkForm.memo,
        created_at: savedCustomer.created_at
      }));

      setCustomers(prev => [...newCustomers, ...prev]);
      
      // 대량 등록 폼 초기화
      setBulkForm({
        workGroup: '공통',
        keywords: [''],
        linkUrl: '',
        slotCount: 1,
        memo: '',
        equipmentGroup: '지정안함',
        bulkData: ''
      });

      // 모달 닫기
      setShowBulkModal(false);
      
      alert(`${parsedData.length}개의 슬롯이 성공적으로 등록되었습니다!`);
    } catch (error) {
      console.error('대량 슬롯 등록 실패:', error);
      alert('대량 슬롯 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setBulkLoading(false);
    }
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
                <Button type="button" variant="outline" onClick={() => setShowBulkModal(true)} className="px-6 h-9">
                  대량 작업등록
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 대량 등록 모달 */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">대량 작업 등록</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkModal(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* 예시 섹션 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-400">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">📝 사용 예시</h3>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">아래와 같이 한 줄씩 입력하세요:</p>
                                      <div className="bg-white p-3 rounded border font-mono text-xs">
                      <span className="text-blue-600 font-semibold">검색어</span> <span className="text-green-600 font-semibold">링크주소</span> <span className="text-red-600 font-semibold">슬롯수</span><br/>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">검색어 링크주소 슬롯수</div>
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis">검색어	링크주소	슬롯수</div>
                    </div>
                  <p className="mt-2 text-xs">형식: 검색어 + 링크주소 + 슬롯수 (공백 또는 탭으로 구분)</p>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">대량 등록 데이터</Label>
                    <Textarea
                      placeholder="검색어 링크주소 슬롯수"
                      value={bulkForm.bulkData || ''}
                      onChange={(e) => handleBulkInputChange('bulkData', e.target.value)}
                      className="h-20 mt-1 bulk-data-textarea"
                    />
                    <p className="text-xs text-gray-500 mt-1">한 줄에 하나씩 입력하세요. 형식: 검색어 + 링크주소 + 슬롯수 (공백 또는 탭으로 구분)</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBulkModal(false)}
                    disabled={bulkLoading}
                    className="px-6 h-10"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 px-6 h-10"
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        등록 중...
                      </div>
                    ) : (
                      '대량 등록'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                            className="w-full h-8 text-xs text-ellipsis"
                            readOnly
                            title={customer.linkUrl}
                          />
                        </div>
                        <Input 
                          value={customer.memo || 'GB마트 여성가방 토트백 숄더백 데일리 패션가방'} 
                          className="w-full h-8 text-xs text-ellipsis"
                          readOnly
                          title={customer.memo || 'GB마트 여성가방 토트백 숄더백 데일리 패션가방'}
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
                          {calculateRemainingTime(customer.registrationDate)}
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
}
