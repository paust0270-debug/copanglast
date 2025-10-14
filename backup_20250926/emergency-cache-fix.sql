-- 긴급 스키마 캐시 문제 해결
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 모든 캐시 강제 갱신
SELECT pg_reload_conf();

-- 2. 잠시 대기
SELECT pg_sleep(3);

-- 3. 다시 캐시 갱신
SELECT pg_reload_conf();

-- 4. 테이블 존재 확인
SELECT 
  table_name, 
  table_schema,
  table_type
FROM information_schema.tables 
WHERE table_name = 'user_profiles'
  AND table_schema = 'public';

-- 5. 테이블이 없다면 생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
  ) THEN
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
    
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Allow all operations" ON public.user_profiles
      FOR ALL USING (true) WITH CHECK (true);
      
    RAISE NOTICE 'user_profiles table created successfully';
  ELSE
    RAISE NOTICE 'user_profiles table already exists';
  END IF;
END $$;

-- 6. 최종 캐시 갱신
SELECT pg_reload_conf();

-- 7. 최종 확인
SELECT 'Emergency cache fix completed!' as status;
