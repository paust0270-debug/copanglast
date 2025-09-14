-- settlements 테이블의 status 제약조건에 'history' 상태 추가
-- 정산 완료된 데이터를 삭제하지 않고 상태로 관리하기 위함

-- 기존 제약조건 삭제
ALTER TABLE settlements DROP CONSTRAINT IF EXISTS settlements_status_check;

-- 새로운 제약조건 추가 ('history' 상태 포함)
ALTER TABLE settlements ADD CONSTRAINT settlements_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'modified', 'history'));

-- 상태별 설명
-- pending: 미정산 (슬롯 연장/추가 직후)
-- completed: 정산대기 (정산요청 완료, 정산대기 페이지에 표시)
-- history: 정산완료 (정산내역으로 이동, 수정 시에만 참조)
-- cancelled: 취소
-- modified: 수정됨

COMMENT ON COLUMN settlements.status IS '정산 상태 (pending: 미정산, completed: 정산대기, history: 정산완료, cancelled: 취소, modified: 수정됨)';


