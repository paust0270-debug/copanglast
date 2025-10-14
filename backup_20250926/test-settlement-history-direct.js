const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementHistoryDirect() {
  console.log('🔍 settlement_history 직접 조회 테스트');
  console.log('============================================================');

  try {
    // 1. ID=4인 settlement_history 데이터 직접 조회
    console.log('1️⃣ ID=4 settlement_history 데이터 조회...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('payer_name, memo, payment_amount, customer_id, slot_count, slot_type, distributor_name, customer_name, payment_type, usage_days, status, created_at')
      .eq('id', 4)
      .single();

    if (historyError) {
      console.error('❌ settlement_history 조회 오류:', historyError);
      return;
    }

    if (!historyData) {
      console.log('❌ ID=4 settlement_history 데이터를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ settlement_history 데이터 조회 성공:');
    console.log(JSON.stringify(historyData, null, 2));

    // 2. 데이터 변환 테스트
    console.log('\n2️⃣ 데이터 변환 테스트...');
    const settlementData = {
      id: historyData.id.toString(),
      customer_id: historyData.customer_id,
      customer_name: historyData.customer_name,
      distributor_name: historyData.distributor_name,
      slot_type: historyData.slot_type,
      slot_count: historyData.slot_count,
      payment_type: historyData.payment_type,
      payer_name: historyData.payer_name,
      payment_amount: historyData.payment_amount,
      usage_days: historyData.usage_days,
      memo: historyData.memo,
      status: historyData.status,
      created_at: historyData.created_at,
      updated_at: historyData.created_at
    };

    console.log('✅ 변환된 settlement 데이터:');
    console.log(JSON.stringify(settlementData, null, 2));

    // 3. 최종 응답 형식 테스트
    console.log('\n3️⃣ 최종 응답 형식 테스트...');
    const finalResponse = {
      success: true,
      data: [settlementData],
      settlementInfo: {
        payer_name: historyData.payer_name,
        deposit_date: historyData.created_at ? historyData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        memo: historyData.memo,
        include_tax_invoice: false,
        totalAmount: historyData.payment_amount,
        baseAmount: historyData.payment_amount,
        taxAmount: Math.floor(historyData.payment_amount * 0.1)
      }
    };

    console.log('✅ 최종 응답 형식:');
    console.log(JSON.stringify(finalResponse, null, 2));

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testSettlementHistoryDirect();
