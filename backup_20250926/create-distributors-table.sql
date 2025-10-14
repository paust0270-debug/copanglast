-- distributors 테이블 생성
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT '선택안함' CHECK (type IN ('본사', '선택안함')),
  sub_count INTEGER DEFAULT 0,
  manager VARCHAR(255),
  domain VARCHAR(255),
  ip VARCHAR(45),
  site_name VARCHAR(255),
  menu_abbr VARCHAR(10),
  default_days INTEGER NOT NULL DEFAULT 30,
  coupon_days INTEGER NOT NULL DEFAULT 7,
  member_count INTEGER DEFAULT 0,
  memo TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_distributors_name ON distributors(name);
CREATE INDEX IF NOT EXISTS idx_distributors_type ON distributors(type);
CREATE INDEX IF NOT EXISTS idx_distributors_status ON distributors(status);
CREATE INDEX IF NOT EXISTS idx_distributors_created_at ON distributors(created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;

-- 기본 정책 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Allow all operations for distributors" ON distributors
  FOR ALL USING (true);

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_distributors_updated_at
  BEFORE UPDATE ON distributors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (선택사항)
INSERT INTO distributors (name, type, domain, ip, site_name, menu_abbr, default_days, coupon_days, memo, status)
VALUES 
  ('쿠팡본사', '본사', 'coupang.com', '192.168.1.100', '쿠팡랭킹체커', 'CP', 30, 7, '쿠팡 본사 계정', 'active'),
  ('네이버파트너', '선택안함', 'naver.com', '192.168.1.101', '네이버랭킹체커', 'NV', 15, 3, '네이버 파트너 계정', 'active')
ON CONFLICT (id) DO NOTHING;
