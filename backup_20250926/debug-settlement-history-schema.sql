-- settlement_history 테이블 스키마 상세 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'settlement_history' 
ORDER BY ordinal_position;

-- settlement_history 테이블의 현재 데이터 확인
SELECT COUNT(*) as current_count FROM settlement_history;

-- 혹시 기존 데이터가 있다면 구조 확인
SELECT * FROM settlement_history LIMIT 1;

