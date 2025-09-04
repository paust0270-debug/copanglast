require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

console.log('🚀 Supabase 직접 테이블 생성 시도...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false
  }
});

async function createTableDirectly() {
  try {
    console.log('\n📋 1. Supabase 직접 테이블 생성 시도...');
    
    // 먼저 기존 테이블 삭제 시도 (존재하지 않으면 무시)
    try {
      await supabase.rpc('drop_table_if_exists', { table_name: 'slots' });
      console.log('✅ 기존 테이블 삭제 시도 완료');
    } catch (err) {
      console.log('⚠️ 기존 테이블 삭제 실패 (정상):', err.message);
    }
    
    // 테이블 생성 시도 (실제로는 작동하지 않을 수 있음)
    try {
      const { data, error } = await supabase.rpc('create_slots_table');
      if (error) {
        console.log('❌ RPC 함수를 통한 테이블 생성 실패:', error.message);
      } else {
        console.log('✅ RPC 함수를 통한 테이블 생성 성공');
      }
    } catch (err) {
      console.log('⚠️ RPC 함수를 통한 테이블 생성 실패 (정상):', err.message);
    }
    
    console.log('\n📋 2. 수동 SQL 실행 안내...');
    console.log('\n🔧 해결 방법:');
    console.log('1. Supabase 대시보드에서 SQL Editor를 열어주세요');
    console.log('2. 아래 SQL을 복사하여 실행하세요');
    console.log('3. 실행 후 이 스크립트를 다시 실행하세요');
    
    console.log('\n📄 실행할 SQL:');
    console.log('='.repeat(80));
    console.log(`
-- slots 테이블 생성 (복사하여 Supabase SQL Editor에서 실행하세요)
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

-- 테이블 생성 확인
SELECT 'slots table created successfully' as status;
    `);
    console.log('='.repeat(80));
    
    console.log('\n📋 3. 단계별 실행 가이드:');
    console.log('1️⃣ Supabase 대시보드 접속');
    console.log('2️⃣ 왼쪽 메뉴에서 "SQL Editor" 클릭');
    console.log('3️⃣ "New query" 버튼 클릭');
    console.log('4️⃣ 위의 SQL을 복사하여 붙여넣기');
    console.log('5️⃣ "Run" 버튼 클릭');
    console.log('6️⃣ 성공 메시지 확인');
    console.log('7️⃣ 이 스크립트를 다시 실행하여 확인');
    
    console.log('\n📋 4. 실행 후 확인:');
    console.log('SQL 실행 후 다음 명령어로 확인하세요:');
    console.log('node create-slots-table.js');
    
  } catch (error) {
    console.error('❌ 실행 중 오류:', error);
  }
}

// 스크립트 실행
createTableDirectly();



