const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersTable() {
  console.log('🔍 customers 테이블 상태 확인...');

  try {
    // 1. customers 테이블 구조 확인
    console.log('1️⃣ customers 테이블 구조 확인...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'customers')
      .order('ordinal_position', { ascending: true });

    if (columnsError) {
      console.error('customers 테이블 컬럼 조회 오류:', columnsError);
    } else {
      const columnNames = columns.map(col => col.column_name);
      console.log('✅ customers 테이블 접근 성공');
      console.log('📊 customers 테이블 컬럼들:', columnNames);
    }

    // 2. customers 테이블 데이터 확인
    console.log('2️⃣ customers 테이블 데이터 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('customers 테이블 데이터 조회 오류:', customersError);
    } else {
      console.log('✅ customers 테이블 데이터 조회 성공');
      console.log('📊 총 고객 수:', customersData?.length || 0);
      
      if (customersData && customersData.length > 0) {
        console.log('📋 첫 번째 고객 데이터:', customersData[0]);
      } else {
        console.log('⚠️ customers 테이블에 데이터가 없습니다.');
      }
    }

    // 3. getCustomers 함수 테스트
    console.log('3️⃣ getCustomers 함수 테스트...');
    const { data: getCustomersData, error: getCustomersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (getCustomersError) {
      console.error('getCustomers 함수 테스트 오류:', getCustomersError);
    } else {
      console.log('✅ getCustomers 함수 테스트 성공');
      console.log('📊 조회된 데이터 수:', getCustomersData?.length || 0);
    }

  } catch (error) {
    console.error('❌ customers 테이블 확인 중 예외 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkCustomersTable();
