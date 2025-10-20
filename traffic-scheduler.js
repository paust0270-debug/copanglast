#!/usr/bin/env node

/**
 * 트래픽 카운터 스케줄러
 *
 * 실행 방법:
 * - 12분마다 증가: node traffic-scheduler.js increment
 * - 매일 자정 리셋: node traffic-scheduler.js daily_reset
 */

const action = process.argv[2];

if (!action || !['increment', 'daily_reset'].includes(action)) {
  console.error('❌ 사용법: node traffic-scheduler.js [increment|daily_reset]');
  process.exit(1);
}

async function runScheduler() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/traffic-scheduler?action=${action}`;

    console.log(`🔄 트래픽 카운터 스케줄러 실행: ${action}`);
    console.log(`📡 API 호출: ${url}`);

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 성공: ${result.message}`);
      if (result.updatedCount !== undefined) {
        console.log(`📊 업데이트된 슬롯 수: ${result.updatedCount}`);
      }
    } else {
      console.error(`❌ 실패: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 스케줄러 실행 오류:', error);
    process.exit(1);
  }
}

runScheduler();
