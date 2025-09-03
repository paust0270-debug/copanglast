'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// 실제 DB 스키마 기반 슬롯 번들 인터페이스
interface SlotBundle {
  // slot_bundles 테이블
  id: string;                    // slot_bundles.id
  user_id: string;               // slot_bundles.user_id
  service_id: number;            // slot_bundles.service_id (쿠팡APP=8)
  slot_count: number;            // slot_bundles.slot_count
  start_date: string;            // slot_bundles.start_date
  expire_date: string;           // slot_bundles.expire_date
  status: '작동중' | '만료' | '정지' | '취소';  // slot_bundles.status
  memo: string;                  // slot_bundles.memo
  created_at: string;            // slot_bundles.created_at
  
  // users 테이블 (JOIN)
  username: string;              // users.username (고객아이디)
  nickname: string;              // users.nickname (고객닉네임)
  
  // user_groups 테이블 (JOIN)
  group_name: string;            // user_groups.name (총판명)
  
  // payments 테이블 (LEFT JOIN)
  payment_amount?: number;       // payments.amount
  payment_type?: '현금' | '카드' | '외상';  // payments.payment_type
  refund?: boolean;              // payments.refund
  
  // 계산된 값들
  remaining_days: number;        // DATEDIFF(expire_date, NOW())
  service_name: string;          // service_id → 서비스명 매핑
}

export default function CoupangAppPage() {
  const router = useRouter();
  
  // 필터 상태
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 실제 DB JOIN 결과를 시뮬레이션한 데이터 (예시)
  const [slotBundles, setSlotBundles] = useState<SlotBundle[]>([
    {
      id: '1',
      user_id: '4686',
      service_id: 8,
      slot_count: 5,
      start_date: '2024-01-15',
      expire_date: '2024-02-14',
      status: '작동중',
      memo: '쿠팡APP 신규 슬롯 추가',
      created_at: '2024-01-15',
      username: 'plejoy',
      nickname: 'plejoy 고객',
      group_name: 'firetoo',
      payment_amount: 100000,
      payment_type: '현금',
      refund: false,
      remaining_days: 25,
      service_name: '쿠팡APP'
    },
    {
      id: '2',
      user_id: '4687',
      service_id: 8,
      slot_count: 2,
      start_date: '2024-01-10',
      expire_date: '2024-02-09',
      status: '작동중',
      memo: '파비플로라 상품 랭킹 관리',
      created_at: '2024-01-10',
      username: '파비플로라',
      nickname: '파비플로라 고객',
      group_name: 'firetoo',
      payment_amount: 60000,
      payment_type: '현금',
      refund: false,
      remaining_days: 13,
      service_name: '쿠팡APP'
    },
    {
      id: '3',
      user_id: '4688',
      service_id: 8,
      slot_count: 3,
      start_date: '2024-01-08',
      expire_date: '2024-02-07',
      status: '작동중',
      memo: '썬캡 상품 랭킹 관리',
      created_at: '2024-01-08',
      username: '썬캡',
      nickname: '썬캡 고객',
      group_name: 'firetoo',
      payment_amount: undefined,
      payment_type: undefined,
      refund: undefined,
      remaining_days: 13,
      service_name: '쿠팡APP'
    },
    {
      id: '4',
      user_id: '4689',
      service_id: 8,
      slot_count: 1,
      start_date: '2024-01-01',
      expire_date: '2024-01-31',
      status: '만료',
      memo: 'plejoy1 고객 슬롯',
      created_at: '2024-01-01',
      username: 'plejoy1',
      nickname: 'plejoy1 고객',
      group_name: 'plejoy',
      payment_amount: 20000,
      payment_type: '현금',
      refund: false,
      remaining_days: -7,
      service_name: '쿠팡APP'
    }
  ]);

  // 필터링된 데이터
  const filteredSlotBundles = useMemo(() => {
    return slotBundles.filter(bundle => {
      const matchesGroup = selectedGroup === 'all' || bundle.group_name === selectedGroup;
      const matchesStatus = selectedStatus === 'all' || bundle.status === selectedStatus;
      const matchesKeyword = searchKeyword === '' || 
        bundle.username.includes(searchKeyword) || 
        bundle.nickname.includes(searchKeyword) || 
        bundle.memo.includes(searchKeyword);
      
      return matchesGroup && matchesStatus && matchesKeyword;
    });
  }, [slotBundles, selectedGroup, selectedStatus, searchKeyword]);

  // 총계 계산
  const totals = useMemo(() => {
    return filteredSlotBundles.reduce((acc, bundle) => {
      acc.totalSlots += bundle.slot_count;
      acc.totalAmount += bundle.payment_amount || 0;
      acc.activeSlots += bundle.status === '작동중' ? bundle.slot_count : 0;
      acc.expiredSlots += bundle.status === '만료' ? bundle.slot_count : 0;
      acc.creditSlots += bundle.payment_type === '외상' ? bundle.slot_count : 0;
      return acc;
    }, { totalSlots: 0, totalAmount: 0, activeSlots: 0, expiredSlots: 0, creditSlots: 0 });
  }, [filteredSlotBundles]);

  // 슬롯 추가 페이지로 이동
  const handleAddSlot = () => {
    router.push('/coupangapp/add');
  };

  // 슬롯 수정
  const handleEditSlot = (id: string) => {
    router.push(`/coupangapp/edit/${id}`);
  };

  // 슬롯 삭제
  const handleDeleteSlot = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setSlotBundles(prev => prev.filter(bundle => bundle.id !== id));
    }
  };

  // 상태별 배지 색상
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case '작동중': return 'default';
      case '만료': return 'secondary';
      case '정지': return 'destructive';
      case '취소': return 'outline';
      default: return 'default';
    }
  };

  // 잔여일수 표시
  const getRemainingDaysDisplay = (days: number) => {
    if (days > 0) {
      return <span className="text-green-600 font-medium">{days}일</span>;
    } else if (days === 0) {
      return <span className="text-orange-600 font-medium">오늘 만료</span>;
    } else {
      return <span className="text-red-600 font-medium">만료 ({Math.abs(days)}일)</span>;
    }
  };

  // 결제정보 표시
  const getPaymentDisplay = (bundle: SlotBundle) => {
    if (bundle.payment_amount && bundle.payment_type) {
      return (
        <div>
          <div className="font-medium">
            {bundle.payment_amount.toLocaleString()}원
          </div>
          <div className="text-gray-500 text-xs">
            {bundle.payment_type}
            {bundle.refund && ' (환불)'}
          </div>
        </div>
      );
    } else {
      return <span className="text-orange-600 text-sm">외상</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              쿠팡 APP 슬롯 관리
            </h1>
            <p className="text-lg text-gray-600">
              슬롯 번들 현황을 확인하고 관리하세요 (DB JOIN 결과)
            </p>
          </div>
          <Button onClick={handleAddSlot} className="bg-blue-600 hover:bg-blue-700">
            슬롯 추가
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 슬롯 수</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalSlots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">작동 중인 슬롯</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totals.activeSlots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">만료된 슬롯</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totals.expiredSlots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">외상 슬롯</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totals.creditSlots}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 결제 금액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totals.totalAmount.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 섹션 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="group-filter">총판 선택</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="총판 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="firetoo">firetoo</SelectItem>
                    <SelectItem value="plejoy">plejoy</SelectItem>
                    <SelectItem value="본사">본사</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">상태</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="작동중">작동중</SelectItem>
                    <SelectItem value="만료">만료</SelectItem>
                    <SelectItem value="정지">정지</SelectItem>
                    <SelectItem value="취소">취소</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="search">검색</Label>
                <Input
                  id="search"
                  placeholder="고객명 또는 메모 검색"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedGroup('all');
                    setSelectedStatus('all');
                    setSearchKeyword('');
                  }}
                >
                  필터 초기화
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 슬롯 번들 테이블 (실제 DB JOIN 결과) */}
        <Card>
          <CardHeader>
            <CardTitle>슬롯 번들 목록 (DB JOIN 결과)</CardTitle>
            <p className="text-sm text-gray-600">
              slot_bundles + users + user_groups + payments JOIN 결과
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      소속총판
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      슬롯추가일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      슬롯유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      슬롯수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      입금정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      외상여부
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용일수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      잔여일수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSlotBundles.map((bundle, index) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="outline">{bundle.group_name}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{bundle.nickname}</div>
                          <div className="text-gray-500 text-xs">{bundle.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(bundle.start_date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant="secondary">
                          {bundle.service_name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bundle.slot_count}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPaymentDisplay(bundle)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bundle.payment_type === '외상' ? (
                          <Badge variant="destructive">외상</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.ceil((new Date(bundle.expire_date).getTime() - new Date(bundle.start_date).getTime()) / (1000 * 60 * 60 * 24))}일
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Badge variant={getStatusBadgeVariant(bundle.status)}>
                          {bundle.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={bundle.memo}>
                          {bundle.memo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRemainingDaysDisplay(bundle.remaining_days)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSlot(bundle.id)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSlot(bundle.id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
