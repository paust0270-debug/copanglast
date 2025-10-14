const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // 임시로 anon key 사용

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('URL:', !!supabaseUrl);
  console.error('KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNoticesTable() {
  try {
    console.log('🔍 notices 테이블 존재 여부 확인 중...');
    
    // 직접 테이블에 접근 시도
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ notices 테이블이 존재하지 않습니다.');
        console.log('📋 Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.log('');
        console.log('```sql');
        console.log('-- 공지사항 테이블 생성');
        console.log('CREATE TABLE IF NOT EXISTS notices (');
        console.log('  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,');
        console.log('  target VARCHAR(50) NOT NULL DEFAULT \'전체\',');
        console.log('  title VARCHAR(255) NOT NULL,');
        console.log('  content TEXT NOT NULL,');
        console.log('  author VARCHAR(100) NOT NULL DEFAULT \'관리자\',');
        console.log('  views INTEGER NOT NULL DEFAULT 0,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
        console.log('');
        console.log('-- 인덱스 생성');
        console.log('CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);');
        console.log('CREATE INDEX IF NOT EXISTS idx_notices_target ON notices(target);');
        console.log('CREATE INDEX IF NOT EXISTS idx_notices_author ON notices(author);');
        console.log('');
        console.log('-- RLS 정책 설정');
        console.log('ALTER TABLE notices ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('CREATE POLICY "Allow public read access" ON notices');
        console.log('  FOR SELECT USING (true);');
        console.log('');
        console.log('CREATE POLICY "Allow public insert" ON notices');
        console.log('  FOR INSERT WITH CHECK (true);');
        console.log('');
        console.log('CREATE POLICY "Allow public update" ON notices');
        console.log('  FOR UPDATE USING (true);');
        console.log('');
        console.log('CREATE POLICY "Allow public delete" ON notices');
        console.log('  FOR DELETE USING (true);');
        console.log('```');
      } else {
        console.error('❌ 테이블 확인 중 오류:', error);
      }
      return;
    }

    console.log('✅ notices 테이블이 존재합니다.');
    console.log('📊 현재 공지사항 개수:', data.length);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkNoticesTable();
