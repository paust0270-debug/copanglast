import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// PATCH: 정산 내역 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: '상태 값이 필요합니다.' },
        { status: 400 }
      );
    }

    // settlements 테이블에서 해당 ID의 항목 업데이트
    const { data, error } = await supabase
      .from('settlements')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('정산 내역 업데이트 오류:', error);
      return NextResponse.json(
        { success: false, error: `정산 내역 업데이트 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '정산 내역이 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('정산 내역 업데이트 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 정산 내역 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // settlements 테이블에서 해당 ID의 항목 삭제
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('정산 내역 삭제 오류:', error);
      return NextResponse.json(
        { success: false, error: `정산 내역 삭제 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '정산 내역이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('정산 내역 삭제 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


