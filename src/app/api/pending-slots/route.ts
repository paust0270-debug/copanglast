import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 대기 상태 슬롯 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 대기 상태 슬롯 조회 중...');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const customerId = searchParams.get('customerId');

    let query = supabase
      .from('pending_slots')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // 특정 고객의 대기 슬롯만 조회
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('대기 상태 슬롯 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '대기 상태 슬롯을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log(`✅ 대기 상태 슬롯 조회 성공: ${data?.length || 0}개`);

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('대기 상태 슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 대기 상태 슬롯 추가
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 대기 상태 슬롯 추가 시작...');

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
        { success: false, error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`대기 상태 슬롯 추가: ${customerName} (${slotType} ${slotCount}개)`);

    // 대기 상태 슬롯 데이터 생성
    const pendingSlotData = {
      customer_id: customerId,
      customer_name: customerName,
      slot_type: slotType,
      slot_count: parseInt(slotCount),
      payment_type: paymentType || null,
      payer_name: payerName || null,
      payment_amount: paymentAmount ? parseInt(paymentAmount) : null,
      payment_date: paymentDate || null,
      usage_days: usageDays ? parseInt(usageDays) : null,
      memo: memo || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 대기 상태 슬롯 추가
    const { data: pendingSlot, error: pendingSlotError } = await supabase
      .from('pending_slots')
      .insert([pendingSlotData])
      .select()
      .single();

    if (pendingSlotError) {
      console.error('대기 상태 슬롯 추가 오류:', pendingSlotError);
      return NextResponse.json(
        { success: false, error: `대기 상태 슬롯 추가 중 오류가 발생했습니다: ${pendingSlotError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 대기 상태 슬롯 추가 완료:', pendingSlot);

    return NextResponse.json({
      success: true,
      data: pendingSlot,
      message: '슬롯이 대기 상태로 추가되었습니다. 승인 후 사용 가능합니다.'
    });

  } catch (error) {
    console.error('대기 상태 슬롯 추가 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 대기 상태 슬롯 승인/거부
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 대기 상태 슬롯 승인/거부 처리 시작...');

    const body = await request.json();
    const { id, action, approvedBy, rejectionReason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID와 처리 액션이 필요합니다.' },
        { status: 400 }
      );
    }

    // 대기 상태 슬롯 조회
    const { data: pendingSlot, error: fetchError } = await supabase
      .from('pending_slots')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !pendingSlot) {
      return NextResponse.json(
        { success: false, error: '대기 상태 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // 승인 처리: 실제 슬롯 테이블에 추가
      const slotData = {
        customer_id: pendingSlot.customer_id,
        customer_name: pendingSlot.customer_name,
        slot_type: pendingSlot.slot_type,
        slot_count: pendingSlot.slot_count,
        payment_type: pendingSlot.payment_type,
        payer_name: pendingSlot.payer_name,
        payment_amount: pendingSlot.payment_amount,
        payment_date: pendingSlot.payment_date,
        usage_days: pendingSlot.usage_days,
        memo: pendingSlot.memo,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { data: approvedSlot, error: approveError } = await supabase
        .from('slots')
        .insert([slotData])
        .select()
        .single();

      if (approveError) {
        console.error('슬롯 승인 처리 오류:', approveError);
        return NextResponse.json(
          { success: false, error: `슬롯 승인 처리 중 오류가 발생했습니다: ${approveError.message}` },
          { status: 500 }
        );
      }

      // 대기 상태 슬롯을 승인 상태로 업데이트
      const { error: updateError } = await supabase
        .from('pending_slots')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('대기 상태 슬롯 업데이트 오류:', updateError);
      }

      console.log('✅ 슬롯 승인 완료:', approvedSlot);

      return NextResponse.json({
        success: true,
        data: approvedSlot,
        message: '슬롯이 승인되어 사용 가능합니다.'
      });

    } else if (action === 'reject') {
      // 거부 처리: 대기 상태 슬롯을 거부 상태로 업데이트
      const { error: rejectError } = await supabase
        .from('pending_slots')
        .update({
          status: 'rejected',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (rejectError) {
        console.error('슬롯 거부 처리 오류:', rejectError);
        return NextResponse.json(
          { success: false, error: `슬롯 거부 처리 중 오류가 발생했습니다: ${rejectError.message}` },
          { status: 500 }
        );
      }

      console.log('✅ 슬롯 거부 완료:', id);

      return NextResponse.json({
        success: true,
        message: '슬롯이 거부되었습니다.'
      });
    }

    return NextResponse.json(
      { success: false, error: '잘못된 액션입니다. approve 또는 reject를 사용하세요.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('대기 상태 슬롯 처리 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
