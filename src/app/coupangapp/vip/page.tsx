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
import { addCustomer, getCustomers, deleteCustomer, updateCustomer, Customer, fixSchemaCacheIssues, withSchemaCacheFix } from '@/lib/supabase';
import { forceSchemaRefresh, resetConnectionPool, clearBrowserCache } from '@/lib/schema-utils';
import * as XLSX from 'xlsx';

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

export default function CoupangVipPage() {
  const router = useRouter();
  
  // 폼 상태
  const [form, setForm] = useState<SlotAddForm>({
    workGroup: 'VIP',
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

  // 고객 페이지 데이터 (아이디, 고객명, 소속총판)
  const [customerData, setCustomerData] = useState<any[]>([]);

  // 대량 등록 모달 상태
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkSlotData>({
    workGroup: 'VIP',
    keywords: [''],
    linkUrl: '',
    slotCount: 1,
    memo: '',
    equipmentGroup: '지정안함',
    bulkData: ''
  });

  // 실시간 잔여기간 카운팅을 위한 상태
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 VIP 카운터 상태 (300을 24시간으로 나눠서 12.5씩 증가)
  const [vipCounter, setVipCounter] = useState(0);

  // 고객의 슬롯 현황을 가져오는 함수 (슬롯 타입별로 계산)
  const [customerSlotStatus, setCustomerSlotStatus] = useState<{
    totalSlots: number;
    usedSlots: number;
    remainingSlots: number;
  }>({
    totalSlots: 0,
    usedSlots: 0,
    remainingSlots: 0
  });

  const loadCustomerSlotStatus = async (username: string, slotType: string) => {
    try {
      console.log('🔍 슬롯 현황 로드 시작:', { username, slotType });
      
      // 일반 슬롯 현황 API에서 해당 고객의 데이터를 찾음
      const response = await fetch('/api/slot-status');
      const data = await response.json();
      
      console.log('📊 전체 슬롯 데이터:', data.data);
      
      if (data.success && data.data.length > 0) {
        // 해당 username의 모든 슬롯 데이터를 찾음
        const customerAllSlots = data.data.filter((slot: any) => slot.customerId === username);
        console.log(`👤 ${username} 고객의 모든 슬롯:`, customerAllSlots);
        
        // VIP 페이지이므로 해당 username의 모든 VIP 슬롯을 가져옴
        const customerSlots = data.data.filter((slot: any) => {
          if (slot.customerId !== username) return false;
          
          // VIP 슬롯인지 확인 (VIP가 포함된 모든 슬롯)
          const isVipSlot = slot.slotType.includes('VIP') || slot.slotType.includes('vip');
          console.log(`🎯 VIP 슬롯 확인:`, {
            slotType: slot.slotType,
            isVipSlot: isVipSlot
          });
          
          return isVipSlot;
        });
        
        console.log(`🎯 ${slotType} 타입 슬롯 필터링 결과:`, customerSlots);
        
        if (customerSlots.length > 0) {
          // 해당 슬롯 타입의 총합 계산
          const totalSlots = customerSlots.reduce((sum: number, slot: any) => sum + slot.slotCount, 0);
          const usedSlots = customerSlots.reduce((sum: number, slot: any) => sum + slot.usedSlots, 0);
          const remainingSlots = customerSlots.reduce((sum: number, slot: any) => sum + slot.remainingSlots, 0);
          
          setCustomerSlotStatus({
            totalSlots,
            usedSlots,
            remainingSlots
          });
          console.log(`✅ ${slotType} 슬롯 현황 로드 완료:`, { totalSlots, usedSlots, remainingSlots });
        } else {
          console.log(`❌ 해당 고객의 ${slotType} 슬롯 데이터를 찾을 수 없습니다:`, username);
          console.log('🔍 사용 가능한 slotType들:', [...new Set(customerAllSlots.map((slot: any) => slot.slotType))]);
          // 슬롯 데이터가 없으면 0으로 설정
          setCustomerSlotStatus({
            totalSlots: 0,
            usedSlots: 0,
            remainingSlots: 0
          });
        }
      }
    } catch (error) {
      console.error('고객 슬롯 현황 로드 실패:', error);
    }
  };

  // 수정 모드 상태 관리
  const [editingCustomer, setEditingCustomer] = useState<CustomerSlot | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerSlot>>({});

  // 체크박스 상태 관리
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 스키마 캐시 문제 해결을 위한 래핑된 함수들
  const getCustomersWithCacheFix = withSchemaCacheFix(getCustomers);
  const addCustomerWithCacheFix = withSchemaCacheFix(addCustomer);
  const deleteCustomerWithCacheFix = withSchemaCacheFix(deleteCustomer);
  const updateCustomerWithCacheFix = withSchemaCacheFix(updateCustomer);

  // 컴포넌트 마운트 시 연결 테스트 후 고객 목록 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 스키마 캐시 문제 해결 및 브라우저 캐시 삭제
        console.log('🔍 스키마 캐시 문제 해결 및 초기화 중...');
        
        // 브라우저 캐시 삭제
        clearBrowserCache();
        
        // 스키마 캐시 문제 해결
        const cacheFixed = await fixSchemaCacheIssues();
        
        if (!cacheFixed) {
          console.error('❌ 스키마 캐시 문제 해결 실패');
          setError('데이터베이스 스키마 캐시 문제를 해결할 수 없습니다. 페이지를 새로고침하거나 개발 서버를 재시작해주세요.');
          setLoading(false);
          return;
        }
        
        console.log('✅ 스키마 캐시 문제 해결 완료! 고객 목록 로드 시작...');
        await loadCustomers();
        await loadCustomerData();
      } catch (err) {
        console.error('❌ 초기화 중 오류 발생:', err);
        setError('시스템 초기화에 실패했습니다.');
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // URL 파라미터에서 고객 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customerId');
    const slotCount = urlParams.get('slotCount');
    const customerName = urlParams.get('name');
    const slotType = urlParams.get('slotType');
    
    if (customerId && slotCount && customerName) {
      console.log('URL 파라미터에서 고객 정보 확인:', { customerId, slotCount, customerName, slotType });
      
      // 고객의 슬롯 현황 로드 (username과 slotType 사용)
      const username = urlParams.get('username');
      if (username && slotType) {
        loadCustomerSlotStatus(username, slotType);
      }
      
      // 고객 정보를 메모에 추가
      console.log(`고객 ${customerName} (${customerId})의 ${slotCount}개 VIP 슬롯 등록 준비 완료`);
    }
  }, []);

  // 실시간 시간 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 실시간 VIP 카운터 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const millisecondsSinceStartOfDay = now.getTime() - startOfDay.getTime();
      const secondsSinceStartOfDay = millisecondsSinceStartOfDay / 1000;
      
      // 24시간(86400초) 동안 300번의 1씩 증가가 일어나도록 계산
      // 86400초 / 300 = 288초마다 1씩 증가
      const incrementPerSecond = 300 / (24 * 60 * 60); // 0.00347...
      const currentCounter = Math.floor(secondsSinceStartOfDay * incrementPerSecond);
      
      setVipCounter(currentCounter % 300);
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

  // 고객 목록 로드 함수 (스키마 캐시 문제 해결 적용)
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 VIP 고객 목록 로드 시작...');
      
      const data = await getCustomersWithCacheFix();
      console.log('✅ Supabase에서 받은 데이터:', data);
      
      if (!Array.isArray(data)) {
        throw new Error(`예상된 배열이 아닙니다. 타입: ${typeof data}, 값: ${JSON.stringify(data)}`);
      }
      
      // VIP 고객만 필터링
      const vipData = data.filter((item: any) => item.work_group === 'VIP');
      
      // Supabase 데이터를 CustomerSlot 형식으로 변환
      const convertedData: CustomerSlot[] = vipData.map((item: any, index: number) => {
        console.log(`VIP 데이터 변환 중 ${index + 1}/${vipData.length}:`, item);
        return {
          id: item.id,
          customer: item.customer || `_VIP_${item.keyword?.substring(0, 8) || 'unknown'}`,
          nickname: item.nickname || item.keyword?.substring(0, 10) || 'unknown',
          workGroup: item.work_group || 'VIP',
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
      
      console.log('✅ VIP 변환된 데이터:', convertedData);
      setCustomers(convertedData);
    } catch (err: any) {
      console.error('❌ VIP 고객 목록 로드 실패:', err);
      setError('VIP 고객 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 고객 페이지 데이터 로드 함수
  const loadCustomerData = async () => {
    try {
      console.log('🔄 고객 페이지 데이터 로드 시작...');
      
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (response.ok) {
        const customerList = result.users || [];
        console.log('✅ 고객 페이지 데이터 로드 성공:', customerList.length, '명');
        setCustomerData(customerList);
      } else {
        console.error('❌ 고객 페이지 데이터 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 고객 페이지 데이터 로드 오류:', error);
    }
  };

  // 고객 데이터에서 해당 고객 정보 찾기
  const findCustomerInfo = (customerId: string) => {
    return customerData.find(c => c.username === customerId) || null;
  };

  // 작업그룹 옵션
  const workGroups = ['VIP', '프리미엄', '공통', '기본'];

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
        name: `_VIP_${form.keyword.substring(0, 8)}`,
        keyword: form.keyword,
        link_url: form.linkUrl,
        slot_count: form.slotCount,
        memo: form.memo,
        work_group: 'VIP',
        equipment_group: form.equipmentGroup,
        current_rank: '1 [0]',
        start_rank: '1 [0]',
        traffic: '0 (0/0)',
        remaining_days: '30일',
        registration_date: generateRegistrationDateRange(),
        status: '작동중'
      };

      // Supabase에 저장 (스키마 캐시 문제 해결 적용)
      const savedCustomer = await addCustomerWithCacheFix(customerData);
      
      // 새로운 고객 슬롯 추가 (화면 업데이트)
      const newCustomer: CustomerSlot = {
        id: savedCustomer.id,
        customer: customerData.name,
        nickname: form.keyword.substring(0, 10),
        workGroup: 'VIP',
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
        workGroup: 'VIP',
        keyword: '',
        linkUrl: '',
        slotCount: 1,
        memo: '',
        equipmentGroup: '지정안함'
      });

      alert('VIP 슬롯이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('VIP 슬롯 등록 실패:', error);
      alert('VIP 슬롯 등록에 실패했습니다. 다시 시도해주세요.');
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
      
      // 각 파싱된 데이터에 대해 VIP 슬롯 등록
      const promises = parsedData.map(async (data) => {
        const customerData = {
          name: `_VIP_${data.keyword.substring(0, 8)}`,
          keyword: data.keyword,
          link_url: data.linkUrl,
          slot_count: data.slotCount,
          memo: bulkForm.memo,
          work_group: 'VIP',
          equipment_group: bulkForm.equipmentGroup,
          current_rank: '1 [0]',
          start_rank: '1 [0]',
          traffic: '0 (0/0)',
          remaining_days: '30일',
          registration_date: generateRegistrationDateRange(),
          status: '작동중'
        };

        return await addCustomerWithCacheFix(customerData);
      });

      const savedCustomers = await Promise.all(promises);
      
      // 새로운 고객 슬롯들을 화면에 추가
      const newCustomers: CustomerSlot[] = savedCustomers.map((savedCustomer, index) => ({
        id: savedCustomer.id,
        customer: savedCustomer.name,
        nickname: parsedData[index].keyword.substring(0, 10),
        workGroup: 'VIP',
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
        workGroup: 'VIP',
        keywords: [''],
        linkUrl: '',
        slotCount: 1,
        memo: '',
        equipmentGroup: '지정안함',
        bulkData: ''
      });

      // 모달 닫기
      setShowBulkModal(false);
      
      alert(`${parsedData.length}개의 VIP 슬롯이 성공적으로 등록되었습니다!`);
    } catch (error) {
      console.error('VIP 대량 슬롯 등록 실패:', error);
      alert('VIP 대량 슬롯 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setBulkLoading(false);
    }
  };

  // 고객 삭제 (Supabase 연동)
  const handleDeleteCustomer = async (id: number | undefined) => {
    if (!id) return;
    
    if (confirm('정말로 이 VIP 고객을 삭제하시겠습니까?')) {
      try {
        await deleteCustomerWithCacheFix(id);
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        alert('VIP 고객이 성공적으로 삭제되었습니다.');
      } catch (error) {
        console.error('VIP 고객 삭제 실패:', error);
        alert('VIP 고객 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 고객 편집 시작
  const handleEditCustomer = (customer: CustomerSlot) => {
    setEditingCustomer(customer);
    setEditForm({
      keyword: customer.keyword,
      linkUrl: customer.linkUrl,
      memo: customer.memo,
      slotCount: customer.slotCount,
      workGroup: customer.workGroup,
      equipmentGroup: customer.equipmentGroup
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setEditForm({});
  };

  // 수정 저장 (Supabase 연동)
  const handleSaveEdit = async () => {
    if (!editingCustomer?.id) return;

    try {
      const updatedData = {
        keyword: editForm.keyword,
        link_url: editForm.linkUrl,
        memo: editForm.memo,
        slot_count: editForm.slotCount,
        work_group: editForm.workGroup,
        equipment_group: editForm.equipmentGroup
      };

      await updateCustomerWithCacheFix(editingCustomer.id, updatedData);

      // 로컬 상태 업데이트
      setCustomers(prev => prev.map(customer => 
        customer.id === editingCustomer.id 
          ? { ...customer, ...editForm }
          : customer
      ));

      setEditingCustomer(null);
      setEditForm({});
      alert('VIP 고객 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('VIP 고객 수정 실패:', error);
      alert('VIP 고객 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 수정 폼 입력 처리
  const handleEditInputChange = (field: keyof CustomerSlot, value: string | number) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(customers.map(customer => customer.id).filter(Boolean) as number[]);
      setSelectedCustomers(allIds);
    } else {
      setSelectedCustomers(new Set());
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectCustomer = (customerId: number, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
    setSelectAll(newSelected.size === customers.length);
  };

  // 전체 수정 모드 상태
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState<Partial<CustomerSlot>>({});

  // 전체 수정 시작
  const handleBulkEdit = () => {
    if (selectedCustomers.size === 0) {
      alert('수정할 고객을 선택해주세요.');
      return;
    }
    setBulkEditMode(true);
    setBulkEditForm({});
  };

  // 전체 수정 취소
  const handleCancelBulkEdit = () => {
    setBulkEditMode(false);
    setBulkEditForm({});
  };

  // 전체 수정 저장
  const handleSaveBulkEdit = async () => {
    if (selectedCustomers.size === 0) {
      alert('수정할 고객을 선택해주세요.');
      return;
    }

    try {
      const selectedIds = Array.from(selectedCustomers);
      const updatePromises = selectedIds.map(async (customerId) => {
        const updatedData: any = {};
        if (bulkEditForm.keyword !== undefined) updatedData.keyword = bulkEditForm.keyword;
        if (bulkEditForm.linkUrl !== undefined) updatedData.link_url = bulkEditForm.linkUrl;
        if (bulkEditForm.slotCount !== undefined) updatedData.slot_count = bulkEditForm.slotCount;

        if (Object.keys(updatedData).length > 0) {
          return await updateCustomerWithCacheFix(customerId, updatedData);
        }
      });

      await Promise.all(updatePromises);

      // 로컬 상태 업데이트
      setCustomers(prev => prev.map(customer => 
        selectedCustomers.has(customer.id || 0) 
          ? { ...customer, ...bulkEditForm }
          : customer
      ));

      setBulkEditMode(false);
      setBulkEditForm({});
      setSelectedCustomers(new Set());
      setSelectAll(false);
      alert(`${selectedIds.length}개 VIP 고객의 정보가 성공적으로 수정되었습니다.`);
    } catch (error) {
      console.error('VIP 전체 수정 실패:', error);
      alert('VIP 전체 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 전체 삭제
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) {
      alert('삭제할 고객을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedCustomers.size}개 VIP 고객을 정말로 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedCustomers);
      const deletePromises = selectedIds.map(async (customerId) => {
        return await deleteCustomer(customerId);
      });

      await Promise.all(deletePromises);

      // 로컬 상태 업데이트
      setCustomers(prev => prev.filter(customer => !selectedCustomers.has(customer.id || 0)));

      setSelectedCustomers(new Set());
      setSelectAll(false);
      alert(`${selectedIds.length}개 VIP 고객이 성공적으로 삭제되었습니다.`);
    } catch (error) {
      console.error('VIP 전체 삭제 실패:', error);
      alert('VIP 전체 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 전체 수정 폼 입력 처리
  const handleBulkEditInputChange = (field: keyof CustomerSlot, value: string | number) => {
    setBulkEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    try {
      // 엑셀에 포함할 데이터 준비
      const excelData = customers.map((customer, index) => ({
        'No': customer.id || index + 1,
        '고객명': customer.customer,
        '닉네임': customer.nickname,
        '작업그룹': customer.workGroup,
        '검색어': customer.keyword,
        '링크주소': customer.linkUrl,
        '메모': customer.memo || '',
        '현재순위': customer.currentRank,
        '시작순위': customer.startRank,
        '슬롯수': customer.slotCount,
        '트래픽': customer.traffic,
        '장비그룹': customer.equipmentGroup,
        '잔여기간': calculateRemainingTime(customer.registrationDate),
        '등록일/만료일': customer.registrationDate,
        '상태': customer.status,
        '등록일시': customer.created_at || ''
      }));

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 자동 조정
      const columnWidths = [
        { wch: 8 },   // No
        { wch: 20 },  // 고객명
        { wch: 15 },  // 닉네임
        { wch: 12 },  // 작업그룹
        { wch: 25 },  // 검색어
        { wch: 50 },  // 링크주소
        { wch: 30 },  // 메모
        { wch: 15 },  // 현재순위
        { wch: 15 },  // 시작순위
        { wch: 10 },  // 슬롯수
        { wch: 15 },  // 트래픽
        { wch: 12 },  // 장비그룹
        { wch: 20 },  // 잔여기간
        { wch: 35 },  // 등록일/만료일
        { wch: 10 },  // 상태
        { wch: 20 }   // 등록일시
      ];
      worksheet['!cols'] = columnWidths;

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, 'VIP고객목록');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `VIP고객목록_${dateStr}_${timeStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      alert(`${customers.length}개 VIP 고객 데이터가 엑셀 파일로 다운로드되었습니다.`);
    } catch (error) {
      console.error('VIP 엑셀 다운로드 실패:', error);
      alert('VIP 엑셀 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 선택된 고객만 엑셀 다운로드
  const handleSelectedExcelDownload = () => {
    if (selectedCustomers.size === 0) {
      alert('다운로드할 고객을 선택해주세요.');
      return;
    }

    try {
      // 선택된 고객만 필터링
      const selectedData = customers.filter(customer => 
        selectedCustomers.has(customer.id || 0)
      );

      // 엑셀에 포함할 데이터 준비
      const excelData = selectedData.map((customer, index) => ({
        'No': customer.id || index + 1,
        '고객명': customer.customer,
        '닉네임': customer.nickname,
        '작업그룹': customer.workGroup,
        '검색어': customer.keyword,
        '링크주소': customer.linkUrl,
        '메모': customer.memo || '',
        '현재순위': customer.currentRank,
        '시작순위': customer.startRank,
        '슬롯수': customer.slotCount,
        '트래픽': customer.traffic,
        '장비그룹': customer.equipmentGroup,
        '잔여기간': calculateRemainingTime(customer.registrationDate),
        '등록일/만료일': customer.registrationDate,
        '상태': customer.status,
        '등록일시': customer.created_at || ''
      }));

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 자동 조정
      const columnWidths = [
        { wch: 8 },   // No
        { wch: 20 },  // 고객명
        { wch: 15 },  // 닉네임
        { wch: 12 },  // 작업그룹
        { wch: 25 },  // 검색어
        { wch: 50 },  // 링크주소
        { wch: 30 },  // 메모
        { wch: 15 },  // 현재순위
        { wch: 15 },  // 시작순위
        { wch: 10 },  // 슬롯수
        { wch: 15 },  // 트래픽
        { wch: 12 },  // 장비그룹
        { wch: 20 },  // 잔여기간
        { wch: 35 },  // 등록일/만료일
        { wch: 10 },  // 상태
        { wch: 20 }   // 등록일시
      ];
      worksheet['!cols'] = columnWidths;

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '선택된VIP고객목록');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `선택된VIP고객목록_${dateStr}_${timeStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      alert(`${selectedData.length}개 선택된 VIP 고객 데이터가 엑셀 파일로 다운로드되었습니다.`);
    } catch (error) {
      console.error('선택된 VIP 고객 엑셀 다운로드 실패:', error);
      alert('VIP 엑셀 다운로드에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 상태에 따른 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '작동중':
      case '구동중':
      case 'active':
      case 'inactive':
        return <Badge className="bg-green-500">구동중</Badge>;
      case '만료':
      case 'expired':
        return <Badge className="bg-red-500">만료</Badge>;
      case '정지':
      case 'suspended':
        return <Badge className="bg-yellow-500">정지</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 에러 메시지 표시 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* 상단 VIP 슬롯 정보 헤더 */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-dashed border-purple-300 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full">
                  <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-purple-800">VIP 전용 슬롯</h1>
                  <p className="text-sm text-purple-600">프리미엄 서비스</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{customerSlotStatus.totalSlots}</div>
                  <div className="text-sm text-gray-600">총 {customerSlotStatus.totalSlots}개</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">{vipCounter}</div>
                  <div className="text-sm text-gray-600">실시간 카운터</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{customerSlotStatus.usedSlots}</div>
                  <div className="text-sm text-gray-600">{customerSlotStatus.usedSlots}개 사용</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-sm text-gray-500">VIP 전용</span>
              <div className="w-3 h-3 bg-pink-400 rounded-full ml-3"></div>
              <span className="text-sm text-gray-500">프리미엄</span>
            </div>
          </div>
        </div>

        {/* VIP 슬롯 등록 폼 */}
        <Card className="mb-8 border-purple-200">
          <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-lg text-purple-800">VIP 슬롯 등록</CardTitle>
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
                  VIP 작업등록
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkModal(true)} className="px-6 h-9 border-purple-300 text-purple-600 hover:bg-purple-50">
                  VIP 대량 작업등록
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 대량 등록 모달 */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-purple-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-purple-800">VIP 대량 작업 등록</h2>
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
              <div className="bg-purple-50 p-4 rounded-lg mb-4 border-l-4 border-purple-400">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">📝 VIP 등록 예시</h3>
                <div className="text-sm text-purple-700">
                  <p className="mb-2">아래와 같이 한 줄씩 입력하세요:</p>
                  <div className="bg-white p-3 rounded border font-mono text-xs">
                    <span className="text-purple-600 font-semibold">검색어</span> <span className="text-green-600 font-semibold">링크주소</span> <span className="text-red-600 font-semibold">슬롯수</span><br/>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">VIP상품 링크주소 5</div>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">프리미엄제품	링크주소	3</div>
                  </div>
                  <p className="mt-2 text-xs">형식: 검색어 + 링크주소 + 슬롯수 (공백 또는 탭으로 구분)</p>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">VIP 대량 등록 데이터</Label>
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
                        VIP 등록 중...
                      </div>
                    ) : (
                      'VIP 대량 등록'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 등록된 VIP 고객 목록 */}
        <Card className="border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl text-purple-800">등록된 VIP 고객 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 전체 수정 모드 폼 */}
            {bulkEditMode && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-purple-800">
                    VIP 전체 수정 모드 ({selectedCustomers.size}개 선택됨)
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveBulkEdit}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      전체 저장
                    </Button>
                    <Button
                      onClick={handleCancelBulkEdit}
                      variant="outline"
                      size="sm"
                    >
                      취소
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">검색어</Label>
                    <Input
                      value={bulkEditForm.keyword || ''}
                      onChange={(e) => handleBulkEditInputChange('keyword', e.target.value)}
                      placeholder="검색어를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">링크주소</Label>
                    <Input
                      value={bulkEditForm.linkUrl || ''}
                      onChange={(e) => handleBulkEditInputChange('linkUrl', e.target.value)}
                      placeholder="링크주소를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">슬롯수</Label>
                    <Input
                      type="number"
                      value={bulkEditForm.slotCount || ''}
                      onChange={(e) => handleBulkEditInputChange('slotCount', parseInt(e.target.value) || 1)}
                      placeholder="슬롯수를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  💎 VIP 고객의 검색어, 링크주소, 슬롯수만 수정 가능합니다. 빈 필드는 수정되지 않습니다.
                </p>
              </div>
            )}

            {/* 테이블 컨트롤 */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="총판선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="vip">VIP전용</SelectItem>
                    <SelectItem value="premium">프리미엄</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="VIP그룹선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="premium">프리미엄</SelectItem>
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
                  <Input placeholder="VIP 검색 (고객, 검색어, 링크주소)" className="w-64" />
                  <Button variant="outline" size="sm" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Button>
                </div>

                {selectedCustomers.size > 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      {selectedCustomers.size}개 선택됨
                    </div>
                    <Button
                      onClick={handleBulkEdit}
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      전체 수정
                    </Button>
                    <Button
                      onClick={handleBulkDelete}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      전체 삭제
                    </Button>
                    <Button
                      onClick={handleSelectedExcelDownload}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      선택 다운로드
                    </Button>
                  </div>
                )}

                <Button 
                  onClick={handleExcelDownload}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  VIP 엑셀 다운로드
                </Button>
              </div>
            </div>

            {/* VIP 고객 테이블 */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">VIP 고객 목록을 불러오는 중...</p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                      <th className="border border-gray-300 p-2 text-center w-8">
                        <Checkbox 
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-12">순번</th>
                      <th className="border border-gray-300 p-2 text-center w-20">아이디</th>
                      <th className="border border-gray-300 p-2 text-center w-28">작업그룹/검색어</th>
                      <th className="border border-gray-300 p-2 text-center w-40">링크주소/메모</th>
                      <th className="border border-gray-300 p-2 text-center w-16">현재순위</th>
                      <th className="border border-gray-300 p-2 text-center w-16">시작순위</th>
                      <th className="border border-gray-300 p-2 text-center w-12">슬롯</th>
                      <th className="border border-gray-300 p-2 text-center w-16">트래픽</th>
                      <th className="border border-gray-300 p-2 text-center w-20">장비그룹</th>
                      <th className="border border-gray-300 p-2 text-center w-24">잔여기간</th>
                      <th className="border border-gray-300 p-2 text-center w-32">등록일/만료일</th>
                      <th className="border border-gray-300 p-2 text-center w-12">상태</th>
                      <th className="border border-gray-300 p-2 text-center w-16">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => (
                      <tr key={customer.id} className={index === 0 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''}>
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox 
                            checked={selectedCustomers.has(customer.id || 0)}
                            onCheckedChange={(checked) => handleSelectCustomer(customer.id || 0, checked as boolean)}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">{customer.id}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="font-bold text-xs text-purple-700">{customer.customer}</div>
                          {(() => {
                            const customerInfo = findCustomerInfo(customer.customer);
                            return customerInfo ? (
                              <>
                                <div className="text-xs text-purple-600">({customerInfo.name})</div>
                                <div className="text-xs text-purple-500">{customerInfo.distributor}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-xs text-purple-600">({customer.nickname})</div>
                                <div className="text-xs text-purple-500">{customer.workGroup}</div>
                              </>
                            );
                          })()}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="mb-1">
                            <Select 
                              value={editingCustomer?.id === customer.id ? editForm.workGroup : customer.workGroup}
                              onValueChange={(value) => editingCustomer?.id === customer.id ? handleEditInputChange('workGroup', value) : undefined}
                              disabled={editingCustomer?.id !== customer.id}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
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
                            value={editingCustomer?.id === customer.id ? editForm.keyword : customer.keyword} 
                            onChange={(e) => editingCustomer?.id === customer.id ? handleEditInputChange('keyword', e.target.value) : undefined}
                            className="w-full h-6 text-xs"
                            readOnly={editingCustomer?.id !== customer.id}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="mb-1">
                            <Input 
                              value={editingCustomer?.id === customer.id ? editForm.linkUrl : customer.linkUrl} 
                              onChange={(e) => editingCustomer?.id === customer.id ? handleEditInputChange('linkUrl', e.target.value) : undefined}
                              className="w-full h-6 text-xs text-ellipsis"
                              readOnly={editingCustomer?.id !== customer.id}
                              title={customer.linkUrl}
                            />
                          </div>
                          <Input 
                            value={editingCustomer?.id === customer.id ? editForm.memo : (customer.memo || 'VIP 프리미엄 상품 전용')} 
                            onChange={(e) => editingCustomer?.id === customer.id ? handleEditInputChange('memo', e.target.value) : undefined}
                            className="w-full h-6 text-xs text-ellipsis"
                            readOnly={editingCustomer?.id !== customer.id}
                            title={customer.memo || 'VIP 프리미엄 상품 전용'}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">{customer.currentRank}</td>
                        <td className="border border-gray-300 p-2 text-center text-xs">{customer.startRank}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Input 
                            type="number"
                            value={editingCustomer?.id === customer.id ? editForm.slotCount : customer.slotCount} 
                            onChange={(e) => editingCustomer?.id === customer.id ? handleEditInputChange('slotCount', parseInt(e.target.value) || 1) : undefined}
                            className="w-12 h-6 text-xs text-center"
                            readOnly={editingCustomer?.id !== customer.id}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="text-xs">{customer.traffic}</div>
                          <div className="text-xs text-purple-600">VIP</div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Select 
                            value={editingCustomer?.id === customer.id ? editForm.equipmentGroup : customer.equipmentGroup}
                            onValueChange={(value) => editingCustomer?.id === customer.id ? handleEditInputChange('equipmentGroup', value) : undefined}
                            disabled={editingCustomer?.id !== customer.id}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs">
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
                          <span className="inline-block px-1 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
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
                            {editingCustomer?.id === customer.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                  title="저장"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  title="취소"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCustomer(customer)}
                                  className="h-6 w-6 p-0"
                                  title="수정"
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
                                  title="삭제"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIP 만료슬롯 보기 버튼 */}
            <div className="mt-4 text-center">
              <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                VIP 만료슬롯 보기
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
