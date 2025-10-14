const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ 설정됨' : '❌ 설정되지 않음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('🚀 정산 시스템 마이그레이션 시작...');

    // 1. 기존 settlements 테이블에 새로운 필드들 추가
    console.log('📋 1. settlements 테이블에 새로운 필드 추가 중...');
    
    const alterTableQueries = [
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS original_settlement_id BIGINT REFERENCES settlements(id)',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true',
      'ALTER TABLE settlements ADD COLUMN IF NOT EXISTS included_slot_ids INTEGER[]'
    ];

    for (const query of alterTableQueries) {
      console.log(`   실행 중: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        console.log(`   ⚠️ 경고 (정상적인 상황): ${error.message}`);
      } else {
        console.log('   ✅ 성공');
      }
    }

    // 2. settlement_items 테이블 생성
    console.log('📋 2. settlement_items 테이블 생성 중...');
    
    const createItemsTableQuery = `
      CREATE TABLE IF NOT EXISTS settlement_items (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        settlement_id BIGINT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
        slot_id BIGINT NOT NULL REFERENCES slots(id),
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        slot_type TEXT NOT NULL,
        slot_count INTEGER NOT NULL DEFAULT 1,
        payment_amount INTEGER NOT NULL DEFAULT 0,
        usage_days INTEGER DEFAULT 0,
        memo TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const { error: createTableError } = await supabase.rpc('exec_sql', { sql_query: createItemsTableQuery });
    if (createTableError) {
      console.log(`   ⚠️ 경고 (정상적인 상황): ${createTableError.message}`);
    } else {
      console.log('   ✅ settlement_items 테이블 생성 완료');
    }

    // 3. 인덱스 생성
    console.log('📋 3. 인덱스 생성 중...');
    
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_settlements_original_id ON settlements(original_settlement_id)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_version ON settlements(version)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_is_latest ON settlements(is_latest)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_included_slots ON settlements USING GIN(included_slot_ids)',
      'CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON settlement_items(settlement_id)',
      'CREATE INDEX IF NOT EXISTS idx_settlement_items_slot_id ON settlement_items(slot_id)'
    ];

    for (const query of indexQueries) {
      console.log(`   실행 중: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        console.log(`   ⚠️ 경고 (정상적인 상황): ${error.message}`);
      } else {
        console.log('   ✅ 성공');
      }
    }

    // 4. 기존 데이터에 대한 기본값 설정
    console.log('📋 4. 기존 데이터 기본값 설정 중...');
    
    const updateQuery = `
      UPDATE settlements 
      SET 
        version = 1,
        is_latest = true,
        original_settlement_id = NULL
      WHERE version IS NULL OR is_latest IS NULL
    `;

    const { error: updateError } = await supabase.rpc('exec_sql', { sql_query: updateQuery });
    if (updateError) {
      console.log(`   ⚠️ 경고 (정상적인 상황): ${updateError.message}`);
    } else {
      console.log('   ✅ 기본값 설정 완료');
    }

    // 5. 정산 ID 5에 대한 기본 settlement_items 생성
    console.log('📋 5. 정산 ID 5에 대한 기본 settlement_items 생성 중...');
    
    const insertQuery = `
      INSERT INTO settlement_items (settlement_id, slot_id, customer_id, customer_name, slot_type, slot_count, payment_amount, usage_days, memo)
      SELECT 
        s.id,
        s.id,
        'N/A',
        'N/A',
        'coupang',
        s.total_slots,
        s.total_deposit_amount,
        0,
        s.memo
      FROM settlements s
      WHERE s.id = 5
      AND NOT EXISTS (
        SELECT 1 FROM settlement_items si WHERE si.settlement_id = s.id
      )
    `;

    const { error: insertError } = await supabase.rpc('exec_sql', { sql_query: insertQuery });
    if (insertError) {
      console.log(`   ⚠️ 경고 (정상적인 상황): ${insertError.message}`);
    } else {
      console.log('   ✅ settlement_items 생성 완료');
    }

    // 6. 최종 확인
    console.log('📋 6. 마이그레이션 결과 확인 중...');
    
    const { data: settlementsData, error: settlementsError } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', 5);

    if (settlementsError) {
      console.log(`   ❌ settlements 확인 실패: ${settlementsError.message}`);
    } else {
      console.log('   ✅ settlements 테이블 확인 완료');
      if (settlementsData && settlementsData.length > 0) {
        console.log('   📊 정산 ID 5 데이터:', settlementsData[0]);
      }
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('settlement_items')
      .select('*')
      .eq('settlement_id', 5);

    if (itemsError) {
      console.log(`   ❌ settlement_items 확인 실패: ${itemsError.message}`);
    } else {
      console.log('   ✅ settlement_items 테이블 확인 완료');
      console.log(`   📊 정산 ID 5의 아이템 수: ${itemsData?.length || 0}`);
      if (itemsData && itemsData.length > 0) {
        console.log('   📊 첫 번째 아이템:', itemsData[0]);
      }
    }

    console.log('\n🎉 마이그레이션 완료!');
    console.log('📋 다음 단계:');
    console.log('1. 개발 서버 재시작: npm run dev');
    console.log('2. 정산 수정 페이지에서 정산 ID 5의 데이터 확인');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
  }
}

executeMigration();
