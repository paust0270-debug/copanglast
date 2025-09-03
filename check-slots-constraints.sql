-- slots 테이블 제약조건 확인
SELECT conname, consrc 
FROM pg_constraint 
JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
WHERE relname = 'slots';


