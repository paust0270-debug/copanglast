const { chromium } = require('playwright');

(async () => {
  console.log('🔍 페이지네이션 방식으로 심화 순위 체킹');
  
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
    for (let i = 0; i < productTests.length; i++) {
      const test = productTests[i];
      console.log(`\n🔍 ${i + 1}/3 페이지네이션 검색 시작: "${test.keyword}" - 상품번호 ${test.productId}`);
      
      let foundRank = null;
      let allProducts = new Set();
      let totalProductsFound = 0;
      let pageNumber = 1;
      const maxPages = 10; // 최대 10페이지까지

      try {
        while (pageNumber <= maxPages && totalProductsFound < 1000) {
          console.log(`📖 "${test.keyword}" 페이지 ${pageNumber}/${maxPages} 검색 중...`);
          
          // 페이지별 URL 생성
          let searchUrl;
          if (pageNumber === 1) {
            searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}`;
          } else {
            // 페이지 번호를 포함한 URL 시도
            searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}&page=${pageNumber}`;
          }
          
          console.log(`🌐 페이지 URL: ${searchUrl}`);
          
          const response = await page.goto(searchUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });

          const currentUrl = page.url();
          console.log(`📍 실제 로드된 URL: ${currentUrl}`);

          if (response.status() === 200 && !currentUrl.includes('chrome-error')) {
            await page.waitForTimeout(3000);
            
            // 페이지에서 상품 수집
            const productsThisPage = await page.evaluate((targetProductId) => {
              const products = [];
              
              // 여러 선택자로 상품 링크 찾기
              const selectors = [
                'a[href*="/products/"]',
                'a[href*="/vp/products/"]',
                '[data-product-id] a',
                '[data-vendor-item-id] a',
                '.search-product a',
                '.product-item a'
              ];
              
              selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach((link, index) => {
                  const href = link.href || link.getAttribute('href');
                  if (href && href.includes('/products/')) {
                    const match = href.match(/\/(?:vp\/)?products\/(\d+)/);
                    if (match) {
                      products.push({
                        productId: match[1],
                        href: href,
                        rank: products.length + 1,
                        selector: selector
                      });
                    }
                  }
                });
              });
              
              // 타겟 상품 찾기
              const targetProduct = products.find(product => product.productId === targetProductId);
              
              return {
                products: products,
                targetFound: targetProduct,
                targetRank: targetProduct ? targetProduct.rank : null,
                totalFound: products.length,
                pageTitle: document.title
              };
            }, test.productId);

            // 새로운 상품만 추가
            let newProductsCount = 0;
            productsThisPage.products.forEach(product => {
              if (!allProducts.has(product.productId)) {
                allProducts.add(product.productId);
                newProductsCount++;
              }
            });
            
            totalProductsFound = allProducts.size;
            
            // 타겟 상품 재검색
            if (!foundRank && productsThisPage.products.some(p => p.productId === test.productId)) {
              const rankInThisPage = productsThisPage.products.findIndex(p => p.productId === test.productId) + 1;
              const rankInOverall = Array.from(allProducts).indexOf(test.productId) + 1;
              foundRank = rankInOverall;
              console.log(`🎯 "${test.keyword}" 페이지 ${pageNumber}에서 타겟 상품 발견! Product ID: ${test.productId}, 전체 순위: ${foundRank}`);
              break; // 찾았으므로 중단
            }

            console.log(`📦 페이지 ${pageNumber}: ${productsThisPage.totalFound}개 상품 중 ${newProductsCount}개 새로운 상품`);
            console.log(`📊 누적 상품 수: ${totalProductsFound}개`);

            // 더 이상 새로운 상품이 없으면 다음 페이지 탐색
            if (newProductsCount === 0) {
              console.log(`⚠️ 페이지 ${pageNumber}에 새로운 상품 없음 - 다음 페이지로 이동`);
              
              // 다음 페이지 버튼 찾기
              const nextPageButton = await page.$('.s-search-pagination-next, .pagination-next, [aria-label=\"다음 페이지\"]');
              if (nextPageButton) {
                console.log(`🔄 다음 페이지 버튼 클릭`);
                await nextPageButton.click();
                await page.waitForTimeout(3000);
              } else {
                console.log(`🛑 다음 페이지 버튼을 찾을 수 없어 검색 중단`);
                break;
              }
            } else {
              // 다음 페이지로 수동 이동 시도
              pageNumber++;
              
              // 수동으로 URL 변경 시도
              try {
                const nextPageUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}&page=${pageNumber}`;
                console.log(`⬇️ 수동으로 페이지 ${pageNumber}로 이동 시도: ${nextPageUrl}`);
                
                await page.goto(nextPageUrl, {
                  waitUntil: 'domcontentloaded',
                  timeout: 10000
                });
                await page.waitForTimeout(2000);
              } catch (pageError) {
                console.log(`❌ 페이지 ${pageNumber} 이동 실패: ${pageError.message}`);
                break;
              }
            }
          } else {
            console.log(`❌ 페이지 ${pageNumber} 로드 실패 (상태: ${response.status()})`);
            break;
          }
          
          if (totalProductsFound >= 1000) {
            console.log(`🏁 1000개 상품 도달로 검색 중단`);
            break;
          }
        }

        // 최종 순위 재계산
        if (!foundRank && allProducts.has(test.productId)) {
          const allProductsSorted = Array.from(allProducts);
          foundRank = allProductsSorted.indexOf(test.productId) + 1;
        }

        const result = {
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: foundRank,
          totalProductsFound: totalProductsFound,
          pagesChecked: pageNumber - 1,
          status: foundRank ? 'FOUND' : 'NOT_FOUND_IN_1000'
        };
        
        results.push(result);

        if (foundRank) {
          console.log(`✅ "${test.keyword}" 최종 결과: ${foundRank}위`);
          console.log(`상품번호 ${test.productId}은 ${test.keyword} 검색 결과에서 ${foundRank}위입니다.`);
        } else {
          console.log(`❌ "${test.keyword}" 결과: 상위 ${totalProductsFound}개 안에서 타겟 상품을 찾지 못함`);
          console.log(`상품번호 ${test.productId}은 상위 ${totalProductsFound}위 안에 없습니다.`);
        }
        
        console.log(`📊 검색 통계: ${pageNumber-1}페이지 확인, ${totalProductsFound}개 상품 수집`);

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
          pagesChecked: pageNumber - 1,
          status: 'ERROR'
        });
      }
    }

  } catch (error) {
    console.error(`❌ 전체 실행 중 오류 발생: ${error.message}`);
  } finally {
    await browser.close();
    
    console.log('\n=== 📊 최종 페이지네이션 검색 결과 요약 ===');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. 키워드: "${result.keyword}"`);
      console.log(`   상품번호: ${result.productId}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   상태: ${result.status}`);
      console.log(`   확인한 페이지: ${result.pagesChecked}페이지`);
      
      if (result.status === 'FOUND') {
        console.log(`   🎉 결과: 상품번호 ${result.productId}은 "${result.keyword}" 검색 결과에서 ${result.rank}위입니다.`);
      } else if (result.totalProductsFound > 0) {
        console.log(`   ❌ 결과: 상품번호 ${result.productId}은 상위 ${result.totalProductsFound}위 안에 없습니다.`);
      } else {
        console.log(`   ⚠️ 결과: 검색 중 오류 발생`);
      }
      
      console.log(`   📦 총 확인된 상품 수: ${result.totalProductsFound}개`);
    });

    console.log('\n🏁 모든 페이지네이션 검색 완료!');
  }
})();
