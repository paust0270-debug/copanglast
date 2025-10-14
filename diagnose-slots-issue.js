require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 slots 테이블 문제 해결 가이드...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function provideFixGuide() {
  try {
    console.log('\n📋 현재 상황 분석...');
    
    // slots 테이블 접근 시도
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .limit(1);
    
    if (slotsError) {
      console.log('❌ 문제 확인됨:', slotsError.message);
      console.log('\n🔧 해결 방법:');
      console.log('1. Supabase 대시보드에서 SQL Editor를 열어주세요');
      console.log('2. 아래 SQL 스크립트를 복사하여 실행하세요');
      console.log('3. 실행 후 개발 서버를 재시작하세요');
      
      // fix-slots-table.sql 내용 출력
      const fixSlotsTablePath = './fix-slots-table.sql';
      if (fs.existsSync(fixSlotsTablePath)) {
        console.log('\n📄 실행할 SQL 스크립트:');
        console.log('='.repeat(80));
        const sqlContent = fs.readFileSync(fixSlotsTablePath, 'utf8');
        console.log(sqlContent);
        console.log('='.repeat(80));
      }
      
      // fix-schema-cache.sql 내용도 출력
      const fixSchemaCachePath = './fix-schema-cache.sql';
      if (fs.existsSync(fixSchemaCachePath)) {
        console.log('\n📄 스키마 캐시 갱신 SQL:');
        console.log('='.repeat(80));
        const cacheSqlContent = fs.readFileSync(fixSchemaCachePath, 'utf8');
        console.log(cacheSqlContent);
        console.log('='.repeat(80));
      }
      
      console.log('\n📋 단계별 실행 가이드:');
      console.log('1️⃣ Supabase 대시보드 → SQL Editor 열기');
      console.log('2️⃣ 위의 fix-slots-table.sql 내용을 복사하여 실행');
      console.log('3️⃣ 위의 fix-schema-cache.sql 내용을 복사하여 실행');
      console.log('4️⃣ 개발 서버 재시작: npm run dev');
      console.log('5️⃣ 브라우저에서 슬롯 추가 기능 테스트');
      
    } else {
      console.log('✅ slots 테이블이 정상적으로 존재합니다!');
      
      // 테이블 구조 확인
      if (slotsData.length > 0) {
        const columns = Object.keys(slotsData[0]);
        console.log('현재 slots 테이블 컬럼들:', columns);
        
        // 필요한 컬럼 확인
        const requiredColumns = [
          'customer_id', 'customer_name', 'slot_type', 'slot_count',
          'payment_type', 'payer_name', 'payment_amount', 'payment_date',
          'usage_days', 'memo', 'status', 'created_at'
        ];
        
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('\n⚠️ 일부 컬럼이 누락되었습니다:', missingColumns);
          console.log('fix-slots-table.sql을 실행하여 올바른 구조로 재생성하세요.');
        } else {
          console.log('✅ slots 테이블 구조가 완벽합니다!');
          console.log('🎉 슬롯 추가 기능이 정상적으로 작동할 것입니다!');
        }
      }
    }
    
    // 추가 진단
    console.log('\n📋 추가 진단 정보:');
    
    // user_profiles 테이블 확인
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (userError) {
        console.log('❌ user_profiles 테이블 문제:', userError.message);
      } else {
        console.log('✅ user_profiles 테이블 정상');
      }
    } catch (err) {
      console.log('⚠️ user_profiles 테이블 확인 중 오류:', err.message);
    }
    
    // customers 테이블 확인
    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (customerError) {
        console.log('❌ customers 테이블 문제:', customerError.message);
      } else {
        console.log('✅ customers 테이블 정상');
      }
    } catch (err) {
      console.log('⚠️ customers 테이블 확인 중 오류:', err.message);
    }
    
    console.log('\n🎉 진단 완료!');
    
  } catch (error) {
    console.error('❌ 진단 중 오류:', error);
  }
}

// 스크립트 실행
provideFixGuide();
