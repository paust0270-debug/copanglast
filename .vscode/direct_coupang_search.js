const { chromium } = require('playwright');

(async () => {
  console.log('🚀 직접 접근 방식으로 쿠팡 검색');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR"
  });

  const page = await context.newPage();
  
  const targetProductId = '8617045901';
  const searchKeyword = '장난감';

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 더 짧은 타임아웃으로 페이지 로드 시도
    console.log('🌐 쿠팡 메인 페이지 접속...');
    await page.goto('https://www.coupang.com', {
      waitUntil: 'domcontentloaded', // networkidle 대신 domcontentloaded 사용
      timeout: 15000
    });

    console.log('✅ 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 검색창 찾기
    console.log('🔍 검색창 찾기...');
    try {
      const searchInput = await page.waitForSelector('input[name="q"]', { timeout: 5000 });
      console.log('✅ 검색창 발견');
      
      // 검색창 활성화
      await searchInput.click();
      await page.waitForTimeout(500);

      // 자연스러운 타이핑
      console.log(`⌨️ "${searchKeyword}" 타이핑...`);
      for (let i = 0; i < searchKeyword.length; i++) {
        const char = searchKeyword[i];
        const delay = Math.random() * 100 + 100;
        await page.keyboard.type(char);
        await page.waitForTimeout(delay);
      }

      // 검색 실행
      console.log('🚀 검색 실행...');
      await page.keyboard.press('Enter');

      // 검색 결과 페이지 대기 (더 짧은 대기)
      console.log('⏳ 검색 결과 대기...');
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log(`📍 현재 URL: ${currentUrl}`);

      // URL 체크 및 상품 수집 시도
      if (!currentUrl.includes('chrome-error')) {
        console.log('📊 상품 수집 시작...');
        
        const result = await page.evaluate(() => {
          // DOM 구조 확인
          const divsWithProductId = document.querySelectorAll('[data-product-id]');
          const linksWithProducts = document.querySelectorAll('a[href*="/products/"]');
          
          console.log(`data-product-id 요소: ${divsWithProductId.length}개`);
          console.log(`products 링크: ${linksWithProducts.length}개`);
          
          const products = [];
          
          // data-product-id 속성으로 찾기
          divsWithProductId.forEach((element, index) => {
            const productId = element.getAttribute('data-product-id');
            if (productId) {
              products.push({
                rank: products.length + 1,
                productId: String(productId),
                source: 'data-product-id',
                index: index
              });
            }
          });
          
          // 링크에서 productId 추출
          linksWithProducts.forEach(link => {
            const href = link.href;
            const match = href.match(/\/products\/(\d+)/);
            if (match) {
              const productId = match[1];
              if (!products.some(p => p.productId === productId)) {
                products.push({
                  rank: products.length + 1,
                  productId: productId,
                  source: 'href-extraction',
                  href: href
                });
              }
            }
          });
          
          return {
            totalProducts: products.length,
            products: products.slice(0, 20), // 상위 20개만 반환
            domInfo: {
              dataProductIdElements: divsWithProductId.length,
              productLinks: linksWithProducts.length,
              totalLinks: document.querySelectorAll('a').length
            }
          };
        });

        console.log(`📦 총 ${result.totalProducts}개 상품 발견`);
        console.log('📊 DOM 구조:', result.domInfo);

        // 타겟 상품 검색
        const targetFound = result.products.find(product => product.productId === targetProductId);
        
        if (targetFound) {
          console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${targetFound.rank}위입니다.`);
        } else {
          console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
          
          if (result.products.length > 0) {
            console.log('📋 발견된 상품 예시:');
            result.products.slice(0, 10).forEach(product => {
              console.log(`  - ${product.rank}위: ${product.productId} (${product.source})`);
            });
          }
        }

      } else {
        console.log('❌ Chrome 에러 페이지로 리다이렉트됨');
      }

    } catch (searchError) {
      console.error('검색창 찾기 실패:', searchError.message);
      
      }   } catch (error) {
      console.error(`❌ 전체 오류: ${error.message}`);
    } finally {
      console.log('\n🏁 브라우저 종료 중...');
      await browser.close();
      console.log('✅ 완료');
    }
})();
