# Supabase Distributors 테이블 설정 가이드

## 문제 해결 단계

### 1. 환경 변수 확인

프로젝트 루트의 `.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**확인 방법:**
- 브라우저 개발자 도구 콘솔에서 환경 변수 설정 상태 확인
- 설정되지 않은 경우 "❌ Supabase 환경 변수가 설정되지 않았습니다!" 메시지가 표시됨

### 2. Supabase 프로젝트에서 SQL 에디터 실행

1. Supabase 대시보드에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "SQL Editor" 클릭
4. "New query" 버튼 클릭

### 3. SQL 스크립트 실행

`create-distributors-table.sql` 파일의 내용을 복사하여 SQL 에디터에 붙여넣고 실행하세요.

### 4. 테이블 생성 확인

SQL 에디터에서 다음 쿼리를 실행하여 테이블이 정상적으로 생성되었는지 확인:

```sql
SELECT * FROM distributors;
```

### 5. RLS 정책 확인

테이블이 생성되었지만 여전히 오류가 발생한다면, RLS 정책을 확인하세요:

```sql
-- RLS 비활성화 (테스트용)
ALTER TABLE distributors DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자에게 권한 부여
CREATE POLICY "Allow all operations for distributors" ON distributors
  FOR ALL USING (true);
```

### 6. 기능 테스트

1. http://localhost:3000/distributor-add 접속
2. 테이블이 없으면 안내 메시지가 표시됨
3. "총판추가" 버튼 클릭
4. 총판 정보 입력 후 "등록" 버튼 클릭
5. 총판관리 페이지로 돌아가서 등록된 데이터 확인

## 디버깅 정보

브라우저 개발자 도구 콘솔에서 다음 정보를 확인할 수 있습니다:

- 환경 변수 설정 상태
- Supabase 연결 오류 상세 정보
- 테이블 존재 여부 확인 결과

## 주의사항

- Supabase 프로젝트가 생성되어 있어야 합니다
- 환경 변수가 올바르게 설정되어 있어야 합니다
- RLS(Row Level Security)가 활성화되어 있으므로 필요에 따라 정책을 조정하세요
- 테이블 생성 후 페이지를 새로고침해야 합니다
