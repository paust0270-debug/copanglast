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
    const skipSlotsTable = searchParams.get('skipSlotsTable'); // slots 테이블 조회 건너뛰기

    // type 파라미터에 따라 다른 테이블 조회
    if (type === 'slot_status') {
      // slot_status 테이블 조회 (쿠팡 앱 추가 페이지용) - 키워드가 있는 레코드만
      let slotStatusQuery = supabase
        .from('slot_status')
        .select('*')
        .not('keyword', 'eq', '') // 키워드가 비어있지 않은 레코드만
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

      // slots 테이블에서 동일한 고객의 데이터 조회 (잔여기간/등록일·만료일 계산용)
      let slotsData = null;
      if (customerId && username && !skipSlotsTable) {
        try {
          console.log('🔍 slots 테이블 조회 시작:', { customerId, username });
          const { data: slotsQueryData, error: slotsError } = await supabase
            .from('slots')
            .select('id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group')
            .eq('customer_id', username)
            .order('created_at', { ascending: false });

          if (slotsError) {
            console.error('❌ slots 테이블 조회 오류:', slotsError);
            console.error('❌ 오류 코드:', slotsError.code);
            console.error('❌ 오류 메시지:', slotsError.message);
            console.error('❌ 오류 세부사항:', slotsError.details);
            // slots 테이블 조회 실패해도 계속 진행
            slotsData = [];
          } else {
            slotsData = slotsQueryData;
            console.log('✅ slots 테이블 데이터 조회 완료:', slotsData?.length || 0, '개');
          }
        } catch (err) {
          console.error('❌ slots 테이블 조회 예외:', err);
          // 예외 발생해도 계속 진행
          slotsData = [];
        }
      } else if (skipSlotsTable) {
        console.log('⏭️ slots 테이블 조회 건너뛰기 (skipSlotsTable=true)');
        slotsData = [];
      }

      // slot_status 데이터를 슬롯 등록 목록 형식으로 변환 (사용자별 순번 1번부터 시작)
      const formattedSlotStatusData = slotStatusData?.map((slot, index) => {
        // slots 테이블에서 동일한 usage_days를 가진 데이터 찾기
        const matchingSlot = slotsData?.find((s: any) => s.usage_days === slot.usage_days);
        
        // slots 테이블 데이터가 있으면 그것을 사용, 없으면 slot_status 데이터 사용
        const baseData = matchingSlot || slot;
        
        console.log('슬롯 매칭 확인:', {
          slot_status_id: slot.id,
          slot_status_usage_days: slot.usage_days,
          slot_status_created_at: slot.created_at,
          matching_slot_found: !!matchingSlot,
          matching_slot_created_at: matchingSlot?.created_at,
          final_created_at: baseData.created_at,
          using_slots_data: !!matchingSlot
        });
        
        
        
        // 실제 현재 잔여기간 계산 (일, 시간, 분 단위) - 로컬 시간 기준
        const now = new Date();
        
        // DB에서 가져온 created_at을 로컬 시간으로 해석
        let createdDate = now;
        if (baseData.created_at) {
          // DB의 created_at이 로컬 시간 형식이므로 그대로 사용
          createdDate = new Date(baseData.created_at);
        }
        
        const usageDays = baseData.usage_days || 0;
        
        // 만료일 계산 (created_at + usage_days)
        const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
        
        // 실제 잔여 시간 계산 (밀리초)
        const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
        
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
        
        // 등록일과 만료일 계산 (로컬 시간 기준)
        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        const registrationDate = formatLocalDate(createdDate);
        const expiryDateString = usageDays > 0 ? formatLocalDate(expiryDate) : '';
        
        return {
          id: index + 1, // 순번 (1부터 시작)
          db_id: slot.id, // 실제 데이터베이스 ID (삭제용)
          customer_id: slot.customer_id,
          customer_name: slot.customer_name,
          distributor: slot.distributor,
          work_group: slot.work_group,
          keyword: slot.keyword,
          link_url: slot.link_url,
          current_rank: slot.current_rank,
          start_rank: slot.start_rank,
          slot_count: slot.slot_count,
          traffic: slot.traffic,
          equipment_group: slot.equipment_group,
          remaining_days: remainingTimeString,
          registration_date: registrationDate,
          expiry_date: expiryDateString,
          status: slot.status,
          memo: slot.memo,
          created_at: slot.created_at,
          usage_days: slot.usage_days
        };
      });

      return NextResponse.json({
        success: true,
        data: formattedSlotStatusData,
        slotsData: slotsData // slots 테이블 데이터도 함께 반환
      });
    }

    // 기본: slots 테이블 조회 (슬롯 현황 페이지용)
    let slotsQuery = supabase
      .from('slots')
      .select('id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group')
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

    // 특정 고객 요청인 경우 해당 고객의 슬롯 현황도 조회
    if (customerId && username) {
      console.log('🔍 특정 고객 슬롯 현황 조회:', { customerId, username });
      
      // 해당 고객의 슬롯 현황 (이미 username으로 필터링됨)
      const customerSlots = slotsData || [];
      console.log('📊 고객 슬롯 현황:', customerSlots);

      // 사용 중인 슬롯 수 계산 (slot_status 테이블에서 키워드가 있는 레코드만)
      let usedSlots = 0;
      try {
        const { data: slotStatusData } = await supabase
          .from('slot_status')
          .select('slot_count, keyword')
          .eq('customer_id', username)
          .not('keyword', 'eq', ''); // 키워드가 비어있지 않은 레코드만
        
        usedSlots = slotStatusData?.reduce((sum, slot) => sum + (slot.slot_count || 0), 0) || 0;
        console.log('📊 작업등록된 슬롯 수:', usedSlots);
      } catch (err) {
        console.log('slot_status 조회 중 오류 (무시):', err);
      }

      // 총 슬롯 수 계산
      const totalSlots = customerSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);

      // 고객 정보 조회 (slots 테이블에서 customer_name 우선 조회)
      let customerName = '';
      let distributor = '일반';
      
      // slots 테이블에서 customer_name 조회
      if (customerSlots && customerSlots.length > 0) {
        customerName = customerSlots[0].customer_name || '';
        distributor = customerSlots[0].work_group || '일반';
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
            distributor = userData.distributor || '일반';
          }
        } catch (err) {
          console.log('users 테이블 조회 중 오류 (무시):', err);
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
          remainingSlots: totalSlots - usedSlots,
          pausedSlots: 0,
          totalPaymentAmount: customerSlots.reduce((sum, slot) => sum + (slot.payment_amount || 0), 0),
          remainingDays: customerSlots[0]?.usage_days || 0,
          registrationDate: customerSlots[0]?.payment_date || '',
          expiryDate: customerSlots[0]?.payment_date || '',
          addDate: customerSlots[0]?.payment_date || '',
          status: customerSlots[0]?.status || 'active',
          userGroup: distributor
        }],
        stats: {
          totalSlots: totalSlots,
          usedSlots: usedSlots,
          remainingSlots: totalSlots - usedSlots,
          totalCustomers: 1
        }
      });
    }

    // 전체 슬롯 현황 조회
    const { data: slotStatusData } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', username)
      .order('created_at', { ascending: false });
    
    let filteredData = slotsData?.map(slot => {
      // 실제 현재 시간 기준 잔여기간 계산 (일, 시간, 분 단위) - 로컬 시간 기준
      const now = new Date();
      
      // DB에서 가져온 created_at을 로컬 시간으로 해석
      let createdDate = now;
      if (slot.created_at) {
        // DB의 created_at이 로컬 시간 형식이므로 그대로 사용
        createdDate = new Date(slot.created_at);
      }
      
      const usageDays = slot.usage_days || 0;
      
      // 만료일 계산 (created_at + usage_days)
      const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
      
      // 실제 잔여 시간 계산 (밀리초)
      const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
      
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
      
      // 등록일과 만료일 계산 (로컬 시간 기준)
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const registrationDate = formatLocalDate(createdDate);
      const expiryDateString = usageDays > 0 ? formatLocalDate(expiryDate) : '';
      
      // 만료 상태 확인 (잔여 시간이 0이면 만료)
      const isExpired = remainingMs === 0 && usageDays > 0;
      
      return {
        id: slot.id,
        customerId: slot.customer_id,
        customerName: slot.customer_name || '', // customer_name 필드 사용
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
        expiryDate: expiryDateString,
        addDate: slot.created_at ? new Date(slot.created_at).toISOString().split('T')[0] : '',
        status: isExpired ? 'expired' : slot.status,
        userGroup: slot.work_group || '일반'
      };
    }) || [];

    // 검색 필터링
    if (searchQuery) {
      filteredData = filteredData.filter(slot =>
        slot.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData
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

    const customerId = body.customer_id;
    const requestedSlotCount = parseInt(body.slot_count) || 1;

    console.log(`🎯 고객 ${customerId}에게 ${requestedSlotCount}개 슬롯 할당 요청`);

    // 1. slots 테이블에서 해당 고객의 사용 가능한 슬롯 조회 (usage_days 내림차순)
    const { data: availableSlots, error: slotsError } = await supabase
      .from('slots')
      .select('id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group')
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

    // 1.5. 현재 사용 중인 슬롯 수 확인 (키워드가 있는 레코드만)
    const { data: currentSlotStatus } = await supabase
      .from('slot_status')
      .select('slot_count, keyword')
      .eq('customer_id', customerId)
      .not('keyword', 'eq', ''); // 키워드가 비어있지 않은 레코드만

    const currentUsedSlots = currentSlotStatus?.reduce((sum, slot) => sum + (slot.slot_count || 0), 0) || 0;
    const totalAvailableSlots = availableSlots.reduce((sum, slot) => sum + (slot.slot_count || 0), 0);
    const remainingAvailableSlots = totalAvailableSlots - currentUsedSlots;

    console.log('📊 슬롯 현황:', {
      총사용가능: totalAvailableSlots,
      현재사용중: currentUsedSlots,
      남은사용가능: remainingAvailableSlots,
      요청슬롯수: requestedSlotCount
    });

    if (remainingAvailableSlots < requestedSlotCount) {
      return NextResponse.json(
        { error: `사용 가능한 슬롯이 부족합니다. (사용 가능: ${remainingAvailableSlots}개, 요청: ${requestedSlotCount}개)` },
        { status: 400 }
      );
    }

    // 2. 기존 slot_status 레코드 업데이트 (새 레코드 생성 방지)
    console.log('🔄 기존 slot_status 레코드 업데이트 시작...');
    
    // 기존 빈 레코드들 조회 (키워드가 비어있는 레코드)
    const { data: emptySlotStatus, error: emptySlotError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', customerId)
      .eq('keyword', '')
      .order('slot_sequence', { ascending: true })
      .limit(requestedSlotCount);

    if (emptySlotError) {
      console.error('빈 slot_status 레코드 조회 오류:', emptySlotError);
      return NextResponse.json(
        { error: '기존 슬롯 레코드를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log(`📊 조회된 빈 레코드 수: ${emptySlotStatus?.length || 0}개`);

    if (!emptySlotStatus || emptySlotStatus.length < requestedSlotCount) {
      return NextResponse.json(
        { error: `작업등록 가능한 슬롯이 부족합니다. (사용 가능: ${emptySlotStatus?.length || 0}개, 요청: ${requestedSlotCount}개)` },
        { status: 400 }
      );
    }

    // 요청된 수만큼 기존 레코드 업데이트 (잔여기간, 등록일, 만료일 보존)
    const updatePromises = [];
    for (let i = 0; i < requestedSlotCount; i++) {
      const existingRecord = emptySlotStatus[i];
      
      const updateData = {
        distributor: body.distributor || '일반',
        work_group: body.work_group || '공통',
        keyword: body.keyword,
        link_url: body.link_url,
        current_rank: body.current_rank || '1 [0]',
        start_rank: body.start_rank || '1 [0]',
        traffic: body.traffic || '0 (0/0)',
        equipment_group: body.equipment_group || '지정안함',
        status: body.status || '작동중',
        memo: body.memo || '',
        slot_type: body.slot_type || '쿠팡',
        slot_sequence: existingRecord.slot_sequence || (i + 1) // 기존 slot_sequence 보존, 없으면 순번 생성
        // usage_days, created_at, updated_at, expiry_date는 보존 (변경하지 않음)
      };

      updatePromises.push(
        supabase
          .from('slot_status')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
      );
    }

    console.log(`📝 ${requestedSlotCount}개 레코드 업데이트 중...`);

    const updateResults = await Promise.all(updatePromises);
    
    // 업데이트 결과 확인
    let successCount = 0;
    let errors = [];
    
    updateResults.forEach((result, index) => {
      if (result.error) {
        console.error(`레코드 ${index + 1} 업데이트 실패:`, result.error);
        errors.push(result.error);
      } else {
        successCount++;
        console.log(`✅ 레코드 ${index + 1} 업데이트 성공`);
      }
    });

    if (successCount === 0) {
      return NextResponse.json(
        { error: '모든 슬롯 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log(`✅ ${successCount}/${requestedSlotCount}개 레코드 업데이트 성공`);

    // 업데이트된 레코드들 조회
    const { data: updatedSlotStatus, error: selectError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', customerId)
      .eq('keyword', body.keyword)
      .order('slot_sequence', { ascending: true });

    if (selectError) {
      console.error('업데이트된 레코드 조회 오류:', selectError);
    }

    // 3. keywords 테이블에 키워드 정보 저장 (각 슬롯별로 개별 레코드 생성)
    if (body.keyword && updatedSlotStatus && updatedSlotStatus.length > 0) {
      try {
        // current_rank에서 숫자만 추출 (예: "5 [3]" -> 5)
        const extractRankNumber = (rankStr) => {
          if (!rankStr) return 1;
          const match = rankStr.match(/^(\d+)/);
          return match ? parseInt(match[1]) : 1;
        };

        // 각 슬롯별로 keywords 테이블에 개별 레코드 생성
        const keywordRecords = updatedSlotStatus.map(slot => ({
          keyword: body.keyword,
          link_url: body.link_url,
          slot_type: body.slot_type || '쿠팡',
          slot_count: 1, // 각 레코드는 1개 슬롯을 의미
          current_rank: extractRankNumber(body.current_rank),
          slot_sequence: slot.slot_sequence, // slot_status의 순번을 그대로 사용
          customer_id: customerId, // 고객 ID 추가
          slot_id: slot.id // slot_status 레코드 ID를 slot_id로 사용
        }));

        console.log(`📝 ${keywordRecords.length}개 키워드 레코드 생성 중...`);

        const { error: keywordError } = await supabase
          .from('keywords')
          .insert(keywordRecords);

        if (keywordError) {
          console.error('keywords 테이블 삽입 오류:', keywordError);
          // keywords 삽입 실패해도 슬롯 등록은 성공으로 처리
        } else {
          console.log(`✅ keywords 테이블에 ${keywordRecords.length}개 레코드 삽입 성공`);
        }
      } catch (err) {
        console.error('keywords 테이블 처리 중 오류:', err);
        // keywords 처리 실패해도 슬롯 등록은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSlotStatus,
      message: `${requestedSlotCount}개 슬롯이 성공적으로 등록되었습니다.`
    });

  } catch (error) {
    console.error('슬롯 등록 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}