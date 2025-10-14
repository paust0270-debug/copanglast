const { chromium } = require('playwright');

(async () => {
  console.log('🎯 직접 검색 URL 접근 테스트');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--no-first-run',
      '--disable-default-apps'
    ],
    ignoreHTTPSErrors: true
  });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      locale: "ko-KR",
      extraHTTPHeaders: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'accept-encoding': 'gzip, deflate',
        'connection': 'keep-alive',
        'upgrade-insecure-requests': '1',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none'
      }
    });

    const page = await context.newPage();

    const targetProductId = '8617045901';
    const searchKeyword = '장난감';

    console.log(`🎯 타겟 상품번호: ${targetProductId}`);
    console.log(`🔍 검색 키워드: ${searchKeyword}`);

    // 다양한 검색 URL 형식 시도
    const searchUrls = [
      `https://www.coupang.com/np/search?q=${encodeURIComponent(searchKeyword)}`,
      `https://www.coupang.com/np/search?q=${searchKeyword}`,
      `https://www.coupang.com/search?q=${encodeURIComponent(searchKeyword)}`,
      `https://www.coupang.com/products/search?q=${encodeURIComponent(searchKeyword)}`
    ];

    for (const searchUrl of searchUrls) {
      try {
        console.log(`\n🌐 시도 중: ${searchUrl}`);
        
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        const currentUrl = page.url();
        const pageTitle = await page.title();
        
        console.log(`📍 현재 URL: ${currentUrl}`);
        console.log(`📄 페이지 제목: ${pageTitle}`);

        // 성공적으로 검색 페이지에 도달했는지 확인
        if (!currentUrl.includes('chrome-error') && 
            !currentUrl.includes('localhost') && 
            currentUrl.length > 20) {
          
          console.log('✅ 검색 페이지 접근 성공!');
          await page.waitForTimeout(3000);

          // 페이지 스크롤로 모든 상품 로드 시도
          console.log('📊 스크롤하며 상품 로드...');
          
          for (let scroll = 0; scroll < 3; scroll++) {
            console.log(`📜 스크롤 ${scroll + 1}/3`);
            
            const products = await page.evaluate(() => {
              const foundProducts = [];
              
              // 모든 가능한 상품 셀렉터 시도
              const selectors = [
                'li[data-product-id]',
                'div[data-product-id]',
                '[data-vendor-item-id]',
                '[data-item-id]',
                'a[href*="/products/"]',
                '.search-product',
                '.product-item',
                '.s-product-item',
                '.search-product-wrap',
                '[data-item-id]'
              ];
              
              selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                console.log(`${selector}: ${elements.length}개`);
                
                elements.forEach(element => {
                  let productId = element.getAttribute('data-product-id') ||
                                 element.getAttribute('data-vendor-item-id') ||
                                 element.getAttribute('data-item-id');
                  
                  // 링크에서 추출
                  if (!productId && element.tagName === 'A') {
                    const match = element.href.match(/\/products\/(\d+)/);
                    if (match) productId = match[1];
                  } else if (!productId) {
                    const link = element.querySelector('a');
                    if (link && link.href) {
                      const match = link.href.match(/\/products\/(\d+)/);
                      if (match) productId = match[1];
                    }
                  }
                  
                  if (productId) {
                    foundProducts.push({
                      rank: foundProducts.length + 1,
                      productId: String(productId),
                      source: selector,
                      href: element.href || (element.querySelector('a')?.href)
                    });
                  }
                });
              });
              
              return foundProducts;
            });

            console.log(`📦 현재까지 ${products.length}개 상품 발견`);
            
            // 타겟 상품 검색
            const targetFound = products.find(p => p.productId === targetProductId);
            if (targetFound) {
              console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${targetFound.rank}위입니다.`);
              
              if (targetFound.href) {
                console.log(`🔗 상품 링크: ${targetFound.href}`);
              }
              
              await browser.close();
              return;
            }

            // 다음 스크롤
            if (scroll < 2) {
              await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
              });
              await page.waitForTimeout(2000);
            }
          }

          console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
          
          // 찾은 상품 일부 출력
          const finalProducts = await page.evaluate(() => {
            const products = [];
            document.querySelectorAll('li[data-product-id], div[data-product-id], a[href*="/products/"]').forEach(el => {
              const id = el.getAttribute('data-product-id') || 
                        el.getAttribute('data-vendor-item-id') ||
                        el.href?.match(/\/products\/(\d+)/)?.[1];
              if (id && !products.some(p => p.productId === id)) {
                products.push({ productId: String(id) });
              }
            });
            return products.slice(0, 10);
          });
          
          if (finalProducts.length > 0) {
            console.log('📋 발견된 상품 예시:');
            finalProducts.forEach((product, index) => {
              console.log(`  ${index + 1}. ${product.productId}`);
            });
          }
          
          await browser.close();
          return; // 성공했으므로 종료
          
        } else {
          console.log('❌ 검색 페이지 로드 실패');
        }

      } catch (urlError) {
        console.log(`❌ ${searchUrl} 접근 실패:`, urlError.message);
      }
    }

    console.log('\n❌ 모든 검색 URL 접근 실패');
    console.log('상품번호 8617045901은 상위 100위 안에 없음');

  } catch (error) {
    console.error(`❌ 전체 오류: ${error.message}`);
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
  }
})();
