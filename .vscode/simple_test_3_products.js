const { chromium } = require('playwright');

(async () => {
  console.log('🎯 새로운 3개 상품 순위 체킹');
  
  // 새로운 상품 정보
  const productTests = [
    { keyword: '이동식 트롤리', productId: '8473798698' },
    { keyword: '자전거 자물쇠', productId: '7446595001' },
    { keyword: '자전거 라이트', productId: '8188782600' }
  ];

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--disable-http2'],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const page = await context.newPage();

  for (let i = 0; i < productTests.length; i++) {
    const test = productTests[i];
    console.log(`\n🔍 ${i + 1}/3: "${test.keyword}" 검색 시작...`);
    
    try {
      const searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);

      for (let pageNum = 1; pageNum <= 5; pageNum++) {
        console.log(`📄 페이지 ${pageNum} 확인 중...`);
        
        const products = await page.evaluate((targetId) => {
          const found = [];
          document.querySelectorAll('a[href*="/products/"]').forEach((link, index) => {
            const match = link.href.match(/\/products\/(\d+)/);
            if (match) {
              found.push({
                productId: match[1],
                rank: index + 1
              });
            }
          });
          
          const targetProduct = found.find(p => p.productId === targetId);
          return {
            products: found,
            targetFound: !!targetProduct,
            targetRank: targetProduct ? targetProduct.rank : null
          };
        }, test.productId);

        if (products.targetFound) {
          console.log(`✅ "${test.keyword}" 발견! ${products.targetRank}위`);
          console.log(`🎉 결과: 상품번호 ${test.productId}은 "${test.keyword}" 검색 결과에서 ${products.targetRank}위입니다.`);
          break;
        } else if (pageNum < 5) {
          console.log(`📜 다음 페이지로 스크롤...`);
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(1500);
          
          const nextUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}&page=${pageNum + 1}`;
          await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          await page.waitForTimeout(2000);
        } else {
          console.log(`❌ "${test.keyword}" 해당 상품을 찾지 못했습니다.`);
        }
      }

    } catch (error) {
      console.error(`❌ "${test.keyword}" 검색 오류: ${error.message}`);
    }

    if (i < productTests.length - 1) {
      console.log('⏳ 다음 검색을 위해 2초 대기...');
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();
  console.log('\n🏁 모든 검색 완료!');
})();
