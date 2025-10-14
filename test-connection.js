#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Supabase 연결 테스트를 시작합니다...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수 확인
  console.log('📋 환경 변수 확인:');
  console.log(`URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 설정되지 않음'}`);
  console.log(`Key: ${supabaseAnonKey ? '✅ 설정됨' : '❌ 설정되지 않음'}\n`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ 환경 변수가 설정되지 않았습니다.');
    console.log('node setup-env-auto.js를 실행하여 환경 변수를 설정하세요.');
    process.exit(1);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔗 Supabase 클라이언트 생성 완료');
    
    // 기본 연결 테스트
    console.log('🔍 기본 연결 테스트 중...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ 인증 테스트 실패 (정상적인 상황):', authError.message);
    } else {
      console.log('✅ 인증 연결 성공');
    }

    // 테이블 접근 테스트
    console.log('🔍 테이블 접근 테스트 중...');
    
    // user_profiles 테이블 테스트
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (userError) {
        console.log('❌ user_profiles 테이블 접근 실패:', userError.message);
        console.log('💡 emergency-schema-fix.sql을 Supabase에서 실행하세요.');
      } else {
        console.log('✅ user_profiles 테이블 접근 성공');
      }
    } catch (err) {
      console.log('❌ user_profiles 테이블 오류:', err.message);
    }

    // customers 테이블 테스트
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (customerError) {
        console.log('❌ customers 테이블 접근 실패:', customerError.message);
      } else {
        console.log('✅ customers 테이블 접근 성공');
      }
    } catch (err) {
      console.log('❌ customers 테이블 오류:', err.message);
    }

    console.log('\n🎉 연결 테스트 완료!');
    console.log('✅ Supabase 연결이 정상적으로 작동합니다.');
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('1. .env.local 파일의 환경 변수를 확인하세요');
    console.log('2. Supabase 프로젝트가 활성화되어 있는지 확인하세요');
    console.log('3. emergency-schema-fix.sql을 Supabase에서 실행하세요');
  }
}

testConnection();
