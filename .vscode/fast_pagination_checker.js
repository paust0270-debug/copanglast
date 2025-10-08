const { chromium } = require('playwright');

(async () => {
  console.log('🚀 초고속 페이지네이션 순위 체킹');
  
  // 여러 상품 정보 정의
  const productTests = [
    {
      keyword: '자전거 자물쇠',
      productId: '8471564474',
      url: 'https://www.coupang.com/vp/products/8471564474?itemId=24511066972'
    },
    {
      keyword: '나무도마',
      productId: '8961322657',
      url: 'https://www.coupang.com/vp/products/8961322657?itemId=26221589138'
    },
    {
      keyword: '대나무도마',
      productId: '8961322657',
      url: 'https://www.coupang.com/vp/products/8961322657?itemId=26221589138'
    }
  ];

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-gpu',
      '--disable-http2',
      '--enable-http1',
      '--force-http1',
      '--disable-quic',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      // 초고속을 위한 추가 플래그들
      '--disable-logging',
      '--disable-background-networking',
      '--disable-background-sync',
      '--disable-hang-monitor',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-component-extensions-with-background-pages',
      '--disable-notifications',
      '--disable-web-store',
      '--disable-speech-api',
      '--disable-file-access',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-images' // 이미지 로딩 비활성화로 속도 향상
    ],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', // 이미지 제외로 빠르게
      'accept-encoding': 'gzip, deflate',
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
    javaScriptEnabled: true,
    // 빠른 네트워킹을 위한 설정
    reducedMotion: 'reduce',
    forcedColors: 'none'
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // 페이지 로딩 속도를 위한 추가 설정
    Object.defineProperty(navigator, 'connection', { 
      value: { effectiveType: '4g' }
    });
  });

  const page = await context.newPage();
  
  // 네트워크 요청 차단으로 속도 향상 (이미지, 폰트, 스타일시트 등)
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    const url = route.request().url();
    
    // 빠른 로딩을 위해 불필요한 리소스 차단
    if (resourceType === 'image' || 
        resourceType === 'font' || 
        resourceType === 'stylesheet' ||
        resourceType === 'media' ||
        url.includes('analytics') ||
        url.includes('tracking') ||
        url.includes('ads') ||
        url.includes('doubleclick')) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const results = [];

  try {
    for (let i = 0; i < productTests.length; i++) {
      const test = productTests[i];
      console.log(`\n🚀 ${i + 1}/3 초고속 검색: "${test.keyword}" - 상품번호 ${test.productId}`);
      
      let foundRank = null;
      let allProducts = new Set();
      let totalProductsFound = 0;
      let pageNumber = 1;
      const maxPages = 15; // 15페이지까지 탐색 (더 많은 상품)
      const FAST_SEARCH_DELAY = 800; // 대기 시간 대폭 단축
      const PARALLEL_PAGES = 3; // 병렬로 여러 페이지 처리

      try {
        while (pageNumber <= maxPages && totalProductsFound < 1000) {
          console.log(`⚡ "${test.keyword}" 페이지 ${pageNumber}/${maxPages} 초고속 탐색...`);
          
          // 병렬로 여러 페이지 동시 처리
          const parallelPromises = [];
          for (let p = pageNumber; p < Math.min(pageNumber + PARALLEL_PAGES, maxPages + 1); p++) {
            const searchUrl = p === 1 ? 
              `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}` :
              `https://www.coupang.com/search?q=${encodeURIComponent(test.keyword)}&page=${p}`;
            
            parallelPromises.push(
              processSinglePageFast(page, searchUrl, test.productId, p)
                .catch(error => ({ error: error.message, pageNumber: p, products: [], totalFound: 0 }))
            );
          }
          
          console.log(`🔄 ${PARALLEL_PAGES}개 페이지 병렬 처리 중...`);
          
          const pageResults = await Promise.allSettled(parallelPromises);
          
          // 결과 병합
          let foundInBatch = false;
          pageResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.products) {
              const pageResult = result.value;
              console.log(`📄 페이지 ${index + pageNumber}: ${pageResult.totalFound}개 상품 (타겟 발견: ${pageResult.targetFound ? 'YES' : 'NO'})`);
              
              // 새로운 상품만 추가
              pageResult.products.forEach(product => {
                if (!allProducts.has(product.productId)) {
                  allProducts.add(product.productId);
                  totalProductsFound++;
                }
              });
              
              // 타겟 상품 발견 확인
              if (pageResult.targetFound && !foundRank) {
                foundRank = totalProductsFound - (pageResult.products.length - pageResult.targetRankInPage);
                console.log(`🎯 "${test.keyword}" 페이지 ${pageNumber + index}에서 타겟 상품 발견! 전체 순위: ${foundRank}`);
                foundInBatch = true;
              }
            } else if (result.status === 'rejected') {
              console.log(`⚠️ 페이지 ${pageNumber + index} 오류: ${result.reason}`);
            }
          });
          
          if (foundInBatch || totalProductsFound >= 1000) {
            break;
          }
          
          pageNumber += PARALLEL_PAGES;
          
          console.log(`📊 누적 상품 수: ${totalProductsFound}개 (병렬 처리 완료)`);
        }

        // 최종 순위 재계산
        if (!foundRank && allProducts.has(test.productId)) {
          const allProductsSorted = Array.from(allProducts);
          foundRank = allProductsSorted.indexOf(test.productId) + 1;
        }

        const result = {
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: foundRank,
          totalProductsFound: totalProductsFound,
          pagesChecked: pageNumber - 1,
          status: foundRank ? 'FOUND' : 'NOT_FOUND'
        };
        
        results.push(result);

        if (foundRank) {
          console.log(`✅ "${test.keyword}" 초고속 검색 완료: ${foundRank}위`);
          console.log(`상품번호 ${test.productId}은 ${test.keyword} 검색 결과에서 ${foundRank}위입니다.`);
        } else {
          console.log(`❌ "${test.keyword}" 결과: 상위 ${totalProductsFound}개 안에서 타겟 상품을 찾지 못함`);
          console.log(`상품번호 ${test.productId}은 상위 ${totalProductsFound}위 안에 없습니다.`);
        }
        
        console.log(`⚡ 초고속 검색 통계: ${pageNumber-1}페이지 확인, ${totalProductsFound}개 상품 수집`);

      } catch (searchError) {
        console.error(`❌ "${test.keyword}" 검색 중 오류: ${searchError.message}`);
        results.push({
          keyword: test.keyword,
          productId: test.productId,
          url: test.url,
          rank: null,
          totalProductsFound: 0,
          pagesChecked: pageNumber - 1,
          status: 'ERROR'
        });
      }
    }

  } catch (error) {
    console.error(`❌ 전체 실행 중 오류 발생: ${error.message}`);
  } finally {
    await browser.close();
    
    console.log('\n=== 🚀 초고속 검색 결과 요약 ===');
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. 키워드: "${result.keyword}"`);
      console.log(`   상품번호: ${result.productId}`);
      console.log(`   상태: ${result.status}`);
      console.log(`   확인한 페이지: ${result.pagesChecked}페이지`);
      
      if (result.status === 'FOUND') {
        console.log(`   🎉 결과: 상품번호 ${result.productId}은 "${result.keyword}" 검색 결과에서 ${result.rank}위입니다.`);
      } else if (result.totalProductsFound > 0) {
        console.log(`   ❌ 결과: 상품번호 ${result.productId}은 상위 ${result.totalProductsFound}위 안에 없습니다.`);
      } else {
        console.log(`   ⚠️ 결과: 검색 중 오류 발생`);
      }
      
      console.log(`   📦 총 확인된 상품 수: ${result.totalProductsFound}개`);
    });

    console.log('\n🏁 모든 초고속 검색 완료!');
  }

  // 빠른 단일 페이지 처리 함수
  async function processSinglePageFast(page, url, targetProductId, pageNum) {
    try {
      const startTime = Date.now();
      
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 8000 // 타임아웃 대폭 단축
      });

      await page.waitForTimeout(FAST_SEARCH_DELAY); // 대기 시간 단축
      
      const productsData = await page.evaluate((targetProductId) => {
        const products = [];
        
        // 빠른 선택자로 상품 링크 찾기
        document.querySelectorAll('a[href*="/products/"], a[href*="/vp/products/"]').forEach((link, index) => {
          const href = link.href || link.getAttribute('href');
          if (href && href.includes('/products/')) {
            const match = href.match(/\/(?:vp\/)?products\/(\d+)/);
            if (match) {
              products.push({
                productId: match[1],
                href: href,
                rank: products.length + 1
              });
            }
          }
        });
        
        // 타겟 상품 찾기
        const targetProduct = products.find(product => product.productId === targetProductId);
        const targetRankInPage = targetProduct ? products.indexOf(targetProduct) + 1 : null;
        
        return {
          products: products,
          targetFound: !!targetProduct,
          targetRankInPage: targetRankInPage,
          totalFound: products.length
        };
      }, targetProductId);

      const loadTime = Date.now() - startTime;
      
      return {
        ...productsData,
        pageNumber: pageNum,
        loadTime: loadTime
      };

    } catch (error) {
      return {
        error: error.message,
        pageNumber: pageNum,
        products: [],
        totalFound: 0
      };
    }
  }
})();
