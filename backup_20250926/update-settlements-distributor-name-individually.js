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

async function updateSettlementsDistributorNameIndividually() {
  console.log('🔧 settlements 테이블 distributor_name을 총판B로 개별 업데이트');
  console.log('============================================================');

  try {
    // 1. 기존 settlements 데이터 확인
    console.log('1️⃣ 기존 settlements 데이터 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*');

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
      return;
    }

    console.log('✅ settlements 테이블 조회 성공:', settlementsData.length, '개');

    // 2. 각 settlements 항목을 개별적으로 업데이트
    console.log('\n2️⃣ settlements distributor_name 개별 업데이트...');
    
    for (const settlement of settlementsData) {
      console.log(`정산 ${settlement.id} (${settlement.customer_name}) 업데이트 중...`);
      
      const { error: updateError } = await supabase
        .from('settlements')
        .update({ distributor_name: '총판B' })
        .eq('id', settlement.id);

      if (updateError) {
        console.error(`❌ 정산 ${settlement.id} 업데이트 오류:`, updateError);
      } else {
        console.log(`✅ 정산 ${settlement.id} 업데이트 성공!`);
      }
    }

    // 3. settlement_history도 개별적으로 업데이트
    console.log('\n3️⃣ settlement_history distributor_name 개별 업데이트...');
    
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*');

    if (historyError) {
      console.error('❌ settlement_history 테이블 조회 오류:', historyError);
    } else {
      console.log('✅ settlement_history 테이블 조회 성공:', historyData.length, '개');
      
      for (const history of historyData) {
        console.log(`정산내역 ${history.id} (${history.customer_name}) 업데이트 중...`);
        
        const { error: historyUpdateError } = await supabase
          .from('settlement_history')
          .update({ distributor_name: '총판B' })
          .eq('id', history.id);

        if (historyUpdateError) {
          console.error(`❌ 정산내역 ${history.id} 업데이트 오류:`, historyUpdateError);
        } else {
          console.log(`✅ 정산내역 ${history.id} 업데이트 성공!`);
        }
      }
    }

    // 4. 업데이트된 데이터 확인
    console.log('\n4️⃣ 업데이트된 데이터 확인...');
    
    const { data: updatedSettlements, error: updatedSettlementsError } = await supabase
      .from('settlements')
      .select('id, customer_name, distributor_name');

    if (updatedSettlementsError) {
      console.error('❌ 업데이트된 settlements 데이터 조회 오류:', updatedSettlementsError);
    } else {
      console.log('✅ 업데이트된 settlements 데이터:');
      updatedSettlements.forEach(settlement => {
        console.log(`  - 정산 ${settlement.id}: ${settlement.customer_name} - distributor_name = ${settlement.distributor_name}`);
      });
    }

    const { data: updatedHistory, error: updatedHistoryError } = await supabase
      .from('settlement_history')
      .select('id, customer_name, distributor_name');

    if (updatedHistoryError) {
      console.error('❌ 업데이트된 settlement_history 데이터 조회 오류:', updatedHistoryError);
    } else {
      console.log('✅ 업데이트된 settlement_history 데이터:');
      updatedHistory.forEach(history => {
        console.log(`  - 정산내역 ${history.id}: ${history.customer_name} - distributor_name = ${history.distributor_name}`);
      });
    }

  } catch (error) {
    console.error('❌ distributor_name 업데이트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

updateSettlementsDistributorNameIndividually();
