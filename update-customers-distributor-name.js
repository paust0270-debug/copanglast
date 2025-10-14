const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

// 서비스 역할 키를 사용하여 Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateCustomersDistributorName() {
  console.log('🔧 기존 고객 데이터에 distributor_name 추가');
  console.log('============================================================');

  try {
    // 1. 기존 고객 데이터 확인
    console.log('1️⃣ 기존 고객 데이터 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
      return;
    }

    console.log('✅ customers 테이블 조회 성공:', customersData.length, '개');
    customersData.forEach(customer => {
      console.log(`고객 ${customer.id} (${customer.name}): distributor_name = ${customer.distributor_name || 'NULL'}`);
    });

    // 2. distributor_name이 없는 고객들에 "총판B" 추가
    console.log('\n2️⃣ distributor_name 업데이트...');
    
    for (const customer of customersData) {
      if (!customer.distributor_name) {
        console.log(`고객 ${customer.id} (${customer.name})에 distributor_name "총판B" 추가...`);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ distributor_name: '총판B' })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`❌ 고객 ${customer.name}의 distributor_name 업데이트 오류:`, updateError);
        } else {
          console.log(`✅ 고객 ${customer.name}의 distributor_name 업데이트 성공!`);
        }
      } else {
        console.log(`고객 ${customer.name}은 이미 distributor_name이 설정됨: ${customer.distributor_name}`);
      }
    }

    // 3. 업데이트된 데이터 확인
    console.log('\n3️⃣ 업데이트된 customers 데이터 확인...');
    const { data: updatedCustomersData, error: updatedCustomersError } = await supabase
      .from('customers')
      .select('id, name, distributor_name');

    if (updatedCustomersError) {
      console.error('❌ 업데이트된 customers 데이터 조회 오류:', updatedCustomersError);
      return;
    }

    console.log('✅ 업데이트된 customers 데이터 조회 성공');
    updatedCustomersData.forEach(customer => {
      console.log(`고객 ${customer.id} (${customer.name}): distributor_name = ${customer.distributor_name}`);
    });

    // 4. 슬롯 추가 API에서 사용할 수 있도록 distributor_name 확인
    console.log('\n4️⃣ 슬롯 추가 API 테스트를 위한 데이터 확인...');
    const { data: testCustomer, error: testError } = await supabase
      .from('customers')
      .select('id, name, distributor_name')
      .limit(1);

    if (testError) {
      console.error('❌ 테스트 고객 데이터 조회 오류:', testError);
    } else if (testCustomer && testCustomer.length > 0) {
      console.log('✅ 테스트용 고객 데이터:');
      console.log(`  - ID: ${testCustomer[0].id}`);
      console.log(`  - 이름: ${testCustomer[0].name}`);
      console.log(`  - 총판명: ${testCustomer[0].distributor_name}`);
    }

  } catch (error) {
    console.error('❌ distributor_name 업데이트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

updateCustomersDistributorName();
