import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // 로그인 유지 관련 쿠키 삭제
    cookieStore.delete('rememberMe');
    cookieStore.delete('userInfo');

    return NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.'
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    return NextResponse.json({
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
