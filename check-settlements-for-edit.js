const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettlementsForEdit() {
  console.log('🔍 정산수정용 settlements 데이터 확인');
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
    
    if (settlementsData.length > 0) {
      console.log('\n📋 settlements 데이터:');
      settlementsData.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   고객명: ${item.customer_name}`);
        console.log(`   총판명: ${item.distributor_name}`);
        console.log(`   슬롯타입: ${item.slot_type}`);
        console.log(`   슬롯수: ${item.slot_count}`);
        console.log(`   입금자명: ${item.payer_name}`);
        console.log(`   입금액: ${item.payment_amount}`);
        console.log(`   사용일수: ${item.usage_days}`);
        console.log(`   상태: ${item.status}`);
        console.log(`   생성일: ${item.created_at}`);
        console.log('---');
      });
    } else {
      console.log('❌ settlements 테이블에 데이터가 없습니다.');
    }

    // 2. settlement_history 테이블의 데이터 확인
    console.log('\n2️⃣ settlement_history 테이블 데이터 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ settlement_history 테이블 조회 오류:', historyError);
      return;
    }

    console.log('✅ settlement_history 테이블 조회 성공:', historyData.length, '개');
    
    if (historyData.length > 0) {
      console.log('\n📋 settlement_history 데이터:');
      historyData.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   고객명: ${item.customer_name}`);
        console.log(`   총판명: ${item.distributor_name}`);
        console.log(`   슬롯타입: ${item.slot_type}`);
        console.log(`   슬롯수: ${item.slot_count}`);
        console.log(`   입금자명: ${item.payer_name}`);
        console.log(`   입금액: ${item.payment_amount}`);
        console.log(`   사용일수: ${item.usage_days}`);
        console.log(`   상태: ${item.status}`);
        console.log(`   생성일: ${item.created_at}`);
        console.log('---');
      });
    } else {
      console.log('❌ settlement_history 테이블에 데이터가 없습니다.');
    }

    // 3. 원래 정산수정 로직 추론
    console.log('\n3️⃣ 원래 정산수정 로직 추론...');
    console.log('원래 백업 파일에서는 정산수정 페이지가 다음과 같이 작동했을 것으로 추론됩니다:');
    console.log('1. settlement_history ID를 받아서');
    console.log('2. 해당 정산에 포함된 개별 settlements 항목들을 조회');
    console.log('3. 각 항목을 테이블에 표시하고 수정 가능하게 함');
    console.log('4. 수정 시 settlements 테이블의 개별 항목들을 업데이트');
    
    if (settlementsData.length > 0 && historyData.length > 0) {
      console.log('\n✅ 정산수정을 위한 데이터가 충분히 있습니다.');
      console.log('원래 로직으로 복구 가능합니다.');
    } else {
      console.log('\n❌ 정산수정을 위한 데이터가 부족합니다.');
      console.log('먼저 테스트 데이터를 생성해야 합니다.');
    }

  } catch (error) {
    console.error('❌ 정산수정용 데이터 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkSettlementsForEdit();
