const { chromium } = require('playwright');

(async () => {
  console.log('🚀 간단한 쿠팡 장난감 검색 시작');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-http2'
    ],
    ignoreHTTPSErrors: true
  });

  // 데스크톱 환경으로 변경해서 안정성 확보
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
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

  const page = await context.newPage();
  
  const targetProductId = '8617045901';
  const searchKeyword = '장난감';
  let foundRank = null;
  let foundProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 쿠팡 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속 중...');
    await page.goto('https://www.coupang.com', {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    
    console.log('✅ 쿠팡 메인 페이지 로드 완료');
    await page.waitForTimeout(3000);

    // 검색창 찾기 및 클릭
    console.log('🔍 검색창 찾는 중...');
    
    // 더 넓은 범위의 검색창 셀렉터 시도
    const searchSelectors = [
      '#headerSearchKeyword',
      'input[name="q"]',
      'input[type="search"]',
      'input[placeholder*="검색"]',
      'input[title*="검색"]',
      '.header-search input',
      '.search-input'
    ];
    
    let searchBox = null;
    for (const selector of searchSelectors) {
      try {
        searchBox = await page.locator(selector).first();
        if (await searchBox.isVisible()) {
          console.log(`✅ 검색창 발견: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ ${selector} 시도 실패`);
      }
    }
    
    if (!searchBox || !(await searchBox.isVisible())) {
      throw new Error('검색창을 찾을 수 없습니다.');
    }
    
    // 검색창 클릭 및 포커스
    await searchBox.click();
    await page.waitForTimeout(500);

    // 자연스러운 타이핑 시뮬레이션
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑 중...`);
    
    for (let i = 0; i < searchKeyword.length; i++) {
      const char = searchKeyword[i];
      const delay = Math.random() * 100 + 100; // 100-200ms 랜덤 딜레이
      
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
      
      console.log(`.`); // 타이핑 진행 표시
    }
    
    console.log('✅ 타이핑 완료');

    // 검색 실행
    console.log('🚀 엔터 키로 검색 실행...');
    await page.keyboard.press('Enter');

    // 검색 결과 페이지 로딩 대기
    console.log('⏱️ 검색 결과 페이지 로딩 대기 중...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    // 페이지 구조 분석을 위한 스크린샷
    await page.screenshot({ path: 'search_page_debug.png', fullPage: true });
    console.log('📸 디버그 스크린샷 저장: search_page_debug.png');

    // 검색 결과에서 상품 수집
    console.log('📊 상위 100개 상품 수집 시작...');
    
    const products = await page.evaluate(() => {
      const products = [];
      
      // 다양한 상품 셀렉터 시도
      const productSelectors = [
        'li[data-product-id]',
        '.search-product',
        'div[data-product-id]',
        '[data-vendor-item-id]',
        'a[href*="/products/"]',
        '.s-product-item-container'
      ];
      
      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`${selector}: ${elements.length}개 상품 찾음`);
        
        elements.forEach((element, index) => {
          let productId = element.getAttribute('data-product-id') ||
                         element.getAttribute('data-vendor-item-id');
          
          // URL에서 productId 추출
          if (!productId) {
            const link = element.tagName === 'A' ? element : element.querySelector('a');
            if (link && link.href) {
              const match = link.href.match(/\/products\/(\d+)/);
              if (match) {
                productId = match[1];
              }
            }
          }
          
          if (productId) {
            products.push({
              rank: products.length + 1,
              productId: String(productId),
              selector: selector
            });
          }
        });
      }
      
      return products;
    });

    console.log(`📦 ${products.length}개 상품 발견`);
    
    // 타겟 상품 검색
    for (const product of products) {
      if (product.productId === targetProductId) {
        foundRank = product.rank;
        console.log(`🎯 타겟 상품 발견! Product ID: ${product.productId}, Rank: ${product.rank}`);
        break;
      }
    }

    // 최종 결과 출력
    if (foundRank) {
      console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
    } else {
      console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
      console.log(`📊 총 ${products.length}개 상품 중에서 찾지 못했습니다.`);
      
      // 상품 ID 일부 출력
      if (products.length > 0) {
        console.log(`📋 발견된 상품 ID 예시 (최대 10개):`);
        products.slice(0, 10).forEach(product => {
          console.log(`  - ${product.rank}위: ${product.productId}`);
        });
      }
    }

  } catch (error) {
    console.error(`❌ 실행 중 오류 발생: ${error.message}`);
    console.log(`🔍 에러 스택:`, error.stack);
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
  }
})();
