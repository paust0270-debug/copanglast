-- user_profiles 테이블에 password 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- username 컬럼도 추가 (없는 경우)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 기존 데이터에 기본값 설정
UPDATE user_profiles SET password = NULL WHERE password IS NULL;
UPDATE user_profiles SET username = name WHERE username IS NULL;

-- 컬럼 순서 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

