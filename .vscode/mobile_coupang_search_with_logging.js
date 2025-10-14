const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const logDir = `mobile_logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.mkdirSync(logDir, { recursive: true });

  const networkLogs = [];
  const consoleErrors = [];

  console.log('🚀 모바일 Chrome 환경 쿠팡 검색 네트워크 모니터링 시작');
  console.log(`📁 로그 저장 위치: ${logDir}`);

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions'
    ],
    ignoreHTTPSErrors: true
  });

  // 모바일 Chrome 140 환경 시뮬레이션
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    viewport: { width: 375, height: 667 }, // 모바일 뷰포트
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept': '*/*', // 사용자 브라우저와 동일
      'accept-encoding': 'gzip, deflate, br, zstd', // 사용자 브라우저와 동일
      'cache-control': 'no-cache', // 사용자 브라우저와 동일
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?1', // 모바일 신호
      'sec-ch-ua-platform': '"Android"', // Android 플랫폼
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'priority': 'u=1, i',
      'pragma': 'no-cache'
    },
    javaScriptEnabled: true
  });

  // navigator.webdriver 오버라이드
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
  });

  const page = await context.newPage();

  // 네트워크 요청 로깅 - 특히 POST 요청에 집중
  context.on('request', request => {
    if (request.url().includes('ljc.coupang.com/api/v2/submit')) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        resourceType: request.resourceType()
      };
      networkLogs.push(logEntry);
      console.log(`📤 요청: ${request.method()} ${request.url()}`);
      console.log(`📋 헤더: ${JSON.stringify(request.headers(), null, 2)}`);
      if (request.postData()) {
        console.log(`📝 POST 데이터 길이: ${request.postData().length}`);
      }
    }
  });

  // 네트워크 응답 로깅
  context.on('response', async response => {
    if (response.url().includes('ljc.coupang.com/api/v2/submit')) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'response',
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        resourceType: 'unknown'
      };
      networkLogs.push(logEntry);
      console.log(`📥 응답: ${response.status()} ${response.url()}`);
      console.log(`📋 응답 헤더: ${JSON.stringify(response.headers(), null, 2)}`);
    }
  });

  // 네트워크 실패 로깅
  context.on('requestfailed', request => {
    if (request.url().includes('ljc.coupang.com/api/v2/submit')) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'failed',
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText || 'unknown',
        resourceType: request.resourceType()
      };
      networkLogs.push(logEntry);
      console.error(`❌ 실패: ${request.method()} ${request.url()} - ${logEntry.error}`);
    }
  });

  // 콘솔 에러 로깅
  page.on('console', message => {
    if (message.type() === 'error') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'console_error',
        message: message.text(),
        location: message.location()
      };
      consoleErrors.push(logEntry);
      console.error(`💬 콘솔 에러: ${message.text()}`);
    }
  });

  // 페이지 에러 로깅
  page.on('pageerror', error => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'page_error',
      message: error.message,
      stack: error.stack
    };
    consoleErrors.push(logEntry);
    console.error(`🔥 페이지 에러: ${error.message}`);
  });

  try {
    // 쿠팡 메인 페이지 이동
    console.log('🏠 쿠팡 메인 페이지 접속 중...');
    await page.goto('https://www.coupang.com', {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    console.log('✅ 쿠팡 메인 페이지 로드 완료');

    // 검색창 찾기 및 포커스 - 모바일 버전 고려
    console.log('🔍 검색창 찾는 중...');
    
    // 모바일에서는 다른 셀렉터를 사용할 수 있음
    let searchSelector = '#headerSearchKeyword';
    
    try {
      await page.waitForSelector(searchSelector, { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ 기본 검색창을 찾을 수 없음, 대체 셀렉터 시도...');
      searchSelector = 'input[type="search"], input[name="q"], .search-input';
      await page.waitForSelector(searchSelector, { timeout: 5000 });
    }
    
    await page.click(searchSelector);
    console.log('✅ 검색창 클릭 완료');

    // 자연스러운 타이핑 시뮬레이션
    const searchKeyword = '자전거 자물쇠';
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑 중...`);
    
    for (let i = 0; i < searchKeyword.length; i++) {
      const char = searchKeyword[i];
      const delay = Math.random() * 100 + 100; // 100-200ms 랜덤 딜레이
      
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
      
      console.log(`📝 타이핑: "${char}" (${delay.toFixed(0)}ms 지연)`);
    }

    // 검색 버튼 클릭 대신 엔터 키 사용
    console.log('🚀 엔터 키로 검색 실행...');
    await page.keyboard.press('Enter');

    console.log('⏱️ 검색 실행 후 관찰 대기 중...');
    
    // 네트워크 활동을 관찰하기 위해 충분히 대기
    await page.waitForTimeout(10000); // 10초 대기

    console.log('✅ 검색 완료');

  } catch (error) {
    console.error(`❌ 실행 중 오류 발생: ${error.message}`);
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: 'execution_error',
      message: error.message,
      stack: error.stack
    };
    consoleErrors.push(errorLog);
  } finally {
    // 로그 파일 저장
    fs.writeFileSync(
      path.join(logDir, 'mobile_network_requests.json'),
      JSON.stringify(networkLogs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(logDir, 'mobile_console_errors.json'),
      JSON.stringify(consoleErrors, null, 2)
    );

    // 헤더 비교용 파일 생성
    const ljcRequests = networkLogs.filter(log => 
      log.url && log.url.includes('ljc.coupang.com/api/v2/submit')
    );
    
    fs.writeFileSync(
      path.join(logDir, 'ljc_api_requests.json'),
      JSON.stringify(ljcRequests, null, 2)
    );

    console.log(`📊 네트워크 요청 로그: ${networkLogs.length}개 기록됨`);
    console.log(`🔥 콘솔 에러 로그: ${consoleErrors.length}개 기록됨`);
    console.log(`🎯 ljc.coupang 요청: ${ljcRequests.length}개 기록됨`);
    console.log(`💾 로그 파일들이 ${logDir} 폴더에 저장되었습니다`);

    await browser.close();
    console.log('🏁 브라우저 종료 완료');
  }
})();
