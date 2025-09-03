import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementData } = body;

    if (!settlementData || !Array.isArray(settlementData)) {
      return NextResponse.json({
        success: false,
        error: '정산 데이터가 올바르지 않습니다.'
      }, { status: 400 });
    }

    // 정산요청 데이터를 DB에 저장
    const { data, error } = await supabase
      .from('settlement_requests')
      .insert(settlementData)
      .select();

    if (error) {
      console.error('정산요청 저장 오류:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      console.error('에러 상세:', error.details);
      console.error('에러 힌트:', error.hint);
      
      // 테이블이 없는 경우 특별 처리
      if (error.code === 'PGRST205' && error.message.includes('settlement_requests')) {
        return NextResponse.json({
          success: false,
          error: '정산요청 테이블이 존재하지 않습니다. Supabase 대시보드에서 테이블을 생성해주세요.'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: false,
        error: `정산요청 저장에 실패했습니다: ${error.message}`
      }, { status: 500 });
    }

    // 슬롯 상태를 'settlement_requested'로 업데이트
    const slotIds = settlementData.map((item: any) => item.slot_id);
    const { error: updateError } = await supabase
      .from('slots')
      .update({ status: 'settlement_requested' })
      .in('id', slotIds);

    if (updateError) {
      console.error('슬롯 상태 업데이트 오류:', updateError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `${settlementData.length}개의 정산요청이 성공적으로 저장되었습니다.`
    });

  } catch (error) {
    console.error('정산요청 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// 정산요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const distributor = searchParams.get('distributor');

    let query = supabase
      .from('settlement_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== '전체') {
      query = query.eq('status', status);
    }

    if (distributor && distributor !== '전체') {
      query = query.eq('distributor_name', distributor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('정산요청 조회 오류:', error);
      return NextResponse.json({
        success: false,
        error: '정산요청 조회에 실패했습니다.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('정산요청 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
