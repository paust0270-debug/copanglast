import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 개별 슬롯 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { slotId: string } }
) {
  try {
    console.log(`🔄 슬롯 조회 중: ${params.slotId}`);

    const { data: slot, error } = await supabase
      .from('slots')
      .select('*')
      .eq('id', params.slotId)
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
      data: slot
    });

  } catch (error) {
    console.error('슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { slotId: string } }
) {
  try {
    console.log(`🔄 슬롯 수정 시작: ${params.slotId}`);

    const body = await request.json();
    const {
      payment_type,
      payer_name,
      payment_amount,
      payment_date,
      usage_days,
      memo
    } = body;

    // 수정할 데이터 준비
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (payment_type !== undefined) updateData.payment_type = payment_type;
    if (payer_name !== undefined) updateData.payer_name = payer_name;
    if (payment_amount !== undefined) updateData.payment_amount = payment_amount;
    if (payment_date !== undefined) updateData.payment_date = payment_date;
    if (usage_days !== undefined) updateData.usage_days = usage_days;
    if (memo !== undefined) updateData.memo = memo;

    // 슬롯 수정
    const { data: slot, error } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', params.slotId)
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
      message: '슬롯이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 수정 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
