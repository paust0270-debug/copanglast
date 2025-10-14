import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('입금 내역 수정 API 요청 본문:', body);
    
    const { slotId, paymentAmount } = body;

    if (!slotId || !paymentAmount) {
      console.error('필수 필드 누락:', { slotId, paymentAmount });
      return NextResponse.json({
        success: false,
        error: '슬롯 ID와 입금액은 필수입니다.'
      }, { status: 400 });
    }

    console.log('입금 내역 수정 요청:', { slotId, paymentAmount });

    // 입금 내역의 경우 정산 테이블에서 해당 정산 ID로 업데이트
    const settlementId = slotId.replace('settlement_', ''); // settlement_ 접두사 제거
    const { data: updatedSettlement, error: updateError } = await supabase
      .from('settlements')
      .update({
        payment_amount: parseInt(paymentAmount)
      })
      .eq('id', parseInt(settlementId))
      .select()
      .single();

    if (updateError) {
      console.error('정산 내역 업데이트 오류:', updateError);
      return NextResponse.json({
        success: false,
        error: `입금 내역 수정 중 오류가 발생했습니다: ${updateError.message}`
      }, { status: 500 });
    }

    console.log('입금 내역 수정 완료:', updatedSettlement);

    return NextResponse.json({
      success: true,
      message: '입금 내역이 성공적으로 수정되었습니다.',
      data: updatedSettlement
    });

  } catch (error) {
    console.error('입금 내역 수정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '입금 내역 수정 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
