-- settlement_history 테이블 수정 스크립트 (표준화)
-- unsettled 페이지 기준 표준 필드명으로 통합

-- 1. 기존 settlement_history 테이블 백업 (데이터 보존)
CREATE TABLE IF NOT EXISTS settlement_history_backup AS SELECT * FROM settlement_history;

-- 2. 기존 settlement_history 테이블 삭제
DROP TABLE IF EXISTS settlement_history CASCADE;

-- 3. 표준 필드명으로 settlement_history 테이블 재생성
CREATE TABLE settlement_history (
  id SERIAL PRIMARY KEY,
  settlement_id BIGINT, -- 원본 정산 ID 참조
  sequential_number INTEGER NOT NULL, -- 순번
  category TEXT, -- 구분 (payment_type 기반)
  distributor_name TEXT NOT NULL, -- 총판명
  customer_id TEXT NOT NULL, -- 아이디
  customer_name TEXT, -- 고객명
  slot_addition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 슬롯추가일
  slot_type TEXT NOT NULL, -- 슬롯유형
  slot_count INTEGER NOT NULL DEFAULT 1, -- 슬롯수
  payer_name TEXT, -- 입금자명
  payment_amount INTEGER NOT NULL DEFAULT 0, -- 입금액
  usage_days INTEGER DEFAULT 0, -- 사용일수
  memo TEXT, -- 메모
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')), -- 상태
  
  -- 추가 필드들 (시스템용)
  payment_type TEXT, -- 결제 타입 (category 매핑용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 생성일시
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 완료일시
  settlement_batch_id TEXT, -- 정산 배치 ID
  original_settlement_item_id BIGINT -- 원본 settlement_items ID 참조
);

-- 4. 백업 데이터를 표준 필드명으로 복원 (백업 테이블이 존재하는 경우)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settlement_history_backup') THEN
        INSERT INTO settlement_history (
            id,
            settlement_id,
            sequential_number,
            category,
            distributor_name,
            customer_id,
            customer_name,
            slot_addition_date,
            slot_type,
            slot_count,
            payer_name,
            payment_amount,
            usage_days,
            memo,
            status,
            payment_type,
            created_at,
            completed_at,
            settlement_batch_id,
            original_settlement_item_id
        )
        SELECT 
            id,
            settlement_id,
            sequential_number,
            CASE 
                WHEN payment_type = 'extension' THEN '연장'
                WHEN payment_type = 'deposit' THEN '입금'
                ELSE '일반'
            END as category,
            distributor_name,
            customer_id,
            customer_name,
            COALESCE(created_at, NOW()) as slot_addition_date,
            slot_type,
            slot_count,
            payer_name,
            payment_amount,
            usage_days,
            memo,
            status,
            payment_type,
            created_at,
            completed_at,
            settlement_batch_id,
            original_settlement_item_id
        FROM settlement_history_backup
        ORDER BY id;
        
        RAISE NOTICE '백업 데이터가 성공적으로 복원되었습니다.';
    ELSE
        RAISE NOTICE '백업 테이블이 없습니다. 새로운 테이블만 생성되었습니다.';
    END IF;
END $$;

-- 5. 인덱스 생성
CREATE INDEX idx_settlement_history_customer_id ON settlement_history(customer_id);
CREATE INDEX idx_settlement_history_distributor ON settlement_history(distributor_name);
CREATE INDEX idx_settlement_history_completed_at ON settlement_history(completed_at);
CREATE INDEX idx_settlement_history_batch_id ON settlement_history(settlement_batch_id);
CREATE INDEX idx_settlement_history_settlement_id ON settlement_history(settlement_id);
CREATE INDEX idx_settlement_history_sequential_number ON settlement_history(sequential_number);
CREATE INDEX idx_settlement_history_category ON settlement_history(category);
CREATE INDEX idx_settlement_history_slot_addition_date ON settlement_history(slot_addition_date);

-- 6. 테이블 코멘트 (표준화)
COMMENT ON TABLE settlement_history IS '정산 완료 내역 히스토리 (표준화)';
COMMENT ON COLUMN settlement_history.settlement_id IS '원본 정산 ID';
COMMENT ON COLUMN settlement_history.sequential_number IS '순번';
COMMENT ON COLUMN settlement_history.category IS '구분 (연장/입금/일반)';
COMMENT ON COLUMN settlement_history.distributor_name IS '총판명';
COMMENT ON COLUMN settlement_history.customer_id IS '아이디';
COMMENT ON COLUMN settlement_history.customer_name IS '고객명';
COMMENT ON COLUMN settlement_history.slot_addition_date IS '슬롯추가일';
COMMENT ON COLUMN settlement_history.slot_type IS '슬롯유형';
COMMENT ON COLUMN settlement_history.slot_count IS '슬롯수';
COMMENT ON COLUMN settlement_history.payer_name IS '입금자명';
COMMENT ON COLUMN settlement_history.payment_amount IS '입금액';
COMMENT ON COLUMN settlement_history.usage_days IS '사용일수';
COMMENT ON COLUMN settlement_history.memo IS '메모';
COMMENT ON COLUMN settlement_history.status IS '상태 (completed, cancelled)';
COMMENT ON COLUMN settlement_history.payment_type IS '결제 타입 (category 매핑용)';
COMMENT ON COLUMN settlement_history.created_at IS '생성일시';
COMMENT ON COLUMN settlement_history.completed_at IS '완료일시';
COMMENT ON COLUMN settlement_history.settlement_batch_id IS '정산 배치 ID';
COMMENT ON COLUMN settlement_history.original_settlement_item_id IS '원본 settlement_items ID';

-- 7. 백업 테이블 삭제 (선택적)
-- DROP TABLE IF EXISTS settlement_history_backup;

-- 8. 테이블 생성 확인
SELECT 'settlement_history 테이블이 표준 필드명으로 성공적으로 재구성되었습니다.' as message;
SELECT COUNT(*) as restored_records FROM settlement_history;
