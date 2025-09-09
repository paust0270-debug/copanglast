const fetch = require('node-fetch');

async function testAPIs() {
  try {
    console.log('🔍 API 테스트 시작...\n');

    // 1. unsettled API 테스트
    console.log('1. /api/settlements/unsettled 테스트');
    const unsettledResponse = await fetch('http://localhost:3000/api/settlements/unsettled');
    const unsettledData = await unsettledResponse.json();
    
    console.log('Status:', unsettledResponse.status);
    console.log('Data count:', unsettledData?.length || 0);
    if (unsettledData && unsettledData.length > 0) {
      console.log('First item:', JSON.stringify(unsettledData[0], null, 2));
    }
    console.log('');

    // 2. settlements API 테스트
    console.log('2. /api/settlements 테스트');
    const settlementsResponse = await fetch('http://localhost:3000/api/settlements');
    const settlementsData = await settlementsResponse.json();
    
    console.log('Status:', settlementsResponse.status);
    console.log('Data count:', settlementsData?.length || 0);
    if (settlementsData && settlementsData.length > 0) {
      console.log('First item:', JSON.stringify(settlementsData[0], null, 2));
    }
    console.log('');

    // 3. settlement-requests API 테스트
    console.log('3. /api/settlement-requests 테스트');
    const requestsResponse = await fetch('http://localhost:3000/api/settlement-requests');
    const requestsData = await requestsResponse.json();
    
    console.log('Status:', requestsResponse.status);
    console.log('Data count:', requestsData?.length || 0);
    if (requestsData && requestsData.length > 0) {
      console.log('First item:', JSON.stringify(requestsData[0], null, 2));
    }

  } catch (error) {
    console.error('❌ API 테스트 오류:', error.message);
  }
}

testAPIs();
