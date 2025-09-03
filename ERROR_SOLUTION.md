# Supabase 에러 해결 방법

## 1. "syntax error at or near 'users'" 에러

### 에러 원인
이 에러는 다음과 같은 이유로 발생합니다:

1. **Supabase 프로젝트가 설정되지 않음**
2. **환경 변수가 설정되지 않음**
3. **데이터베이스 스키마가 생성되지 않음**
4. **Supabase 연결이 실패함**

### 해결 단계

#### 1단계: 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**중요**: 실제 Supabase 프로젝트의 URL과 API 키로 교체해야 합니다.

#### 2단계: Supabase 프로젝트 설정
1. [Supabase](https://supabase.com)에 가입
2. 새 프로젝트 생성
3. 프로젝트 설정에서 URL과 API 키 확인
4. `.env.local` 파일에 실제 값 입력

#### 3단계: 데이터베이스 스키마 생성
1. Supabase 대시보드 → SQL Editor
2. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼을 클릭하여 스키마 실행

#### 4단계: 애플리케이션 재시작
```bash
# 개발 서버 재시작
npm run dev
# 또는
yarn dev
```

## 2. "column 'password_hash' of relation 'users' does not exist" 에러

### 에러 원인
이 에러는 데이터베이스 스키마에서 `password_hash` 컬럼이 정의되어 있지만, 실제 테이블에는 이 컬럼이 생성되지 않았기 때문입니다.

### 해결 방법

#### 방법 1: 스키마 재실행 (권장)
1. Supabase 대시보드 → SQL Editor
2. 다음 SQL을 실행하여 기존 테이블 삭제:
```sql
DROP TABLE IF EXISTS ranking_status CASCADE;
DROP TABLE IF EXISTS settlement_history CASCADE;
DROP TABLE IF EXISTS slot_works CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
3. `supabase-schema.sql` 파일의 내용을 다시 실행

#### 방법 2: 수동으로 컬럼 추가
```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
```

### 수정된 스키마 특징
- `password_hash` 컬럼 제거
- 사용자 인증은 별도 시스템으로 관리
- 기본 사용자 정보만 저장 (username, name, email, status 등)

## 문제 진단

### 환경 변수 확인
브라우저 콘솔에서 다음을 확인하세요:

```javascript
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

### 연결 테스트
`/components/SupabaseTest` 컴포넌트를 사용하여 연결 상태를 확인하세요.

## 일반적인 에러 메시지

### "Supabase configuration is missing"
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 애플리케이션을 재시작

### "Users table does not exist"
- `supabase-schema.sql`을 Supabase SQL 편집기에서 실행
- 테이블이 올바르게 생성되었는지 확인

### "Failed to fetch users from database"
- Supabase 프로젝트 URL과 API 키가 올바른지 확인
- Supabase 프로젝트가 활성 상태인지 확인
- 네트워크 연결 상태 확인

### "column 'password_hash' does not exist"
- 스키마를 다시 실행하여 테이블 재생성
- 또는 수동으로 컬럼 추가

## 추가 도움말

- `SUPABASE_SETUP.md` - 상세한 설정 가이드
- `supabase-schema.sql` - 데이터베이스 스키마 (수정됨)
- Supabase [공식 문서](https://supabase.com/docs)

## 문제가 지속되는 경우

1. 브라우저 콘솔의 전체 에러 메시지 확인
2. Supabase 대시보드에서 프로젝트 상태 확인
3. 네트워크 탭에서 API 요청 상태 확인
4. 환경 변수가 올바르게 로드되었는지 확인
5. 스키마 실행 후 테이블 구조 확인
