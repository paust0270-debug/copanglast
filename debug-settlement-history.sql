-- settlement_history 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlement_history' 
ORDER BY ordinal_position;

-- settlement_history 테이블 데이터 확인
SELECT COUNT(*) as total_count
FROM settlement_history;

-- settlements 테이블에서 completed 상태 데이터 확인
SELECT id, customer_id, distributor_name, payment_type, created_at
FROM settlements 
WHERE status = 'completed'
LIMIT 3;

