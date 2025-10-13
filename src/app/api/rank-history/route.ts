import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const slotSequence = searchParams.get('slotSequence');

    console.log('🔄 순위 히스토리 조회 요청:', { customerId, slotSequence });

    // 필수 파라미터 검증
    if (!customerId || !slotSequence) {
      return NextResponse.json({
        success: false,
        error: 'customerId와 slotSequence가 필요합니다.'
      }, { status: 400 });
    }

    // 순위 히스토리 조회
    const { data: historyData, error: historyError } = await supabase
      .from('slot_rank_history')
      .select('*')
      .eq('customer_id', customerId)
      .eq('slot_sequence', parseInt(slotSequence))
      .order('rank_date', { ascending: false }); // 최신순 정렬

    if (historyError) {
      console.error('❌ 순위 히스토리 조회 실패:', historyError);
      return NextResponse.json({
        success: false,
        error: '순위 히스토리 조회에 실패했습니다.'
      }, { status: 500 });
    }

    // 데이터 포맷팅
    const formattedData = historyData.map((item, index) => ({
      sequence: index + 1, // 순번
      changeDate: new Date(item.rank_date).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      rank: item.current_rank,
      rankChange: item.rank_change,
      startRankDiff: item.start_rank_diff,
      keyword: item.keyword,
      linkUrl: item.link_url
    }));

    console.log('✅ 순위 히스토리 조회 완료:', {
      customerId,
      slotSequence,
      count: formattedData.length
    });

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('❌ 순위 히스토리 조회 예외:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
