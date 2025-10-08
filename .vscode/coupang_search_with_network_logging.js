const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const logDir = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.mkdirSync(logDir, { recursive: true });

  const networkLogs = [];
  const consoleErrors = [];

  console.log('🚀 쿠팡 검색 네트워크 모니터링 시작');
  console.log(`📁 로그 저장 위치: ${logDir}`);

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-logging',
      '--disable-notifications',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-gpu',
      '--disable-http2'
    ],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'dnt': '1'
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

  // 네트워크 요청 로깅
  context.on('request', request => {
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
  });

  // 네트워크 응답 로깅
  context.on('response', async response => {
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
  });

  // 네트워크 실패 로깅
  context.on('requestfailed', request => {
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

    // 검색창 찾기 및 포커스
    console.log('🔍 검색창 찾는 중...');
    await page.waitForSelector('#headerSearchKeyword', { timeout: 10000 });
    await page.click('#headerSearchKeyword');
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

    console.log('⏱️ 검색 버튼 클릭 후 5초 대기 중...');
    await page.waitForTimeout(5000);

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
      path.join(logDir, 'network_requests.log'),
      JSON.stringify(networkLogs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(logDir, 'console_errors.log'),
      JSON.stringify(consoleErrors, null, 2)
    );

    console.log(`📊 네트워크 요청 로그: ${networkLogs.length}개 기록됨`);
    console.log(`🔥 콘솔 에러 로그: ${consoleErrors.length}개 기록됨`);
    console.log(`💾 로그 파일들이 ${logDir} 폴더에 저장되었습니다`);

    await browser.close();
    console.log('🏁 브라우저 종료 완료');
  }
})();




