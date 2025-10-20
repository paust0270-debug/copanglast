// 서버사이드 트래픽 카운터 스케줄러
// 프로덕션 환경에서 사용 - 브라우저 상태와 무관하게 24시간 작동

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 트래픽 카운터 증가 함수
async function incrementTrafficCounter() {
  try {
    console.log('🔄 서버사이드 트래픽 카운터 증가 시작...');

    // 현재 활성화된 모든 쿠팡 슬롯 조회
    const { data: slots, error: fetchError } = await supabase
      .from('slot_status')
      .select('id, traffic_counter, last_traffic_update')
      .not('keyword', 'eq', '')
      .eq('slot_type', '쿠팡')
      .lt('traffic_counter', 120); // 120 미만인 슬롯만

    if (fetchError) {
      console.error('❌ 슬롯 조회 실패:', fetchError);
      return;
    }

    if (!slots || slots.length === 0) {
      console.log('📝 증가할 슬롯이 없습니다.');
      return;
    }

    // 각 슬롯의 트래픽 카운터 증가
    const updatePromises = slots.map(async slot => {
      const newCounter = Math.min(slot.traffic_counter + 1, 120);

      const { error: updateError } = await supabase
        .from('slot_status')
        .update({
          traffic_counter: newCounter,
          last_traffic_update: new Date().toISOString(),
        })
        .eq('id', slot.id);

      if (updateError) {
        console.error(`❌ 슬롯 ${slot.id} 업데이트 실패:`, updateError);
      } else {
        console.log(
          `✅ 슬롯 ${slot.id}: ${slot.traffic_counter} → ${newCounter}`
        );
      }
    });

    await Promise.all(updatePromises);
    console.log(`🎉 ${slots.length}개 슬롯의 트래픽 카운터 증가 완료`);
  } catch (error) {
    console.error('❌ 트래픽 카운터 증가 중 오류:', error);
  }
}

// 매일 자정 리셋 함수
async function dailyReset() {
  try {
    console.log('🔄 매일 자정 트래픽 카운터 리셋 시작...');

    const { error } = await supabase
      .from('slot_status')
      .update({
        traffic_counter: 0,
        last_traffic_update: new Date().toISOString(),
        traffic_reset_date: new Date().toISOString().split('T')[0],
      })
      .not('keyword', 'eq', '')
      .eq('slot_type', '쿠팡');

    if (error) {
      console.error('❌ 일일 리셋 실패:', error);
    } else {
      console.log('🎉 모든 슬롯의 트래픽 카운터 리셋 완료');
    }
  } catch (error) {
    console.error('❌ 일일 리셋 중 오류:', error);
  }
}

// 서버사이드 스케줄러 시작 (브라우저 상태와 무관하게 작동)
export function startServerSideScheduler() {
  console.log('🚀 서버사이드 트래픽 카운터 스케줄러 시작');
  console.log('📅 12분마다 자동 증가, 매일 자정 리셋');
  console.log('🌐 브라우저 상태와 무관하게 24시간 작동');

  // 즉시 한 번 실행
  incrementTrafficCounter();

  // 12분마다 실행 (720,000ms)
  setInterval(
    async () => {
      await incrementTrafficCounter();
    },
    12 * 60 * 1000
  );

  // 매일 자정 리셋 체크 (1분마다 체크)
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      await dailyReset();
    }
  }, 60 * 1000);

  console.log('✅ 서버사이드 스케줄러가 백그라운드에서 실행 중입니다...');
}

// API 라우트에서 호출
export { incrementTrafficCounter, dailyReset };
