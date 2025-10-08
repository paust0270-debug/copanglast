import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 공지사항 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noticeId = parseInt(id);

    if (isNaN(noticeId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 공지사항 ID입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('id', noticeId)
      .single();

    if (error) {
      console.error('공지사항 조회 에러:', error);
      return NextResponse.json(
        { success: false, error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('공지사항 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 공지사항 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = parseInt(params.id);
    const body = await request.json();
    const { title, content } = body;

    if (isNaN(noticeId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 공지사항 ID입니다.' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notices')
      .update({
        title,
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', noticeId)
      .select()
      .single();

    if (error) {
      console.error('공지사항 수정 에러:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('공지사항 수정 에러:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 공지사항 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticeId = parseInt(params.id);

    if (isNaN(noticeId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 공지사항 ID입니다.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId);

    if (error) {
      console.error('공지사항 삭제 에러:', error);
      return NextResponse.json(
        { success: false, error: '공지사항 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('공지사항 삭제 에러:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
