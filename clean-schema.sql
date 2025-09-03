-- Supabase Database Schema for Cupang Ranking Checker

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (to avoid conflicts)
DROP TABLE IF EXISTS ranking_status CASCADE;
DROP TABLE IF EXISTS settlement_history CASCADE;
DROP TABLE IF EXISTS slot_works CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  distributor VARCHAR(100) DEFAULT '일반',
  grade VARCHAR(100) DEFAULT '일반회원',
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slot works table
CREATE TABLE slot_works (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  slot_type VARCHAR(100) NOT NULL,
  slot_count INTEGER NOT NULL,
  payment_type VARCHAR(100) NOT NULL,
  payer_name VARCHAR(255),
  amount INTEGER DEFAULT 0,
  payment_date DATE,
  working_days INTEGER DEFAULT 30,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement history table
CREATE TABLE settlement_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  settlement_date DATE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ranking status table
CREATE TABLE ranking_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  keyword VARCHAR(255) NOT NULL,
  product_url TEXT NOT NULL,
  current_rank INTEGER,
  previous_rank INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_slot_works_customer_id ON slot_works(customer_id);
CREATE INDEX idx_slot_works_created_at ON slot_works(created_at);
CREATE INDEX idx_settlement_history_user_id ON settlement_history(user_id);
CREATE INDEX idx_ranking_status_user_id ON ranking_status(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_status ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication requirements)
-- For now, allowing all operations (you should restrict this in production)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on slot_works" ON slot_works FOR ALL USING (true);
CREATE POLICY "Allow all operations on settlement_history" ON settlement_history FOR ALL USING (true);
CREATE POLICY "Allow all operations on ranking_status" ON ranking_status FOR ALL USING (true);

-- Insert sample data
INSERT INTO users (username, name, email, slot_used, additional_count) VALUES
  ('wrksldkw123', '김지연', 'kim@example.com', 12, 2),
  ('qkrwnsgus555', '테스터', 'tester@example.com', 0, 0)
ON CONFLICT (username) DO NOTHING;

INSERT INTO slot_works (customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, amount, payment_date, working_days, memo) VALUES
  ((SELECT id FROM users WHERE username = 'wrksldkw123'), '김지연', '쿠팡', 5, '입금', '김지연', 50000, '2024-01-15', 30, '첫 번째 슬롯 추가'),
  ((SELECT id FROM users WHERE username = 'wrksldkw123'), '김지연', '네이버쇼핑', 7, '쿠폰', '김지연', 70000, '2024-01-20', 30, '네이버쇼핑 슬롯 추가')
ON CONFLICT DO NOTHING;
