-- 기존 오래된 settlements 데이터 삭제 (최근 데이터만 남기기)

-- 1. 최근 2개 데이터만 남기고 나머지 삭제
-- (created_at 기준으로 최신 2개만 유지)
DELETE FROM settlements 
WHERE id NOT IN (
  SELECT id FROM (
    SELECT id 
    FROM settlements 
    ORDER BY created_at DESC 
    LIMIT 2
  ) AS recent_settlements
);

-- 2. 확인용 쿼리
SELECT 'settlements 총 데이터 수:' as description, COUNT(*) as count FROM settlements
UNION ALL
SELECT 'settlements pending 상태:' as description, COUNT(*) as count FROM settlements WHERE status = 'pending';
