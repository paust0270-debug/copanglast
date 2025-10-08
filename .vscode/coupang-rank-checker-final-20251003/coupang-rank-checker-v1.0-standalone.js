const { chromium } = require('playwright');

// 쿠팡 순위 체킹기 v1.0 - 독립 실행 버전 (웹 서버 불필요)
(async () => {
  console.log('🎯 쿠팡 순위 체킹기 v1.0 - 독립 실행 버전');
  console.log('='.repeat(50));
  console.log('📅 개발일: 2025-01-03');
  console.log('🔧 버전: v1.0');
  console.log('🌐 모드: 독립 실행 (웹 서버 불필요)');
  console.log('='.repeat(50));
  
  // 테스트용 키워드 데이터 (실제 사용 시 웹에서 가져옴)
  const testKeywords = [
    {
      id: 1,
      keyword: '이동식 트롤리',
      link_url: 'https://www.coupang.com/vp/products/8473798698',
      slot_type: 'coupang'
    },
    {
      id: 2,
      keyword: '자전거 자물쇠',
      link_url: 'https://www.coupang.com/vp/products/7446595001',
      slot_type: 'coupang'
    },
    {
      id: 3,
      keyword: '자전거 라이트',
      link_url: 'https://www.coupang.com/vp/products/8188782600',
      slot_type: 'coupang'
    }
  ];
  
  console.log(`📋 총 ${testKeywords.length}개의 테스트 키워드를 체킹합니다.`);
  console.log('='.repeat(50));
  
  // 키워드 데이터 변환
  const productTests = testKeywords.map(keyword => {
    const productIdMatch = keyword.link_url.match(/\/products\/(\d+)/);
    return {
      keyword: keyword.keyword,
      productId: productIdMatch ? productIdMatch[1] : null,
      url: keyword.link_url,
      id: keyword.id
    };
  }).filter(test => test.productId);
  
  console.log(`🎯 ${productTests.length}개의 유효한 키워드로 순위체크를 시작합니다.`);

  // Playwright 브라우저 실행
  console.log('🌐 브라우저 실행 중...');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-gpu',
      '--disable-http2',
      '--enable-http1',
      '--force-http1',
      '--disable-quic',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-logging',
      '--disable-features=VizDisplayCompositor'
    ],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'ko-KR',
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1'
    }
  });

  // navigator.webdriver 오버라이드
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  const page = await context.newPage();

  // 리소스 차단 설정 (속도 최적화)
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    if (['image', 'font', 'media'].includes(resourceType)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const results = [];
  let totalProductsFound = 0;
  let totalPagesChecked = 0;
  let foundProductsCount = 0;

  // 각 키워드에 대해 순위 체킹 실행
  for (let i = 0; i < productTests.length; i++) {
    const test = productTests[i];
    console.log(`\n🔍 [${i + 1}/${productTests.length}] "${test.keyword}" 검색 중...`);
    
    try {
      // 검색 URL 생성
      const searchUrl = `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}`;
      console.log(`🌐 검색 URL: ${searchUrl}`);

      // 페이지 로드
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await page.waitForTimeout(2000); // 페이지 로딩 대기

      let found = false;
      let rank = null;
      let currentPage = 1;
      const maxPages = 5; // 테스트용으로 5페이지만 (약 250개 상품)
      let allProducts = new Set();

      while (!found && currentPage <= maxPages) {
        console.log(`📄 페이지 ${currentPage} 탐색 중...`);

        // 상품 카드들 찾기 (다양한 선택자 시도)
        let productCards = await page.$$('li.search-product');
        
        if (productCards.length === 0) {
          productCards = await page.$$('.search-product');
        }
        
        if (productCards.length === 0) {
          productCards = await page.$$('[data-product-id]');
        }
        
        if (productCards.length === 0) {
          productCards = await page.$$('li[class*="search-product"]');
        }
        
        if (productCards.length === 0) {
          productCards = await page.$$('li[class*="product"]');
        }
        
        if (productCards.length === 0) {
          productCards = await page.$$('div[class*="product"]');
        }

        if (productCards.length === 0) {
          console.log('❌ 상품 카드를 찾을 수 없습니다. 페이지 구조를 확인합니다...');
          // 페이지 구조 디버깅
          await page.waitForTimeout(3000);
          productCards = await page.$$('li');
          console.log(`전체 li 요소 개수: ${productCards.length}`);
          
          // 첫 번째 페이지에서 상품을 찾지 못하면 중단
          if (currentPage === 1) {
            break;
          }
        }

        console.log(`📦 페이지 ${currentPage}에서 ${productCards.length}개 상품 발견`);

        // 각 상품 카드에서 상품 ID 확인
        for (let j = 0; j < productCards.length; j++) {
          try {
            // data-product-id 속성 확인
            const dataProductId = await productCards[j].getAttribute('data-product-id');
            
            if (dataProductId) {
              allProducts.add(dataProductId);
              if (dataProductId === test.productId) {
                found = true;
                rank = allProducts.size;
                console.log(`🎉 상품 발견! 순위: ${rank}위`);
                break;
              }
            }

            // URL에서 productId 확인
            const productLink = await productCards[j].$('a');
            if (productLink) {
              const href = await productLink.getAttribute('href');
              if (href && href.includes(`/products/${test.productId}`)) {
                found = true;
                rank = allProducts.size;
                console.log(`🎉 상품 발견! 순위: ${rank}위`);
                break;
              }
            }
          } catch (error) {
            console.log(`⚠️ 상품 ${j + 1} 확인 중 오류:`, error.message);
          }
        }

        // 상품을 찾았거나 마지막 페이지에 도달했으면 루프 종료
        if (found || currentPage >= maxPages) {
          break;
        }

        // 다음 페이지로 이동
        try {
          currentPage++;
          const nextPageUrl = `${searchUrl}&page=${currentPage}`;
          console.log(`🔄 페이지 ${currentPage}로 이동: ${nextPageUrl}`);
          
          await page.goto(nextPageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });
          await page.waitForTimeout(1000);
        } catch (error) {
          console.log(`❌ 페이지 ${currentPage} 이동 실패:`, error.message);
          break;
        }
      }

      const result = {
        id: test.id,
        keyword: test.keyword,
        productId: test.productId,
        url: test.url,
        rank: rank,
        totalProductsFound: allProducts.size,
        pagesChecked: currentPage - 1,
        status: found ? 'FOUND' : 'NOT_FOUND'
      };
      
      results.push(result);
      totalProductsFound += allProducts.size;
      totalPagesChecked += (currentPage - 1);
      if (found) foundProductsCount++;

      if (found) {
        console.log(`✅ 상품번호 ${test.productId}은 ${test.keyword} 검색 결과에서 ${rank}위입니다.`);
      } else {
        console.log(`❌ 상위 ${allProducts.size}위 안에 없음 - ${test.keyword}`);
      }

    } catch (error) {
      console.log(`❌ "${test.keyword}" 검색 중 오류:`, error.message);
      results.push({
        id: test.id,
        keyword: test.keyword,
        productId: test.productId,
        found: false,
        rank: null,
        error: error.message
      });
    }

    // 다음 검색 전 잠시 대기
    if (i < productTests.length - 1) {
      await page.waitForTimeout(1000);
    }
  }

  await browser.close();

  // 결과 요약
  console.log('\n📊 순위 체킹 결과 요약:');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    if (result.status === 'FOUND') {
      console.log(`✅ ${index + 1}. ${result.keyword}: ${result.rank}위`);
      foundProductsCount++;
    } else {
      console.log(`❌ ${index + 1}. ${result.keyword}: 상위 1000위 안에 없음`);
    }
  });
  
  console.log('='.repeat(50));
  console.log(`📈 총 ${results.length}개 중 ${foundProductsCount}개 발견`);

  console.log('\n🏁 쿠팡 순위 체킹기 v1.0 - 독립 실행 완료');
  console.log('='.repeat(50));
  console.log('💡 실제 사용 시에는 웹 애플리케이션과 연동하여 사용하세요.');
  console.log('   웹 서버 실행: npm run dev');
  console.log('   웹 연동 버전: node coupang-rank-checker-v1.0.js');
  console.log('='.repeat(50));
  
  process.exit(0);
})();


