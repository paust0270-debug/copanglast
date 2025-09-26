const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersTableStructure() {
  console.log('🔍 customers 테이블 구조 확인');
  console.log('============================================================');

  try {
    // 1. customers 테이블의 모든 데이터 확인 (컬럼 구조 파악)
    console.log('1️⃣ customers 테이블 데이터 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (customersError) {
      console.error('❌ customers 테이블 조회 오류:', customersError);
      return;
    }

    console.log('✅ customers 테이블 조회 성공');
    if (customersData && customersData.length > 0) {
      console.log('📋 customers 테이블 컬럼 구조:');
      const columns = Object.keys(customersData[0]);
      columns.forEach(column => {
        console.log(`  - ${column}: ${customersData[0][column]}`);
      });
    } else {
      console.log('❌ customers 테이블에 데이터가 없습니다.');
    }

    // 2. 모든 customers 데이터 확인
    console.log('\n2️⃣ 모든 customers 데이터 확인...');
    const { data: allCustomersData, error: allCustomersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (allCustomersError) {
      console.error('❌ 모든 customers 데이터 조회 오류:', allCustomersError);
      return;
    }

    console.log('✅ 모든 customers 데이터 조회 성공:', allCustomersData.length, '개');
    console.log('\n📋 고객 목록:');
    allCustomersData.forEach(customer => {
      console.log(`고객 ${customer.id}: ${customer.name}`);
      console.log(`  - 등록일: ${customer.registration_date}`);
      console.log(`  - 생성일: ${customer.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ customers 테이블 구조 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomersTableStructure();
