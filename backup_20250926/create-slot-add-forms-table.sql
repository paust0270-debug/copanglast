-- 슬롯 추가 폼 데이터 저장용 테이블 생성
-- 기존 기능과 완전히 분리된 백업/기록용 테이블

-- 1. 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS public.slot_add_forms CASCADE;

-- 2. 슬롯 추가 폼 데이터 테이블 생성
CREATE TABLE public.slot_add_forms (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_count INTEGER NOT NULL DEFAULT 1,
  payment_type TEXT,
  payer_name TEXT,
  payment_amount INTEGER,
  payment_date TEXT,
  usage_days INTEGER DEFAULT 30,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_slot_add_forms_customer_id ON public.slot_add_forms(customer_id);
CREATE INDEX idx_slot_add_forms_created_at ON public.slot_add_forms(created_at DESC);
CREATE INDEX idx_slot_add_forms_slot_type ON public.slot_add_forms(slot_type);

-- 4. RLS 활성화
ALTER TABLE public.slot_add_forms ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (모든 사용자 접근 허용)
CREATE POLICY "Allow all operations for all users" ON public.slot_add_forms
  FOR ALL USING (true) WITH CHECK (true);

-- 6. 테이블 생성 확인
SELECT 'slot_add_forms table created successfully' as status;

-- 7. 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'slot_add_forms' 
ORDER BY ordinal_position;
