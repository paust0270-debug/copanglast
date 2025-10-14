import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTimestampWithoutMs } from '@/lib/utils';

// 개별 슬롯 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;
    console.log(`🔄 슬롯 조회 중: ${slotId}`);

    const { data: slot, error } = await supabase
      .from('slots')
      .select(
        'id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group'
      )
      .eq('id', slotId)
      .single();

    if (error) {
      console.error('슬롯 조회 오류:', error);
      return NextResponse.json(
        { error: '슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error('슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 상태 변경 (일시중지/재개)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    console.log(`🔄 슬롯 상태 변경 중: ${slotId} -> ${newStatus}`);

    // 1. slots 테이블 조회
    const { data: slot, error: selectError } = await supabase
      .from('slots')
      .select('id, customer_id, status')
      .eq('id', slotId)
      .single();

    if (selectError || !slot) {
      console.error('슬롯 조회 오류:', selectError);
      return NextResponse.json(
        { error: '슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. slots 테이블 상태 업데이트
    const { error: slotsUpdateError } = await supabase
      .from('slots')
      .update({
        status: newStatus,
        updated_at: getTimestampWithoutMs(),
      })
      .eq('id', slotId);

    if (slotsUpdateError) {
      console.error('slots 테이블 업데이트 오류:', slotsUpdateError);
      return NextResponse.json(
        { error: 'slots 테이블 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3. slot_status 테이블의 모든 관련 레코드 업데이트
    const { data: slotStatusData, error: slotStatusError } = await supabase
      .from('slot_status')
      .update({
        updated_at: getTimestampWithoutMs(),
      })
      .eq('customer_id', slot.customer_id)
      .eq('slot_sequence', slot.id)
      .select();

    if (slotStatusError) {
      console.error('slot_status 테이블 업데이트 오류:', slotStatusError);
      return NextResponse.json(
        { error: 'slot_status 테이블 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const updatedCount = slotStatusData?.length || 0;
    console.log(
      `✅ 슬롯 상태 변경 완료: ${updatedCount}개 slot_status 레코드 업데이트`
    );

    return NextResponse.json({
      success: true,
      message: `슬롯 상태가 ${newStatus}로 변경되었습니다. (${updatedCount}개 slot_status 레코드 업데이트됨)`,
      updatedCount,
    });
  } catch (error) {
    console.error('슬롯 상태 변경 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  try {
    const { slotId } = await params;
    console.log(`🔄 슬롯 수정 시작: ${slotId}`);

    const body = await request.json();
    const {
      payment_type,
      payer_name,
      payment_amount,
      payment_date,
      usage_days,
      memo,
    } = body;

    // 수정할 데이터 준비
    const updateData: Record<string, unknown> = {
      updated_at: getTimestampWithoutMs(),
    };

    if (payment_type !== undefined) updateData.payment_type = payment_type;
    if (payer_name !== undefined) updateData.payer_name = payer_name;
    if (payment_amount !== undefined)
      updateData.payment_amount = payment_amount;
    if (payment_date !== undefined) updateData.payment_date = payment_date;
    if (usage_days !== undefined) updateData.usage_days = usage_days;
    if (memo !== undefined) updateData.memo = memo;

    // 슬롯 수정
    const { data: slot, error } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      console.error('슬롯 수정 오류:', error);
      return NextResponse.json(
        { error: `슬롯 수정 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 슬롯 수정 완료:', slot);

    return NextResponse.json({
      success: true,
      data: slot,
      message: '슬롯이 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('슬롯 수정 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
