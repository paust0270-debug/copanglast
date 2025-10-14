-- 공지사항 테이블 생성 (간단 버전)
-- Supabase 대시보드 → SQL Editor에서 실행하세요

-- 테이블 생성
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

-- RLS 정책 설정 (모든 사용자 허용)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공지사항을 읽을 수 있도록 설정
CREATE POLICY "Allow public read access" ON notices
  FOR SELECT USING (true);

-- 모든 사용자가 공지사항을 작성할 수 있도록 설정
CREATE POLICY "Allow public insert" ON notices
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 공지사항을 수정할 수 있도록 설정
CREATE POLICY "Allow public update" ON notices
  FOR UPDATE USING (true);

-- 모든 사용자가 공지사항을 삭제할 수 있도록 설정
CREATE POLICY "Allow public delete" ON notices
  FOR DELETE USING (true);
