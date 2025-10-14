-- settlement_history 테이블 생성 (수정된 버전)
-- 정산완료된 데이터를 별도로 저장하는 테이블
-- 기존 settlements/settlement_items 테이블 구조에 맞춰 수정

CREATE TABLE IF NOT EXISTS settlement_history (
  id SERIAL PRIMARY KEY,
  settlement_id BIGINT NOT NULL, -- 원본 정산 ID 참조
  sequential_number INTEGER NOT NULL, -- 정산 순번
  distributor_name TEXT NOT NULL, -- 총판명
  customer_id TEXT NOT NULL, -- 고객 ID
  customer_name TEXT NOT NULL, -- 고객명
  slot_id BIGINT, -- 슬롯 ID (선택적)
  slot_type TEXT NOT NULL, -- 슬롯 타입
  slot_count INTEGER NOT NULL DEFAULT 1, -- 슬롯 개수
  payment_type TEXT, -- 결제 타입 (extension, deposit 등)
  payment_amount INTEGER NOT NULL DEFAULT 0, -- 결제 금액
  usage_days INTEGER DEFAULT 0, -- 사용 일수
  memo TEXT, -- 메모
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')), -- 상태
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 생성일시
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 완료일시
  settlement_batch_id TEXT, -- 정산 배치 ID
  payment_date DATE, -- 결제일
  original_settlement_item_id BIGINT -- 원본 settlement_items ID 참조
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlement_history_customer_id ON settlement_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_distributor ON settlement_history(distributor_name);
CREATE INDEX IF NOT EXISTS idx_settlement_history_completed_at ON settlement_history(completed_at);
CREATE INDEX IF NOT EXISTS idx_settlement_history_batch_id ON settlement_history(settlement_batch_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_settlement_id ON settlement_history(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_sequential_number ON settlement_history(sequential_number);

-- 테이블 코멘트
COMMENT ON TABLE settlement_history IS '정산 완료 내역 히스토리';
COMMENT ON COLUMN settlement_history.settlement_id IS '원본 정산 ID';
COMMENT ON COLUMN settlement_history.sequential_number IS '정산 순번';
COMMENT ON COLUMN settlement_history.distributor_name IS '총판명';
COMMENT ON COLUMN settlement_history.customer_id IS '고객 ID';
COMMENT ON COLUMN settlement_history.customer_name IS '고객명';
COMMENT ON COLUMN settlement_history.slot_id IS '슬롯 ID';
COMMENT ON COLUMN settlement_history.slot_type IS '슬롯 타입';
COMMENT ON COLUMN settlement_history.slot_count IS '슬롯 개수';
COMMENT ON COLUMN settlement_history.payment_type IS '결제 타입';
COMMENT ON COLUMN settlement_history.payment_amount IS '결제 금액';
COMMENT ON COLUMN settlement_history.usage_days IS '사용 일수';
COMMENT ON COLUMN settlement_history.memo IS '메모';
COMMENT ON COLUMN settlement_history.status IS '상태 (completed, cancelled)';
COMMENT ON COLUMN settlement_history.created_at IS '생성일시';
COMMENT ON COLUMN settlement_history.completed_at IS '완료일시';
COMMENT ON COLUMN settlement_history.settlement_batch_id IS '정산 배치 ID';
COMMENT ON COLUMN settlement_history.payment_date IS '결제일';
COMMENT ON COLUMN settlement_history.original_settlement_item_id IS '원본 settlement_items ID';