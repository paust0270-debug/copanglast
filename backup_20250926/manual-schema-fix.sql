-- Supabase SQL Editor에서 실행할 SQL 스크립트
-- 이 스크립트를 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. settlements 테이블에 payment_date 컬럼 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- 2. settlements 테이블에 settlement_batch_id 컬럼 추가
ALTER TABLE settlements 
ADD COLUMN IF NOT EXISTS settlement_batch_id VARCHAR(255);

-- 3. slot_add_forms 테이블에 customer_name 컬럼 추가
ALTER TABLE slot_add_forms 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 4. settlement_history 테이블에 settlement_id 컬럼 추가
ALTER TABLE settlement_history 
ADD COLUMN IF NOT EXISTS settlement_id BIGINT;

-- 5. 테이블 구조 확인
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
