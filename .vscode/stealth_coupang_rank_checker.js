const { chromium } = require("playwright");

async function checkProductRank() {
  const targetProductId = '8617045901';
  
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인하기 시작합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');
  console.log('🌐 직접 URL 접근 모드 사용');

  const browser = await chromium.launch({
    headless: false, // 진짜 브라우저처럼 보이게
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-background-sync',
      '--disable-client-side-phishing-detection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-logging',
      '--disable-notifications',
      '--disable-web-store',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-gpu',
      '--test-type'
    ],
    ignoreHTTPSErrors: true // HTTP/2 프로토콜 에러 무시
  });
  
  const context = await browser.newContext({
    // 실제 Chrome 브라우저 User-Agent 사용
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    // accept-language 헤더 강제 설정
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
      'upgrade-insecure-requests': '1',
      'dnt': '1'
    },
    // HTTPS 연결 안정성 개선
    ignoreHTTPSErrors: true
  });
  
  // navigator.webdriver 값 오버라이드
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // 추가 스텔스 설정
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    Object.define(window, 'chrome', {
      get: () => ({
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      }),
    });
    
    // WebGL 렌더러를 실제 것처럼 설정
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel(R) Iris(TM) Graphics 6100';
      }
      return originalGetParameter.call(this, parameter);
    };
  });

  const page = await context.newPage();

  try {
    console.log('📱 쿠팡 검색 URL로 직접 접근 중...');
    
    // 직접 검색 결과 URL로 접근
    const searchUrl = 'https://www.coupang.com/np/search?q=자전거+자물쇠';
    await page.goto(searchUrl, { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });

    await page.screenshot({ path: "coupang_search_direct.png" });
    console.log('✅ 쿠팡 검색 페이지 로드 완료!');

    // 페이지 로딩 완료까지 대기
    await page.waitForTimeout(3000);

    // 상품 요소가 로드될 때까지 대기
    console.log('⏳ 상품 리스트 로딩 대기 중...');
    
    try {
      // 다양한 상품 선택자 확인
      const selectors = [
        '[data-component-type="s-search-result"]',
        '[data-feature-name="searchProductItem"]',
        '.search-product',
        'li[data-testid]',
        'div[data-testid]',
        'article',
        '.baby-product'
      ];
      
      let foundSelector = null;
      for (let selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          const count = await page.locator(selector).count();
          if (count > 0) {
            foundSelector = selector;
            console.log(`✅ 상품 요소 발견: ${selector} (${count}개)`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      if (!foundSelector) {
        console.log('⚠️ 명확한 상품 선택자를 찾지 못했습니다. 페이스 범위 검색을 시도합니다.');
      }
    } catch (error) {
      console.log('⚠️ 페이지 구조 분석 중...');
    }

    // 전체 페이지 구조 분석
    const pageStructure = await page.evaluate(() => {
      const elements = document.querySelectorAll('*[data-product-id], *[data-productid], a[href*="/products/"]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        productId: el.getAttribute('data-product-id') || el.getAttribute('data-productid'),
        href: el.getAttribute('href') || (el.querySelector('a')?.getAttribute('href'))
      })).filter(item => item.productId || item.href).slice(0, 10);
    });
    
    console.log('📋 페이지에서 발견된 상품 요소들:', pageStructure);

    // 모든 링크에서 상품 ID 추출
    const products = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/products/"]');
      const productIds = new Set();
      
      for (let link of links) {
        const href = link.getAttribute('href');
        if (href) {
          // 다양한 패턴으로 product ID 추출
          const patterns = [
            /\/products\/(\d+)/,
            /productId=(\d+)/,
            /product_id=(\d+)/,
            /id=(\d+)/
          ];
          
          for (let pattern of patterns) {
            const match = href.match(pattern);
            if (match && match[1]) {
              productIds.add(match[1]);
              break;
            }
          }
        }
      }
      
      return Array.from(productIds);
    });

    console.log(`📦 총 ${products.length}개 상품 ID 발견`);

    // 추가 스크롤링으로 더 많은 상품 수집
    let allProducts = [...products];
    const checkedIds = new Set(products);
    
    for (let i = 1; i <= 3; i++) {
      console.log(`📜 스크롤 ${i}/3 실행 중...`);
      
      await page.evaluate((scrollIndex) => {
        window.scrollTo({
          top: document.body.scrollHeight / 3 * scrollIndex,
          behavior: 'smooth'
        });
      }, i);
      
      // 스크롤 후 대기 (500~1500ms 랜덤)
      const delay = Math.floor(Math.random() * 1001) + 500;
      await page.waitForTimeout(delay);
      
      // 새로 로드된 상품 수집
      const newProducts = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/products/"]');
        const productIds = new Set();
        
        for (let link of links) {
          const href = link.getAttribute('href');
          if (href) {
            const match = href.match(/\/products\/(\d+)/);
            if (match && match[1]) {
              productIds.add(match[1]);
            }
          }
        }
        
        return Array.from(productIds);
      });
      
      let newCount = 0;
      for (let productId of newProducts) {
        if (!checkedIds.has(productId)) {
          checkedIds.add(productId);
          allProducts.push(productId);
          newCount++;
        }
      }
      
      console.log(`📦 추가로 ${newCount}개 상품 발견. 총 ${allProducts.length}개`);
      
      if (allProducts.length >= 100) {
        console.log('🎯 목표 상품 수 달성!');
        break;
      }
    }

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
      path: 'final_search_results_stealth.png',
      fullPage: true 
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    await page.screenshot({ path: "error_screenshot_stealth.png" });
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
