const { chromium } = require('playwright');

(async () => {
  console.log('🔄 대안적 접근 방식으로 쿠팡 테스트');
  
  // 여러 User-Agent 설정 시도
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  ];

  for (let i = 0; i < userAgents.length; i++) {
    console.log(`\n📱 User-Agent ${i + 1}/3 시도`);
    
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
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--metrics-reporting-enabled',
        '--no-report-upload'
      ],
      ignoreHTTPSErrors: true
    });

    try {
      const context = await browser.newContext({
        userAgent: userAgents[i],
        viewport: { width: 1920, height: 1080 },
        locale: "ko-KR",
        extraHTTPHeaders: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'accept-language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'accept-encoding': 'gzip, deflate',
          'connection': 'keep-alive',
          'upgrade-insecure-requests': '1'
        }
      });

      const page = await context.newPage();

      console.log('🌐 쿠팡 접속 시도...');
      
      // 여러 URL 시도
      const urls = [
        'https://www.coupang.com',
        'https://www.coupang.co.kr',
        'http://www.coupang.com'
      ];

      let success = false;
      for (const url of urls) {
        try {
          console.log(`📍 시도 중: ${url}`);
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
          });
          
          const pageTitle = await page.title();
          console.log(`📄 페이지 제목: ${pageTitle}`);
          
          const currentUrl = page.url();
          console.log(`✅ 현재 URL: ${currentUrl}`);
          
          if (!currentUrl.includes('chrome-error') && !currentUrl.includes('localhost')) {
            success = true;
            console.log('✅ 접속 성공!');
            
            // 검색창 찾기 테스트
            try {
              const hasSearch = await page.evaluate(() => {
                const searchInputs = document.querySelectorAll('input[name="q"], input[type="search"], #headerSearchKeyword');
                
                return {
                  found: searchInputs.length > 0,
                  count: searchInputs.length,
                  selectors: Array.from(searchInputs).map(input => ({
                    name: input.name,
                    placeholder: input.placeholder,
                    className: input.className
                  }))
                };
              });
              
              console.log('🔍 검색창 정보:', hasSearch);
              
              if (hasSearch.found) {
                console.log('✅ 검색창 발견! 검색 테스트 시작...');
                
                // 간단한 검색 테스트
                await page.type('input[name="q"]', '장난감');
                await page.waitForTimeout(2000);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(3000);
                
                const searchUrl = page.url();
                console.log(`🔍 검색 후 URL: ${searchUrl}`);
                
                if (searchUrl.includes('search') && !searchUrl.includes('chrome-error')) {
                  console.log('🎉 검색 성공!');
                  
                  // 상품 수집 테스트
                  const products = await page.evaluate(() => {
                    const productElements = document.querySelectorAll('[data-product-id], a[href*="/products/"]');
                    
                    return {
                      total: productElements.length,
                      sample: Array.from(productElements).slice(0, 5).map(el => ({
                        productId: el.getAttribute('data-product-id') || el.href.match(/\/products\/(\d+)/)?.[1],
                        href: el.href || null
                      }))
                    };
                  });
                  
                  console.log(`📦 상품 수집 결과: ${products.total}개`);
                  console.log('📋 샘플:', products.sample);
                  
                } else {
                  console.log('❌ 검색 페이지 로드 실패');
                }
              }
              
            } catch (searchError) {
              console.log('검색창 테스트 실패:', searchError.message);
            }
            
            break;
          } else {
            console.log('❌ 에러 페이지로 리다이렉트됨');
          }
          
        } catch (pageError) {
          console.log(`❌ ${url} 접속 실패:`, pageError.message);
        }
      }
      
      if (!success) {
        console.log('❌ 모든 URL 접속 실패');
      }

    } catch (contextError) {
      console.log('컨텍스트 생성 실패:', contextError.message);
    } finally {
      await browser.close();
      console.log('🔄 다음 설정 시도...');
    }
  }
  
  console.log('\n🏁 모든 시도 완료');
})();
