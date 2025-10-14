// 키워드 매칭 디버깅
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugKeywordMatching() {
  console.log('🔍 키워드 매칭 디버깅 시작\n');
  
  // 1. keywords 테이블의 모든 데이터 확인
  console.log('1️⃣ keywords 테이블 전체 데이터:');
  const { data: allKeywords, error: allError } = await supabase
    .from('keywords')
    .select('*')
    .limit(5);
    
  if (allError) {
    console.error('❌ keywords 조회 실패:', allError);
    return;
  }
  
  console.log(`📊 총 ${allKeywords.length}개 키워드 확인:`);
  allKeywords.forEach((keyword, index) => {
    console.log(`${index + 1}. ${keyword.keyword} | ${keyword.link_url?.substring(0, 50)}...`);
  });
  
  // 2. 특정 키워드로 매칭 테스트
  const testKeyword = '제주 레몬 3kg';
  const testProductId = '9045646821';
  
  console.log(`\n2️⃣ "${testKeyword}" 키워드 매칭 테스트:`);
  
  // 정확한 매칭
  const { data: exactMatch, error: exactError } = await supabase
    .from('keywords')
    .select('*')
    .eq('keyword', testKeyword)
    .eq('slot_type', 'coupang')
    .limit(1);
    
  if (exactError) {
    console.error('❌ 정확한 매칭 실패:', exactError);
  } else if (exactMatch && exactMatch.length > 0) {
    console.log('✅ 정확한 매칭 성공:', exactMatch[0]);
  } else {
    console.log('❌ 정확한 매칭 실패: 데이터 없음');
  }
  
  // 상품 ID로 부분 매칭
  console.log(`\n3️⃣ 상품 ID "${testProductId}"로 부분 매칭 테스트:`);
  const { data: partialMatch, error: partialError } = await supabase
    .from('keywords')
    .select('*')
    .eq('keyword', testKeyword)
    .eq('slot_type', 'coupang')
    .like('link_url', `%products/${testProductId}%`)
    .limit(1);
    
  if (partialError) {
    console.error('❌ 부분 매칭 실패:', partialError);
  } else if (partialMatch && partialMatch.length > 0) {
    console.log('✅ 부분 매칭 성공:', partialMatch[0]);
  } else {
    console.log('❌ 부분 매칭 실패: 데이터 없음');
  }
  
  // 4. slot_status 테이블 확인
  console.log(`\n4️⃣ slot_status 테이블 확인:`);
  const { data: slotStatus, error: statusError } = await supabase
    .from('slot_status')
    .select('*')
    .eq('customer_id', 'choiangello1')
    .eq('slot_sequence', 1)
    .limit(1);
    
  if (statusError) {
    console.error('❌ slot_status 조회 실패:', statusError);
  } else if (slotStatus && slotStatus.length > 0) {
    console.log('✅ slot_status 조회 성공:', slotStatus[0]);
  } else {
    console.log('❌ slot_status 조회 실패: 데이터 없음');
  }
  
  console.log('\n✅ 디버깅 완료!');
}

debugKeywordMatching().catch(console.error);