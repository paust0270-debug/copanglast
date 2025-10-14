const { chromium } = require('playwright');

(async () => {
  console.log('🎯 직접 검색 URL로 접근하는 PC 환경 쿠팡 검색');
  
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
  let foundProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 여러 가능한 검색 URL 시도
    const searchUrls = [
      `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}`,
      `https://www.coupang.com/search?q=${encodeURIComponent(searchKeyword)}`,
      `https://www.coupang.com/products/search?keyword=${encodeURIComponent(searchKeyword)}`,
      `https://www.coupang.com/search/search.eco?keyword=${encodeURIComponent(searchKeyword)}`
    ];

    for (const searchUrl of searchUrls) {
      try {
        console.log(`\n🌐 시도 중: ${searchUrl}`);
        
        const response = await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        const currentUrl = page.url();
        const pageTitle = await page.title();
        
        console.log(`📍 현재 URL: ${currentUrl}`);
        console.log(`📄 페이지 제목: ${pageTitle}`);
        console.log(`📊 응답 상태: ${response.status()}`);

        // 성공적으로 검색 페이지에 도달했는지 확인
        if (!currentUrl.includes('chrome-error') && 
            !currentUrl.includes('localhost') && 
            (currentUrl.includes('search') || response.status === 200)) {
          
          console.log('✅ 검색 페이지 접근 성공!');
          await page.waitForTimeout(5000);

          // 페이지 구조 파악
          const pageInfo = await page.evaluate(() => {
            const productIds = [];
            const links = document.querySelectorAll('a[href*="/products/"]');
            const dataElements = document.querySelectorAll('[data-product-id], [data-vendor-item-id], [data-item-id]');
            
            // 링크에서 productId 추출
            links.forEach(link => {
              const match = link.href.match(/\/products\/(\d+)/);
              if (match && !productIds.includes(match[1])) {
                productIds.push(match[1]);
              }
            });
            
            // data 속성에서 productId 추출
            dataElements.forEach(element => {
              const id = element.getAttribute('data-product-id') || 
                       element.getAttribute('data-vendor-item-id') ||
                       element.getAttribute('data-item-id');
              if (id && !productIds.includes(id)) {
                productIds.push(id);
              }
            });

            return {
              totalProducts: productIds.length,
              sampleProducts: productIds.slice(0, 10),
              dataElements: dataElements.length,
              productLinks: links.length,
              pageTitle: document.title,
              url: window.location.href
            };
          });

          console.log(`📦 페이지 정보:`, pageInfo);

          if (pageInfo.totalProducts > 0) {
            // 스크롤하며 더 많은 상품 로드
            for (let scrollAttempt = 0; scrollAttempt < 3; scrollAttempt++) {
              console.log(`📜 스크롤 ${scrollAttempt + 1}/3로 추가 상품 로드...`);
              
              // 3단계 스크롤
              const scrollDelay = Math.random() * 1000 + 500; // 500-1500ms
              
              await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight * 2);
              });
              await page.waitForTimeout(scrollDelay);
              
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
              });
              await page.waitForTimeout(scrollDelay);
              
              // 새로운 상품 로드 대기
              await page.waitForTimeout(3000);
              
              // 업데이트된 상품 정보
              const updatedInfo = await page.evaluate((targetId) => {
                const allProducts = [];
                const newLinks = document.querySelectorAll('a[href*="/products/"]');
                const newDataElements = document.querySelectorAll('[data-product-id], [data-vendor-item-id], [data-item-id]');
                
                // 모든 링크에서 productId 추출
                newLinks.forEach((link, index) => {
                  const match = link.href.match(/\/products\/(\d+)/);
                  if (match) {
                    allProducts.push({
                      productId: match[1],
                      rank: index + 1,
                      source: 'href',
                      href: link.href
                    });
                  }
                });
                
                // 모든 data 속성에서 productId 추출
                newDataElements.forEach((element, index) => {
                  const id = element.getAttribute('data-product-id') || 
                           element.getAttribute('data-vendor-item-id') ||
                           element.getAttribute('data-item-id');
                  if (id) {
                    const existingProduct = allProducts.find(p => p.productId === id);
                    if (!existingProduct) {
                      allProducts.push({
                        productId: id,
                        rank: allProducts.length + index + 1,
                        source: 'data-attribute'
                      });
                    }
                  }
                });
                
                // 중복 제거 및 순위 재정렬
                const uniqueProducts = [];
                const seenIds = new Set();
                
                allProducts.forEach(product => {
                  if (!seenIds.has(product.productId)) {
                    seenIds.add(product.productId);
                    uniqueProducts.push({
                      ...product,
                      rank: uniqueProducts.length + 1
                    });
                  }
                });
                
                // 타겟 상품 찾기
                const targetFound = uniqueProducts.find(product => product.productId === targetId);
                
                return {
                  totalProducts: uniqueProducts.length,
                  targetFound: targetFound,
                  targetRank: targetFound ? targetFound.rank : null,
                  sampleProducts: uniqueProducts.slice(0, 10)
                };
              }, targetProductId);
              
              console.log(`📊 업데이트된 상품 수: ${updatedInfo.totalProducts}개`);
              
              // 타겟 상품 찾기
              if (updatedInfo.targetFound) {
                foundRank = updatedInfo.targetRank;
                console.log(`🎯 타겟 상품 발견! Product ID: ${targetProductId}, Rank: ${foundRank}`);
              } else if (updatedInfo.totalProducts > foundProducts.length) {
                // 새로운 상품들 수집
                const newProducts = updatedInfo.sampleProducts.slice(foundProducts.length);
                foundProducts.push(...newProducts);
                console.log(`📦 추가로 ${newProducts.length}개 상품 발견`);
              }
              
              if (foundRank || updatedInfo.totalProducts >= 100) break;
            }

            // 최종 결과
            if (foundRank) {
              console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
            } else {
              console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
              
              if (updatedInfo.totalProducts > 0) {
                console.log('📋 발견된 상품 예시 (최대 15개):');
                updatedInfo.sampleProducts.forEach((product, index) => {
                  console.log(`  ${index + 1}. ${product.productId} (${product.source})`);
                });
              }
            }
            
          } else {
            console.log('⚠️ 페이지에서 상품을 찾을 수 없습니다.');
          }
          
          // 성공했으므로 다른 URL 시도 중단
          break;
          
        } else {
          console.log('❌ 검색 페이지 로드 실패');
        }

      } catch (urlError) {
        console.log(`❌ ${searchUrl} 접근 실패:`, urlError.message);
      } finally {
        // 다음 URL 시도 전 잠시 대기
        await page.waitForTimeout(1000);
      }
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
    console.log(`- 순위: ${foundRank ? `${foundRank}위` : '상위 100위 안에 없음'}`);
  }
})();
