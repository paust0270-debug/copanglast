-- Supabase Auth 충돌 문제 해결 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 잘못 만든 public.users 테이블 삭제 (충돌 방지)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. customers 테이블만 생성 (Auth는 Supabase가 자동 관리)
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  slot_count INTEGER DEFAULT 1,
  memo TEXT,
  work_group TEXT DEFAULT '공통',
  equipment_group TEXT DEFAULT '지정안함',
  current_rank TEXT DEFAULT '1 [0]',
  start_rank TEXT DEFAULT '1 [0]',
  traffic TEXT DEFAULT '0 (0/0)',
  remaining_days TEXT DEFAULT '30일',
  registration_date TEXT,
  status TEXT DEFAULT '작동중',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. user_profiles 테이블 생성 (추가 사용자 정보용)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. 정책 설정 (개발용 - 모든 사용자 허용)
CREATE POLICY "Allow all operations for all users" ON customers
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);

-- 7. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 트리거 생성
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON user_profiles(grade);

CREATE INDEX IF NOT EXISTS idx_customers_keyword ON customers(keyword);
CREATE INDEX IF NOT EXISTS idx_customers_work_group ON customers(work_group);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 10. 샘플 데이터 삽입
INSERT INTO customers (name, keyword, link_url, slot_count, memo, work_group, equipment_group, status) VALUES
('_PD_totebag', 'GB마트 여성가방 토트백', 'https://www.coupang.com/vp/products/8980761566', 5, 'GB마트 여성가방 토트백 숄더백 데일리 패션가방', '공통', '지정안함', '작동중'),
('_PD_handbag', '여성 핸드백 가방', 'https://www.coupang.com/vp/products/1234567890', 3, '고급스러운 여성 핸드백', 'VIP', '그룹A', '작동중')
ON CONFLICT DO NOTHING;

-- 11. 스키마 캐시 갱신
SELECT pg_reload_conf();

-- 12. 테이블 생성 확인
SELECT 
  'customers' as table_name,
  COUNT(*) as row_count
FROM customers
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles;

-- 13. auth.users 테이블 확인 (Supabase Auth용)
SELECT 
  'auth.users' as table_name,
  COUNT(*) as row_count
FROM auth.users;

-- 14. 최종 스키마 확인
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('customers', 'user_profiles')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
