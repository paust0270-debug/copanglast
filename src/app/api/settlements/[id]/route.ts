import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: 특정 정산 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settlementId } = await params;
    console.log('정산 데이터 조회 시작, ID:', settlementId);

    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: '정산 ID가 필요합니다.'
      }, { status: 400 });
    }

    // settlement_history 테이블에서만 조회 (정산 내역 수정 페이지용)
    console.log('settlement_history에서 ID', settlementId, '조회 시도');
    const { data: settlement, error } = await supabase
      .from('settlement_history')
      .select('*')
      .eq('id', settlementId)
      .single();

    console.log('settlement_history 조회 결과:', { settlement, error });

    if (error) {
      console.error('정산 데이터 조회 오류:', error);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 조회하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    if (!settlement) {
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    console.log('정산 데이터 조회 완료:', settlement);

    // 데이터 포맷팅 (정산 내역 페이지와 동일한 구조)
    const formattedSettlement = {
      id: settlement.id,
      sequential_number: settlement.id, // 순번은 ID로 설정
      category: settlement.payment_type === 'extension' ? '연장' : 
               settlement.payment_type === 'deposit' ? '입금' : '일반',
      distributor_name: '총판A', // 기본값
      customer_id: settlement.customer_id,
      customer_name: settlement.customer_name,
      slot_type: settlement.slot_type,
      slot_count: settlement.slot_count,
      payment_type: settlement.payment_type,
      payer_name: settlement.payer_name,
      payment_amount: settlement.payment_amount,
      slot_addition_date: settlement.created_at, // created_at을 slot_addition_date로 매핑
      usage_days: settlement.usage_days,
      memo: settlement.memo,
      status: settlement.status,
      created_at: settlement.created_at,
      updated_at: settlement.updated_at,
      settlement_batch_id: settlement.settlement_batch_id, // 중요: settlement_batch_id 추가
      completed_at: settlement.completed_at
    };

    return NextResponse.json({
      success: true,
      data: formattedSettlement
    });

  } catch (error) {
    console.error('정산 데이터 조회 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산 데이터를 조회하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// PATCH: 정산 데이터 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settlementId } = await params;
    const updateData = await request.json();
    
    console.log('정산 데이터 수정 시작, ID:', settlementId);
    console.log('수정 데이터:', updateData);

    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: '정산 ID가 필요합니다.'
      }, { status: 400 });
    }

    // 수정할 필드들만 추출 (settlement_history 테이블 구조에 맞춤)
    const allowedFields = [
      'payment_amount',
      'usage_days', 
      'memo',
      'status',
      'payer_name',
      'slot_addition_date'
    ];

    const filteredUpdateData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    // settlement_history 테이블에는 updated_at 필드가 없으므로 제거
    // 대신 completed_at 필드를 업데이트 (정산 완료 시간)
    if (filteredUpdateData.status === 'completed') {
      filteredUpdateData.completed_at = new Date().toISOString();
    }

    console.log('필터링된 수정 데이터:', filteredUpdateData);

    // 먼저 settlement_history 테이블에서 업데이트 시도
    let { data, error } = await supabase
      .from('settlement_history')
      .update(filteredUpdateData)
      .eq('id', settlementId)
      .select()
      .single();

    // settlement_history에서 업데이트 실패한 경우 settlements 테이블에서 시도
    if (error && error.code === 'PGRST116') {
      console.log('settlement_history에서 업데이트 실패, settlements 테이블에서 시도');
      const result = await supabase
        .from('settlements')
        .update(filteredUpdateData)
        .eq('id', settlementId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('정산 데이터 수정 오류:', error);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 수정하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('정산 데이터 수정 완료:', data);

    return NextResponse.json({
      success: true,
      data: data,
      message: '정산 데이터가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('정산 데이터 수정 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산 데이터를 수정하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

// DELETE: 정산 데이터 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: settlementId } = await params;
    console.log('정산 데이터 삭제 시작, ID:', settlementId);

    if (!settlementId) {
      return NextResponse.json({
        success: false,
        error: '정산 ID가 필요합니다.'
      }, { status: 400 });
    }

    // settlement_history 테이블에서 삭제
    const { error } = await supabase
      .from('settlement_history')
      .delete()
      .eq('id', settlementId);

    if (error) {
      console.error('정산 데이터 삭제 오류:', error);
      return NextResponse.json({
        success: false,
        error: '정산 데이터를 삭제하는 중 오류가 발생했습니다.'
      }, { status: 500 });
    }

    console.log('정산 데이터 삭제 완료');

    return NextResponse.json({
      success: true,
      message: '정산 데이터가 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('정산 데이터 삭제 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '정산 데이터를 삭제하는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}