import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 슬롯 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { keyword, link_url, slot_type, memo, status } = body;

    console.log('✏️ 슬롯 수정:', { id, keyword, link_url, slot_type, memo, status });

    // slot_status 테이블에서 수정
    const { data, error } = await supabase
      .from('slot_status')
      .update({
        keyword: keyword || null,
        link_url: link_url || null,
        slot_type: slot_type || 'coupang',
        memo: memo || null,
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('슬롯 수정 오류:', error);
      return NextResponse.json(
        { success: false, error: '슬롯 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    // keywords 테이블 동기화 제거 - 슬롯 등록과 분리

    console.log('✅ 슬롯 수정 완료:', data.id);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('슬롯 수정 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '슬롯 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🗑️ 슬롯 삭제 요청 - ID:', id);

    // 삭제할 슬롯 존재 여부 확인
    const { data: slotInfo, error: findError } = await supabase
      .from('slot_status')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (findError) {
      console.error('삭제할 슬롯 조회 오류:', findError);
      return NextResponse.json(
        { success: false, error: '삭제할 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // slot_status 테이블에서 삭제
    const { error } = await supabase
      .from('slot_status')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('슬롯 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: '슬롯 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // keywords 테이블 정리 제거 - 슬롯 등록과 분리

    console.log('✅ 슬롯 삭제 완료:', id);

    return NextResponse.json({
      success: true,
      message: '슬롯이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('슬롯 삭제 예외:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
