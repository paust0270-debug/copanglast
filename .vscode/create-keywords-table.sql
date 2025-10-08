-- 키워드 목록 테이블 생성 (순위 체크 현황용)
CREATE TABLE IF NOT EXISTS keywords (
    id SERIAL PRIMARY KEY,
    slot_type VARCHAR(50) NOT NULL DEFAULT 'coupang',
    keyword VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    slot_count INTEGER DEFAULT 1,
    current_rank INTEGER,
    last_check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_keywords_slot_type ON keywords(slot_type);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_last_check_date ON keywords(last_check_date);

-- slot_count 컬럼 추가 (기존 테이블이 있는 경우)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'keywords' AND column_name = 'slot_count') THEN
        ALTER TABLE keywords ADD COLUMN slot_count INTEGER DEFAULT 1;
    END IF;
END $$;

-- RLS 정책 설정
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

-- 기존 정책들 삭제 (있다면)
DROP POLICY IF EXISTS "키워드 목록 조회 허용" ON keywords;
DROP POLICY IF EXISTS "키워드 목록 삽입 허용" ON keywords;
DROP POLICY IF EXISTS "키워드 목록 수정 허용" ON keywords;
DROP POLICY IF EXISTS "키워드 목록 삭제 허용" ON keywords;

-- 모든 사용자가 읽기 가능
CREATE POLICY "키워드 목록 조회 허용" ON keywords
    FOR SELECT USING (true);

-- 인증된 사용자가 삽입 가능
CREATE POLICY "키워드 목록 삽입 허용" ON keywords
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 인증된 사용자가 수정 가능
CREATE POLICY "키워드 목록 수정 허용" ON keywords
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 인증된 사용자가 삭제 가능
CREATE POLICY "키워드 목록 삭제 허용" ON keywords
    FOR DELETE USING (auth.role() = 'authenticated');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_keywords_updated_at ON keywords;
CREATE TRIGGER update_keywords_updated_at 
    BEFORE UPDATE ON keywords 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO keywords (slot_type, keyword, link_url, slot_count, current_rank, last_check_date) VALUES
('coupang', '무선이어폰', 'https://www.coupang.com/vp/products/123456789', 5, 15, NOW() - INTERVAL '1 day'),
('coupang', '스마트워치', 'https://www.coupang.com/vp/products/987654321', 3, 8, NOW() - INTERVAL '2 hours'),
('coupang', '블루투스 스피커', 'https://www.coupang.com/vp/products/456789123', 2, 23, NOW() - INTERVAL '30 minutes'),
('coupang', '게이밍 마우스', 'https://www.coupang.com/vp/products/789123456', 1, 5, NOW() - INTERVAL '1 hour'),
('coupang', '무선 충전기', 'https://www.coupang.com/vp/products/321654987', 4, 12, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- 테이블 정보 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'keywords' 
ORDER BY ordinal_position;
