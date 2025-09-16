const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSlotAddWithDistributorName() {
  console.log('🧪 슬롯 추가 API 테스트 (distributor_name 포함)');
  console.log('============================================================');

  try {
    // 1. 슬롯 추가 API 호출 테스트
    console.log('1️⃣ 슬롯 추가 API 호출 테스트...');
    
    const slotAddData = {
      customerId: 'fea25adc-5b0b-4de2-8182-63ebf5d4e2ed',
      customerName: '김주영',
      slotType: 'coupang',
      slotCount: 10,
      paymentType: 'deposit',
      payerName: '김주영',
      paymentAmount: 100000,
      usageDays: 30,
      memo: '테스트 슬롯 추가'
    };

    console.log('슬롯 추가 데이터:', slotAddData);

    const response = await fetch('http://localhost:3000/api/slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slotAddData)
    });

    const result = await response.json();

    console.log('API 응답 상태:', response.status);
    console.log('API 응답 결과:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ 슬롯 추가 API 호출 성공!');
    } else {
      console.log('❌ 슬롯 추가 API 호출 실패:', result.error);
    }

    // 2. settlements 테이블에서 distributor_name 확인
    console.log('\n2️⃣ settlements 테이블에서 distributor_name 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (settlementsError) {
      console.error('❌ settlements 테이블 조회 오류:', settlementsError);
    } else {
      console.log('✅ settlements 테이블 조회 성공:', settlementsData.length, '개');
      console.log('\n📋 최근 settlements 데이터:');
      settlementsData.forEach(settlement => {
        console.log(`정산 ${settlement.id}:`);
        console.log(`  - 고객명: ${settlement.customer_name}`);
        console.log(`  - 총판명: ${settlement.distributor_name || 'NULL'}`);
        console.log(`  - 슬롯타입: ${settlement.slot_type}`);
        console.log(`  - 슬롯수: ${settlement.slot_count}`);
        console.log(`  - 결제타입: ${settlement.payment_type}`);
        console.log(`  - 입금액: ${settlement.payment_amount}`);
        console.log('---');
      });
    }

    // 3. 미정산내역 API 테스트
    console.log('\n3️⃣ 미정산내역 API 테스트...');
    const unsettledResponse = await fetch('http://localhost:3000/api/settlements/unsettled');
    const unsettledResult = await unsettledResponse.json();

    console.log('미정산내역 API 응답 상태:', unsettledResponse.status);
    console.log('미정산내역 API 응답 결과:', JSON.stringify(unsettledResult, null, 2));

    if (unsettledResult.success) {
      console.log('✅ 미정산내역 API 호출 성공!');
      console.log(`📋 미정산내역 개수: ${unsettledResult.data.length}개`);
      
      if (unsettledResult.data.length > 0) {
        console.log('\n📋 미정산내역 목록:');
        unsettledResult.data.forEach(settlement => {
          console.log(`정산 ${settlement.id}:`);
          console.log(`  - 고객명: ${settlement.customer_name}`);
          console.log(`  - 총판명: ${settlement.distributor_name || 'NULL'}`);
          console.log(`  - 슬롯타입: ${settlement.slot_type}`);
          console.log(`  - 슬롯수: ${settlement.slot_count}`);
          console.log(`  - 결제타입: ${settlement.payment_type}`);
          console.log(`  - 입금액: ${settlement.payment_amount}`);
          console.log('---');
        });
      }
    } else {
      console.log('❌ 미정산내역 API 호출 실패:', unsettledResult.error);
    }

  } catch (error) {
    console.error('❌ 슬롯 추가 API 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testSlotAddWithDistributorName();
