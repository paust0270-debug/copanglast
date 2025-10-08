const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlotStatusTable() {
  try {
    console.log('🔍 slot_status 테이블 확인 중...');
    
    // 1. slot_status 테이블 존재 확인
    console.log('📋 1. slot_status 테이블 존재 확인...');
    const { data: tableData, error: tableError } = await supabase
      .from('slot_status')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ slot_status 테이블 접근 오류:', tableError);
      return;
    }
    
    console.log('✅ slot_status 테이블 접근 성공');
    
    // 2. 최근 데이터 샘플 확인
    console.log('\n📊 2. 최근 slot_status 데이터 샘플 (최근 5개):');
    const { data: recentData, error: dataError } = await supabase
      .from('slot_status')
      .select('id, customer_id, usage_days, slot_id, created_at, updated_at')
      .order('id', { ascending: false })
      .limit(5);
    
    if (dataError) {
      console.error('❌ 데이터 조회 오류:', dataError);
      return;
    }
    
    recentData.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Customer: ${row.customer_id}, Usage Days: ${row.usage_days}, Slot ID: ${row.slot_id || 'NULL'}`);
    });
    
    // 3. slots 테이블과 비교
    console.log('\n🔍 3. slots 테이블 데이터 샘플 (sisisi 고객):');
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('id, customer_id, usage_days, slot_count, created_at')
      .eq('customer_id', 'sisisi')
      .order('usage_days', { ascending: true })
      .limit(5);
    
    if (slotsError) {
      console.error('❌ slots 테이블 조회 오류:', slotsError);
      return;
    }
    
    slotsData.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Customer: ${row.customer_id}, Usage Days: ${row.usage_days}, Count: ${row.slot_count}`);
    });
    
    // 4. slot_id 컬럼 존재 여부 확인
    console.log('\n🎯 4. slot_id 컬럼 존재 여부 확인...');
    if (recentData.length > 0) {
      const hasSlotId = recentData[0].hasOwnProperty('slot_id');
      console.log(`✅ slot_id 컬럼 존재 여부: ${hasSlotId ? '존재함' : '존재하지 않음'}`);
      
      if (!hasSlotId) {
        console.log('\n❌ slot_id 컬럼이 존재하지 않습니다!');
        console.log('💡 해결 방법: Supabase SQL Editor에서 다음 SQL을 실행하세요:');
        console.log(`
ALTER TABLE slot_status ADD COLUMN slot_id INTEGER;
COMMENT ON COLUMN slot_status.slot_id IS 'slots 테이블의 id를 참조하는 외래키';
CREATE INDEX IF NOT EXISTS idx_slot_status_slot_id ON slot_status(slot_id);
        `);
      }
    }
    
    // 5. 문제점 분석
    console.log('\n🔍 5. 문제점 분석...');
    const allUsageDays50 = recentData.every(row => row.usage_days === 50);
    const allSlotIdNull = recentData.every(row => !row.slot_id);
    
    if (allUsageDays50) {
      console.log('❌ 모든 슬롯이 usage_days: 50으로 등록됨 (2일, 6일, 15일 슬롯이 있어야 함)');
    }
    
    if (allSlotIdNull) {
      console.log('❌ 모든 슬롯의 slot_id가 NULL임 (slots 테이블의 id와 연결되어야 함)');
    }
    
    if (!allUsageDays50 && !allSlotIdNull) {
      console.log('✅ 데이터가 올바르게 저장되고 있습니다.');
    }

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkSlotStatusTable();


