import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 슬롯 추가 폼 데이터 저장
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 슬롯 추가 폼 데이터 저장 시작...');

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
        { success: false, error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`슬롯 추가 폼 데이터 저장: ${customerName} (${slotType} ${slotCount}개)`);

    // 슬롯 추가 폼 데이터 생성 (실제 테이블 스키마에 맞게 수정)
    const formData = {
      customer_id: parseInt(customerId) || 1, // 필수 컬럼 (integer)
      platform: slotType || 'coupang', // 필수 컬럼
      product_name: `${slotType} 슬롯 ${slotCount}개`, // 필수 컬럼
      created_at: new Date().toISOString()
    };

    // 슬롯 추가 폼 데이터 저장
    const { data: savedForm, error: saveError } = await supabase
      .from('slot_add_forms')
      .insert([formData])
      .select()
      .single();

    if (saveError) {
      console.error('슬롯 추가 폼 데이터 저장 오류:', saveError);
      return NextResponse.json(
        { success: false, error: `폼 데이터 저장 중 오류가 발생했습니다: ${saveError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ 슬롯 추가 폼 데이터 저장 완료:', savedForm);

    // slots 테이블 레코드 생성 제거 (중복 방지 - /api/slots에서 이미 생성함)
    console.log('✅ slots 레코드 생성 생략 (중복 방지 - /api/slots에서 이미 생성함)');

    // slot_status 레코드 생성 제거 (중복 방지 - /api/slots에서 이미 생성함)
    console.log('✅ slot_status 레코드 생성 생략 (중복 방지 - /api/slots에서 이미 생성함)');

    return NextResponse.json({
      success: true,
      data: savedForm,
      message: '슬롯 추가 폼 데이터가 저장되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 추가 폼 데이터 저장 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 저장된 슬롯 추가 폼 데이터 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 저장된 슬롯 추가 폼 데이터 조회 중...');

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const limit = searchParams.get('limit') || '50';

    let query = supabase
      .from('slot_add_forms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // 특정 고객의 폼 데이터만 조회
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('슬롯 추가 폼 데이터 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '폼 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 추가 폼 데이터 조회 성공: ${data?.length || 0}개`);

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('슬롯 추가 폼 데이터 조회 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}