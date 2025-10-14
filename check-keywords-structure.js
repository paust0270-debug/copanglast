// keywords 테이블 구조 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkKeywordsStructure() {
  console.log('🔍 keywords 테이블 구조 확인 중...\n');
  
  try {
    // 1. 테이블 구조 확인
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ keywords 테이블 조회 오류:', error);
      return;
    }
    
    console.log('✅ keywords 테이블 데이터 (최대 3개):');
    console.log(JSON.stringify(data, null, 2));
    
    if (data && data.length > 0) {
      console.log('\n📋 컬럼 목록:');
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]} (${data[0][key]})`);
      });
      
      // customer_id와 slot_id 확인
      console.log('\n🔍 매핑 필드 확인:');
      console.log(`  - customer_id: ${data[0].customer_id || 'NULL'}`);
      console.log(`  - slot_id: ${data[0].slot_id || 'NULL'}`);
      console.log(`  - slot_sequence: ${data[0].slot_sequence || 'NULL'}`);
      console.log(`  - keyword: ${data[0].keyword || 'NULL'}`);
      console.log(`  - link_url: ${data[0].link_url || 'NULL'}`);
      console.log(`  - slot_type: ${data[0].slot_type || 'NULL'}`);
    }
    
    // 2. 전체 개수 확인
    const { count, error: countError } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📊 총 키워드 개수: ${count}개`);
    }
    
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkKeywordsStructure();
