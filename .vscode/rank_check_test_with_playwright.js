#!/usr/bin/env node

/**
 * 쿠팡 순위체크 로직 테스트 파일
 * Playwright MCP를 이용한 실제 검색 테스트
 */

const { test } = require('@playwright/test');

// 테스트 설정
const TEST_CONFIG = {
  keyword: '장난감',
  targetProductId: '8617045901',
  searchUrl: 'https://www.coupang.com/np/search?q=',
  maxProducts: 100,
  scrollDelay: {
    min: 500,
    max: 1500
  },
  typeDelay: {
    min: 100,
    max: 200
  }
};

/**
 * 랜덤 딜레이 생성
 * @param {number} min 최소값
 * @param {number} max 최대값
 * @returns {number} 랜덤 딜레이 시간(ms)
 */
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 사람이 타이핑하는 것처럼 텍스트 입력
 * @param {Object} page Playwright page 객체
 * @param {string} selector 선택자
 * @param {string} text 입력할 텍스트
 */
async function humanLikeTyping(page, selector, text) {
  console.log(`⌨️  "${text}" 입력 시작...`);
  
  for (const char of text) {
    await page.fill(selector, '', { timeout: 10000 });
    await page.type(selector, char, { delay: getRandomDelay(TEST_CONFIG.typeDelay.min, TEST_CONFIG.typeDelay.max) });
  }
  
  console.log(`✅ 입력 완료: "${text}"`);
}

/**
 * 스크롤을 통해 상품 목록 로딩
 * @param {Object} page Playwright page 객체
 */
async function scrollAndLoadProducts(page) {
  console.log('📜 상품 목록 스크롤 시작...');
  
  const scrollSteps = 3; // 2~3번에 나눠서 스크롤
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  
  for (let i = 0; i < scrollSteps; i++) {
    console.log(`📜 스크롤 단계 ${i + 1}/${scrollSteps}`);
    
    // 스크롤 실행
    await page.evaluate(async (step, viewHeight) => {
      window.scrollTo(0, viewHeight * (step + 1) * 0.7);
      await new Promise(resolve => setTimeout(resolve, 100));
    }, i, viewportHeight);
    
    // 랜덤 대기
    const delay = getRandomDelay(TEST_CONFIG.scrollDelay.min, TEST_CONFIG.scrollDelay.max);
    console.log(`⏳ ${delay}ms 대기 중...`);
    await page.waitForTimeout(delay);
    
    // 상품 로딩 확인
    const loadedProducts = await page.locator('[data-product-id]').count();
    console.log(`📦 현재까지 로딩된 상품 수: ${loadedProducts}개`);
    
    if (loadedProducts >= TEST_CONFIG.maxProducts) {
      console.log(`🎯 목표 상품 수(${TEST_CONFIG.maxProducts}개) 도달`);
      break;
    }
  }
  
  console.log('✅ 스크롤 완료');
}

/**
 * 상품 카드에서 product ID 추출
 * @param {Object} productElement 상품 요소
 * @returns {string|null} 상품 ID
 */
async function extractProductId(productElement) {
  try {
    // 방법 1: data-product-id 속성 확인
    const dataProductId = await productElement.getAttribute('data-product-id');
    if (dataProductId) {
      return dataProductId.trim();
    }
    
    // 방법 2: productId 파라미터 확인
    const productLink = await productElement.locator('a[href*="products"]').first();
    const href = await productLink.getAttribute('href');
    if (href) {
      const productIdMatch = href.match(/products\/(\d+)/);
      if (productIdMatch && productIdMatch[1]) {
        return productIdMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 순위체크 메인 테스트 함수
 */
async function performRankCheckTest(page) {
  try {
    console.log('🚀 쿠팡 순위체크 테스트 시작');
    console.log(`🎯 검색 키워드: "${TEST_CONFIG.keyword}"`);
    console.log(`🎯 대상 상품번호: "${TEST_CONFIG.targetProductId}"`);
    console.log(`🎯 최대 검색 상품 수: ${TEST_CONFIG.maxProducts}개`);
    console.log('=' * 60);
    
    // 1. 쿠팡 검색 페이지로 이동
    console.log('🌐 쿠팡 검색 페이지로 이동 중...');
    const searchUrl = `${TEST_CONFIG.searchUrl}${encodeURIComponent(TEST_CONFIG.keyword)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // 2. 검색창에 키워드 입력 (사람이 타이핑하는 것처럼)
    const searchInputSelector = 'input[name="q"], input[placeholder*="검색"], input[data-testid="search-keyword"]';
    await page.waitForSelector(searchInputSelector, { timeout: 10000 });
    
    console.log('📝 검색창에 키워드 입력 시작...');
    await humanLikeTyping(page, searchInputSelector, TEST_CONFIG.keyword);
    
    // Enter 키로 검색 실행
    await page.press(searchInputSelector, 'Enter');
    console.log('🔍 검색 실행');
    
    // 3. 검색 결과 페이지 로딩 대기
    console.log('⏳ 검색 결과 페이지 로딩 대기 중...');
    await page.waitForSelector('[data-product-id], .search-product', { timeout: 15000 });
    
    // 4. 스크롤을 통해 상품 목록 로딩
    await scrollAndLoadProducts(page);
    
    // 5. 상품 카드 분석 및 순위 확인
    console.log('🔍 상품 카드 분석 시작...');
    
    // 상품 카드 선택자들 (여러 가능성 고려)
    const productSelectors = [
      '[data-product-id]',
      '.search-product',
      '.product-item',
      'li[data-bkid]'
    ];
    
    let allProducts = [];
    
    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`📦 선택자 "${selector}"로 ${count}개 상품 발견`);
        allProducts = await page.locator(selector).first().all();
        break;
      }
    }
    
    if (allProducts.length === 0) {
      throw new Error('검색 결과에서 상품을 찾을 수 없습니다.');
    }
    
    console.log(`📊 총 ${allProducts.length}개 상품 분석 시작`);
    
    // 6. 각 상품에서 상품 번호 추출 및 순위 확인
    let foundRank = null;
    
    for (let i = 0; i < allProducts.length && i < TEST_CONFIG.maxProducts; i++) {
      const productElement = allProducts[i];
      const productId = await extractProductId(productElement);
      
      if (productId) {
        console.log(`🔍 순위 ${i + 1}: 상품번호 ${productId}`);
        
        // 목표 상품번호와 비교
        if (productId === TEST_CONFIG.targetProductId) {
          foundRank = i + 1;
          console.log(`🎯 목표 상품 발견! 순위: ${foundRank}`);
          break;
        }
      } else {
        console.log(`⚠️  순위 ${i + 1}: 상품번호 추출 실패`);
      }
    }
    
    // 7. 결과 출력
    console.log('=' * 60);
    if (foundRank) {
      console.log(`✅ 상품번호 ${TEST_CONFIG.targetProductId}은 ${TEST_CONFIG.keyword} 검색 결과에서 ${foundRank}위입니다.`);
    } else {
      console.log(`❌ 상품번호 ${TEST_CONFIG.targetProductId}은 ${TEST_CONFIG.keyword} 검색 결과에서 상위 ${TEST_CONFIG.maxProducts}위 안에 없습니다.`);
    }
    console.log('=' * 60);
    
    return {
      success: true,
      keyword: TEST_CONFIG.keyword,
      targetProductId: TEST_CONFIG.targetProductId,
      rank: foundRank,
      totalAnalyzed: Math.min(allProducts.length, TEST_CONFIG.maxProducts)
    };
    
  } catch (error) {
    console.error('❌ 순위체크 테스트 실패:', error.message);
    return {
      success: false,
      error: error.message,
      keyword: TEST_CONFIG.keyword,
      targetProductId: TEST_CONFIG.targetProductId
    };
  }
}

// Playwright 테스트 케이스 정의
test('쿠팡 순위체크 테스트', async ({ page }) => {
  // 브라우저 설정
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // User-Agent 설정 (봇 차단 방지)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // 요청 차단 설정 (스크립트 실행 비활성화 가능)
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();
    if (resourceType === 'font' || resourceType === 'image') {
      route.abort();
    } else {
      route.continue();
    }
  });
  
  // 메인 테스트 실행
  const result = await performRankCheckTest(page);
  
  // 최종 결과 출력
  console.log('\n🎯 최종 테스트 결과:');
  console.log(JSON.stringify(result, null, 2));
});

// 독립 실행용 메인 함수
async function main() {
  console.log('🚀 순위체크 테스트 파일이 준비되었습니다.');
  console.log('📋 테스트 조건:');
  console.log(`   - 검색 키워드: "${TEST_CONFIG.keyword}"`);
  console.log(`   - 대상 상품번호: "${TEST_CONFIG.targetProductId}"`);
  console.log(`   - 최대 검색 상품 수: ${TEST_CONFIG.maxProducts}개`);
  console.log(`   - 투입 키 속도: ${TEST_CONFIG.typeDelay.min}-${TEST_CONFIG.typeDelay.max}ms`);
  console.log(`   - 스크롤 지연: ${TEST_CONFIG.scrollDelay.min}-${TEST_CONFIG.scrollDelay.max}ms`);
  
  console.log('\n💡 실행 방법:');
  console.log('   1. npx playwright test rank_check_test_with_playwright.js');
  console.log('   2. 또는 node rank_check_test_with_playwright.js');
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  performRankCheckTest,
  TEST_CONFIG
};
