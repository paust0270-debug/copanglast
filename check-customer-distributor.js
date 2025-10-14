const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerDistributor() {
  console.log('🔍 customers 테이블 소속총판 정보 확인');
  console.log('============================================================');

  try {
    // 1. customers 테이블의 소속총판 정보 확인
    console.log('1️⃣ customers 테이블 소속총판 정보 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, name, distributor_name')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
      return;
    }

    console.log('✅ customers 테이블 조회 성공:', customersData.length, '개');
    console.log('\n📋 고객별 소속총판 정보:');
    customersData.forEach(customer => {
      console.log(`고객 ${customer.id} (${customer.name}): 소속총판 = ${customer.distributor_name || 'NULL'}`);
    });

    // 2. 현재 settlements 테이블의 distributor_name 상태 확인
    console.log('\n2️⃣ settlements 테이블 distributor_name 상태 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('id, customer_id, customer_name, distributor_name')
      .order('created_at', { ascending: false });

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
      return;
    }

    console.log('✅ settlements 테이블 조회 성공:', settlementsData.length, '개');
    console.log('\n📋 settlements별 distributor_name 상태:');
    settlementsData.forEach(settlement => {
      console.log(`정산 ${settlement.id} (고객: ${settlement.customer_name}): distributor_name = ${settlement.distributor_name || 'NULL'}`);
    });

    // 3. 누락된 distributor_name 매핑 확인
    console.log('\n3️⃣ 누락된 distributor_name 매핑 확인...');
    const missingDistributor = settlementsData.filter(settlement => !settlement.distributor_name);
    
    if (missingDistributor.length > 0) {
      console.log(`❌ distributor_name이 NULL인 settlements: ${missingDistributor.length}개`);
      missingDistributor.forEach(settlement => {
        const customer = customersData.find(c => c.id === settlement.customer_id);
        console.log(`  - 정산 ${settlement.id} (고객: ${settlement.customer_name}): 고객의 소속총판 = ${customer?.distributor_name || 'NULL'}`);
      });
    } else {
      console.log('✅ 모든 settlements에 distributor_name이 설정되어 있습니다.');
    }

  } catch (error) {
    console.error('❌ 소속총판 정보 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomerDistributor();
