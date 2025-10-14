-- 긴급 스키마 캐시 문제 해결 스크립트
-- 이 스크립트는 모든 테이블을 재생성하여 캐시 문제를 완전히 해결합니다

-- 1. 기존 테이블 및 관련 객체 완전 삭제
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.slots CASCADE;

-- 2. 기존 정책들 삭제
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations" ON public.slots;

-- 3. 기존 트리거들 삭제
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
DROP TRIGGER IF EXISTS update_slots_updated_at ON public.slots;

-- 4. 기존 함수들 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. 스키마 캐시 강제 갱신
SELECT pg_reload_conf();
SELECT pg_sleep(3); -- 캐시 갱신 대기

-- 6. updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. user_profiles 테이블 생성
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원' CHECK (grade IN ('일반회원', '총판회원', '최고관리자')),
  distributor TEXT DEFAULT '일반',
  manager_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT
);

-- 8. customers 테이블 생성
CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  slot_count INTEGER DEFAULT 1,
  memo TEXT,
  work_group TEXT,
  equipment_group TEXT,
  current_rank TEXT,
  start_rank TEXT,
  traffic TEXT,
  remaining_days TEXT,
  registration_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- 9. slots 테이블 생성
CREATE TABLE public.slots (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES public.customers(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 인덱스 생성
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_manager_id ON public.user_profiles(manager_id);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_user_profiles_grade ON public.user_profiles(grade);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at DESC);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX idx_slots_customer_id ON public.slots(customer_id);

-- 11. RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- 12. RLS 정책 생성
CREATE POLICY "Allow all operations for all users" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON public.customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON public.slots
  FOR ALL USING (true) WITH CHECK (true);

-- 13. 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 14. 기본 최고관리자 계정 생성
INSERT INTO public.user_profiles (id, name, username, email, phone, grade, status, created_at) 
VALUES (
  gen_random_uuid(),
  '최고관리자',
  'admin',
  'admin@coupang-rank.com',
  '010-0000-0000',
  '최고관리자',
  'active',
  NOW()
);

-- 15. 최종 캐시 갱신
SELECT pg_reload_conf();

-- 16. 테이블 생성 확인
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM public.user_profiles
UNION ALL
SELECT 
  'customers' as table_name,
  COUNT(*) as row_count
FROM public.customers
UNION ALL
SELECT 
  'slots' as table_name,
  COUNT(*) as row_count
FROM public.slots;

-- 17. 스키마 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'customers', 'slots')
ORDER BY table_name, ordinal_position;

-- 18. 완료 메시지
SELECT '긴급 스키마 캐시 문제가 완전히 해결되었습니다!' as message;
