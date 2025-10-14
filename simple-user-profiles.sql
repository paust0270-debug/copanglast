-- 간단한 user_profiles 테이블 생성
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 테이블 삭제 (충돌 방지)
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. user_profiles 테이블 생성 (최소한의 구조)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원',
  distributor TEXT DEFAULT '일반',
  status TEXT DEFAULT 'pending',
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT
);

-- 3. RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. 모든 사용자 허용 정책
CREATE POLICY "Allow all operations" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 5. 캐시 갱신
SELECT pg_reload_conf();

-- 6. 테이블 확인
SELECT 'user_profiles created successfully' as status;
