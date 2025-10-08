const { chromium } = require('playwright');

(async () => {
  console.log('🔍 쿠팡 검색 디버깅 모드');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // 천천히 실행해서 확인 가능
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();

  try {
    // 쿠팡 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속...');
    await page.goto('https://www.coupang.com', { waitUntil: 'domcontentloaded' });
    
    console.log('⏳ 페이지 완전 로딩 대기...');
    await page.waitForTimeout(5000);

    // 페이지 내용 분석
    console.log('🔍 페이지 구조 분석...');
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasSearchInput: !!document.querySelector('input[type="search"], input[name="q"], #headerSearchKeyword'),
        searchInputs: Array.from(document.querySelectorAll('input')).map(input => ({
          name: input.name,
          type: input.type,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className
        })),
        productElements: Array.from(document.querySelectorAll('[data-product-id], [data-vendor-item-id], a[href*="/products/"]')).length,
        totalLinks: document.querySelectorAll('a[href*="/products/"]').length
      };
    });

    console.log('📊 페이지 정보:', pageInfo);

    // 검색창 찾기
    if (pageInfo.hasSearchInput) {
      console.log('✅ 검색창 존재 확인');
      
      // 검색 실행
      await page.type('input[name="q"]', '장난감', { delay: 100 });
      await page.waitForTimeout(1000);
      
      console.log('🔍 검색 실행...');
      await page.keyboard.press('Enter');
      
      // 검색 결과 페이지 로딩 대기
      await page.waitForTimeout(8000);
      
      const searchUrl = page.url();
      console.log('📍 검색 후 URL:', searchUrl);
      
      // 검색 결과 페이지 분석
      const searchResults = await page.evaluate(() => {
        const products = [];
        
        // 모든 상품 관련 요소 찾기
        const selectors = [
          'li[data-product-id]',
          'div[data-product-id]',
          '[data-vendor-item-id]',
          'a[href*="/products/"]',
          '.search-product',
          '.product-item',
          '.s-product-item',
          '[data-item-id]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`${selector}: ${elements.length}개 발견`);
            
            elements.forEach(el => {
              let productId = el.getAttribute('data-product-id') || 
                            el.getAttribute('data-vendor-item-id') ||
                            el.getAttribute('data-item-id');
              
              if (!productId && el.tagName === 'A') {
                const match = el.href.match(/\/products\/(\d+)/);
                if (match) productId = match[1];
              }
              
              if (productId) {
                products.push({
                  productId: String(productId),
                  source: selector,
                  href: el.tagName === 'A' ? el.href : (el.querySelector('a')?.href || '')
                });
              }
            });
          }
        });
        
        return {
          total: products.length,
          products: products.slice(0, 10), // 처음 10개만
          sampleSelectors: selectors.map(s => ({
            selector: s,
            count: document.querySelectorAll(s).length
          }))
        };
      });
      
      console.log(`📦 검색 결과: ${searchResults.total}개 상품 발견`);
      console.log('📊 셀렉터별 상품 수:', searchResults.sampleSelectors);
      
      if (searchResults.products.length > 0) {
        console.log('📋 발견된 상품 예시:');
        searchResults.products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.productId} (${product.source})`);
        });
      }
      
    } else {
      console.log('❌ 검색창을 찾을 수 없음');
      console.log('📝 사용 가능한 input 요소들:', pageInfo.searchInputs);
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }

  console.log('⏳ 브라우저를 열어둡니다. 확인 후 수동으로 닫아주세요.');
  // 브라우저를 계속 열어둡니다
  console.log('💡 수동으로 검색해보고 페이지 구조를 확인해주세요.');
  
  // 30초 후 자동 종료
  setTimeout(async () => {
    await browser.close();
    console.log('🏁 자동 종료');
  }, 30000);
})();
