import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('미정산 내역 조회 시작');

    // 1. 슬롯 테이블에서 정산되지 않은 슬롯들 조회
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (slotsError) {
      console.error('슬롯 조회 오류:', slotsError);
      return NextResponse.json({
        success: false,
        error: '슬롯 데이터를 조회하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('조회된 슬롯 수:', slots?.length || 0);

    // 2. 정산 테이블에서 미정산 상태인 연장 내역과 입금 내역들 조회
    const { data: pendingSettlements, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .in('status', ['pending', '승인대기'])
      .order('created_at', { ascending: false });

    if (settlementsError) {
      console.error('정산 내역 조회 오류:', settlementsError);
    }

    console.log('🔍 UNSETTLED API 디버깅:');
    console.log('조회된 미정산 정산 내역 수:', pendingSettlements?.length || 0);
    console.log('정산 내역 데이터 샘플:', pendingSettlements?.slice(0, 3));
    
    // 각 정산 내역의 필드 구조 확인
    if (pendingSettlements && pendingSettlements.length > 0) {
      console.log('첫 번째 정산 내역의 모든 필드:', Object.keys(pendingSettlements[0]));
      console.log('첫 번째 정산 내역의 payment_type 값:', pendingSettlements[0].payment_type);
      console.log('첫 번째 정산 내역의 전체 데이터:', JSON.stringify(pendingSettlements[0], null, 2));
    }

    // 3. 정산된 슬롯들 조회 (settlement_items 테이블에서)
    let settledSlotIds: number[] = [];
    try {
      const { data: settlementItems } = await supabase
        .from('settlement_items')
        .select('slot_id');
      
      if (settlementItems) {
        settledSlotIds = settlementItems.map((item: any) => item.slot_id);
        console.log('정산된 슬롯 ID들:', settledSlotIds);
      }
    } catch (error) {
      console.log('settlement_items 테이블이 존재하지 않음:', error);
      // 테이블이 없는 경우 모든 슬롯을 미정산으로 처리
    }

    // 4. 정산되지 않은 슬롯들만 필터링
    const unsettledSlots = slots?.filter((slot: any) => !settledSlotIds.includes(slot.id)) || [];
    console.log('미정산 슬롯 수:', unsettledSlots.length);

    // 5. 슬롯 데이터를 미정산 내역 형태로 변환
    const slotItems = unsettledSlots.map((slot: any) => ({
      id: slot.id,
      slot_id: slot.id,
      customer_id: slot.customer_id,
      customer_name: slot.customer_name,
      slot_type: slot.slot_type,
      slot_count: slot.slot_count,
      payment_amount: slot.payment_amount || 0,
      usage_days: slot.usage_days || 0,
      memo: slot.memo || '',
      created_at: slot.created_at,
      distributor_name: '총판A', // 기본값, 실제로는 고객 테이블에서 가져와야 함
      type: slot.payment_type === 'deposit' ? 'deposit' : 'slot' // 입금구분에 따라 타입 결정
    })) || [];

    // 6. 정산 내역을 타입별로 미정산 내역 형태로 변환
    const settlementItems = pendingSettlements?.map((settlement: any) => ({
      id: `settlement_${settlement.id}`, // 고유 ID 생성
      slot_id: settlement.slot_id, // 실제 슬롯 ID
      customer_id: settlement.customer_id,
      customer_name: settlement.customer_name,
      slot_type: settlement.slot_type,
      slot_count: settlement.slot_count,
      payment_amount: settlement.payment_amount,
      usage_days: settlement.usage_days,
      memo: settlement.memo,
      created_at: settlement.created_at,
      distributor_name: '총판A', // 기본값
      type: (() => {
        // 디버깅을 위해 실제 payment_type 값 로그 출력
        console.log('정산 내역 payment_type:', settlement.payment_type, 'ID:', settlement.id);
        
        // 연장 내역인 경우
        if (settlement.payment_type === 'extension' || settlement.payment_type === '연장') {
          return 'extension';
        }
        // 입금 내역인 경우 (기본값)
        return 'deposit';
      })(),
      payer_name: settlement.payer_name,
      payment_date: settlement.payment_date
    })) || [];

    // 7. 슬롯과 연장 내역을 합쳐서 정렬
    const allUnsettledItems = [...slotItems, ...settlementItems]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('전체 미정산 내역 수:', allUnsettledItems.length);

    return NextResponse.json({
      success: true,
      data: allUnsettledItems
    });

  } catch (error) {
    console.error('미정산 내역 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '미정산 내역을 조회하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}