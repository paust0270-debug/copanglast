import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { slotId, paymentType, payerName, paymentAmount, paymentDate, usageDays } = await request.json();

    console.log('슬롯 연장 요청:', { slotId, paymentType, payerName, paymentAmount, paymentDate, usageDays });

    // 필수 필드 검증
    if (!slotId || !usageDays) {
      return NextResponse.json({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      }, { status: 400 });
    }

    // 슬롯 ID를 숫자로 변환
    const numericSlotId = parseInt(slotId);
    console.log('슬롯 ID:', numericSlotId);

    // 슬롯 정보 조회
    const { data: slotData, error: slotError } = await supabase
      .from('slots')
      .select('id, customer_id, customer_name, slot_type, created_at, usage_days')
      .eq('id', numericSlotId)
      .single();

    if (slotError || !slotData) {
      console.error('슬롯 조회 오류:', slotError);
      return NextResponse.json({
        success: false,
        error: '슬롯을 찾을 수 없습니다.'
      }, { status: 404 });
    }

    console.log('슬롯 데이터:', slotData);

    // 현재 만료일 계산 (created_at + usage_days)
    const createdDate = new Date(slotData.created_at);
    const currentUsageDays = slotData.usage_days || 0;
    const currentExpiryDate = new Date(createdDate.getTime() + currentUsageDays * 24 * 60 * 60 * 1000);
    console.log('현재 만료일:', currentExpiryDate);

    // 새로운 사용일수 계산 (기존 사용일수 + 연장일수)
    const newUsageDays = currentUsageDays + parseInt(usageDays);
    console.log('새로운 사용일수:', newUsageDays);

    // 슬롯 업데이트 (usage_days만 업데이트)
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({
        usage_days: newUsageDays
      })
      .eq('id', numericSlotId)
      .select('id, usage_days, created_at')
      .single();

    if (updateError) {
      console.error('슬롯 업데이트 오류:', updateError);
      return NextResponse.json({
        success: false,
        error: '슬롯 업데이트 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('슬롯 연장 완료:', updatedSlot);

    // 연장 내역을 정산 테이블에 저장 (미정산 내역으로 추가)
    try {
      const { error: settlementError } = await supabase
        .from('settlements')
        .insert({
          customer_id: slotData.customer_id,
          customer_name: slotData.customer_name || slotData.customer_id,
          slot_type: slotData.slot_type || 'coupang',
          slot_count: 1, // 연장은 개별 슬롯 단위
          payment_type: 'extension', // 슬롯 연장은 항상 extension
          payer_name: payerName || '',
          payment_amount: parseInt(paymentAmount) || 0,
          payment_date: paymentDate || new Date().toISOString().split('T')[0],
          usage_days: parseInt(usageDays),
          memo: `슬롯 연장 - ${usageDays}일 연장 (${paymentType === 'deposit' ? '입금' : '쿠폰'})`,
          status: 'pending' // 미정산 상태로 생성
        });

      if (settlementError) {
        console.log('정산 내역 저장 실패 (무시):', settlementError);
        // 정산 내역 저장 실패해도 슬롯 연장은 성공으로 처리
      } else {
        console.log('정산 내역 저장 완료 - 미정산 페이지에서 확인 가능');
      }
    } catch (error) {
      console.log('정산 내역 저장 중 오류 (무시):', error);
      // 정산 내역 저장 실패해도 슬롯 연장은 성공으로 처리
    }

    // 새로운 만료일 계산
    const newExpiryDate = new Date(createdDate.getTime() + newUsageDays * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      success: true,
      message: '슬롯이 성공적으로 연장되었습니다.',
      data: {
        slotId: numericSlotId,
        previousExpiryDate: currentExpiryDate.toISOString(),
        newExpiryDate: newExpiryDate.toISOString(),
        extendedDays: parseInt(usageDays),
        newUsageDays: newUsageDays
      }
    });

  } catch (error) {
    console.error('슬롯 연장 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '슬롯 연장 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}