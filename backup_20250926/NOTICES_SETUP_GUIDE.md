# 공지사항 테이블 생성 가이드

## 🔧 Supabase에서 notices 테이블 생성하기

### 1단계: Supabase 대시보드 접속
- https://supabase.com/dashboard 접속
- 프로젝트 선택: `cwsdvgkjptuvbdtxcejt`

### 2단계: SQL Editor 열기
- 왼쪽 메뉴에서 "SQL Editor" 클릭
- "New query" 버튼 클릭

### 3단계: SQL 실행
아래 SQL을 복사하여 실행하세요:

```sql
-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target VARCHAR(50) NOT NULL DEFAULT '전체',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT '관리자',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_target ON notices(target);
CREATE INDEX IF NOT EXISTS idx_notices_author ON notices(author);

-- RLS 정책 설정 (선택사항)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공지사항을 읽을 수 있도록 설정
CREATE POLICY "Allow public read access" ON notices
  FOR SELECT USING (true);

-- 인증된 사용자만 공지사항을 작성할 수 있도록 설정
CREATE POLICY "Allow authenticated insert" ON notices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자만 공지사항을 수정/삭제할 수 있도록 설정
CREATE POLICY "Allow authenticated update" ON notices
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON notices
  FOR DELETE USING (auth.role() = 'authenticated');

-- updated_at 자동 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_notices_updated_at 
    BEFORE UPDATE ON notices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 4단계: Service Role Key 확인
- Settings → API → Project API keys
- `service_role` 키를 복사하여 `.env.local` 파일에 추가

### 5단계: 환경 변수 파일 수정
`.env.local` 파일에 다음 내용을 추가하세요:

```
SUPABASE_SERVICE_ROLE_KEY=여기에_실제_service_role_키를_넣으세요
```

### 6단계: 개발 서버 재시작
```bash
npm run dev
```

## 🚨 문제 해결

### 500 에러가 계속 발생하는 경우:
1. Supabase 대시보드에서 `notices` 테이블이 생성되었는지 확인
2. Service Role Key가 올바르게 설정되었는지 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인
