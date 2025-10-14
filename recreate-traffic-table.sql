-- traffic 테이블을 keywords 테이블과 동일한 구조로 재생성

-- 1. 기존 traffic 테이블 삭제
DROP TABLE IF EXISTS traffic;

-- 2. keywords 테이블과 동일한 구조로 traffic 테이블 생성
CREATE TABLE traffic (
  id SERIAL PRIMARY KEY,
  slot_type VARCHAR(50) DEFAULT '쿠팡',
  keyword VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  current_rank INTEGER DEFAULT 1,
  last_check_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  slot_count INTEGER DEFAULT 1,
  slot_sequence INTEGER,
  customer_id VARCHAR(255),
  slot_id BIGINT
);

-- 3. 인덱스 추가 (keywords 테이블과 동일하게)
CREATE INDEX IF NOT EXISTS idx_traffic_customer_id ON traffic(customer_id);
CREATE INDEX IF NOT EXISTS idx_traffic_slot_sequence ON traffic(slot_sequence);
CREATE INDEX IF NOT EXISTS idx_traffic_keyword ON traffic(keyword);
CREATE INDEX IF NOT EXISTS idx_traffic_created_at ON traffic(created_at);

-- 4. 기존 keywords 데이터를 traffic 테이블로 복사
INSERT INTO traffic (
  slot_type, keyword, link_url, current_rank, last_check_date, 
  created_at, updated_at, slot_count, slot_sequence, customer_id, slot_id
)
SELECT 
  slot_type, keyword, link_url, current_rank, last_check_date,
  created_at, updated_at, slot_count, slot_sequence, customer_id, slot_id
FROM keywords
ORDER BY id;

-- 5. 시퀀스 설정 (keywords 테이블의 최대 ID + 1부터 시작)
SELECT setval('traffic_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM keywords), false);

