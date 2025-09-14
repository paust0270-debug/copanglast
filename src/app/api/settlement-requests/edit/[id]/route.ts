import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 특정 settlement_history와 연결된 개별 settlements 항목들 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const settlementHistoryId = params.id;
    console.log('정산수정용 데이터 조회 시작, settlement_history ID:', settlementHistoryId);

    // 1. settlement_history에서 해당 ID의 원본 settlements ID들 조회
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('original_settlement_ids, payer_name, memo, payment_amount')
      .eq('id', settlementHistoryId)
      .single();

    if (historyError) {
      console.error('settlement_history 조회 오류 상세:', historyError);
      console.error('조회 시도한 ID:', settlementHistoryId);
      return NextResponse.json({
        success: false,
        error: `settlement_history 조회 중 오류가 발생했습니다: ${historyError.message || historyError}`
      }, { status: 500 });
    }

    if (!historyData) {
      console.error('settlement_history 데이터를 찾을 수 없음');
      return NextResponse.json({
        success: false,
        error: '정산내역 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 원본 settlements ID들 파싱
    const originalSettlementIds = historyData.original_settlement_ids 
      ? historyData.original_settlement_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : [];
    
    console.log('원본 settlements ID들:', originalSettlementIds);

    // original_settlement_ids가 없는 경우 (기존 데이터) fallback 처리
    if (originalSettlementIds.length === 0) {
      console.log('원본 settlements ID가 없어서 fallback 처리: status=history인 모든 데이터 조회');
      
      // fallback: status='history'인 모든 settlements 조회 (기존 방식)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('settlements')
        .select(`
          id,
          customer_id,
          customer_name,
          distributor_name,
          slot_type,
          slot_count,
          payment_type,
          payer_name,
          payment_amount,
          usage_days,
          memo,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'history')
        .order('created_at', { ascending: true });

      if (fallbackError) {
        console.error('fallback settlements 조회 오류:', fallbackError);
        return NextResponse.json({
          success: false,
          error: 'settlements 조회 중 오류가 발생했습니다.'
        }, { status: 500 });
      }

      console.log('fallback으로 조회된 settlements 데이터:', fallbackData?.length || 0, '개');

      return NextResponse.json({
        success: true,
        data: fallbackData || [],
        settlementInfo: {
          payer_name: historyData.payer_name,
          deposit_date: new Date().toISOString().split('T')[0], // 현재 날짜 사용
          memo: historyData.memo,
          include_tax_invoice: false
        }
      });
    }

    // 2. 원본 settlements ID들로 직접 조회 (매핑 없이 정확한 데이터)
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select(`
        id,
        customer_id,
        customer_name,
        distributor_name,
        slot_type,
        slot_count,
        payment_type,
        payer_name,
        payment_amount,
        usage_days,
        memo,
        status,
        created_at,
        updated_at
      `)
      .in('id', originalSettlementIds)
      .order('created_at', { ascending: true });

    if (settlementsError) {
      console.error('settlements 조회 오류:', settlementsError);
      return NextResponse.json({
        success: false,
        error: 'settlements 조회 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('조회된 settlements 데이터:', settlementsData?.length || 0, '개');

    return NextResponse.json({
      success: true,
      data: settlementsData || [],
      settlementInfo: {
        payer_name: historyData.payer_name,
        deposit_date: new Date().toISOString().split('T')[0], // 현재 날짜 사용
        memo: historyData.memo,
        include_tax_invoice: false
      }
    });

  } catch (error) {
    console.error('정산수정용 데이터 조회 처리 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산수정용 데이터 조회 처리 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
