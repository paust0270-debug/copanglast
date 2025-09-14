-- settlement_history 테이블의 모든 데이터 삭제 (테스트 준비)
-- 주의: 이 작업은 되돌릴 수 없습니다.

-- 현재 데이터 개수 확인
SELECT COUNT(*) as current_count FROM settlement_history;

-- 모든 데이터 삭제
DELETE FROM settlement_history;

-- 삭제 후 확인
SELECT COUNT(*) as remaining_count FROM settlement_history;

-- 성공 메시지
SELECT '정산 내역 데이터가 모두 삭제되었습니다. 테스트를 시작할 수 있습니다!' as message;

