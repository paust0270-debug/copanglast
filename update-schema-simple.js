require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('먼저 node setup-env.js를 실행하여 환경 변수를 설정하세요.');
  process.exit(1);
}

console.log('🚀 Supabase 스키마 업데이트 시작...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function updateSchema() {
  try {
    console.log('\n🔍 1. 현재 테이블 상태 확인...');
    
    // 현재 테이블 구조 확인
    const { data: currentData, error: currentError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ 테이블 접근 실패:', currentError.message);
      console.log('테이블이 존재하지 않을 수 있습니다. 스키마를 먼저 생성해야 합니다.');
      return;
    }
    
    console.log('✅ user_profiles 테이블 접근 가능');
    if (currentData.length > 0) {
      console.log('현재 컬럼들:', Object.keys(currentData[0]));
    }
    
    // 2. password 컬럼 추가 시도
    console.log('\n🔧 2. password 컬럼 추가...');
    
    // 기존 데이터 백업
    console.log('📋 현재 데이터 백업 중...');
    const { data: allData, error: backupError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (backupError) {
      console.error('❌ 데이터 백업 실패:', backupError.message);
      return;
    }
    
    console.log(`✅ ${allData.length}개 데이터 백업 완료`);
    
    // 3. password 컬럼이 있는지 확인
    if (allData.length > 0 && allData[0].password !== undefined) {
      console.log('✅ password 컬럼이 이미 존재합니다.');
      console.log('샘플 데이터:', {
        id: allData[0].id,
        username: allData[0].username,
        name: allData[0].name,
        password: allData[0].password ? '***' : 'null'
      });
      return;
    }
    
    // 4. password 컬럼 추가를 위한 데이터 업데이트
    console.log('\n🔄 3. password 컬럼 추가를 위한 데이터 업데이트...');
    
    // 각 사용자에 대해 password 필드를 추가
    const updatedData = allData.map(user => ({
      ...user,
      password: null // 기본값으로 null 설정
    }));
    
    // 기존 데이터 삭제
    console.log('기존 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 실패:', deleteError.message);
      return;
    }
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    // 새 데이터 삽입
    console.log('새 데이터 삽입 중...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(updatedData)
      .select();
    
    if (insertError) {
      console.error('❌ 새 데이터 삽입 실패:', insertError.message);
      console.log('이 오류는 password 컬럼이 아직 생성되지 않았기 때문일 수 있습니다.');
      console.log('Supabase SQL Editor에서 다음 SQL을 실행하세요:');
      console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;');
      return;
    }
    
    console.log('✅ 새 데이터 삽입 성공');
    console.log('삽입된 데이터 수:', insertData.length);
    
    // 5. 최종 확인
    console.log('\n🔍 4. 최종 확인...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, username, name, password')
      .limit(3);
    
    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError.message);
    } else {
      console.log('✅ 최종 확인 성공');
      console.log('샘플 데이터:', finalCheck.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        password: user.password ? '***' : 'null'
      })));
    }
    
    console.log('\n🎉 스키마 업데이트 완료!');
    console.log('이제 회원가입 시 비밀번호가 올바르게 저장됩니다.');
    
  } catch (error) {
    console.error('❌ 스키마 업데이트 중 오류:', error);
  }
}

// 스크립트 실행
updateSchema();

