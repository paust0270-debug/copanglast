import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'username 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // keywords 테이블에서 해당 고객의 가장 최근 순위갱신 시간 조회
    const { data: lastRankUpdate, error: fetchError } = await supabase
      .from('keywords')
      .select('created_at')
      .eq('customer_id', username)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 데이터가 없거나 에러가 있으면 쿨다운 없음
    if (fetchError || !lastRankUpdate || !lastRankUpdate.created_at) {
      return NextResponse.json({
        success: true,
        cooldownRemaining: 0,
        message: '순위갱신 사용 가능',
      });
    }

    const lastUpdate = new Date(lastRankUpdate.created_at);
    const now = new Date();
    const elapsedMs = now.getTime() - lastUpdate.getTime();
    const oneHourMs = 60 * 60 * 1000; // 1시간

    if (elapsedMs >= oneHourMs) {
      // 쿨다운 완료
      return NextResponse.json({
        success: true,
        cooldownRemaining: 0,
        message: '순위갱신 사용 가능',
      });
    }

    // 쿨다운 중
    const remainingMs = oneHourMs - elapsedMs;
    const remainingSeconds = Math.ceil(remainingMs / 1000);

    return NextResponse.json({
      success: true,
      cooldownRemaining: remainingSeconds,
      message: `쿨다운 중: ${Math.floor(remainingSeconds / 60)}분 ${remainingSeconds % 60}초 남음`,
    });
  } catch (error) {
    console.error('쿨다운 조회 API 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
