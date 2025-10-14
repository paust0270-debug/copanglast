require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class MobileCoupangRankChecker {
  constructor() {
    this.baseUrl = 'https://www.coupang.com';
    this.mobileBaseUrl = 'https://m.coupang.com';
    this.apiBaseUrl = 'https://www.coupang.com/np';
    
    // 모바일 환경 설정
    this.setupMobileHeaders();
    
    console.log('📱 모바일 쿠팡 순위 체크 시스템 초기화 완료');
  }

  setupMobileHeaders() {
    // 실제 쿠팡 앱 User-Agent (Android)
    this.headers = {
      'User-Agent': 'Coupang/6.0.0 (Android 14; SM-G998N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Origin': 'https://m.coupang.com',
      'Referer': 'https://m.coupang.com/'
    };
  }

  async checkMobileNetwork() {
    try {
      console.log('🌐 모바일 네트워크 환경 확인 중...');
      
      const response = await axios.get('https://ipinfo.io/json', {
        timeout: 10000,
        headers: this.headers
      });
      
      const ipInfo = response.data;
      
      console.log(`📍 현재 IP: ${ipInfo.ip}`);
      console.log(`🏢 ISP: ${ipInfo.org}`);
      console.log(`🌍 지역: ${ipInfo.city}, ${ipInfo.country}`);
      
      // 모바일 통신사 IP 확인
      const mobileISPs = ['KT', 'SKT', 'LG U+', 'SK Telecom', 'LGU+'];
      const isMobile = mobileISPs.some(isp => ipInfo.org.includes(isp));
      
      if (isMobile) {
        console.log('✅ 모바일 IP 확인됨');
        return true;
      } else {
        console.log('⚠️ 모바일 IP가 아닙니다 (일반 인터넷)');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 네트워크 확인 실패:', error.message);
      return false;
    }
  }

  async testMobileConnection() {
    console.log('🔗 모바일 연결 품질 테스트 중...');
    
    const testUrls = [
      'https://www.coupang.com',
      'https://m.coupang.com',
      'https://www.coupang.com/np/search'
    ];
    
    const results = {};
    
    for (const url of testUrls) {
      try {
        const startTime = Date.now();
        const response = await axios.get(url, {
          timeout: 10000,
          headers: this.headers
        });
        const endTime = Date.now();
        
        results[url] = {
          status: response.status,
          responseTime: endTime - startTime,
          success: response.status === 200,
          size: response.data.length
        };
        
        console.log(`✅ ${url}: ${response.status} (${endTime - startTime}ms)`);
        
      } catch (error) {
        results[url] = {
          status: 'ERROR',
          responseTime: null,
          success: false,
          error: error.message
        };
        
        console.log(`❌ ${url}: ${error.message}`);
      }
    }
    
    return results;
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
      
      // 쿠팡 검색 페이지 요청 (모바일 환경)
      const searchUrl = `${this.apiBaseUrl}/search?q=${encodeURIComponent(keyword)}`;
      
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: this.headers
      });
      
      const $ = cheerio.load(response.data);
      
      // 상품 목록에서 해당 상품 찾기
      let rank = null;
      $('.search-product').each((index, element) => {
        const productLink = $(element).find('a[href*="products/"]').attr('href');
        if (productLink && productLink.includes(`products/${productId}`)) {
          rank = index + 1;
          return false; // break
        }
      });
      
      if (rank) {
        console.log(`✅ 순위 체크 완료: ${keyword} - ${rank}위`);
      } else {
        console.log(`⚠️ 상품을 찾을 수 없음: ${keyword}`);
      }
      
      return rank;
      
    } catch (error) {
      console.error(`❌ 순위 체크 실패: ${keyword}`, error.message);
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
    try {
      console.log('🚀 모바일 쿠팡 순위 체크 시작...');
      
      // 1. 모바일 네트워크 확인
      const isMobile = await this.checkMobileNetwork();
      if (!isMobile) {
        console.log('⚠️ 모바일 네트워크가 아닙니다. 계속 진행합니다...');
      }
      
      // 2. 연결 품질 테스트
      const connectionResults = await this.testMobileConnection();
      
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
      
      const results = [];
      
      for (let i = 0; i < keywords.length; i++) {
        const keyword = keywords[i];
        
        try {
          console.log(`\n🔍 ${i + 1}/${keywords.length} 순위 체크: ${keyword.keyword}`);
          
          // 4. 쿠팡 페이지 크롤링으로 순위 추출
          const rank = await this.checkCoupangRank(keyword.keyword, keyword.link_url);
          
          // 5. slot_status 테이블 업데이트
          if (rank) {
            await this.updateSlotStatus(keyword, rank);
            
            // 6. 순위 히스토리 저장
            await this.saveRankHistory(keyword, rank);
          }
          
          // 7. keywords 테이블에서 삭제
          await supabase
            .from('keywords')
            .delete()
            .eq('id', keyword.id);
          
          results.push({
            keyword: keyword.keyword,
            rank: rank,
            status: 'success'
          });
          
          console.log(`✅ ${keyword.keyword}: ${rank}위`);
          
          // 8. 처리 간격 (API 부하 방지)
          if (i < keywords.length - 1) {
            console.log('⏳ 3초 대기 중...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
        } catch (error) {
          console.error(`❌ ${keyword.keyword} 순위 체크 실패:`, error.message);
          results.push({
            keyword: keyword.keyword,
            rank: null,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      console.log('\n✅ 순위 체크 완료');
      
      return {
        success: true,
        message: '순위 체크 완료',
        results: results,
        connectionResults: connectionResults
      };
      
    } catch (error) {
      console.error('❌ 순위 체크 시스템 오류:', error);
      throw error;
    }
  }
}

// 실행 함수
async function main() {
  const rankChecker = new MobileCoupangRankChecker();
  
  try {
    const result = await rankChecker.runRankCheck();
    console.log('\n📊 최종 결과:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 시스템 실행 실패:', error);
  }
}

// 직접 실행
if (require.main === module) {
  main();
}

module.exports = MobileCoupangRankChecker;