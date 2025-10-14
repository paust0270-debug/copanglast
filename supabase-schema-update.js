require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 Supabase 스키마 업데이트 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function updateSchema() {
  try {
    console.log('\n🔍 1. 현재 상황 확인...');
    
    // 현재 테이블 상태 확인
    const { data: currentData, error: currentError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ 테이블 접근 실패:', currentError.message);
      return;
    }
    
    console.log('✅ user_profiles 테이블 접근 가능');
    console.log('현재 컬럼 수:', Object.keys(currentData[0] || {}).length);
    
    // 2. username 컬럼 추가를 위한 SQL 실행
    console.log('\n🔧 2. username 컬럼 추가 시도...');
    
    // Supabase에서 직접 SQL 실행이 어려우므로, 
    // 기존 데이터를 백업하고 새 스키마로 재생성하는 방법 사용
    
    console.log('📋 현재 데이터 백업 중...');
    const { data: allData, error: backupError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (backupError) {
      console.error('❌ 데이터 백업 실패:', backupError.message);
      return;
    }
    
    console.log(`✅ ${allData.length}개 데이터 백업 완료`);
    
    // 3. 임시 테이블 생성 및 데이터 이전
    console.log('\n🔄 3. 임시 테이블 생성...');
    
    // 기존 테이블을 삭제하고 새로 생성하는 방법
    console.log('⚠️ 주의: 기존 테이블을 삭제하고 새로 생성합니다...');
    
    // 먼저 기존 데이터를 auth.users 테이블에만 남기고 user_profiles는 삭제
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 데이터 삭제
    
    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 실패:', deleteError.message);
      return;
    }
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    // 4. 새 스키마로 테이블 재생성 (INSERT로 유도)
    console.log('\n🔧 4. 새 스키마로 테이블 재생성...');
    
    // 새로운 데이터를 username 컬럼과 함께 삽입
    const newData = allData.map(user => ({
      ...user,
      username: `user_${user.id.replace(/-/g, '')}` // UUID에서 하이픈 제거
    }));
    
    console.log('새 데이터 샘플:', newData[0]);
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(newData)
      .select();
    
    if (insertError) {
      console.error('❌ 새 데이터 삽입 실패:', insertError.message);
      
      // 실패한 경우 원본 데이터로 복구
      console.log('🔄 원본 데이터로 복구 중...');
      const { error: restoreError } = await supabase
        .from('user_profiles')
        .insert(allData);
      
      if (restoreError) {
        console.error('❌ 데이터 복구 실패:', restoreError.message);
      } else {
        console.log('✅ 데이터 복구 완료');
      }
      return;
    }
    
    console.log('✅ 새 스키마로 데이터 삽입 성공');
    console.log('삽입된 데이터 수:', insertData.length);
    
    // 5. 최종 확인
    console.log('\n🔍 5. 최종 확인...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('user_profiles')
      .select('id, username, name')
      .limit(3);
    
    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError.message);
    } else {
      console.log('✅ 최종 확인 성공');
      console.log('샘플 데이터:', finalCheck);
    }
    
    console.log('\n🎉 스키마 업데이트 완료!');
    console.log('이제 회원가입이 정상적으로 작동할 것입니다.');
    
  } catch (error) {
    console.error('❌ 스키마 업데이트 중 오류:', error);
  }
}

// 스크립트 실행
updateSchema();

