const { chromium } = require('playwright');

(async () => {
  console.log('🚀 HTTP/2 문제 해결된 최종 쿠팡 순위 체커');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-logging',
      '--disable-gpu',
      '--disable-http2', // HTTP/2 강제 비활성화
      '--enable-http1',
      '--force-http1',
      '--disable-quic',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-component-extensions-with-background-pages',
      '--disable-extensions-except',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling'
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
      'accept-encoding': 'gzip, deflate', // br 제거 (HTTP2 관련)
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'connection': 'keep-alive' // HTTP/1.1 지속 연결
    },
    javaScriptEnabled: true
  });

  // navigator.webdriver 오버라이드
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // 추가 보안 우회 코드
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    Object.defineProperty(navigATOR, 'languages', {
      get: () => ['ko-KR', 'ko', 'en-US', 'en']
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
    // 네트워크 활성도 모니터링
    page.on('response', response => {
      if (response.url().includes('search')) {
        console.log(`📄 응답: ${response.status()} ${response.url()}`);
      }
    });

    // 쿠팡 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속...');
    await page.goto('https://www.coupang.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('✅ 메인 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 쿠팡 광고나 팝업 제거 시도
    try {
      await page.click('.close, .popup-close, .ad-close', { timeout: 2000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      // 팝업이 없으면 무시
    }

    // 검색창 찾기 및 활성화
    console.log('🔍 검색창 찾기...');
    const searchInput = await page.waitForSelector('input[name="q"]', { timeout: 10000 });
    await searchInput.click();
    await page.waitForTimeout(500);

    // 자연스러운 타이핑 시뮬레이션
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑...`);
    for (let i = 0; i < searchKeyword.length; i++) {
      const char = searchKeyword[i];
      const delay = Math.random() * 100 + 100; // 100-200ms
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
      process.stdout.write('.');
    }
    console.log(' ✅');

    // 검색 실행
    console.log('🚀 검색 실행...');
    await page.keyboard.press('Enter');

    // 검색 결과 페이지 로딩 대기
    console.log('⏳ 검색 결과 로딩 대기...');
    await page.waitForTimeout(5000);

    // 페이지 리다이렉션 확인
    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    if (currentUrl.includes('chrome-error')) {
      console.log('❌ Chrome 에러 페이지로 리다이렉트됨');
      
      // 직접 검색 URL 시도
      console.log('🔄 직접 검색 URL 접근 시도...');
      const directSearchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}`;
      
      try {
        await page.goto(directSearchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        const newUrl = page.url();
        console.log(`📍 새 URL: ${newUrl}`);
        
        if (!newUrl.includes('chrome-error')) {
          currentUrl = newUrl;
        }
      } catch (directError) {
        console.log('❌ 직접 URL 접근도 실패:', directError.message);
      });
    }

    if (!currentUrl.includes('chrome-error') && currentUrl.includes('coupang.com')) {
      console.log('✅ 검색 페이지 로드 성공!');

      // 충분한 로딩 대기
      await page.waitForTimeout(5000);

      console.log('📊 상위 100개 상품 수집 시작...');

      // 페이지 스크롤 및 상품 수집 (최대 3번 스크롤)
      for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
        console.log(`📜 스크롤 ${scrollAttempt + 1}/3`);
        
        // 현재 페이지의 모든 상품 수집
        const productsOnScroll = await page.evaluate(() => {
          const products = [];
          
          // 모든 가능한 상품 셀렉터
          const productSelectors = [
            'li[data-product-id]',
            'div[data-product-id]',
            '[data-vendor-item-id]',
            '[data-item-id]',
            'a[href*="/products/"]',
            '.search-product',
            '.product-item',
            '.s-product-item'
          ];
          
          productSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              let productId = element.getAttribute('data-product-id') ||
                             element.getAttribute('data-vendor-item-id') ||
                             element.getAttribute('data-item-id');
              
              // 링크에서 productId 추출
              if (!productId) {
                const link = element.tagName === 'A' ? element : element.querySelector('a');
                if (link && link.href) {
                  const productMatch = link.href.match(/\/products\/(\d+)/);
                  if (productMatch) productId = productMatch[1];
                }
              }
              
              if (productId) {
                products.push({
                  productId: String(productId),
                  source: selector
                });
              }
            });
          });
          
          // 중복 제거
          const uniqueProducts = products.filter((product, index, self) => 
            index === self.findIndex(p => p.productId === product.productId)
          );
          
          return uniqueProducts;
        });
        
        console.log(`📦 현재 스크롤에서 ${productsOnScroll.length}개 상품 발견`);
        
        // 타겟 상품 검색
        for (const product of productsOnScroll) {
          if (product.productId === targetProductId) {
            foundRank = foundProducts.length + productsOnScroll.indexOf(product) + 1;
            console.log(`🎯 타겟 상품 발견! Product ID: ${product.productId}`);
            break;
          }
        }
        
        if (foundRank) break;
        
        // 상품 리스트에 추가
        const existingIds = new Set(foundProducts.map(p => p.productId));
        const newProducts = productsOnScroll.filter(p => !existingIds.has(p.productId));
        foundProducts.push(...newProducts);
        
        console.log(`📊 누적 상품 수: ${foundProducts.length}개`);
        
        // 상위 100개 도달 확인
        if (foundProducts.length >= 100) {
          console.log('📊 상위 100개 상품 수집 완료');
          break;
        }
        
        // 다음 스크롤
        if (scrollAttempt < 2) {
          const scrollDelay = Math.random() * 1000 + 500; // 500-1500ms
          console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기...`);
          
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          
          await page.waitForTimeout(scrollDelay);
          
          // 추가 스크롤 시도 (더 아래로)
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 2);
          });
          
          await page.waitForTimeout(3000); // 새 콘텐츠 로딩 대기
        }
      }

      // 최종 결과 출력
      console.log(`\n📊 수집 완료!`);
      console.log(`📦 총 수집된 상품 수: ${foundProducts.length}개`);

      if (foundRank) {
        console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
      } else {
        console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
        
        if (foundProducts.length > 0) {
          console.log('📋 발견된 상품 예시 (최대 10개):');
          foundProducts.slice(0, 10).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.productId}`);
          });
        } else {
          console.log('⚠️ 상품을 전혀 발견하지 못했습니다.');
        }
      }

    } else {
      console.log('❌ 검색 페이지 로드 실패');
      console.log(`상품번호 ${targetProductId}은 상위 100위 안에 없음`);
    }

  } catch (error) {
    console.error(`❌ 실행 중 오류 발생: ${error.message}`);
    console.log(`상품번호 ${targetProductId}은 상위 100위 안에 없음`);
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
    
    // 최종 요약
    console.log('\n📊 최종 결과 요약:');
    console.log(`- 타겟 상품: ${targetProductId}`);
    console.log(`- 검색 키워드: ${searchKeyword}`);
    console.log(`- 수집된 상품 수: ${foundProducts.length}개`);
    console.log(`- 순위: ${foundRank ? `${foundRank}위` : '상위 100위 안에 없음'}`);
  }
})();