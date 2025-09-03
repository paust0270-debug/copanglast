-- slots 테이블만 생성하는 SQL
CREATE TABLE IF NOT EXISTS slots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id TEXT NOT NULL, -- username으로 고객 식별
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('coupang', 'coupang-vip', 'coupang-app', 'naver-shopping', 'place', 'today-house', 'aliexpress')),
  slot_count INTEGER NOT NULL DEFAULT 1,
  payment_type TEXT CHECK (payment_type IN ('deposit', 'coupon')),
  payer_name TEXT,
  payment_amount INTEGER,
  payment_date DATE,
  usage_days INTEGER,
  memo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Allow all operations for all users" ON slots;

-- 정책 설정
CREATE POLICY "Allow all operations for all users" ON slots
  FOR ALL USING (true)
  WITH CHECK (true);

-- 트리거 삭제 (있는 경우)
DROP TRIGGER IF EXISTS update_slots_updated_at ON slots;

-- 트리거 생성
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slots_customer_id ON slots(customer_id);
CREATE INDEX IF NOT EXISTS idx_slots_slot_type ON slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_created_at ON slots(created_at DESC);
