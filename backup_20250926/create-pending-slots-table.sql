-- 대기 상태 슬롯 테이블 생성
-- 슬롯 추가 후 승인 대기 상태로 저장하는 테이블

-- 1. 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS public.pending_slots CASCADE;

-- 2. 대기 상태 슬롯 테이블 생성
CREATE TABLE public.pending_slots (
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- 3. 인덱스 생성
CREATE INDEX idx_pending_slots_customer_id ON public.pending_slots(customer_id);
CREATE INDEX idx_pending_slots_status ON public.pending_slots(status);
CREATE INDEX idx_pending_slots_created_at ON public.pending_slots(created_at DESC);

-- 4. RLS 활성화
ALTER TABLE public.pending_slots ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
CREATE POLICY "Allow all operations for all users" ON public.pending_slots
  FOR ALL USING (true) WITH CHECK (true);

-- 6. 테이블 생성 확인
SELECT 'pending_slots table created successfully' as status;
