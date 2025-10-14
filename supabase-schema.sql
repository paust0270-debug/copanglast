-- Supabase 데이터베이스 스키마
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- users 테이블 생성 (회원가입 기능용)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원' CHECK (grade IN ('일반회원', '총판회원', '최고관리자')),
  distributor TEXT DEFAULT '일반',
  manager_id UUID REFERENCES users(id), -- 실제 관리자 ID 참조
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT -- 승인/거부 처리한 관리자 ID
);

-- user_profiles 테이블도 동일하게 업데이트 (기존 구조와 호환성 유지)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL, -- username 컬럼 추가
  password TEXT, -- 비밀번호 컬럼 추가
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원' CHECK (grade IN ('일반회원', '총판회원', '최고관리자')),
  distributor TEXT DEFAULT '일반',
  manager_id UUID REFERENCES user_profiles(id), -- 실제 관리자 ID 참조
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT -- 승인/거부 처리한 관리자 ID
);

-- customers 테이블 생성
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

-- slots 테이블 생성 (슬롯 관리용)
CREATE TABLE IF NOT EXISTS slots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id TEXT NOT NULL, -- username으로 고객 식별
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('coupang', 'coupang-vip', 'coupang-app', 'naver-shopping', 'place', 'today-house', 'aliexpress')),
  slot_count INTEGER NOT NULL DEFAULT 1,
  payment_type TEXT CHECK (payment_type IN ('deposit', 'coupon')),
  payer_name TEXT,
  payment_amount INTEGER,
  payment_date DATE,
  usage_days INTEGER,
  memo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
CREATE POLICY "Allow all operations for all users" ON users
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON customers
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON slots
  FOR ALL USING (true)
  WITH CHECK (true);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON user_profiles(grade);
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager_id ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_keyword ON customers(keyword);
CREATE INDEX IF NOT EXISTS idx_customers_work_group ON customers(work_group);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_slots_customer_id ON slots(customer_id);
CREATE INDEX IF NOT EXISTS idx_slots_slot_type ON slots(slot_type);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_created_at ON slots(created_at DESC);

-- 기본 최고관리자 계정 생성
INSERT INTO user_profiles (id, username, name, email, phone, grade, status, created_at) 
SELECT 
  gen_random_uuid(),
  'admin',
  '최고관리자',
  'admin@example.com',
  '010-0000-0000',
  '최고관리자',
  'active',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE grade = '최고관리자'
);

-- 기존 테이블에 password 컬럼 추가 (기존 데이터 마이그레이션)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 기존 users 테이블의 grade 컬럼 업데이트 (데이터 마이그레이션)
UPDATE users SET grade = '일반회원' WHERE grade NOT IN ('일반회원', '총판회원', '최고관리자');
UPDATE user_profiles SET grade = '일반회원' WHERE grade NOT IN ('일반회원', '총판회원', '최고관리자');

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO customers (name, keyword, link_url, slot_count, memo, work_group, equipment_group, status) VALUES
('_PD_totebag', 'GB마트 여성가방 토트백', 'https://www.coupang.com/vp/products/8980761566', 5, 'GB마트 여성가방 토트백 숄더백 데일리 패션가방', '공통', '지정안함', '작동중'),
('_PD_handbag', '여성 핸드백 가방', 'https://www.coupang.com/vp/products/1234567890', 3, '고급스러운 여성 핸드백', 'VIP', '그룹A', '작동중')
ON CONFLICT DO NOTHING;
