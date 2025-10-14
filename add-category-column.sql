-- 기존 settlement_requests 테이블에 category 컬럼 추가
ALTER TABLE settlement_requests 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'slot';

-- category 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlement_requests_category ON settlement_requests(category);

-- 기존 데이터의 category 값 업데이트 (기본값 'slot'으로 설정)
UPDATE settlement_requests 
SET category = 'slot' 
WHERE category IS NULL;




