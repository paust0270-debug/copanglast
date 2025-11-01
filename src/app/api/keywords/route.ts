import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 키워드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slotType = searchParams.get('slot_type') || 'coupang';
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 키워드 목록 조회:', { slotType, limit, offset });

    // 최신 last_check_date를 기준으로 조회 (null 값은 맨 뒤로)
    // limit을 늘려서 더 많은 데이터를 가져옴
    const actualLimit = limit > 10000 ? limit : 10000; // 최소 10000개까지 조회
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('last_check_date', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(actualLimit);

    if (error) {
      console.error('키워드 목록 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '키워드 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 🔥 일시적으로 중복 제거 로직 제거 - 모든 데이터 반환
    // 최신 순으로 정렬되어 있으므로 최신 데이터가 먼저 표시됨
    const allData = data || [];

    // offset과 limit 적용
    const paginatedData = allData.slice(offset, offset + limit);

    console.log('✅ 키워드 목록 조회 완료:', {
      전체조회: allData.length,
      페이지네이션후: paginatedData.length,
      샘플데이터: paginatedData.slice(0, 5).map(k => ({
        id: k.id,
        keyword: k.keyword,
        slot_type: k.slot_type,
        last_check_date: k.last_check_date,
        created_at: k.created_at,
      })),
    });

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total: allData.length,
    });
  } catch (error) {
    console.error('키워드 목록 조회 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 키워드 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot_type, keyword, link_url, slot_count, current_rank } = body;

    console.log('➕ 키워드 추가:', {
      slot_type,
      keyword,
      link_url,
      slot_count,
      current_rank,
    });

    if (!keyword || !link_url) {
      return NextResponse.json(
        { success: false, error: '키워드와 링크 주소는 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('keywords')
      .insert({
        slot_type: slot_type || 'coupang',
        keyword,
        link_url,
        slot_count: slot_count || 1,
        current_rank: current_rank || null,
        last_check_date: new Date(
          new Date().getTime() + 9 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('키워드 추가 오류:', error);
      return NextResponse.json(
        { success: false, error: '키워드 추가에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 키워드 추가 완료:', data.id);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('키워드 추가 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
