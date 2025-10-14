const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('URL:', !!supabaseUrl);
  console.error('KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNoticesTable() {
  try {
    console.log('🔍 notices 테이블 존재 여부 확인 중...');
    
    // 테이블 존재 여부 확인
    const { data: exists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notices')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ 테이블 확인 중 오류:', checkError);
      return;
    }

    if (exists) {
      console.log('✅ notices 테이블이 이미 존재합니다.');
      return;
    }

    console.log('📝 notices 테이블 생성 중...');

    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notices (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        target VARCHAR(50) NOT NULL DEFAULT '전체',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL DEFAULT '관리자',
        views INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError);
      return;
    }

    console.log('✅ notices 테이블이 성공적으로 생성되었습니다.');

    // 인덱스 생성
    console.log('📝 인덱스 생성 중...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notices_target ON notices(target);
      CREATE INDEX IF NOT EXISTS idx_notices_author ON notices(author);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql_query: indexSQL
    });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스가 성공적으로 생성되었습니다.');
    }

    // RLS 정책 설정
    console.log('🔒 RLS 정책 설정 중...');
    const policySQL = `
      ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow public read access" ON notices;
      CREATE POLICY "Allow public read access" ON notices
        FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Allow authenticated insert" ON notices;
      CREATE POLICY "Allow authenticated insert" ON notices
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Allow authenticated update" ON notices;
      CREATE POLICY "Allow authenticated update" ON notices
        FOR UPDATE USING (auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Allow authenticated delete" ON notices;
      CREATE POLICY "Allow authenticated delete" ON notices
        FOR DELETE USING (auth.role() = 'authenticated');
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql_query: policySQL
    });

    if (policyError) {
      console.error('❌ RLS 정책 설정 실패:', policyError);
    } else {
      console.log('✅ RLS 정책이 성공적으로 설정되었습니다.');
    }

    console.log('🎉 공지사항 테이블 설정이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createNoticesTable();
