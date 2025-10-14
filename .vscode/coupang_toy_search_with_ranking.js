const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const logDir = `toy_search_logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.mkdirSync(logDir, { recursive: true });

  const networkLogs = [];
  const productLogs = [];

  console.log('🚀 완벽한 모바일 헤더로 쿠팡 장난감 검색 시작');
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

  // 완벽한 모바일 Chrome 140 환경 시뮬레이션
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    viewport: { width: 375, height: 667 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept': '*/*',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'cache-control': 'no-cache',
      'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
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

  const targetProductId = '8617045901';
  const searchKeyword = '장난감';
  let foundRank = null;
  let foundProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

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
    
    let searchSelector = '#headerSearchKeyword';
    
    try {
      await page.waitForSelector(searchSelector, { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ 기본 검색창을 찾을 수 없음, 대체 셀렉터 시도...');
      
      // 더 많은 대체 셀렉터 시도
      const alternativeSelectors = [
        'input[name="q"]',
        'input[type="search"]',
        '.search-input',
        '[placeholder*="검색"]',
        'input[title*="검색"]'
      ];
      
      let found = false;
      for (const selector of alternativeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          searchSelector = selector;
          found = true;
          console.log(`✅ 검색창 발견: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ ${selector} 시도 실패`);
        }
      }
      
      if (!found) {
        throw new Error('검색창을 찾을 수 없습니다.');
      }
    }
    
    await page.click(searchSelector);
    console.log('✅ 검색창 클릭 완료');

    // 자연스러운 타이핑 시뮬레이션
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑 중...`);
    
    for (let i = 0; i < searchKeyword.length; i++) {
      const char = searchKeyword[i];
      const delay = Math.random() * 100 + 100; // 100-200ms 랜덤 딜레이
      
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
      
      console.log(`📝 타이핑: "${char}" (${delay.toFixed(0)}ms 지연)`);
    }

    // 검색 실행
    console.log('🚀 엔터 키로 검색 실행...');
    await page.keyboard.press('Enter');

    // 검색 결과 페이지 로딩 대기
    console.log('⏱️ 검색 결과 페이지 로딩 대기 중...');
    await page.waitForTimeout(5000);

    // 검색 결과 페이지 확인
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    if (currentUrl.includes('/search') || currentUrl.includes('/np/search')) {
      console.log('✅ 검색 결과 페이지 확인됨');
    } else {
      console.log('⚠️ 검색 결과 페이지가 아닐 수 있습니다. 계속 진행...');
    }

    console.log('📊 상위 100개 상품 수집 시작...');

    // 스크롤하며 상품 수집
    let currentRank = 0;
    for (let scrollAttempt = 1; scrollAttempt <= 3; scrollAttempt++) {
      console.log(`📜 스크롤 시도 ${scrollAttempt}/3`);
      
      // 현재 페이지의 모든 상품 요소 수집
      const productsOnPage = await page.evaluate(() => {
        const products = [];
        
        // 다양한 셀렉터로 상품 찾기
        const productSelectors = [
          '[data-product-id]',
          '.search-product',
          '.product-item',
          '[data-vendor-item-id]',
          '.s-product-item',
          '[data-item-id]'
        ];
        
        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element, index) => {
            const productId = element.getAttribute('data-product-id') || 
                            element.getAttribute('data-item-id') ||
                            element.getAttribute('data-vendor-item-id');
            
            // URL에서 productId 추출 시도
            const productLink = element.querySelector('a');
            let urlProductId = null;
            
            if (productLink && productLink.href) {
              const urlMatch = productLink.href.match(/productId[=:](\d+)/);
              if (urlMatch) {
                urlProductId = urlMatch[1];
              }
            }
            
            const finalProductId = productId || urlProductId;
            
            if (finalProductId) {
              products.push({
                rank: products.length + 1,
                productId: finalProductId,
                element: element.outerHTML.substring(0, 200), // 처음 200자만 저장
                source: selector
              });
            }
          });
        }
        
        return products;
      });
      
      console.log(`📦 ${productsOnPage.length}개 상품 발견`);
      
      // 이미 찾은 상품이 있다면 중복 제거
      const newProducts = productsOnPage.filter(p => 
        !foundProducts.some(fp => fp.productId === p.productId)
      );
      
      foundProducts.push(...foundProducts.map(p => ({
        ...p,
        rank: foundProducts.length + 1
      })));
      
      // 타겟 상품 검색
      for (const product of newProducts) {
        if (product.productId === targetProductId) {
          foundRank = foundProducts.length + newProducts.indexOf(product) + 1;
          console.log(`🎯 타겟 상품 발견! Product ID: ${product.productId}`);
          break;
        }
      }
      
      if (foundRank) break;
      
      // 상위 100개에 도달했는지 확인
      if (foundProducts.length >= 100) {
        console.log('📊 상위 100개 상품 수집 완료');
        break;
      }
      
      // 다음 스크롤 전 대기
      if (scrollAttempt < 3) {
        const scrollDelay = Math.random() * 1000 + 500; // 500-1500ms
        console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기...`);
        await page.waitForTimeout(scrollDelay);
        
        // 페이지 하단으로 스크롤
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        
        // 새로운 상품 로딩 대기
        await page.waitForTimeout(2000);
      }
    }

    // 최종 결과 출력
    console.log(`\n📊 수집 완료`);
    console.log(`📦 총 수집된 상품 수: ${foundProducts.length}개`);
    
    if (foundRank) {
      console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
      
      // 상품 정보 상세 출력
      const foundProduct = foundProducts.find(p => p.productId === targetProductId);
      if (foundProduct) {
        console.log(`📋 상품 정보:`, foundProduct);
      }
    } else {
      console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
    }

    // 로그 파일에 저장
    fs.writeFileSync(
      path.join(logDir, 'found_products.json'),
      JSON.stringify(foundProducts, null, 2)
    );

    // 스크린샷 저장
    await page.screenshot({ 
      path: path.join(logDir, 'search_results.png'),
      fullPage: true
    });

  } catch (error) {
    console.error(`❌ 실행 중 오류 발생: ${error.message}`);
    console.log(`🔍 에러 스택:`, error.stack);
    
    // 에러 스크린샷 저장
    try {
      await page.screenshot({ 
        path: path.join(logDir, 'error_screenshot.png'),
        fullPage: true
      });
    } catch (screenshotError) {
      console.log('⚠️ 스크린샷 저장도 실패:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
    
    // 최종 요약
    console.log('\n📊 최종 결과 요약:');
    console.log(`- 타겟 상품: ${targetProductId}`);
    console.log(`- 검색 키워드: ${searchKeyword}`);
    console.log(`- 수집된 상품 수: ${foundProducts.length}개`);
    console.log(`- 순위: ${foundRank ? `${foundRank}위` : '상위 100위 안에 없음'}`);
    console.log(`📁 로그 저장 위치: ${logDir}`);
  }
})();
