const { chromium } = require('playwright');

(async () => {
  console.log('🚀 빠른 쿠팡 장난감 검색 테스트');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  const page = await context.newPage();
  const targetProductId = '8617045901';
  
  console.log(`🎯 찾는 상품: ${targetProductId}`);

  try {
    // 쿠팡 검색 결과로 직접 이동
    console.log('🌐 검색 결과 페이지 직접 접속...');
    await page.goto('https://www.coupang.com/np/search?q=장난감', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('✅ 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 상품 수집
    console.log('📊 상품 수집 시작...');
    const result = await page.evaluate((targetId) => {
      const products = [];
      
      // 다양한 방법으로 상품 찾기
      document.querySelectorAll('[data-product-id], [data-vendor-item-id]').forEach(el => {
        const id = el.getAttribute('data-product-id') || el.getAttribute('data-vendor-item-id');
        if (id) products.push({id: String(id), element: 'product-attribute'});
      });
      
      // 링크에서 productId 추출
      document.querySelectorAll('a[href*="/products/"]').forEach(link => {
        const match = link.href.match(/\/products\/(\d+)/);
        if (match && !products.some(p => p.id === match[1])) {
          products.push({id: match[1], element: 'href-extraction'});
        }
      });
      
      // target 검색
      const found = products.findIndex(p => p.id === String(targetId));
      
      return {
        total: products.length,
        found: found >= 0 ? found + 1 : null,
        sample: products.slice(0, 5)
      };
    }, targetProductId);
    
    console.log(`📦 총 ${result.total}개 상품 발견`);
    
    if (result.found) {
      console.log(`🎉 찾음! 상품번호 ${targetProductId}은 장난감 검색 결과에서 ${result.found}위입니다.`);
    } else {
      console.log(`❌ 상품번호 ${targetProductId}은 상위 100위 안에 없음`);
    }
    
    console.log('📋 발견된 상품 예시:', result.sample.map(p => p.id).join(', '));

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await browser.close();
    console.log('🏁 완료');
  }
})();
