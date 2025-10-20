// 프론트엔드 자동 트래픽 카운터
// 브라우저가 열려있을 때만 작동

let trafficInterval: NodeJS.Timeout | null = null;
let lastIncrementTime = 0;

// 12분마다 트래픽 카운터 증가
function startTrafficCounter() {
  if (trafficInterval) return; // 이미 실행 중이면 중복 실행 방지

  console.log('🚀 프론트엔드 트래픽 카운터 시작 (12분마다 자동 증가)');

  trafficInterval = setInterval(async () => {
    try {
      const now = Date.now();
      const timeSinceLastIncrement = now - lastIncrementTime;

      // 12분(720,000ms) 이상 지났을 때만 증가
      if (timeSinceLastIncrement >= 12 * 60 * 1000) {
        console.log('🔄 트래픽 카운터 자동 증가...');

        const response = await fetch('/api/traffic-counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'increment' }),
        });

        if (response.ok) {
          lastIncrementTime = now;
          console.log('✅ 트래픽 카운터 증가 완료');

          // 페이지 새로고침으로 업데이트된 값 표시
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('❌ 트래픽 카운터 증가 실패:', error);
    }
  }, 60 * 1000); // 1분마다 체크
}

// 페이지 로드 시 시작
if (typeof window !== 'undefined') {
  startTrafficCounter();

  // 페이지가 보일 때만 실행 (탭이 활성화되어 있을 때)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startTrafficCounter();
    } else {
      if (trafficInterval) {
        clearInterval(trafficInterval);
        trafficInterval = null;
      }
    }
  });
}
