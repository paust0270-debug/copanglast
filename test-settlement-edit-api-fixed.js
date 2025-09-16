const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementEditAPI() {
  console.log('🧪 정산수정 API 테스트 (ID: 6)');
  console.log('============================================================');

  try {
    // 1. 정산수정 API 호출
    console.log('1️⃣ 정산수정 API 호출...');
    const response = await fetch('http://localhost:3000/api/settlement-requests/edit/6');
    const result = await response.json();

    console.log('API 응답 상태:', response.status);
    console.log('API 응답 결과:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ 정산수정 API 호출 성공!');
      console.log(`📋 반환된 settlements 개수: ${result.data.length}개`);
      
      if (result.data.length > 0) {
        console.log('\n📋 반환된 settlements 목록:');
        result.data.forEach((settlement, index) => {
          console.log(`순번 ${index + 1}:`);
          console.log(`  - ID: ${settlement.id}`);
          console.log(`  - 고객명: ${settlement.customer_name}`);
          console.log(`  - 슬롯수: ${settlement.slot_count}`);
          console.log(`  - 결제타입: ${settlement.payment_type}`);
          console.log(`  - 결제액: ${settlement.payment_amount}`);
          console.log(`  - 총판명: ${settlement.distributor_name}`);
          console.log(`  - 생성일: ${settlement.created_at}`);
          console.log('---');
        });

        // 슬롯수와 결제액 합계 확인
        const totalSlots = result.data.reduce((sum, settlement) => sum + settlement.slot_count, 0);
        const totalAmount = result.data.reduce((sum, settlement) => sum + settlement.payment_amount, 0);
        
        console.log(`\n📊 합계 확인:`);
        console.log(`  - 슬롯수 합계: ${totalSlots}개`);
        console.log(`  - 결제액 합계: ${totalAmount}원`);
        console.log(`  - settlement_history 슬롯수: ${result.settlementInfo.totalAmount ? '확인 필요' : 'N/A'}`);
      }
    } else {
      console.log('❌ 정산수정 API 호출 실패:', result.error);
    }

    // 2. settlement_history ID 6 직접 확인
    console.log('\n2️⃣ settlement_history ID 6 직접 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .eq('id', 6)
      .single();

    if (historyError) {
      console.error('❌ settlement_history ID 6 조회 오류:', historyError);
    } else {
      console.log('✅ settlement_history ID 6:');
      console.log(`  - 슬롯수: ${historyData.slot_count}`);
      console.log(`  - 결제액: ${historyData.payment_amount}`);
      console.log(`  - 고객명: ${historyData.customer_name}`);
      console.log(`  - 총판명: ${historyData.distributor_name}`);
    }

    // 3. 예상 결과와 비교
    console.log('\n3️⃣ 예상 결과와 비교...');
    console.log('✅ 예상 결과:');
    console.log('  - 순번 4: ID 96 (슬롯수 11, 결제액 10,000)');
    console.log('  - 순번 5: ID 97 (슬롯수 11, 결제액 2,222)');
    console.log('  - 총 슬롯수: 22개');
    console.log('  - 총 결제액: 12,222원');

  } catch (error) {
    console.error('❌ 정산수정 API 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testSettlementEditAPI();