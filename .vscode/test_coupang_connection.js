const puppeteer = require('puppeteer');

async function testCoupangConnection() {
  let browser = null;
  
  try {
    console.log('🔍 쿠팡 연결 테스트 시작...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });

    const page = await browser.newPage();
    
    // 요청 인터셉션 설정
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 에러 핸들링
    page.on('error', (err) => {
      console.error('❌ 페이지 에러:', err);
    });

    page.on('pageerror', (err) => {
      console.error('❌ 페이지 스크립트 에러:', err);
    });

    // 1. 메인 페이지 테스트
    console.log('📱 쿠팡 메인 페이지 접속 테스트...');
    try {
      await page.goto('https://www.coupang.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const title = await page.title();
      console.log('✅ 메인 페이지 접속 성공:', title);
      
      // 페이지 로딩 대기
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.error('❌ 메인 페이지 접속 실패:', error.message);
      return;
    }

    // 2. 검색 페이지 테스트
    console.log('🔍 검색 페이지 테스트...');
    try {
      const searchUrl = 'https://www.coupang.com/np/search?q=트롤리';
      console.log('검색 URL:', searchUrl);
      
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const searchTitle = await page.title();
      console.log('✅ 검색 페이지 접속 성공:', searchTitle);
      
      // 검색 결과 확인
      await page.waitForTimeout(3000);
      
      const productLinks = await page.$$('a[href*="/products/"]');
      console.log(`📦 발견된 상품 링크 수: ${productLinks.length}`);
      
      if (productLinks.length > 0) {
        console.log('✅ 검색 결과 정상적으로 로드됨');
        
        // 첫 번째 상품 링크 확인
        const firstLink = await productLinks[0].evaluate(el => el.getAttribute('href'));
        console.log('첫 번째 상품 링크:', firstLink);
        
      } else {
        console.log('⚠️ 검색 결과를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.error('❌ 검색 페이지 접속 실패:', error.message);
      
      // 현재 페이지 URL 확인
      const currentUrl = page.url();
      console.log('현재 페이지 URL:', currentUrl);
      
      // 페이지 내용 일부 확인
      try {
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.log('페이지 내용 (처음 500자):', bodyText.substring(0, 500));
      } catch (e) {
        console.log('페이지 내용을 읽을 수 없습니다');
      }
    }

    // 3. 모바일 페이지 테스트
    console.log('📱 모바일 페이지 테스트...');
    try {
      await page.goto('https://m.coupang.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      const mobileTitle = await page.title();
      console.log('✅ 모바일 페이지 접속 성공:', mobileTitle);
      
    } catch (error) {
      console.error('❌ 모바일 페이지 접속 실패:', error.message);
    }

  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 실행
testCoupangConnection().catch(console.error);














