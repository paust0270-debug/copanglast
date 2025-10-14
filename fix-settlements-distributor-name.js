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

async function fixSettlementsDistributorName() {
  console.log('🔧 settlements 테이블 distributor_name 수정');
  console.log('============================================================');

  try {
    // 1. settlement_history에서 distributor_name 정보 가져오기
    console.log('1️⃣ settlement_history에서 distributor_name 정보 조회...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('id, distributor_name, customer_id, slot_type');

    if (historyError) {
      console.error('❌ settlement_history 조회 오류:', historyError);
      return;
    }

    console.log('✅ settlement_history 조회 성공:', historyData.length, '개');
    historyData.forEach(history => {
      console.log(`  - ID: ${history.id}, 총판명: ${history.distributor_name}, 고객ID: ${history.customer_id}, 슬롯타입: ${history.slot_type}`);
    });

    // 2. settlements 테이블의 distributor_name 업데이트
    console.log('\n2️⃣ settlements 테이블 distributor_name 업데이트...');
    
    for (const history of historyData) {
      console.log(`\n📋 정산내역 ID ${history.id} (총판명: ${history.distributor_name}) 처리 중...`);
      
      // 해당 정산내역과 연결된 settlements 항목들 업데이트
      const { data: updateResult, error: updateError } = await supabase
        .from('settlements')
        .update({ 
          distributor_name: history.distributor_name 
        })
        .eq('customer_id', history.customer_id)
        .eq('slot_type', history.slot_type);

      if (updateError) {
        console.error(`❌ settlements 업데이트 오류:`, updateError);
      } else {
        console.log(`✅ settlements 업데이트 성공 (고객ID: ${history.customer_id}, 슬롯타입: ${history.slot_type})`);
      }
    }

    // 3. 업데이트된 데이터 확인
    console.log('\n3️⃣ 업데이트된 settlements 데이터 확인...');
    const { data: updatedSettlements, error: updatedError } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (updatedError) {
      console.error('❌ 업데이트된 settlements 조회 오류:', updatedError);
    } else {
      console.log('✅ 업데이트된 settlements 조회 성공:', updatedSettlements.length, '개');
      updatedSettlements.forEach((settlement, index) => {
        console.log(`📋 정산 항목 ${index + 1} (ID: ${settlement.id}):`);
        console.log(`  - 고객명: ${settlement.customer_name}`);
        console.log(`  - 총판명: ${settlement.distributor_name || 'NULL'}`);
        console.log(`  - 슬롯타입: ${settlement.slot_type}`);
        console.log(`  - 슬롯수: ${settlement.slot_count}`);
        console.log(`  - 입금자명: ${settlement.payer_name}`);
        console.log(`  - 입금액: ${settlement.payment_amount}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ distributor_name 수정 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

fixSettlementsDistributorName();
