import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { customerId, username } = await request.json();
    
    console.log('🔄 순위 체크 API 테스트:', { customerId, username });
    
    return NextResponse.json({
      success: true,
      message: '순위 체크 API 테스트 성공',
      data: {
        customerId,
        username,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 순위 체크 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '순위 체크 API GET 요청 성공',
    timestamp: new Date().toISOString()
  });
}