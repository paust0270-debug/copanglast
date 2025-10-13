import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, link_url, slot_type, current_rank, slot_sequence } = body;

    console.log('🔄 순위 업데이트 요청:', { keyword, link_url, slot_type, current_rank });

    // 필수 필드 검증
    if (!keyword || !link_url || !slot_type || current_rank === undefined || !slot_sequence) {
      return NextResponse.json({
        success: false,
        error: '필수 필드가 누락되었습니다.'
      }, { status: 400 });
    }

    // 1. 상품 ID 추출 함수
    const extractProductId = (url) => {
      const match = url.match(/products\/(\d+)/);
      return match ? match[1] : null;
    };

    const productId = extractProductId(link_url);
    console.log('🔍 추출된 상품 ID:', productId);

    // 2. keywords 테이블에서 customer_id 조회 (slot_sequence로 정확한 매칭)
    const { data: keywordData, error: keywordError } = await supabase
      .from('keywords')
      .select('customer_id, slot_id, slot_sequence, link_url')
      .eq('keyword', keyword)
      .eq('slot_type', slot_type)
      .eq('slot_sequence', slot_sequence) // 정확한 슬롯 시퀀스로 매칭
      .single();

    if (keywordError || !keywordData) {
      console.error('❌ 키워드 매칭 실패:', keywordError);
      return NextResponse.json({
        success: false,
        error: '매칭되는 키워드를 찾을 수 없습니다.',
        details: { keyword, link_url, slot_type, slot_sequence }
      }, { status: 404 });
    }

    console.log('✅ 키워드 매칭 성공:', keywordData);

    // 3. slot_status 테이블에서 현재 start_rank 조회
    const { data: slotStatus, error: statusError } = await supabase
      .from('slot_status')
      .select('start_rank, current_rank')
      .eq('customer_id', keywordData.customer_id)
      .eq('slot_sequence', keywordData.slot_sequence)
      .single();

    if (statusError) {
      console.error('❌ slot_status 조회 실패:', statusError);
      return NextResponse.json({
        success: false,
        error: 'slot_status 레코드를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 4. 순위 변동 계산
    const isFirstCheck = !slotStatus.start_rank || slotStatus.start_rank === '';
    const rankFormat = `${current_rank} [0]`; // 기존 포맷 유지
    
    // 이전 순위 추출 (숫자만)
    const extractRankNumber = (rankStr) => {
      if (!rankStr) return null;
      const match = rankStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    };
    
    const previousRank = extractRankNumber(slotStatus.current_rank);
    const startRankNumber = extractRankNumber(slotStatus.start_rank);
    
    // 등락폭 계산
    const rankChange = previousRank ? current_rank - previousRank : 0;
    const startRankDiff = startRankNumber ? current_rank - startRankNumber : 0;

    // 5. slot_status 업데이트
    const { error: updateError } = await supabase
      .from('slot_status')
      .update({
        current_rank: rankFormat,
        start_rank: isFirstCheck ? rankFormat : slotStatus.start_rank,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', keywordData.customer_id)
      .eq('slot_sequence', keywordData.slot_sequence);

    if (updateError) {
      console.error('❌ slot_status 업데이트 실패:', updateError);
      return NextResponse.json({
        success: false,
        error: 'slot_status 업데이트에 실패했습니다.'
      }, { status: 500 });
    }

    // 6. 순위 히스토리 저장
    const { error: historyError } = await supabase
      .from('slot_rank_history')
      .insert([{
        customer_id: keywordData.customer_id,
        slot_sequence: keywordData.slot_sequence,
        keyword: keyword,
        link_url: link_url,
        current_rank: rankFormat,
        start_rank: isFirstCheck ? rankFormat : slotStatus.start_rank,
        rank_date: new Date().toISOString(),
        rank_change: rankChange,
        start_rank_diff: startRankDiff
      }]);

    if (historyError) {
      console.error('❌ 순위 히스토리 저장 실패:', historyError);
      // 히스토리 저장 실패는 치명적이지 않으므로 계속 진행
    } else {
      console.log('✅ 순위 히스토리 저장 완료');
    }

    console.log('✅ 순위 업데이트 완료:', {
      customer_id: keywordData.customer_id,
      slot_sequence: keywordData.slot_sequence,
      current_rank: rankFormat,
      start_rank: isFirstCheck ? rankFormat : slotStatus.start_rank
    });

    return NextResponse.json({
      success: true,
      data: {
        customer_id: keywordData.customer_id,
        slot_sequence: keywordData.slot_sequence,
        current_rank: rankFormat,
        start_rank: isFirstCheck ? rankFormat : slotStatus.start_rank,
        is_first_check: isFirstCheck
      }
    });

  } catch (error) {
    console.error('❌ 순위 업데이트 예외:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
