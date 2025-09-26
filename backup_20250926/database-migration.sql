-- 데이터베이스 마이그레이션 스크립트
-- 기존 데이터베이스를 새로운 승인 시스템에 맞게 업데이트

-- 1. user_profiles 테이블에 새 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS processor TEXT,
ADD COLUMN IF NOT EXISTS username TEXT; -- 실제 회원가입시 입력한 username

-- 2. users 테이블에 새 컬럼 추가 (만약 존재한다면)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS processor TEXT,
ADD COLUMN IF NOT EXISTS username TEXT; -- 실제 회원가입시 입력한 username

-- 3. grade 컬럼에 체크 제약조건 추가 (기존 제약조건이 있다면 먼저 삭제)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_grade_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_grade_check CHECK (grade IN ('일반회원', '총판회원', '최고관리자'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_grade_check;
ALTER TABLE users ADD CONSTRAINT users_grade_check CHECK (grade IN ('일반회원', '총판회원', '최고관리자'));

-- 4. status 컬럼에 체크 제약조건 추가
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_status_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_status_check CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'active', 'rejected', 'suspended'));

-- 5. 기존 데이터의 grade 컬럼 업데이트
UPDATE user_profiles SET grade = '일반회원' WHERE grade NOT IN ('일반회원', '총판회원', '최고관리자');
UPDATE users SET grade = '일반회원' WHERE grade NOT IN ('일반회원', '총판회원', '최고관리자');

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 7. 기본 최고관리자 계정 생성 (없는 경우에만)
INSERT INTO user_profiles (id, name, username, email, phone, grade, status, created_at) 
SELECT 
  gen_random_uuid(),
  '최고관리자',
  'admin',
  'admin@coupang-rank.com',
  '010-0000-0000',
  '최고관리자',
  'active',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE grade = '최고관리자'
);

-- 8. 완료 메시지
SELECT '데이터베이스 마이그레이션이 완료되었습니다.' as message;
