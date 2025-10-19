import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 특정 settlement_history와 연결된 개별 settlements 항목들 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settlementHistoryId = id;
    console.log(
      '정산수정용 데이터 조회 시작, settlement_history ID:',
      settlementHistoryId
    );

    // 1. settlement_history에서 해당 ID의 정보 조회
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select(
        'id, payer_name, memo, payment_amount, customer_id, slot_count, slot_type, distributor_name, customer_name, payment_type, usage_days, status, created_at'
      )
      .eq('id', settlementHistoryId)
      .single();

    if (historyError) {
      console.error('settlement_history 조회 오류 상세:', historyError);
      console.error('조회 시도한 ID:', settlementHistoryId);
      return NextResponse.json(
        {
          success: false,
          error: `settlement_history 조회 중 오류가 발생했습니다: ${historyError.message || historyError}`,
        },
        { status: 500 }
      );
    }

    if (!historyData) {
      console.error('settlement_history 데이터를 찾을 수 없음');
      return NextResponse.json(
        {
          success: false,
          error: '정산내역 데이터를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    console.log('조회된 settlement_history 데이터:', historyData);

    // 2. 정산 수정용 원본 데이터 조회 (settlement_edit_items 테이블 사용)
    const { data: editItemsData, error: editItemsError } = await supabase
      .from('settlement_edit_items')
      .select(
        `
        id,
        settlement_history_id,
        original_settlement_id,
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
      `
      )
      .eq('settlement_history_id', settlementHistoryId)
      .order('created_at', { ascending: true });

    if (editItemsError) {
      console.error('settlement_edit_items 조회 오류:', editItemsError);
      return NextResponse.json(
        {
          success: false,
          error: '정산 수정용 데이터 조회 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(
      '조회된 settlement_edit_items 데이터:',
      editItemsData?.length || 0,
      '개'
    );

    // settlement_edit_items 데이터를 settlements 형태로 변환
    const settlementsData =
      editItemsData?.map(item => ({
        id: item.original_settlement_id,
        customer_id: item.customer_id,
        customer_name: item.customer_name,
        distributor_name: item.distributor_name,
        slot_type: item.slot_type,
        slot_count: item.slot_count,
        payment_type: item.payment_type,
        payer_name: item.payer_name,
        payment_amount: item.payment_amount,
        usage_days: item.usage_days,
        memo: item.memo,
        status: 'history', // 정산 완료된 상태로 표시
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) || [];

    const settlementsError = null; // 에러는 이미 처리됨

    if (settlementsError) {
      console.error('settlements 조회 오류:', settlementsError);
      return NextResponse.json(
        {
          success: false,
          error: 'settlements 조회 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log(
      '조회된 settlements 데이터:',
      settlementsData?.length || 0,
      '개'
    );

    // 🔍 디버깅: 조회된 settlements 상세 정보
    if (settlementsData && settlementsData.length > 0) {
      console.log('🔍 조회된 settlements 상세:');
      settlementsData.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ID: ${item.id}, status: ${item.status}, 슬롯수: ${item.slot_count}, 결제액: ${item.payment_amount}, 생성일: ${item.created_at}`
        );
      });
    } else {
      console.log('⚠️ settlements 데이터가 없습니다.');
    }

    // 3. 정산 수정용 원본 데이터 그대로 반환 (매칭 로직 불필요)
    const filteredSettlements = settlementsData || [];
    console.log(`최종 반환할 settlements: ${filteredSettlements.length}개`);

    // 🔍 디버깅: 반환할 settlements 상세 정보
    if (filteredSettlements.length > 0) {
      console.log('🔍 반환할 settlements 상세:');
      filteredSettlements.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ID: ${item.id}, 슬롯수: ${item.slot_count}, 결제액: ${item.payment_amount}, 생성일: ${item.created_at}`
        );
      });
    }

    // 4. 각 settlement에 대해 user_profiles에서 distributor 정보 조회
    const processedSettlements = [];
    for (const settlement of filteredSettlements) {
      let distributorName = '-';

      if (settlement.customer_id) {
        try {
          // user_profiles 테이블에서 username으로 distributor 정보 조회
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('distributor')
            .eq('username', settlement.customer_id)
            .single();

          distributorName = userProfile?.distributor || '-';
          console.log(
            `고객 ${settlement.customer_id}의 총판: ${distributorName}`
          );
        } catch (userError) {
          console.warn(
            '사용자 정보 조회 실패:',
            settlement.customer_id,
            userError
          );
        }
      }

      processedSettlements.push({
        ...settlement,
        distributor_name: distributorName, // user_profiles에서 가져온 실제 총판명
      });
    }

    // 3. settlement_history 정보를 기반으로 정산 정보 구성
    const settlementInfo = {
      payer_name: historyData.payer_name,
      deposit_date: historyData.created_at
        ? historyData.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
      memo: historyData.memo || '',
      include_tax_invoice: false,
      totalAmount: historyData.payment_amount,
      baseAmount: historyData.payment_amount,
      taxAmount: Math.floor(historyData.payment_amount * 0.1), // 10% 세액
    };

    return NextResponse.json({
      success: true,
      data: processedSettlements,
      settlementInfo: settlementInfo,
    });
  } catch (error) {
    console.error('정산수정용 데이터 조회 처리 중 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '정산수정용 데이터 조회 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
