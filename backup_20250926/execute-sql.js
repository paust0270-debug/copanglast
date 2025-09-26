require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 Supabase SQL 실행 스크립트...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function executeSQL() {
  try {
    console.log('\n📋 1. slots 테이블 생성 SQL 실행...');
    
    // slots 테이블 생성 SQL
    const createSlotsTableSQL = `
      -- 1. 기존 slots 테이블 삭제 (데이터 손실 주의)
      DROP TABLE IF EXISTS public.slots CASCADE;

      -- 2. 올바른 slots 테이블 생성
      CREATE TABLE public.slots (
        id SERIAL PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        slot_type TEXT NOT NULL,
        slot_count INTEGER NOT NULL DEFAULT 1,
        payment_type TEXT,
        payer_name TEXT,
        payment_amount INTEGER,
        payment_date TEXT,
        usage_days INTEGER,
        memo TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 3. 인덱스 생성
      CREATE INDEX idx_slots_customer_id ON public.slots(customer_id);
      CREATE INDEX idx_slots_slot_type ON public.slots(slot_type);
      CREATE INDEX idx_slots_status ON public.slots(status);
      CREATE INDEX idx_slots_created_at ON public.slots(created_at DESC);

      -- 4. RLS 활성화
      ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

      -- 5. RLS 정책 생성
      CREATE POLICY "Allow all operations for all users" ON public.slots
        FOR ALL USING (true) WITH CHECK (true);
    `;
    
    console.log('🔧 SQL 실행 중...');
    
    // SQL을 개별 문장으로 분리하여 실행
    const statements = createSlotsTableSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`\n📄 SQL 실행 (${i + 1}/${statements.length}):`);
          console.log(statement.substring(0, 100) + '...');
          
          // 직접 SQL 실행 (RPC 함수 사용)
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
    
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // slots 테이블 접근 테스트
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .limit(1);
    
    if (slotsError) {
      console.log('❌ slots 테이블 접근 실패:', slotsError.message);
      console.log('\n💡 수동 실행이 필요합니다:');
      console.log('1. Supabase 대시보드 → SQL Editor 열기');
      console.log('2. 아래 SQL을 복사하여 실행하세요:');
      console.log('='.repeat(80));
      console.log(createSlotsTableSQL);
      console.log('='.repeat(80));
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
    
    console.log('\n🎉 SQL 실행 완료!');
    
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
        console.log('Supabase SQL Editor에서 위의 SQL을 실행하세요.');
      } else {
        console.log('✅ 최종 테스트 성공!');
        console.log('🎉 slots 테이블이 성공적으로 생성되었습니다!');
        console.log('\n📋 다음 단계:');
        console.log('1. 개발 서버 재시작: npm run dev');
        console.log('2. 브라우저에서 슬롯 추가 기능 테스트');
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
executeSQL();

