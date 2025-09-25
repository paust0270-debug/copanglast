import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
}

// 특정 슬롯 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ 슬롯 삭제 요청 - ID: ${id}`);

    // 삭제하기 전에 슬롯 정보 조회 (로깅용)
    const { data: slotInfo, error: fetchError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('삭제할 슬롯 조회 오류:', fetchError);
      return NextResponse.json(
        { success: false, error: '삭제할 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`📋 삭제할 슬롯 정보:`, slotInfo);

    // slot_status 테이블에서 삭제
    const { error: deleteError } = await supabase
      .from('slot_status')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('슬롯 삭제 오류:', deleteError);
      return NextResponse.json(
        { success: false, error: `슬롯 삭제 중 오류가 발생했습니다: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 삭제 완료 - ID: ${id}, 슬롯 개수: ${slotInfo.slot_count}`);
    
    return NextResponse.json({
      success: true,
      data: {
        id: parseInt(id),
        slot_count: slotInfo.slot_count,
        keyword: slotInfo.keyword
      },
      message: '슬롯이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 삭제 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 슬롯 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔍 슬롯 조회 요청 - ID: ${id}`);

    const { data, error } = await supabase
      .from('slot_status')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('슬롯 조회 오류:', error);
      return NextResponse.json(
        { success: false, error: '슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '슬롯 조회 성공'
    });

  } catch (error) {
    console.error('슬롯 조회 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 슬롯 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`✏️ 슬롯 수정 요청 - ID: ${id}`, body);

    const { data, error } = await supabase
      .from('slot_status')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('슬롯 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: `슬롯 수정 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ 슬롯 수정 완료 - ID: ${id}`);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: '슬롯이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 수정 API 예외 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
