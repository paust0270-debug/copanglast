# 슬롯 추가 실패 문제 해결 가이드

## 문제 설명
"슬롯 추가 실패: 슬롯 추가 중 오류가 발생했습니다: Could not find the table 'public.slots' in the schema cache"

이 오류는 Supabase의 스키마 캐시에서 `public.slots` 테이블을 찾을 수 없다는 문제입니다.

## 해결 방법 (단계별)

### 1단계: 올바른 slots 테이블 생성

**Supabase SQL Editor에서 실행:**

```sql
-- 1. 기존 slots 테이블 삭제 (데이터 손실 주의)
DROP TABLE IF EXISTS public.slots CASCADE;

-- 2. 올바른 slots 테이블 생성
CREATE TABLE public.slots (
  id SERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL, -- 고객 ID (username)
  customer_name TEXT NOT NULL, -- 고객명
  slot_type TEXT NOT NULL, -- 슬롯 유형 (coupang, coupang-vip, coupang-app, naver-shopping, place, today-house, aliexpress)
  slot_count INTEGER NOT NULL DEFAULT 1, -- 슬롯 개수
  payment_type TEXT, -- 입금 구분 (deposit, coupon)
  payer_name TEXT, -- 입금자명
  payment_amount INTEGER, -- 입금액
  payment_date TEXT, -- 입금일자
  usage_days INTEGER, -- 사용일수
  memo TEXT, -- 메모
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_slots_customer_id ON public.slots(customer_id);
CREATE INDEX idx_slots_slot_type ON public.slots(slot_type);
CREATE INDEX idx_slots_status ON public.slots(status);
CREATE INDEX idx_slots_created_at ON public.slots(created_at DESC);

-- 4. RLS 활성화
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
CREATE POLICY "Allow all operations for all users" ON public.slots
  FOR ALL USING (true) WITH CHECK (true);

-- 6. updated_at 자동 업데이트 트리거
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2단계: 스키마 캐시 강제 갱신

**Supabase SQL Editor에서 실행:**

```sql
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

-- 6. 캐시 통계 확인
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
```

### 3단계: 개발 서버 재시작

```bash
# 개발 서버 중지 (Ctrl+C)
# 개발 서버 재시작
npm run dev
```

### 4단계: 브라우저 캐시 삭제

1. 브라우저에서 `Ctrl+Shift+R` (강력 새로고침)
2. 또는 개발자 도구 → Application → Storage → Clear storage

### 5단계: 테스트

1. 고객관리 페이지에서 "슬롯추가" 버튼 클릭
2. 슬롯 정보 입력 후 "추가" 버튼 클릭
3. 성공 메시지 확인

## 추가 문제 해결

### 만약 여전히 문제가 발생한다면:

1. **Supabase 대시보드 확인:**
   - Database → Tables에서 `slots` 테이블이 존재하는지 확인
   - Authentication → Policies에서 RLS 정책이 설정되어 있는지 확인

2. **환경변수 확인:**
   - `.env.local` 파일에서 Supabase URL과 API Key가 올바른지 확인

3. **네트워크 연결 확인:**
   - 브라우저 개발자 도구 → Network 탭에서 API 요청이 성공하는지 확인

4. **로그 확인:**
   - 브라우저 콘솔에서 오류 메시지 확인
   - Supabase 대시보드 → Logs에서 서버 오류 확인

## 예방 방법

1. **정기적인 스키마 캐시 갱신:**
   - 주기적으로 `fix-schema-cache.sql` 실행

2. **개발 환경 관리:**
   - 개발 서버 재시작 시 브라우저 캐시 삭제
   - 환경변수 변경 시 서버 재시작

3. **모니터링:**
   - Supabase 대시보드에서 테이블 상태 모니터링
   - 애플리케이션 로그에서 오류 패턴 확인

## 완료 확인

모든 단계를 완료한 후 다음을 확인하세요:

✅ `slots` 테이블이 올바른 구조로 생성됨  
✅ 스키마 캐시가 갱신됨  
✅ RLS 정책이 설정됨  
✅ 슬롯 추가 기능이 정상 작동함  

문제가 해결되었습니다! 🎉
