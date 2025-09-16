const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSettlementHistory6() {
  console.log('🔍 settlement_history ID 6 분석');
  console.log('============================================================');

  try {
    // 1. settlement_history ID 6 상세 정보
    console.log('1️⃣ settlement_history ID 6 상세 정보...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .eq('id', 6)
      .single();

    if (historyError || !historyData) {
      console.error('❌ settlement_history ID 6 조회 실패:', historyError);
      return;
    }

    console.log('✅ settlement_history ID 6:');
    console.log(`  - 생성일: ${historyData.created_at}`);
    console.log(`  - 슬롯수: ${historyData.slot_count}`);
    console.log(`  - 결제액: ${historyData.payment_amount}`);
    console.log(`  - 고객명: ${historyData.customer_name}`);

    // 2. 해당 시점 이전의 settlements 확인 (정산 완료 시점 기준)
    console.log('\n2️⃣ 정산 완료 시점 이전의 settlements 확인...');
    const historyCreatedAt = new Date(historyData.created_at);
    console.log(`정산 완료 시점: ${historyCreatedAt.toISOString()}`);

    const { data: beforeSettlements, error: beforeError } = await supabase
      .from('settlements')
      .select('*')
      .eq('customer_id', historyData.customer_id)
      .eq('slot_type', historyData.slot_type)
      .eq('status', 'history')
      .lt('created_at', historyData.created_at)
      .order('created_at', { ascending: true });

    if (beforeError) {
      console.error('❌ 이전 settlements 조회 오류:', beforeError);
      return;
    }

    console.log(`✅ 정산 완료 시점 이전 settlements: ${beforeSettlements.length}개`);
    beforeSettlements.forEach((settlement, index) => {
      console.log(`순번 ${index + 1}:`);
      console.log(`  - ID: ${settlement.id}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 결제타입: ${settlement.payment_type}`);
      console.log(`  - 생성일: ${settlement.created_at}`);
      console.log('---');
    });

    // 3. 해당 시점 이후의 settlements 확인
    console.log('\n3️⃣ 정산 완료 시점 이후의 settlements 확인...');
    const { data: afterSettlements, error: afterError } = await supabase
      .from('settlements')
      .select('*')
      .eq('customer_id', historyData.customer_id)
      .eq('slot_type', historyData.slot_type)
      .eq('status', 'history')
      .gte('created_at', historyData.created_at)
      .order('created_at', { ascending: true });

    if (afterError) {
      console.error('❌ 이후 settlements 조회 오류:', afterError);
      return;
    }

    console.log(`✅ 정산 완료 시점 이후 settlements: ${afterSettlements.length}개`);
    afterSettlements.forEach((settlement, index) => {
      console.log(`순번 ${index + 1}:`);
      console.log(`  - ID: ${settlement.id}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 결제타입: ${settlement.payment_type}`);
      console.log(`  - 생성일: ${settlement.created_at}`);
      console.log('---');
    });

    // 4. 슬롯수 합계 계산
    console.log('\n4️⃣ 슬롯수 합계 계산...');
    const totalSlots = beforeSettlements.reduce((sum, settlement) => sum + settlement.slot_count, 0);
    console.log(`이전 settlements 슬롯수 합계: ${totalSlots}개`);
    console.log(`settlement_history 슬롯수: ${historyData.slot_count}개`);
    
    if (totalSlots === historyData.slot_count) {
      console.log('✅ 슬롯수 합계가 일치합니다!');
      console.log('→ 이전 settlements가 해당 정산에 포함된 것으로 보입니다.');
    } else {
      console.log('⚠️ 슬롯수 합계가 일치하지 않습니다.');
      console.log('→ 다른 settlements가 포함되었을 수 있습니다.');
    }

    // 5. 결제액 합계 계산
    console.log('\n5️⃣ 결제액 합계 계산...');
    const totalAmount = beforeSettlements.reduce((sum, settlement) => sum + settlement.payment_amount, 0);
    console.log(`이전 settlements 결제액 합계: ${totalAmount}원`);
    console.log(`settlement_history 결제액: ${historyData.payment_amount}원`);
    
    if (totalAmount === historyData.payment_amount) {
      console.log('✅ 결제액 합계가 일치합니다!');
    } else {
      console.log('⚠️ 결제액 합계가 일치하지 않습니다.');
    }

    // 6. 정확한 settlements 추정
    console.log('\n6️⃣ 정확한 settlements 추정...');
    console.log('settlement_history ID 6에 포함되어야 할 settlements:');
    
    // 가장 최근 2개 settlements가 ID 6에 포함된 것으로 추정
    const recentSettlements = beforeSettlements.slice(-2);
    console.log(`추정 settlements (최근 2개): ${recentSettlements.length}개`);
    
    recentSettlements.forEach((settlement, index) => {
      console.log(`순번 ${index + 1}:`);
      console.log(`  - ID: ${settlement.id}`);
      console.log(`  - 슬롯수: ${settlement.slot_count}`);
      console.log(`  - 결제타입: ${settlement.payment_type}`);
      console.log(`  - 생성일: ${settlement.created_at}`);
      console.log('---');
    });

    const recentTotalSlots = recentSettlements.reduce((sum, settlement) => sum + settlement.slot_count, 0);
    const recentTotalAmount = recentSettlements.reduce((sum, settlement) => sum + settlement.payment_amount, 0);
    
    console.log(`추정 슬롯수 합계: ${recentTotalSlots}개`);
    console.log(`추정 결제액 합계: ${recentTotalAmount}원`);

  } catch (error) {
    console.error('❌ settlement_history ID 6 분석 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

analyzeSettlementHistory6();
