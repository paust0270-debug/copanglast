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

async function checkSettlementsTable() {
  try {
    console.log('🔍 settlements 테이블 확인 중...');

    // settlements 테이블에서 데이터 조회 시도
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ settlements 테이블이 존재하지 않거나 접근할 수 없습니다:');
      console.log('   에러 코드:', error.code);
      console.log('   에러 메시지:', error.message);
      
      if (error.code === 'PGRST116' || error.message.includes('relation')) {
        console.log('\n📋 해결 방법:');
        console.log('1. Supabase 대시보드에 로그인하세요.');
        console.log('2. SQL Editor로 이동하세요.');
        console.log('3. create-settlements-table.sql 파일의 내용을 복사하여 실행하세요.');
        console.log('\n또는 다음 SQL을 직접 실행하세요:');
        console.log('---');
        console.log(`
-- 정산 테이블 생성
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  sequential_number INTEGER NOT NULL,
  distributor_name VARCHAR(255) NOT NULL,
  total_slots INTEGER NOT NULL,
  total_deposit_amount DECIMAL(10,2) NOT NULL,
  depositor_name VARCHAR(255),
  deposit_date DATE,
  request_date DATE,
  memo TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlements_distributor_name ON settlements(distributor_name);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at);
CREATE INDEX IF NOT EXISTS idx_settlements_deposit_date ON settlements(deposit_date);
        `);
        console.log('---');
      }
    } else {
      console.log('✅ settlements 테이블이 존재합니다!');
      console.log('   현재 레코드 수:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('   샘플 데이터:', data[0]);
      }
    }

    // 테이블 스키마 정보 확인 시도
    console.log('\n🔍 테이블 스키마 정보 확인 중...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'settlements')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.log('⚠️ 스키마 정보 확인 실패:', schemaError.message);
    } else if (schemaData && schemaData.length > 0) {
      console.log('✅ settlements 테이블 스키마:');
      schemaData.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('⚠️ 스키마 정보를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('❌ 테이블 확인 중 오류:', error);
  }
}

checkSettlementsTable();


