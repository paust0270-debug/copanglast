const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class CoupangRankCheckerGUI {
  constructor() {
    this.mainWindow = null;
    this.browser = null;
    this.page = null;
    this.isRunning = false;
    this.results = [];
  }

  async createWindow() {
    // 메인 윈도우 생성
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      icon: path.join(__dirname, 'assets/icon.png'), // 아이콘 파일 경로
      title: '쿠팡 순위 체크 시스템 v1.0'
    });

    // HTML 파일 로드
    this.mainWindow.loadFile('index.html');

    // 개발자 도구 열기 (개발 시에만)
    // this.mainWindow.webContents.openDevTools();

    // 윈도우가 닫힐 때
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  async initPuppeteer() {
    try {
      console.log('🚀 Chrome 브라우저 시작 중...');
      
      this.browser = await puppeteer.launch({
        headless: false, // 브라우저를 보이게 함
        defaultViewport: null,
        args: [
          '--start-maximized',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // 모바일 환경 설정
      await this.page.setUserAgent('Coupang/6.0.0 (Android 14; SM-G998N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36');
      
      // 뷰포트 설정 (모바일)
      await this.page.setViewport({
        width: 375,
        height: 667,
        isMobile: true,
        hasTouch: true
      });

      console.log('✅ Chrome 브라우저 초기화 완료');
      return true;
      
    } catch (error) {
      console.error('❌ Chrome 브라우저 초기화 실패:', error);
      return false;
    }
  }

  async checkMobileNetwork() {
    try {
      console.log('🌐 모바일 네트워크 환경 확인 중...');
      
      await this.page.goto('https://ipinfo.io/json', { waitUntil: 'networkidle2' });
      const content = await this.page.content();
      
      // JSON 데이터 추출
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('IP 정보를 가져올 수 없습니다');
      }
      
      const ipInfo = JSON.parse(jsonMatch[0]);
      
      console.log(`📍 현재 IP: ${ipInfo.ip}`);
      console.log(`🏢 ISP: ${ipInfo.org}`);
      console.log(`🌍 지역: ${ipInfo.city}, ${ipInfo.country}`);
      
      // 모바일 통신사 IP 확인
      const mobileISPs = ['KT', 'SKT', 'LG U+', 'SK Telecom', 'LGU+'];
      const isMobile = mobileISPs.some(isp => ipInfo.org.includes(isp));
      
      if (isMobile) {
        console.log('✅ 모바일 IP 확인됨');
        return { success: true, isMobile: true, ipInfo };
      } else {
        console.log('⚠️ 모바일 IP가 아닙니다 (일반 인터넷)');
        return { success: true, isMobile: false, ipInfo };
      }
      
    } catch (error) {
      console.error('❌ 네트워크 확인 실패:', error);
      return { success: false, error: error.message };
    }
  }

  async checkCoupangRank(keyword, linkUrl) {
    try {
      console.log(`🔍 순위 체크: ${keyword}`);
      
      const productId = this.extractProductId(linkUrl);
      if (!productId) {
        console.log(`❌ 상품번호 추출 실패: ${linkUrl}`);
        return null;
      }
      
      console.log(`📦 상품번호: ${productId}`);
      
      // 쿠팡 검색 페이지로 이동
      const searchUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
      
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // 페이지 로딩 대기
      await this.page.waitForTimeout(3000);
      
      // 상품 목록에서 해당 상품 찾기
      const rank = await this.page.evaluate((targetProductId) => {
        const products = document.querySelectorAll('.search-product');
        let foundRank = null;
        
        products.forEach((product, index) => {
          const link = product.querySelector('a[href*="products/"]');
          if (link && link.href.includes(`products/${targetProductId}`)) {
            foundRank = index + 1;
          }
        });
        
        return foundRank;
      }, productId);
      
      if (rank) {
        console.log(`✅ 순위 체크 완료: ${keyword} - ${rank}위`);
        
        // 해당 상품 하이라이트
        await this.page.evaluate((targetProductId) => {
          const products = document.querySelectorAll('.search-product');
          products.forEach((product) => {
            const link = product.querySelector('a[href*="products/"]');
            if (link && link.href.includes(`products/${targetProductId}`)) {
              product.style.border = '3px solid #ff6b6b';
              product.style.backgroundColor = '#fff5f5';
            }
          });
        }, productId);
        
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${keyword}`);
      }
      
      return rank;
      
    } catch (error) {
      console.error(`❌ 순위 체크 실패: ${keyword}`, error);
      return null;
    }
  }

  extractProductId(linkUrl) {
    const match = linkUrl.match(/products\/(\d+)/);
    return match ? match[1] : null;
  }

  async updateSlotStatus(keyword, rank) {
    try {
      const { error } = await supabase
        .from('slot_status')
        .update({
          current_rank: rank,
          start_rank: keyword.start_rank || rank,
          last_check_date: new Date().toISOString()
        })
        .eq('keyword', keyword.keyword)
        .eq('link_url', keyword.link_url);
      
      if (error) {
        console.error('❌ slot_status 업데이트 실패:', error);
        throw error;
      }
      
      console.log(`✅ slot_status 업데이트 완료: ${keyword.keyword}`);
    } catch (error) {
      console.error('❌ slot_status 업데이트 오류:', error);
      throw error;
    }
  }

  async saveRankHistory(keyword, rank) {
    try {
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
          start_rank: keyword.start_rank || rank,
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

  async runRankCheck() {
    if (this.isRunning) {
      console.log('⚠️ 이미 실행 중입니다');
      return;
    }

    this.isRunning = true;
    this.results = [];

    try {
      console.log('🚀 쿠팡 순위 체크 시작...');
      
      // 1. Chrome 브라우저 초기화
      const browserReady = await this.initPuppeteer();
      if (!browserReady) {
        throw new Error('Chrome 브라우저 초기화 실패');
      }

      // 2. 모바일 네트워크 확인
      const networkResult = await this.checkMobileNetwork();
      if (!networkResult.success) {
        throw new Error(`네트워크 확인 실패: ${networkResult.error}`);
      }

      // 3. keywords 테이블에서 쿠팡 슬롯 조회
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('*')
        .eq('slot_type', 'coupang')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('❌ keywords 조회 실패:', error);
        throw error;
      }
      
      if (!keywords || keywords.length === 0) {
        console.log('📝 체크할 키워드가 없습니다');
        return { success: true, message: '체크할 키워드가 없습니다', results: [] };
      }
      
      console.log(`📊 총 ${keywords.length}개 키워드 순위 체크 시작`);
      
      // 4. 각 키워드별 순위 체크
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        
        try {
          console.log(`\n🔍 ${i + 1}/${keywords.length} 순위 체크: ${keyword.keyword}`);
          
          // 순위 체크
          const rank = await this.checkCoupangRank(keyword.keyword, keyword.link_url);
          
          // 데이터베이스 업데이트
          if (rank) {
            await this.updateSlotStatus(keyword, rank);
            await this.saveRankHistory(keyword, rank);
          }
          
          // keywords 테이블에서 삭제
          await supabase
            .from('keywords')
            .delete()
            .eq('id', keyword.id);
          
          const result = {
            keyword: keyword.keyword,
            rank: rank,
            status: 'success',
            timestamp: new Date().toISOString()
          };
          
          this.results.push(result);
          
          console.log(`✅ ${keyword.keyword}: ${rank}위`);
          
          // 메인 윈도우에 결과 전송
          if (this.mainWindow) {
            this.mainWindow.webContents.send('rank-check-update', result);
          }
          
          // 처리 간격 (API 부하 방지)
          if (i < keywords.length - 1) {
            console.log('⏳ 5초 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
        } catch (error) {
          console.error(`❌ ${keyword.keyword} 순위 체크 실패:`, error.message);
          
          const result = {
            keyword: keyword.keyword,
            rank: null,
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          };
          
          this.results.push(result);
          
          if (this.mainWindow) {
            this.mainWindow.webContents.send('rank-check-update', result);
          }
        }
      }
      
      console.log('\n✅ 순위 체크 완료');
      
      const finalResult = {
        success: true,
        message: '순위 체크 완료',
        results: this.results,
        networkInfo: networkResult.ipInfo
      };
      
      // 메인 윈도우에 최종 결과 전송
      if (this.mainWindow) {
        this.mainWindow.webContents.send('rank-check-complete', finalResult);
      }
      
      return finalResult;
      
    } catch (error) {
      console.error('❌ 순위 체크 시스템 오류:', error);
      
      const errorResult = {
        success: false,
        error: error.message,
        results: this.results
      };
      
      if (this.mainWindow) {
        this.mainWindow.webContents.send('rank-check-error', errorResult);
      }
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async stopRankCheck() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.isRunning = false;
    console.log('🛑 순위 체크 중지됨');
  }

  async close() {
    await this.stopRankCheck();
    if (this.mainWindow) {
      this.mainWindow.close();
    }
  }
}

// Electron 앱 초기화
let rankChecker;

app.whenReady().then(() => {
  rankChecker = new CoupangRankCheckerGUI();
  rankChecker.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      rankChecker.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (rankChecker) {
    await rankChecker.close();
  }
});

// IPC 통신 설정
ipcMain.handle('start-rank-check', async () => {
  try {
    const result = await rankChecker.runRankCheck();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-rank-check', async () => {
  try {
    await rankChecker.stopRankCheck();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-keywords', async () => {
  try {
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .eq('slot_type', 'coupang')
      .order('id', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

module.exports = CoupangRankCheckerGUI;














