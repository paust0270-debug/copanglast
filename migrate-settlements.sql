-- 기존 settlements 테이블에 새로운 필드 추가 (마이그레이션)
-- 이 스크립트는 기존 데이터와 호환되도록 설계되었습니다.

-- 1. 기존 settlements 테이블에 새로운 필드들 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS original_settlement_id BIGINT REFERENCES settlements(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS included_slot_ids INTEGER[]; -- 포함된 슬롯 ID 배열

-- 2. settlement_items 테이블 생성 (없는 경우)
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

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlements_original_id ON settlements(original_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_version ON settlements(version);
CREATE INDEX IF NOT EXISTS idx_settlements_is_latest ON settlements(is_latest);
CREATE INDEX IF NOT EXISTS idx_settlements_included_slots ON settlements USING GIN(included_slot_ids);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_slot_id ON settlement_items(slot_id);

-- 4. 기존 데이터에 대한 기본값 설정
UPDATE settlements 
SET 
  version = 1,
  is_latest = true,
  original_settlement_id = NULL
WHERE version IS NULL OR is_latest IS NULL;

-- 5. 기존 정산 데이터에 대한 included_slot_ids 업데이트 (가능한 경우)
-- 이 부분은 실제 데이터에 따라 수동으로 조정이 필요할 수 있습니다.
-- 예: 최근 정산된 슬롯들을 해당 정산에 연결
