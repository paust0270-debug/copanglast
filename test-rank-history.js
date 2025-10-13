// 순위 히스토리 테스트 스크립트
const API_BASE_URL = 'http://localhost:3000';

async function testRankHistory() {
  console.log('🧪 순위 히스토리 테스트 시작\n');
  
  try {
    // 1. 순위 업데이트 API 테스트 (히스토리 저장)
    console.log('1️⃣ 순위 업데이트 API 테스트 (히스토리 저장)...');
    const rankUpdateData = {
      keyword: '이동식 트롤리',
      link_url: 'https://www.coupang.com/vp/products/8473798698',
      slot_type: 'coupang',
      current_rank: 12,
      slot_sequence: 1
    };
    
    const updateResponse = await fetch(`${API_BASE_URL}/api/rank-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rankUpdateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log('순위 업데이트 결과:', updateResult);
    
    if (updateResult.success) {
      console.log('✅ 순위 업데이트 성공');
      
      // 2. 순위 히스토리 조회 API 테스트
      console.log('\n2️⃣ 순위 히스토리 조회 API 테스트...');
      const historyResponse = await fetch(`${API_BASE_URL}/api/rank-history?customerId=${updateResult.data.customer_id}&slotSequence=${updateResult.data.slot_sequence}`);
      const historyResult = await historyResponse.json();
      
      console.log('히스토리 조회 결과:', historyResult);
      
      if (historyResult.success) {
        console.log('✅ 히스토리 조회 성공');
        console.log(`📊 히스토리 개수: ${historyResult.data.length}개`);
        
        if (historyResult.data.length > 0) {
          console.log('\n📋 히스토리 데이터:');
          historyResult.data.forEach((item, index) => {
            console.log(`${index + 1}. ${item.changeDate} - 순위: ${item.rank}, 등락폭: ${item.rankChange}, 시작대비: ${item.startRankDiff}`);
          });
        }
      } else {
        console.error('❌ 히스토리 조회 실패:', historyResult.error);
      }
    } else {
      console.error('❌ 순위 업데이트 실패:', updateResult.error);
    }
    
    // 3. 추가 순위 업데이트 (변동 테스트)
    console.log('\n3️⃣ 추가 순위 업데이트 (변동 테스트)...');
    const secondUpdateData = {
      ...rankUpdateData,
      current_rank: 8 // 순위 상승
    };
    
    const secondUpdateResponse = await fetch(`${API_BASE_URL}/api/rank-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondUpdateData)
    });
    
    const secondUpdateResult = await secondUpdateResponse.json();
    console.log('두 번째 순위 업데이트 결과:', secondUpdateResult);
    
    if (secondUpdateResult.success) {
      // 최종 히스토리 확인
      console.log('\n4️⃣ 최종 히스토리 확인...');
      const finalHistoryResponse = await fetch(`${API_BASE_URL}/api/rank-history?customerId=${secondUpdateResult.data.customer_id}&slotSequence=${secondUpdateResult.data.slot_sequence}`);
      const finalHistoryResult = await finalHistoryResponse.json();
      
      if (finalHistoryResult.success) {
        console.log(`📊 최종 히스토리 개수: ${finalHistoryResult.data.length}개`);
        console.log('\n📋 최종 히스토리:');
        finalHistoryResult.data.forEach((item, index) => {
          console.log(`${index + 1}. ${item.changeDate} - 순위: ${item.rank}, 등락폭: ${item.rankChange}, 시작대비: ${item.startRankDiff}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
  
  console.log('\n✅ 테스트 완료!');
}

testRankHistory();
