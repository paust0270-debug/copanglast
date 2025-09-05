-- slots 테이블의 status 컬럼 제약조건 업데이트
-- 'suspended' 상태 추가

-- 1. 기존 제약조건 삭제
ALTER TABLE public.slots DROP CONSTRAINT IF EXISTS slots_status_check;

-- 2. 새로운 제약조건 추가 (suspended 포함)
ALTER TABLE public.slots ADD CONSTRAINT slots_status_check 
CHECK (status IN ('active', 'inactive', 'expired', 'suspended'));

-- 3. 제약조건 확인
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.slots'::regclass 
AND conname = 'slots_status_check';

-- 4. 테스트용 데이터 업데이트 (선택사항)
-- UPDATE slots SET status = 'suspended' WHERE id = 1; -- 테스트용
