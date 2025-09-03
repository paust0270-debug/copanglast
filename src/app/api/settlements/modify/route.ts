import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 정산 수정 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalSettlementId, settlementData, settlementItems } = body;

    if (!originalSettlementId || !settlementData) {
      return NextResponse.json({
        success: false,
        error: '필수 데이터가 누락되었습니다.'
      }, { status: 400 });
    }

    console.log('정산 수정 시작:', { originalSettlementId, settlementData });

    // 1. 기존 정산 데이터 조회
    const { data: originalSettlement, error: fetchError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', originalSettlementId)
      .single();

    if (fetchError || !originalSettlement) {
      return NextResponse.json({
        success: false,
        error: '원본 정산 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 2. 기존 정산을 최신 버전이 아니도록 업데이트 (is_latest 필드가 있는 경우만)
    if ('is_latest' in originalSettlement) {
      await supabase
        .from('settlements')
        .update({ is_latest: false })
        .eq('id', originalSettlementId);
    }

    // 3. 새로운 정산 데이터 생성 (수정된 버전)
    const newSettlementData = {
      ...settlementData,
      original_settlement_id: originalSettlementId,
      version: ('version' in originalSettlement ? originalSettlement.version : 0) + 1,
      is_latest: 'is_latest' in originalSettlement ? true : undefined,
      status: 'modified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newSettlement, error: insertError } = await supabase
      .from('settlements')
      .insert(newSettlementData)
      .select()
      .single();

    if (insertError) {
      console.error('새 정산 데이터 저장 에러:', insertError);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 저장하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    // 4. 정산 상세 내역 저장 (있는 경우)
    if (settlementItems && settlementItems.length > 0) {
      try {
        const { data: itemsTableCheck } = await supabase
          .from('settlement_items')
          .select('id')
          .limit(1);

        if (itemsTableCheck !== null) {
          const itemsData = settlementItems.map((item: any) => ({
            settlement_id: newSettlement.id,
            slot_id: item.slot_id,
            customer_id: item.customer_id,
            customer_name: item.customer_name,
            slot_type: item.slot_type,
            slot_count: item.slot_count,
            payment_amount: item.payment_amount,
            usage_days: item.usage_days,
            memo: item.memo
          }));

          const { error: itemsError } = await supabase
            .from('settlement_items')
            .insert(itemsData);

          if (itemsError) {
            console.error('정산 상세 내역 저장 에러:', itemsError);
            // 정산 데이터는 저장되었지만 상세 내역 저장 실패
            return NextResponse.json({
              success: true,
              data: newSettlement,
              warning: '정산 데이터는 저장되었지만 상세 내역 저장에 실패했습니다.'
            });
          }
        }
      } catch (error) {
        console.log('settlement_items 테이블이 없어서 상세 내역 저장을 건너뜁니다.');
      }
    }

    console.log('정산 수정 완료:', newSettlement.id);

    return NextResponse.json({
      success: true,
      data: newSettlement
    });

  } catch (error) {
    console.error('정산 수정 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: '정산을 수정하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// 정산 상세 내역 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const settlementId = searchParams.get('id');

    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: '정산 ID가 필요합니다.'
      }, { status: 400 });
    }

    console.log('정산 상세 내역 조회:', settlementId);

    // 정산 기본 정보 조회
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', settlementId)
      .single();

    if (settlementError) {
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    console.log('정산 데이터:', settlement);

    // 정산에 포함된 슬롯 데이터 조회 (settlement_items 테이블에서만)
    let settlementItems = [];
    try {
      console.log('settlement_items 테이블 조회 시작...');
      
      // settlement_items 테이블이 있는지 먼저 확인
      const { data: tableCheck, error: tableError } = await supabase
        .from('settlement_items')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log('settlement_items 테이블이 존재하지 않음:', tableError);
        // 테이블이 없는 경우 기본 아이템 생성
        settlementItems = [{
          id: settlement.id,
          settlement_id: settlementId,
          slot_id: settlement.id,
          customer_id: 'N/A',
          customer_name: 'N/A',
          slot_type: 'coupang',
          slot_count: settlement.total_slots || 1,
          payment_amount: settlement.total_deposit_amount || 0,
          usage_days: 0,
          memo: settlement.memo || '',
          created_at: settlement.created_at
        }];
        console.log('기본 아이템 생성:', settlementItems);
      } else {
        console.log('settlement_items 테이블 존재 확인됨');
        
        // settlement_items 테이블에서 해당 정산에 포함된 슬롯들만 조회
        const { data: items, error: itemsError } = await supabase
          .from('settlement_items')
          .select('*')
          .eq('settlement_id', settlementId)
          .order('created_at', { ascending: false });

        if (itemsError) {
          console.error('정산 상세 내역 조회 에러:', itemsError);
        } else {
          settlementItems = items || [];
          console.log('settlement_items에서 조회된 항목:', settlementItems.length);
          
          // 데이터가 없는 경우 기본 아이템 생성
          if (settlementItems.length === 0) {
            console.log('settlement_items에 데이터가 없어서 기본 아이템 생성');
            settlementItems = [{
              id: settlement.id,
              settlement_id: settlementId,
              slot_id: settlement.id,
              customer_id: 'N/A',
              customer_name: 'N/A',
              slot_type: 'coupang',
              slot_count: settlement.total_slots || 1,
              payment_amount: settlement.total_deposit_amount || 0,
              usage_days: 0,
              memo: settlement.memo || '',
              created_at: settlement.created_at
            }];
          }
        }
      }
    } catch (error) {
      console.log('settlement_items 테이블 조회 중 오류:', error);
      // 오류 발생 시 기본 아이템 생성
      settlementItems = [{
        id: settlement.id,
        settlement_id: settlementId,
        slot_id: settlement.id,
        customer_id: 'N/A',
        customer_name: 'N/A',
        slot_type: 'coupang',
        slot_count: settlement.total_slots || 1,
        payment_amount: settlement.total_deposit_amount || 0,
        usage_days: 0,
        memo: settlement.memo || '',
        created_at: settlement.created_at
      }];
    }

    console.log('최종 조회된 항목 수:', settlementItems.length);

    return NextResponse.json({
      success: true,
      data: {
        settlement,
        items: settlementItems || []
      }
    });

  } catch (error) {
    console.error('정산 상세 내역 조회 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: '정산 상세 내역을 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
