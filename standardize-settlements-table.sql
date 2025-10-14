-- settlements 테이블 표준화 스크립트
-- unsettled 페이지 기준 표준 필드명으로 통합

-- 0. 기존 테이블 구조 확인 (실행 전 확인용)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'settlements' ORDER BY ordinal_position;

-- 1. 기존 settlements 테이블 백업 (데이터 보존)
DO $$
BEGIN
    -- settlements 테이블이 존재하는지 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settlements') THEN
        -- 백업 테이블이 이미 있으면 삭제하고 새로 생성
        DROP TABLE IF EXISTS settlements_backup;
        CREATE TABLE settlements_backup AS SELECT * FROM settlements;
        RAISE NOTICE 'settlements 테이블이 settlements_backup으로 백업되었습니다.';
    ELSE
        RAISE NOTICE 'settlements 테이블이 존재하지 않습니다. 새로 생성합니다.';
    END IF;
END $$;

-- 2. 기존 settlements 테이블 삭제
DROP TABLE IF EXISTS settlements CASCADE;

-- 3. 표준 필드명으로 settlements 테이블 재생성
CREATE TABLE settlements (
  id SERIAL PRIMARY KEY,
  sequential_number INTEGER, -- 순번
  category TEXT, -- 구분 (payment_type 기반)
  distributor_name TEXT NOT NULL DEFAULT '총판A', -- 총판명
  customer_id TEXT NOT NULL, -- 아이디
  customer_name TEXT, -- 고객명 (legacy)
  slot_addition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 슬롯추가일 (기존 created_at)
  slot_type TEXT NOT NULL, -- 슬롯유형
  slot_count INTEGER NOT NULL DEFAULT 1, -- 슬롯수
  payer_name TEXT, -- 입금자명
  payment_amount INTEGER DEFAULT 0, -- 입금액
  usage_days INTEGER DEFAULT 0, -- 사용일수
  memo TEXT, -- 메모
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'approved', 'completed', 'cancelled')), -- 상태
  
  -- 추가 필드들 (호환성 및 시스템용)
  payment_type TEXT, -- 결제 타입 (category 매핑용)
  payment_date DATE, -- 결제일 (legacy)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 생성일시
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- 수정일시
);

-- 4. 백업 데이터를 표준 필드명으로 복원 (기본값 사용)
-- 주의: 이 스크립트는 기존 테이블 구조에 따라 수정이 필요할 수 있습니다
-- 실행 전에 settlements_backup 테이블의 컬럼을 확인하세요:
-- SELECT * FROM information_schema.columns WHERE table_name = 'settlements_backup';

DO $$
DECLARE
    backup_count INTEGER := 0;
BEGIN
    -- 백업 테이블이 존재하는지 확인
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settlements_backup') THEN
        SELECT COUNT(*) INTO backup_count FROM settlements_backup;
        RAISE NOTICE '백업 테이블에서 % 개의 레코드를 복원합니다.', backup_count;
        
        -- 기본 필드만 사용하여 데이터 복원 (에러 방지)
        EXECUTE format('
            INSERT INTO settlements (
                customer_id,
                slot_type,
                slot_count,
                payment_amount,
                usage_days,
                memo,
                status,
                payment_type,
                sequential_number,
                category,
                distributor_name,
                slot_addition_date,
                payer_name,
                created_at,
                updated_at
            )
            SELECT 
                COALESCE(customer_id, ''unknown'') as customer_id,
                COALESCE(slot_type, ''default'') as slot_type,
                COALESCE(slot_count, 1) as slot_count,
                COALESCE(payment_amount, 0) as payment_amount,
                COALESCE(usage_days, 0) as usage_days,
                COALESCE(memo, '''') as memo,
                COALESCE(status, ''pending'') as status,
                COALESCE(payment_type, ''deposit'') as payment_type,
                ROW_NUMBER() OVER (ORDER BY COALESCE(created_at, NOW())) as sequential_number,
                CASE 
                    WHEN COALESCE(payment_type, '''') = ''extension'' THEN ''연장''
                    WHEN COALESCE(payment_type, '''') = ''deposit'' THEN ''입금''
                    ELSE ''일반''
                END as category,
                ''총판A'' as distributor_name,
                COALESCE(created_at, NOW()) as slot_addition_date,
                COALESCE(payer_name, '''') as payer_name,
                COALESCE(created_at, NOW()) as created_at,
                COALESCE(updated_at, created_at, NOW()) as updated_at
            FROM settlements_backup
            ORDER BY COALESCE(created_at, NOW())
        ');
        
        RAISE NOTICE '데이터 복원이 완료되었습니다.';
    ELSE
        RAISE NOTICE '백업 테이블이 없습니다. 빈 테이블로 시작합니다.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '데이터 복원 중 오류 발생: %', SQLERRM;
        RAISE NOTICE '수동으로 데이터를 확인하고 복원하세요.';
END $$;

-- 5. 인덱스 생성
CREATE INDEX idx_settlements_customer_id ON settlements(customer_id);
CREATE INDEX idx_settlements_distributor ON settlements(distributor_name);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_slot_addition_date ON settlements(slot_addition_date);
CREATE INDEX idx_settlements_category ON settlements(category);
CREATE INDEX idx_settlements_payment_type ON settlements(payment_type);

-- 6. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 트리거 생성
CREATE TRIGGER update_settlements_updated_at 
    BEFORE UPDATE ON settlements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. 테이블 코멘트
COMMENT ON TABLE settlements IS '정산 요청 및 미정산 내역 (표준화)';
COMMENT ON COLUMN settlements.sequential_number IS '순번';
COMMENT ON COLUMN settlements.category IS '구분 (연장/입금/일반)';
COMMENT ON COLUMN settlements.distributor_name IS '총판명';
COMMENT ON COLUMN settlements.customer_id IS '아이디';
COMMENT ON COLUMN settlements.customer_name IS '고객명 (legacy)';
COMMENT ON COLUMN settlements.slot_addition_date IS '슬롯추가일';
COMMENT ON COLUMN settlements.slot_type IS '슬롯유형';
COMMENT ON COLUMN settlements.slot_count IS '슬롯수';
COMMENT ON COLUMN settlements.payer_name IS '입금자명';
COMMENT ON COLUMN settlements.payment_amount IS '입금액';
COMMENT ON COLUMN settlements.usage_days IS '사용일수';
COMMENT ON COLUMN settlements.memo IS '메모';
COMMENT ON COLUMN settlements.status IS '상태';
COMMENT ON COLUMN settlements.payment_type IS '결제 타입 (category 매핑용)';
COMMENT ON COLUMN settlements.payment_date IS '결제일 (legacy)';
COMMENT ON COLUMN settlements.created_at IS '생성일시';
COMMENT ON COLUMN settlements.updated_at IS '수정일시';

-- 9. 백업 테이블 삭제 (선택적)
-- DROP TABLE IF EXISTS settlements_backup;

-- 10. 수동 데이터 복원 스크립트 (위 자동 복원이 실패한 경우 사용)
/*
-- 기존 테이블 구조 확인
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'settlements_backup' ORDER BY ordinal_position;

-- 수동 데이터 복원 예시 (필요한 컬럼만 선택)
INSERT INTO settlements (customer_id, slot_type, status, created_at, distributor_name, category, sequential_number, slot_addition_date)
SELECT 
    customer_id,
    slot_type,
    COALESCE(status, 'pending'),
    COALESCE(created_at, NOW()),
    '총판A' as distributor_name,
    '일반' as category,
    ROW_NUMBER() OVER (ORDER BY created_at) as sequential_number,
    COALESCE(created_at, NOW()) as slot_addition_date
FROM settlements_backup;
*/

-- 11. 테이블 생성 확인
SELECT 'settlements 테이블이 표준 필드명으로 성공적으로 재구성되었습니다.' as message;
SELECT COUNT(*) as restored_records FROM settlements;

-- 12. 새 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settlements' 
ORDER BY ordinal_position;
