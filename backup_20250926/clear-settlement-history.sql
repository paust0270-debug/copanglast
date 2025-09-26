-- 정산내역 테스트를 위해 기존 데이터 삭제
-- settlement_history 테이블의 모든 데이터 삭제

DELETE FROM settlement_history;

-- settlements 테이블에서 status='history'인 데이터를 'completed'로 되돌리기
-- 이렇게 하면 정산대기 페이지에서 다시 보이게 됨
UPDATE settlements 
SET status = 'completed', 
    updated_at = NOW()
WHERE status = 'history';

-- 확인용 쿼리
SELECT 'settlement_history 테이블 데이터 수:' as description, COUNT(*) as count FROM settlement_history
UNION ALL
SELECT 'settlements completed 상태 데이터 수:' as description, COUNT(*) as count FROM settlements WHERE status = 'completed'
UNION ALL  
SELECT 'settlements history 상태 데이터 수:' as description, COUNT(*) as count FROM settlements WHERE status = 'history';