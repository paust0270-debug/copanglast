const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettlementsDistributorName() {
  console.log('🔍 settlements 테이블 distributor_name 필드 확인');
  console.log('============================================================');

  try {
    // 1. settlements 테이블의 모든 데이터 확인
    console.log('1️⃣ settlements 테이블 데이터 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
      return;
    }

    console.log('✅ settlements 테이블 조회 성공:', settlementsData.length, '개');
    console.log('');

    // 2. 각 데이터의 distributor_name 확인
    settlementsData.forEach((settlement, index) => {
      console.log(`📋 정산 항목 ${index + 1} (ID: ${settlement.id}):`);
      console.log(`  - 고객명: ${settlement.customer_name}`);
      console.log(`  - 총판명: ${settlement.distributor_name || 'NULL'}`);
      console.log(`  - 슬롯타입: ${settlement.slot_type}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 입금자명: ${settlement.payer_name}`);
      console.log(`  - 입금액: ${settlement.payment_amount}`);
      console.log(`  - 상태: ${settlement.status}`);
      console.log('---');
    });

    // 3. distributor_name이 null인 항목들 확인
    const nullDistributorItems = settlementsData.filter(item => !item.distributor_name);
    console.log(`\n⚠️ distributor_name이 NULL인 항목: ${nullDistributorItems.length}개`);
    
    if (nullDistributorItems.length > 0) {
      console.log('NULL인 항목들:');
      nullDistributorItems.forEach(item => {
        console.log(`  - ID: ${item.id}, 고객명: ${item.customer_name}, 슬롯타입: ${item.slot_type}`);
      });
    }

    // 4. settlement_history에서 distributor_name 확인
    console.log('\n2️⃣ settlement_history 테이블 distributor_name 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('id, distributor_name, customer_name, slot_type')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ settlement_history 테이블 조회 오류:', historyError);
    } else {
      console.log('✅ settlement_history 테이블 조회 성공:', historyData.length, '개');
      historyData.forEach((history, index) => {
        console.log(`📋 정산내역 ${index + 1} (ID: ${history.id}):`);
        console.log(`  - 고객명: ${history.customer_name}`);
        console.log(`  - 총판명: ${history.distributor_name || 'NULL'}`);
        console.log(`  - 슬롯타입: ${history.slot_type}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ distributor_name 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkSettlementsDistributorName();
