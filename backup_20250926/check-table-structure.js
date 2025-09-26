require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🔍 테이블 구조 확인 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function checkStructure() {
  try {
    console.log('\n📋 1. user_profiles 테이블 구조 확인...');
    
    const { data: structureData, error: structureError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ 테이블 구조 확인 실패:', structureError.message);
      return;
    }
    
    if (structureData.length > 0) {
      const columns = Object.keys(structureData[0]);
      console.log('현재 컬럼들:', columns);
      
      // 필요한 컬럼 확인
      const requiredColumns = ['username', 'password'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n❌ 누락된 컬럼들:', missingColumns);
        console.log('\n📝 Supabase SQL Editor에서 다음 SQL을 실행하세요:');
        console.log('---');
        console.log('-- user_profiles 테이블에 필요한 컬럼 추가');
        console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;');
        console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;');
        console.log('---');
      } else {
        console.log('✅ 모든 필요한 컬럼이 존재합니다.');
      }
    } else {
      console.log('테이블이 비어있습니다.');
    }
    
    // 2. 샘플 데이터 확인
    console.log('\n📋 2. 샘플 데이터 확인...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    if (sampleError) {
      console.error('❌ 샘플 데이터 확인 실패:', sampleError.message);
    } else {
      console.log(`✅ ${sampleData.length}개 데이터 확인`);
      sampleData.forEach((user, index) => {
        console.log(`사용자 ${index + 1}:`, {
          id: user.id,
          username: user.username || 'null',
          name: user.name,
          password: user.password ? '***' : 'null',
          email: user.email || 'null'
        });
      });
    }
    
    console.log('\n🎉 테이블 구조 확인 완료!');
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkStructure();

