import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error(
    'Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.'
  );
}

// 트래픽 카운터 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 트래픽 카운터 조회 중...');

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const username = searchParams.get('username');

    let query = supabase
      .from('slot_status')
      .select(
        'id, customer_id, traffic_counter, last_traffic_update, traffic_reset_date'
      )
      .not('keyword', 'eq', '') // 키워드가 있는 레코드만
      .eq('slot_type', '쿠팡'); // 쿠팡 슬롯 타입만

    // 특정 고객 필터링
    if (customerId && username) {
      query = query.eq('customer_id', username);
    }

    const { data, error } = await query;

    if (error) {
      console.error('트래픽 카운터 조회 오류:', error);
      return NextResponse.json(
        { error: '트래픽 카운터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('트래픽 카운터 조회 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 트래픽 카운터 업데이트 (증가/리셋)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 트래픽 카운터 업데이트 중...');

    const body = await request.json();
    const { action, slotIds, customerId } = body;

    if (action === 'increment') {
      // 12분마다 트래픽 카운터 증가
      const { data, error } = await supabase
        .from('slot_status')
        .select('id, traffic_counter, traffic_reset_date')
        .not('keyword', 'eq', '')
        .eq('slot_type', '쿠팡')
        .lt('traffic_counter', 120); // 최대값 120 미만인 것만

      if (error) {
        console.error('트래픽 카운터 조회 오류:', error);
        return NextResponse.json(
          { error: '트래픽 카운터를 조회하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        // 각 슬롯의 트래픽 카운터를 1씩 증가
        const updatePromises = data.map(slot =>
          supabase
            .from('slot_status')
            .update({
              traffic_counter: Math.min(slot.traffic_counter + 1, 120),
              last_traffic_update: new Date().toISOString(),
            })
            .eq('id', slot.id)
        );

        const results = await Promise.all(updatePromises);
        const successCount = results.filter(result => !result.error).length;

        console.log(`✅ ${successCount}개 슬롯의 트래픽 카운터 증가 완료`);

        return NextResponse.json({
          success: true,
          message: `${successCount}개 슬롯의 트래픽 카운터가 증가했습니다.`,
          updatedCount: successCount,
        });
      }

      return NextResponse.json({
        success: true,
        message: '증가할 트래픽 카운터가 없습니다.',
        updatedCount: 0,
      });
    } else if (action === 'reset') {
      // 트래픽 카운터 리셋 (개별 슬롯 또는 특정 슬롯들만)
      let resetQuery = supabase
        .from('slot_status')
        .update({
          traffic_counter: 0,
          last_traffic_update: new Date().toISOString(),
          traffic_reset_date: new Date().toISOString().split('T')[0],
        })
        .not('keyword', 'eq', '')
        .eq('slot_type', '쿠팡');

      // 특정 슬롯들만 리셋 (개별 슬롯 관리)
      if (slotIds && slotIds.length > 0) {
        resetQuery = resetQuery.in('id', slotIds);
        console.log(`🔄 ${slotIds.length}개 슬롯의 트래픽 카운터 리셋`);
      }
      // 특정 고객의 슬롯들만 리셋 (고객 단위 관리 - 사용하지 않음)
      else if (customerId) {
        resetQuery = resetQuery.eq('customer_id', customerId);
        console.log(`🔄 고객 ${customerId}의 모든 슬롯 트래픽 카운터 리셋`);
      }
      // 모든 슬롯 리셋 (매일 자정용)
      else {
        console.log('🔄 모든 슬롯의 트래픽 카운터 리셋');
      }

      const { data, error } = await resetQuery;

      if (error) {
        console.error('트래픽 카운터 리셋 오류:', error);
        return NextResponse.json(
          { error: '트래픽 카운터를 리셋하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log('✅ 트래픽 카운터 리셋 완료');

      return NextResponse.json({
        success: true,
        message: '트래픽 카운터가 리셋되었습니다.',
      });
    } else if (action === 'daily_reset') {
      // 매일 자정 리셋
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('slot_status')
        .update({
          traffic_counter: 0,
          last_traffic_update: new Date().toISOString(),
          traffic_reset_date: today,
        })
        .not('keyword', 'eq', '')
        .eq('slot_type', '쿠팡')
        .neq('traffic_reset_date', today); // 오늘 이미 리셋된 것은 제외

      if (error) {
        console.error('일일 트래픽 카운터 리셋 오류:', error);
        return NextResponse.json(
          { error: '일일 트래픽 카운터를 리셋하는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      console.log('✅ 일일 트래픽 카운터 리셋 완료');

      return NextResponse.json({
        success: true,
        message: '일일 트래픽 카운터가 리셋되었습니다.',
      });
    } else {
      return NextResponse.json(
        { error: '잘못된 액션입니다. (increment, reset, daily_reset 중 하나)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('트래픽 카운터 업데이트 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
