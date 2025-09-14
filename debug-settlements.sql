-- settlements 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlements' 
ORDER BY ordinal_position;

-- settlements 테이블 데이터 확인 (status='completed'인 데이터)
SELECT id, customer_id, distributor_name, slot_type, status, created_at
FROM settlements 
WHERE status = 'completed'
LIMIT 5;

-- settlements 테이블의 모든 상태 확인
SELECT status, COUNT(*) as count
FROM settlements 
GROUP BY status;

