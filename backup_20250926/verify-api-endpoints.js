const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAPIEndpoints() {
  console.log('🔍 API 엔드포인트 검증');
  console.log('============================================================');

  const apiEndpoints = [
    { name: '슬롯 목록 조회', url: 'http://localhost:3000/api/slots', method: 'GET' },
    { name: '슬롯 추가', url: 'http://localhost:3000/api/slots', method: 'POST', body: {
      customerId: 'test-customer',
      customerName: '테스트고객',
      slotType: 'coupang',
      slotCount: 1,
      paymentType: 'deposit',
      payerName: '테스트입금자',
      paymentAmount: 10000,
      usageDays: 30,
      memo: 'API 테스트'
    }},
    { name: '미정산내역 조회', url: 'http://localhost:3000/api/settlements/unsettled', method: 'GET' },
    { name: '정산내역 조회', url: 'http://localhost:3000/api/settlement-history', method: 'GET' },
    { name: '고객 목록 조회', url: 'http://localhost:3000/api/customers', method: 'GET' },
    { name: '슬롯 상태 업데이트', url: 'http://localhost:3000/api/slots', method: 'PUT', body: {
      slotId: 1,
      status: 'active'
    }},
    { name: '슬롯 연장', url: 'http://localhost:3000/api/slots/extend', method: 'POST', body: {
      slotId: 1,
      paymentType: 'extension',
      payerName: '테스트입금자',
      paymentAmount: 50000,
      usageDays: 30
    }},
    { name: '정산 완료', url: 'http://localhost:3000/api/settlement-requests/complete', method: 'POST', body: {
      slotIds: ['1'],
      settlementData: {
        payerName: '테스트입금자',
        depositDate: '2025-09-16',
        memo: 'API 테스트',
        includeTaxInvoice: false,
        totalAmount: 10000,
        baseAmount: 10000,
        taxAmount: 1000
      }
    }},
    { name: '정산 수정 데이터 조회', url: 'http://localhost:3000/api/settlement-requests/edit/4', method: 'GET' },
    { name: '슬롯 추가 폼 저장', url: 'http://localhost:3000/api/slot-add-forms', method: 'POST', body: {
      customerId: 'test-customer',
      customerName: '테스트고객',
      slotType: 'coupang',
      slotCount: 1,
      paymentType: 'deposit',
      payerName: '테스트입금자',
      paymentAmount: 10000,
      usageDays: 30,
      memo: 'API 테스트'
    }}
  ];

  try {
    for (const endpoint of apiEndpoints) {
      console.log(`\n📋 ${endpoint.name} API 테스트...`);
      
      try {
        const options = {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          }
        };

        if (endpoint.body) {
          options.body = JSON.stringify(endpoint.body);
        }

        const response = await fetch(endpoint.url, options);
        const result = await response.json();

        if (response.ok) {
          console.log(`✅ ${endpoint.name}: 성공 (${response.status})`);
          if (result.success !== undefined) {
            console.log(`   응답 성공 여부: ${result.success}`);
          }
          if (result.data) {
            console.log(`   데이터 개수: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
          }
        } else {
          console.log(`❌ ${endpoint.name}: 실패 (${response.status})`);
          console.log(`   오류: ${result.error || '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: 네트워크 오류`);
        console.log(`   오류: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ API 엔드포인트 검증 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

verifyAPIEndpoints();
