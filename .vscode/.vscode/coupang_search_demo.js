require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');

class CoupangSearchDemo {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  // 브라우저 초기화
  async initBrowser() {
    try {
      console.log('🚀 브라우저 초기화 중...');
      
      this.browser = await puppeteer.launch({
        headless: false, // 브라우저 창 표시
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-http2', // HTTP/2 비활성화
          '--disable-quic', // QUIC 비활성화
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });

      this.page = await this.browser.newPage();
      
      // User-Agent 설정
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 추가 헤더 설정
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      });

      console.log('✅ 브라우저 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  // 쿠팡 메인 페이지로 이동
  async navigateToCoupang() {
    try {
      console.log('🏠 쿠팡 메인 페이지로 이동 중...');
      
      await this.page.goto('https://www.coupang.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // 페이지 로딩 대기
      await this.page.waitForTimeout(3000);
      
      console.log('✅ 쿠팡 메인 페이지 로드 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 쿠팡 메인 페이지 로드 실패:', error);
      throw error;
    }
  }

  // 검색어 입력 및 검색
  async searchKeyword(keyword) {
    try {
      console.log(`🔍 검색어 입력: ${keyword}`);
      
      // 검색창 찾기 (여러 가능한 셀렉터 시도)
      const searchSelectors = [
        'input[name="q"]',
        'input[placeholder*="검색"]',
        'input[placeholder*="상품"]',
        '#headerSearchKeyword',
        '.search-input',
        'input[type="search"]'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            console.log(`✅ 검색창 발견: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!searchInput) {
        // 페이지 소스 확인
        const pageContent = await this.page.content();
        console.log('📄 페이지 소스 일부:', pageContent.substring(0, 1000));
        throw new Error('검색창을 찾을 수 없습니다');
      }
      
      // 검색창 클릭
      await searchInput.click();
      await this.page.waitForTimeout(1000);
      
      // 기존 텍스트 삭제
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      await this.page.waitForTimeout(500);
      
      // 검색어 입력
      await this.page.keyboard.type(keyword);
      await this.page.waitForTimeout(1000);
      
      // 검색 실행 (엔터키)
      await this.page.keyboard.press('Enter');
      
      // 검색 결과 페이지 로딩 대기
      await this.page.waitForTimeout(5000);
      
      console.log(`✅ 검색 완료: ${keyword}`);
      return true;
      
    } catch (error) {
      console.error(`❌ 검색 실패: ${keyword}`, error);
      throw error;
    }
  }

  // 상품 목록에서 특정 상품 찾기
  async findProduct(productId) {
    try {
      console.log(`📦 상품 찾기: ${productId}`);
      
      // 상품 목록 로딩 대기
      await this.page.waitForTimeout(3000);
      
      // 상품 링크가 포함된 요소들 찾기
      const productLinks = await this.page.$$('a[href*="/products/"]');
      console.log(`📋 발견된 상품 링크 수: ${productLinks.length}`);
      
      let foundRank = null;
      let foundProduct = null;
      
      for (let i = 0; i < productLinks.length; i++) {
        try {
          const href = await productLinks[i].evaluate(el => el.getAttribute('href'));
          
          if (href && href.includes(`/products/${productId}`)) {
            foundRank = i + 1; // 1부터 시작하는 순위
            foundProduct = productLinks[i];
            console.log(`✅ 상품 발견: ${productId} - ${foundRank}위`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (foundProduct) {
        // 상품 클릭
        await foundProduct.click();
        await this.page.waitForTimeout(3000);
        
        console.log(`✅ 상품 페이지로 이동: ${productId}`);
        return { rank: foundRank, product: foundProduct };
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${productId}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 상품 찾기 실패: ${productId}`, error);
      return null;
    }
  }

  // 상품 정보 추출
  async extractProductInfo() {
    try {
      console.log('📊 상품 정보 추출 중...');
      
      // 상품명 추출
      const productName = await this.page.evaluate(() => {
        const nameSelectors = [
          'h1.prod-buy-header__title',
          '.prod-buy-header__title',
          'h1[data-testid="product-title"]',
          '.product-title',
          'h1'
        ];
        
        for (const selector of nameSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
        return null;
      });
      
      // 가격 추출
      const price = await this.page.evaluate(() => {
        const priceSelectors = [
          '.total-price strong',
          '.prod-price .total-price',
          '[data-testid="price"]',
          '.price'
        ];
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent.trim()) {
            return element.textContent.trim();
          }
        }
        return null;
      });
      
      // 현재 URL에서 상품 ID 추출
      const currentUrl = this.page.url();
      const productIdMatch = currentUrl.match(/\/products\/(\d+)/);
      const productId = productIdMatch ? productIdMatch[1] : null;
      
      const productInfo = {
        id: productId,
        name: productName,
        price: price,
        url: currentUrl
      };
      
      console.log('📊 상품 정보:', productInfo);
      return productInfo;
      
    } catch (error) {
      console.error('❌ 상품 정보 추출 실패:', error);
      return null;
    }
  }

  // 전체 데모 실행
  async runDemo(keyword, productId) {
    try {
      console.log('🎬 쿠팡 검색 데모 시작...');
      console.log(`🔍 검색어: ${keyword}`);
      console.log(`📦 찾을 상품 ID: ${productId}`);
      
      // 1. 브라우저 초기화
      await this.initBrowser();
      
      // 2. 쿠팡 메인 페이지로 이동
      await this.navigateToCoupang();
      
      // 3. 검색어 입력 및 검색
      await this.searchKeyword(keyword);
      
      // 4. 상품 찾기
      const result = await this.findProduct(productId);
      
      if (result) {
        console.log(`🎉 상품 발견: ${productId} - ${result.rank}위`);
        
        // 5. 상품 정보 추출
        const productInfo = await this.extractProductInfo();
        
        return {
          success: true,
          keyword: keyword,
          productId: productId,
          rank: result.rank,
          productInfo: productInfo
        };
      } else {
        console.log(`❌ 상품을 찾을 수 없음: ${productId}`);
        return {
          success: false,
          keyword: keyword,
          productId: productId,
          error: '상품을 찾을 수 없습니다'
        };
      }
      
    } catch (error) {
      console.error('❌ 데모 실행 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 정리 작업
  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      console.log('🧹 정리 작업 완료');
    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
    }
  }
}

// 실행 함수
async function main() {
  const demo = new CoupangSearchDemo();
  
  // Ctrl+C 처리
  process.on('SIGINT', async () => {
    console.log('\n🛑 데모 종료 중...');
    await demo.cleanup();
    process.exit(0);
  });
  
  try {
    // 테스트 데이터
    const keyword = '무선마우스';
    const productId = '8473798698'; // 예시 상품 ID
    
    const result = await demo.runDemo(keyword, productId);
    
    console.log('\n📊 최종 결과:', JSON.stringify(result, null, 2));
    
    // 10초 대기 후 종료
    console.log('\n⏳ 10초 후 브라우저 종료...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ 데모 실행 실패:', error);
  } finally {
    await demo.cleanup();
  }
}

// 직접 실행
if (require.main === module) {
  main();
}

module.exports = CoupangSearchDemo;














