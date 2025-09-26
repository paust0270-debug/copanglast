const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoupangAppAddPage() {
  console.log('🎯 쿠팡앱 추가 페이지 등록된 고객 목록 테스트');
  console.log('============================================================');

  try {
    // 1. getCustomers 함수 테스트
    console.log('1️⃣ getCustomers 함수 테스트...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ getCustomers 함수 오류:', customersError);
    } else {
      console.log('✅ getCustomers 함수 성공');
      console.log('📊 등록된 고객 수:', customersData?.length || 0);
      
      if (customersData && customersData.length > 0) {
        console.log('📋 고객 목록:');
        customersData.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name || '이름없음'} (${customer.nickname || '닉네임없음'})`);
        });
      }
    }

    // 2. 쿠팡앱 추가 페이지 API 테스트
    console.log('\n2️⃣ 쿠팡앱 추가 페이지 API 테스트...');
    const addPageResponse = await fetch('http://localhost:3000/api/coupangapp/add');
    
    if (addPageResponse.ok) {
      console.log('✅ 쿠팡앱 추가 페이지 API 응답 성공');
    } else {
      console.error('❌ 쿠팡앱 추가 페이지 API 오류:', addPageResponse.status);
    }

    // 3. 실제 페이지 접근 테스트
    console.log('\n3️⃣ 실제 페이지 접근 테스트...');
    const pageResponse = await fetch('http://localhost:3000/coupangapp/add?customerId=fea25adc-5b0b-4de2-8182-63ebf5d4e2ed&username=wannass&slotCount=100&customerName=%EA%B9%80%EC%A3%BC%EC%98%81&slotType=%EC%BF%A0%ED%8C%A1');
    
    if (pageResponse.ok) {
      console.log('✅ 쿠팡앱 추가 페이지 접근 성공');
      const pageContent = await pageResponse.text();
      
      // 등록된 고객 목록이 포함되어 있는지 확인
      if (pageContent.includes('등록된 고객 목록') || pageContent.includes('customer')) {
        console.log('✅ 등록된 고객 목록이 페이지에 포함되어 있습니다');
      } else {
        console.log('⚠️ 등록된 고객 목록이 페이지에 포함되지 않았을 수 있습니다');
      }
    } else {
      console.error('❌ 쿠팡앱 추가 페이지 접근 오류:', pageResponse.status);
    }

    console.log('\n============================================================');
    console.log('🎉 쿠팡앱 추가 페이지 등록된 고객 목록 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testCoupangAppAddPage();
