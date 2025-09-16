const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  console.log('🔧 누락된 컬럼들 추가 시작...');

  try {
    // 1. settlements 테이블에 payment_date 컬럼 추가
    console.log('📋 settlements 테이블에 payment_date 컬럼 추가...');
    const { error: error1 } = await supabase
      .rpc('exec_sql', { sql_query: 'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS payment_date DATE;' });
    
    if (error1) {
      console.log('⚠️ payment_date 컬럼 추가 오류:', error1.message);
      // 직접 SQL 실행 시도
      console.log('🔄 직접 SQL 실행 시도...');
      const { error: directError1 } = await supabase
        .from('settlements')
        .select('payment_date')
        .limit(1);
      
      if (directError1 && directError1.code === 'PGRST204') {
        console.log('❌ payment_date 컬럼이 여전히 누락되어 있습니다.');
        console.log('📝 Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.log('ALTER TABLE settlements ADD COLUMN payment_date DATE;');
      } else {
        console.log('✅ payment_date 컬럼이 존재합니다.');
      }
    } else {
      console.log('✅ payment_date 컬럼 추가 완료');
    }

    // 2. settlements 테이블에 settlement_batch_id 컬럼 추가
    console.log('📋 settlements 테이블에 settlement_batch_id 컬럼 추가...');
    const { error: error2 } = await supabase
      .rpc('exec_sql', { sql_query: 'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS settlement_batch_id VARCHAR(255);' });
    
    if (error2) {
      console.log('⚠️ settlement_batch_id 컬럼 추가 오류:', error2.message);
    } else {
      console.log('✅ settlement_batch_id 컬럼 추가 완료');
    }

    // 3. slot_add_forms 테이블에 customer_name 컬럼 추가
    console.log('📋 slot_add_forms 테이블에 customer_name 컬럼 추가...');
    const { error: error3 } = await supabase
      .rpc('exec_sql', { sql_query: 'ALTER TABLE slot_add_forms ADD COLUMN IF NOT EXISTS customer_name TEXT;' });
    
    if (error3) {
      console.log('⚠️ customer_name 컬럼 추가 오류:', error3.message);
      console.log('📝 Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('ALTER TABLE slot_add_forms ADD COLUMN customer_name TEXT;');
    } else {
      console.log('✅ customer_name 컬럼 추가 완료');
    }

    // 4. settlement_history 테이블에 settlement_id 컬럼 추가
    console.log('📋 settlement_history 테이블에 settlement_id 컬럼 추가...');
    const { error: error4 } = await supabase
      .rpc('exec_sql', { sql_query: 'ALTER TABLE settlement_history ADD COLUMN IF NOT EXISTS settlement_id BIGINT;' });
    
    if (error4) {
      console.log('⚠️ settlement_id 컬럼 추가 오류:', error4.message);
      console.log('📝 Supabase 대시보드에서 다음 SQL을 실행하세요:');
      console.log('ALTER TABLE settlement_history ADD COLUMN settlement_id BIGINT;');
    } else {
      console.log('✅ settlement_id 컬럼 추가 완료');
    }

    console.log('🎉 컬럼 추가 작업 완료!');

  } catch (error) {
    console.error('❌ 컬럼 추가 중 오류 발생:', error);
  }
}

addMissingColumns();
