const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSlotsStatusUpdate() {
  try {
    console.log('🔍 slots 테이블 status 업데이트 테스트...');

    // 먼저 테스트할 슬롯 ID 찾기
    const { data: testSlot, error: findError } = await supabase
      .from('slots')
      .select('id, status')
      .limit(1);

    if (findError) {
      console.log('❌ 테스트 슬롯 조회 실패:', findError.message);
      return;
    }

    if (!testSlot || testSlot.length === 0) {
      console.log('⚠️ 테스트할 슬롯이 없습니다.');
      return;
    }

    const testSlotId = testSlot[0].id;
    const originalStatus = testSlot[0].status;
    
    console.log(`📝 테스트 슬롯 ID: ${testSlotId}, 현재 상태: ${originalStatus}`);

    // 1. settled 상태로 업데이트 테스트
    console.log('\n🔄 settled 상태로 업데이트 테스트...');
    const { data: settledData, error: settledError } = await supabase
      .from('slots')
      .update({ 
        status: 'settled',
        updated_at: new Date().toISOString()
      })
      .eq('id', testSlotId)
      .select();

    if (settledError) {
      console.log('❌ settled 상태 업데이트 실패:', settledError.message);
    } else {
      console.log('✅ settled 상태 업데이트 성공:', settledData);
    }

    // 2. 원래 상태로 복원
    console.log('\n🔄 원래 상태로 복원...');
    const { error: restoreError } = await supabase
      .from('slots')
      .update({ 
        status: originalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', testSlotId);

    if (restoreError) {
      console.log('⚠️ 원래 상태 복원 실패:', restoreError.message);
    } else {
      console.log('✅ 원래 상태 복원 성공');
    }

    // 3. 다른 상태값들 테스트
    const testStatuses = ['inactive', 'settlement_requested', 'pending'];
    
    for (const testStatus of testStatuses) {
      console.log(`\n🔄 ${testStatus} 상태로 업데이트 테스트...`);
      const { error: testError } = await supabase
        .from('slots')
        .update({ 
          status: testStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', testSlotId);

      if (testError) {
        console.log(`❌ ${testStatus} 상태 업데이트 실패:`, testError.message);
      } else {
        console.log(`✅ ${testStatus} 상태 업데이트 성공`);
        
        // 원래 상태로 복원
        await supabase
          .from('slots')
          .update({ 
            status: originalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testSlotId);
      }
    }

    console.log('\n💡 권장 해결 방법:');
    console.log('1. settled 상태가 허용되지 않는다면 inactive 상태를 사용하세요.');
    console.log('2. 또는 Supabase 대시보드에서 slots 테이블의 status 컬럼 제약조건을 수정하세요.');
    console.log('3. 제약조건 수정 SQL:');
    console.log('---');
    console.log(`
-- 기존 제약조건 삭제
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_status_check;

-- 새로운 제약조건 추가 (settled 포함)
ALTER TABLE slots ADD CONSTRAINT slots_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'settlement_requested', 'settled', 'completed'));
    `);
    console.log('---');

  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  }
}

testSlotsStatusUpdate();


