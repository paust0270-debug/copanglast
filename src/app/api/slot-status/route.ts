import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
}

// 슬롯 현황 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 슬롯 현황 조회 중...');

    const { searchParams } = new URL(request.url);
    const userGroup = searchParams.get('userGroup');
    const searchQuery = searchParams.get('search');
    const customerId = searchParams.get('customerId'); // 특정 고객 ID 파라미터

    // 슬롯 테이블에서 데이터 조회
    let slotsQuery = supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    // 총판별 필터링
    if (userGroup && userGroup !== '0') {
      slotsQuery = slotsQuery.eq('memo', userGroup);
    }

    const { data: slotsData, error: slotsError } = await slotsQuery;

    if (slotsError) {
      console.error('슬롯 데이터 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '슬롯 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 고객 테이블에서 데이터 조회
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('고객 데이터 조회 오류:', customersError);
      return NextResponse.json(
        { error: '고객 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 특정 고객이 요청된 경우 해당 고객의 슬롯 현황만 계산
    if (customerId) {
      console.log('🔍 특정 고객 슬롯 현황 조회:', customerId);
      
      const customerSlots = slotsData?.filter(slot => slot.customer_id === customerId) || [];
      console.log('📊 고객 슬롯 데이터:', customerSlots);
      
      // 해당 고객의 총 슬롯 수 계산 (모든 슬롯의 slot_count 합계)
      const totalSlots = customerSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
      
      // 해당 고객의 사용된 슬롯 수 계산 (active 상태인 슬롯들의 slot_count 합계)
      const usedSlots = customerSlots
        .filter(slot => slot.status === 'active')
        .reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
      
      // 사용 가능한 슬롯 수 계산
      const remainingSlots = Math.max(0, totalSlots - usedSlots);
      
      console.log('📈 슬롯 현황 계산 결과:', {
        totalSlots,
        usedSlots,
        remainingSlots,
        customerSlotsCount: customerSlots.length,
        activeSlots: customerSlots.filter(slot => slot.status === 'active').length
      });
      
      const customerData = customersData?.find(customer => customer.id === customerId);
      
      return NextResponse.json({
        success: true,
        data: [{
          id: customerId,
          customerId: customerId,
          customerName: customerData?.name || '',
          slotType: '쿠팡',
          slotCount: totalSlots, // 총 슬롯 수
          usedSlots: usedSlots, // 사용된 슬롯 수
          remainingSlots: remainingSlots, // 사용 가능한 슬롯 수
          totalPaymentAmount: customerSlots[0]?.payment_amount || 0,
          remainingDays: customerSlots[0]?.usage_days || 0,
          registrationDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          expiryDate: customerSlots[0]?.created_at && customerSlots[0]?.usage_days ? 
            new Date(new Date(customerSlots[0].created_at).getTime() + customerSlots[0].usage_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
          addDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          status: customerSlots[0]?.status || 'inactive',
          userGroup: customerSlots[0]?.memo || '본사'
        }],
        stats: {
          totalSlots,
          usedSlots,
          remainingSlots,
          totalCustomers: 1
        }
      });
    }

    // 만료된 슬롯들을 자동으로 만료 상태로 업데이트
    const expiredSlots = slotsData?.filter(slot => {
      if (!slot.created_at || !slot.usage_days || slot.status === 'expired') return false;
      
      const now = new Date();
      const createdDate = new Date(slot.created_at);
      const totalUsageMs = slot.usage_days * 24 * 60 * 60 * 1000;
      const elapsedMs = now.getTime() - createdDate.getTime();
      
      return elapsedMs >= totalUsageMs;
    }) || [];

    // 만료된 슬롯들을 데이터베이스에서 업데이트
    if (expiredSlots.length > 0) {
      console.log(`🔄 ${expiredSlots.length}개의 슬롯이 만료되어 상태를 업데이트합니다.`);
      
      const expiredSlotIds = expiredSlots.map(slot => slot.id);
      
      const { error: updateError } = await supabase
        .from('slots')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredSlotIds);
      
      if (updateError) {
        console.error('만료된 슬롯 상태 업데이트 오류:', updateError);
      } else {
        console.log(`✅ ${expiredSlots.length}개의 슬롯이 만료 상태로 업데이트되었습니다.`);
        
        // 업데이트된 슬롯들의 상태를 로컬 데이터에서도 변경
        slotsData?.forEach(slot => {
          if (expiredSlotIds.includes(slot.id)) {
            slot.status = 'expired';
          }
        });
      }
    }

    // 슬롯 데이터를 슬롯 현황 형식으로 변환
    const slotStatusData = slotsData?.map(slot => {
      // 해당 고객의 사용된 슬롯 수 계산
      const usedSlots = slotsData.filter(s => 
        s.customer_id === slot.customer_id && 
        s.status === 'active'
      ).length;
      
      // 실제 사용시간 기반 잔여기간 계산 (일, 시간, 분 단위)
      const now = new Date();
      const createdDate = slot.created_at ? new Date(slot.created_at) : now;
      const usageDays = slot.usage_days || 0;
      
      // 총 사용 시간을 밀리초로 변환
      const totalUsageMs = usageDays * 24 * 60 * 60 * 1000;
      
      // 경과 시간 계산 (밀리초)
      const elapsedMs = now.getTime() - createdDate.getTime();
      
      // 실제 잔여 시간 계산 (밀리초)
      const remainingMs = Math.max(0, totalUsageMs - elapsedMs);
      
      // 잔여 시간을 일, 시간, 분으로 변환
      const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      
      // 잔여기간 문자열 생성
      let remainingTimeString = '';
      if (remainingDays > 0) {
        remainingTimeString += `${remainingDays}일`;
      }
      if (remainingHours > 0) {
        remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingHours}시간`;
      }
      if (remainingMinutes > 0) {
        remainingTimeString += (remainingTimeString ? ' ' : '') + `${remainingMinutes}분`;
      }
      if (!remainingTimeString) {
        remainingTimeString = '만료됨';
      }
      
      // 등록일과 만료일 계산
      const registrationDate = createdDate.toISOString().split('T')[0];
      const expiryDate = usageDays > 0 ? 
        new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '';
      
      // 만료 여부 확인 (잔여 시간이 0이면 만료)
      const isExpired = remainingMs === 0 && usageDays > 0;
      
      // 슬롯타입을 한글로 변환
      const getSlotTypeKorean = (slotType: string) => {
        switch (slotType) {
          case 'coupang':
            return '쿠팡';
          case 'coupang-vip':
            return '쿠팡VIP';
          case 'coupang-app':
            return '쿠팡 앱';
          case 'naver-shopping':
            return '네이버 쇼핑';
          case 'place':
            return '네이버 플레이스';
          case 'today-house':
            return '오늘의집';
          case 'aliexpress':
            return '알리익스프레스';
          default:
            return slotType;
        }
      };
      
      return {
        id: slot.id,
        customerId: slot.customer_id,
        customerName: slot.customer_name,
        slotType: getSlotTypeKorean(slot.slot_type),
        slotCount: slot.slot_count,
        usedSlots: usedSlots,
        remainingSlots: Math.max(0, slot.slot_count - usedSlots),
        totalPaymentAmount: slot.payment_amount || 0, // 총 입금액
        remainingDays: remainingDays, // 잔여일수 (기존 호환성)
        remainingHours: remainingHours, // 잔여시간
        remainingMinutes: remainingMinutes, // 잔여분
        remainingTimeString: remainingTimeString, // 잔여기간 문자열
        registrationDate: registrationDate, // 등록일
        expiryDate: expiryDate, // 만료일
        addDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        status: isExpired ? 'expired' : slot.status,
        userGroup: slot.memo || '본사' // memo 필드를 userGroup으로 사용
      };
    }) || [];

    // 검색 필터링
    let filteredData = slotStatusData;
    if (searchQuery) {
      filteredData = filteredData.filter(slot =>
        slot.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 통계 계산
    const stats = {
      totalSlots: filteredData.reduce((sum, slot) => sum + slot.slotCount, 0),
      usedSlots: filteredData.reduce((sum, slot) => sum + slot.usedSlots, 0),
      remainingSlots: filteredData.reduce((sum, slot) => sum + slot.remainingSlots, 0),
      totalCustomers: filteredData.length
    };

    console.log('✅ 슬롯 현황 조회 완료');
    console.log(`📊 총 ${filteredData.length}개의 슬롯 데이터 조회됨`);

    return NextResponse.json({
      success: true,
      data: filteredData,
      stats: stats
    });

  } catch (error) {
    console.error('슬롯 현황 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
