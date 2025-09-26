const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSettlementEdit() {
  console.log('🧪 정산 수정 API 테스트...');

  try {
    // 1. 먼저 정산 내역 데이터 확인
    console.log('1️⃣ 정산 내역 데이터 확인...');
    const historyResponse = await fetch('http://localhost:3000/api/settlement-history');
    const historyResult = await historyResponse.json();
    console.log('정산 내역:', historyResult.data?.length || 0, '개');
    
    if (historyResult.data && historyResult.data.length > 0) {
      const firstSettlement = historyResult.data[0];
      console.log('첫 번째 정산 내역:', {
        id: firstSettlement.id,
        sequential_number: firstSettlement.sequential_number,
        customer_name: firstSettlement.customer_name,
        payment_amount: firstSettlement.payment_amount
      });

      // 2. 정산 수정 API 테스트
      console.log('2️⃣ 정산 수정 API 테스트...');
      const editResponse = await fetch('http://localhost:3000/api/settlement-requests/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotIds: [86], // 기존 슬롯 ID
          settlementData: {
            sequential_number: firstSettlement.sequential_number,
            distributor_name: '총판A (수정됨)',
            total_slots: 1111,
            total_deposit_amount: 2000000, // 금액 수정
            depositor_name: '수정된입금자',
            deposit_date: '2025-09-16',
            request_date: '2025-09-16',
            memo: '정산 수정 테스트',
            status: 'completed'
          },
          isEditMode: true, // 수정 모드
          settlementHistoryId: firstSettlement.id // 수정할 정산 내역 ID
        }),
      });

      const editResult = await editResponse.json();
      console.log('정산 수정 API 응답:', editResult);

      if (editResponse.ok) {
        console.log('✅ 정산 수정 API 성공!');
        
        // 3. 수정 후 정산 내역 확인
        console.log('3️⃣ 수정 후 정산 내역 확인...');
        const updatedHistoryResponse = await fetch('http://localhost:3000/api/settlement-history');
        const updatedHistoryResult = await updatedHistoryResponse.json();
        console.log('수정 후 정산 내역:', updatedHistoryResult.data?.length || 0, '개');
        
        if (updatedHistoryResult.data && updatedHistoryResult.data.length > 0) {
          const updatedSettlement = updatedHistoryResult.data.find(s => s.id === firstSettlement.id);
          if (updatedSettlement) {
            console.log('수정된 정산 내역:', {
              id: updatedSettlement.id,
              distributor_name: updatedSettlement.distributor_name,
              payment_amount: updatedSettlement.payment_amount,
              memo: updatedSettlement.memo
            });
          }
        }
      } else {
        console.log('❌ 정산 수정 API 실패:', editResult.error);
      }
    } else {
      console.log('❌ 정산 내역이 없어서 수정 테스트를 할 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testSettlementEdit();
