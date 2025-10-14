import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('테스트 API 호출됨');
    
    return NextResponse.json({
      success: true,
      message: '테스트 API가 정상적으로 작동합니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('테스트 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '테스트 API 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

