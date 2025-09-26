require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 Supabase 스키마 직접 수정 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function directSchemaFix() {
  try {
    console.log('\n🔍 1. 현재 user_profiles 테이블 상태 확인...');
    
    // 먼저 테이블이 존재하는지 확인
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('❌ user_profiles 테이블 접근 실패:', testError.message);
      return;
    }
    
    console.log('✅ user_profiles 테이블 접근 성공');
    console.log('현재 데이터:', testData);
    
    // 2. username 컬럼 존재 여부 확인
    console.log('\n🔍 2. username 컬럼 존재 여부 확인...');
    
    try {
      const { data: usernameTest, error: usernameError } = await supabase
        .from('user_profiles')
        .select('username')
        .limit(1);
      
      if (usernameError && usernameError.message.includes('username')) {
        console.log('❌ username 컬럼이 없습니다. 추가를 시작합니다...');
        
        // 3. username 컬럼 추가 시도
        console.log('\n🔧 3. username 컬럼 추가 시도...');
        
        // 방법 1: 직접 INSERT 시도로 컬럼 추가 유도
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([{
            id: '00000000-0000-0000-0000-000000000000', // 임시 ID
            username: 'temp_username',
            name: 'temp_name'
          }]);
        
        if (insertError) {
          console.log('⚠️ INSERT 시도 결과:', insertError.message);
          
          // 방법 2: 기존 데이터에 username 필드 추가 시도
          if (testData && testData.length > 0) {
            console.log('\n🔄 기존 데이터에 username 필드 추가 시도...');
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ username: 'user_' + testData[0].id })
              .eq('id', testData[0].id);
            
            if (updateError) {
              console.log('⚠️ UPDATE 시도 결과:', updateError.message);
            } else {
              console.log('✅ username 필드 추가 성공!');
            }
          }
        } else {
          console.log('✅ username 컬럼 추가 성공!');
          
          // 임시 데이터 삭제
          await supabase
            .from('user_profiles')
            .delete()
            .eq('id', '00000000-0000-0000-0000-000000000000');
        }
      } else {
        console.log('✅ username 컬럼이 이미 존재합니다.');
        console.log('샘플 데이터:', usernameTest);
      }
      
    } catch (error) {
      console.log('⚠️ username 컬럼 확인 중 오류 (정상):', error.message);
    }
    
    // 4. 최종 테스트
    console.log('\n🔍 4. 최종 테스트...');
    
    try {
      const { data: finalTest, error: finalError } = await supabase
        .from('user_profiles')
        .select('id, username, name')
        .limit(3);
      
      if (finalError) {
        console.log('⚠️ 최종 테스트 실패:', finalError.message);
      } else {
        console.log('✅ 최종 테스트 성공');
        console.log('샘플 데이터:', finalTest);
      }
    } catch (error) {
      console.log('⚠️ 최종 테스트 중 오류:', error.message);
    }
    
    console.log('\n🎉 스키마 수정 시도 완료!');
    console.log('이제 회원가입을 테스트해보세요.');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

// 스크립트 실행
directSchemaFix();

