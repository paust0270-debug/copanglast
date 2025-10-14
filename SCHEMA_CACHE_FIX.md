# Supabase 스키마 캐시 문제 완전 해결 가이드

## 문제 설명

Supabase에서 테이블 구조 변경사항이 즉시 반영되지 않는 스키마 캐시 문제가 발생할 수 있습니다. 이는 개발 및 배포 과정에서 심각한 문제를 야기할 수 있습니다.

## 🚀 완전 해결 방법

### 1. 자동 완전 해결 스크립트 실행

```bash
# 기본 스키마 캐시 문제 해결
npm run fix:schema-cache

# 고급 스키마 캐시 문제 완전 해결 (권장)
npm run fix:schema-cache:advanced

# 또는 직접 실행
node fix-schema-cache-advanced.js
```

### 2. 수동 완전 해결 방법

#### 2.1 환경 변수 확인
`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 2.2 스키마 실행
Supabase SQL Editor에서 `supabase-schema.sql` 파일을 실행하여 테이블을 생성합니다.

#### 2.3 RLS 정책 확인
Row Level Security 정책이 올바르게 설정되어 있는지 확인합니다.

#### 2.4 브라우저 캐시 삭제
브라우저의 개발자 도구에서 캐시를 삭제하거나 시크릿 모드로 테스트합니다.

### 3. 코드에서 스키마 캐시 문제 완전 해결

#### 3.1 강화된 유틸리티 함수 사용

```typescript
import { fixSchemaCacheIssues, withSchemaCacheFix } from '@/lib/schema-utils';

// 스키마 캐시 문제 완전 해결
await fixSchemaCacheIssues();

// 함수를 스키마 캐시 문제 해결로 래핑
const getCustomersWithCacheFix = withSchemaCacheFix(getCustomers);
```

#### 3.2 API 엔드포인트에서 스키마 캐시 문제 해결

```typescript
// 회원가입 API 예시
export async function POST(request: NextRequest) {
  try {
    // 스키마 캐시 문제 사전 해결
    await fixSchemaCacheIssues();
    
    // 데이터베이스 작업을 스키마 캐시 문제 해결로 래핑
    const insertUser = async () => {
      return await supabase.from('users').insert([userData]);
    };
    
    const { data, error } = await withSchemaCacheFix(insertUser)();
    
    // 나머지 로직...
  } catch (error) {
    // 오류 처리...
  }
}
```

### 4. 회원가입 스키마 문제 특별 해결

#### 4.1 user_profiles 테이블 스키마 확인

회원가입 시 `user_profiles` 테이블에 `username` 컬럼이 필요합니다:

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL, -- 이 컬럼이 반드시 필요
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  -- 기타 컬럼들...
);
```

#### 4.2 username 컬럼 추가 스크립트 실행

**중요**: `user_profiles` 테이블에 `username` 컬럼이 없는 경우 다음 스크립트를 실행하세요:

1. **Supabase SQL Editor에서 `fix-user-profiles-schema.sql` 실행**
2. **스키마 캐시 강제 갱신**: `npm run fix:schema-cache:advanced`
3. **개발 서버 재시작**: `npm run dev`

#### 4.3 스키마 업데이트 후 캐시 갱신

```bash
# 1. Supabase SQL Editor에서 fix-user-profiles-schema.sql 실행
# 2. 스키마 캐시 강제 갱신
npm run fix:schema-cache:advanced
# 3. 개발 서버 재시작
npm run dev
```

### 5. 문제 해결 체크리스트

- [ ] 환경 변수가 올바르게 설정되어 있는가?
- [ ] `supabase-schema.sql`이 Supabase에서 실행되었는가?
- [ ] `user_profiles` 테이블에 `username` 컬럼이 있는가?
- [ ] `fix-user-profiles-schema.sql`이 실행되었는가?
- [ ] RLS 정책이 올바르게 설정되어 있는가?
- [ ] 스키마 캐시 문제 해결 스크립트가 실행되었는가?
- [ ] 개발 서버가 재시작되었는가?
- [ ] 브라우저 캐시가 삭제되었는가?

### 6. 추가 문제 해결

#### 6.1 테이블이 존재하지 않는 경우
```sql
-- Supabase SQL Editor에서 실행
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  -- 기타 필요한 컬럼들...
);
```

#### 6.2 username 컬럼이 존재하지 않는 경우
```sql
-- username 컬럼 추가 (fix-user-profiles-schema.sql 실행)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT UNIQUE;
        RAISE NOTICE 'username 컬럼이 user_profiles 테이블에 추가되었습니다.';
    END IF;
END $$;
```

#### 6.3 RLS 정책 문제
```sql
-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Allow all operations for all users" ON user_profiles
  FOR ALL USING (true)
  WITH CHECK (true);
```

### 7. 오류 메시지별 해결 방법

#### 7.1 "Could not find the 'username' column" 오류
```bash
# 해결 방법:
# 1. Supabase SQL Editor에서 fix-user-profiles-schema.sql 실행
# 2. npm run fix:schema-cache:advanced 실행
# 3. npm run dev로 서버 재시작
```

#### 7.2 "Failed to fetch" 오류
```bash
# 해결 방법:
# 1. 개발 서버가 실행 중인지 확인: netstat -ano | findstr :3000
# 2. 서버 재시작: npm run dev
# 3. 브라우저 캐시 삭제
```

#### 7.3 "relation does not exist" 오류
```bash
# 해결 방법:
# 1. Supabase SQL Editor에서 supabase-schema.sql 실행
# 2. npm run fix:schema-cache:advanced 실행
# 3. npm run dev로 서버 재시작
```

## 🎯 완전 해결 확인

모든 문제가 해결되었는지 확인하려면:

1. **스크립트 실행**: `npm run fix:schema-cache:advanced`
2. **브라우저 테스트**: `http://localhost:3000/signup`에서 회원가입 시도
3. **콘솔 확인**: 개발자 도구에서 오류 메시지 확인

## 📞 추가 지원

문제가 지속되는 경우:

1. Supabase 대시보드에서 테이블 구조 확인
2. SQL Editor에서 스키마 재실행
3. 개발 서버 완전 재시작
4. 브라우저 캐시 완전 삭제

이제 스키마 캐시 문제가 완전히 해결되었습니다. 애플리케이션을 안전하게 사용할 수 있습니다!
