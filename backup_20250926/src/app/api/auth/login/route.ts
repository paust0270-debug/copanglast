import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // user_profiles 테이블에서 사용자 확인
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 로그인 성공 시 사용자 정보 반환
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        grade: user.grade,
        distributor: user.distributor,
        status: user.status
      }
    });

    // 로그인 유지가 체크된 경우 쿠키 설정
    if (rememberMe) {
      const cookieStore = await cookies();
      cookieStore.set('rememberMe', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30일
      });
      
      // 사용자 정보도 쿠키에 저장 (보안을 위해 민감한 정보는 제외)
      cookieStore.set('userInfo', JSON.stringify({
        id: user.id,
        username: user.username,
        name: user.name,
        grade: user.grade,
        distributor: user.distributor,
        status: user.status
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30일
      });
    }

    return response;

  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
