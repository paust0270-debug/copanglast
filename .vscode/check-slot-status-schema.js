const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlotStatusSchema() {
  console.log('🔍 slot_status 테이블 스키마 확인 중...');
  
  try {
    // 1. 테이블 구조 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'slot_status')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ 테이블 정보 조회 오류:', tableError);
      return;
    }
    
    console.log('📋 slot_status 테이블 컬럼 목록:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. slot_id 컬럼 존재 여부 확인
    const hasSlotId = tableInfo.some(col => col.column_name === 'slot_id');
    console.log(`\n🎯 slot_id 컬럼 존재 여부: ${hasSlotId ? '✅ 존재함' : '❌ 존재하지 않음'}`);
    
    // 3. 최근 데이터 샘플 확인
    console.log('\n📊 최근 slot_status 데이터 샘플 (최근 5개):');
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
    
    // 4. slots 테이블과 비교
    console.log('\n🔍 slots 테이블 데이터 샘플:');
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
    
  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

checkSlotStatusSchema();


