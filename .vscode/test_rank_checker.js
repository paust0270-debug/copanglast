require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRankChecker() {
  console.log('🔄 순위 체크 시스템 테스트 시작...');
  
  try {
    // 1. keywords 테이블에 테스트 데이터 추가
    console.log('📝 테스트 데이터 추가 중...');
    
    const testKeywords = [
      {
        keyword: '에어프라이어',
        link_url: 'https://www.coupang.com/vp/products/8473798698',
        slot_type: 'coupang',
        created_at: new Date().toISOString()
      },
      {
        keyword: '무선이어폰',
        link_url: 'https://www.coupang.com/vp/products/1234567890',
        slot_type: 'coupang',
        created_at: new Date().toISOString()
      }
    ];
    
    const { data: insertedKeywords, error: insertError } = await supabase
      .from('keywords')
      .insert(testKeywords)
      .select();
    
    if (insertError) {
      console.error('❌ 테스트 데이터 추가 실패:', insertError);
      return;
    }
    
    console.log(`✅ 테스트 데이터 추가 완료: ${insertedKeywords.length}개`);
    
    // 2. API 호출 테스트
    console.log('🔍 순위 체크 API 호출 중...');
    
    const response = await fetch('http://localhost:3002/api/rank-checker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: 'test-customer-id',
        username: 'test-username'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 순위 체크 API 호출 성공');
      console.log('📊 결과:', result.results);
    } else {
      console.error('❌ 순위 체크 API 호출 실패:', result.error);
    }
    
    // 3. slot_status 테이블 확인
    console.log('🔍 slot_status 테이블 확인 중...');
    
    const { data: slotStatus, error: slotError } = await supabase
      .from('slot_status')
      .select('*')
      .in('keyword', testKeywords.map(k => k.keyword));
    
    if (slotError) {
      console.error('❌ slot_status 조회 실패:', slotError);
    } else {
      console.log(`✅ slot_status 조회 완료: ${slotStatus?.length || 0}개`);
      if (slotStatus && slotStatus.length > 0) {
        slotStatus.forEach(slot => {
          console.log(`   - ${slot.keyword}: ${slot.current_rank}위 (시작: ${slot.start_rank}위)`);
        });
      }
    }
    
    // 4. rank_history 테이블 확인
    console.log('🔍 rank_history 테이블 확인 중...');
    
    const { data: rankHistory, error: historyError } = await supabase
      .from('rank_history')
      .select('*')
      .in('keyword', testKeywords.map(k => k.keyword))
      .order('check_date', { ascending: false });
    
    if (historyError) {
      console.error('❌ rank_history 조회 실패:', historyError);
    } else {
      console.log(`✅ rank_history 조회 완료: ${rankHistory?.length || 0}개`);
      if (rankHistory && rankHistory.length > 0) {
        rankHistory.forEach(history => {
          console.log(`   - ${history.keyword}: ${history.current_rank}위 (${new Date(history.check_date).toLocaleString('ko-KR')})`);
        });
      }
    }
    
    console.log('✅ 순위 체크 시스템 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testRankChecker();














