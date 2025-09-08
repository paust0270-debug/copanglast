import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
}

// 슬롯 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 슬롯 목록 조회 중...');

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let query = supabase
      .from('slots')
      .select('*')
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: slots, error } = await query;

    if (error) {
      console.error('슬롯 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '슬롯 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slots
    });

  } catch (error) {
    console.error('슬롯 목록 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 추가
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 슬롯 추가 시작...');

    const body = await request.json();
    const {
      customerId,
      customerName,
      slotType,
      slotCount,
      paymentType,
      payerName,
      paymentAmount,
      paymentDate,
      usageDays,
      memo
    } = body;

    // 필수 필드 검증
    if (!customerId || !customerName || !slotType || !slotCount) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`슬롯 추가 시작: ${customerName} (${slotType} ${slotCount}개)`);

    // 슬롯 데이터 생성
    const slotData = {
      customer_id: customerId,
      customer_name: customerName,
      slot_type: slotType,
      slot_count: parseInt(slotCount),
      payment_type: paymentType || null,
      payer_name: payerName || null,
      payment_amount: paymentAmount ? parseInt(paymentAmount) : null,
      payment_date: paymentDate || null,
      usage_days: usageDays ? parseInt(usageDays) : null,
      memo: memo || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // 슬롯 추가
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .insert([slotData])
      .select()
      .single();

    if (slotError) {
      console.error('슬롯 추가 오류:', slotError);
      return NextResponse.json(
        { error: `슬롯 추가 중 오류가 발생했습니다: ${slotError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 슬롯 추가 완료:', slot);

    return NextResponse.json({
      success: true,
      data: slot,
      message: '슬롯이 성공적으로 추가되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 추가 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 상태 업데이트 (중지/재게)
export async function PUT(request: NextRequest) {
  try {
    const { slotId, status } = await request.json();
    
    if (!slotId || !status) {
      return NextResponse.json(
        { error: '슬롯 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }
    
    console.log('🔧 슬롯 상태 업데이트 요청:', { slotId, status });
    
    const { data, error } = await supabase
      .from('slots')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', slotId)
      .select();
    
    console.log('📊 Supabase 응답:', { data, error });
    
    if (error) {
      console.error('슬롯 상태 업데이트 오류:', error);
      return NextResponse.json(
        { error: '슬롯 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    console.log(`✅ 슬롯 ${slotId}의 상태가 ${status}로 변경되었습니다.`);
    
    return NextResponse.json({
      success: true,
      data: data[0],
      message: `슬롯 상태가 ${status === 'inactive' ? '일시 중지' : '활성화'}되었습니다.`
    });
    
  } catch (error) {
    console.error('슬롯 상태 업데이트 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}