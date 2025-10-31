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
      return NextResponse.json(
        {
          success: false,
          error: 'customerId와 slotSequence가 필요합니다.',
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: '순위 히스토리 조회에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    // 순위에서 숫자만 추출하는 함수
    const extractRankNumber = (rankStr: string) => {
      if (!rankStr) return null;
      const match = rankStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    };

    // 데이터 포맷팅 및 이전 대비 계산
    const formattedData = (historyData || []).map((item, index) => {
      const currentRank = extractRankNumber(item.current_rank);
      const previousItem = historyData[index + 1];
      const previousRank = previousItem
        ? extractRankNumber(previousItem.current_rank)
        : null;

      // 이전 대비 계산 (이전 순위가 없으면 0, 있으면 차이 계산)
      let previousChange = 0;
      if (previousRank !== null && currentRank !== null) {
        previousChange = currentRank - previousRank;
      }

      // 날짜 포맷팅
      const date = new Date(item.rank_date);
      const changeDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      return {
        sequence: index + 1, // 순번
        changeDate: changeDate,
        rank: currentRank, // 숫자만 반환
        previousChange: previousChange, // 이전 대비 값
        rankChange: item.rank_change || 0,
        startRankDiff: item.start_rank_diff || 0,
        keyword: item.keyword || '',
        linkUrl: item.link_url || '',
      };
    });

    console.log('✅ 순위 히스토리 조회 완료:', {
      customerId,
      slotSequence,
      count: formattedData.length,
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('❌ 순위 히스토리 조회 예외:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
