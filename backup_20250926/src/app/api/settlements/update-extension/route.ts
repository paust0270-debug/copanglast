import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('연장 내역 수정 API 요청 본문:', body);
    
    const { settlementId, paymentAmount } = body;

    if (!settlementId || !paymentAmount) {
      console.error('필수 필드 누락:', { settlementId, paymentAmount });
      return NextResponse.json({
        success: false,
        error: '정산 ID와 입금액은 필수입니다.'
      }, { status: 400 });
    }

    console.log('연장 내역 수정 요청:', { settlementId, paymentAmount });

    // 정산 내역 업데이트
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
        error: `정산 내역 수정 중 오류가 발생했습니다: ${updateError.message}`
      }, { status: 500 });
    }

    console.log('연장 내역 수정 완료:', updatedSettlement);

    return NextResponse.json({
      success: true,
      message: '연장 내역이 성공적으로 수정되었습니다.',
      data: updatedSettlement
    });

  } catch (error) {
    console.error('연장 내역 수정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '연장 내역 수정 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
