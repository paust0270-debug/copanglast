// @ts-check

/**
 * 쿠팡 검색 페이지에서 자연스러운 타이핑으로 검색하여
 * 특정 상품의 순위를 확인하는 Playwright MCP 스크립트
 */

const { chromium } = require('playwright');

/**
 * 랜덤 딜레이 생성 (100~200ms)
 */
function getRandomDelay() {
  return Math.floor(Math.random() * 101) + 100; // 100~200ms
}

/**
 * 스크롤 구간별 랜덤 대기 시간 (500~1500ms)
 */
function getScrollDelay() {
  return Math.floor(Math.random() * 1001) + 500; // 500~1500ms
}

/**
 * 자연스러운 타이핑 시뮬레이션
 */
async function naturalType(page, selector, text, delayRange = [100, 200]) {
  await page.click(selector);
  await page.waitForTimeout(300); // 초기 클릭 후 대기
  
  for (let char of text) {
    await page.keyboard.type(char);
    const delay = Math.floor(Math.random() * (delayRange[1] - delayRange[0] + 1)) + delayRange[0];
    await page.waitForTimeout(delay);
  }
}

/**
 * 상품 정보에서 product ID 추출
 */
function extractProductId(productElement) {
  try {
    // 방법 1: data-product-id 속성에서 추출
    let productId = productElement.getAttribute('data-product-id');
    if (productId) return productId;

    // 방법 2: URL에서 추출
    const links = productElement.querySelectorAll('a');
    for (let link of links) {
      const href = link.getAttribute('href');
      if (href && href.includes('/products/')) {
        const match = href.match(/\/products\/(\d+)/);
        if (match) return match[1];
      }
    }

    // 방법 3: onClick 이벤트나 다른 속성에서 추출
    const onclickAttr = productElement.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/productId[=:]\s*[\'"]?(\d+)[\'"]?/);
      if (match) return match[1];
    }

    return null;
  } catch (error) {
    console.log(`상품 ID 추출 중 오류: ${error.message}`);
    return null;
  }
}

/**
 * 메인 함수: 쿠팡 검색 및 상품 순위 확인
 */
async function checkProductRank(targetProductId = '8617045901') {
  console.log(`🎯 상품번호 ${targetProductId}의 순위를 확인하기 시작합니다...`);
  console.log('🔍 검색 키워드: 자전거 자물쇠');
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창을 보이게 설정 (디버깅용)
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });

    const page = await context.newPage();

    // 네트워크 요청 차단 (성능 최적화)
    await page.route('**/*', (route) => {
      const request = route.request();
      const resourceType = request.resourceType();
      
      // 이미지, 폰트, CSS 등은 차단하여 빠른 로딩
      if (['image', 'font', 'stylesheet', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    console.log('📱 쿠팡 메인 페이지로 이동 중...');
    await page.goto('https://www.coupang.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // 검색창 선택자들 (다양한 경우에 대비)
    const searchSelectors = [
      'input[name="q"]',
      'input[placeholder*="검색"]',
      '#headerKeyword',
      '.header__search input',
      'input[type="search"]',
      'input[id*="search"]'
    ];

    let searchInput = null;
    for (let selector of searchSelectors) {
      try {
        searchInput = await page.waitForSelector(selector, { timeout: 5000 });
        if (searchInput) {
          console.log(`🔍 검색창 발견: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!searchInput) {
      console.error('❌ 검색창을 찾을 수 없습니다.');
      return;
    }

    console.log('⌨️ 자연스러운 타이핑으로 검색어 입력 중...');
    await naturalType(page, searchInput, '자전거 자물쇠');

    console.log('🔍 검색 실행...');
    await page.keyboard.press('Enter');
    
    // 검색 결과 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    try {
      // 검색 결과가 로드될 때까지 대기
      await page.waitForSelector('[data-component-type="s-product-list"]', { timeout: 100사 });
      console.log('✅ 검색 결과 페이지 로딩 완료');
    } catch (error) {
      console.log('⚠️ 검색 결과 페이지 구조가 예상과 다릅니다. 계속 진행합니다.');
    }

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
      
      // 스크롤 후 대기
      const stageDelay = getScrollDelay();
      console.log(`⏱️ ${stageDelay}ms 대기 중...`);
      await page.waitForTimeout(stageDelay);
      
      // 현재 화면의 상품들 수집
      const currentProducts = await page.evaluate((extractProductIdFunction) => {
        const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
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
                  const match = href.match(/\/products\/(\d+)/);
                  if (match) {
                    productId = match[1];
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
      }, extractProductId);
      
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

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  // 커맨드라인 인자로 특정 상품 ID 받기
  const targetProductId = process.argv[2] || '8617045901';
  
  checkProductRank(targetProductId)
    .then(() => {
      console.log('✅ 순위 확인 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { checkProductRank };
