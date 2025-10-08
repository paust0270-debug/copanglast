const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const logDir = `toy_search_logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.mkdirSync(logDir, { recursive: true });

  console.log('🚀 개선된 쿠팡 장난감 검색 시작');
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
    // 쿠팡 검색 결과 페이지로 직접 이동 (URL로 접근)
    console.log('🚀 쿠팡 검색 결과 페이지 직접 접속...');
    const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}`;
    console.log(`📍 검색 URL: ${searchUrl}`);
    
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    // 검색 결과 페이지 로딩 대기
    console.log('⏱️ 검색 결과 페이지 로딩 대기 중...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    // 스크린샷 저장 (디버깅용)
    await page.screenshot({ 
      path: path.join(logDir, 'search_page_loaded.png'),
      fullPage: true
    });

    console.log('📊 상위 100개 상품 수집 시작...');

    // 스크롤하며 상품 수집 (최대 3번의 스크롤)
    for (let scrollAttempt = 1; scrollAttempt <= 3; scrollAttempt++) {
      console.log(`📜 스크롤 시도 ${scrollAttempt}/3`);
      
      // 현재 페이지의 모든 상품 요소 수집
      const productsOnPage = await page.evaluate(() => {
        const products = [];
        
        // 쿠팡 검색 결과 페이지의 상품 셀렉터들
        const productSelectors = [
          'li[data-product-id]',
          '.search-product',
          'div[data-product-id]',
          '.s-product-item-container',
          '[data-vendor-item-id]',
          '[data-item-id]',
          '.product-item',
          'a[href*="products/"][href*="productId"]'
        ];
        
        console.log('상품 수집 시도 중...');
        
        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          console.log(`${selector}: ${elements.length}개 찾음`);
          
          elements.forEach((element, index) => {
            let productId = element.getAttribute('data-product-id') || 
                           element.getAttribute('data-item-id') ||
                           element.getAttribute('data-vendor-item-id');
            
            // URL에서 productId 추출 시도
            if (!productId) {
              const productLink = element.tagName === 'A' ? element : element.querySelector('a');
              if (productLink && productLink.href) {
                const urlMatch = productLink.href.match(/products\/(\d+)/) || 
                               productLink.href.match(/productId[=:](\d+)/);
                if (urlMatch) {
                  productId = urlMatch[1];
                }
              }
            }
            
            if (productId) {
              products.push({
                rank: products.length + 1,
                productId: String(productId),
                selector: selector,
                href: element.tagName === 'A' ? element.href : (element.querySelector('a')?.href || '')
              });
            }
          });
        }
        
        // href에서 productId 추출하는 추가 시도
        const allLinks = document.querySelectorAll('a[href*="products/"]');
        allLinks.forEach((link, index) => {
          const match = link.href.match(/products\/(\d+)/);
          if (match) {
            const productId = match[1];
            if (!products.some(p => p.productId === String(productId))) {
              products.push({
                rank: products.length + 1,
                productId: String(productId),
                selector: 'href-extraction',
                href: link.href
              });
            }
          }
        });
        
        return products;
      });
      
      console.log(`📦 ${productsOnPage.length}개 상품 발견`);
      
      // 타겟 상품 검색
      for (const product of productsOnPage) {
        if (product.productId === targetProductId) {
          foundRank = product.rank;
          console.log(`🎯 타겟 상품 발견! Product ID: ${product.productId}, Rank: ${product.rank}`);
          break;
        }
      }
      
      if (foundRank) break;
      
      // 이미 찾은 상품들과 합치기 (중복 제거)
      const existingIds = new Set(foundProducts.map(p => p.productId));
      const newProducts = productsOnPage.filter(p => !existingIds.has(p.productId));
      
      // 새 상품들의 순위를 전체 순위로 조정
      newProducts.forEach(product => {
        product.rank = foundProducts.length + newProducts.indexOf(product) + 1;
      });
      
      foundProducts.push(...newProducts);
      
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
          window.scrollBy(0, window.innerHeight * 2);
        });
        
        // 새로운 상품 로딩 대기
        await page.waitForTimeout(3000);
        
        // 스크롤 후 스크린샷 저장 (디버깅용)
        await page.screenshot({ 
          path: path.join(logDir, `after_scroll_${scrollAttempt}.png`),
          fullPage: true
        });
      }
    }

    // 최종 결과 출력
    console.log(`\n📊 수집 완료`);
    console.log(`📦 총 수집된 상품 수: ${foundProducts.length}개`);
    
    if (foundRank) {
      console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
    } else {
      console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
    }

    // 로그 파일에 저장
    fs.writeFileSync(
      path.join(logDir, 'found_products.json'),
      JSON.stringify(foundProducts, null, 2)
    );

    // 최종 스크린샷 저장
    await page.screenshot({ 
      path: path.join(logDir, 'final_search_results.png'),
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
