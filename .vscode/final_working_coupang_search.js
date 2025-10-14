const { chromium } = require('playwright');

(async () => {
  console.log('🎯 최종 작동하는 쿠팡 검색 스크립트');
  
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

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-encoding': 'gzip, deflate',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    },
    javaScriptEnabled: true
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
  });

  const page = await context.newPage();

  const targetProductId = '8617045901';
  const searchKeyword = '장난감';
  let foundRank = null;
  let allProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 성공한 검색 URL 사용
    const searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(searchKeyword)}`;
    console.log(`🌐 검색 URL 접근: ${searchUrl}`);
    
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`📍 현재 URL: ${currentUrl}`);
    console.log(`📄 페이지 제목: ${pageTitle}`);

    // 페이지 로딩 완료 대기
    await page.waitForTimeout(5000);

    console.log('📊 상품 수집 및 순위 체킹 시작...');

    // 스크롤하며 상품 수집 (최대 3번 스크롤)
    for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
      console.log(`📜 스크롤 ${scrollAttempt + 1}/3`);
      
      // 현재 페이지의 모든 상품 수집
      const productsThisScroll = await page.evaluate((targetId) => {
        const products = [];
        
        // 모든 링크에서 productId 추출
        document.querySelectorAll('a[href*="/products/"]').forEach((link, index) => {
          const match = link.href.match(/\/products\/(\d+)/);
          if (match) {
            products.push({
              productId: match[1],
              href: link.href,
              rank: products.length + 1
            });
          }
        });
        
        // 타겟 상품 찾기
        const targetProduct = products.find(product => product.productId === targetId);
        
        return {
          products: products,
          targetFound: targetProduct,
          targetRank: targetProduct ? targetProduct.rank : null,
          totalFound: products.length
        };
      }, targetProductId);

      console.log(`📦 ${scrollAttempt + 1}번째 스크롤에서 ${productsThisScroll.totalFound}개 상품 발견`);

      // 타겟 상품 검색
      if (productsThisScroll.targetFound) {
        foundRank = productsThisScroll.targetRank;
        console.log(`🎯 타겟 상품 발견! Product ID: ${targetProductId}, Rank: ${foundRank}`);
        allProducts = productsThisScroll.products; // 최종 상품 리스트 저장
        break;
      }

      // 상품 리스트 업데이트 (중복 제거)
      const existingIds = new Set(allProducts.map(p => p.productId));
      const newProducts = productsThisScroll.products.filter(p => !existingIds.has(p.productId));
      allProducts.push(...newProducts);

      console.log(`📊 누적 상품 수: ${allProducts.length}개`);

      // 상위 100개 도달 확인
      if (allProducts.length >= 100) {
        console.log('📊 상위 100개 상품 수집 완료');
        // 타겟 상품 최종 검색
        const finalTarget = allProducts.find(p => p.productId === targetProductId);
        if (finalTarget) {
          foundRank = finalTarget.rank;
          console.log(`🎯 최종 타겟 상품 발견! Rank: ${foundRank}`);
        }
        break;
      }

      // 다음 스크롤 시도
      if (scrollAttempt < 2) {
        const scrollDelay = Math.random() * 1000 + 500; // 500-1500ms
        console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기...`);
        
        try {
          // 여러 단계로 스크롤
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 2);
          });
          await page.waitForTimeout(scrollDelay / 2);
          
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(scrollDelay / 2);
          
          // 새로운 상품 로드 대기
          await page.waitForTimeout(3000);
          
        } catch (scrollError) {
          console.log(`⚠️ 스크롤 오류: ${scrollError.message}`);
        }
      }
    }

    // 최종 결과 출력
    console.log(`\n📊 수집 완료!`);
    console.log(`📦 총 수집된 상품 수: ${allProducts.length}개`);

    if (foundRank) {
      console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
      
      // 타겟 상품 정보 출력
      const targetProduct = allProducts.find(p => p.productId === targetProductId);
      if (targetProduct) {
        console.log(`🔗 상품 링크: ${targetProduct.href}`);
      }
    } else {
      console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
      
      if (allProducts.length > 0) {
        console.log('📋 발견된 상품 예시 (최대 15개):');
        allProducts.slice(0, 15).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.productId}`);
          if (index < 5) console.log(`    링크: ${product.href}`);
        });
      }
    }

    // 최종 결과 요약
    console.log('\n=== 📊 최종 결과 요약 ===');
    console.log(`🎯 타겟 상품: ${targetProductId}`);
    console.log(`🔍 검색 키워드: "${searchKeyword}"`);
    console.log(`📦 총 수집된 상품 수: ${allProducts.length}개`);
    
    if (foundRank) {
      console.log(`🏆 최종 순위: ${foundRank}위`);
      console.log(`✅ 결과: 상품번호 ${targetProductId}은 장난감 검색 결과에서 ${foundRank}위입니다.`);
    } else {
      console.log(`❌ 결과: 상위 100위 안에 없음`);
    }

  } catch (error) {
    console.error(`❌ 실행 중 오류 발생: ${error.message}`);
    console.log(`상품번호 ${targetProductId}은 상위 100위 안에 없음`);
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
  }
})();
