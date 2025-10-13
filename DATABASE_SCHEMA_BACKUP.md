# Database Schema Backup - 2025-10-13

## Overview
This document contains the complete database schema for the Coupang Rank Checker web application as of 2025-10-13.

## Database: Supabase PostgreSQL

### Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  distributor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  distributor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. distributors
```sql
CREATE TABLE distributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_name TEXT UNIQUE NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. slots
```sql
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  slot_count INTEGER NOT NULL DEFAULT 0,
  usage_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);
```

#### 6. slot_status
```sql
CREATE TABLE slot_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  db_id TEXT,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  distributor TEXT DEFAULT '일반',
  work_group TEXT DEFAULT '공통',
  keyword TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  current_rank TEXT DEFAULT '1 [0]',
  start_rank TEXT DEFAULT '1 [0]',
  slot_count INTEGER DEFAULT 0,
  traffic TEXT DEFAULT '0 (0/0)',
  equipment_group TEXT DEFAULT '지정안함',
  remaining_days INTEGER,
  registration_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT '작동중',
  memo TEXT DEFAULT '',
  slot_type TEXT DEFAULT '쿠팡',
  slot_sequence INTEGER,
  usage_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. keywords
```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  customer_id UUID,
  slot_id UUID,
  slot_sequence INTEGER,
  current_rank TEXT DEFAULT '1 [0]',
  start_rank TEXT DEFAULT '1 [0]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 8. slot_add_forms
```sql
CREATE TABLE slot_add_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  slot_count INTEGER NOT NULL,
  usage_days INTEGER NOT NULL DEFAULT 30,
  slot_type TEXT NOT NULL DEFAULT '쿠팡',
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9. slot_rank_history
```sql
CREATE TABLE slot_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  slot_sequence INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  rank INTEGER NOT NULL,
  rank_change INTEGER DEFAULT 0,
  start_rank_diff INTEGER DEFAULT 0,
  rank_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 10. settlements
```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  distributor TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'unsettled',
  settlement_date DATE,
  memo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies for authenticated users.

## Key Features Implemented

### 1. Slot Management
- Dynamic slot allocation per customer
- Usage tracking and expiry management
- Sequence numbering for individual slots

### 2. Ranking System
- Keyword-based ranking tracking
- Historical rank changes
- Desktop program integration

### 3. Customer Management
- User profiles with distributor relationships
- Slot allocation and management
- Settlement tracking

### 4. API Endpoints
- `/api/slots` - Slot creation and management
- `/api/slot-status` - Work registration and status updates
- `/api/keywords` - Keyword management
- `/api/rank-update` - Ranking results from desktop program
- `/api/rank-history` - Historical ranking data
- `/api/slot-add-forms` - Form data backup

### 5. Desktop Integration
- Keyword fetching from web application
- Ranking results submission
- Batch file execution with Korean text support

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run development server: `npm run dev`
5. Access at `http://localhost:3000`

## Backup Date: 2025-10-13
This schema represents the complete working state of the application with all features implemented and tested.
