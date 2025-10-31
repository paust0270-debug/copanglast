-- 스케줄러 관련 테이블 생성

-- 1. slot_type_settings 테이블 (슬롯 타입별 간격 설정)
CREATE TABLE IF NOT EXISTS slot_type_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_type TEXT NOT NULL UNIQUE,
  interval_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. scheduler_logs 테이블 (스케줄러 실행 로그)
CREATE TABLE IF NOT EXISTS scheduler_logs (
  slot_type TEXT NOT NULL PRIMARY KEY,
  last_run_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_slot_type_settings_slot_type ON slot_type_settings(slot_type);
CREATE INDEX IF NOT EXISTS idx_scheduler_logs_slot_type ON scheduler_logs(slot_type);

-- RLS 활성화
ALTER TABLE slot_type_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduler_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Allow all operations for all users" ON slot_type_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON scheduler_logs
  FOR ALL USING (true) WITH CHECK (true);

