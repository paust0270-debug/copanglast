import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 공지사항 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('공지사항 조회 에러:', error);
      return NextResponse.json(
        { success: false, error: '공지사항을 불러오는데 실패했습니다.' },
        { status: 500 }
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

// 공지사항 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, title, content, is_important = false } = body;

    // 필수 필드 검증
    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 환경 변수 확인
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('환경 변수 누락:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
      return NextResponse.json(
        {
          success: false,
          error: '서버 설정 오류: 환경 변수가 설정되지 않았습니다.',
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('notices')
      .insert([
        {
          title,
          content,
          is_important,
          created_at: new Date(
            new Date().getTime() + 9 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date(
            new Date().getTime() + 9 * 60 * 60 * 1000
          ).toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('공지사항 등록 에러:', error);
      return NextResponse.json(
        {
          success: false,
          error: '공지사항 등록에 실패했습니다.',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('공지사항 등록 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
