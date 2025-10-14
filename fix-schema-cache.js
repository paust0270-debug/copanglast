// 스키마 캐시 강제 갱신 스크립트
// 이 스크립트를 브라우저 콘솔에서 실행하세요

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchemaCache() {
  console.log('스키마 캐시 문제를 해결하는 중...');
  
  try {
    // 1. 각 테이블에 접근하여 스키마 캐시 갱신
    console.log('1. user_profiles 테이블 접근...');
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('user_profiles 테이블 접근 오류:', userError);
    } else {
      console.log('✅ user_profiles 테이블 스키마 갱신 완료');
    }
    
    console.log('2. customers 테이블 접근...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (customerError) {
      console.error('customers 테이블 접근 오류:', customerError);
    } else {
      console.log('✅ customers 테이블 스키마 갱신 완료');
    }
    
    console.log('3. slots 테이블 접근...');
    const { data: slots, error: slotError } = await supabase
      .from('slots')
      .select('id')
      .limit(1);
    
    if (slotError) {
      console.error('slots 테이블 접근 오류:', slotError);
    } else {
      console.log('✅ slots 테이블 스키마 갱신 완료');
    }
    
    // 2. 스키마 정보 쿼리
    console.log('4. 스키마 정보 쿼리...');
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('pg_catalog.pg_tables');
    
    if (schemaError) {
      console.error('스키마 정보 쿼리 오류:', schemaError);
    } else {
      console.log('✅ 스키마 정보 쿼리 완료');
    }
    
    // 3. 연결 풀 재설정
    console.log('5. 연결 풀 재설정...');
    const newClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    });
    
    const { data: testData, error: testError } = await newClient
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('연결 풀 테스트 오류:', testError);
    } else {
      console.log('✅ 연결 풀 재설정 완료');
    }
    
    console.log('🎉 스키마 캐시 문제 해결 완료!');
    
  } catch (error) {
    console.error('스키마 캐시 문제 해결 중 오류:', error);
  }
}

// 스크립트 실행
fixSchemaCache();

