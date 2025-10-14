const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlotsTableConstraints() {
  try {
    console.log('🔍 slots 테이블 제약조건 확인 중...');

    // slots 테이블에서 데이터 조회 시도
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ slots 테이블 접근 오류:', error);
      return;
    }

    console.log('✅ slots 테이블 접근 성공');

    // 현재 사용 가능한 status 값들 확인
    const { data: statusData, error: statusError } = await supabase
      .from('slots')
      .select('status')
      .limit(10);

    if (statusError) {
      console.log('⚠️ status 값 조회 실패:', statusError.message);
    } else {
      console.log('📋 현재 slots 테이블의 status 값들:');
      const uniqueStatuses = [...new Set(statusData.map(item => item.status))];
      uniqueStatuses.forEach(status => {
        console.log(`   - ${status}`);
      });
    }

    // 제약조건 정보 확인 시도
    console.log('\n🔍 제약조건 정보 확인 중...');
    
    // PostgreSQL 시스템 테이블에서 제약조건 정보 조회
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('get_table_constraints', { 
        table_name: 'slots',
        schema_name: 'public'
      });

    if (constraintError) {
      console.log('⚠️ 제약조건 정보 조회 실패:', constraintError.message);
      
      // 대안: 직접 SQL 쿼리로 제약조건 확인
      console.log('\n📋 slots 테이블의 status 컬럼 제약조건 확인:');
      console.log('다음 SQL을 Supabase 대시보드에서 실행하세요:');
      console.log('---');
      console.log(`
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.slots'::regclass 
  AND contype = 'c';
      `);
      console.log('---');
    } else {
      console.log('✅ 제약조건 정보:');
      console.log(constraintData);
    }

    // 허용되는 status 값 추천
    console.log('\n💡 해결 방법:');
    console.log('1. Supabase 대시보드에서 slots 테이블의 status 컬럼 제약조건을 확인하세요.');
    console.log('2. 현재 허용되는 status 값들:');
    console.log('   - pending (대기중)');
    console.log('   - active (활성)');
    console.log('   - inactive (비활성)');
    console.log('   - settlement_requested (정산요청됨)');
    console.log('   - completed (완료) - 이 값이 허용되지 않을 수 있음');
    console.log('\n3. completed 대신 다른 값(예: settled)을 사용하거나');
    console.log('4. 제약조건을 수정하여 completed를 허용하세요.');

  } catch (error) {
    console.error('❌ 제약조건 확인 중 오류:', error);
  }
}

checkSlotsTableConstraints();


