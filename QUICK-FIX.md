# 🚨 긴급 해결 가이드 - user_profiles 테이블 오류

## 📋 현재 문제
```
프로필 정보 저장에 실패했습니다: Could not find the table 'public.user_profiles' in the schema cache
```

## ✅ 즉시 해결 방법

### 1단계: Supabase SQL Editor에서 실행

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 해당 프로젝트 선택
3. **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 다음 코드를 **복사하여 실행**:

```sql
-- 1. 기존 테이블 삭제 (충돌 방지)
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. user_profiles 테이블 생성
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원',
  distributor TEXT DEFAULT '일반',
  status TEXT DEFAULT 'pending',
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT
);

-- 3. RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. 모든 사용자 허용 정책
CREATE POLICY "Allow all operations" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 5. 캐시 갱신
SELECT pg_reload_conf();

-- 6. 테이블 확인
SELECT 'user_profiles created successfully' as status;
```

### 2단계: 테스트

1. **http://localhost:3000/signup** 접속
2. 회원가입 폼 작성
3. **가입신청** 버튼 클릭

## 🚨 여전히 오류가 발생하는 경우

### 추가 해결 방법:

```sql
-- 1. 캐시 강제 갱신
SELECT pg_reload_conf();

-- 2. 테이블 존재 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- 3. 권한 재설정
DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
CREATE POLICY "Allow all operations" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);
```

## 📞 문제가 지속되는 경우

1. **Supabase Dashboard** → **Table Editor** 확인
2. **user_profiles** 테이블이 보이는지 확인
3. 테이블 구조가 올바른지 확인
4. 브라우저 개발자 도구에서 네트워크 탭 확인

---

**이 스크립트를 실행하면 문제가 해결될 것입니다! 🎉**
