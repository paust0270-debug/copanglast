const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettlementHistoryTable() {
  console.log('🔍 settlement_history 테이블 구조 확인...');

  try {
    // settlement_history 테이블의 모든 데이터 조회
    const { data: history, error } = await supabase
      .from('settlement_history')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ settlement_history 테이블 접근 오류:', error);
      return;
    }

    if (history && history.length > 0) {
      console.log('✅ settlement_history 테이블 접근 성공');
      console.log('📊 settlement_history 테이블 컬럼들:', Object.keys(history[0]));
      console.log('📋 샘플 데이터:', history[0]);
    } else {
      console.log('⚠️ settlement_history 테이블이 비어있습니다.');
    }

    // 직접 settlement_id 컬럼 테스트
    console.log('🔍 settlement_id 컬럼 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('settlement_history')
      .select('settlement_id')
      .limit(1);

    if (testError) {
      console.log('❌ settlement_id 컬럼 접근 오류:', testError.message);
      console.log('📝 Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('ALTER TABLE settlement_history ADD COLUMN settlement_id BIGINT;');
    } else {
      console.log('✅ settlement_id 컬럼 접근 성공');
    }

  } catch (error) {
    console.error('❌ 테이블 확인 중 오류 발생:', error);
  }
}

checkSettlementHistoryTable();
