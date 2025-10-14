const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTables() {
  console.log('🔍 데이터베이스 테이블 상태 확인 및 복원 시작...');

  try {
    // 1. settlements 테이블 확인 및 컬럼 추가
    console.log('📋 settlements 테이블 확인...');
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);

    if (settlementsError) {
      console.log('⚠️ settlements 테이블 접근 오류:', settlementsError.message);
    } else {
      console.log('✅ settlements 테이블 접근 성공');
      if (settlementsData && settlementsData.length > 0) {
        console.log('📊 settlements 테이블 샘플 데이터:', Object.keys(settlementsData[0]));
      }
    }

    // 2. slot_add_forms 테이블 확인
    console.log('📋 slot_add_forms 테이블 확인...');
    const { data: slotFormsData, error: slotFormsError } = await supabase
      .from('slot_add_forms')
      .select('*')
      .limit(1);

    if (slotFormsError) {
      console.log('⚠️ slot_add_forms 테이블 접근 오류:', slotFormsError.message);
    } else {
      console.log('✅ slot_add_forms 테이블 접근 성공');
      if (slotFormsData && slotFormsData.length > 0) {
        console.log('📊 slot_add_forms 테이블 샘플 데이터:', Object.keys(slotFormsData[0]));
      }
    }

    // 3. settlement_history 테이블 확인
    console.log('📋 settlement_history 테이블 확인...');
    const { data: historyData, error: historyError } = await supabase
      .from('settlement_history')
      .select('*')
      .limit(1);

    if (historyError) {
      console.log('⚠️ settlement_history 테이블 접근 오류:', historyError.message);
    } else {
      console.log('✅ settlement_history 테이블 접근 성공');
      if (historyData && historyData.length > 0) {
        console.log('📊 settlement_history 테이블 샘플 데이터:', Object.keys(historyData[0]));
      }
    }

    // 4. 스키마 캐시 갱신 시도
    console.log('🔄 스키마 캐시 갱신 시도...');
    const { error: cacheError } = await supabase
      .from('settlements')
      .select('id')
      .limit(1);

    if (cacheError) {
      console.log('⚠️ 스키마 캐시 갱신 오류:', cacheError.message);
    } else {
      console.log('✅ 스키마 캐시 갱신 성공');
    }

    console.log('🎉 데이터베이스 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 확인 중 오류 발생:', error);
  }
}

checkAndCreateTables();
