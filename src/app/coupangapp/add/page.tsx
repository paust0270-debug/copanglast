'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  fixSchemaCacheIssues,
  withSchemaCacheFix,
  updateCustomer,
} from '@/lib/supabase';
import { clearBrowserCache } from '@/lib/schema-utils';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  db_id?: number; // 실제 데이터베이스 ID (삭제용)
  customerId?: string; // 고객 ID (히스토리 조회용)
  slotSequence?: number; // 슬롯 순번 (히스토리 조회용)
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

// 순위 히스토리 인터페이스
interface RankHistory {
  sequence: number;
  changeDate: string;
  rank: string;
  rankChange: number;
  startRankDiff: number;
  keyword: string;
  linkUrl: string;
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

function SlotAddPageContent() {
  const searchParams = useSearchParams();

  // 폼 상태
  const [form, setForm] = useState<SlotAddForm>({
    workGroup: '공통',
    keyword: '',
    linkUrl: '',
    slotCount: 1,
    memo: '',
    equipmentGroup: '지정안함',
  });

  // 등록된 고객 목록 (DB에서 로드)
  const [customers, setCustomers] = useState<CustomerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CustomerSlot | null>(null);
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);
  const [showRankChart, setShowRankChart] = useState(false);

  // 고객 페이지 데이터 (아이디, 고객명, 소속총판)
  const [customerData, setCustomerData] = useState<Record<string, unknown>[]>(
    []
  );

  // 순위 클릭 핸들러
  const handleRankClick = async (slot: CustomerSlot) => {
    if (slot.customerId && slot.slotSequence) {
      setSelectedSlot(slot);
      await fetchRankHistoryFromAPI(slot.customerId, slot.slotSequence);
      setShowRankChart(true); // 모달창 열기
    }
  };

  // API에서 순위 히스토리 가져오기
  const fetchRankHistoryFromAPI = async (
    customerId: string,
    slotSequence: number
  ) => {
    try {
      const response = await fetch(
        `/api/rank-history?customerId=${customerId}&slotSequence=${slotSequence}`
      );
      const result = await response.json();

      if (result.success) {
        setRankHistory(result.data);
        setShowRankChart(true);
      } else {
        console.error('❌ 순위 히스토리 조회 실패:', result.error);
        setRankHistory([]);
      }
    } catch (error) {
      console.error('❌ 순위 히스토리 조회 오류:', error);
      setRankHistory([]);
    }
  };

  // 고객의 총 슬롯 현황 데이터
  const [customerSlotStatus, setCustomerSlotStatus] = useState<{
    totalSlots: number;
    usedSlots: number;
    remainingSlots: number;
    customerName: string;
  }>({
    totalSlots: 0,
    usedSlots: 0,
    remainingSlots: 0,
    customerName: '',
  });

  // 작업등록된 슬롯이 있는지 확인하는 상태
  const [hasWorkRegisteredSlots, setHasWorkRegisteredSlots] = useState(false);

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
    bulkData: '',
  });

  // 실시간 잔여기간 카운팅을 위한 상태
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 트래픽 카운터 상태 (300을 24시간으로 나눠서 1씩 증가)
  const [trafficCounter, setTrafficCounter] = useState(0);

  // 수정 모드 상태 관리
  const [editingCustomer, setEditingCustomer] = useState<CustomerSlot | null>(
    null
  );
  const [editForm, setEditForm] = useState<Partial<CustomerSlot>>({});

  // 페이지 제목 상태 관리
  const [pageTitle, setPageTitle] = useState('쿠팡');
  const [listTitle, setListTitle] = useState('슬롯 등록 목록');

  // 체크박스 상태 관리
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);

  // 컴포넌트 마운트 시 연결 테스트 후 고객 목록 로드
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 스키마 캐시 문제 해결 및 브라우저 캐시 삭제

        // 브라우저 캐시 삭제
        clearBrowserCache();

        // 스키마 캐시 문제 해결
        const cacheFixed = await fixSchemaCacheIssues();

        if (!cacheFixed) {
          setError(
            '데이터베이스 스키마 캐시 문제를 해결할 수 없습니다. 페이지를 새로고침하거나 개발 서버를 재시작해주세요.'
          );
          setLoading(false);
          return;
        }

        await loadCustomers();
        await loadCustomerData();
      } catch {
        setError('시스템 초기화에 실패했습니다.');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // 고객의 슬롯 현황을 가져오는 함수 (slots 테이블에서 조인하여 계산)
  const loadCustomerSlotStatus = async (username: string) => {
    try {
      // 고객 슬롯 현황 로드 시작

      // 슬롯 현황 API를 사용하여 해당 고객의 슬롯 현황 조회
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get('customerId');
      const customerName = urlParams.get('customerName');

      // customerName이 비어있으면 username을 사용
      const nameParam = customerName || username;

      const response = await fetch(
        `/api/slot-status?customerId=${customerId}&username=${username}&name=${encodeURIComponent(nameParam)}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // 첫 번째 슬롯 데이터에서 정보 추출
        const slotData = data.data[0];
        const totalSlots = slotData.slotCount || 0;
        const usedSlots = slotData.usedSlots || 0;
        const remainingSlots = slotData.remainingSlots || 0;

        setCustomerSlotStatus({
          totalSlots,
          usedSlots,
          remainingSlots,
          customerName: slotData.customerName || '',
        });
      } else {
        // 슬롯 데이터가 없으면 0으로 설정
        setCustomerSlotStatus({
          totalSlots: 0,
          usedSlots: 0,
          remainingSlots: 0,
          customerName: '',
        });
      }
    } catch (error) {
      console.error('❌ 고객 슬롯 현황 로드 실패:', error);
      setCustomerSlotStatus({
        totalSlots: 0,
        usedSlots: 0,
        remainingSlots: 0,
        customerName: '',
      });
    }
  };

  // URL 파라미터에서 고객 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customerId');
    const slotCount = urlParams.get('slotCount');
    const customerName = urlParams.get('customerName');
    const slotType = urlParams.get('slotType');
    const username = urlParams.get('username');

    // 페이지 제목 설정
    if (customerId && username) {
      setPageTitle(`쿠팡 - ${customerSlotStatus.customerName || username}`);
      setListTitle(
        `${customerSlotStatus.customerName || username}님의 슬롯 등록 목록`
      );
    } else {
      setPageTitle('쿠팡 - 관리자 모드');
      setListTitle('전체 슬롯 등록 목록 (관리자)');
    }

    if (customerId && slotCount) {
      // 폼에 고객 정보 설정
      setForm(prev => ({
        ...prev,
        slotCount: parseInt(slotCount) || 1,
      }));

      // 고객의 슬롯 현황 로드 (username 사용)
      if (username) {
        loadCustomerSlotStatus(username);
      }

      // 고객 정보를 메모에 추가
    }
  }, [customerSlotStatus.customerName]);

  // 실시간 시간 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ESC 키로 모달창 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showRankChart) {
        setShowRankChart(false);
      }
    };

    if (showRankChart) {
      document.addEventListener('keydown', handleKeyDown);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [showRankChart]);

  // 실시간 트래픽 카운터 업데이트 (1초마다)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const millisecondsSinceStartOfDay = now.getTime() - startOfDay.getTime();
      const secondsSinceStartOfDay = millisecondsSinceStartOfDay / 1000;

      // 24시간(86400초) 동안 300번의 1씩 증가가 일어나도록 계산
      // 86400초 / 300 = 288초마다 1씩 증가
      const incrementPerSecond = 300 / (24 * 60 * 60); // 0.00347...
      const currentCounter = Math.floor(
        secondsSinceStartOfDay * incrementPerSecond
      );

      setTrafficCounter(currentCounter % 300);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 잔여기간 계산 함수 (실시간 카운팅)
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
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
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
    } catch {
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

  // 슬롯 등록 목록 로드 함수 (slot_status 테이블에서 조회)
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null); // 이전 오류 초기화

      // URL 파라미터에서 고객 정보 확인
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get('customerId');
      const username = urlParams.get('username');

      // 개별 고객 페이지인 경우 해당 고객의 슬롯만 조회 (slots 테이블 조회 제외)
      let apiUrl = '/api/slot-status?type=slot_status&skipSlotsTable=true';
      if (customerId && username) {
        apiUrl += `&customerId=${customerId}&username=${username}`;
      } else {
      }

      // slot_status 테이블에서 데이터 직접 조회
      const response = await fetch(apiUrl);

      const result = await response.json();

      if (!result.success) {
        console.error('❌ API 응답 실패:', result.error);
        throw new Error(
          result.error || '슬롯 등록 목록을 불러오는데 실패했습니다.'
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error(`예상된 배열이 아닙니다. 타입: ${typeof result.data}`);
      }

      // slot_status 데이터를 CustomerSlot 형식으로 변환
      const convertedData: CustomerSlot[] = result.data.map(
        (item: Record<string, unknown>, index: number) => {
          // 개별 슬롯의 실제 잔여기간 계산
          const now = new Date();
          const createdDate = item.created_at
            ? new Date(item.created_at as string)
            : now;
          const usageDays = (item.usage_days as number) || 30;

          // 총 사용 시간을 밀리초로 변환
          const totalUsageMs = usageDays * 24 * 60 * 60 * 1000;

          // 경과 시간 계산 (밀리초)
          const elapsedMs = now.getTime() - createdDate.getTime();

          // 실제 잔여 시간 계산 (밀리초)
          const remainingMs = Math.max(0, totalUsageMs - elapsedMs);

          // 잔여 시간을 일, 시간, 분으로 변환
          const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
          const remainingHours = Math.floor(
            (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
          );
          const remainingMinutes = Math.floor(
            (remainingMs % (60 * 60 * 1000)) / (60 * 1000)
          );
          const remainingSeconds = Math.floor(
            (remainingMs % (60 * 1000)) / 1000
          );

          // 잔여기간 문자열 생성
          let remainingTimeString = '';
          if (remainingDays > 0) {
            remainingTimeString = `${remainingDays}일 ${remainingHours}시간 ${remainingMinutes}분 ${remainingSeconds}초`;
          } else if (remainingHours > 0) {
            remainingTimeString = `${remainingHours}시간 ${remainingMinutes}분 ${remainingSeconds}초`;
          } else if (remainingMinutes > 0) {
            remainingTimeString = `${remainingMinutes}분 ${remainingSeconds}초`;
          } else {
            remainingTimeString = `${remainingSeconds}초`;
          }

          // 등록일과 만료일 계산
          const expiryDate = new Date(createdDate.getTime() + totalUsageMs);
          const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          };

          const registrationDateRange = `${formatDate(createdDate)} ~ ${formatDate(expiryDate)}`;

          return {
            id: item.id,
            db_id: item.db_id, // 실제 데이터베이스 ID
            customerId: item.customer_id, // 고객 ID (히스토리 조회용)
            slotSequence: item.slot_sequence || index + 1, // 슬롯 순번 (API에서 없으면 인덱스 기반으로 생성)
            customer: item.customer_id || item.customer_name || 'unknown', // 고객 ID 표시
            nickname: item.customer_name || 'unknown', // 고객명을 닉네임으로 표시
            workGroup: item.work_group || '공통',
            keyword: item.keyword || '',
            linkUrl: item.link_url || '',
            currentRank: item.current_rank || '1 [0]',
            startRank: item.start_rank || '1 [0]',
            slotCount: item.slot_count || 1,
            traffic: item.traffic || '0 (0/0)',
            equipmentGroup: item.equipment_group || '지정안함',
            remainingDays: remainingTimeString,
            registrationDate: registrationDateRange,
            status: item.status || '작동중',
            memo: item.memo || '',
            created_at: item.created_at,
          };
        }
      );

      setCustomers(convertedData);

      // 작업등록된 슬롯이 있는지 확인 (keyword가 있는 슬롯이 있는지)
      const hasRegisteredSlots = convertedData.some(
        slot => slot.keyword && slot.keyword.trim() !== ''
      );
      setHasWorkRegisteredSlots(hasRegisteredSlots);
    } catch (err: unknown) {
      // 사용자에게 더 구체적인 오류 메시지 표시
      let errorMessage = '슬롯 등록 목록을 불러오는데 실패했습니다.';
      if (err instanceof Error) {
        errorMessage += ` (${err.message})`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 고객 페이지 데이터 로드 함수
  const loadCustomerData = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();

      if (response.ok) {
        const customerList = result.users || [];
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
  const workGroups = ['공통', 'VIP', '프리미엄', '기본'];

  // 장비그룹 옵션
  const equipmentGroups = ['지정안함', '그룹A', '그룹B', '그룹C'];

  // 폼 입력 처리
  const handleInputChange = (
    field: keyof SlotAddForm,
    value: string | number
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 대량 등록 폼 입력 처리
  const handleBulkInputChange = (
    field: keyof BulkSlotData,
    value: string | number | string[]
  ) => {
    setBulkForm(prev => ({ ...prev, [field]: value }));
  };

  // 슬롯 등록 처리 (slot_status 테이블에 저장)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.keyword || !form.linkUrl || !form.slotCount) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      // URL 파라미터에서 고객 정보 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const customerId = urlParams.get('customerId');
      const username = urlParams.get('username');
      const customerName = urlParams.get('customerName');
      const slotType = urlParams.get('slotType');

      if (!customerId || !username) {
        alert('고객 정보가 없습니다. 다시 접속해주세요.');
        return;
      }

      // customerName이 비어있으면 username을 사용
      const finalCustomerName = customerName || username;

      // slot_status 테이블에 저장할 데이터 준비
      const slotStatusData = {
        customer_id: username,
        customer_name: finalCustomerName,
        distributor: '일반', // 기본값
        work_group: form.workGroup,
        keyword: form.keyword,
        link_url: form.linkUrl,
        memo: form.memo,
        current_rank: '1 [0]',
        start_rank: '1 [0]',
        slot_count: form.slotCount,
        traffic: '0 (0/0)',
        equipment_group: form.equipmentGroup,
        usage_days: 30,
        status: '작동중',
        slot_type: slotType || '쿠팡', // 슬롯 타입 (쿠팡, 네이버 등)
      };

      // slot_status 테이블에 저장
      const response = await fetch('/api/slot-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotStatusData),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('❌ API 응답 실패:', result.error);
        throw new Error(result.error || '슬롯 등록에 실패했습니다.');
      }

      // 새로운 슬롯 등록 추가 (화면 업데이트)
      const newCustomer: CustomerSlot = {
        id: result.data.id,
        customer: result.data.customer_name || finalCustomerName,
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
        registrationDate: result.data.created_at
          ? `${new Date(result.data.created_at).toISOString().split('T')[0]} ~ ${new Date(new Date(result.data.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`
          : generateRegistrationDateRange(),
        status: '작동중',
        memo: form.memo,
        created_at: result.data.created_at,
      };

      // 슬롯 현황 업데이트 (사용된 슬롯 수 증가)
      setCustomerSlotStatus(prev => ({
        ...prev,
        usedSlots: prev.usedSlots + form.slotCount,
        remainingSlots: Math.max(0, prev.remainingSlots - form.slotCount),
      }));

      // 폼 초기화
      setForm({
        workGroup: '공통',
        keyword: '',
        linkUrl: '',
        slotCount: 1,
        memo: '',
        equipmentGroup: '지정안함',
      });

      // 슬롯 등록 목록 새로고침
      await loadCustomers();

      // 작업등록 상태 업데이트
      setHasWorkRegisteredSlots(true);

      alert('슬롯이 성공적으로 등록되었습니다!');
    } catch (error: unknown) {
      console.error('❌ 슬롯 등록 실패 - 전체 오류 객체:', error);
      console.error('❌ 오류 메시지:', (error as Error)?.message);
      console.error('❌ 오류 코드:', (error as Record<string, unknown>)?.code);
      console.error('❌ 오류 스택:', (error as Error)?.stack);
      console.error('❌ 오류 타입:', typeof error);
      console.error('❌ 오류 키:', Object.keys(error || {}));

      // 사용자에게 더 구체적인 오류 메시지 표시
      let errorMessage = '슬롯 등록에 실패했습니다.';
      if ((error as Error)?.message) {
        errorMessage += ` (${(error as Error).message})`;
      }
      if ((error as Record<string, unknown>)?.code) {
        errorMessage += ` [코드: ${(error as Record<string, unknown>).code}]`;
      }

      alert(errorMessage);
    }
  };

  // 대량 작업 등록
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // bulkData 파싱
    const lines = bulkForm.bulkData
      .trim()
      .split('\n')
      .filter(line => line.trim() !== '');
    if (lines.length === 0) {
      alert('대량 등록 데이터를 입력해주세요.');
      return;
    }

    const parsedData: Array<{
      keyword: string;
      linkUrl: string;
      slotCount: number;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 공백과 탭 모두 구분자로 사용
      const parts = line.split(/[\s\t]+/);

      if (parts.length < 3) {
        alert(
          `${i + 1}번째 줄의 형식이 잘못되었습니다. 형식: 검색어 링크주소 슬롯수`
        );
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
      const promises = parsedData.map(async data => {
        // URL 파라미터에서 고객 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const customerId = urlParams.get('customerId');
        const username = urlParams.get('username');
        const customerName = urlParams.get('customerName');
        const slotType = urlParams.get('slotType');

        if (!customerId || !username) {
          throw new Error('고객 정보가 없습니다. 다시 접속해주세요.');
        }

        // customerName이 비어있으면 username을 사용
        const finalCustomerName = customerName || username;

        const slotStatusData = {
          customer_id: username,
          customer_name: finalCustomerName,
          distributor: '일반', // 기본값
          work_group: bulkForm.workGroup,
          keyword: data.keyword,
          link_url: data.linkUrl,
          memo: bulkForm.memo,
          current_rank: '1 [0]',
          start_rank: '1 [0]',
          slot_count: data.slotCount,
          traffic: '0 (0/0)',
          equipment_group: bulkForm.equipmentGroup,
          usage_days: 30,
          status: '작동중',
          slot_type: slotType || '쿠팡', // 슬롯 타입 (쿠팡, 네이버 등)
        };

        // slot_status 테이블에 저장
        const response = await fetch('/api/slot-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slotStatusData),
        });

        const result = await response.json();

        if (!result.success) {
          console.error('❌ API 응답 실패:', result.error);
          throw new Error(result.error || '슬롯 등록에 실패했습니다.');
        }

        return result.data;
      });

      const savedCustomers = await Promise.all(promises);

      // 새로운 고객 슬롯들을 화면에 추가
      const newCustomers: CustomerSlot[] = savedCustomers.map(
        (savedCustomer, index) => ({
          id: savedCustomer.id,
          customer: savedCustomer.customer_name || savedCustomer.name,
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
          created_at: savedCustomer.created_at,
          customerId: savedCustomer.customer_id,
          slotSequence: savedCustomer.slot_sequence || index + 1,
        })
      );

      // 새로운 고객 슬롯들을 상태에 추가
      setCustomers((prevSlots: CustomerSlot[]) => [
        ...prevSlots,
        ...newCustomers,
      ]);

      // 대량 등록 폼 초기화
      setBulkForm({
        workGroup: '공통',
        keywords: [''],
        linkUrl: '',
        slotCount: 1,
        memo: '',
        equipmentGroup: '지정안함',
        bulkData: '',
      });

      // 모달 닫기
      setShowBulkModal(false);

      // 슬롯 등록 목록 새로고침
      await loadCustomers();

      // 작업등록 상태 업데이트
      setHasWorkRegisteredSlots(true);

      alert(`${parsedData.length}개의 슬롯이 성공적으로 등록되었습니다!`);
    } catch (error) {
      console.error('대량 슬롯 등록 실패:', error);
      alert('대량 슬롯 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setBulkLoading(false);
    }
  };

  // 슬롯 삭제 (slot_status 테이블에서 삭제하고 슬롯 현황 업데이트)
  const handleDeleteCustomer = async (id: number | undefined) => {
    if (!id) return;

    // 삭제할 슬롯 정보 찾기
    const customerToDelete = customers.find(customer => customer.id === id);
    if (!customerToDelete) {
      alert('삭제할 슬롯을 찾을 수 없습니다.');
      return;
    }

    if (
      confirm(
        `정말로 이 슬롯을 삭제하시겠습니까?\n슬롯 개수: ${customerToDelete.slotCount}개\n검색어: ${customerToDelete.keyword}`
      )
    ) {
      try {
        // slot_status 테이블에서 삭제 (실제 데이터베이스 ID 사용)
        const response = await fetch(
          `/api/slot-status/${customerToDelete.db_id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '슬롯 삭제에 실패했습니다.');
        }

        // 슬롯 현황 업데이트 (삭제된 슬롯 개수만큼 사용 중 슬롯 수 감소)
        setCustomerSlotStatus(prev => {
          const newUsedSlots = Math.max(
            0,
            prev.usedSlots - customerToDelete.slotCount
          );
          const newRemainingSlots = prev.totalSlots - newUsedSlots;

          return {
            ...prev,
            usedSlots: newUsedSlots,
            remainingSlots: newRemainingSlots,
          };
        });

        // 슬롯 등록 목록 새로고침
        await loadCustomers();

        // 작업등록 상태 재확인
        const updatedCustomers = customers.filter(
          customer => customer.id !== id
        );
        const hasRegisteredSlots = updatedCustomers.some(
          slot => slot.keyword && slot.keyword.trim() !== ''
        );
        setHasWorkRegisteredSlots(hasRegisteredSlots);

        alert(
          `슬롯이 성공적으로 삭제되었습니다.\n삭제된 슬롯 개수: ${customerToDelete.slotCount}개`
        );
      } catch (error) {
        console.error('슬롯 삭제 실패:', error);
        alert('슬롯 삭제에 실패했습니다. 다시 시도해주세요.');
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
      equipmentGroup: customer.equipmentGroup,
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
      const updatedData: Record<string, unknown> = {
        keyword: editForm.keyword,
        link_url: editForm.linkUrl,
        memo: editForm.memo,
        slot_count: editForm.slotCount,
        work_group: editForm.workGroup,
        equipment_group: editForm.equipmentGroup,
      };

      await updateCustomer(editingCustomer.id, updatedData);

      // 로컬 상태 업데이트
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === editingCustomer.id
            ? { ...customer, ...editForm }
            : customer
        )
      );

      setEditingCustomer(null);
      setEditForm({});
      alert('고객 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('고객 수정 실패:', error);
      alert('고객 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 수정 폼 입력 처리
  const handleEditInputChange = (
    field: keyof CustomerSlot,
    value: string | number
  ) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(
        customers.map(customer => customer.id).filter(Boolean) as number[]
      );
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
      const updatePromises = selectedIds.map(async customerId => {
        const updatedData: Record<string, unknown> = {};
        if (bulkEditForm.keyword !== undefined)
          updatedData.keyword = bulkEditForm.keyword;
        if (bulkEditForm.linkUrl !== undefined)
          updatedData.link_url = bulkEditForm.linkUrl;
        if (bulkEditForm.slotCount !== undefined)
          updatedData.slot_count = bulkEditForm.slotCount;

        if (Object.keys(updatedData).length > 0) {
          return await updateCustomer(customerId, updatedData);
        }
      });

      await Promise.all(updatePromises);

      // 로컬 상태 업데이트
      setCustomers(prev =>
        prev.map(customer =>
          selectedCustomers.has(customer.id || 0)
            ? { ...customer, ...bulkEditForm }
            : customer
        )
      );

      setBulkEditMode(false);
      setBulkEditForm({});
      setSelectedCustomers(new Set());
      setSelectAll(false);
      alert(`${selectedIds.length}개 고객의 정보가 성공적으로 수정되었습니다.`);
    } catch (error) {
      console.error('전체 수정 실패:', error);
      alert('전체 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 전체 삭제 (개별행 삭제 기능을 참고하여 구현)
  const handleBulkDelete = async () => {
    if (selectedCustomers.size === 0) {
      alert('삭제할 슬롯을 선택해주세요.');
      return;
    }

    // 삭제할 슬롯들의 정보 수집
    const slotsToDelete = customers.filter(customer =>
      selectedCustomers.has(customer.id || 0)
    );
    const totalSlotsToDelete = slotsToDelete.reduce(
      (sum, slot) => sum + slot.slotCount,
      0
    );

    if (
      !confirm(
        `선택된 ${selectedCustomers.size}개 슬롯을 정말로 삭제하시겠습니까?\n총 삭제될 슬롯 개수: ${totalSlotsToDelete}개`
      )
    ) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedCustomers);
      const deletePromises = selectedIds.map(async slotId => {
        // 순번으로 고객 찾기
        const customerToDelete = customers.find(
          customer => customer.id === slotId
        );
        if (!customerToDelete || !customerToDelete.db_id) {
          throw new Error(`슬롯 ${slotId}의 DB ID를 찾을 수 없습니다.`);
        }

        // 개별행 삭제와 동일한 API 엔드포인트 사용 (실제 데이터베이스 ID 사용)
        const response = await fetch(
          `/api/slot-status/${customerToDelete.db_id}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || `슬롯 ${slotId} 삭제에 실패했습니다.`
          );
        }

        return result;
      });

      await Promise.all(deletePromises);

      // 로컬 상태 업데이트 (삭제된 슬롯들 제거)
      setCustomers(prev =>
        prev.filter(customer => !selectedCustomers.has(customer.id || 0))
      );

      // 슬롯 현황 업데이트 (삭제된 슬롯 개수만큼 사용 중 슬롯 수 감소)
      setCustomerSlotStatus(prev => {
        const newUsedSlots = Math.max(0, prev.usedSlots - totalSlotsToDelete);
        const newRemainingSlots = prev.totalSlots - newUsedSlots;

        return {
          ...prev,
          usedSlots: newUsedSlots,
          remainingSlots: newRemainingSlots,
        };
      });

      setSelectedCustomers(new Set());
      setSelectAll(false);

      // 작업등록 상태 재확인
      const updatedCustomers = customers.filter(
        customer => !selectedCustomers.has(customer.id || 0)
      );
      const hasRegisteredSlots = updatedCustomers.some(
        slot => slot.keyword && slot.keyword.trim() !== ''
      );
      setHasWorkRegisteredSlots(hasRegisteredSlots);

      alert(
        `${selectedIds.length}개 슬롯이 성공적으로 삭제되었습니다.\n삭제된 총 슬롯 개수: ${totalSlotsToDelete}개`
      );
    } catch (error) {
      console.error('전체 삭제 실패:', error);
      alert('전체 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 전체 수정 폼 입력 처리
  const handleBulkEditInputChange = (
    field: keyof CustomerSlot,
    value: string | number
  ) => {
    setBulkEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    try {
      // 엑셀에 포함할 데이터 준비
      const excelData = customers.map((customer, index) => ({
        No: customer.id || index + 1,
        고객명: customer.customer,
        닉네임: customer.nickname,
        작업그룹: customer.workGroup,
        검색어: customer.keyword,
        링크주소: customer.linkUrl,
        메모: customer.memo || '',
        현재순위: customer.currentRank,
        시작순위: customer.startRank,
        슬롯수: customer.slotCount,
        트래픽: customer.traffic,
        장비그룹: customer.equipmentGroup,
        잔여기간: calculateRemainingTime(customer.registrationDate),
        '등록일/만료일': customer.registrationDate,
        상태: customer.status,
        등록일시: customer.created_at || '',
      }));

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 자동 조정
      const columnWidths = [
        { wch: 8 }, // No
        { wch: 20 }, // 고객명
        { wch: 15 }, // 닉네임
        { wch: 12 }, // 작업그룹
        { wch: 25 }, // 검색어
        { wch: 50 }, // 링크주소
        { wch: 30 }, // 메모
        { wch: 15 }, // 현재순위
        { wch: 15 }, // 시작순위
        { wch: 10 }, // 슬롯수
        { wch: 15 }, // 트래픽
        { wch: 12 }, // 장비그룹
        { wch: 20 }, // 잔여기간
        { wch: 35 }, // 등록일/만료일
        { wch: 10 }, // 상태
        { wch: 20 }, // 등록일시
      ];
      worksheet['!cols'] = columnWidths;

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '고객목록');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `고객목록_${dateStr}_${timeStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      alert(
        `${customers.length}개 고객 데이터가 엑셀 파일로 다운로드되었습니다.`
      );
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다. 다시 시도해주세요.');
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
        No: customer.id || index + 1,
        고객명: customer.customer,
        닉네임: customer.nickname,
        작업그룹: customer.workGroup,
        검색어: customer.keyword,
        링크주소: customer.linkUrl,
        메모: customer.memo || '',
        현재순위: customer.currentRank,
        시작순위: customer.startRank,
        슬롯수: customer.slotCount,
        트래픽: customer.traffic,
        장비그룹: customer.equipmentGroup,
        잔여기간: calculateRemainingTime(customer.registrationDate),
        '등록일/만료일': customer.registrationDate,
        상태: customer.status,
        등록일시: customer.created_at || '',
      }));

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 자동 조정
      const columnWidths = [
        { wch: 8 }, // No
        { wch: 20 }, // 고객명
        { wch: 15 }, // 닉네임
        { wch: 12 }, // 작업그룹
        { wch: 25 }, // 검색어
        { wch: 50 }, // 링크주소
        { wch: 30 }, // 메모
        { wch: 15 }, // 현재순위
        { wch: 15 }, // 시작순위
        { wch: 10 }, // 슬롯수
        { wch: 15 }, // 트래픽
        { wch: 12 }, // 장비그룹
        { wch: 20 }, // 잔여기간
        { wch: 35 }, // 등록일/만료일
        { wch: 10 }, // 상태
        { wch: 20 }, // 등록일시
      ];
      worksheet['!cols'] = columnWidths;

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '선택된고객목록');

      // 파일명 생성 (현재 날짜 포함)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `선택된고객목록_${dateStr}_${timeStr}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      alert(
        `${selectedData.length}개 선택된 고객 데이터가 엑셀 파일로 다운로드되었습니다.`
      );
    } catch (error) {
      console.error('선택된 고객 엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다. 다시 시도해주세요.');
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

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
              {/* 고객 정보 */}
              {(() => {
                const customerId = searchParams.get('customerId');
                const username = searchParams.get('username');
                const customerName = searchParams.get('customerName');

                if (username) {
                  // slots 테이블에서 실제 고객명 찾기
                  const actualCustomerName =
                    customerSlotStatus.customerName ||
                    (customerName
                      ? decodeURIComponent(customerName)
                      : username);

                  return (
                    <div className="flex items-center space-x-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          고객 ID: {username}
                        </div>
                        <div className="text-sm text-gray-600">
                          고객명: {actualCustomerName}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    사용 가능한 슬롯
                  </h2>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {hasWorkRegisteredSlots
                      ? customerSlotStatus.remainingSlots
                      : customerSlotStatus.totalSlots}
                  </div>
                  <div className="text-sm text-gray-600">
                    사용 가능{' '}
                    {hasWorkRegisteredSlots
                      ? customerSlotStatus.remainingSlots
                      : customerSlotStatus.totalSlots}
                    개
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {customerSlotStatus.usedSlots}
                  </div>
                  <div className="text-sm text-gray-600">
                    사용 중 {customerSlotStatus.usedSlots}개
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {customerSlotStatus.totalSlots}
                  </div>
                  <div className="text-sm text-gray-600">
                    총 {customerSlotStatus.totalSlots}개
                  </div>
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
                  <Label htmlFor="workGroup" className="text-sm">
                    작업그룹
                  </Label>
                  <Select
                    value={form.workGroup}
                    onValueChange={value =>
                      handleInputChange('workGroup', value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="keyword" className="text-sm">
                    검색어
                  </Label>
                  <Input
                    id="keyword"
                    placeholder="검색어"
                    value={form.keyword}
                    onChange={e => handleInputChange('keyword', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex-[2]">
                  <Label htmlFor="linkUrl" className="text-sm">
                    링크주소
                  </Label>
                  <Input
                    id="linkUrl"
                    placeholder="링크주소"
                    value={form.linkUrl}
                    onChange={e => handleInputChange('linkUrl', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="w-20">
                  <Label htmlFor="slotCount" className="text-sm">
                    사용슬롯
                  </Label>
                  <Input
                    id="slotCount"
                    type="number"
                    placeholder="슬롯수"
                    value={form.slotCount}
                    onChange={e =>
                      handleInputChange(
                        'slotCount',
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="h-9"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="memo" className="text-sm">
                    메모
                  </Label>
                  <Input
                    id="memo"
                    placeholder="메모"
                    value={form.memo}
                    onChange={e => handleInputChange('memo', e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="equipmentGroup" className="text-sm">
                    장비그룹
                  </Label>
                  <Select
                    value={form.equipmentGroup}
                    onValueChange={value =>
                      handleInputChange('equipmentGroup', value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 px-6 h-9"
                  disabled={
                    (hasWorkRegisteredSlots
                      ? customerSlotStatus.remainingSlots
                      : customerSlotStatus.totalSlots) < form.slotCount
                  }
                >
                  {(hasWorkRegisteredSlots
                    ? customerSlotStatus.remainingSlots
                    : customerSlotStatus.totalSlots) < form.slotCount
                    ? '사용 가능한 슬롯 부족'
                    : '작업등록'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkModal(true)}
                  className="px-6 h-9"
                  disabled={
                    (hasWorkRegisteredSlots
                      ? customerSlotStatus.remainingSlots
                      : customerSlotStatus.totalSlots) === 0
                  }
                >
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
                <h2 className="text-xl font-bold text-gray-800">
                  대량 작업 등록
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkModal(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>

              {/* 예시 섹션 */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border-l-4 border-blue-400">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">
                  📝 사용 예시
                </h3>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">아래와 같이 한 줄씩 입력하세요:</p>
                  <div className="bg-white p-3 rounded border font-mono text-xs">
                    <span className="text-blue-600 font-semibold">검색어</span>{' '}
                    <span className="text-green-600 font-semibold">
                      링크주소
                    </span>{' '}
                    <span className="text-red-600 font-semibold">슬롯수</span>
                    <br />
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      검색어 링크주소 슬롯수
                    </div>
                    <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                      검색어 링크주소 슬롯수
                    </div>
                  </div>
                  <p className="mt-2 text-xs">
                    형식: 검색어 + 링크주소 + 슬롯수 (공백 또는 탭으로 구분)
                  </p>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      대량 등록 데이터
                    </Label>
                    <Textarea
                      placeholder="검색어 링크주소 슬롯수"
                      value={bulkForm.bulkData || ''}
                      onChange={e =>
                        handleBulkInputChange('bulkData', e.target.value)
                      }
                      className="h-20 mt-1 bulk-data-textarea"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      한 줄에 하나씩 입력하세요. 형식: 검색어 + 링크주소 +
                      슬롯수 (공백 또는 탭으로 구분)
                    </p>
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
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
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

        {/* 슬롯 등록 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{listTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 전체 수정 모드 폼 */}
            {bulkEditMode && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-blue-800">
                    전체 수정 모드 ({selectedCustomers.size}개 선택됨)
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
                      onChange={e =>
                        handleBulkEditInputChange('keyword', e.target.value)
                      }
                      placeholder="검색어를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">링크주소</Label>
                    <Input
                      value={bulkEditForm.linkUrl || ''}
                      onChange={e =>
                        handleBulkEditInputChange('linkUrl', e.target.value)
                      }
                      placeholder="링크주소를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">슬롯수</Label>
                    <Input
                      type="number"
                      value={bulkEditForm.slotCount || ''}
                      onChange={e =>
                        handleBulkEditInputChange(
                          'slotCount',
                          parseInt(e.target.value) || 1
                        )
                      }
                      placeholder="슬롯수를 입력하세요"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 검색어, 링크주소, 슬롯수만 수정 가능합니다. 빈 필드는
                  수정되지 않습니다.
                </p>
              </div>
            )}

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
                  <Input
                    placeholder="검색 (고객, 검색어, 링크주소)"
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
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
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
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
            ) : !hasWorkRegisteredSlots ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">
                  📋 작업등록된 슬롯이 없습니다
                </div>
                <p className="text-gray-400">
                  위의 슬롯 등록 폼을 사용하여 작업을 등록해주세요.
                </p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-center w-8">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-12">
                        순번
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-24">
                        아이디
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-32">
                        작업그룹/검색어
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-48">
                        링크주소/메모
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-20">
                        현재순위
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-20">
                        시작순위
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-16">
                        슬롯
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-20">
                        트래픽
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-24">
                        장비그룹
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-28">
                        잔여기간
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-32">
                        등록일/만료일
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-16">
                        상태
                      </th>
                      <th className="border border-gray-300 p-2 text-center w-20">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => (
                      <tr
                        key={`customer-${customer.id || index}`}
                        className={index === 0 ? 'bg-pink-100' : ''}
                      >
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={selectedCustomers.has(customer.id || 0)}
                            onCheckedChange={checked =>
                              handleSelectCustomer(
                                customer.id || 0,
                                checked as boolean
                              )
                            }
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">
                          {customer.id}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {(() => {
                            // URL 파라미터에서 customerId와 username 확인
                            const urlParams = new URLSearchParams(
                              window.location.search
                            );
                            const customerId = urlParams.get('customerId');
                            const username = urlParams.get('username');

                            // 개별 고객 페이지인지 확인
                            const isIndividualCustomerPage =
                              customerId && username;

                            if (isIndividualCustomerPage) {
                              // 개별 고객 페이지에서는 링크 없이 일반 텍스트로 표시
                              return (
                                <>
                                  <div className="font-bold text-xs">
                                    {customer.customer}
                                  </div>
                                  {(() => {
                                    const customerInfo = findCustomerInfo(
                                      customer.customer
                                    );
                                    return customerInfo ? (
                                      <>
                                        <div className="text-xs text-gray-600">
                                          ({customerInfo.name as string})
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {customerInfo.distributor as string}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-xs text-gray-600">
                                          ({customer.nickname})
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {customer.workGroup}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </>
                              );
                            } else {
                              // 관리자 페이지에서는 클릭 가능한 링크로 표시
                              return (
                                <>
                                  <button
                                    onClick={() => {
                                      // 고객 정보에서 customerId 찾기
                                      const customerInfo = findCustomerInfo(
                                        customer.customer
                                      );
                                      if (customerInfo) {
                                        // 개별 고객 페이지로 이동
                                        const url = `/coupangapp/add?customerId=${customerInfo.id}&username=${customerInfo.username}&slotCount=10&customerName=${encodeURIComponent(customerInfo.name as string)}&slotType=coupang`;
                                        window.open(url, '_blank');
                                      } else {
                                        // 고객 정보가 없으면 기본값으로 이동
                                        const url = `/coupangapp/add?customerId=unknown&username=${customer.customer}&slotCount=10&customerName=${encodeURIComponent(customer.customer)}&slotType=coupang`;
                                        window.open(url, '_blank');
                                      }
                                    }}
                                    className="font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                    title="클릭하여 개별 고객 페이지로 이동"
                                  >
                                    {customer.customer}
                                  </button>
                                  {(() => {
                                    const customerInfo = findCustomerInfo(
                                      customer.customer
                                    );
                                    return customerInfo ? (
                                      <>
                                        <div className="text-xs text-gray-600">
                                          ({customerInfo.name as string})
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {customerInfo.distributor as string}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-xs text-gray-600">
                                          ({customer.nickname})
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {customer.workGroup}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </>
                              );
                            }
                          })()}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="mb-1">
                            <Select
                              value={
                                editingCustomer?.id === customer.id
                                  ? editForm.workGroup
                                  : customer.workGroup
                              }
                              onValueChange={value =>
                                editingCustomer?.id === customer.id
                                  ? handleEditInputChange('workGroup', value)
                                  : undefined
                              }
                              disabled={editingCustomer?.id !== customer.id}
                            >
                              <SelectTrigger className="w-20 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {workGroups.map(group => (
                                  <SelectItem key={group} value={group}>
                                    {group}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            value={
                              editingCustomer?.id === customer.id
                                ? editForm.keyword
                                : customer.keyword
                            }
                            onChange={e =>
                              editingCustomer?.id === customer.id
                                ? handleEditInputChange(
                                    'keyword',
                                    e.target.value
                                  )
                                : undefined
                            }
                            className="w-full h-6 text-xs"
                            readOnly={editingCustomer?.id !== customer.id}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="mb-1">
                            <Input
                              value={
                                editingCustomer?.id === customer.id
                                  ? editForm.linkUrl
                                  : customer.linkUrl
                              }
                              onChange={e =>
                                editingCustomer?.id === customer.id
                                  ? handleEditInputChange(
                                      'linkUrl',
                                      e.target.value
                                    )
                                  : undefined
                              }
                              className="w-full h-6 text-xs text-ellipsis"
                              readOnly={editingCustomer?.id !== customer.id}
                              title={customer.linkUrl}
                            />
                          </div>
                          <Input
                            value={
                              editingCustomer?.id === customer.id
                                ? editForm.memo
                                : customer.memo || ''
                            }
                            onChange={e =>
                              editingCustomer?.id === customer.id
                                ? handleEditInputChange('memo', e.target.value)
                                : undefined
                            }
                            className="w-full h-6 text-xs text-ellipsis"
                            readOnly={editingCustomer?.id !== customer.id}
                            title={customer.memo || ''}
                            placeholder="메모를 입력하세요"
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRankClick(customer);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title="클릭하여 순위 변동 히스토리 보기"
                          >
                            {customer.currentRank}
                          </button>
                        </td>
                        <td className="border border-gray-300 p-2 text-center text-xs">
                          {customer.startRank}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {editingCustomer?.id === customer.id ? (
                            <Input
                              type="number"
                              value={editForm.slotCount}
                              onChange={e =>
                                handleEditInputChange(
                                  'slotCount',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-12 h-6 text-xs text-center"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {customer.slotCount}
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <div className="text-xs">{customer.traffic}</div>
                          <div className="text-xs text-gray-600">
                            {trafficCounter}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Select
                            value={
                              editingCustomer?.id === customer.id
                                ? editForm.equipmentGroup
                                : customer.equipmentGroup
                            }
                            onValueChange={value =>
                              editingCustomer?.id === customer.id
                                ? handleEditInputChange('equipmentGroup', value)
                                : undefined
                            }
                            disabled={editingCustomer?.id !== customer.id}
                          >
                            <SelectTrigger className="w-20 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {equipmentGroups.map(group => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <span className="inline-block px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded">
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
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-6 w-6 p-0 text-gray-600 hover:text-gray-800"
                                  title="취소"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
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
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteCustomer(customer.id)
                                  }
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  title="삭제"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
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

            {/* 만료슬롯 보기 버튼 */}
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                만료슬롯 보기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 순위 히스토리 테이블 모달 */}
        {showRankChart && selectedSlot && (
          <div
            className="fixed inset-0 flex items-center justify-center z-[9999]"
            onClick={() => setShowRankChart(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transform transition-all duration-300 ease-in-out"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  순위 변동 히스토리 - {selectedSlot.keyword}
                </h3>
                <button
                  onClick={() => setShowRankChart(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
                  title="닫기"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {rankHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-center">
                          순번
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          변동일
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          순위
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          등락폭
                        </th>
                        <th className="border border-gray-300 p-2 text-center">
                          시작대비
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankHistory.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 text-center">
                            {item.sequence}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {item.changeDate}
                          </td>
                          <td className="border border-gray-300 p-2 text-center font-medium">
                            {item.rank}
                          </td>
                          <td
                            className={`border border-gray-300 p-2 text-center ${
                              item.rankChange > 0
                                ? 'text-red-600'
                                : item.rankChange < 0
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {item.rankChange > 0
                              ? `+${item.rankChange}`
                              : item.rankChange}
                          </td>
                          <td
                            className={`border border-gray-300 p-2 text-center ${
                              item.startRankDiff > 0
                                ? 'text-red-600'
                                : item.startRankDiff < 0
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {item.startRankDiff > 0
                              ? `+${item.startRankDiff}`
                              : item.startRankDiff}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  순위 변동 데이터가 없습니다.
                </div>
              )}

              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <strong>검색어:</strong> {selectedSlot.keyword}
                </p>
                <p>
                  <strong>링크:</strong> {selectedSlot.linkUrl}
                </p>
                <p>
                  <strong>현재 순위:</strong> {selectedSlot.currentRank}
                </p>
                <p>
                  <strong>시작 순위:</strong> {selectedSlot.startRank}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SlotAddPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      }
    >
      <SlotAddPageContent />
    </Suspense>
  );
}
