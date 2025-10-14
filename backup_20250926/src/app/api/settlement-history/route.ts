import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('정산내역 저장 요청:', body);

    // settlement_history 테이블에 데이터 저장
    const { data, error } = await supabase
      .from('settlement_history')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('정산내역 저장 오류:', error);
      return NextResponse.json({
        success: false,
        error: '정산내역 저장 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('정산내역 저장 완료:', data);
    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('정산내역 저장 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산내역 저장 API 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const distributor = searchParams.get('distributor');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const batchId = searchParams.get('batchId');
    const id = searchParams.get('id');

    console.log('정산내역 조회 요청:', { distributor, startDate, endDate, batchId, id });

    // 먼저 settlement_history 테이블이 존재하는지 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from('settlement_history')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('settlement_history 테이블 확인 오류:', tableError);
      
      // 테이블이 존재하지 않는 경우 빈 배열 반환
      if (tableError.code === 'PGRST116' || tableError.message.includes('relation "settlement_history" does not exist')) {
        console.log('settlement_history 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.');
        return NextResponse.json({
          success: true,
          data: [],
          message: '정산 내역 테이블이 아직 생성되지 않았습니다. 정산 완료 후 내역이 표시됩니다.'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: '정산내역을 조회하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    // settlement_history 테이블에서 정산완료된 데이터 조회
    console.log('settlement_history 테이블에서 데이터 조회 시작...');
    
    let query = supabase
      .from('settlement_history')
      .select(`
        id,
        sequential_number,
        category,
        distributor_name,
        customer_id,
        customer_name,
        slot_addition_date,
        slot_type,
        slot_count,
        payer_name,
        payment_amount,
        usage_days,
        memo,
        status,
        payment_type,
        created_at,
        completed_at,
        settlement_batch_id,
        original_settlement_item_id
      `)
      .eq('status', 'completed')
      .eq('payment_type', 'batch') // 합산된 데이터만 조회
      .order('completed_at', { ascending: false });

    // 특정 ID 필터 (개별 항목 조회)
    if (id) {
      query = query.eq('id', id);
    }

    // 배치 ID 필터 (특정 배치의 모든 항목 조회)
    if (batchId) {
      query = query.eq('settlement_batch_id', batchId);
      // 배치 ID로 조회할 때는 payment_type 필터 제거 (개별 데이터도 필요)
      query = query.neq('payment_type', 'batch');
    }

    // 총판 필터
    if (distributor && distributor !== '전체') {
      query = query.eq('distributor_name', distributor);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte('completed_at', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte('completed_at', `${endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('정산내역 조회 오류:', error);
      console.error('오류 세부사항:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({
        success: false,
        error: `정산내역을 조회하는 중 오류가 발생했습니다: ${error.message}`
      }, { status: 500 });
    }

    console.log('정산내역 조회 성공:', data?.length || 0, '개');
    if (data && data.length > 0) {
      console.log('첫 번째 정산내역 데이터:', data[0]);
    }

    // 필드명 변환: 표준화된 필드명으로 변환
    const transformedData = (data || []).map(item => ({
      id: item.id,
      sequential_number: item.sequential_number || 1,
      category: item.category || (item.payment_type === 'extension' ? '연장' : 
                item.payment_type === 'deposit' ? '입금' : '일반'),
      distributor_name: item.distributor_name || '총판A',
      customer_id: item.customer_id,
      customer_name: item.customer_name || item.customer_id,
      slot_addition_date: item.slot_addition_date ? item.slot_addition_date.split('T')[0] : 
                         item.created_at ? item.created_at.split('T')[0] : 
                         new Date().toISOString().split('T')[0],
      slot_type: item.slot_type,
      slot_count: item.slot_count || 1,
      payer_name: item.payer_name || '',
      payment_amount: item.payment_amount || 0,
      usage_days: item.usage_days || 0,
      memo: item.memo || '',
      status: item.status,
      payment_type: item.payment_type,
      created_at: item.created_at,
      completed_at: item.completed_at,
      settlement_batch_id: item.settlement_batch_id
    }));

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('정산내역 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
