import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    console.log('정산 내역 데이터 조회 시작');

    // settlements 테이블에서 모든 정산 데이터 조회 (최신순)
    // is_latest 필드가 없는 경우를 대비해 조건부로 처리
    let query = supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    // is_latest 필드가 있는지 확인하기 위해 먼저 테이블 스키마 확인
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('settlements')
      .select('is_latest')
      .limit(1);

    // is_latest 필드가 있으면 최신 버전만 조회, 없으면 모든 데이터 조회
    if (schemaCheck && schemaCheck.length > 0 && 'is_latest' in schemaCheck[0]) {
      query = query.eq('is_latest', true);
    }

    const { data: settlements, error } = await query;

    if (error) {
      console.error('정산 내역 조회 에러:', error);
      return NextResponse.json({
        success: false,
        error: '정산 내역을 가져오는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('정산 내역 조회 완료:', settlements?.length || 0, '개');

    // 데이터 포맷팅 (필요한 컬럼만)
    const formattedSettlements = settlements?.map((settlement: any) => ({
      id: settlement.id,
      sequential_number: settlement.sequential_number,
      distributor_name: settlement.distributor_name,
      total_slots: settlement.total_slots,
      total_deposit_amount: settlement.total_deposit_amount,
      depositor_name: settlement.depositor_name,
      deposit_date: settlement.deposit_date,
      request_date: settlement.request_date,
      memo: settlement.memo,
      status: settlement.status,
      created_at: settlement.created_at,
      updated_at: settlement.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedSettlements
    });

  } catch (error) {
    console.error('정산 내역 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: '정산 내역을 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementData } = body;

    if (!settlementData) {
      return NextResponse.json({
        success: false,
        error: '정산 데이터가 올바르지 않습니다.'
      }, { status: 400 });
    }

    console.log('정산 데이터 저장 시작:', settlementData);

    // settlements 테이블에 정산 데이터 저장
    const { data, error } = await supabase
      .from('settlements')
      .insert(settlementData)
      .select();

    if (error) {
      console.error('정산 데이터 저장 에러:', error);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 저장하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('정산 데이터 저장 완료:', data?.length || 0, '개');

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('정산 데이터 저장 API 에러:', error);
    return NextResponse.json({
      success: false,
      error: '정산 데이터를 저장하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
