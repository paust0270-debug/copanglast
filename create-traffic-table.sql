-- traffic 테이블 생성 (keywords 테이블과 동일한 구조)
CREATE TABLE traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  customer_id UUID,
  slot_id UUID,
  slot_sequence INTEGER,
  current_rank TEXT DEFAULT '1 [0]',
  start_rank TEXT DEFAULT '1 [0]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_traffic_customer_id ON traffic(customer_id);
CREATE INDEX idx_traffic_slot_sequence ON traffic(slot_sequence);
CREATE INDEX idx_traffic_keyword ON traffic(keyword);
CREATE INDEX idx_traffic_link_url ON traffic(link_url);
CREATE INDEX idx_traffic_created_at ON traffic(created_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE traffic ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "traffic_select_policy" ON traffic
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능하도록 설정
CREATE POLICY "traffic_insert_policy" ON traffic
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능하도록 설정
CREATE POLICY "traffic_update_policy" ON traffic
  FOR UPDATE USING (true);

-- 모든 사용자가 삭제 가능하도록 설정
CREATE POLICY "traffic_delete_policy" ON traffic
  FOR DELETE USING (true);

