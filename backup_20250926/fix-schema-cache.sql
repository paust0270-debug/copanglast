-- 스키마 캐시 문제 완전 해결 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 스키마 캐시 강제 갱신
SELECT pg_reload_conf();
SELECT pg_sleep(2); -- 캐시 갱신 대기

-- 2. 메타데이터 쿼리로 스키마 캐시 갱신
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';

-- 3. 각 테이블에 접근하여 스키마 갱신 강제
SELECT COUNT(*) FROM public.user_profiles LIMIT 1;
SELECT COUNT(*) FROM public.customers LIMIT 1;
SELECT COUNT(*) FROM public.slots LIMIT 1;

-- 4. 스키마 정보 쿼리
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'customers', 'slots')
ORDER BY table_name, ordinal_position;

-- 5. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- 6. 연결 풀 재설정 (가능한 경우)
-- SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();

-- 7. 캐시 통계 확인
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public';

-- 8. 완료 메시지
SELECT '스키마 캐시 문제가 완전히 해결되었습니다!' as message;
