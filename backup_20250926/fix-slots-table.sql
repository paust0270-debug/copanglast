-- slots 테이블 수정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 기존 slots 테이블 삭제 (데이터 손실 주의)
DROP TABLE IF EXISTS public.slots CASCADE;

-- 2. 올바른 slots 테이블 생성
CREATE TABLE public.slots (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL, -- 고객 ID (username)
  customer_name TEXT NOT NULL, -- 고객명
  slot_type TEXT NOT NULL, -- 슬롯 유형 (coupang, coupang-vip, coupang-app, naver-shopping, place, today-house, aliexpress)
  slot_count INTEGER NOT NULL DEFAULT 1, -- 슬롯 개수
  payment_type TEXT, -- 입금 구분 (deposit, coupon)
  payer_name TEXT, -- 입금자명
  payment_amount INTEGER, -- 입금액
  payment_date TEXT, -- 입금일자
  usage_days INTEGER, -- 사용일수
  memo TEXT, -- 메모
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

-- 6. updated_at 자동 업데이트 트리거
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 테이블 생성 확인
SELECT 
  'slots' as table_name,
  COUNT(*) as row_count
FROM public.slots;

-- 8. 스키마 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'slots'
ORDER BY ordinal_position;

-- 9. 완료 메시지
SELECT 'slots 테이블이 올바르게 생성되었습니다!' as message;
