-- 순위 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS rank_history (
  id SERIAL PRIMARY KEY,
  slot_status_id INTEGER,
  keyword VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  current_rank INTEGER,
  start_rank INTEGER,
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_rank_history_slot_status_id ON rank_history(slot_status_id);
CREATE INDEX IF NOT EXISTS idx_rank_history_keyword ON rank_history(keyword);
CREATE INDEX IF NOT EXISTS idx_rank_history_check_date ON rank_history(check_date);

-- 테이블 코멘트 추가
COMMENT ON TABLE rank_history IS '슬롯 순위 체크 히스토리';
COMMENT ON COLUMN rank_history.slot_status_id IS 'slot_status 테이블 참조 ID';
COMMENT ON COLUMN rank_history.keyword IS '검색 키워드';
COMMENT ON COLUMN rank_history.link_url IS '상품 링크 URL';
COMMENT ON COLUMN rank_history.current_rank IS '현재 순위';
COMMENT ON COLUMN rank_history.start_rank IS '시작 순위';
COMMENT ON COLUMN rank_history.check_date IS '순위 체크 날짜';














