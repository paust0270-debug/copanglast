-- settlements 테이블에 category 컬럼 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'slot';

-- category 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_settlements_category ON settlements(category);

-- 기존 데이터의 category 값 업데이트
-- payment_type이 'deposit'이면 'deposit', 그 외에는 'extension'으로 설정
UPDATE settlements 
SET category = CASE 
  WHEN payment_type = 'deposit' THEN 'deposit'
  ELSE 'extension'
END
WHERE category IS NULL;

