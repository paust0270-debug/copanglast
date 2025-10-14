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

-- 슬롯 상태 변경 함수 생성
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 슬롯 상태 변경 함수
CREATE OR REPLACE FUNCTION change_slot_status(
  slot_id_param INTEGER,
  new_status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  slot_record RECORD;
BEGIN
  -- 슬롯 정보 조회
  SELECT * INTO slot_record 
  FROM slots 
  WHERE id = slot_id_param;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- 슬롯 상태 업데이트
  UPDATE slots 
  SET 
    status = new_status_param,
    updated_at = NOW()
  WHERE id = slot_id_param;
  
  -- 사용자 슬롯 정보 자동 업데이트 (트리거에 의해)
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 2. 사용자별 슬롯 정보 조회 함수
CREATE OR REPLACE FUNCTION get_user_slot_info(user_id_param TEXT)
RETURNS TABLE (
  username TEXT,
  name TEXT,
  total_slots INTEGER,
  available_slots INTEGER,
  used_slots INTEGER,
  active_slots INTEGER,
  expired_slots INTEGER,
  suspended_slots INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.username,
    u.name,
    COALESCE((
      SELECT SUM(slot_count)
      FROM slots 
      WHERE customer_id = u.username 
      AND status IN ('active', 'suspended')
    ), 0)::INTEGER as total_slots,
    COALESCE((
      SELECT SUM(slot_count)
      FROM slots 
      WHERE customer_id = u.username 
      AND status = 'active'
    ), 0)::INTEGER as available_slots,
    COALESCE((
      SELECT SUM(slot_count)
      FROM customers 
      WHERE name = u.name
      AND status = '작동중'
    ), 0)::INTEGER as used_slots,
    COALESCE((
      SELECT SUM(slot_count)
      FROM slots 
      WHERE customer_id = u.username 
      AND status = 'active'
    ), 0)::INTEGER as active_slots,
    COALESCE((
      SELECT SUM(slot_count)
      FROM slots 
      WHERE customer_id = u.username 
      AND status = 'expired'
    ), 0)::INTEGER as expired_slots,
    COALESCE((
      SELECT SUM(slot_count)
      FROM slots 
      WHERE customer_id = u.username 
      AND status = 'suspended'
    ), 0)::INTEGER as suspended_slots
  FROM users u
  WHERE u.username = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 3. 슬롯 만료 체크 함수
CREATE OR REPLACE FUNCTION check_slot_expiry()
RETURNS void AS $$
BEGIN
  -- 사용일수가 지난 슬롯들을 만료 상태로 변경
  UPDATE slots 
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND created_at + INTERVAL '1 day' * usage_days < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. 함수 생성 확인
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('change_slot_status', 'get_user_slot_info', 'check_slot_expiry')
ORDER BY routine_name;