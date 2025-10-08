require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class AndroidCoupangRankChecker {
  constructor() {
    this.adbPath = 'adb.exe'; // ADB 경로
    this.deviceId = null;
    this.isRunning = false;
    this.results = [];
    this.currentIP = null;
    
    console.log('📱 Android 기반 쿠팡 순위 체크 시스템 초기화');
  }

  // ADB 명령어 실행
  async execAdbCommand(command, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const fullCommand = `${this.adbPath} shell ${command}`;
      console.log(`🔧 ADB 명령어: ${fullCommand}`);
      
      exec(fullCommand, { timeout }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ADB 명령어 실패: ${error.message}`);
          reject(error);
        } else {
          console.log(`✅ ADB 명령어 성공: ${stdout.trim()}`);
          resolve(stdout.trim());
        }
      });
    });
  }

  // 안드로이드 디바이스 연결 확인
  async checkAndroidDevice() {
    try {
      console.log('🔍 안드로이드 디바이스 연결 확인 중...');
      
      return new Promise((resolve, reject) => {
        exec(`${this.adbPath} devices`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ ADB 연결 실패:', error.message);
            reject(error);
            return;
          }

          const lines = stdout.split('\n');
          const deviceLine = lines.find(line => line.includes('device') && !line.includes('List of devices'));
          
          if (deviceLine) {
            this.deviceId = deviceLine.split('\t')[0];
            console.log(`✅ 안드로이드 디바이스 연결됨: ${this.deviceId}`);
            resolve(true);
          } else {
            console.log('❌ 연결된 안드로이드 디바이스가 없습니다');
            reject(new Error('안드로이드 디바이스가 연결되지 않았습니다'));
          }
        });
      });
    } catch (error) {
      console.error('❌ 안드로이드 디바이스 확인 실패:', error);
      throw error;
    }
  }

  // 현재 모바일 IP 확인
  async getCurrentIP() {
    try {
      console.log('🌐 현재 모바일 IP 확인 중...');
      
      // 방법 1: ip route 명령어로 IP 확인
      try {
        const ipRoute = await this.execAdbCommand('ip route');
        const ipMatch = ipRoute.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch) {
          this.currentIP = ipMatch[1];
          console.log(`📍 현재 IP: ${this.currentIP}`);
          return this.currentIP;
        }
      } catch (error) {
        console.log('⚠️ ip route 명령어 실패, 다른 방법 시도...');
      }

      // 방법 2: getprop 명령어로 IP 확인
      try {
        const wifiIP = await this.execAdbCommand('getprop dhcp.wlan0.ipaddress');
        if (wifiIP && wifiIP !== '') {
          this.currentIP = wifiIP;
          console.log(`📍 WiFi IP: ${this.currentIP}`);
          return this.currentIP;
        }
      } catch (error) {
        console.log('⚠️ getprop 명령어 실패, 다른 방법 시도...');
      }

      // 방법 3: 외부 IP 확인 서비스 사용
      try {
        const externalIP = await this.execAdbCommand('curl -s https://ipinfo.io/ip');
        if (externalIP && externalIP.match(/\d+\.\d+\.\d+\.\d+/)) {
          this.currentIP = externalIP.trim();
          console.log(`📍 외부 IP: ${this.currentIP}`);
          return this.currentIP;
        }
      } catch (error) {
        console.log('⚠️ 외부 IP 확인 실패');
      }

      throw new Error('IP를 확인할 수 없습니다');
      
    } catch (error) {
      console.error('❌ IP 확인 실패:', error);
      throw error;
    }
  }

  // 모바일 데이터 재연결 (IP 변경)
  async rotateMobileIP() {
    try {
      console.log('🔄 모바일 IP 변경 시작...');
      
      const oldIP = this.currentIP;
      
      // 1. 모바일 데이터 연결 해제
      console.log('📱 모바일 데이터 연결 해제 중...');
      await this.execAdbCommand('svc data disable');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 2. 모바일 데이터 연결 활성화
      console.log('📱 모바일 데이터 연결 활성화 중...');
      await this.execAdbCommand('svc data enable');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 3. 새 IP 확인
      const newIP = await this.getCurrentIP();
      
      if (oldIP !== newIP) {
        console.log(`✅ IP 변경 성공: ${oldIP} → ${newIP}`);
        return newIP;
      } else {
        console.log('⚠️ IP 변경 실패, 재시도...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await this.rotateMobileIP();
      }
      
    } catch (error) {
      console.error('❌ IP 변경 실패:', error);
      throw error;
    }
  }

  // 쿠팡 앱 실행
  async launchCoupangApp() {
    try {
      console.log('🚀 쿠팡 앱 실행 중...');
      
      // 쿠팡 앱 패키지명과 메인 액티비티
      const packageName = 'com.coupang.mobile';
      const mainActivity = 'com.coupang.mobile.MainActivity';
      
      // 앱 실행
      await this.execAdbCommand(`am start -n ${packageName}/${mainActivity}`);
      
      // 앱이 완전히 로드될 때까지 대기
      console.log('⏳ 앱 로딩 대기 중...');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      console.log('✅ 쿠팡 앱 실행 완료');
      return true;
      
    } catch (error) {
      console.error('❌ 쿠팡 앱 실행 실패:', error);
      throw error;
    }
  }

  // 검색어 입력 및 검색
  async searchKeyword(keyword) {
    try {
      console.log(`🔍 검색어 입력: ${keyword}`);
      
      // 1. 검색창 클릭 (일반적으로 상단에 있음)
      await this.execAdbCommand('input tap 540 150'); // 화면 중앙 상단
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. 기존 텍스트 삭제
      await this.execAdbCommand('input keyevent KEYCODE_CTRL_A');
      await this.execAdbCommand('input keyevent KEYCODE_DEL');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 3. 검색어 입력
      await this.execAdbCommand(`input text "${keyword}"`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. 검색 버튼 클릭 (엔터키)
      await this.execAdbCommand('input keyevent KEYCODE_ENTER');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
      
      // 1. 현재 화면의 상품 목록 스크린샷
      await this.execAdbCommand('screencap -p /sdcard/screen.png');
      
      // 2. 스크린샷을 PC로 가져오기
      await new Promise((resolve, reject) => {
        exec(`${this.adbPath} pull /sdcard/screen.png ./temp_screen.png`, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
      
      // 3. 상품 목록에서 해당 상품 찾기
      // 실제 구현에서는 이미지 인식이나 OCR을 사용할 수 있음
      // 여기서는 간단히 상품 링크를 확인하는 방식 사용
      
      const rank = await this.findProductInList(productId);
      
      if (rank) {
        console.log(`✅ 상품 순위 확인: ${productId} - ${rank}위`);
        return rank;
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${productId}`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 순위 확인 실패: ${productId}`, error);
      return null;
    }
  }

  // 상품 목록에서 특정 상품 찾기
  async findProductInList(productId) {
    try {
      // 1. 현재 화면의 HTML 소스 가져오기 (웹뷰가 있는 경우)
      const pageSource = await this.execAdbCommand('uiautomator dump /sdcard/ui.xml');
      
      // 2. UI XML 파일을 PC로 가져오기
      await new Promise((resolve, reject) => {
        exec(`${this.adbPath} pull /sdcard/ui.xml ./temp_ui.xml`, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve(stdout);
        });
      });
      
      // 3. XML 파일에서 상품 정보 찾기
      if (fs.existsSync('./temp_ui.xml')) {
        const uiXml = fs.readFileSync('./temp_ui.xml', 'utf8');
        
        // 상품 링크나 ID가 포함된 요소 찾기
        const productElements = uiXml.match(/<node[^>]*>.*?<\/node>/gs) || [];
        
        for (let i = 0; i < productElements.length; i++) {
          const element = productElements[i];
          if (element.includes(productId) || element.includes(`products/${productId}`)) {
            console.log(`✅ 상품 발견: ${productId} - ${i + 1}위`);
            return i + 1;
          }
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ 상품 목록 분석 실패:', error);
      return null;
    }
  }

  // 데이터베이스 업데이트
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

  // 순위 히스토리 저장
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

  // 메인 순위 체크 실행
  async runRankCheck() {
    if (this.isRunning) {
      console.log('⚠️ 이미 실행 중입니다');
      return;
    }

    this.isRunning = true;
    this.results = [];

    try {
      console.log('🚀 Android 기반 쿠팡 순위 체크 시작...');
      
      // 1. 안드로이드 디바이스 연결 확인
      await this.checkAndroidDevice();
      
      // 2. 현재 IP 확인
      await this.getCurrentIP();
      
      // 3. 쿠팡 앱 실행
      await this.launchCoupangApp();
      
      // 4. keywords 테이블에서 쿠팡 슬롯 조회
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
      
      // 5. 각 키워드별 순위 체크
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        
        try {
          console.log(`\n🔍 ${i + 1}/${keywords.length} 순위 체크: ${keyword.keyword}`);
          
          // 상품번호 추출
          const productId = this.extractProductId(keyword.link_url);
          if (!productId) {
            console.log(`❌ 상품번호 추출 실패: ${keyword.link_url}`);
            continue;
          }
          
          // 검색어 입력
          await this.searchKeyword(keyword.keyword);
          
          // 순위 확인
          const rank = await this.checkProductRank(productId);
          
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
          
          // 처리 간격 (API 부하 방지)
          if (i < keywords.length - 1) {
            console.log('⏳ 5초 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // IP 변경 (선택사항)
            if (i % 3 === 0) { // 3개마다 IP 변경
              console.log('🔄 IP 변경 중...');
              await this.rotateMobileIP();
            }
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
        }
      }
      
      console.log('\n✅ 순위 체크 완료');
      
      return {
        success: true,
        message: '순위 체크 완료',
        results: this.results,
        currentIP: this.currentIP
      };
      
    } catch (error) {
      console.error('❌ 순위 체크 시스템 오류:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // 상품번호 추출
  extractProductId(linkUrl) {
    const match = linkUrl.match(/products\/(\d+)/);
    return match ? match[1] : null;
  }

  // 정리 작업
  async cleanup() {
    try {
      // 임시 파일 삭제
      if (fs.existsSync('./temp_screen.png')) {
        fs.unlinkSync('./temp_screen.png');
      }
      if (fs.existsSync('./temp_ui.xml')) {
        fs.unlinkSync('./temp_ui.xml');
      }
      
      console.log('🧹 정리 작업 완료');
    } catch (error) {
      console.error('❌ 정리 작업 실패:', error);
    }
  }
}

// 실행 함수
async function main() {
  const rankChecker = new AndroidCoupangRankChecker();
  
  try {
    const result = await rankChecker.runRankCheck();
    console.log('\n📊 최종 결과:', JSON.stringify(result, null, 2));
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

module.exports = AndroidCoupangRankChecker;














