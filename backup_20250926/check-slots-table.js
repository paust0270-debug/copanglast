require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🔍 slots 테이블 확인 및 수정 시작...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function checkAndFixSlotsTable() {
  try {
    console.log('\n📋 1. slots 테이블 존재 확인...');
    
    // slots 테이블 접근 시도
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .limit(1);
    
    if (slotsError) {
      console.log('❌ slots 테이블 접근 실패:', slotsError.message);
      
      if (slotsError.message.includes('relation') || slotsError.message.includes('table')) {
        console.log('\n🔧 slots 테이블이 존재하지 않습니다. 생성이 필요합니다.');
        console.log('\n📝 Supabase SQL Editor에서 다음 SQL을 실행하세요:');
        console.log('---');
        console.log('-- fix-slots-table.sql 파일의 내용을 복사하여 실행하세요');
        console.log('---');
        
        // fix-slots-table.sql 파일 내용 출력
        const fs = require('fs');
        const fixSlotsTablePath = './fix-slots-table.sql';
        
        if (fs.existsSync(fixSlotsTablePath)) {
          console.log('\n📄 fix-slots-table.sql 내용:');
          console.log('---');
          const sqlContent = fs.readFileSync(fixSlotsTablePath, 'utf8');
          console.log(sqlContent);
          console.log('---');
        }
      }
    } else {
      console.log('✅ slots 테이블 접근 성공');
      
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
          console.log('\n❌ 누락된 컬럼들:', missingColumns);
          console.log('\n🔧 테이블 구조 수정이 필요합니다.');
          console.log('fix-slots-table.sql을 실행하여 올바른 구조로 재생성하세요.');
        } else {
          console.log('✅ slots 테이블 구조가 올바릅니다.');
        }
      } else {
        console.log('slots 테이블이 비어있습니다.');
      }
    }
    
    // 2. 스키마 캐시 갱신 테스트
    console.log('\n📋 2. 스키마 캐시 갱신 테스트...');
    
    try {
      const { data: cacheTest, error: cacheError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (cacheError) {
        console.log('⚠️ 스키마 캐시 문제 가능성:', cacheError.message);
      } else {
        console.log('✅ 스키마 캐시 정상');
      }
    } catch (err) {
      console.log('⚠️ 스키마 캐시 테스트 중 오류:', err.message);
    }
    
    console.log('\n🎉 slots 테이블 확인 완료!');
    
    // 3. 다음 단계 안내
    console.log('\n📋 다음 단계:');
    console.log('1. Supabase 대시보드 → SQL Editor 열기');
    console.log('2. fix-slots-table.sql 내용을 복사하여 실행');
    console.log('3. fix-schema-cache.sql 실행');
    console.log('4. npm run dev로 개발 서버 재시작');
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkAndFixSlotsTable();

