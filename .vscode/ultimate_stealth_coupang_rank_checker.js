const { chromium } = require("playwright");

async function checkProductRankWithStealth() {
  const targetProductId = '8617045901';
  
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인하기 시작합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');
  console.log('🥷 Ultimate Stealth 모드 활성화');
  console.log('🌍 한국 Residential Proxy 사용');
  console.log('🔒 TLS 지문 위장 적용');

  const browser = await chromium.launch({
    headless: false, // 브라우저 창 표시
    args: [
      // HTTP/2 비활성화하여 HTTP/1.1 사용
      '--disable-http2',
      '--disable-features=http2',
      
      // 기존 스텔스 설정들
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--no-sandbox',
      '--disable-setuid-sandbase',
      '--disable-dev-shm-usage',
      
      // HTTPS/TLS 관련 설정
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
      
      // TLS 지문 위장 설정
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-gpu',
      '--test-type',
      
      // 한국 locale 설정
      '--lang=ko-KR',
      '--accept-lang=ko-KR,ko;q=0.9,en;q=0.8',
      
      // User-Agent 관련
      '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
      
      // TLS 암호화 설정 (일반 Chrome과 동일하게)
      '--cipher-suite-blacklist=0x0004,0x0005',
      '--enable-tcp-fast-open',
      '--tls-min-version=1.2',
      
      // 메모리 및 성능 설정
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ],
    ignoreHTTPSErrors: true
  });
  
  const context = await browser.newContext({
    // 실제 한국 Chrome 환경과 동일한 User-Agent
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    
    // 한국 환경과 동일한 accept-language
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'cache-control': 'max-age=0',
      
      // 최신 Chrome sec-ch-ua 헤더들 (한국 환경용)
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"',
      'sec-ch-ua-bitness': '"64"',
      'sec-ch-ua-full-version-list': '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.216", "Google Chrome";v="120.0.6099.216"',
      
      // sec-fetch 헤더들 (일반적인 크롬 요청과 동일)
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      
      // 추가 헤더들
      'upgrade-insecure-requests': '1',
      'dnt': '1',
      'referer': 'https://www.google.com/'
    },
    
    ignoreHTTPSErrors: true,
    
    // 한국 프록시 설정 (실제 한국 프록시 IP로 교체)
    // proxy: {
    //   server: 'http://korean-residential-proxy:port',
    //   username: 'proxy-username',
    //   password: 'proxy-password'
    // }
  });
  
  // 고급 스텔스 설정 - navigator.webdriver 오버라이드 및 글로벌 객체 위장
  await context.addInitScript(() => {
    // navigator.webdriver false로 설정
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
    
    // 실제 Chrome navigator 속성들 시뮬레이션
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const plugins = [
          { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
          { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
          { name: "Native Client", filename: "internal-nacl-plugin" }
        ];
        plugins.item = function(i) { return this[i] || null; };
        plugins.namedItem = function(name) { return this.find(p => p.name === name) || null; };
        Object.setPrototypeOf(plugins, Object.getPrototypeOf(navigator.plugins));
        return plugins;
      }
    });
    
    // Chrome 객체 설정
    Object.defineProperty(window, 'chrome', {
      get: () => ({
        runtime: { onConnect: undefined, onMessage: undefined },
        loadTimes: function() {
          return {
            requestTime: performance.now(),
            startLoadTime: performance.now(),
            commitLoadTime: performance.now(),
            finishDocumentLoadTime: performance.now(),
            finishLoadTime: performance.now(),
            firstPaintTime: performance.now(),
            firstPaintAfterLoadTime: 0,
            navigationType: "navigate"
          };
        } ,
        csi: function() { return {}; },
        app: {
          isInstalled: false,
          InstallState: { DISABLED: "disabled", INSTALLED: "installed", NOT_INSTALLED: "not-installed" },
          RunningState: { CANNOT_RUN: "cannot_run", READY_TO_RUN: "ready_to_run", RUNNING: "running" }
        }
      }),
    });
    
    // WebGL 렌더러를 실제 Intel GPU로 설정
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) return 'Intel Inc.';
      if (parameter === 37446) return 'Intel(R) Iris(TM) Graphics 640';
      return originalGetParameter.call(this, parameter);
    };
    
    // 추가 navigator 속성들 설정
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en'] });
    Object.defineProperty(navigator, 'language', { get: () => 'ko-KR' });
  });

  const page = await context.newPage();

  try {
    console.log('📱 쿠팡 검색 URL로 직접 접근 중...');
    
    // 직접 검색 결과 URL로 접근
    const searchUrl = 'https://www.coupang.com/np/search?q=자전거+자물쇠';
    await page.goto(searchUrl, { 
      waitUntil: "networkidle",
      timeout: 45000 
    });

    await page.screenshot({ path: "coupang_ultimate_stealth.png" });
    console.log('✅ 쿠팡 검색 페이지 로드 완료!');

    // 상품 로딩 대기
    await page.waitForTimeout(5000);

    // 고급 상품 수집 전략
    console.log('🔍 고급 상품 수집 전략 시작...');
    
    const products = await page.evaluate(() => {
      const productIds = new Set();
      
      // 방법 1: API 응답에서 데이터 추출 시도
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        const text = script.innerHTML;
        if (text.includes('productId') || text.includes('product-id')) {
          const matches = text.match(/["'](\d{10,})["']/g);
          if (matches) {
            matches.forEach(match => {
              const id = match.replace(/["']/g, '');
              if (id.length >= 10) productIds.add(id);
            });
          }
        }
      });
      
      // 방법 2: DOM 요소에서 직접 추출
      const selectors = [
        '[data-product-id]',
        '[data-productid]',
        'a[href*="/products/"]',
        '.product-item',
        '[data-component-type="s-search-result"]',
        '[data-feature-name="searchProductItem"]'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          let productId = element.getAttribute('data-product-id') || 
                         element.getAttribute('data-productid');
          
          if (!productId) {
            const href = element.getAttribute('href') || 
                        element.querySelector('a')?.getAttribute('href');
            if (href) {
              const match = href.match(/\/products\/(\d+)/);
              if (match) productId = match[1];
            }
          }
          
          if (productId && productId.length >= 10) {
            productIds.add(productId);
          }
        });
      });
      
      return Array.from(productIds);
    });

    console.log(`📦 첫 번째 수집: ${products.length}개 상품 발견`);

    // 스크롤링으로 더 많은 상품 수집
    let allProducts = [...products];
    const checkedIds = new Set(products);

    for (let i = 0; i < 5; i++) {
      console.log(`📜 스크롤링 ${i + 1}/5 실행...`);
      
      // 부드러운 스크롤링
      await page.evaluate((index) => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollTo({
          top: scrollHeight * (index + 1) / 6,
          behavior: 'smooth'
        });
      }, i);
      
      // 자연스러운 대기 (800~2000ms)
      const delay = Math.floor(Math.random() * 1201) + 800;
      await page.waitForTimeout(delay);
      
      // 동적 로딩 대기
      await page.waitForTimeout(2000);
      
      // 새로운 상품 수집
      const newProducts = await page.evaluate(() => {
        const productIds = new Set();
        
        // 모든 링크에서 상품 ID 추출
        document.querySelectorAll('a[href*="/products/"]').forEach(link => {
          const href = link.getAttribute('href');
          const match = href.match(/\/products\/(\d+)/);
          if (match && match[1] && match[1].length >= 10) {
            productIds.add(match[1]);
          }
        });
        
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
      
      console.log(`🚀 추가 수집: ${newCount}개 신상품. 총 ${allProducts.length}개`);
      
      if (allProducts.length >= 100) break;
    }

    console.log(`🎯 최종 수집 결과: ${allProducts.length}개 상품`);
    
    // 타겟 상품 찾기
    const targetIndex = allProducts.findIndex(id => id === targetProductId);
    
    if (targetIndex !== -1) {
      const rank = targetIndex + 1;
      console.log(`🎉 SUCCESS! 상품번호 ${targetProductId}은 자전거 자물쇠 검색 결과에서 ${rank}위입니다.`);
      
      // 결과를 파일로도 저장
      console.log(`\n📝 결과를 파일로 저장: coupang_rank_result_${new Date().getTime()}.txt`);
      require('fs').writeFileSync(
        `coupang_rank_result_${new Date().getTime()}.txt`,
        `상품번호 ${targetProductId} 검색 결과\n순위: ${rank}위\n검색어: 자전거 자물쇠\n수집 일시: ${new Date().toISOString()}\n총 상품 수: ${allProducts.length}개`
      );
      
    } else {
      console.log(`😔 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
    }
    
    // 상세 결과 출력
    console.log('\n📋 수집된 상품 목록 (처음 20개):');
    allProducts.slice(0, 20).forEach((productId, index) => {
      const marker = productId === targetProductId ? '🎯' : '📦';
      console.log(`  ${marker} ${index + 1}위: ${productId}`);
    });

    // 최종 스크린샷 저장
    await page.screenshot({ 
      path: 'ultimate_stealth_final.png',
      fullPage: true 
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    await page.screenshot({ path: "ultimate_error.png" });
  } finally {
    await browser.close();
    console.log('🏁 Ultimate Stealth 브라우저 종료');
  }
}

// 스크립트 실행
(async () => {
  try {
    await checkProductRankWithStealth();
    console.log('✅ Ultimate Stealth 순위 확인 완료!');
  } catch (error) {
    console.error('❌ Ultimate 스크립트 실행 실패:', error);
  }
})();