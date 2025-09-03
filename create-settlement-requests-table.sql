-- 정산요청 테이블 생성
CREATE TABLE IF NOT EXISTS settlement_requests (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL,
  sequential_number INTEGER NOT NULL,
  distributor_name VARCHAR(100) NOT NULL,
  customer_id VARCHAR(255) NOT NULL,
  slot_addition_date DATE NOT NULL,
  slot_type VARCHAR(100) NOT NULL,
  number_of_slots INTEGER NOT NULL,
  depositor_name VARCHAR(255),
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  days_used INTEGER DEFAULT 0,
  memo TEXT,
  status VARCHAR(50) DEFAULT '승인대기',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlement_requests_customer_id ON settlement_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_status ON settlement_requests(status);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_created_at ON settlement_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_slot_id ON settlement_requests(slot_id);

-- 슬롯 테이블에 status 컬럼이 없다면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'slots' AND column_name = 'status'
  ) THEN
    ALTER TABLE slots ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;
