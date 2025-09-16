const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementInsert() {
  console.log('🧪 정산 데이터 직접 삽입 테스트...');

  try {
    // payment_date 없이 정산 데이터 삽입 시도
    const settlementData = {
      customer_id: 'test-customer',
      customer_name: '테스트고객',
      slot_type: 'coupang',
      slot_count: 1,
      payment_type: 'deposit',
      payer_name: '테스트입금자',
      payment_amount: 100000,
      usage_days: 30,
      memo: '테스트 정산 데이터',
      status: 'pending'
    };

    console.log('📋 삽입할 데이터:', settlementData);

    const { data, error } = await supabase
      .from('settlements')
      .insert([settlementData])
      .select();

    if (error) {
      console.log('❌ 정산 데이터 삽입 실패:', error.message);
      
      // payment_date 컬럼이 없어서 실패하는 경우
      if (error.message.includes('payment_date')) {
        console.log('🔧 payment_date 컬럼이 없습니다. Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.log('ALTER TABLE settlements ADD COLUMN payment_date DATE;');
      }
    } else {
      console.log('✅ 정산 데이터 삽입 성공:', data);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testSettlementInsert();
