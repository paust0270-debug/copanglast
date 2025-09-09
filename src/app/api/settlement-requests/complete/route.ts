import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotIds, settlementData } = body;

    if (!slotIds || !Array.isArray(slotIds) || !settlementData) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 올바르지 않습니다.'
      }, { status: 400 });
    }

    console.log('정산 완료 처리 시작:', { slotIds, settlementData });

    // 1. 슬롯 상태는 변경하지 않음 (환불이나 취소 가능성을 위해 원래 상태 유지)
    console.log('슬롯 상태는 변경하지 않음 (환불/취소 가능성을 위해 원래 상태 유지)');

    // 2. settlement_requests에서 해당 데이터 삭제
    const { error: deleteError } = await supabase
      .from('settlement_requests')
      .delete()
      .in('slot_id', slotIds);

    if (deleteError) {
      console.error('정산요청 삭제 오류:', deleteError);
      console.log('정산요청 삭제 실패했지만 계속 진행합니다.');
    }

    // 3. settlements 테이블에 최종 정산 데이터 저장 (실제 테이블 구조에 맞게)
    // 실제 슬롯 데이터를 가져와서 정산 데이터 생성
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .in('id', slotIds);

    if (slotsError) {
      console.error('슬롯 데이터 조회 에러:', slotsError);
      return NextResponse.json({
        success: false,
        error: '슬롯 데이터를 조회하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    // 첫 번째 슬롯의 정보를 기준으로 정산 데이터 생성
    const firstSlot = slotsData?.[0];
    if (!firstSlot) {
      return NextResponse.json({
        success: false,
        error: '슬롯 데이터를 찾을 수 없습니다.'
      }, { status: 400 });
    }

    const settlementRecord: any = {
      customer_id: firstSlot.customer_id,
      customer_name: firstSlot.customer_id, // customer_name이 없으므로 customer_id 사용
      slot_type: 'coupang', // 기본값
      slot_count: settlementData.total_slots || 0,
      payment_type: 'deposit',
      payer_name: settlementData.depositor_name || '미입력',
      payment_amount: settlementData.total_deposit_amount || 0,
      payment_date: settlementData.deposit_date,
      usage_days: 30, // 기본값
      memo: settlementData.memo || '',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('저장할 정산 데이터:', settlementRecord);

    const { data: settlementResult, error: settlementError } = await supabase
      .from('settlements')
      .insert(settlementRecord)
      .select()
      .single();

    if (settlementError) {
      console.error('정산 데이터 저장 에러:', settlementError);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 저장하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    // 4. 정산 상세 내역 저장 (settlement_items 테이블에 선택된 슬롯들 저장)
    try {
      // 실제 슬롯 데이터를 가져와서 상세 내역 생성
      const { data: slotsData, error: slotsError } = await supabase
        .from('slots')
        .select('*')
        .in('id', slotIds);

      if (slotsError) {
        console.error('슬롯 데이터 조회 에러:', slotsError);
      } else {
        const settlementItems = (slotsData || []).map((slot: any) => ({
          settlement_id: settlementResult.id,
          slot_id: slot.id,
          customer_id: slot.customer_id,
          customer_name: slot.customer_id, // customer_name이 없으므로 customer_id 사용
          slot_type: slot.slot_type,
          slot_count: slot.slot_count,
          payment_amount: slot.payment_amount || 0,
          usage_days: slot.usage_days || 0,
          memo: slot.memo || ''
        }));

        const { error: itemsError } = await supabase
          .from('settlement_items')
          .insert(settlementItems);

        if (itemsError) {
          console.error('정산 상세 내역 저장 에러:', itemsError);
        } else {
          console.log('정산 상세 내역 저장 완료:', settlementItems.length, '개 항목');
        }
      }
    } catch (error) {
      console.log('settlement_items 테이블 저장 중 오류:', error);
    }

    console.log('정산 완료 처리 성공:', {
      processedSlots: slotIds.length,
      deletedRequests: slotIds.length,
      newSettlement: settlementResult
    });

    return NextResponse.json({
      success: true,
      message: '정산이 완료되었습니다.',
      data: {
        processedSlots: slotIds.length,
        deletedRequests: slotIds.length,
        newSettlement: settlementResult
      }
    });

  } catch (error) {
    console.error('정산 완료 처리 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
