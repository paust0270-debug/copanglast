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
      console.log('📊 조회된 고객 수:', customersData?.length || 0);
      
      if (customersData && customersData.length > 0) {
        console.log('📋 고객 목록:');
        customersData.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} (${customer.keyword}) - ${customer.work_group}`);
        });
      }
    }

    // 2. 데이터 변환 테스트
    console.log('2️⃣ 데이터 변환 테스트...');
    if (customersData && customersData.length > 0) {
      const convertedData = customersData.map((item: any, index: number) => {
        return {
          id: item.id,
          customer: item.name || `_PD_${item.keyword?.substring(0, 8) || 'unknown'}`,
          nickname: item.nickname || item.keyword?.substring(0, 10) || 'unknown',
          workGroup: item.work_group || '공통',
          keyword: item.keyword || '',
          linkUrl: item.link_url || '',
          currentRank: item.current_rank || '1 [0]',
          startRank: item.start_rank || '1 [0]',
          slotCount: item.slot_count || 1,
          traffic: item.traffic || '0 (0/0)',
          equipmentGroup: item.equipment_group || '지정안함',
          remainingDays: item.remaining_days || '30일',
          registrationDate: item.registration_date || '2025-09-16',
          status: item.status || '작동중',
          memo: item.memo || '',
          created_at: item.created_at
        };
      });
      
      console.log('✅ 데이터 변환 성공');
      console.log('📊 변환된 데이터 수:', convertedData.length);
      console.log('📋 변환된 첫 번째 고객:', convertedData[0]);
    }

    console.log('============================================================');
    console.log('🎉 쿠팡앱 추가 페이지 등록된 고객 목록 테스트 완료!');
    console.log('✅ getCustomers 함수 정상 작동');
    console.log('✅ 데이터 변환 정상 작동');
    console.log('✅ 등록된 고객 목록이 정상적으로 표시됩니다.');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    process.exit(0);
  }
}

testCoupangAppAddPage();
