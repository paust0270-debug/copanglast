const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettlementHistoryStructure() {
  console.log('🔍 settlement_history 테이블 구조 확인');
  console.log('============================================================');

  try {
    // 1. settlement_history 테이블 구조 확인
    console.log('1️⃣ settlement_history 테이블 데이터 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .limit(1);

    if (historyError) {
      console.error('❌ settlement_history 테이블 조회 오류:', historyError);
    } else {
      console.log('✅ settlement_history 테이블 조회 성공');
      if (historyData && historyData.length > 0) {
        console.log('📋 settlement_history 테이블 컬럼들:');
        Object.keys(historyData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof historyData[0][key]} = ${historyData[0][key]}`);
        });
      } else {
        console.log('📋 settlement_history 테이블이 비어있습니다.');
      }
    }

    // 2. settlements 테이블 구조 확인
    console.log('\n2️⃣ settlements 테이블 데이터 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
    } else {
      console.log('✅ settlements 테이블 조회 성공');
      if (settlementsData && settlementsData.length > 0) {
        console.log('📋 settlements 테이블 컬럼들:');
        Object.keys(settlementsData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof settlementsData[0][key]} = ${settlementsData[0][key]}`);
        });
      } else {
        console.log('📋 settlements 테이블이 비어있습니다.');
      }
    }

    // 3. ID=4인 settlement_history 데이터 확인
    console.log('\n3️⃣ ID=4인 settlement_history 데이터 확인...');
    const { data: specificHistory, error: specificError } = await supabase
      .from('settlement_history')
      .select('*')
      .eq('id', 4)
      .single();

    if (specificError) {
      console.error('❌ ID=4 settlement_history 조회 오류:', specificError);
    } else if (specificHistory) {
      console.log('✅ ID=4 settlement_history 데이터:');
      Object.keys(specificHistory).forEach(key => {
        console.log(`  - ${key}: ${specificHistory[key]}`);
      });
    } else {
      console.log('📋 ID=4 settlement_history 데이터가 없습니다.');
    }

  } catch (error) {
    console.error('❌ 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkSettlementHistoryStructure();
