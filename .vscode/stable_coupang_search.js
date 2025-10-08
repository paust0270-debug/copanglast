const { chromium } = require('playwright');

(async () => {
  console.log('🔧 안정적인 쿠팡 검색 시도');
  
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    ignoreHTTPSErrors: true
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
    extraHTTPHeaders: {
      'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  });

  const page = await context.newPage();
  
  const targetProductId = '8617045901';
  const searchKeyword = '장난감';
  let foundRank = null;
  let allProducts = [];

  console.log(`🎯 타겟 상품번호: ${targetProductId}`);
  console.log(`🔍 검색 키워드: ${searchKeyword}`);

  try {
    // 네비게이션 이벤트 모니터링
    page.on('response', response => {
      if (response.url().includes('search')) {
        console.log(`📄 응답 받음: ${response.status()} ${response.url()}`);
      }
    });

    // 메인 페이지 접속
    console.log('🏠 쿠팡 메인 페이지 접속...');
    await page.goto('https://www.coupang.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 페이지 로딩 완료 대기
    console.log('⏳ 페이지 로딩 완료 대기...');
    await page.waitForTimeout(5000);

    // 쿠팡 앱 설치 관련 팝업이나 기타 방해 요소 제거
    try {
      await page.click('.close, .close-btn, .dismiss, .esc', { timeout: 2000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      // 팝업이 없으면 무시
    }

    // 검색창 찾기 및 클릭
    console.log('🔍 검색창 찾기...');
    const searchInput = await page.waitForSelector('input[name="q"]', { timeout: 15000 });
    await searchInput.click();
    await page.waitForTimeout(500);

    // 자연스러운 타이핑
    console.log(`⌨️ "${searchKeyword}" 자연스럽게 타이핑...`);
    await searchInput.type(searchKeyword, { delay: 150 });

    // 검색 실행
    console.log('🚀 검색 실행 (엔터 키)...');
    await searchInput.press('Enter');

    // 검색 결과 페이지 대기
    console.log('⏳ 검색 결과 페이지 로딩 대기...');
    await page.waitForTimeout(8000);

    const currentUrl = page.url();
    console.log(`📍 현재 URL: ${currentUrl}`);

    // URL이 변경되었는지 확인
    if (currentUrl.includes('search') || currentUrl.includes('/np/search')) {
      console.log('✅ 검색 결과 페이지 확인됨');
      
      // 스크롤하며 상품 수집
      for (let scroll = 0; scroll < 3; scroll++) {
        console.log(`📜 스크롤 ${scroll + 1}/3`);
        
        const products = await page.evaluate(() => {
          const foundProducts = [];
          
          // 현재 화면에 보이는 상품들 수집
          const productElements = document.querySelectorAll('[data-product-id], [data-vendor-item-id]');
          
          productElements.forEach((element, index) => {
            const productId = element.getAttribute('data-product-id') || element.getAttribute('data-vendor-item-id');
            if (productId) {
              foundProducts.push({
                rank: foundProducts.length + 1,
                productId: String(productId),
                visible: true
              });
            }
          });
          
          // 링크로부터 상품 ID 추출
          const productLinks = document.querySelectorAll('a[href*="/products/"]');
          productLinks.forEach(link => {
            const match = link.href.match(/\/projects\/(\d+)/);
            if (match) {
              const productId = match[1];
              if (!foundProducts.some(p => p.productId === productId)) {
                foundProducts.push({
                  rank: foundProducts.length + 1,
                  productId: productId,
                  href: link.href,
                  visible: false
                });
              }
            }
          });
          
          return foundProducts;
        });

        console.log(`📦 스크롤 ${scroll + 1}에서 ${products.length}개 상품 발견`);
        
        // 타겟 상품 검색
        for (const product of products) {
          if (product.productId === targetProductId) {
            foundRank = product.rank;
            console.log(`🎯 타겟 상품 발견! 순위: ${foundRank}`);
            break;
          }
        }
        
        if (foundRank) break;

        // 전체 상품 리스트에 추가
        allProducts.push(...products);

        // 다음 스크롤 전 대기 및 스크롤
        if (scroll < 2) {
          await page.waitForTimeout(1000 + Math.random() * 1000);
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 2);
          });
          await page.waitForTimeout(3000); // 새로운 콘텐츠 로딩 대기
        }
      }

      // 최종 결과
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.productId === product.productId)
      );

      console.log(`📊 총 수집된 고유 상품 수: ${uniqueProducts.length}개`);

      if (foundRank) {
        console.log(`\n🎉 성공! 상품번호 ${targetProductId}은 "${searchKeyword}" 검색 결과에서 ${foundRank}위입니다.`);
      } else {
        console.log(`\n❌ 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
        
        // 발견된 상품 일부 출력
        if (uniqueProducts.length > 0) {
          console.log(`📋 발견된 상품 예시 (최대 10개):`);
          uniqueProducts.slice(0, 10).forEach(product => {
            console.log(`  - ${product.rank}위: ${product.productId}`);
          });
        }
      }

    } else {
      console.log('❌ 검색 결과 페이지로 이동하지 못했습니다.');
      console.log(`현재 URL: ${currentUrl}`);
    }

  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
    console.log(`🔍 에러 스택:`, error.stack);
  } finally {
    await browser.close();
    console.log('\n🏁 브라우저 종료 완료');
  }
})();
