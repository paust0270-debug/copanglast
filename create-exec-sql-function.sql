-- Supabase에서 사용할 수 있는 SQL 실행 함수 생성
-- 이 스크립트를 Supabase SQL Editor에서 먼저 실행하세요

-- 1. SQL 실행 함수 생성
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 함수 권한 설정
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- 3. 함수 생성 확인
SELECT 'exec_sql function created successfully' as status;




