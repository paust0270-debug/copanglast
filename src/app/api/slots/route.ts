import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
}

// 슬롯 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 슬롯 목록 조회 중...');

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const slotType = searchParams.get('slotType');

    let query = supabase
      .from('slots')
      .select('id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group')
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (slotType) {
      query = query.eq('slot_type', slotType);
    }

    const { data: slots, error } = await query;

    if (error) {
      console.error('슬롯 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '슬롯 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('🔍 슬롯 조회 결과:', {
      customerId,
      slotType,
      totalSlots: slots?.length || 0,
      slots: slots?.map(slot => ({
        id: slot.id,
        customer_id: slot.customer_id,
        slot_type: slot.slot_type,
        slot_count: slot.slot_count,
        status: slot.status
      }))
    });

    return NextResponse.json({
      success: true,
      data: slots
    });

  } catch (error) {
    console.error('슬롯 목록 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 추가
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 슬롯 추가 시작...');

    const body = await request.json();
    const {
      customerId,
      customerName,
      slotType,
      slotCount,
      paymentType,
      payerName,
      paymentAmount,
      paymentDate,
      usageDays,
      memo
    } = body;

    // 필수 필드 검증
    if (!customerId || !customerName || !slotType || !slotCount) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`슬롯 추가 시작: ${customerName} (${slotType} ${slotCount}개)`);

    // 슬롯 데이터 생성 (현재 시간 기준)
    const now = new Date();
    const usageDaysValue = usageDays ? parseInt(usageDays) : 0;
    const expiryDate = new Date(now.getTime() + usageDaysValue * 24 * 60 * 60 * 1000);
    
    // 현재 시간을 로컬 시간으로 포맷팅 (slots 테이블과 동일한 형식)
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // slot_status 테이블용 날짜 포맷팅 (UTC 오프셋 제거)
    const formatSlotStatusDate = (date: Date) => {
      // UTC로 변환하지 않고 로컬 시간을 그대로 문자열로 변환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    
    const slotData = {
      customer_id: customerId,
      customer_name: customerName,
      slot_type: slotType,
      slot_count: parseInt(slotCount),
      payment_type: paymentType || null,
      payer_name: payerName || null,
      payment_amount: paymentAmount ? parseInt(paymentAmount) : null,
      payment_date: paymentDate || null,
      usage_days: usageDaysValue,
      memo: memo || null,
      status: 'active',
      created_at: formatLocalDate(now),
      updated_at: formatLocalDate(expiryDate)
    };

    // 슬롯 추가
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .insert([slotData])
      .select()
      .single();

    if (slotError) {
      console.error('슬롯 추가 오류:', slotError);
      return NextResponse.json(
        { error: `슬롯 추가 중 오류가 발생했습니다: ${slotError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 슬롯 추가 완료:', slot);

    // slot_status 테이블에 레코드 생성 (고객별 순번 관리)
    console.log('🔄 slot_status 레코드 생성 시작...');
    console.log('🔍 현재 고객 정보:', { customerId, customerName, slotType, slotCount });
    try {
      // 고객별 최대 순번 조회
      console.log(`고객 ${customerId}의 최대 순번 조회 중...`);
      const { data: maxSequenceData, error: sequenceError } = await supabase
        .from('slot_status')
        .select('slot_sequence')
        .eq('customer_id', customerId)
        .order('slot_sequence', { ascending: false })
        .limit(1);

      console.log('순번 조회 결과:', { maxSequenceData, sequenceError });

      let nextSequence = 1;
      if (!sequenceError && maxSequenceData && maxSequenceData.length > 0) {
        nextSequence = (maxSequenceData[0].slot_sequence || 0) + 1;
        console.log(`기존 최대 순번: ${maxSequenceData[0].slot_sequence}, 다음 순번: ${nextSequence}`);
      } else {
        console.log('기존 순번 없음, 첫 번째 순번: 1');
      }

      console.log(`고객 ${customerId}의 다음 순번: ${nextSequence}`);

      // 슬롯 개수만큼 개별 레코드 생성 (키워드별 개별 사용을 위해)
      const slotStatusRecords = [];
      for (let i = 0; i < parseInt(slotCount); i++) {
        const slotStatusData = {
          customer_id: customerId,
          customer_name: customerName,
          slot_type: slotType,
          slot_count: 1, // 각 레코드는 1개씩
          slot_sequence: nextSequence + i,
          status: '작동중', // 작업 등록 전 상태 (제약조건에 따라 '작동중'으로 설정)
          usage_days: usageDaysValue, // slots 테이블과 동일한 잔여기간
          distributor: '일반', // 기본값
          work_group: '공통', // 기본값
          equipment_group: '지정안함', // 기본값
          keyword: '', // NOT NULL 제약조건을 위해 빈 문자열로 설정
          link_url: '', // NOT NULL 제약조건을 위해 빈 문자열로 설정
          memo: '', // 기본값
          current_rank: '', // 기본값
          start_rank: '', // 기본값
          traffic: '', // 기본값
          created_at: formatSlotStatusDate(now).replace('T', ' '), // slots 테이블과 동일한 등록일 (공백으로 변경)
          updated_at: formatSlotStatusDate(expiryDate).replace('T', ' '), // slots 테이블과 동일한 만료일 (공백으로 변경)
          expiry_date: formatSlotStatusDate(expiryDate).replace('T', ' ') // 만료일 전용 컬럼 (공백으로 변경)
        };
        slotStatusRecords.push(slotStatusData);
      }

      console.log(`slot_status 생성 데이터: ${slotStatusRecords.length}개 레코드`);

      const { data: slotStatus, error: slotStatusError } = await supabase
        .from('slot_status')
        .insert(slotStatusRecords)
        .select();

      if (slotStatusError) {
        console.error('❌ slot_status 레코드 생성 실패:', slotStatusError);
        console.error('오류 코드:', slotStatusError.code);
        console.error('오류 메시지:', slotStatusError.message);
        console.error('오류 세부사항:', slotStatusError.details);
      } else {
        console.log('✅ slot_status 레코드 생성 완료:', slotStatus);
        
        // 생성 시점에 이미 올바른 만료일이 설정되었으므로 추가 업데이트 불필요
      }
    } catch (error) {
      console.error('❌ slot_status 레코드 생성 중 예외 발생:', error);
      console.error('오류 스택:', error.stack);
    }

    // 고객의 추가횟수 증가
    try {
      // 현재 추가횟수 조회
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('additional_count')
        .eq('username', customerId)
        .single();

      if (fetchError) {
        console.log('추가횟수 조회 실패 (무시):', fetchError);
      } else {
        // 추가횟수 증가
        const newCount = (currentUser.additional_count || 0) + 1;
        const { error: updateError } = await supabase
          .from('users')
          .update({ additional_count: newCount })
          .eq('username', customerId);

        if (updateError) {
          console.log('추가횟수 업데이트 실패 (무시):', updateError);
        } else {
          console.log('✅ 고객 추가횟수 증가 완료:', newCount);
        }
      }
    } catch (error) {
      console.log('추가횟수 업데이트 중 오류 (무시):', error);
    }

    // 정산 테이블에도 데이터 저장 (미정산 페이지에서 조회하기 위해)
    try {
      // 등록된 총판명 조회 (distributors 테이블에서)
      const { data: distributorsData, error: distributorsError } = await supabase
        .from('distributors')
        .select('name')
        .order('created_at', { ascending: true })
        .limit(1);

      const distributorName = distributorsData && distributorsData.length > 0 
        ? distributorsData[0].name 
        : '일반'; // 기본값

      const settlementData = {
        customer_id: customerId,
        customer_name: customerName,
        distributor_name: distributorName, // 등록된 총판명 사용
        slot_type: slotType,
        slot_count: parseInt(slotCount),
        payment_type: paymentType || 'deposit', // 기본값으로 deposit 설정
        payer_name: payerName || '',
        payment_amount: paymentAmount ? parseInt(paymentAmount) : 0,
        usage_days: usageDays ? parseInt(usageDays) : 30,
        memo: memo || '',
        status: 'pending' // 미정산 상태로 생성
      };

      const { error: settlementError } = await supabase
        .from('settlements')
        .insert([settlementData]);

      if (settlementError) {
        console.log('정산 내역 저장 실패 (무시):', settlementError);
        // 정산 내역 저장 실패해도 슬롯 추가는 성공으로 처리
      } else {
        console.log('정산 내역 저장 완료 - 미정산 페이지에서 확인 가능');
      }
    } catch (error) {
      console.log('정산 내역 저장 중 오류 (무시):', error);
      // 정산 내역 저장 실패해도 슬롯 추가는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: slot,
      message: '슬롯이 성공적으로 추가되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 추가 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 상태 업데이트 (중지/재게)
export async function PUT(request: NextRequest) {
  try {
    const { slotId, status } = await request.json();
    
    if (!slotId || !status) {
      return NextResponse.json(
        { error: '슬롯 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }
    
    console.log('🔧 슬롯 상태 업데이트 요청:', { slotId, status });
    
    const { data, error } = await supabase
      .from('slots')
      .update({ 
        status
        // updated_at은 만료일이므로 상태 업데이트 시 변경하지 않음
      })
      .eq('id', slotId)
      .select();
    
    console.log('📊 Supabase 응답:', { data, error });
    
    if (error) {
      console.error('슬롯 상태 업데이트 오류:', error);
      return NextResponse.json(
        { error: '슬롯 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log(`✅ 슬롯 ${slotId}의 상태가 ${status}로 변경되었습니다.`);
    
    return NextResponse.json({
      success: true,
      data: data[0],
      message: `슬롯 상태가 ${status === 'inactive' ? '일시 중지' : '활성화'}되었습니다.`
    });
    
  } catch (error) {
    console.error('슬롯 상태 업데이트 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}