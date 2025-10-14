const { chromium } = require("playwright");
const fs = require('fs');
const path = require('path');

async function checkCoupangRankWithLogging() {
  const targetProductId = '8617045901';
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/g, '');
  const logDir = `logs_${timestamp}`;
  
  // 로그 디렉토리 생성
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  // 로그 파일들 초기화
  const networkLogFile = path.join(logDir, 'network_requests.log');
  const errorLogFile = path.join(logDir, 'console_errors.log');
  const debugLogFile = path.join(logDir, 'debug_info.log');
  const summaryLogFile = path.join(logDir, 'execution_summary.log');
  
  const logs = {
    requests: [],
    errors: [],
    debug: [],
    summary: {
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'running',
      requests: 0,
      errors: 0,
      pagesVisited: []
    }
  };
  
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');
  console.log(`📁 로그 디렉토リ: ${logDir}`);
  console.log('📊 네트워크 모니터링 모드 활성화');

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-http2',
      '--disable-features=http2',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbase',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--lang=ko-KR'
    ],
    ignoreHTTPSErrors: true
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    }
  });
  
  // 네트워크 요청 로깅
  await context.route('**/*', async route => {
    const request = route.request();
    const requestData = {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      headers: request.headers(),
      postData: request.postData() ? request.postData().substring(0, 500) : null // 제한된 POST 데이터
    };
    
    console.log(`🌐 ${request.method()} ${request.url()}`);
    
    // 요청 생성 시점 기록
    logs.requests.push({
      ...requestData,
      status: 'request_initiated',
      responseData: null
    });
    
    try {
      await route.continue();
    } catch (error) {
      console.error(`❌ 요청 라우팅 실패: ${error.message}`);
      addErrorMessage('request_routing', error.message, error.stack);
    }
  });
  
  const page = await context.newPage();
  
  // 페이지 응답 로깅
  page.on('response', async response => {
    const requestData = {
      timestamp: new Date().toISOString(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      fromServiceWorker: response.fromServiceWorker(),
      frame: response.frame()?.url() || null
    };
    
    // 응답 상태에 따른 로깅
    if (response.status() >= 400) {
      console.error(`❌ ${response.status()} ${response.url()}`);
      addErrorMessage('http_error', `${response.status()} ${response.statusText()}`, {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
    } else if (response.status() < 300) {
      console.log(`✅ ${response.status()} ${response.url()}`);
    } else {
      console.warn(`⚠️ ${response.status()} ${response.url()}`);
    }
    
    // 요구 네트워크 로그에 응답 정보 추가
    const matchingRequest = logs.requests.find(req => 
      req.url === response.url() && req.status === 'request_initiated'
    );
    
    if (matchingRequest) {
      matchingRequest.status = 'completed';
      matchingRequest.responseData = requestData;
      logs.summary.requests++;
    }
  });
  
  // 콘솔 메시지 및 에러 로깅
  page.on('console', msg => {
    const logData = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    
    console.log(`💬 [${msg.type().toUpperCase()}] ${msg.text()}`);
    
    // 에러와 경고만 별도 기록
    if (msg.type() === 'error' || msg.type() === 'warning') {
      addErrorMessage('console_' + msg.type(), msg.text(), msg.location);
    }
    
    logs.debug.push({
      category: 'console',
      ...logData
    });
  });
  
  // 페이지 에러 로깅
  page.on('pageerror', error => {
    console.error(`🔥 페이지 에러: ${error.message}`);
    addErrorMessage('page_error', error.message, error.stack);
  });
  
  // 요청 실패 로깅
  page.on('requestfailed', request => {
    const failureData = {
      timestamp: new Date().toISOString(),
      url: request.url(),
      requestMethod: request.method(),
      failureText: request.failure()?.errorText || 'unknown',
      resourceType: request.resourceType()
    };
    
    console.error(`💥 요청 실패: ${request.url()} - ${failureData.failureText}`);
    addErrorMessage('request_failed', failureData.failureText, failureData);
    
    logs.debug.push({
      category: 'request_failure',
      ...failureData
    });
  });
  
  // 로깅 헬퍼 함수
  function addErrorMessage(type, message, details) {
    const errorData = {
      timestamp: new Date().toISOString(),
      type: type,
      message: message,
      details: details
    };
    
    logs.errors.push(errorData);
    logs.summary.errors++;
    
    console.error(`⚠️ [${type.toUpperCase()}] ${message}`);
  }
  
  // 스텔스 설정
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    Object.defineProperty(window, 'chrome', {
      get: () => ({
        runtime: {},
        loadTimes: () => ({}),
        csi: () => ({}),
        app: { isInstalled: false }
      })
    });
    
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ko-KR', 'ko', 'en']
    });
  });

  try {
    console.log('📱 쿠팡 메인 페이지 접속 중...');
    logs.summary.pagesVisited.push({
      url: 'https://www.coupang.com',
      timestamp: new Date().toISOString(),
      purpose: 'main_page_access'
    });
    
    const mainPageResponse = await page.goto("https://www.coupang.com", { 
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    logs.debug.push({
      category: 'navigation',
      timestamp: new Date().toISOString(),
      action: 'goto_main_page',
      url: 'https://www.coupang.com',
      responseStatus: mainPageResponse?.status(),
      success: !!mainPageResponse
    });

    console.log('✅ 쿠팡 메인 페이지 로드 완료');

    // 검색창 찾기
    console.log('🔍 검색창 찾는 중...');
    let searchInput;
    
    try {
      searchInput = await page.waitForSelector('input[name="q"]', { timeout: 10000 });
      console.log('✅ 검색창 발견!');
    } catch (error) {
      console.error('❌ 검색창을 찾을 수 없습니다.');
      addErrorMessage('selector_not_found', 'input[name="q"] not found', {
        pageUrl: page.url(),
        availableSelectors: await page.evaluate(() => {
          return Array.from(document.querySelectorAll('input')).map(input => ({
            name: input.name,
            placeholder: input.placeholder,
            id: input.id,
            className: input.className
          }));
        })
      });
      throw error;
    }

    // 자연스러운 타이핑으로 검색어 입력
    console.log('⌨️ "자전거 자물쇠" 입력 중...');
    
    try {
      await page.click('input[name="q"]');
      await page.waitForTimeout(300);
      
      const keyword = "자전거 자물쇠";
      for (let char of keyword) {
        await page.keyboard.type(char);
        const delay = Math.floor(Math.random() * 101) + 100;
        await page.waitForTimeout(delay);
      }
      
      console.log('🔍 검색 실행...');
      await page.keyboard.press('Enter');
      
      // 검색 결과 로딩 대기
      await page.waitForTimeout(3000);
      
      logs.summary.pagesVisited.push({
        url: page.url(),
        timestamp: new Date().toISOString(),
        purpose: 'search_results'
      });
      
    } catch (error) {
      addErrorMessage('typing_failed', error.message, error.stack);
      throw error;
    }

    console.log('📸 스크린샷 저장 중...');
    await page.screenshot({ path: path.join(logDir, 'search_results.png') });

    // HAR 파일 생성 (CDP 명령어로 실제 HAR 생성)
    console.log('📊 HAR 파일 생성 중...');
    try {
      await page.context().tracing.start({ 
        screenshots: true, 
        snapshots: true,
        sources: true 
      });
      
      // 잠깐 기다린 후 추적 중지
      await page.waitForTimeout(2000);
      
      const tracePath = path.join(logDir, 'trace.zip');
      await page.context().tracing.stop({ 
        path: tracePath 
      });
      
      console.log('✅ 추적 파일 생성됨:', tracePath);
    } catch (harError) {
      console.warn('⚠️ HAR/Trace 파일 생성 실패:', harError.message);
      addErrorMessage('har_generation_failed', harError.message, harError.stack);
    }

    // 상품 수집 시작
    console.log('🎯 상품 수집 시작...');
    
    let allProducts = [];
    let scrollAttempts = 0;
    const maxAttempts = 5;
    
    while (scrollAttempts < maxAttempts) {
      scrollAttempts++;
      console.log(`📜 스크롤 시도 ${scrollAttempts}/${maxAttempts}`);
      
      try {
        const currentProducts = await page.evaluate(() => {
          const products = new Set();
          
          document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes('/products/')) {
              const match = href.match(/\/products\/(\d+)/);
              if (match && match[1]) {
                products.add(match[1]);
              }
            }
          });
          
          return Array.from(products);
        });
        
        const existingCount = allProducts.length;
        for (let product of currentProducts) {
          if (!allProducts.includes(product)) {
            allProducts.push(product);
          }
        }
        
        const newCount = allProducts.length - existingCount;
        console.log(`📦 현재 총 ${allProducts.length}개 (새로 ${newCount}개)`);
        
        logs.debug.push({
          category: 'product_collection',
          timestamp: new Date().toISOString(),
          attempt: scrollAttempts,
          totalProducts: allProducts.length,
          newProducts: newCount
        });
        
        // 타겟 상품 확인
        const targetIndex = allProducts.indexOf(targetProductId);
        if (targetIndex !== -1) {
          console.log(`🎯 타겟 상품 발견! 순위: ${targetIndex + 1}`);
          break;
        }
        
        // 더 많은 상품이 필요한 경우 스크롤
        if (scrollAttempts < maxAttempts) {
          await page.evaluate(() => {
            window.scrollBy(0, 800);
          });
          
          const delay = Math.floor(Math.random() * 1001) + 500;
          await page.waitForTimeout(delay);
          await page.waitForTimeout(2000);
        }
        
      } catch (error) {
        addErrorMessage('product_collection_error', error.message, {
          attempt: scrollAttempts,
          currentProductsCount: allProducts.length,
          stack: error.stack
        });
      }
    }

    // 최종 결과
    console.log(`🎯 최종 수집 결과: ${allProducts.length}개 상품`);
    
    const targetIndex = allProducts.indexOf(targetProductId);
    
    logs.summary.endTime = new Date().toISOString();
    logs.summary.status = 'completed';
    logs.summary.finalProductCount = allProducts.length;
    logs.summary.targetProductFound = targetIndex !== -1;
    logs.summary.targetProductRank = targetIndex !== -1 ? targetIndex + 1 : null;

    if (targetIndex !== -1) {
      const rank = targetIndex + 1;
      console.log(`🎉 SUCCESS! 상품번호 ${targetProductId}은 자전거 자물쇠 검색 결과에서 ${rank}위입니다!`);
    } else {
      console.log(`😔 상품번호 ${targetProductId}은 상위 ${allProducts.length}위 안에 없습니다.`);
    }
    
    // 상세 결과 출력
    console.log('\n📋 수집된 상품 목록 (처음 15개):');
    allProducts.slice(0, 15).forEach((productId, index) => {
      const marker = productId === targetProductId ? '🎯' : '📦';
      console.log(`  ${marker} ${index + 1}위: ${productId}`);
    });

    // 최종 스크린샷과 페이지 소스 저장
    await page.screenshot({ 
      path: path.join(logDir, 'final_page.png'),
      fullPage: true 
    });

    const pageSource = await page.content();
    fs.writeFileSync(path.join(logDir, 'page_source.html'), pageSource);

    // 로그 파일들 저장
    fs.writeFileSync(networkLogFile, JSON.stringify(logs.requests, null, 2));
    fs.writeFileSync(errorLogFile, JSON.stringify(logs.errors, null, 2));
    fs.writeFileSync(debugLogFile, JSON.stringify(logs.debug, null, 2));
    fs.writeFileSync(summaryLogFile, JSON.stringify(logs.summary, null, 2));
    
    // 결과 파일 저장
    const resultText = `상품번호 ${targetProductId} 검색 결과
순위: ${targetIndex !== -1 ? targetIndex + 1 : '상위 ' + allProducts.length + '위 안에 없음'}위
검색어: 자전거 자물쇠
수집 일시: ${new Date().toISOString()}
총 상품 수: ${allProducts.length}개

네트워크 요청 수: ${logs.summary.requests}개
에러 수: ${logs.summary.errors}개

상품 목록:
${allProducts.map((id, i) => `${i + 1}. ${id}`).join('\n')}`;

    fs.writeFileSync(path.join(logDir, 'coupang_search_result.txt'), resultText);
    
    console.log(`\n💾 모든 로그가 ${logDir} 디렉토리에 저장되었습니다:`);
    console.log(`📊 네트워크 로그: ${networkLogFile}`);
    console.log(`❌ 에러 로그: ${errorLogFile}`);
    console.log(`🐛 디버그 로그: ${debugLogFile}`);
    console.log(`📋 실행 요약: ${summaryLogFile}`);
    console.log(`📄 페이지 소스: ${path.join(logDir, 'page_source.html')}`);
    console.log(`🖼️ 스크린샷들: ${path.join(logDir, '*.png')}`);

  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error.message);
    
    // 실패 시에도 로그 저장
    logs.summary.endTime = new Date().toISOString();
    logs.summary.status = 'failed';
    logs.summary.error = error.message;
    
    addErrorMessage('execution_failed', error.message, error.stack);
    
    // 오류 스크린샷
    try {
      await page.screenshot({ path: path.join(logDir, 'error_screenshot.png') });
    } catch (screenshotError) {
      console.error('⚠️ 오류 스크린샷도 실패:', screenshotError.message);
    }
    
    // 모든 로그 저장
    fs.writeFileSync(networkLogFile, JSON.stringify(logs.requests, null, 2));
    fs.writeFileSync(errorLogFile, JSON.stringify(logs.errors, null, 2));
    fs.writeFileSync(debugLogFile, JSON.stringify(logs.debug, null, 2));
    fs.writeFileSync(summaryLogFile, JSON.stringify(logs.summary, null, 2));
    
    console.log(`\n💾 오류 로그들이 ${logDir} 디렉토리에 저장되었습니다.`);
  } finally {
    await browser.close();
    console.log('🏁 브라우저 종료 완료');
    
    // 결과 요약 출력
    console.log('\n📊 실행 결과 요약:');
    console.log(`   💻 페이지 접속: ${logs.summary.pagesVisited.length}개`);
    console.log(`   🌐 네트워크 요청: ${logs.summary.requests}개`);
    console.log(`   ❌ 에러 발생: ${logs.summary.errors}개`);
    console.log(`   📦 수집한 상품: ${logs.summary.finalProductCount || 0}개`);
    console.log(`   🎯 타겟 상품 발견: ${logs.summary.targetProductFound ? 'YES' : 'NO'}`);
    if (logs.summary.targetProductRank) {
      console.log(`   🏆 타겟 상품 순위: ${logs.summary.targetProductRank}위`);
    }
  }
}

// 실행
(async () => {
  try {
    await checkCoupangRankWithLogging();
    console.log('✅ 완전한 모니터링 스크립트 실행 완료!');
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
})();
