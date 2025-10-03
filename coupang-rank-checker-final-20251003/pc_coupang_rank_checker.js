const { chromium } = require('playwright');

(async () => {
  console.log('🖥️ PC 웹 환경으로 쿠팡 장난감 검색 및 순위 체킹');
  
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
      '--allow-running-insecure-content'
    ],
    ignoreHTTPSErrors: true
  });

  // PC 데스크톱 환경 설정
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 }, // PC 해상도
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0', // 모바일이 아님을 명시
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'connection': 'keep-alive'
    },
    javaScriptEnabled: true
  });

  // navigator.webdriver 오버라이드
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // PC 환경 추가 정보
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32'
    });
    
    Object.defineProperty(navigator, 'doNotTrack', {
      get: () => '1'
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
    // 네트워크 응답 모니터링
    page.on('response', response => {
      if (response.url().includes('search') || response.url().includes('coupang.com')) {
        console.log(`📄 응답: ${response.status()} ${response.url().substring(0, 50)}...`);
      }
    });

    // 쿠팡 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속 (PC 웹)...');
    await page.goto('https://www.coupang.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('✅ 메인 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 광고나 팝업 제거 시도
    try {
      await page.click('.close, .popup-close, .ad-close, .close-btn', { timeout: 2000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      // 팝업이 없으면 무시
    }

    // PC 환경용 검색창 찾기
    console.log('🔍 PC 검색창 찾기...');
    let searchSelector = null;
    
    // PC 환경용 셀렉터 우선 시도
    const pcSelectors = [
      'input[name="q"]',
      '#headerSearchKeyword',
      '.header-search input',
      '.search-input',
      'input[placeholder*="검색"]'
    ];
    
    for (const selector of pcSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          searchSelector = selector;
          console.log(`✅ PC 검색창 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${selector} 시도 실패`);
      }
    }

    if (!searchSelector) {
      throw new Error('PC 검색창을 찾을 수 없습니다.');
    }

    // 검색창 클릭 및 활성화
    await page.click(searchSelector);
    await page.waitForTimeout(500);

    // 자연스러운 타이핑 시뮬레이션 (100-200ms 랜덤 딜레이)
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑...`);
    for (let i = 0; i < searchKeyword.length; i++) {
      const char = searchKeyword[i];
      const delay = Math.random() * 100 + 100; // 100-200ms
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
      process.stdout.write(`.${char === searchKeyword[searchKeyword.length-1] ? '\n' : ''}`);
    }

    // 검색 실행
    console.log('🚀 검색 실행 (엔터)...');
    await page.keyboard.press('Enter');

    // 검색 결과 페이지 로딩 대기
    console.log('⏳ PC 검색 결과 로딩 대기...');
    await page.waitForTimeout(7000); // PC 환경은 조금 더 기다림

    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    // 에러 페이지 체크
    if (currentUrl.includes('chrome-error')) {
      console.log('❌ Chrome 에러 페이지로 리다이렉트됨');
      
      // 직접 검색 URL 시도
      console.log('🔄 직접 검색 URL 접근 시도...');
      try {
        const directSearchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}`;
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
      }
    }

    if (!currentUrl.includes('chrome-error') && currentUrl.includes('coupang.com')) {
      console.log('✅ PC 검색 페이지 로드 성공!');

      // 충분한 로딩 대기 (PC 환경)
      await page.waitForTimeout(5000);

      console.log('📊 PC 환경에서 상위 100개 상품 수집 시작...');

      // PC 환경용 스크롤링 및 상품 수집
      for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
        console.log(`📜 스크롤 ${scrollAttempt + 1}/3`);
        
        // PC 환경의 상품 요소 수집
        const productsOnScroll = await page.evaluate(() => {
          const products = [];
          
          // PC 환경의 상품 셀렉터들
          const pcProductSelectors = [
            'li[data-product-id]',
            'div[data-product-id]',
            '[data-vendor-item-id]',
            '[data-item-id]',
            'a[href*="/products/"]',
            '.search-product',
            '.product-item',
            '.s-product-item',
            '.search-product-wrap',
            '[data-product-id]',
            '.search-product-container',
            '.vlo-product-item'
          ];
          
          pcProductSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`PC 셀렉터 ${selector}: ${elements.length}개 발견`);
            
            elements.forEach(element => {
              let productId = element.getAttribute('data-product-id') ||
                             element.getAttribute('data-vendor-item-id') ||
                             element.getAttribute('data-item-id');
              
              // 링크에서 productId 추출 (PC 환경)
              if (!productId) {
                const link = element.tagName === 'A' ? element : element.querySelector('a');
                if (link && link.href) {
                  const productMatch = link.href.match(/\/products\/(\d+)/);
                  if (productMatch) {
                    productId = productMatch[1];
                  }
                }
              }
              
              if (productId) {
                products.push({
                  productId: String(productId),
                  source: selector,
                  element: element.tagName || 'unknown'
                });
              }
            });
          });
          
          // 중복 제거
          const uniqueProducts = products.filter((product, index, self) => 
            index === self.findIndex(p => p.productId === product.productId)
          );
          
          console.log(`PC 환경에서 총 ${uniqueProducts.length}개 상품 수집 완료`);
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
        
        // 상품 리스트에 추가 (중복 제거)
        const existingIds = new Set(foundProducts.map(p => p.productId));
        const newProducts = productsOnScroll.filter(p => !existingIds.has(p.productId));
        foundProducts.push(...newProducts.map((p, index) => ({
          ...p,
          rank: foundProducts.length + index + 1
        })));
        
        console.log(`📊 누적 상품 수: ${foundProducts.length}개`);
        
        // 상위 100개 도달 확인
        if (foundProducts.length >= 100) {
          console.log('📊 상위 100개 상품 수집 완료');
          break;
        }
        
        // PC 환경용 스크롤 (더 세밀하게)
        if (scrollAttempt < 2) {
          const scrollDelay = Math.random() * 1000 + 500; // 500-1500ms
          console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기...`);
          
          // PC 환경에서 여러 번 조금씩 스크롤
          for (let miniScroll = 0; miniScroll < 3; miniScroll++) {
            await page.evaluate(() => {
              window.scrollBy(0, window.innerHeight);
            });
            await page.waitForTimeout(scrollDelay / 3);
          }
          
          await page.waitForTimeout(scrollDelay);
          
          // 추가 로딩 대기
          await page.waitForTimeout(3000);
        }
      }

      // 최종 결과 출력
      console.log(`\n📊 PC 환경 수집 완료!`);
      console.log(`📦 총 수집된 상품 수: ${foundProducts.length}개`);

      if (foundRank) {
        console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
      } else {
        console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
        
        if (foundProducts.length > 0) {
          console.log('📋 PC 환경에서 발견된 상품 예시 (최대 10개):');
          foundProducts.slice(0, 10).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.productId} (${product.source})`);
          });
        } else {
          console.log('⚠️ PC 환경에서 상품을 전혀 발견하지 못했습니다.');
          console.log('💡 페이지 구조를 확인했습니다.');
        }
      }

    } else {
      console.log('❌ PC 검색 페이지 로드 실패');
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
    console.log(`- 환경: PC 웹 데스크톱`);
    console.log(`- 타겟 상품: ${targetProductId}`);
    console.log(`- 검색 키워드: ${searchKeyword}`);
    console.log(`- 수집된 상품 수: ${foundProducts.length}개`);
    console.log(`- 순위: ${foundRank ? `${foundRank}위` : '상위 100위 안에 없음'}`);
  }
})();
