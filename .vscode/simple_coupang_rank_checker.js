const { chromium } = require("playwright");

async function checkProductRank() {
  const targetProductId = '8617045901';
  
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인하기 시작합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');

  const browser = await chromium.launch({
    headless: false, // 진짜 브라우저처럼 보이게
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
  });
  
  const page = await context.newPage();

  try {
    console.log('📱 쿠팡 메인 페이지로 이동 중...');
    await page.goto("https://www.coupang.com", { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });

    // 정상 로드 되었는지 확인
    await page.screenshot({ path: "coupang_home.png" });
    console.log('✅ 쿠팡 메인 페이지 로드 완료!');

    // 검색창 찾기
    console.log('🔍 검색창 찾는 중...');
    const searchInput = await page.waitForSelector('input[name="q"]', { timeout: 10000 });
    
    if (!searchInput) {
      console.log('❌ 검색창을 찾을 수 없습니다.');
      return;
    }

    console.log('✅ 검색창 발견!');

    // 자연스러운 타이핑으로 검색어 입력
    console.log('⌨️ 자연스러운 타이핑으로 "자전거 자물쇠" 입력 중...');
    
    await page.click('input[name="q"]');
    await page.waitForTimeout(300);
    
    const searchKeyword = "자전거 자물쇠";
    for (let char of searchKeyword) {
      await page.keyboard.type(char);
      // 100~200ms 랜덤 딜레이
      const delay = Math.floor(Math.random() * 101) + 100;
      await page.waitForTimeout(delay);
    }

    console.log('🔍 검색 실행...');
    await page.keyboard.press('Enter');
    
    // 검색 결과 페이지 로딩 대기
    console.log('⏳ 검색 결과 페이지 로딩 중...');
    await page.waitForTimeout(3000);

    // 스크린샷으로 검색 결과 확인
    await page.screenshot({ path: "search_results.png" });

    console.log('📜 상품 리스트를 스크롤하며 수집 중...');
    
    let allProducts = new Set();
    let productsCollected = 0;
    const maxProducts = 100;
    
    // 스크롤을 3단계로 나누어 진행
    const scrollStages = [30, 60, 100]; // 퍼센트 단위
    
    for (let stageIndex = 0; stageIndex < scrollStages.length; stageIndex++) {
      const targetPercent = scrollStages[stageIndex];
      console.log(`📜 ${stageIndex + 1}단계 스크롤: ${targetPercent}% 위치로 이동...`);
      
      // 현재 페이지 높이의 해당 퍼센트 위치로 스크롤
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const targetY = (scrollHeight * targetPercent) / 100;
      
      await page.evaluate((y) => {
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
      }, targetY);
      
      // 스크롤 후 대기 (500~1500ms 랜덤)
      const stageDelay = Math.floor(Math.random() * 1001) + 500;
      console.log(`⏱️ ${stageDelay}ms 대기 중...`);
      await page.waitForTimeout(stageDelay);
      
      // 현재 화면의 상품들 수집
      const currentProducts = await page.evaluate(() => {
        // 다양한 상품 선택자 시도
        const selectors = [
          '[data-component-type="s-search-result"]',
          '[data-feature-name="searchProductItem"]',
          '.search-product',
          '[data-target-id*="product"]'
        ];
        
        let productElements = [];
        
        for (let selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            productElements = elements;
            console.log(`상품 요소 발견: ${selector} (${elements.length}개)`);
            break;
          }
        }
        
        const products = [];
        
        for (let element of productElements) {
          let productId = null;
          
          try {
            // 방법 1: data-product-id 속성
            productId = element.getAttribute('data-product-id');
            if (!productId) {
              // 방법 2: URL에서 추출
              const links = element.querySelectorAll('a');
              for (let link of links) {
                const href = link.getAttribute('href');
                if (href && href.includes('/products/')) {
                  console.log('상품 URL 발견:', href);
                  const match = href.match(/\/products\/(\d+)/);
                  if (match) {
                    productId = match[1];
                    console.log('상품 ID 추출:', productId);
                    break;
                  }
                }
              }
            }
            
            if (productId) {
              products.push(productId);
            }
          } catch (error) {
            continue;
          }
        }
        
        return products;
      });
      
      // 새로 발견된 상품들 추가
      let newProducts = 0;
      for (let productId of currentProducts) {
        if (!allProducts.has(productId)) {
          allProducts.add(productId);
          productsCollected++;
          newProducts++;
        }
      }
      
      console.log(`📦 이번 단계에서 ${newProducts}개 새 상품 발견. 총 ${productsCollected}개 수집됨`);
      
      if (productsCollected >= maxProducts) {
        console.log(`🎯 목표 상품 수(${maxProducts}개) 달성!`);
        break;
      }
    }

    // 최종적으로 모든 수집된 상품들을 배열로 변환
    const allProductsArray = Array.from(allProducts);
    console.log(`📊 총 ${allProductsArray.length}개 상품 수집 완료`);
    
    // 타겟 상품 찾기
    const targetIndex = allProductsArray.findIndex(productId => productId === targetProductId);
    
    if (targetIndex !== -1) {
      const rank = targetIndex + 1;
      console.log(`🎉 찾았습니다! 상품번호 ${targetProductId}은 자전거 자물쇠 검색 결과에서 ${rank}위입니다.`);
    } else {
      console.log(`😔 상품번호 ${targetProductId}은 상위 100위 안에 없습니다.`);
    }
    
    // 상세 정보 출력
    console.log('\n📋 수집된 상품 목록 (처음 10개):');
    allProductsArray.slice(0, 10).forEach((productId, index) => {
      const marker = productId === targetProductId ? '🎯' : '📦';
      console.log(`  ${marker} ${index + 1}위: ${productId}`);
    });

    // 최종 스크린샷 저장
    await page.screenshot({ 
      path: 'final_search_results.png',
      fullPage: true 
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    
    // 오류 발생 시 스크린샷 저장
    try {
      await page.screenshot({ path: "error_screenshot.png" });
    } catch (screenshotError) {
      console.log('스크린샷 저장 실패');
    }
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
