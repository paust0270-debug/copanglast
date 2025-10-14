const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDistributors() {
  console.log('🔍 등록된 총판 목록 확인');
  console.log('============================================================');

  try {
    // 1. distributors 테이블 확인
    console.log('1️⃣ distributors 테이블 확인...');
    const { data: distributorsData, error: distributorsError } = await supabase
      .from('distributors')
      .select('*')
      .order('created_at', { ascending: true });

    if (distributorsError) {
      console.error('❌ distributors 테이블 조회 오류:', distributorsError);
      console.log('→ distributors 테이블이 존재하지 않을 수 있습니다.');
    } else {
      console.log(`✅ distributors 테이블 조회 성공: ${distributorsData.length}개`);
      distributorsData.forEach((distributor, index) => {
        console.log(`총판 ${index + 1}:`);
        console.log(`  - ID: ${distributor.id}`);
        console.log(`  - 총판명: ${distributor.name}`);
        console.log(`  - 상부: ${distributor.type}`);
        console.log(`  - 도메인: ${distributor.domain}`);
        console.log(`  - IP: ${distributor.ip}`);
        console.log(`  - 사이트명: ${distributor.site_name}`);
        console.log(`  - 상태: ${distributor.status}`);
        console.log(`  - 생성일: ${distributor.created_at}`);
        console.log('---');
      });
    }

    // 2. customers 테이블의 distributor_name 확인
    console.log('\n2️⃣ customers 테이블의 distributor_name 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, name, distributor_name')
      .order('created_at', { ascending: true });

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
    } else {
      console.log(`✅ customers 테이블 조회 성공: ${customersData.length}개`);
      customersData.forEach((customer, index) => {
        console.log(`고객 ${index + 1}:`);
        console.log(`  - ID: ${customer.id}`);
        console.log(`  - 이름: ${customer.name}`);
        console.log(`  - 총판명: ${customer.distributor_name || 'NULL'}`);
        console.log('---');
      });
    }

    // 3. settlements 테이블의 distributor_name 확인
    console.log('\n3️⃣ settlements 테이블의 distributor_name 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('id, customer_name, distributor_name')
      .order('created_at', { ascending: true });

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
    } else {
      console.log(`✅ settlements 테이블 조회 성공: ${settlementsData.length}개`);
      settlementsData.forEach((settlement, index) => {
        console.log(`정산 ${index + 1}:`);
        console.log(`  - ID: ${settlement.id}`);
        console.log(`  - 고객명: ${settlement.customer_name}`);
        console.log(`  - 총판명: ${settlement.distributor_name}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ 총판 목록 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkDistributors();
