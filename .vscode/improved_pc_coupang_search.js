const { chromium } = require('playwright');

(async () => {
  console.log('🖥️ 개선된 PC 환경 쿠팡 검색 및 순위 체킹');
  
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
      '--disable-http2',
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
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
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
  });

  const page = await context.newPage();

  const targetProductId = '8617045901';
  const searchKeyword = '장난감';
  let foundRank = null;
  let foundProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 쿠팡 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속...');
    await page.goto('https://www.coupang.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('✅ 메인 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 검색창 찾기 및 활성화
    console.log('🔍 PC 검색창 찾기...');
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
    }

    console.log('🚀 검색 실행...');
    await page.keyboard.press('Enter');

    // 검색 결과 페이지 대기 및 확인
    console.log('⏳ 검색 결과 페이지 로딩 대기...');
    await page.waitForTimeout(8000);

    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    // 페이지가 리다이렉트되었는지 확인
    if (currentUrl.includes('search') || currentUrl.includes('/np/search')) {
      console.log('✅ 검색 결과 페이지 접근 성공!');
      
      // 페이지 완전 로딩 대기
      await page.waitForTimeout(3000);

      // 상품 수집 시도 (단계별로 더 안전하게)
      console.log('📊 상품 수집 시작...');
      
      try {
        // 먼저 페이지 구조 파악
        const pageStructure = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            productContainers: document.querySelectorAll('[data-product-id], [data-vendor-item-id], [data-item-id]').length,
            productLinks: document.querySelectorAll('a[href*="/products/"]').length,
            searchResults: document.querySelectorAll('.search-product, .product-item, .s-product-item').length
          };
        });

        console.log('📄 페이지 구조:', pageStructure);

        if (pageStructure.productContainers > 0 || pageStructure.productLinks > 0) {
          console.log(`📦 검색 결과 발견: ${pageStructure.productContainers} 컨테이너, ${pageStructure.productLinks} 링크`);

          // 스크롤하며 상품 수집
          for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
            console.log(`📜 스크롤 ${scrollAttempt + 1}/3`);
            
            try {
              const productsOnScroll = await page.evaluate((scrollIndex) => {
                console.log(`스크롤 ${scrollIndex + 1}에서 상품 수집 시도...`);
                
                const products = [];
                const selectors = [
                  'li[data-product-id]',
                  'div[data-product-id]',
                  '[data-vendor-item-id]',
                  '[data-item-id]',
                  'a[href*="/products/"]'
                ];
                
                selectors.forEach(selector => {
                  const elements = document.querySelectorAll(selector);
                  console.log(`${selector}: ${elements.length}개`);
                  
                  elements.forEach(element => {
                    let productId = element.getAttribute('data-product-id') ||
                                   element.getAttribute('data-vendor-item-id') ||
                                   element.getAttribute('data-item-id');
                    
                    // 링크에서 productId 추출
                    if (!productId && element.tagName === 'A' && element.href.includes('/products/')) {
                      const match = element.href.match(/\/products\/(\d+)/);
                      if (match) productId = match[1];
                    } else if (!productId) {
                      const link = element.querySelector('a[href*="/products/"]');
                      if (link) {
                        const match = link.href.match(/\/products\/(\d+)/);
                        if (match) productId = match[1];
                      }
                    }
                    
                    if (productId) {
                      products.push({
                        productId: String(productId)
                      });
                    }
                  });
                });
                
                // 중복 제거
                const uniqueProducts = [];
                const seenIds = new Set();
                
                products.forEach(product => {
                  if (!seenIds.has(product.productId)) {
                    seenIds.add(product.productId);
                    uniqueProducts.push({
                      ...product,
                      rank: uniqueProducts.length + 1
                    });
                  }
                });
                
                console.log(`${scrollIndex + 1}번째 스크롤에서 ${uniqueProducts.length}개 상품 수집 완료`);
                return uniqueProducts;
              }, scrollAttempt);

              console.log(`📦 현재 스크롤에서 ${productsOnScroll.length}개 상품 발견`);
              
              if (productsOnScroll.length > 0) {
                // 타겟 상품 검색
                const targetFound = productsOnScroll.find(product => product.productId === targetProductId);
                if (targetFound) {
                  foundRank = targetFound.rank;
                  console.log(`🎯 타겟 상품 발견! Product ID: ${targetFound.productId}, Rank: ${foundRank}`);
                }

                // 전체 리스트에 추가 (중복 제거)
                const existingIds = new Set(foundProducts.map(p => p.productId));
                const newProducts = productsOnScroll.filter(p => !existingIds.has(p.productId));
                foundProducts.push(...newProducts.map((p, index) => ({
                  ...p,
                  rank: foundProducts.length + index + 1
                })));
              }

            } catch (evalError) {
              console.log(`⚠️ 스크롤 ${scrollAttempt + 1}에서 평가 오류:`, evalError.message);
              // 페이지가 리다이렉트되었을 수 있음
              await page.waitForTimeout(2000);
            }

            if (foundRank) break;

            // 다음 스크롤 시도
            if (scrollAttempt < 2 && foundProducts.length < 100) {
              try {
                await page.evaluate(() => {
                  window.scrollBy(0, window.innerHeight * 2);
                });
                await page.waitForTimeout(2000);
                
                // 추가 스크롤
                await page.evaluate(() => {
                  window.scrollTo(0, document.body.scrollHeight);
                });
                await page.waitForTimeout(3000);
                
              } catch (scrollError) {
                console.log('⚠️ 스크롤 오류:', scrollError.message);
              }
            }
          }

          // 최종 결과
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
            }
          }

        } else {
          console.log('⚠️ 검색 결과 페이지에서 상품을 찾을 수 없습니다.');
          console.log('페이지 구조:', pageStructure);
        }

      } catch (collectionError) {
        console.error('상품 수집 중 오류:', collectionError.message);
      }

    } else {
      console.log('❌ 검색 결과 페이지로 이동하지 않았습니다.');
      console.log('현재 URL이 예상과 다릅니다.');
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
