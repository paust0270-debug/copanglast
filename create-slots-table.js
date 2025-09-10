require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 slots 테이블 생성 시도...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function createSlotsTable() {
  try {
    console.log('\n📋 1. slots 테이블 생성 시도...');
    
    // 먼저 slots 테이블에 접근해서 존재하는지 확인
    const { data: existingData, error: existingError } = await supabase
      .from('slots')
      .select('*')
      .limit(1);
    
    if (existingError) {
      console.log('❌ slots 테이블이 존재하지 않습니다:', existingError.message);
      console.log('\n🔧 해결 방법:');
      console.log('1. Supabase 대시보드에서 SQL Editor를 열어주세요');
      console.log('2. 아래 SQL을 복사하여 실행하세요');
      console.log('3. 실행 후 이 스크립트를 다시 실행하세요');
      
      console.log('\n📄 실행할 SQL:');
      console.log('='.repeat(80));
      console.log(`
-- slots 테이블 생성
DROP TABLE IF EXISTS public.slots CASCADE;

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

-- 인덱스 생성
CREATE INDEX idx_slots_customer_id ON public.slots(customer_id);
CREATE INDEX idx_slots_slot_type ON public.slots(slot_type);
CREATE INDEX idx_slots_status ON public.slots(status);
CREATE INDEX idx_slots_created_at ON public.slots(created_at DESC);

-- RLS 활성화
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Allow all operations for all users" ON public.slots
  FOR ALL USING (true) WITH CHECK (true);
      `);
      console.log('='.repeat(80));
      
      return;
    }
    
    console.log('✅ slots 테이블이 이미 존재합니다!');
    
    // 테이블 구조 확인
    if (existingData.length > 0) {
      const columns = Object.keys(existingData[0]);
      console.log('현재 slots 테이블 컬럼들:', columns);
      
      // 필요한 컬럼 확인
      const requiredColumns = [
        'customer_id', 'customer_name', 'slot_type', 'slot_count',
        'payment_type', 'payer_name', 'payment_amount', 'payment_date',
        'usage_days', 'memo', 'status', 'created_at'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️ 누락된 컬럼들:', missingColumns);
        console.log('테이블 구조를 수정해야 합니다.');
      } else {
        console.log('✅ slots 테이블 구조가 올바릅니다!');
      }
    } else {
      console.log('slots 테이블이 비어있습니다 (정상)');
    }
    
    console.log('\n📋 2. 스키마 캐시 갱신...');
    
    // 각 테이블에 접근하여 스키마 캐시 갱신
    try {
      await supabase.from('user_profiles').select('id').limit(1);
      console.log('✅ user_profiles 테이블 스키마 갱신');
    } catch (err) {
      console.log('⚠️ user_profiles 테이블 접근 오류:', err.message);
    }
    
    try {
      await supabase.from('customers').select('id').limit(1);
      console.log('✅ customers 테이블 스키마 갱신');
    } catch (err) {
      console.log('⚠️ customers 테이블 접근 오류:', err.message);
    }
    
    try {
      await supabase.from('slots').select('id').limit(1);
      console.log('✅ slots 테이블 스키마 갱신');
    } catch (err) {
      console.log('⚠️ slots 테이블 접근 오류:', err.message);
    }
    
    console.log('\n🎉 slots 테이블 확인 완료!');
    console.log('\n📋 다음 단계:');
    console.log('1. 개발 서버 재시작: npm run dev');
    console.log('2. 브라우저에서 슬롯 추가 기능 테스트');
    
  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

// 스크립트 실행
createSlotsTable();




