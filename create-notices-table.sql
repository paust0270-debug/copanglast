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
