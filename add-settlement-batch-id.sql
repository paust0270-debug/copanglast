-- settlements 테이블에 settlement_batch_id 컬럼 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS settlement_batch_id VARCHAR(255);

-- 기존 데이터 확인
SELECT 'settlements 테이블 구조 확인:' as description;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlements' 
ORDER BY ordinal_position;

-- 데이터 확인
SELECT 'settlements 데이터 샘플:' as description;
SELECT id, customer_id, status, settlement_batch_id, created_at 
FROM settlements 
ORDER BY created_at DESC 
LIMIT 5;
