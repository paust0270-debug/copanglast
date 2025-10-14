-- settlement_history 테이블 생성
-- 정산완료된 데이터를 별도로 저장하는 테이블

CREATE TABLE IF NOT EXISTS settlement_history (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  slot_type VARCHAR(50) NOT NULL,
  slot_count INTEGER NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  distributor_name VARCHAR(255) NOT NULL,
  payer_name VARCHAR(255),
  payment_amount INTEGER NOT NULL,
  usage_days INTEGER,
  memo TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_settlement_id INTEGER,
  settlement_batch_id VARCHAR(255),
  payment_date DATE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlement_history_customer_id ON settlement_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_distributor ON settlement_history(distributor_name);
CREATE INDEX IF NOT EXISTS idx_settlement_history_completed_at ON settlement_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_settlement_history_batch_id ON settlement_history(settlement_batch_id);

-- 제약조건 추가
ALTER TABLE settlement_history ADD CONSTRAINT settlement_history_status_check 
CHECK (status IN ('completed', 'cancelled'));


