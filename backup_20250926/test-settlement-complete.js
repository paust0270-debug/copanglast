const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementComplete() {
  console.log('🧪 정산 완료 API 테스트...');

  try {
    // 정산 완료 API 호출
    const response = await fetch('http://localhost:3000/api/settlement-requests/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slotIds: [86],
        settlementData: {
          sequential_number: 1,
          distributor_name: '총판A',
          total_slots: 1111,
          total_deposit_amount: 1650000,
          depositor_name: '감자탕',
          deposit_date: '2025-09-16',
          request_date: '2025-09-16',
          memo: '',
          status: 'completed'
        }
      }),
    });

    const result = await response.json();
    console.log('정산 완료 API 응답:', result);

    if (response.ok) {
      console.log('✅ 정산 완료 API 성공!');
    } else {
      console.log('❌ 정산 완료 API 실패:', result.error);
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testSettlementComplete();
