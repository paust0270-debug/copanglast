-- 정산 시스템 마이그레이션 스크립트
-- 이 스크립트를 Supabase 대시보드 → SQL Editor에서 실행하세요

-- 1. exec_sql 함수 생성 (필요한 경우)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- 2. 기존 settlements 테이블에 새로운 필드들 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS original_settlement_id BIGINT REFERENCES settlements(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS included_slot_ids INTEGER[];

-- 3. settlement_items 테이블 생성
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

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlements_original_id ON settlements(original_settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlements_version ON settlements(version);
CREATE INDEX IF NOT EXISTS idx_settlements_is_latest ON settlements(is_latest);
CREATE INDEX IF NOT EXISTS idx_settlements_included_slots ON settlements USING GIN(included_slot_ids);
CREATE INDEX IF NOT EXISTS idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX IF NOT EXISTS idx_settlement_items_slot_id ON settlement_items(slot_id);

-- 5. 기존 데이터에 대한 기본값 설정
UPDATE settlements 
SET 
  version = 1,
  is_latest = true,
  original_settlement_id = NULL
WHERE version IS NULL OR is_latest IS NULL;

-- 6. 정산 ID 5에 대한 기본 settlement_items 생성
INSERT INTO settlement_items (settlement_id, slot_id, customer_id, customer_name, slot_type, slot_count, payment_amount, usage_days, memo)
SELECT 
  s.id,
  s.id, -- slot_id를 settlement_id와 동일하게 설정
  'N/A',
  'N/A',
  'coupang',
  s.total_slots,
  s.total_deposit_amount,
  0,
  s.memo
FROM settlements s
WHERE s.id = 5
AND NOT EXISTS (
  SELECT 1 FROM settlement_items si WHERE si.settlement_id = s.id
);

-- 7. 마이그레이션 완료 확인
SELECT 'Migration completed successfully' as status;
SELECT * FROM settlements WHERE id = 5;
SELECT * FROM settlement_items WHERE settlement_id = 5;
