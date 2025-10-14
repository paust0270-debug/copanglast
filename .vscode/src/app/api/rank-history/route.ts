import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { slotStatusId, keyword, linkUrl, currentRank, startRank } = await request.json();
    
    console.log('🔄 순위 히스토리 저장:', { slotStatusId, keyword, currentRank });
    
    // 순위 히스토리 저장
    const { error } = await supabase
      .from('rank_history')
      .insert({
        slot_status_id: slotStatusId,
        keyword: keyword,
        link_url: linkUrl,
        current_rank: currentRank,
        start_rank: startRank,
        check_date: new Date().toISOString()
      });
    
    if (error) {
      console.error('❌ 순위 히스토리 저장 실패:', error);
      throw error;
    }
    
    console.log('✅ 순위 히스토리 저장 완료');
    
    return NextResponse.json({
      success: true,
      message: '순위 히스토리 저장 완료'
    });
    
  } catch (error) {
    console.error('❌ 순위 히스토리 저장 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slotStatusId = searchParams.get('slotStatusId');
    
    if (!slotStatusId) {
      return NextResponse.json({
        success: false,
        error: 'slotStatusId가 필요합니다'
      }, { status: 400 });
    }
    
    console.log('🔄 순위 히스토리 조회:', slotStatusId);
    
    // 순위 히스토리 조회
    const { data, error } = await supabase
      .from('rank_history')
      .select('*')
      .eq('slot_status_id', slotStatusId)
      .order('check_date', { ascending: true });
    
    if (error) {
      console.error('❌ 순위 히스토리 조회 실패:', error);
      throw error;
    }
    
    console.log(`✅ 순위 히스토리 조회 완료: ${data?.length || 0}개`);
    
    return NextResponse.json({
      success: true,
      data: data || []
    });
    
  } catch (error) {
    console.error('❌ 순위 히스토리 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}