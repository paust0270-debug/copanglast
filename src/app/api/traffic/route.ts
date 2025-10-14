import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 트래픽 데이터 조회
export async function GET() {
  try {
    console.log('🔄 트래픽 데이터 조회 시작...');

    // traffic 테이블에서 데이터 조회
    const { data: trafficData, error } = await supabase
      .from('traffic')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 트래픽 데이터 조회 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: '트래픽 데이터를 조회하는 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log('✅ 트래픽 데이터 조회 완료:', trafficData?.length || 0, '개');

    // 데이터 포맷팅 (keywords 테이블과 동일한 구조)
    const formattedData = (trafficData || []).map(item => ({
      id: item.id,
      slot_type: item.slot_type || '쿠팡',
      keyword: item.keyword,
      link_url: item.link_url,
      current_rank: item.current_rank,
      last_check_date: item.last_check_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      slot_count: item.slot_count || 1,
      slot_sequence: item.slot_sequence,
      customer_id: item.customer_id,
      slot_id: item.slot_id,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('❌ 트래픽 데이터 API 예외 발생:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// POST: 트래픽 데이터 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 트래픽 데이터 추가 시작:', body);

    const {
      keyword,
      link_url,
      customer_id,
      slot_sequence,
      slot_type = '쿠팡',
    } = body;

    if (!keyword || !link_url) {
      return NextResponse.json(
        {
          success: false,
          error: '키워드와 링크 URL은 필수입니다.',
        },
        { status: 400 }
      );
    }

    // traffic 테이블에 데이터 추가
    const { data, error } = await supabase
      .from('traffic')
      .insert({
        keyword,
        link_url,
        customer_id,
        slot_sequence,
        slot_type,
        current_rank: '',
        start_rank: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ 트래픽 데이터 추가 오류:', error);
      return NextResponse.json(
        {
          success: false,
          error: '트래픽 데이터를 추가하는 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }

    console.log('✅ 트래픽 데이터 추가 완료:', data);

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error('❌ 트래픽 데이터 추가 API 예외 발생:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
