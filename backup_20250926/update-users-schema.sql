-- users 테이블 스키마 업데이트
-- 슬롯 관리 시스템을 위한 필드 추가

-- 1. users 테이블에 슬롯 관련 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_slots INTEGER DEFAULT 0;

-- 2. 슬롯 상태별 분류를 위한 필드 추가
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expired_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS suspended_slots INTEGER DEFAULT 0;

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_total_slots ON users(total_slots);
CREATE INDEX IF NOT EXISTS idx_users_available_slots ON users(available_slots);
CREATE INDEX IF NOT EXISTS idx_users_used_slots ON users(used_slots);

-- 4. 슬롯 자동 계산 함수 생성
CREATE OR REPLACE FUNCTION calculate_user_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- 슬롯 추가/수정 시 사용자의 슬롯 정보 자동 계산
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- 해당 고객의 총 슬롯 수 계산
    UPDATE users 
    SET 
      total_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status IN ('active', 'suspended')
      ),
      used_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status = 'active'
      ),
      available_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status = 'active'
      ) - (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM customers 
        WHERE name = NEW.customer_name
        AND status = '작동중'
      ),
      active_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status = 'active'
      ),
      expired_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status = 'expired'
      ),
      suspended_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM slots 
        WHERE customer_id = NEW.customer_id 
        AND status = 'suspended'
      ),
      updated_at = NOW()
    WHERE username = NEW.customer_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. 슬롯 테이블에 트리거 추가
DROP TRIGGER IF EXISTS trigger_calculate_user_slots ON slots;
CREATE TRIGGER trigger_calculate_user_slots
  AFTER INSERT OR UPDATE OR DELETE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION calculate_user_slots();

-- 6. 고객 테이블에도 트리거 추가 (작업 등록 시 슬롯 사용량 업데이트)
CREATE OR REPLACE FUNCTION update_user_slot_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- 작업 등록/수정 시 사용자의 사용 슬롯 수 업데이트
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE users 
    SET 
      used_slots = (
        SELECT COALESCE(SUM(slot_count), 0)
        FROM customers 
        WHERE name = NEW.name
        AND status = '작동중'
      ),
      available_slots = total_slots - used_slots,
      updated_at = NOW()
    WHERE username = (
      SELECT username FROM users WHERE name = NEW.name LIMIT 1
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. 고객 테이블에 트리거 추가
DROP TRIGGER IF EXISTS trigger_update_user_slot_usage ON customers;
CREATE TRIGGER trigger_update_user_slot_usage
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_slot_usage();

-- 8. 기존 데이터에 대한 슬롯 정보 초기화
UPDATE users 
SET 
  total_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM slots 
    WHERE customer_id = users.username 
    AND status IN ('active', 'suspended')
  ),
  used_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM customers 
    WHERE name = users.name
    AND status = '작동중'
  ),
  available_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM slots 
    WHERE customer_id = users.username 
    AND status = 'active'
  ) - (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM customers 
    WHERE name = users.name
    AND status = '작동중'
  ),
  active_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM slots 
    WHERE customer_id = users.username 
    AND status = 'active'
  ),
  expired_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM slots 
    WHERE customer_id = users.username 
    AND status = 'expired'
  ),
  suspended_slots = (
    SELECT COALESCE(SUM(slot_count), 0)
    FROM slots 
    WHERE customer_id = users.username 
    AND status = 'suspended'
  ),
  updated_at = NOW();

-- 9. 슬롯 만료 처리 함수 (사용일수 만료 시 자동 만료)
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
    
  -- 만료된 슬롯들에 대해 사용자 슬롯 정보 업데이트
  UPDATE users 
  SET 
    total_slots = (
      SELECT COALESCE(SUM(slot_count), 0)
      FROM slots 
      WHERE customer_id = users.username 
      AND status IN ('active', 'suspended')
    ),
    expired_slots = (
      SELECT COALESCE(SUM(slot_count), 0)
      FROM slots 
      WHERE customer_id = users.username 
      AND status = 'expired'
    ),
    available_slots = total_slots - used_slots,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 10. 슬롯 만료 체크를 위한 스케줄러 (매일 자정에 실행)
-- 주의: 실제 운영환경에서는 pg_cron 확장을 사용하거나 외부 스케줄러를 사용해야 합니다.
-- 개발환경에서는 수동으로 실행하거나 API를 통해 호출합니다.

-- 11. 슬롯 상태 변경 함수
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

-- 12. 사용자별 슬롯 정보 조회 함수
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
    u.total_slots,
    u.available_slots,
    u.used_slots,
    u.active_slots,
    u.expired_slots,
    u.suspended_slots
  FROM users u
  WHERE u.username = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 13. 테이블 구조 확인
SELECT 
  'users' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 14. 함수 생성 확인
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%slot%'
ORDER BY routine_name;
