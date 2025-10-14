import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTimestampWithoutMs } from '@/lib/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items }: { items: any[] } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '정산할 항목이 없습니다.'
      }, { status: 400 });
    }

    console.log('정산 생성 시작:', items.length, '개 항목');

    // 1. 정산 데이터 생성
    const totalSlots = items.reduce((sum, item) => sum + (item.slot_count || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.payment_amount || 0), 0);
    
    // 순번 생성 (기존 정산 중 가장 큰 순번 + 1)
    const { data: lastSettlement } = await supabase
      .from('settlements')
      .select('sequential_number')
      .order('sequential_number', { ascending: false })
      .limit(1);

    const nextSequentialNumber = lastSettlement && lastSettlement.length > 0 
      ? lastSettlement[0].sequential_number + 1 
      : 1;

    const settlementData = {
      sequential_number: nextSequentialNumber,
      distributor_name: items[0]?.distributor_name || '총판A',
      total_slots: totalSlots,
      total_deposit_amount: totalAmount,
      depositor_name: items[0]?.customer_name || '',
      deposit_date: new Date().toISOString().split('T')[0],
      request_date: new Date().toISOString().split('T')[0],
      memo: `자동 생성된 정산 (${items.length}개 항목)`,
      status: '승인대기',
      created_at: new Date().toISOString(),
      updated_at: getTimestampWithoutMs()
    };

    // 2. 정산 데이터 저장
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .insert([settlementData])
      .select()
      .single();

    if (settlementError) {
      console.error('정산 데이터 저장 오류:', settlementError);
      return NextResponse.json({
        success: false,
        error: '정산 데이터 저장에 실패했습니다.'
      }, { status: 500 });
    }

    console.log('✅ 정산 데이터 저장 완료:', settlement.id);

    // 3. 정산 상세 내역 저장 (settlement_items 테이블이 있는 경우)
    try {
      const { data: tableCheck } = await supabase
        .from('settlement_items')
        .select('id')
        .limit(1);

      if (tableCheck !== null) {
        const settlementItems = items.map((item) => ({
          settlement_id: settlement.id,
          slot_id: item.slot_id,
          customer_id: item.customer_id,
          customer_name: item.customer_name,
          slot_type: item.slot_type,
          slot_count: item.slot_count,
          payment_amount: item.payment_amount,
          usage_days: item.usage_days,
          memo: item.memo,
          created_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from('settlement_items')
          .insert(settlementItems);

        if (itemsError) {
          console.error('정산 상세 내역 저장 오류:', itemsError);
          // 정산 데이터는 저장되었지만 상세 내역 저장 실패
          return NextResponse.json({
            success: true,
            data: settlement,
            warning: '정산은 생성되었지만 상세 내역 저장에 실패했습니다.'
          });
        }

        console.log('✅ 정산 상세 내역 저장 완료:', settlementItems.length, '개');
      }
    } catch (error) {
      console.log('settlement_items 테이블이 존재하지 않음:', error);
      // 테이블이 없는 경우 무시하고 계속 진행
    }

    // 4. 슬롯 상태는 변경하지 않음 (환불이나 취소 가능성을 위해 원래 상태 유지)
    // 정산된 슬롯도 중지/재개가 가능해야 하므로 상태를 변경하지 않습니다.
    console.log('✅ 슬롯 상태는 변경하지 않음 (환불/취소 가능성을 위해 원래 상태 유지)');

    console.log('✅ 정산 생성 완료:', settlement.id);

    return NextResponse.json({
      success: true,
      data: settlement,
      message: '정산이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('정산 생성 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
