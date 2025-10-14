-- 정산 관련 모든 데이터 초기화 (처음부터 테스트용)

-- 1. settlement_history 테이블 완전 삭제
DELETE FROM settlement_history;

-- 2. settlements 테이블의 모든 상태를 'pending'으로 초기화 (미정산 상태)
-- 이렇게 하면 미정산 페이지에서 모든 데이터가 다시 보이게 됨
UPDATE settlements 
SET status = 'pending', 
    updated_at = NOW()
WHERE status IN ('completed', 'history');

-- 3. 확인용 쿼리
SELECT 'settlement_history 테이블 데이터 수:' as description, COUNT(*) as count FROM settlement_history
UNION ALL
SELECT 'settlements pending 상태 (미정산):' as description, COUNT(*) as count FROM settlements WHERE status = 'pending'
UNION ALL
SELECT 'settlements completed 상태 (정산대기):' as description, COUNT(*) as count FROM settlements WHERE status = 'completed'
UNION ALL  
SELECT 'settlements history 상태 (정산완료):' as description, COUNT(*) as count FROM settlements WHERE status = 'history';
