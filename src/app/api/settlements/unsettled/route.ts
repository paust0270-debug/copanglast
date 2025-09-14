import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('미정산 내역 조회 시작');

    // settlements 테이블에서 pending 상태의 데이터 조회
    const { data: pendingSettlements, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('미정산 내역 조회 오류:', error);
      return NextResponse.json({
        success: false,
        error: '미정산 내역을 조회하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('미정산 내역 조회 완료:', pendingSettlements?.length || 0, '개');

    // 데이터 포맷팅 (표준 필드명으로 통합)
    const settlementItems = pendingSettlements?.map((settlement: any) => ({
      id: settlement.id,
      customer_id: settlement.customer_id,
      customer_name: settlement.customer_name,
      slot_type: settlement.slot_type,
      slot_count: settlement.slot_count,
      payment_type: settlement.payment_type,
      payer_name: settlement.payer_name,
      payment_amount: settlement.payment_amount,
      slot_addition_date: settlement.created_at, // created_at을 slot_addition_date로 매핑
      usage_days: settlement.usage_days,
      memo: settlement.memo,
      status: settlement.status,
      created_at: settlement.created_at,
      distributor_name: '총판A',
      type: settlement.payment_type === 'extension' ? 'extension' : 'deposit'
    })) || [];

    return NextResponse.json({
      success: true,
      data: settlementItems
    });

  } catch (error) {
    console.error('미정산 내역 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '미정산 내역을 조회하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}