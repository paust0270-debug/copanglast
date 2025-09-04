# Supabase 테이블 생성 가이드

## settlement_requests 테이블 생성

Supabase 대시보드에서 다음 SQL을 실행하여 테이블을 생성하세요:

### 1. Supabase 대시보드 접속
- https://supabase.com/dashboard 접속
- 프로젝트 선택: `cwsdvgkjptuvbdtxcejt`
- **SQL Editor** 메뉴 클릭

### 2. 테이블 생성 SQL 실행
```sql
-- 정산요청 테이블 생성
CREATE TABLE IF NOT EXISTS settlement_requests (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL,
  sequential_number INTEGER NOT NULL,
  distributor_name VARCHAR(100) NOT NULL,
  customer_id VARCHAR(255) NOT NULL,
  slot_addition_date DATE NOT NULL,
  slot_type VARCHAR(100) NOT NULL,
  number_of_slots INTEGER NOT NULL,
  depositor_name VARCHAR(255),
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  days_used INTEGER DEFAULT 0,
  memo TEXT,
  status VARCHAR(50) DEFAULT '승인대기',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_settlement_requests_customer_id ON settlement_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_status ON settlement_requests(status);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_created_at ON settlement_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_settlement_requests_slot_id ON settlement_requests(slot_id);

-- slots 테이블에 status 컬럼이 없다면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'slots' AND column_name = 'status'
  ) THEN
    ALTER TABLE slots ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;
```

### 3. 테이블 생성 확인
```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'settlement_requests';

-- 컬럼 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'settlement_requests';
```

### 4. RLS 정책 설정 (선택사항)
```sql
-- RLS 활성화
ALTER TABLE settlement_requests ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 정책 설정
CREATE POLICY "Allow read access for all users" ON settlement_requests
FOR SELECT USING (true);

-- 인증된 사용자가 삽입 가능하도록 정책 설정
CREATE POLICY "Allow insert for authenticated users" ON settlement_requests
FOR INSERT WITH CHECK (true);
```

## 문제 해결 후 테스트

테이블 생성 후:
1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 `/settlement/unsettled` 페이지 접속
3. "전체 정산요청" 버튼 클릭 테스트



