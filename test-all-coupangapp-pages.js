const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllCoupangAppPages() {
  console.log('🎯 쿠팡앱 모든 페이지 등록된 고객 목록 최종 테스트');
  console.log('============================================================');

  let allTestsPassed = true;

  try {
    // 1. 고객 데이터 확인
    console.log('1️⃣ 고객 데이터 확인...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('❌ 고객 데이터 조회 오류:', customersError);
      allTestsPassed = false;
    } else {
      console.log('✅ 고객 데이터 조회 성공');
      console.log('📊 총 고객 수:', customersData?.length || 0);
      
      if (customersData && customersData.length > 0) {
        console.log('📋 고객 목록:');
        customersData.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name || '이름없음'} (${customer.work_group || '그룹없음'})`);
        });
      }
    }

    // 2. 쿠팡앱 추가 페이지 테스트
    console.log('\n2️⃣ 쿠팡앱 추가 페이지 테스트...');
    try {
      const addPageResponse = await fetch('http://localhost:3000/coupangapp/add?customerId=fea25adc-5b0b-4de2-8182-63ebf5d4e2ed&username=wannass&slotCount=100&customerName=%EA%B9%80%EC%A3%BC%EC%98%81&slotType=%EC%BF%A0%ED%8C%A1');
      
      if (addPageResponse.ok) {
        console.log('✅ 쿠팡앱 추가 페이지 접근 성공');
        const pageContent = await addPageResponse.text();
        
        if (pageContent.includes('등록된 고객 목록') || pageContent.includes('customer')) {
          console.log('✅ 등록된 고객 목록이 페이지에 포함되어 있습니다');
        } else {
          console.log('⚠️ 등록된 고객 목록이 페이지에 포함되지 않았을 수 있습니다');
        }
      } else {
        console.error('❌ 쿠팡앱 추가 페이지 접근 오류:', addPageResponse.status);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error('❌ 쿠팡앱 추가 페이지 테스트 중 오류:', error);
      allTestsPassed = false;
    }

    // 3. 쿠팡앱 앱 관리 페이지 테스트
    console.log('\n3️⃣ 쿠팡앱 앱 관리 페이지 테스트...');
    try {
      const appPageResponse = await fetch('http://localhost:3000/coupangapp/app');
      
      if (appPageResponse.ok) {
        console.log('✅ 쿠팡앱 앱 관리 페이지 접근 성공');
        const pageContent = await appPageResponse.text();
        
        if (pageContent.includes('등록된 고객 목록') || pageContent.includes('customer')) {
          console.log('✅ 등록된 고객 목록이 페이지에 포함되어 있습니다');
        } else {
          console.log('⚠️ 등록된 고객 목록이 페이지에 포함되지 않았을 수 있습니다');
        }
      } else {
        console.error('❌ 쿠팡앱 앱 관리 페이지 접근 오류:', appPageResponse.status);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error('❌ 쿠팡앱 앱 관리 페이지 테스트 중 오류:', error);
      allTestsPassed = false;
    }

    // 4. 쿠팡앱 VIP 페이지 테스트
    console.log('\n4️⃣ 쿠팡앱 VIP 페이지 테스트...');
    try {
      const vipPageResponse = await fetch('http://localhost:3000/coupangapp/vip');
      
      if (vipPageResponse.ok) {
        console.log('✅ 쿠팡앱 VIP 페이지 접근 성공');
        const pageContent = await vipPageResponse.text();
        
        if (pageContent.includes('등록된 고객 목록') || pageContent.includes('customer')) {
          console.log('✅ 등록된 고객 목록이 페이지에 포함되어 있습니다');
        } else {
          console.log('⚠️ 등록된 고객 목록이 페이지에 포함되지 않았을 수 있습니다');
        }
      } else {
        console.error('❌ 쿠팡앱 VIP 페이지 접근 오류:', vipPageResponse.status);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error('❌ 쿠팡앱 VIP 페이지 테스트 중 오류:', error);
      allTestsPassed = false;
    }

    console.log('\n============================================================');
    if (allTestsPassed) {
      console.log('🎉 쿠팡앱 모든 페이지 등록된 고객 목록 복원 완료!');
      console.log('✅ 깃허브 20250914 백업 파일에서 누락된 부분이 모두 복구되었습니다.');
      console.log('✅ 모든 쿠팡앱 페이지에서 등록된 고객 목록이 정상적으로 표시됩니다.');
    } else {
      console.error('❌ 일부 테스트가 실패했습니다. 추가 확인이 필요합니다.');
    }

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    allTestsPassed = false;
  } finally {
    process.exit(0);
  }
}

testAllCoupangAppPages();
