import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 한국 시간으로 변환
const getKSTTime = () => {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return kstTime;
};

// 스케줄러 실행 (매 시간마다 Vercel Cron이 호출)
export async function POST(request: NextRequest) {
  try {
    const kstNow = getKSTTime();
    console.log('🕐 스케줄러 실행 (KST):', kstNow.toISOString());

    // 1. 활성화된 slot_type별 설정 조회
    const { data: settings, error: settingsError } = await supabase
      .from('slot_type_settings')
      .select('*')
      .gt('interval_hours', 0);

    if (settingsError || !settings) {
      console.error('설정 조회 오류:', settingsError);
      return NextResponse.json(
        {
          success: false,
          error: '설정 조회에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 2. 마지막 실행 시간 조회
    const { data: lastRuns } = await supabase
      .from('scheduler_logs')
      .select('slot_type, last_run_time')
      .in(
        'slot_type',
        settings.map(s => s.slot_type)
      );

    const lastRunMap = new Map(
      (lastRuns || []).map((r: any) => [
        r.slot_type,
        r.last_run_time ? new Date(r.last_run_time) : null,
      ])
    );

    const results = [];

    // 3. 각 slot_type별로 처리
    for (const setting of settings) {
      const lastRun = lastRunMap.get(setting.slot_type);
      const intervalMs = setting.interval_hours * 60 * 60 * 1000;

      // 마지막 실행 시간이 없거나, 설정된 간격이 지났는지 확인
      const shouldRun =
        !lastRun || kstNow.getTime() - lastRun.getTime() >= intervalMs;

      if (!shouldRun) {
        console.log(
          `⏭️ ${setting.slot_type}: 아직 실행 시간이 아닙니다 (간격: ${setting.interval_hours}시간)`
        );
        continue;
      }

      // slot_status에서 해당 타입의 활성 슬롯 조회
      const { data: slotStatus, error: statusError } = await supabase
        .from('slot_status')
        .select(
          'slot_type, keyword, link_url, customer_id, slot_sequence, slot_id'
        )
        .eq('slot_type', setting.slot_type)
        .not('keyword', 'eq', '')
        .not('keyword', 'is', null);

      if (statusError || !slotStatus || slotStatus.length === 0) {
        console.log(`ℹ️ ${setting.slot_type}: 활성 슬롯이 없습니다.`);
        continue;
      }

      // keywords 테이블에 추가
      const keywordRecords = slotStatus.map(slot => ({
        keyword: slot.keyword,
        link_url: slot.link_url,
        slot_type: slot.slot_type,
        slot_count: 1,
        current_rank: null,
        slot_sequence: slot.slot_sequence,
        customer_id: slot.customer_id,
        slot_id: slot.slot_id || null,
      }));

      const { error: insertError } = await supabase
        .from('keywords')
        .insert(keywordRecords);

      if (insertError) {
        console.error(`${setting.slot_type} keywords 삽입 오류:`, insertError);
        results.push({
          slot_type: setting.slot_type,
          success: false,
          error: insertError.message,
        });
      } else {
        console.log(
          `✅ ${setting.slot_type}: ${keywordRecords.length}개 keywords 추가 완료 (KST: ${kstNow.toISOString()})`
        );
        results.push({
          slot_type: setting.slot_type,
          success: true,
          count: keywordRecords.length,
        });

        // 마지막 실행 시간 저장
        await supabase.from('scheduler_logs').upsert({
          slot_type: setting.slot_type,
          last_run_time: kstNow.toISOString(),
          updated_at: kstNow.toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      kst_time: kstNow.toISOString(),
      results,
    });
  } catch (error) {
    console.error('스케줄러 실행 예외:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// GET 메서드 추가 (POST와 동일한 로직 - 테스트용)
export async function GET(request: NextRequest) {
  const response = await POST(request);
  return response;
}
