-- user_profiles 테이블에 누락된 컬럼들 추가
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. username 컬럼 추가 (아이디용)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. password 컬럼 추가 (비밀번호용)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. 기존 데이터가 있다면 기본값 설정
UPDATE user_profiles SET username = name WHERE username IS NULL;
UPDATE user_profiles SET password = NULL WHERE password IS NULL;

-- 4. 컬럼 순서 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 5. 테이블 구조 확인
SELECT * FROM user_profiles LIMIT 1;

