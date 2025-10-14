-- settlements 테이블에 누락된 컬럼들 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS payment_date DATE;

ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS settlement_batch_id VARCHAR(255);

-- slot_add_forms 테이블에 누락된 컬럼들 추가
ALTER TABLE slot_add_forms 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- settlement_history 테이블에 누락된 컬럼들 추가
ALTER TABLE settlement_history 
ADD COLUMN IF NOT EXISTS settlement_id BIGINT;

-- 테이블 구조 확인
SELECT 'settlements 테이블 구조:' as description;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlements' 
ORDER BY ordinal_position;

SELECT 'slot_add_forms 테이블 구조:' as description;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'slot_add_forms' 
ORDER BY ordinal_position;

SELECT 'settlement_history 테이블 구조:' as description;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlement_history' 
ORDER BY ordinal_position;
