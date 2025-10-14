-- Supabase 함수 생성 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 스키마 정보 조회 함수
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.table_name::TEXT,
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name IN ('user_profiles', 'customers', 'slots')
  ORDER BY c.table_name, c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 스키마 캐시 갱신 함수
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS TEXT AS $$
BEGIN
  -- 스키마 캐시 강제 갱신
  PERFORM pg_reload_conf();
  
  -- 각 테이블에 접근하여 스키마 갱신 강제
  PERFORM COUNT(*) FROM public.user_profiles LIMIT 1;
  PERFORM COUNT(*) FROM public.customers LIMIT 1;
  PERFORM COUNT(*) FROM public.slots LIMIT 1;
  
  -- 메타데이터 쿼리로 스키마 캐시 갱신
  PERFORM schemaname, tablename FROM pg_tables WHERE schemaname = 'public';
  
  RETURN '스키마 캐시 갱신 완료';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 테이블 존재 확인 함수
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS 정책 확인 함수
CREATE OR REPLACE FUNCTION check_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  permissive BOOLEAN,
  roles TEXT[],
  cmd TEXT,
  qual TEXT,
  with_check TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.permissive,
    p.roles,
    p.cmd::TEXT,
    p.qual::TEXT,
    p.with_check::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 스키마 문제 진단 함수
CREATE OR REPLACE FUNCTION diagnose_schema_issues()
RETURNS TABLE (
  issue_type TEXT,
  description TEXT,
  severity TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- 테이블 존재 확인
  IF NOT check_table_exists('slots') THEN
    RETURN QUERY SELECT 
      'Missing Table'::TEXT,
      'slots 테이블이 존재하지 않습니다'::TEXT,
      'CRITICAL'::TEXT,
      'fix-slots-table.sql을 실행하세요'::TEXT;
  END IF;
  
  IF NOT check_table_exists('user_profiles') THEN
    RETURN QUERY SELECT 
      'Missing Table'::TEXT,
      'user_profiles 테이블이 존재하지 않습니다'::TEXT,
      'CRITICAL'::TEXT,
      'supabase-schema.sql을 실행하세요'::TEXT;
  END IF;
  
  IF NOT check_table_exists('customers') THEN
    RETURN QUERY SELECT 
      'Missing Table'::TEXT,
      'customers 테이블이 존재하지 않습니다'::TEXT,
      'CRITICAL'::TEXT,
      'supabase-schema.sql을 실행하세요'::TEXT;
  END IF;
  
  -- RLS 정책 확인
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'slots') THEN
    RETURN QUERY SELECT 
      'Missing RLS Policy'::TEXT,
      'slots 테이블에 RLS 정책이 없습니다'::TEXT,
      'HIGH'::TEXT,
      'RLS 정책을 생성하세요'::TEXT;
  END IF;
  
  -- 정상 상태
  IF check_table_exists('slots') AND check_table_exists('user_profiles') AND check_table_exists('customers') THEN
    RETURN QUERY SELECT 
      'OK'::TEXT,
      '모든 스키마가 정상입니다'::TEXT,
      'LOW'::TEXT,
      '추가 조치가 필요하지 않습니다'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 함수 테스트
SELECT '스키마 정보 조회 함수 테스트' as test;
SELECT * FROM get_schema_info() LIMIT 5;

SELECT '스키마 캐시 갱신 함수 테스트' as test;
SELECT refresh_schema_cache();

SELECT '테이블 존재 확인 함수 테스트' as test;
SELECT check_table_exists('slots') as slots_exists;
SELECT check_table_exists('user_profiles') as user_profiles_exists;
SELECT check_table_exists('customers') as customers_exists;

SELECT 'RLS 정책 확인 함수 테스트' as test;
SELECT * FROM check_rls_policies();

SELECT '스키마 문제 진단 함수 테스트' as test;
SELECT * FROM diagnose_schema_issues();

-- 7. 완료 메시지
SELECT 'Supabase 함수들이 성공적으로 생성되었습니다!' as message;
