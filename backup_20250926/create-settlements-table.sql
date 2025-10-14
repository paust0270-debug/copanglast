-- 기존 settlements 테이블 삭제 (있다면)
DROP TABLE IF EXISTS settlements CASCADE;

-- 정산 테이블 생성 (개선된 버전)
CREATE TABLE IF NOT EXISTS settlements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sequential_number INTEGER NOT NULL,
  distributor_name TEXT NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  total_deposit_amount INTEGER NOT NULL DEFAULT 0,
  depositor_name TEXT,
  deposit_date DATE,
  request_date DATE,
  memo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'modified')),
  original_settlement_id BIGINT REFERENCES settlements(id), -- 원본 정산 ID (수정 시 참조)
  version INTEGER DEFAULT 1, -- 버전 관리
  is_latest BOOLEAN DEFAULT true, -- 최신 버전 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 정산 상세 내역 테이블 (슬롯별 정산 정보)
CREATE TABLE IF NOT EXISTS settlement_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  settlement_id BIGINT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  slot_id BIGINT NOT NULL REFERENCES slots(id),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_count INTEGER NOT NULL DEFAULT 1,
  payment_amount INTEGER NOT NULL DEFAULT 0,
  usage_days INTEGER DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_original_id ON settlements(original_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_latest ON settlements(is_latest) WHERE is_latest = true;

CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_slot_id ON settlement_items(slot_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_settlements_updated_at
  BEFORE UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 정산 상태에 대한 설명
COMMENT ON TABLE settlements IS '정산 완료 내역';
COMMENT ON COLUMN settlements.sequential_number IS '순번';
COMMENT ON COLUMN settlements.distributor_name IS '대상총판';
COMMENT ON COLUMN settlements.total_slots IS '슬롯수';
COMMENT ON COLUMN settlements.total_deposit_amount IS '정산계산 입금액값';
COMMENT ON COLUMN settlements.depositor_name IS '정산계산 입금자명 값';
COMMENT ON COLUMN settlements.deposit_date IS '정산계산 입금일 값';
COMMENT ON COLUMN settlements.request_date IS '요청일';
COMMENT ON COLUMN settlements.memo IS '메모';
COMMENT ON COLUMN settlements.status IS '정산 상태 (completed)';
COMMENT ON COLUMN settlements.created_at IS '생성일시';
COMMENT ON COLUMN settlements.updated_at IS '수정일시';
