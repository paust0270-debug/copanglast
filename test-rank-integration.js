// 순위 연동 테스트 스크립트
// Node.js 내장 fetch 사용

async function testRankIntegration() {
  console.log('🧪 순위 연동 테스트 시작\n');
  
  try {
    // 1. 순위 업데이트 API 테스트
    console.log('1️⃣ 순위 업데이트 API 테스트...');
    const testData = {
      keyword: '전기톱',
      link_url: 'https://www.coupang.com/vp/products/8980761566?itemId=26293382342&vendorItemId=93323264104&q=gb%EB%A7%88%ED%8A%B8&searchId=5e78774a1759539&sourceType=search&itemsCount=36&searchRank=1&rank=1',
      slot_type: 'coupang',
      current_rank: 15
    };
    
    console.log('📤 테스트 데이터:', testData);
    
    const response = await fetch('http://localhost:3000/api/rank-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 API 응답:', result);
    
    if (result.success) {
      console.log('✅ 순위 업데이트 API 테스트 성공!');
      console.log('📊 업데이트된 데이터:', result.data);
    } else {
      console.log('❌ 순위 업데이트 API 테스트 실패:', result.error);
    }
    
    // 2. Keywords API 테스트
    console.log('\n2️⃣ Keywords API 테스트...');
    const keywordsResponse = await fetch('http://localhost:3000/api/keywords');
    const keywordsResult = await keywordsResponse.json();
    
    if (keywordsResult.success) {
      console.log(`✅ Keywords API 테스트 성공! (${keywordsResult.data.length}개 키워드)`);
      if (keywordsResult.data.length > 0) {
        console.log('📋 첫 번째 키워드:', keywordsResult.data[0]);
      }
    } else {
      console.log('❌ Keywords API 테스트 실패:', keywordsResult.error);
    }
    
    console.log('\n✅ 전체 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  }
}

// 서버가 실행 중인지 확인
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/keywords');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 서버 상태 확인 중...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 서버가 실행되지 않았습니다.');
    console.log('💡 다음 명령어로 서버를 시작하세요:');
    console.log('   cd copangappfinal && npm run dev');
    return;
  }
  
  console.log('✅ 서버가 실행 중입니다.');
  await testRankIntegration();
}

main();
