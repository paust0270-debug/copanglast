const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseSchema() {
  console.log('🔍 데이터베이스 스키마 검증');
  console.log('============================================================');

  try {
    // 1. 주요 테이블들의 구조 확인
    const tables = ['customers', 'slots', 'settlements', 'settlement_history', 'settlement_requests', 'slot_add_forms'];
    
    for (const table of tables) {
      console.log(`\n📋 ${table} 테이블 구조 확인...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table} 테이블 조회 오류:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ ${table} 테이블 존재, 컬럼 수: ${Object.keys(data[0]).length}개`);
        console.log(`   컬럼 목록: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`⚠️  ${table} 테이블 존재하지만 데이터 없음`);
      }
    }

    // 2. 각 테이블의 데이터 개수 확인
    console.log('\n📊 테이블별 데이터 개수:');
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: 조회 오류 - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0}개`);
      }
    }

  } catch (error) {
    console.error('❌ 데이터베이스 스키마 검증 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

verifyDatabaseSchema();
