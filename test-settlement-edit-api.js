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
  console.log('🧪 정산 수정 API 테스트...');

  try {
    // 1. 현재 정산 내역 확인
    console.log('1️⃣ 현재 정산 내역 확인...');
    const historyResponse = await fetch('http://localhost:3000/api/settlement-history');
    const historyResult = await historyResponse.json();
    
    if (historyResult.success && historyResult.data && historyResult.data.length > 0) {
      const firstSettlement = historyResult.data[0];
      console.log('첫 번째 정산 내역:', {
        id: firstSettlement.id,
        sequential_number: firstSettlement.sequential_number,
        distributor_name: firstSettlement.distributor_name,
        payment_amount: firstSettlement.payment_amount,
        memo: firstSettlement.memo
      });

      // 2. 정산 수정 API 호출
      console.log('2️⃣ 정산 수정 API 호출...');
      const editResponse = await fetch('http://localhost:3000/api/settlement-requests/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotIds: [86], // 기존 슬롯 ID
          settlementData: {
            payer_name: '수정된입금자',
            totalAmount: 2000000, // 금액 수정
            memo: '정산 수정 테스트 메모',
            depositDate: '2025-09-16',
            includeTaxInvoice: false
          },
          isEditMode: true, // 수정 모드
          settlementHistoryId: firstSettlement.id // 수정할 정산 내역 ID
        }),
      });

      const editResult = await editResponse.json();
      console.log('정산 수정 API 응답:', editResult);

      if (editResponse.ok && editResult.success) {
        console.log('✅ 정산 수정 API 성공!');
        
        // 3. 수정 후 정산 내역 확인
        console.log('3️⃣ 수정 후 정산 내역 확인...');
        const updatedHistoryResponse = await fetch('http://localhost:3000/api/settlement-history');
        const updatedHistoryResult = await updatedHistoryResponse.json();
        
        if (updatedHistoryResult.success && updatedHistoryResult.data) {
          const updatedSettlement = updatedHistoryResult.data.find(s => s.id === firstSettlement.id);
          if (updatedSettlement) {
            console.log('수정된 정산 내역:', {
              id: updatedSettlement.id,
              distributor_name: updatedSettlement.distributor_name,
              payment_amount: updatedSettlement.payment_amount,
              memo: updatedSettlement.memo,
              payer_name: updatedSettlement.payer_name
            });
            console.log('✅ 정산 수정이 성공적으로 완료되었습니다!');
          } else {
            console.log('❌ 수정된 정산 내역을 찾을 수 없습니다.');
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

testSettlementEditAPI();
