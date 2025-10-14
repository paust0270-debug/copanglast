const { chromium } = require('playwright');

(async () => {
  console.log('🔍 심화 순위 체킹 - 상위 1000개 상품까지 검색');
  
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
      console.log(`\n🔍 ${i + 1}/3 심화 검색 시작: "${test.keyword}" - 상품번호 ${test.productId}`);
      
      let foundRank = null;
      let allProducts = new Set(); // 중복 제거용 Set
      let totalProductsFound = 0;
      let scrollAttempt = 0;
      let noNewProductsCount = 0; // 새로운 상품이 없는 스크롤 횟수 추적
      const maxScrollAttempts = 50; // 최대 50번 스크롤 (더 많은 상품 로드)
      const maxNoNewProducts = 5; // 연속 5번 새로운 상품이 없으면 중단

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

        // 더 깊은 스크롤로 상품 수집 (최대 1000개까지)
        console.log(`📜 "${test.keyword}" 심화 스크롤 시작 - 최대 ${maxScrollAttempts}회 스크롤`);
        
        while (scrollAttempt < maxScrollAttempts && totalProductsFound < 1000) {
          const previousSetSize = allProducts.size;
          
          console.log(`📜 ${test.keyword} 스크롤 ${scrollAttempt + 1}/${maxScrollAttempts} (현재 상품 수: ${totalProductsFound}개)`);
          
          // 현재 스크롤 위치에서 상품 수집
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
              totalFound: products.length,
              pageHeight: document.body.scrollHeight,
              currentScroll: window.scrollY
            };
          }, test.productId);

          // 새로운 상품만 Set에 추가
          let newProductsCount = 0;
          productsThisScroll.products.forEach(product => {
            if (!allProducts.has(product.productId)) {
              allProducts.add(product.productId);
              newProductsCount++;
            }
          });
          
          totalProductsFound = allProducts.size;
          
          // 타겟 상품 재검색 (전체 Set에서 찾기)
          if (!foundRank && productsThisScroll.targetFound) {
            const allProductsSorted = Array.from(allProducts);
            foundRank = allProductsSorted.indexOf(test.productId) + 1;
            if (foundRank > 0) {
              console.log(`🎯 "${test.keyword}" 타겟 상품 발견! Product ID: ${test.productId}, Rank: ${foundRank}`);
            }
          }

          console.log(`📦 ${scrollAttempt + 1}번째 스크롤: ${productsThisScroll.totalFound}개 총 상품 중 ${newProductsCount}개 새로운 상품 발견`);
          console.log(`📊 누적 상품 수: ${totalProductsFound}개 / 목표: 1000개`);

          // 진행 상황 출력
          if (totalProductsFound >= 100) {
            console.log(`🎉 상위 ${totalProductsFound}개 상품 확인 완료!`);
            if (!foundRank && (totalProductsFound % 100 === 0 || totalProductsFound >= 500)) {
              console.log(`📈 현재까지 타겟 상품 찾지 못함 - 계속 검색 중...`);
            }
          }

          // 타겟 상품을 찾았거나 1000개에 도달했으면 중단
          if (foundRank || totalProductsFound >= 1000) {
            console.log(`🏁 검색 완료 조건 도달: ${foundRank ? `타겟 상품 발견 (${foundRank}위)` : '1000개 상품 수집 완료'}`);
            break;
          }

          // 새로운 상품이 없는지 확인
          if (newProductsCount === 0) {
            noNewProductsCount++;
            console.log(`⚠️ 새로운 상품 없음 (${noNewProductsCount}/${maxNoNewProducts})`);
            if (noNewProductsCount >= maxNoNewProducts) {
              console.log(`🛑 연속 ${maxNoNewProducts}번 새로운 상품이 없어 검색 중단`);
              break;
            }
          } else {
            noNewProductsCount = 0; // 새로운 상품이 있으면 카운터 리셋
          }

          // 더 많은 상품을 로드하기 위한 스크롤
          try {
            // 페이지 끝까지 점진적 스크롤
            const scrollDelay = Math.random() * 1500 + 1000; // 1000-2500ms 더 긴 대기
            console.log(`⏱️ 다음 스크롤 전 ${scrollDelay.toFixed(0)}ms 대기 (심화 검색용)`);
            
            // 다양한 스크롤 패턴 적용
            const scrollPatterns = [
              () => window.scrollBy(0, window.innerHeight * 3), // 더 큰 단위로 스크롤
              () => window.scrollTo(0, document.body.scrollHeight), // 페이지 끝까지
              () => window.scrollBy(0, window.innerHeight * 2), // 중간 정도 스크롤
              () => window.scrollTo(0, (window.scrollY + document.body.scrollHeight) / 2) // 절반 지점으로
            ];
            
            const scrollPattern = scrollPatterns[scrollAttempt % scrollPatterns.length];
            await page.evaluate(scrollPattern);
            await page.waitForTimeout(scrollDelay / 3);
            
            // 추가 스크롤로 더 많은 상품 로드 유도
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(scrollDelay / 3);
            
            // 새로운 콘텐츠 로딩 대기
            await page.waitForTimeout(scrollDelay / 3);
            
          } catch (scrollError) {
            console.log(`⚠️ 스크롤 오류: ${scrollError.message}`);
          }

          scrollAttempt++;
        }

        // 결과 저장
        const result = {
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: foundRank,
          totalProductsFound: totalProductsFound,
          scrollAttempts: scrollAttempt,
          status: foundRank ? 'FOUND' : 'NOT_FOUND_IN_1000'
        };
        
        results.push(result);

        if (foundRank) {
          console.log(`✅ "${test.keyword}" 최종 결과: ${foundRank}위`);
          console.log(`상품번호 ${test.productId}은 ${test.keyword} 검색 결과에서 ${foundRank}위입니다.`);
        } else if (totalProductsFound >= 1000) {
          console.log(`❌ "${test.keyword}" 결과: 상위 1000위 안에 없음`);
          console.log(`상품번호 ${test.productId}은 상위 1000위 안에 없습니다.`);
        } else {
          console.log(`⚠️ "${test.keyword}" 결과: ${totalProductsFound}개 상품 확인했지만 타겟 상품 없음`);
        }
        
        console.log(`📊 검색 통계: ${scrollAttempt}회 스크롤, ${totalProductsFound}개 상품 확인`);

        // 다음 검색을 위한 대기
        if (i < productTests.length - 1) {
          console.log(`⏳ 다음 검색을 위해 3초 대기...`);
          await page.waitForTimeout(3000);
        }

      } catch (searchError) {
        console.error(`❌ "${test.keyword}" 검색 중 오류: ${searchError.message}`);
        results.push({
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: null,
          totalProductsFound: 0,
          scrollAttempts: scrollAttempt,
          status: 'ERROR'
        });
      }
    }

  } catch (error) {
    console.error(`❌ 전체 실행 중 오류 발생: ${error.message}`);
  } finally {
    await browser.close();
    
    // 최종 결과 요약
    console.log('\n=== 📊 최종 심화 검색 결과 요약 ===');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. 키워드는 "${result.keyword}"`);
      console.log(`   상품번호: ${result.productId}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   상태: ${result.status}`);
      console.log(`   스크롤 횟수: ${result.scrollAttempts}회`);
      
      if (result.status === 'FOUND') {
        console.log(`   🎉 결과: 상품번호 ${result.productId}은 "${result.keyword}" 검색 결과에서 ${result.rank}위입니다.`);
      } else if (result.status === 'NOT_FOUND_IN_1000') {
        console.log(`   ❌ 결과: 상품번호 ${result.productId}은 상위 1000위 안에 없습니다.`);
      } else if (result.totalProductsFound > 1000) {
        console.log(`   📊 결과: ${result.totalProductsFound}개 상품 확인했지만 타겟 상품 없음`);
      } else {
        console.log(`   ⚠️ 결과: 검색 중 오류 발생`);
      }
      
      console.log(`   📦 총 확인된 상품 수: ${result.totalProductsFound}개`);
    });

    console.log('\n🏁 모든 심화 검색 완료! (상위 1000개까지)');
  }
})();
