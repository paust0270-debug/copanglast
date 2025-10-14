import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // rememberMe 쿠키 확인
    const rememberMe = cookieStore.get('rememberMe');
    const userInfo = cookieStore.get('userInfo');

    if (rememberMe?.value === 'true' && userInfo?.value) {
      try {
        const user = JSON.parse(userInfo.value);
        return NextResponse.json({
          success: true,
          user: user
        });
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        return NextResponse.json({
          success: false,
          error: '저장된 로그인 정보가 유효하지 않습니다.'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      message: '저장된 로그인 정보가 없습니다.'
    });

  } catch (error) {
    console.error('저장된 로그인 정보 확인 오류:', error);
    return NextResponse.json({
      success: false,
      error: '로그인 정보 확인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
