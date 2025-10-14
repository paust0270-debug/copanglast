-- 간단한 customers 테이블 스키마
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS customers CASCADE;

-- customers 테이블 생성
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 비활성화 (개발용)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입
INSERT INTO customers (name, keyword, link_url, slot_count, memo, work_group, equipment_group, status) VALUES
('_PD_totebag', 'GB마트 여성가방 토트백', 'https://www.coupang.com/vp/products/8980761566', 5, 'GB마트 여성가방 토트백 숄더백 데일리 패션가방', '공통', '지정안함', '작동중'),
('_PD_handbag', '여성 핸드백 가방', 'https://www.coupang.com/vp/products/1234567890', 3, '고급스러운 여성 핸드백', 'VIP', '그룹A', '작동중');

-- 인덱스 생성
CREATE INDEX idx_customers_keyword ON customers(keyword);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- 테이블 생성 확인
SELECT 'customers 테이블이 성공적으로 생성되었습니다.' as result;

