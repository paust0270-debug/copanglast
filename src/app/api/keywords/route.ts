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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔍 키워드 목록 조회:', { slotType, limit, offset });

    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('키워드 목록 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '키워드 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✅ 키워드 목록 조회 완료:', data?.length || 0, '개');

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
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

    console.log('➕ 키워드 추가:', { slot_type, keyword, link_url, slot_count, current_rank });

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
        last_check_date: new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString()
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
      data
    });

  } catch (error) {
    console.error('키워드 추가 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}