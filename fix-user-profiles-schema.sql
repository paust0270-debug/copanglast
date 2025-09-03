-- user_profiles 테이블에 username 컬럼 추가 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. username 컬럼이 존재하는지 확인하고 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'username 컬럼이 user_profiles 테이블에 추가되었습니다.';
    ELSE
        RAISE NOTICE 'username 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 2. username 컬럼을 NOT NULL로 변경 (기존 데이터가 있는 경우 주의)
-- 기존 데이터가 있다면 먼저 기본값을 설정해야 합니다
UPDATE user_profiles 
SET username = 'user_' || id::text 
WHERE username IS NULL;

-- 3. username 컬럼을 NOT NULL로 설정
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

-- 4. username 컬럼에 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- 5. 기존 데이터 확인
SELECT id, username, name, created_at FROM user_profiles LIMIT 5;

-- 6. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

