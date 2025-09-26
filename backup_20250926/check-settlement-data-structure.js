const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettlementData() {
  console.log('🔍 정산 데이터 구조 확인');
  console.log('============================================================');

  try {
    // 1. settlement_history ID 6 확인
    console.log('1️⃣ settlement_history ID 6 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .eq('id', 6)
      .single();

    if (historyError) {
      console.error('❌ settlement_history ID 6 조회 오류:', historyError);
      return;
    }

    if (!historyData) {
      console.log('⚠️ settlement_history ID 6이 존재하지 않습니다.');
      return;
    }

    console.log('✅ settlement_history ID 6 데이터:');
    console.log(`  - ID: ${historyData.id}`);
    console.log(`  - 고객ID: ${historyData.customer_id}`);
    console.log(`  - 고객명: ${historyData.customer_name}`);
    console.log(`  - 슬롯타입: ${historyData.slot_type}`);
    console.log(`  - 슬롯수: ${historyData.slot_count}`);
    console.log(`  - 총판명: ${historyData.distributor_name}`);
    console.log(`  - 결제액: ${historyData.payment_amount}`);
    console.log(`  - 생성일: ${historyData.created_at}`);

    // 2. 해당 고객의 모든 settlements 확인
    console.log('\n2️⃣ 해당 고객의 모든 settlements 확인...');
    const { data: allSettlements, error: allSettlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('customer_id', historyData.customer_id)
      .eq('slot_type', historyData.slot_type)
      .order('created_at', { ascending: true });

    if (allSettlementsError) {
      console.error('❌ settlements 조회 오류:', allSettlementsError);
      return;
    }

    console.log(`✅ 해당 고객의 모든 settlements: ${allSettlements.length}개`);
    allSettlements.forEach((settlement, index) => {
      console.log(`순번 ${index + 1}:`);
      console.log(`  - ID: ${settlement.id}`);
      console.log(`  - 고객명: ${settlement.customer_name}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 결제타입: ${settlement.payment_type}`);
      console.log(`  - 상태: ${settlement.status}`);
      console.log(`  - 생성일: ${settlement.created_at}`);
      console.log('---');
    });

    // 3. status가 'history'인 settlements만 확인
    console.log('\n3️⃣ status가 "history"인 settlements만 확인...');
    const { data: historySettlements, error: historySettlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('customer_id', historyData.customer_id)
      .eq('slot_type', historyData.slot_type)
      .eq('status', 'history')
      .order('created_at', { ascending: true });

    if (historySettlementsError) {
      console.error('❌ history settlements 조회 오류:', historySettlementsError);
      return;
    }

    console.log(`✅ status가 "history"인 settlements: ${historySettlements.length}개`);
    historySettlements.forEach((settlement, index) => {
      console.log(`순번 ${index + 1}:`);
      console.log(`  - ID: ${settlement.id}`);
      console.log(`  - 고객명: ${settlement.customer_name}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 결제타입: ${settlement.payment_type}`);
      console.log(`  - 상태: ${settlement.status}`);
      console.log(`  - 생성일: ${settlement.created_at}`);
      console.log('---');
    });

    // 4. settlement_history 테이블 구조 확인
    console.log('\n4️⃣ settlement_history 테이블 구조 확인...');
    const { data: allHistory, error: allHistoryError } = await supabase
      .from('settlement_history')
      .select('*')
      .order('created_at', { ascending: true });

    if (allHistoryError) {
      console.error('❌ settlement_history 전체 조회 오류:', allHistoryError);
      return;
    }

    console.log(`✅ 전체 settlement_history: ${allHistory.length}개`);
    allHistory.forEach((history, index) => {
      console.log(`정산내역 ${index + 1}:`);
      console.log(`  - ID: ${history.id}`);
      console.log(`  - 고객명: ${history.customer_name}`);
      console.log(`  - 슬롯수: ${history.slot_count}`);
      console.log(`  - 총판명: ${history.distributor_name}`);
      console.log(`  - 결제액: ${history.payment_amount}`);
      console.log(`  - 생성일: ${history.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ 정산 데이터 구조 확인 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

checkSettlementData();
