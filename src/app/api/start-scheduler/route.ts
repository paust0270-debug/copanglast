import { NextRequest, NextResponse } from 'next/server';
import { startServerSideScheduler } from '@/lib/server-traffic-scheduler';

// 서버 시작 시 한 번만 실행
let schedulerStarted = false;

export async function GET(request: NextRequest) {
  try {
    // 스케줄러가 아직 시작되지 않았다면 시작
    if (!schedulerStarted) {
      startServerSideScheduler();
      schedulerStarted = true;
      console.log('🚀 서버사이드 트래픽 스케줄러 시작됨');
    }

    return NextResponse.json({
      success: true,
      message: '서버사이드 트래픽 스케줄러가 실행 중입니다',
      schedulerStarted: schedulerStarted,
    });
  } catch (error) {
    console.error('❌ 스케줄러 시작 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: '스케줄러 시작 실패',
      },
      { status: 500 }
    );
  }
}
