require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🔍 컬럼 정보 확인 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function checkColumns() {
  try {
    console.log('\n📋 user_profiles 테이블 컬럼 확인...');
    
    // 각 컬럼을 개별적으로 확인
    const columnsToCheck = ['id', 'username', 'password', 'name', 'email', 'phone', 'kakao_id', 'memo', 'grade', 'distributor', 'status', 'slot_used', 'additional_count', 'created_at', 'updated_at', 'approved_at', 'processor'];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of columnsToCheck) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes(column)) {
          missingColumns.push(column);
        } else {
          existingColumns.push(column);
        }
      } catch (err) {
        missingColumns.push(column);
      }
    }
    
    console.log('✅ 존재하는 컬럼들:', existingColumns);
    console.log('❌ 누락된 컬럼들:', missingColumns);
    
    if (missingColumns.length > 0) {
      console.log('\n📝 Supabase SQL Editor에서 다음 SQL을 실행하세요:');
      console.log('---');
      console.log('-- 누락된 컬럼들 추가');
      missingColumns.forEach(col => {
        if (col === 'username') {
          console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;');
        } else if (col === 'password') {
          console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;');
        } else {
          console.log(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ${col} TEXT;`);
        }
      });
      console.log('---');
    } else {
      console.log('✅ 모든 컬럼이 존재합니다.');
    }
    
    // 테이블에 데이터가 있는지 확인
    console.log('\n📋 데이터 존재 여부 확인...');
    
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 데이터 개수 확인 실패:', countError.message);
    } else {
      console.log(`✅ 테이블에 ${count}개의 데이터가 있습니다.`);
    }
    
    console.log('\n🎉 컬럼 확인 완료!');
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkColumns();

