# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com)에 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. 새 프로젝트 생성:
   - Organization 선택
   - 프로젝트 이름: `cupang-ranking-checker`
   - 데이터베이스 비밀번호 설정 (기억해두세요!)
   - 지역 선택 (한국 사용자라면 `Southeast Asia (Singapore)` 권장)

## 2. 데이터베이스 스키마 생성

1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼 클릭하여 스키마 생성

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 환경 변수 값 찾는 방법:

1. **Supabase URL**: 
   - 대시보드 → Settings → API
   - "Project URL" 복사

2. **Anon Key**: 
   - 대시보드 → Settings → API
   - "anon public" 키 복사

### 자동 설정 방법:

```bash
# 프로젝트 루트에서 실행
node setup-env.js
```

이 스크립트를 실행하면 대화형으로 환경 변수를 설정할 수 있습니다.

### 수동 설정 방법:

1. 프로젝트 루트에 `.env.local` 파일 생성
2. 위의 형식에 맞춰 실제 값 입력
3. 파일 저장 후 개발 서버 재시작

## 4. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 쿠팡APP → 작업등록 페이지 접속
3. 새로운 슬롯 등록 시도
4. 새로고침 후에도 데이터가 유지되는지 확인

## 5. 문제 해결

### 환경 변수 오류
```
Error: Missing Supabase environment variables
❌ Supabase 연결 실패: {}
```

**해결 방법:**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 개발 서버 재시작 (`npm run dev`)
4. `node setup-env.js` 실행하여 자동 설정

**확인 사항:**
- 파일명: `.env.local` (`.env` 아님)
- 위치: 프로젝트 루트 디렉토리
- 형식: `NEXT_PUBLIC_SUPABASE_URL=값`

### 데이터베이스 연결 오류
```
Error: Invalid API key
Error: customers 테이블이 존재하지 않습니다
```

**해결 방법:**
1. Supabase URL과 API 키가 정확한지 확인
2. 프로젝트가 활성 상태인지 확인
3. SQL Editor에서 `supabase-schema.sql` 실행
4. 테이블이 생성되었는지 확인

### RLS 정책 오류
```
Error: new row violates row-level security policy
```

**해결 방법:**
1. SQL Editor에서 RLS 정책이 제대로 생성되었는지 확인
2. `supabase-schema.sql` 재실행
3. RLS 정책 확인: `SELECT * FROM pg_policies;`

## 6. 디버깅 팁

### 콘솔 로그 확인
브라우저 개발자 도구에서 다음 로그 확인:
- `🔍 Supabase 연결 테스트 시작...`
- `URL: [your-url]`
- `Key: [your-key]...`

### 환경 변수 상태 확인
페이지 로드 시 콘솔에서 환경 변수 상태 확인:
- `NEXT_PUBLIC_SUPABASE_URL: ✅ 설정됨 / ❌ 설정되지 않음`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ 설정됨 / ❌ 설정되지 않음`

### 단계별 테스트
1. 기본 연결 테스트 (인증 없이)
2. 테이블 접근 테스트
3. 데이터 CRUD 테스트

## 7. 보안 고려사항

현재 설정은 개발용으로 모든 사용자에게 모든 권한을 부여합니다.
프로덕션 환경에서는 적절한 인증 및 권한 제어를 구현해야 합니다.

## 8. 추가 기능

- 사용자 인증 추가
- 권한 기반 접근 제어
- 데이터 백업 및 복구
- 모니터링 및 로깅

## 9. 지원

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. Supabase 대시보드 로그 확인
3. 환경 변수 설정 재확인
4. 데이터베이스 스키마 재생성
5. `node setup-env.js` 실행하여 자동 설정

## 10. 빠른 문제 해결 체크리스트

- [ ] `.env.local` 파일이 프로젝트 루트에 존재
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] `supabase-schema.sql` 실행됨
- [ ] 브라우저 콘솔에서 오류 메시지 확인
- [ ] Supabase 프로젝트가 활성 상태
