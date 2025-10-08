const { chromium } = require("playwright");

async function checkProductRank() {
  const targetProductId = '8617045901';
  
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인하기 시작합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');

  const browser = await chromium.launch({
    headless: false, // 진짜 브라우저처럼 보이게
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
  });
  
  const page = await context.newPage();

  try {
    console.log('📱 쿠팡 메인 페이지로 이동 중...');
    await page.goto("https://www.coupang.com", { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });

    await page.screenshot({ path: "coupang_home.png" });
    console.log('✅ 쿠팡 메인 페이지 로드 완료!');

    // 검색창 찾기
    console.log('🔍 검색창 찾는 중...');
    const searchInput = await page.waitForSelector('input[name="q"]', { timeout: 10000 });
    console.log('✅ 검색창 발견!');

    // 자연스러운 타이핑으로 검색어 입력
    console.log('⌨️ 자연스러운 타이핑으로 "자전거 자물쇠" 입력 중...');
    
    await page.click('input[name="q"]');
    await page.waitForTimeout(300);
    
    const searchKeyword = "자전거 자물쇠";
    for (let char of searchKeyword) {
      await page.keyboard.type(char);
      const delay = Math.floor(Math.random() * 101) + 100; // 100~200ms
      await page.waitForTimeout(delay);
    }

    console.log('🔍 검색 실행...');
    await page.keyboard.press('Enter');
    
    // 검색 결과 페이지 로딩 대기
    console.log('⏳ 검색 결과 페이지 로딩 중...');
    await page.waitForTimeout(5000); // 더 긴 대기

    // 상품 데이터가 로드될 때까지 대기
    try {
      await page.waitForSelector('[data-component-type="s-search-result"], .search-product, [data-feature-name="searchProductItem"]', { 
        timeout: 10000 
      });
      console.log('✅ 상품 리스트 로딩 완료!');
    } catch (error) {
      console.log('⚠️ 상품 리스트 선택자를 찾지 못했습니다. 다른 방법으로 시도합니다.');
    }

    await page.screenshot({ path: "search_results.png" });

    console.log('📜 상품 리스트를 스크롤하며 수집 중...');
    
    let allProducts = [];
    let checkedProducts = new Set(); // 중복 방지
    let attempts = 0;
    const maxAttempts = 5;
    
    while (allProducts.length < 100 && attempts < maxAttempts) {
      attempts++;
      console.log(`\n📦 시도 ${attempts}/${maxAttempts}: 상품 수집 중...`);
      
      // 현재 화면의 모든 상품 요소들 찾기
      const productElements = await page.evaluate(() => {
        const selectors = [
          '[data-component-type="s-search-result"]',
          '[data-feature-name="searchProductItem"]', 
          '.search-product',
          '[data-target-id*="product"]',
          '.baby-product',
          '.product-item'
        ];
        
        let elements = [];
        for (let selector of selectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            elements = found;
            console.log(`선택자 "${selector}"에서 ${found.length}개 요소 발견`);
            break;
          }
        }
        
        return Array.from(elements).map(el => ({
          productId: el.getAttribute('data-product-id'),
          href: el.querySelector('a')?.href || '',
          innerText: el.innerText?.substring(0, 100) || '...'
        }));
      });

      console.log(`🔍 ${productElements.length}개 상품 요소 발견`);
      
      // 상품 ID 추출
      for (let product of productElements) {
        let productId = product.productId;
        
        if (!productId && product.href) {
          // URL에서 product ID 추출
          const match = product.href.match(/\/products\/(\d+)/);
          if (match) {
            productId = match[1];
          }
        }
        
        if (productId && !checkedProducts.has(productId)) {
          checkedProducts.add(productId);
          allProducts.push(productId);
          console.log(`📦 상품 발견: ${productId}`);
          
          if (productId === targetProductId) {
            console.log(`🎯 타겟 상품 발견! 순위: ${allProducts.length}`);
          }
        }
      }
      
      console.log(`📊 현재까지 수집된 상품: ${allProducts.length}개`);
      
      // 스크롤 다운
      if (allProducts.length < 100) {
        console.log('📜 스크롤 다운...');
        await page.evaluate(() => {
          window.scrollBy(0, 800);
        });
        
        // 각 스크롤 후 대기 (500~1500ms)
        const scrollDelay = Math.floor(Math.random() * 1001) + 500;
        console.log(`⏱️ ${scrollDelay}ms 대기 중...`);
        await page.waitForTimeout(scrollDelay);
        
        // 조금 더 기다려서 동적 로딩 대기
        await page.waitForTimeout(2000);
      }
    }

    console.log(`📊 최종 수집된 상품 수: ${allProducts.length}개`);
    
    // 타겟 상품 찾기
    const targetIndex = allProducts.findIndex(productId => productId === targetProductId);
    
    if (targetIndex !== -1) {
      const rank = targetIndex + 1;
      console.log(`🎉 찾았습니다! 상품번호 ${targetProductId}은 자전거 자물쇠 검색 결과에서 ${rank}위입니다.`);
    } else {
      console.log(`😔 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
    }
    
    // 상세 정보 출력
    console.log('\n📋 수집된 상품 목록 (처음 15개):');
    allProducts.slice(0, 15).forEach((productId, index) => {
      const marker = productId === targetProductId ? '🎯' : '📦';
      console.log(`  ${marker} ${index + 1}위: ${productId}`);
    });

    // 최종 스크린샷 저장
    await page.screenshot({ 
      path: 'final_search_results.png',
      fullPage: true 
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    await page.screenshot({ path: "error_screenshot.png" });
  } finally {
    await browser.close();
    console.log('🏁 브라우저 종료');
  }
}

// 스크립트 실행
(async () => {
  try {
    await checkProductRank();
    console.log('✅ 순위 확인 완료!');
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
})();
