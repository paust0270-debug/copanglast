-- 모든 정산 관련 데이터 완전 삭제 (최종 테스트용)
-- 정산내역, 정산대기, 미정산내역 모든 데이터 삭제

-- 1. settlement_history 테이블 모든 데이터 삭제 (정산내역)
DELETE FROM settlement_history;

-- 2. settlements 테이블 모든 데이터 삭제 (정산대기, 미정산내역)
DELETE FROM settlements;

-- 3. 시퀀스 초기화 (ID를 1부터 다시 시작)
ALTER SEQUENCE settlement_history_id_seq RESTART WITH 1;

-- 4. 확인용 카운트 조회
SELECT 
    'settlement_history' as table_name, 
    COUNT(*) as record_count 
FROM settlement_history
UNION ALL
SELECT 
    'settlements' as table_name, 
    COUNT(*) as record_count 
FROM settlements;

-- 완료 메시지
SELECT '모든 정산 데이터가 삭제되었습니다. 전체 플로우 테스트를 시작하세요!' as message;
