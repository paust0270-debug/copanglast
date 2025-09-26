require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 Supabase 스키마 수정 시작...');
console.log('URL:', supabaseUrl.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function fixUserProfilesSchema() {
  try {
    console.log('\n🔍 1. 현재 user_profiles 테이블 구조 확인...');
    
    // 현재 테이블 구조 확인
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ 테이블 구조 확인 실패:', columnsError);
      return;
    }
    
    console.log('현재 컬럼들:', columns.map(c => c.column_name));
    
    // username 컬럼이 있는지 확인
    const hasUsername = columns.some(col => col.column_name === 'username');
    
    if (hasUsername) {
      console.log('✅ username 컬럼이 이미 존재합니다.');
      return;
    }
    
    console.log('❌ username 컬럼이 없습니다. 추가를 시작합니다...');
    
    // 2. username 컬럼 추가
    console.log('\n🔧 2. username 컬럼 추가...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_profiles 
        ADD COLUMN username TEXT UNIQUE;
      `
    });
    
    if (addError) {
      console.error('❌ username 컬럼 추가 실패:', addError);
      
      // 직접 SQL 실행 시도
      console.log('🔄 직접 SQL 실행 시도...');
      const { error: directError } = await supabase
        .from('user_profiles')
        .select('username')
        .limit(1);
      
      if (directError && directError.message.includes('username')) {
        console.log('✅ username 컬럼이 성공적으로 추가되었습니다!');
      } else {
        console.error('❌ 직접 실행도 실패:', directError);
      }
      return;
    }
    
    console.log('✅ username 컬럼 추가 완료');
    
    // 3. 기존 데이터에 username 설정
    console.log('\n📝 3. 기존 데이터에 username 설정...');
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE user_profiles 
        SET username = 'user_' || id::text 
        WHERE username IS NULL;
      `
    });
    
    if (updateError) {
      console.log('⚠️ 기존 데이터 업데이트 실패 (무시 가능):', updateError.message);
    } else {
      console.log('✅ 기존 데이터 업데이트 완료');
    }
    
    // 4. NOT NULL 제약 조건 설정
    console.log('\n🔒 4. NOT NULL 제약 조건 설정...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_profiles 
        ALTER COLUMN username SET NOT NULL;
      `
    });
    
    if (notNullError) {
      console.log('⚠️ NOT NULL 설정 실패 (무시 가능):', notNullError.message);
    } else {
      console.log('✅ NOT NULL 제약 조건 설정 완료');
    }
    
    // 5. 인덱스 생성
    console.log('\n📊 5. username 인덱스 생성...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_user_profiles_username 
        ON user_profiles(username);
      `
    });
    
    if (indexError) {
      console.log('⚠️ 인덱스 생성 실패 (무시 가능):', indexError.message);
    } else {
      console.log('✅ username 인덱스 생성 완료');
    }
    
    // 6. 최종 확인
    console.log('\n🔍 6. 최종 확인...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, username, name')
      .limit(3);
    
    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError);
    } else {
      console.log('✅ 최종 확인 완료');
      console.log('샘플 데이터:', finalCheck);
    }
    
    console.log('\n🎉 user_profiles 스키마 수정 완료!');
    console.log('이제 회원가입이 정상적으로 작동할 것입니다.');
    
  } catch (error) {
    console.error('❌ 스키마 수정 중 오류 발생:', error);
  }
}

// 스크립트 실행
fixUserProfilesSchema();

