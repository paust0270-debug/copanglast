const { chromium } = require('playwright');

(async () => {
  console.log('🔍 여러 상품 순위 체킹 시작');
  
  // 여러 상품 정보 정의
  const productTests = [
    {
      keyword: '자전거 자물쇠',
      productId: '8471564474',
      url: 'https://www.coupang.com/vp/products/8471564474?itemId=24511066972'
    },
    {
      keyword: '나무도마',
      productId: '8961322657',
      url: 'https://www.coupang.com/vp/products/8961322657?itemId=26221589138'
    },
    {
      keyword: '대나무도마',
      productId: '8961322657',
      url: 'https://www.coupang.com/vp/products/8961322657?itemId=26221589138'
    }
  ];

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

  const results = [];

  try {
    // 각 상품별로 순위 체킹
    for (let i = 0; i < productTests.length; i++) {
      const test = productTests[i];
      console.log(`\n🔍 ${i + 1}/3 검색 시작: "${test.keyword}" - 상품번호 ${test.productId}`);
      
      let foundRank = null;
      let allProducts = [];

      try {
        // 검색 URL 생성
        const searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}`;
        console.log(`🌐 검색 URL: ${searchUrl}`);
        
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        console.log(`✅ "${test.keyword}" 검색 페이지 로드 완료`);
        await page.waitForTimeout(3000);

        // 스크롤하며 상품 수집
        for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
          console.log(`📜 ${test.keyword} 스크롤 ${scrollAttempt + 1}/3`);
          
          const productsThisScroll = await page.evaluate((targetProductId) => {
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
            const targetProduct = products.find(product => product.productId === targetProductId);
            
            return {
              products: products,
              targetFound: targetProduct,
              targetRank: targetProduct ? targetProduct.rank : null,
              totalFound: products.length
            };
          }, test.productId);

          console.log(`📦 ${scrollAttempt + 1}번째 스크롤에서 ${productsThisScroll.totalFound}개 상품 발견`);

          // 타겟 상품 검색
          if (productsThisScroll.targetFound) {
            foundRank = productsThisScroll.targetRank;
            console.log(`🎯 "${test.keyword}" 타겟 상품 발견! Product ID: ${test.productId}, Rank: ${foundRank}`);
            allProducts = productsThisScroll.products;
            break;
          }

          // 상품 리스트 업데이트 (중복 제거)
          const existingIds = new Set(allProducts.map(p => p.productId));
          const newProducts = productsThisScroll.products.filter(p => !existingIds.has(p.productId));
          allProducts.push(...newProducts);

          if (allProducts.length >= 100) {
            console.log('📊 상위 100개 상품 수집 완료');
            const finalTarget = allProducts.find(p => p.productId === test.productId);
            if (finalTarget) {
              foundRank = finalTarget.rank;
              console.log(`🎯 "${test.keyword}" 최종 타겟 상품 발견! Rank: ${foundRank}`);
            }
            break;
          }

          // 다음 스크롤
          if (scrollAttempt < 2) {
            const scrollDelay = Math.random() * 1000 + 500;
            console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기...`);
            
            try {
              await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight * 2);
              });
              await page.waitForTimeout(scrollDelay / 2);
              
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
              });
              await page.waitForTimeout(scrollDelay / 2);
              
              await page.waitForTimeout(3000);
              
            } catch (scrollError) {
              console.log(`⚠️ 스크롤 오류: ${scrollError.message}`);
            }
          }
        }

        // 결과 저장
        const result = {
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: foundRank,
          totalProductsFound: allProducts.length,
          status: foundRank ? 'FOUND' : 'NOT_FOUND'
        };
        
        results.push(result);

        if (foundRank) {
          console.log(`✅ "${test.keyword}" 결과: ${foundRank}위`);
        } else {
          console.log(`❌ "${test.keyword}" 결과: 상위 100위 안에 없음 (${allProducts.length}개 상품 확인)`);
        }

        // 다음 검색을 위한 대기
        if (i < productTests.length - 1) {
          console.log(`⏳ 다음 검색을 위해 2초 대기...`);
          await page.waitForTimeout(2000);
        }

      } catch (searchError) {
        console.error(`❌ "${test.keyword}" 검색 중 오류: ${searchError.message}`);
        results.push({
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: null,
          totalProductsFound: 0,
          status: 'ERROR'
        });
      }
    }

  } catch (error) {
    console.error(`❌ 전체 실행 중 오류 발생: ${error.message}`);
  } finally {
    await browser.close();
    
    // 최종 결과 요약
    console.log('\n=== 📊 최종 결과 요약 ===');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. 키워드: "${result.keyword}"`);
      console.log(`   상품번호: ${result.productId}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   상태: ${result.status}`);
      
      if (result.status === 'FOUND') {
        console.log(`   🎉 결과: 상품번호 ${result.productId}은 "${result.keyword}" 검색 결과에서 ${result.rank}위입니다.`);
      } else if (result.status === 'NOT_FOUND') {
        console.log(`   ❌ 결과: 상품번호 ${result.productId}은 상위 100위 안에 없음`);
      } else {
        console.log(`   ⚠️ 결과: 검색 중 오류 발생`);
      }
      
      if (result.totalProductsFound > 0) {
        console.log(`   📦 확인된 상품 수: ${result.totalProductsFound}개`);
      }
    });

    console.log('\n🏁 모든 검색 완료!');
  }
})();
