-- traffic 테이블에 slot_type과 slot_count 컬럼 추가
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS slot_type TEXT DEFAULT '쿠팡';
ALTER TABLE traffic ADD COLUMN IF NOT EXISTS slot_count INTEGER DEFAULT 1;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_traffic_slot_type ON traffic(slot_type);
CREATE INDEX IF NOT EXISTS idx_traffic_slot_count ON traffic(slot_count);

