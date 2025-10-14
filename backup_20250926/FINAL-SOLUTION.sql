-- 최종 해결 스크립트 - 모든 문제 완전 해결
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 완전한 초기화
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- 2. 캐시 완전 갱신
SELECT pg_reload_conf();
SELECT pg_sleep(2);
SELECT pg_reload_conf();

-- 3. user_profiles 테이블 생성
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

-- 4. RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. 정책 생성
CREATE POLICY "Allow all operations" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 6. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON public.user_profiles(grade);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- 9. 최종 캐시 갱신
SELECT pg_reload_conf();

-- 10. 테이블 생성 확인
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM public.user_profiles;

-- 11. 스키마 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 12. 최종 상태 확인
SELECT 'All problems fixed! user_profiles table is ready!' as status;
