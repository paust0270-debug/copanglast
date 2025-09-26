-- settlement_history 테이블에 original_settlement_ids 컬럼 추가
-- 정산완료 시 원본 settlements ID들을 저장하여 정산수정 시 정확한 데이터 조회 가능

-- 컬럼 추가 (TEXT 타입으로 콤마 구분 ID 저장)
ALTER TABLE settlement_history 
ADD COLUMN IF NOT EXISTS original_settlement_ids TEXT;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN settlement_history.original_settlement_ids IS '원본 settlements ID들 (콤마 구분, 예: "1,2,3")';

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_settlement_history_original_ids ON settlement_history(original_settlement_ids);
