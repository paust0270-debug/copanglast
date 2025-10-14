import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slotId,
      customerId,
      customerName,
      slotType,
      slotCount,
      paymentAmount,
      usageDays,
      memo,
      status,
    } = body;

    // 필수 필드 검증
    if (!slotId || !customerId || !customerName || !slotType || !slotCount) {
      return NextResponse.json(
        {
          success: false,
          error: '필수 필드가 누락되었습니다.',
        },
        { status: 400 }
      );
    }

    // 정산 테이블에 데이터 삽입
    const { data, error } = await supabase
      .from('settlements')
      .insert([
        {
          slot_id: slotId,
          customer_id: customerId,
          customer_name: customerName,
          slot_type: slotType,
          slot_count: slotCount,
          payment_amount: paymentAmount || 0,
          usage_days: usageDays || 0,
          memo: memo || '',
          status: status || 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('정산 데이터 삽입 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: '정산 데이터 저장에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 슬롯 상태를 'settlement_requested'로 업데이트
    const { error: slotUpdateError } = await supabase
      .from('slots')
      .update({ status: 'settlement_requested' })
      .eq('id', slotId);

    if (slotUpdateError) {
      console.error('슬롯 상태 업데이트 오류:', slotUpdateError);
      // 정산 데이터는 삽입되었지만 슬롯 상태 업데이트 실패 시 경고
      return NextResponse.json({
        success: true,
        warning: '정산요청은 등록되었지만 슬롯 상태 업데이트에 실패했습니다.',
        data,
      });
    }

    return NextResponse.json({
      success: true,
      message: '정산요청이 성공적으로 등록되었습니다.',
      data,
    });
  } catch (error) {
    console.error('정산요청 처리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // 정산 목록 조회
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('정산 데이터 조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: '정산 데이터 조회에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('정산 목록 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
