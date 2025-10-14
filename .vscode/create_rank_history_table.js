require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createRankHistoryTable() {
  console.log('🔄 rank_history 테이블 생성 시작...');
  
  try {
    // 직접 SQL 실행
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS rank_history (
        id SERIAL PRIMARY KEY,
        slot_status_id INTEGER,
        keyword VARCHAR(255) NOT NULL,
        link_url TEXT NOT NULL,
        current_rank INTEGER,
        start_rank INTEGER,
        check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📝 SQL 실행 중...');
    console.log(createTableSQL);
    
    // Supabase에서 직접 SQL 실행 (RPC 함수 사용)
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ RPC 함수 실행 실패:', error);
      console.log('📝 수동으로 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
      console.log(createTableSQL);
      return;
    }
    
    console.log('✅ rank_history 테이블 생성 완료!');
    
    // 테이블 확인
    const { data: tables, error: listError } = await supabase
      .from('rank_history')
      .select('*')
      .limit(1);
    
    if (listError) {
      console.log('⚠️ 테이블 생성은 완료되었지만 확인 중 오류:', listError.message);
    } else {
      console.log('✅ 테이블 확인 완료');
    }
    
  } catch (error) {
    console.error('❌ 테이블 생성 중 오류:', error);
    console.log('📝 수동으로 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
    console.log(`
CREATE TABLE IF NOT EXISTS rank_history (
  id SERIAL PRIMARY KEY,
  slot_status_id INTEGER,
  keyword VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  current_rank INTEGER,
  start_rank INTEGER,
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    `);
  }
}

createRankHistoryTable();