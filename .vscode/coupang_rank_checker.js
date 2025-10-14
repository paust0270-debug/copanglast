require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class CoupangRankChecker {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    this.results = [];
    this.currentIP = null;
    this.checkInterval = 10000; // 10초 간격
    
    console.log('🚀 쿠팡 순위 체크 시스템 초기화');
  }

  // 현재 IP 확인
  async getCurrentIP() {
    try {
      const response = await fetch('https://ipinfo.io/ip');
      this.currentIP = await response.text();
      console.log(`📍 현재 IP: ${this.currentIP.trim()}`);
      return this.currentIP.trim();
    } catch (error) {
      console.error('❌ IP 확인 실패:', error);
      return null;
    }
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
          '--disable-renderer-backgrounding',
          '--no-sandbox', // 성능 향상
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps'
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
      
      // 쿠팡 메인 페이지 URL
      const coupangUrl = 'https://www.coupang.com/';
      
      await this.page.goto(coupangUrl, {
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
      
      // 페이지 로딩 완료 대기
      await this.page.waitForTimeout(2000);
      
      // 검색창 찾기 (더 정확한 셀렉터들)
      const searchSelectors = [
        'input[name="q"]',
        'input[placeholder*="검색"]',
        'input[placeholder*="상품"]',
        '#headerSearchKeyword',
        '.search-input',
        'input[type="search"]',
        'input[class*="search"]',
        'input[data-testid*="search"]',
        'input[id*="search"]',
        'input[aria-label*="검색"]'
      ];
      
      let searchInput = null;
      let foundSelector = null;
      
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            foundSelector = selector;
            console.log(`✅ 검색창 발견: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!searchInput) {
        // 페이지의 모든 input 요소 확인
        const allInputs = await this.page.$$('input');
        console.log(`📋 페이지의 input 요소 수: ${allInputs.length}`);
        
        for (let i = 0; i < allInputs.length; i++) {
          try {
            const inputType = await allInputs[i].evaluate(el => el.type);
            const inputPlaceholder = await allInputs[i].evaluate(el => el.placeholder);
            const inputName = await allInputs[i].evaluate(el => el.name);
            const inputId = await allInputs[i].evaluate(el => el.id);
            
            console.log(`Input ${i}: type=${inputType}, placeholder=${inputPlaceholder}, name=${inputName}, id=${inputId}`);
            
            if (inputType === 'text' || inputType === 'search') {
              searchInput = allInputs[i];
              foundSelector = `input[${i}]`;
              console.log(`✅ 검색창으로 추정: ${foundSelector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      if (!searchInput) {
        // 페이지 소스 확인
        const pageContent = await this.page.content();
        console.log('📄 페이지 소스 일부:', pageContent.substring(0, 2000));
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

  // 상품 순위 확인
  async checkProductRank(productId) {
    try {
      console.log(`📦 상품 순위 확인: ${productId}`);
      
      // 상품 목록 로딩 대기
      await this.page.waitForTimeout(3000);
      
      // 상품 링크가 포함된 요소들 찾기
      const productLinks = await this.page.$$('a[href*="/products/"]');
      console.log(`📋 발견된 상품 링크 수: ${productLinks.length}`);
      
      let foundRank = null;
      
      for (let i = 0; i < productLinks.length; i++) {
        try {
          const href = await productLinks[i].evaluate(el => el.getAttribute('href'));
          
          if (href && href.includes(`/products/${productId}`)) {
            foundRank = i + 1; // 1부터 시작하는 순위
            console.log(`✅ 상품 발견: ${productId} - ${foundRank}위`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (foundRank) {
        console.log(`✅ 상품 순위 확인: ${productId} - ${foundRank}위`);
        return foundRank;
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${productId}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 순위 확인 실패: ${productId}`, error);
      return null;
    }
  }

  // 상품번호 추출
  extractProductId(linkUrl) {
    const match = linkUrl.match(/products\/(\d+)/);
    return match ? match[1] : null;
  }

  // 키워드 작업 가져오기
  async getKeywordsForRankCheck() {
    try {
      console.log('📋 키워드 작업 가져오기...');
      
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('slot_type', 'coupang')
        .order('id', { ascending: true })
        .limit(1); // 한 번에 하나씩 처리
      
      if (error) {
        console.error('❌ keywords 조회 실패:', error);
        return null;
      }
      
      if (!keywords || keywords.length === 0) {
        console.log('📝 처리할 작업 없음');
        return null;
      }
      
      console.log(`✅ 키워드 작업 발견: ${keywords[0].keyword}`);
      return keywords[0];
      
    } catch (error) {
      console.error('❌ 키워드 작업 가져오기 실패:', error);
      return null;
    }
  }

  // slot_status 테이블 업데이트
  async updateSlotStatus(keyword, rank) {
    try {
      console.log(`📊 slot_status 업데이트: ${keyword.keyword} - ${rank}위`);
      
      // 기존 start_rank 확인
      const { data: existingSlotStatus, error: fetchError } = await supabase
        .from('slot_status')
        .select('start_rank')
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ slot_status 조회 실패:', fetchError);
        throw fetchError;
      }
      
      const updatePayload = {
        current_rank: rank,
        last_check_date: new Date().toISOString()
      };
      
      // start_rank가 없으면 현재 순위를 시작 순위로 설정
      if (!existingSlotStatus || existingSlotStatus.start_rank === null) {
        updatePayload.start_rank = rank;
        console.log(`🆕 시작 순위 설정: ${rank}위`);
      }
      
      const { error: updateError } = await supabase
        .from('slot_status')
        .update(updatePayload)
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url);
      
      if (updateError) {
        console.error('❌ slot_status 업데이트 실패:', updateError);
        throw updateError;
      }
      
      console.log(`✅ slot_status 업데이트 완료: ${keyword.keyword}`);
      return updatePayload;
      
    } catch (error) {
      console.error('❌ slot_status 업데이트 오류:', error);
      throw error;
    }
  }

  // rank_history 테이블에 순위 기록 저장
  async saveRankHistory(keyword, rank, startRank) {
    try {
      console.log(`📝 rank_history 저장: ${keyword.keyword} - ${rank}위`);
      
      // slot_status 테이블에서 해당 레코드 ID 찾기
      const { data: slotStatus, error: findError } = await supabase
        .from('slot_status')
        .select('id')
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url)
        .single();
      
      if (findError || !slotStatus) {
        console.log(`⚠️ slot_status 레코드를 찾을 수 없음: ${keyword.keyword}`);
        return;
      }
      
      // rank_history 테이블에 저장
      const { error } = await supabase
        .from('rank_history')
        .insert({
          slot_status_id: slotStatus.id,
          keyword: keyword.keyword,
          link_url: keyword.link_url,
          current_rank: rank,
          start_rank: startRank,
          check_date: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ rank_history 저장 실패:', error);
      } else {
        console.log(`✅ rank_history 저장 완료: ${keyword.keyword}`);
      }
    } catch (error) {
      console.error('❌ rank_history 저장 오류:', error);
    }
  }

  // 단일 키워드 처리
  async processKeyword(keyword, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      console.log(`\n🔍 키워드 처리 시작: ${keyword.keyword} (시도 ${retryCount + 1}/${maxRetries + 1})`);
      
      // 상품번호 추출
      const productId = this.extractProductId(keyword.link_url);
      if (!productId) {
        console.log(`❌ 상품번호 추출 실패: ${keyword.link_url}`);
        return { success: false, error: '상품번호 추출 실패' };
      }
      
      // 쿠팡 메인 페이지로 이동
      await this.navigateToCoupang();
      
      // 검색어 입력 및 검색
      await this.searchKeyword(keyword.keyword);
      
      // 순위 확인
      const rank = await this.checkProductRank(productId);
      
      if (rank) {
        // slot_status 테이블 업데이트
        const updateResult = await this.updateSlotStatus(keyword, rank);
        
        // rank_history 테이블에 저장
        await this.saveRankHistory(keyword, rank, updateResult.start_rank);
        
        // keywords 테이블에서 삭제
        await supabase
          .from('keywords')
          .delete()
          .eq('id', keyword.id);
        
        console.log(`✅ 키워드 처리 완료: ${keyword.keyword} - ${rank}위`);
        
        return {
          success: true,
          keyword: keyword.keyword,
          rank: rank,
          start_rank: updateResult.start_rank,
          timestamp: new Date().toISOString()
        };
      } else {
        console.log(`⚠️ 순위 확인 실패: ${keyword.keyword}`);
        return { success: false, error: '순위 확인 실패' };
      }
      
    } catch (error) {
      console.error(`❌ 키워드 처리 실패: ${keyword.keyword}`, error);
      
      // HTTP/2 오류인 경우 재시도
      if (error.message.includes('ERR_HTTP2_PROTOCOL_ERROR') && retryCount < maxRetries) {
        console.log(`🔄 HTTP/2 오류로 인한 재시도: ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        return await this.processKeyword(keyword, retryCount + 1);
      }
      
      // 최대 재시도 횟수 초과 시 키워드 삭제
      if (retryCount >= maxRetries) {
        console.log(`❌ 최대 재시도 횟수 초과, 키워드 삭제: ${keyword.keyword}`);
        await supabase
          .from('keywords')
          .delete()
          .eq('id', keyword.id);
      }
      
      return { success: false, error: error.message };
    }
  }

  // 메인 순위 체크 실행
  async runRankCheck() {
    if (this.isRunning) {
      console.log('⚠️ 이미 실행 중입니다');
      return;
    }

    this.isRunning = true;
    this.results = [];

    try {
      console.log('🚀 쿠팡 순위 체크 시작...');
      
      // 1. 현재 IP 확인
      await this.getCurrentIP();
      
      // 2. 브라우저 초기화
      await this.initBrowser();
      
      // 3. 무한 루프로 작업 처리
      while (this.isRunning) {
        try {
          console.log(`\n[${new Date().toLocaleString()}] 작업 가져오기...`);
          
          // 키워드 작업 가져오기
          const keyword = await this.getKeywordsForRankCheck();
          
          if (keyword) {
            // 키워드 처리
            const result = await this.processKeyword(keyword);
            this.results.push(result);
            
            // 처리 간격 (API 부하 방지)
            console.log('⏳ 5초 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
          } else {
            // 작업이 없으면 10초 대기
            console.log('⏳ 10초 후 다음 시작...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
          
        } catch (error) {
          console.error('❌ 작업 처리 중 오류:', error);
          console.log('⏳ 10초 후 재시도...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
      
    } catch (error) {
      console.error('❌ 순위 체크 시스템 오류:', error);
      throw error;
    } finally {
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  // 시스템 중지
  async stop() {
    console.log('🛑 순위 체크 시스템 중지...');
    this.isRunning = false;
    
    if (this.browser) {
      await this.browser.close();
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
  const rankChecker = new CoupangRankChecker();
  
  // Ctrl+C 처리
  process.on('SIGINT', async () => {
    console.log('\n🛑 시스템 종료 중...');
    await rankChecker.stop();
    process.exit(0);
  });
  
  try {
    await rankChecker.runRankCheck();
  } catch (error) {
    console.error('❌ 시스템 실행 실패:', error);
  } finally {
    await rankChecker.cleanup();
  }
}

// 직접 실행
if (require.main === module) {
  main();
}

module.exports = CoupangRankChecker;
