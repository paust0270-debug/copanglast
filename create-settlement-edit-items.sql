-- 정산 수정용 원본 데이터 저장 테이블 생성
-- 정산요청 시 선택된 원본 settlements 데이터를 저장하여 정산수정 시 정확한 데이터 조회 가능

CREATE TABLE IF NOT EXISTS settlement_edit_items (
    id SERIAL PRIMARY KEY,
    settlement_history_id INTEGER NOT NULL, -- settlement_history의 ID 참조
    original_settlement_id INTEGER NOT NULL, -- 원본 settlements의 ID
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    distributor_name TEXT,
    slot_type TEXT NOT NULL,
    slot_count INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    payer_name TEXT,
    payment_amount INTEGER NOT NULL,
    usage_days INTEGER,
    memo TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_settlement_edit_items_history_id ON settlement_edit_items(settlement_history_id);
CREATE INDEX IF NOT EXISTS idx_settlement_edit_items_original_id ON settlement_edit_items(original_settlement_id);

-- 테이블 코멘트 추가
COMMENT ON TABLE settlement_edit_items IS '정산 수정용 원본 데이터 저장 테이블';
COMMENT ON COLUMN settlement_edit_items.settlement_history_id IS 'settlement_history 테이블의 ID 참조';
COMMENT ON COLUMN settlement_edit_items.original_settlement_id IS '원본 settlements 테이블의 ID 참조';
