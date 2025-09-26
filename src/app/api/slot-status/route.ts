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
    const username = searchParams.get('username'); // 실제 고객명 (customer_id와 매칭)
    const type = searchParams.get('type'); // 'slots' 또는 'slot_status' 구분

    // type 파라미터에 따라 다른 테이블 조회
    if (type === 'slot_status') {
      // slot_status 테이블 조회 (쿠팡 앱 추가 페이지용)
      let slotStatusQuery = supabase
        .from('slot_status')
        .select('*')
        .order('created_at', { ascending: false });

      // 개별 고객 필터링 (customerId와 username이 있는 경우)
      if (customerId && username) {
        slotStatusQuery = slotStatusQuery.eq('customer_id', username);
        console.log('🔍 개별 고객 슬롯 필터링:', { customerId, username });
      }

      const { data: slotStatusData, error: slotStatusError } = await slotStatusQuery;

      if (slotStatusError) {
        console.error('slot_status 데이터 조회 오류:', slotStatusError);
        return NextResponse.json(
          { error: '슬롯 등록 데이터를 불러오는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // slot_status 데이터를 슬롯 등록 목록 형식으로 변환 (사용자별 순번 1번부터 시작)
      const formattedSlotStatusData = slotStatusData?.map((slot, index) => {
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
        
        return {
          id: index + 1, // 사용자별 순번 1번부터 시작
          db_id: slot.id, // 실제 데이터베이스 ID (삭제용)
          customer_id: slot.customer_id,
          customer_name: slot.customer_name,
          distributor: slot.distributor,
          work_group: slot.work_group,
          keyword: slot.keyword,
          link_url: slot.link_url,
          memo: slot.memo,
          current_rank: slot.current_rank,
          start_rank: slot.start_rank,
          slot_count: slot.slot_count,
          traffic: slot.traffic,
          equipment_group: slot.equipment_group,
          usage_days: slot.usage_days,
          remaining_days: remainingDays,
          remaining_hours: remainingHours,
          remaining_minutes: remainingMinutes,
          remaining_time_string: remainingTimeString,
          registration_date: registrationDate,
          expiry_date: expiryDate,
          status: slot.status,
          created_at: slot.created_at
        };
      }) || [];

      return NextResponse.json({
        success: true,
        data: formattedSlotStatusData
      });
    }

    // 기본: slots 테이블 조회 (슬롯 현황 페이지용)
    let slotsQuery = supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    // 특정 고객 필터링 (username으로 필터링)
    if (username) {
      slotsQuery = slotsQuery.eq('customer_id', username);
    }

    const { data: slotsData, error: slotsError } = await slotsQuery;

    if (slotsError) {
      console.error('slots 데이터 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '슬롯 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 특정 고객이 요청된 경우 해당 고객의 슬롯 현황만 계산
    if (customerId && username) {
      console.log('🔍 특정 고객 슬롯 현황 조회:', { customerId, username });
      
      // 해당 고객의 슬롯 데이터 (이미 username으로 필터링됨)
      const customerSlots = slotsData || [];
      console.log('📊 고객 슬롯 데이터:', customerSlots);
      
      // 해당 고객의 총 슬롯 수 계산
      const totalSlots = customerSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
      
      // 사용된 슬롯 수는 slot_status 테이블에서 해당 고객의 등록된 작업 수
      let usedSlots = 0;
      try {
        const { data: slotStatusData } = await supabase
          .from('slot_status')
          .select('slot_count')
          .eq('customer_id', username);
        
        usedSlots = slotStatusData?.reduce((sum, slot) => sum + (slot.slot_count || 0), 0) || 0;
      } catch (error) {
        console.error('slot_status 조회 오류:', error);
      }
      
      // 사용 가능한 슬롯 수 계산
      const remainingSlots = Math.max(0, totalSlots - usedSlots);
      
      console.log('📈 슬롯 현황 계산 결과:', {
        totalSlots,
        usedSlots,
        remainingSlots,
        customerSlotsCount: customerSlots.length
      });
      
      // 고객 정보 조회 (slots 테이블에서 customer_name 우선 사용)
      let customerName = '';
      let distributor = '본사';
      
      // slots 테이블에서 customer_name 조회
      if (customerSlots && customerSlots.length > 0) {
        customerName = customerSlots[0].customer_name || '';
        distributor = customerSlots[0].work_group || '본사';
      }
      
      // customer_name이 없으면 users 테이블에서 조회
      if (!customerName) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('name, distributor')
            .eq('username', username)
            .single();
          
          if (userData) {
            customerName = userData.name || '';
            distributor = userData.distributor || '본사';
          }
        } catch (error) {
          console.error('고객 정보 조회 오류:', error);
        }
      }
      
      return NextResponse.json({
        success: true,
        data: [{
          id: customerId,
          customerId: customerId,
          customerName: customerName,
          slotType: customerSlots[0]?.slot_type || '쿠팡',
          slotCount: totalSlots,
          usedSlots: usedSlots,
          remainingSlots: remainingSlots,
          pausedSlots: 0,
          totalPaymentAmount: customerSlots.reduce((sum, slot) => sum + (slot.payment_amount || 0), 0),
          remainingDays: customerSlots[0]?.usage_days || 0,
          registrationDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          expiryDate: customerSlots[0]?.expiry_date ? new Date(customerSlots[0].expiry_date).toISOString().split('T')[0] : '',
          addDate: customerSlots[0]?.created_at ? new Date(customerSlots[0].created_at).toISOString().split('T')[0] : '',
          status: customerSlots[0]?.status || '작동중',
          userGroup: distributor
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
      if (!slot.created_at || !slot.usage_days || slot.status === '만료') return false;
      
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
          status: '만료',
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
            slot.status = '만료';
          }
        });
      }
    }

    // slots 데이터를 슬롯 현황 형식으로 변환
    const formattedSlotStatusData = slotsData?.map(slot => {
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
      
      return {
        id: slot.id,
        customerId: slot.customer_id,
        customerName: '', // 별도로 조회 필요
        slotType: slot.slot_type || '쿠팡',
        slotCount: slot.slot_count || 1,
        usedSlots: 0, // slot_status 테이블에서 계산
        remainingSlots: slot.slot_count || 1,
        pausedSlots: 0,
        totalPaymentAmount: slot.payment_amount || 0,
        remainingDays: remainingDays,
        remainingHours: remainingHours,
        remainingMinutes: remainingMinutes,
        remainingTimeString: remainingTimeString,
        registrationDate: registrationDate,
        expiryDate: expiryDate,
        addDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        status: isExpired ? 'expired' : slot.status,
        userGroup: '본사' // 별도로 조회 필요
      };
    }) || [];

    // 검색 필터링
    let filteredData = formattedSlotStatusData;
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

// 슬롯 등록 (개별 슬롯 할당 로직)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 개별 슬롯 할당 처리 중...');
    
    const body = await request.json();
    console.log('받은 데이터:', body);

    // 필수 필드 검증
    const requiredFields = ['customer_id', 'customer_name', 'keyword', 'link_url', 'slot_count'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `필수 필드가 누락되었습니다: ${field}` },
          { status: 400 }
        );
      }
    }

    const requestedSlotCount = parseInt(body.slot_count);
    const customerId = body.customer_id;

    console.log(`🎯 고객 ${customerId}에게 ${requestedSlotCount}개 슬롯 할당 요청`);

    // 1. slots 테이블에서 해당 고객의 사용 가능한 슬롯 조회 (usage_days 내림차순)
    const { data: availableSlots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('usage_days', { ascending: false }); // 잔여기간이 긴 순서로 정렬

    if (slotsError) {
      console.error('사용 가능한 슬롯 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '사용 가능한 슬롯을 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!availableSlots || availableSlots.length === 0) {
      console.log('❌ 할당 가능한 슬롯이 없습니다.');
      return NextResponse.json(
        { error: '할당 가능한 슬롯이 없습니다.' },
        { status: 400 }
      );
    }

    console.log('📊 사용 가능한 슬롯 목록:', availableSlots);

    // 2. 요청된 슬롯 수만큼 순차적으로 할당
    const slotStatusEntries = [];
    let remainingRequestedSlots = requestedSlotCount;

    for (const slot of availableSlots) {
      if (remainingRequestedSlots <= 0) break;

      const availableCount = slot.slot_count || 0;
      const assignCount = Math.min(remainingRequestedSlots, availableCount);

      if (assignCount > 0) {
        // 개별 슬롯을 slot_status 테이블에 저장 (각각 slot_count: 1)
        for (let i = 0; i < assignCount; i++) {
          slotStatusEntries.push({
            customer_id: customerId,
            customer_name: body.customer_name,
            distributor: body.distributor || '일반',
            work_group: body.work_group || '공통',
            keyword: body.keyword,
            link_url: body.link_url,
            memo: body.memo || '',
            current_rank: body.current_rank || '1 [0]',
            start_rank: body.start_rank || '1 [0]',
            slot_count: 1, // 개별 슬롯은 항상 1개
            traffic: body.traffic || '0 (0/0)',
            equipment_group: body.equipment_group || '지정안함',
            usage_days: slot.usage_days, // 원본 슬롯의 잔여기간 사용
            status: body.status || '작동중',
            slot_type: body.slot_type || '쿠팡',
            created_at: new Date().toISOString()
          });
        }

        remainingRequestedSlots -= assignCount;
        console.log(`✅ 슬롯 ID ${slot.id}에서 ${assignCount}개 할당 (잔여기간: ${slot.usage_days}일)`);
      }
    }

    if (slotStatusEntries.length === 0) {
      console.log('❌ 할당할 수 있는 슬롯이 없습니다.');
      return NextResponse.json(
        { error: '할당할 수 있는 슬롯이 없습니다.' },
        { status: 400 }
      );
    }

    // 3. slot_status 테이블에 개별 슬롯들 삽입
    const { data: insertedData, error: insertError } = await supabase
      .from('slot_status')
      .insert(slotStatusEntries)
      .select();

    if (insertError) {
      console.error('개별 슬롯 저장 오류:', insertError);
      return NextResponse.json(
        { error: `개별 슬롯 저장 중 오류가 발생했습니다: ${insertError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ ${insertedData.length}개의 개별 슬롯이 성공적으로 할당되었습니다.`);
    console.log('📋 할당된 슬롯 상세:', insertedData);

    return NextResponse.json({
      success: true,
      data: insertedData,
      message: `${insertedData.length}개의 슬롯이 성공적으로 할당되었습니다.`,
      allocatedCount: insertedData.length,
      requestedCount: requestedSlotCount
    });

  } catch (error) {
    console.error('개별 슬롯 할당 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 개별 슬롯 삭제
export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 개별 슬롯 삭제 처리 중...');
    
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('id');

    if (!slotId) {
      return NextResponse.json(
        { error: '삭제할 슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 슬롯 ID ${slotId} 삭제 요청`);

    // slot_status 테이블에서 해당 슬롯 삭제
    const { error: deleteError } = await supabase
      .from('slot_status')
      .delete()
      .eq('id', slotId);

    if (deleteError) {
      console.error('슬롯 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: `슬롯 삭제 중 오류가 발생했습니다: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 ID ${slotId} 삭제 완료`);
    return NextResponse.json({
      success: true,
      message: '슬롯이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 삭제 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
