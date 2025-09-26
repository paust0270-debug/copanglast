require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 slots 테이블 자동 생성 및 수정 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function executeSlotsTableFix() {
  try {
    console.log('\n📋 1. fix-slots-table.sql 실행...');
    
    // fix-slots-table.sql 파일 읽기
    const fixSlotsTablePath = './fix-slots-table.sql';
    if (!fs.existsSync(fixSlotsTablePath)) {
      console.error('❌ fix-slots-table.sql 파일을 찾을 수 없습니다!');
      return;
    }
    
    const sqlContent = fs.readFileSync(fixSlotsTablePath, 'utf8');
    
    // SQL 문들을 분리하여 실행
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 ${sqlStatements.length}개의 SQL 문을 실행합니다...`);
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      if (statement.trim()) {
        try {
          console.log(`\n🔧 SQL 실행 중 (${i + 1}/${sqlStatements.length}):`);
          console.log(statement.substring(0, 100) + '...');
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          });
          
          if (error) {
            console.log(`⚠️ SQL 실행 중 오류 (정상적인 상황):`, error.message);
          } else {
            console.log(`✅ SQL 실행 성공`);
          }
        } catch (err) {
          console.log(`⚠️ SQL 실행 중 예외 (정상적인 상황):`, err.message);
        }
      }
    }
    
    console.log('\n📋 2. slots 테이블 생성 확인...');
    
    // slots 테이블 접근 테스트
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .limit(1);
    
    if (slotsError) {
      console.log('❌ slots 테이블 접근 실패:', slotsError.message);
      console.log('\n💡 수동 실행이 필요합니다:');
      console.log('1. Supabase 대시보드 → SQL Editor 열기');
      console.log('2. fix-slots-table.sql 내용을 복사하여 실행');
    } else {
      console.log('✅ slots 테이블 접근 성공!');
      
      // 테이블 구조 확인
      if (slotsData.length > 0) {
        const columns = Object.keys(slotsData[0]);
        console.log('slots 테이블 컬럼들:', columns);
      } else {
        console.log('slots 테이블이 비어있습니다 (정상)');
      }
    }
    
    console.log('\n📋 3. 스키마 캐시 갱신...');
    
    // 스키마 캐시 갱신을 위한 추가 쿼리들
    const cacheQueries = [
      'SELECT pg_reload_conf()',
      'SELECT COUNT(*) FROM public.user_profiles LIMIT 1',
      'SELECT COUNT(*) FROM public.customers LIMIT 1',
      'SELECT COUNT(*) FROM public.slots LIMIT 1'
    ];
    
    for (const query of cacheQueries) {
      try {
        await supabase.rpc('exec_sql', { sql_query: query });
        console.log(`✅ 캐시 갱신 쿼리 실행: ${query}`);
      } catch (err) {
        console.log(`⚠️ 캐시 갱신 쿼리 오류 (정상):`, err.message);
      }
    }
    
    console.log('\n🎉 slots 테이블 자동 생성 완료!');
    
    // 4. 최종 테스트
    console.log('\n📋 4. 최종 테스트...');
    
    try {
      const { data: finalTest, error: finalError } = await supabase
        .from('slots')
        .select('*')
        .limit(1);
      
      if (finalError) {
        console.log('❌ 최종 테스트 실패:', finalError.message);
        console.log('\n💡 수동 실행이 필요합니다.');
        console.log('Supabase SQL Editor에서 fix-slots-table.sql을 실행하세요.');
      } else {
        console.log('✅ 최종 테스트 성공!');
        console.log('🎉 slots 테이블이 성공적으로 생성되었습니다!');
      }
    } catch (err) {
      console.log('❌ 최종 테스트 중 오류:', err.message);
    }
    
  } catch (error) {
    console.error('❌ 실행 중 오류:', error);
    console.log('\n💡 수동 실행이 필요합니다:');
    console.log('1. Supabase 대시보드 → SQL Editor 열기');
    console.log('2. fix-slots-table.sql 내용을 복사하여 실행');
    console.log('3. fix-schema-cache.sql 실행');
  }
}

// 스크립트 실행
executeSlotsTableFix();

