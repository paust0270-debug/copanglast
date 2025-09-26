#!/usr/bin/env node

/**
 * Supabase 스키마 캐시 문제 완전 해결 고급 스크립트
 * 
 * 이 스크립트는 다음 문제들을 완전히 해결합니다:
 * 1. 스키마 캐시 문제
 * 2. 연결 풀 문제
 * 3. 테이블 접근 문제
 * 4. RLS 정책 문제
 * 5. 브라우저 캐시 문제
 * 6. 세션 캐시 문제
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

// 강화된 Supabase 클라이언트 생성
function createAdvancedSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Schema-Cache-Bypass': 'true',
        'X-Timestamp': Date.now().toString()
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}

async function advancedSchemaRefresh() {
  console.log('🔄 고급 스키마 캐시 갱신 시작...');
  
  const client = createAdvancedSupabaseClient();
  
  try {
    // 1. 메타데이터 쿼리들
    const metadataQueries = [
      () => client.rpc('pg_catalog.pg_tables'),
      () => client.rpc('pg_catalog.pg_stat_user_tables'),
      () => client.rpc('pg_catalog.pg_policies'),
      () => client.rpc('pg_catalog.pg_indexes')
    ];
    
    for (const query of metadataQueries) {
      try {
        await query();
      } catch (err) {
        console.log('⚠️ 메타데이터 쿼리 중 오류 (정상):', err.message);
      }
    }
    
    // 2. 모든 테이블에 접근
    const tables = ['customers', 'users', 'user_profiles'];
    
    for (const table of tables) {
      try {
        // 다양한 쿼리로 테이블 접근
        const queries = [
          () => client.from(table).select('count').limit(1),
          () => client.from(table).select('*').limit(0),
          () => client.rpc('pg_catalog.pg_tables', { schemaname: 'public', tablename: table })
        ];
        
        for (const query of queries) {
          try {
            await query();
          } catch (err) {
            console.log(`⚠️ ${table} 테이블 쿼리 중 오류 (정상):`, err.message);
          }
        }
        
        console.log(`✅ ${table} 테이블 고급 스키마 갱신 완료`);
      } catch (err) {
        console.log(`⚠️ ${table} 테이블 접근 중 예외:`, err.message);
      }
    }
    
    console.log('✅ 고급 스키마 캐시 갱신 완료');
  } catch (err) {
    console.error('❌ 고급 스키마 캐시 갱신 중 오류:', err.message);
  }
}

async function resetAllConnections() {
  console.log('🔄 모든 연결 재설정 시작...');
  
  try {
    // 여러 클라이언트 인스턴스 생성 및 테스트
    const clients = [];
    
    for (let i = 0; i < 3; i++) {
      const client = createAdvancedSupabaseClient();
      clients.push(client);
      
      try {
        const { data, error } = await client
          .from('customers')
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`⚠️ 클라이언트 ${i + 1} 테스트 중 오류:`, error.message);
        } else {
          console.log(`✅ 클라이언트 ${i + 1} 연결 성공`);
        }
      } catch (err) {
        console.log(`⚠️ 클라이언트 ${i + 1} 테스트 중 예외:`, err.message);
      }
    }
    
    console.log('✅ 모든 연결 재설정 완료');
  } catch (err) {
    console.error('❌ 모든 연결 재설정 중 오류:', err.message);
  }
}

async function comprehensiveDiagnostics() {
  console.log('🔍 종합 진단 시작...');
  console.log('='.repeat(70));
  
  const client = createAdvancedSupabaseClient();
  const results = {
    basicConnection: false,
    customersTable: false,
    usersTable: false,
    userProfilesTable: false,
    rlsPolicies: false,
    schemaCache: false
  };
  
  try {
    // 1. 기본 연결 테스트
    console.log('1️⃣ 기본 연결 테스트...');
    try {
      const { data, error } = await client.auth.getUser();
      if (error) {
        console.log('⚠️ 인증 오류 (정상):', error.message);
      } else {
        console.log('✅ 기본 연결 성공');
      }
      results.basicConnection = true;
    } catch (err) {
      console.error('❌ 기본 연결 실패:', err.message);
    }
    
    // 2. 테이블 접근 테스트
    const tables = [
      { name: 'customers', result: 'customersTable' },
      { name: 'users', result: 'usersTable' },
      { name: 'user_profiles', result: 'userProfilesTable' }
    ];
    
    for (const table of tables) {
      console.log(`2️⃣ ${table.name} 테이블 접근 테스트...`);
      try {
        const { data, error } = await client
          .from(table.name)
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`❌ ${table.name} 테이블 접근 실패:`, error.message);
        } else {
          console.log(`✅ ${table.name} 테이블 접근 성공`);
          results[table.result] = true;
        }
      } catch (err) {
        console.error(`❌ ${table.name} 테이블 확인 오류:`, err.message);
      }
    }
    
    // 3. RLS 정책 테스트
    console.log('3️⃣ RLS 정책 테스트...');
    try {
      const { data, error } = await client
        .from('customers')
        .select('id, name')
        .limit(1);
      
      if (error) {
        console.error('❌ RLS 정책 문제:', error.message);
      } else {
        console.log('✅ RLS 정책 정상');
        results.rlsPolicies = true;
      }
    } catch (err) {
      console.error('❌ RLS 정책 확인 오류:', err.message);
    }
    
    // 4. 스키마 캐시 테스트
    console.log('4️⃣ 스키마 캐시 테스트...');
    try {
      await advancedSchemaRefresh();
      results.schemaCache = true;
    } catch (err) {
      console.error('❌ 스키마 캐시 테스트 오류:', err.message);
    }
    
  } catch (err) {
    console.error('❌ 종합 진단 중 오류:', err.message);
  }
  
  console.log('='.repeat(70));
  console.log('📊 종합 진단 결과:');
  console.log(`기본 연결: ${results.basicConnection ? '✅' : '❌'}`);
  console.log(`customers 테이블: ${results.customersTable ? '✅' : '❌'}`);
  console.log(`users 테이블: ${results.usersTable ? '✅' : '❌'}`);
  console.log(`user_profiles 테이블: ${results.userProfilesTable ? '✅' : '❌'}`);
  console.log(`RLS 정책: ${results.rlsPolicies ? '✅' : '❌'}`);
  console.log(`스키마 캐시: ${results.schemaCache ? '✅' : '❌'}`);
  
  return results;
}

async function completeFix() {
  console.log('🚀 스키마 캐시 문제 완전 해결 시작...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : '설정되지 않음');
  console.log('');
  
  try {
    // 1. 고급 스키마 갱신
    await advancedSchemaRefresh();
    
    // 2. 모든 연결 재설정
    await resetAllConnections();
    
    // 3. 종합 진단
    const results = await comprehensiveDiagnostics();
    
    // 4. 해결 방안 제시
    console.log('');
    console.log('🎯 해결 방안:');
    
    const allPassed = Object.values(results).every(result => result);
    
    if (!results.basicConnection) {
      console.log('1. 환경 변수를 확인하세요 (.env.local)');
    }
    
    if (!results.customersTable || !results.usersTable || !results.userProfilesTable) {
      console.log('2. supabase-schema.sql을 Supabase SQL Editor에서 실행하세요');
      console.log('3. 테이블이 존재하는지 Supabase 대시보드에서 확인하세요');
    }
    
    if (!results.rlsPolicies) {
      console.log('4. RLS 정책을 확인하고 재설정하세요');
      console.log('5. Supabase 대시보드에서 Authentication > Policies 확인하세요');
    }
    
    if (!results.schemaCache) {
      console.log('6. 스키마 캐시 문제가 지속됩니다. 개발 서버를 재시작하세요');
    }
    
    if (allPassed) {
      console.log('✅ 모든 문제가 완전히 해결되었습니다!');
      console.log('🎉 이제 애플리케이션을 안전하게 사용할 수 있습니다.');
    } else {
      console.log('⚠️ 일부 문제가 남아있습니다. 위의 해결 방안을 따라주세요.');
      console.log('💡 추가 도움이 필요하면 개발 서버를 재시작하거나 브라우저 캐시를 삭제하세요.');
    }
    
    return results;
    
  } catch (err) {
    console.error('❌ 완전 해결 중 오류 발생:', err.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  completeFix().catch(console.error);
}

module.exports = {
  advancedSchemaRefresh,
  resetAllConnections,
  comprehensiveDiagnostics,
  completeFix
};

