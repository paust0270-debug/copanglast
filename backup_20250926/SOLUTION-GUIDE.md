# 🚀 Supabase Auth 충돌 문제 완전 해결 가이드

## 📋 문제 상황
- `Could not find the 'password_hash' column of 'users' in the schema cache`
- `Could not find the table 'public.user_profiles' in the schema cache`

## ✅ 해결 방법 (단계별)

### 1단계: Supabase SQL Editor에서 테이블 생성

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 해당 프로젝트 선택
3. **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 다음 SQL 코드를 복사하여 실행:

```sql
-- 1. 잘못 만든 public.users 테이블 삭제 (충돌 방지)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. user_profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_profiles (
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

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. 정책 설정 (개발용 - 모든 사용자 허용)
CREATE POLICY "Allow all operations for all users" ON public.user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);

-- 5. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_grade ON public.user_profiles(grade);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- 8. 스키마 캐시 갱신
SELECT pg_reload_conf();

-- 9. 테이블 생성 확인
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM public.user_profiles;
```

### 2단계: 환경 변수 확인

`.env.local` 파일에 다음이 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3단계: 개발 서버 재시작

```bash
cd cupang-ranking-checker
npm run dev
```

### 4단계: 테스트

1. **http://localhost:3000/signup** 접속
2. 회원가입 폼 작성
3. **가입신청** 버튼 클릭

## 🔍 주요 변경사항

### ✅ 해결된 문제들:
1. **`password_hash` 컬럼 오류** → Supabase Auth 사용
2. **`public.users` 테이블 충돌** → 삭제하고 auth.users 사용
3. **`user_profiles` 테이블 없음** → 새로 생성

### 🔄 새로운 구조:
- **`auth.users`** → Supabase Auth가 자동 관리 (비밀번호, 이메일 등)
- **`user_profiles`** → 추가 사용자 정보 (이름, 전화번호, 등급 등)
- **`customers`** → 슬롯 관리용 데이터

### 🎯 작동하는 기능:
- ✅ 회원가입 (Supabase Auth 사용)
- ✅ 자동 비밀번호 암호화
- ✅ 사용자 프로필 관리
- ✅ 슬롯 관리

## 🚨 문제가 지속되는 경우

### 캐시 문제 해결:
```sql
-- Supabase SQL Editor에서 실행
SELECT pg_reload_conf();
```

### 테이블 존재 확인:
```sql
-- 테이블이 제대로 생성되었는지 확인
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';
```

### 권한 문제 해결:
```sql
-- RLS 정책 재설정
DROP POLICY IF EXISTS "Allow all operations for all users" ON public.user_profiles;
CREATE POLICY "Allow all operations for all users" ON public.user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);
```

## 📞 추가 도움

여전히 문제가 발생한다면:
1. Supabase Dashboard에서 **Table Editor** 확인
2. **user_profiles** 테이블이 존재하는지 확인
3. 테이블 구조가 올바른지 확인
4. 브라우저 개발자 도구에서 네트워크 탭 확인

---

**이제 `http://localhost:3000/signup`에서 가입신청을 눌러도 오류가 발생하지 않을 것입니다! 🎉**
