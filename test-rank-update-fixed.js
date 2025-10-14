// 순위 업데이트 API 테스트 (수정된 버전)
async function testRankUpdateAPI() {
  console.log('🧪 순위 업데이트 API 테스트 시작\n');
  
  // 실제 DB에 있는 키워드로 테스트
  const testData = {
    keyword: '제주 레몬 3kg',
    link_url: 'https://www.coupang.com/vp/products/9045646821?itemId=26546152342&vendorItemId=91612368822&q=%EC%A0%9C%EC%A3%BC+%EB%A0%88%EB%AA%AC&searchId=e12915881181128&sourceType=search&itemsCount=35&sea',
    slot_type: 'coupang',
    current_rank: 15
  };
  
  console.log('📤 테스트 데이터:', testData);
  
  try {
    const response = await fetch('http://localhost:3000/api/rank-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 API 응답:', result);
    
    if (result.success) {
      console.log('✅ 순위 업데이트 성공!');
      console.log('📊 업데이트된 데이터:', result.data);
    } else {
      console.log('❌ 순위 업데이트 실패:', result.error);
    }
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error);
  }
  
  console.log('\n✅ 테스트 완료!');
}

testRankUpdateAPI();