import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('슬롯 상태 확인 시작');

    // 모든 슬롯 데이터 조회
    const { data: slots, error } = await supabase
      .from('slots')
      .select('id, status, customer_id, slot_type')
      .order('id', { ascending: true });

    if (error) {
      console.error('슬롯 조회 에러:', error);
      return NextResponse.json({
        success: false,
        error: '슬롯 데이터를 가져오는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('슬롯 조회 완료:', slots?.length || 0, '개');

    // 상태별 통계
    const statusStats = slots?.reduce((acc, slot) => {
      acc[slot.status] = (acc[slot.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    console.log('상태별 통계:', statusStats);

    return NextResponse.json({
      success: true,
      data: {
        slots: slots,
        statusStats: statusStats
      }
    });

  } catch (error) {
    console.error('슬롯 상태 확인 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}


