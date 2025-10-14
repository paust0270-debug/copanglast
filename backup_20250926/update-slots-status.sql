-- 기존 slots 테이블의 status 제약조건 수정
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_status_check;
ALTER TABLE slots ADD CONSTRAINT slots_status_check CHECK (status IN ('active', 'inactive', 'expired', 'completed'));


