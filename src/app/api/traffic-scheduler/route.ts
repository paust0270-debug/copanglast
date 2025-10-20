import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error(
    'Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.'
  );
}

// 트래픽 카운터 스케줄러
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 트래픽 카운터 스케줄러 실행 중...');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

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
        { error: '잘못된 액션입니다. (increment, daily_reset 중 하나)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('트래픽 카운터 스케줄러 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
