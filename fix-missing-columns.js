const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingColumns() {
  console.log('🔧 누락된 컬럼들 추가 시작...');

  try {
    // settlements 테이블에 payment_date 컬럼 추가
    console.log('📋 settlements 테이블에 payment_date 컬럼 추가...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS payment_date DATE;'
    });
    
    if (error1) {
      console.log('⚠️ payment_date 컬럼 추가 오류 (이미 존재할 수 있음):', error1.message);
    } else {
      console.log('✅ payment_date 컬럼 추가 완료');
    }

    // settlements 테이블에 settlement_batch_id 컬럼 추가
    console.log('📋 settlements 테이블에 settlement_batch_id 컬럼 추가...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS settlement_batch_id VARCHAR(255);'
    });
    
    if (error2) {
      console.log('⚠️ settlement_batch_id 컬럼 추가 오류 (이미 존재할 수 있음):', error2.message);
    } else {
      console.log('✅ settlement_batch_id 컬럼 추가 완료');
    }

    // slot_add_forms 테이블에 customer_name 컬럼 추가
    console.log('📋 slot_add_forms 테이블에 customer_name 컬럼 추가...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE slot_add_forms ADD COLUMN IF NOT EXISTS customer_name TEXT;'
    });
    
    if (error3) {
      console.log('⚠️ customer_name 컬럼 추가 오류 (이미 존재할 수 있음):', error3.message);
    } else {
      console.log('✅ customer_name 컬럼 추가 완료');
    }

    // settlement_history 테이블에 settlement_id 컬럼 추가
    console.log('📋 settlement_history 테이블에 settlement_id 컬럼 추가...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE settlement_history ADD COLUMN IF NOT EXISTS settlement_id BIGINT;'
    });
    
    if (error4) {
      console.log('⚠️ settlement_id 컬럼 추가 오류 (이미 존재할 수 있음):', error4.message);
    } else {
      console.log('✅ settlement_id 컬럼 추가 완료');
    }

    console.log('🎉 모든 컬럼 추가 완료!');

  } catch (error) {
    console.error('❌ 컬럼 추가 중 오류 발생:', error);
  }
}

fixMissingColumns();
