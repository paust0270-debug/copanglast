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

async function createSettlementsTable() {
  try {
    console.log('🚀 settlements 테이블 생성 시작...');

    // settlements 테이블 생성 SQL
    const createTableSQL = `
      -- 기존 settlements 테이블 삭제 (있다면)
      DROP TABLE IF EXISTS settlements CASCADE;

      -- 정산 테이블 생성 (최종 구조)
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
    `;

    // SQL을 여러 개의 명령어로 분리해서 실행
    const sqlCommands = [
      'DROP TABLE IF EXISTS settlements CASCADE',
      `CREATE TABLE IF NOT EXISTS settlements (
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
      )`,
      'CREATE INDEX IF NOT EXISTS idx_settlements_distributor_name ON settlements(distributor_name)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_settlements_deposit_date ON settlements(deposit_date)'
    ];

    for (const sql of sqlCommands) {
      console.log('📝 실행 중:', sql.substring(0, 50) + '...');
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('❌ SQL 실행 에러:', error);
        throw error;
      }
    }

    console.log('✅ settlements 테이블 생성 완료!');

    // 테이블 확인
    const { data: tableInfo, error: infoError } = await supabase
      .from('settlements')
      .select('*')
      .limit(1);

    if (infoError) {
      console.log('⚠️ 테이블 확인 중 오류 (정상일 수 있음):', infoError.message);
    } else {
      console.log('✅ settlements 테이블 접근 확인 완료');
    }

    // 샘플 데이터 삽입 테스트
    console.log('📝 샘플 데이터 삽입 테스트...');
    const sampleData = {
      sequential_number: 1,
      distributor_name: '테스트 총판',
      total_slots: 10,
      total_deposit_amount: 100000,
      depositor_name: '테스트 입금자',
      deposit_date: '2024-01-01',
      request_date: '2024-01-01',
      memo: '테스트 메모',
      status: 'completed'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('settlements')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 에러:', insertError);
    } else {
      console.log('✅ 샘플 데이터 삽입 성공:', insertData);
      
      // 삽입한 샘플 데이터 삭제
      await supabase
        .from('settlements')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🗑️ 샘플 데이터 삭제 완료');
    }

  } catch (error) {
    console.error('❌ settlements 테이블 생성 실패:', error);
    process.exit(1);
  }
}

createSettlementsTable();


