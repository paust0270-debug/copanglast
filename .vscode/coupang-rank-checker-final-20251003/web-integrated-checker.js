const { chromium } = require('playwright');
const axios = require('axios');

// GUI용 웹 연동 순위체크 프로그램
(async () => {
  console.log('🎯 쿠팡 순위 체킹 - GUI 웹 연동 버전');
  console.log('='.repeat(60));
  
  const API_BASE_URL = 'http://localhost:3000';
  
  try {
    // 1. 웹 애플리케이션에서 keywords 데이터 가져오기
    console.log('📡 웹 애플리케이션에서 키워드 데이터 조회 중...');
    
    const keywordsResponse = await axios.get(`${API_BASE_URL}/api/keywords`);
    
    if (!keywordsResponse.data.success) {
      console.log('❌ 키워드 데이터 조회 실패:', keywordsResponse.data.error);
      process.exit(1);
    }
    
    const keywords = keywordsResponse.data.data;
    
    if (!keywords || keywords.length === 0) {
      console.log('⚠️ 체킹할 키워드가 없습니다.');
      console.log('💡 웹 애플리케이션에서 키워드를 먼저 추가해주세요.');
      console.log('   http://localhost:3000/coupangapp/add');
      process.exit(0);
    }
    
    console.log(`📋 총 ${keywords.length}개의 키워드를 체킹합니다.`);
    console.log('='.repeat(60));
    
    // keywords 데이터를 productTests 형식으로 변환
    const productTests = keywords.map(keyword => {
      const productIdMatch = keyword.link_url.match(/\/products\/(\d+)/);
      return {
        keyword: keyword.keyword,
        productId: productIdMatch ? productIdMatch[1] : null,
        url: keyword.link_url,
        id: keyword.id
      };
    }).filter(test => test.productId); // productId가 있는 것만 필터링
    
    if (productTests.length === 0) {
      console.log('❌ 유효한 상품 ID가 있는 키워드가 없습니다.');
      process.exit(0);
    }
    
    console.log(`🎯 ${productTests.length}개의 유효한 키워드로 순위체크를 시작합니다.`);

    // 2. Playwright 브라우저 실행
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

    // 3. 각 키워드에 대해 순위 체킹 실행
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

        await page.waitForTimeout(1000);

        let found = false;
        let rank = null;
        let currentPage = 1;
        const maxPages = 20; // 최대 20페이지 (약 1000개 상품)
        let allProducts = new Set();

        while (!found && currentPage <= maxPages) {
          console.log(`📄 페이지 ${currentPage} 탐색 중...`);

          // 상품 카드들 찾기 (여러 선택자 시도)
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
            console.log('❌ 상품 카드를 찾을 수 없습니다. 페이지 구조를 확인합니다...');
            // 페이지 구조 디버깅
            const pageContent = await page.content();
            console.log('페이지 로드 상태 확인 중...');
            await page.waitForTimeout(2000);
            productCards = await page.$$('li');
            console.log(`전체 li 요소 개수: ${productCards.length}`);
            break;
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

          if (!found && currentPage < maxPages) {
            // 다음 페이지로 이동
            try {
              const nextPageUrl = `${searchUrl}&page=${currentPage + 1}`;
              await page.goto(nextPageUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
              });
              await page.waitForTimeout(600);
              currentPage++;
            } catch (error) {
              console.log(`❌ 페이지 ${currentPage + 1} 이동 실패:`, error.message);
              break;
            }
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

    // 4. 결과 요약
    console.log('\n📊 순위 체킹 결과 요약:');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
      if (result.status === 'FOUND') {
        console.log(`✅ ${index + 1}. ${result.keyword}: ${result.rank}위`);
        foundProductsCount++;
      } else {
        console.log(`❌ ${index + 1}. ${result.keyword}: 상위 1000위 안에 없음`);
      }
    });
    
    console.log('='.repeat(60));
    console.log(`📈 총 ${results.length}개 중 ${foundProductsCount}개 발견`);

    // 5. 결과를 웹 애플리케이션으로 전송
    console.log('\n📡 결과를 웹 애플리케이션으로 전송 중...');
    
    try {
      const updateResponse = await axios.post(`${API_BASE_URL}/api/ranking-check/update-results`, {
        results: results
      });
      
      if (updateResponse.data.success) {
        console.log('✅ 결과 전송 완료!');
        console.log(`📊 업데이트 통계: 성공 ${updateResponse.data.stats.success}개, 실패 ${updateResponse.data.stats.failed}개`);
        console.log('🎉 순위 체킹 작업이 완료되었습니다!');
      } else {
        console.log('❌ 결과 전송 실패:', updateResponse.data.error);
      }
    } catch (error) {
      console.log('❌ 결과 전송 중 오류:', error.message);
    }

  } catch (error) {
    console.error('❌ 전체 실행 중 오류:', error);
  }

  console.log('\n🏁 프로그램 종료');
  process.exit(0);
})();
