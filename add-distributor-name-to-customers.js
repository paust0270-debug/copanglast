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

async function addDistributorNameToCustomers() {
  console.log('🔧 customers 테이블에 distributor_name 컬럼 추가');
  console.log('============================================================');

  try {
    // 1. customers 테이블에 distributor_name 컬럼 추가
    console.log('1️⃣ customers 테이블에 distributor_name 컬럼 추가...');
    
    // SQL을 직접 실행할 수 없으므로, 기존 데이터에 distributor_name 추가
    console.log('⚠️  SQL 직접 실행이 불가능하므로, 기존 데이터에 distributor_name 추가...');
    
    // 2. 기존 customers 데이터에 distributor_name 추가
    console.log('\n2️⃣ 기존 customers 데이터에 distributor_name 추가...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
      return;
    }

    console.log('✅ customers 테이블 조회 성공:', customersData.length, '개');

    // 각 고객에 distributor_name 추가 (기본값: "총판A")
    for (const customer of customersData) {
      console.log(`고객 ${customer.id} (${customer.name})에 distributor_name 추가...`);
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ distributor_name: '총판A' })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`❌ 고객 ${customer.name}의 distributor_name 업데이트 오류:`, updateError);
      } else {
        console.log('✅ 업데이트 성공');
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

  } catch (error) {
    console.error('❌ distributor_name 추가 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

addDistributorNameToCustomers();
