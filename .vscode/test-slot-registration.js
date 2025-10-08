const fetch = require('node-fetch');

async function testSlotRegistration() {
  try {
    console.log('🔄 슬롯 등록 API 테스트 시작...');
    
    // 테스트 데이터
    const testData = {
      customer_id: 'test-customer-123',
      customer_name: '테스트 고객',
      distributor: '일반',
      work_group: '공통',
      keyword: '테스트 키워드',
      link_url: 'https://www.coupang.com/vp/products/test',
      memo: '테스트 메모',
      current_rank: '1 [0]',
      start_rank: '1 [0]',
      slot_count: 1,
      traffic: '0 (0/0)',
      equipment_group: '지정안함',
      usage_days: 30,
      status: '작동중',
      slot_type: '쿠팡'
    };
    
    console.log('📋 테스트 데이터:', testData);
    
    // API 호출
    const response = await fetch('http://localhost:3000/api/slot-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📡 API 응답 상태:', response.status, response.ok);
    
    const result = await response.json();
    console.log('📊 API 응답 데이터:', result);
    
    if (response.ok) {
      console.log('✅ 슬롯 등록 성공!');
    } else {
      console.log('❌ 슬롯 등록 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testSlotRegistration();

