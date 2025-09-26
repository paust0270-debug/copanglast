-- 데이터베이스 문제 완전 해결 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. 기존 테이블 삭제 (충돌 방지)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 2. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. users 테이블 생성 (회원가입 기능용)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
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

-- 4. customers 테이블 생성 (슬롯 관리용)
CREATE TABLE customers (
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

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 6. 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
CREATE POLICY "Allow all operations for all users" ON users
  FOR ALL USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON customers
  FOR ALL USING (true)
  WITH CHECK (true);

-- 7. updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_keyword ON customers(keyword);
CREATE INDEX IF NOT EXISTS idx_customers_work_group ON customers(work_group);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- 10. 샘플 데이터 삽입
INSERT INTO customers (name, keyword, link_url, slot_count, memo, work_group, equipment_group, status) VALUES
('_PD_totebag', 'GB마트 여성가방 토트백', 'https://www.coupang.com/vp/products/8980761566', 5, 'GB마트 여성가방 토트백 숄더백 데일리 패션가방', '공통', '지정안함', '작동중'),
('_PD_handbag', '여성 핸드백 가방', 'https://www.coupang.com/vp/products/1234567890', 3, '고급스러운 여성 핸드백', 'VIP', '그룹A', '작동중')
ON CONFLICT DO NOTHING;

-- 11. 관리자 계정 생성
INSERT INTO users (username, password_hash, name, email, phone, grade, distributor, status) VALUES
('admin', 'YWRtaW4=', '관리자', 'admin@example.com', '010-1234-5678', '프리미엄회원', '관리자', 'active')
ON CONFLICT (username) DO NOTHING;

-- 12. 테이블 생성 확인
SELECT 
  'users' as table_name,
  COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
  'customers' as table_name,
  COUNT(*) as row_count
FROM customers;

-- 13. 스키마 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'customers')
ORDER BY table_name, ordinal_position;
