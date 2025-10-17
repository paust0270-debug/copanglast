import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    console.log('🔍 테스트 API - customerId:', customerId);

    // 1. Supabase에서 직접 조회 (가공 없이)
    const { data: rawSlots, error: rawError } = await supabase
      .from('slots')
      .select('*')
      .eq('customer_id', customerId);

    if (rawError) {
      console.error('❌ Raw slots 조회 실패:', rawError);
      return NextResponse.json({ error: rawError.message }, { status: 500 });
    }

    console.log('✅ Raw slots 조회 결과:', {
      count: rawSlots?.length || 0,
    });

    // 2. 고객 정보 조회 (미정산 내역 API와 동일한 방식)
    let distributorName = '-';
    if (customerId) {
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('distributor')
          .eq('username', customerId)
          .single();

        distributorName = userProfile?.distributor || '-';
        console.log(`✅ 고객 ${customerId}의 총판: ${distributorName}`);
      } catch (userError) {
        console.warn('사용자 정보 조회 실패:', customerId, userError);
      }
    }

    // 3. 간단한 데이터 변환 (미정산 내역 API와 동일한 방식)
    const processedSlots =
      rawSlots?.map(slot => {
        return {
          id: slot.id,
          customer_id: slot.customer_id,
          customer_name: slot.customer_name,
          slot_type: slot.slot_type,
          slot_count: slot.slot_count,
          payment_type: slot.payment_type,
          payer_name: slot.payer_name,
          payment_amount: slot.payment_amount,
          payment_date: slot.payment_date,
          usage_days: slot.usage_days,
          memo: slot.memo,
          status: slot.status,
          created_at: slot.created_at,
          updated_at: slot.updated_at,
          work_group: slot.work_group,
          keyword: slot.keyword,
          link_url: slot.link_url,
          equipment_group: slot.equipment_group,
          distributor: distributorName, // user_profiles에서 조회한 값 사용
          expiry_date: slot.updated_at,
        };
      }) || [];

    console.log('✅ 최종 처리 결과:', {
      count: processedSlots.length,
      firstSlot: processedSlots[0]
        ? {
            id: processedSlots[0].id,
            customer_id: processedSlots[0].customer_id,
            distributor: processedSlots[0].distributor,
            distributor_type: typeof processedSlots[0].distributor,
          }
        : null,
    });

    return NextResponse.json(
      {
        success: true,
        data: processedSlots,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('❌ 테스트 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
