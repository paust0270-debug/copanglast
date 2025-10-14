# 🎯 쿠팡 순위 체킹기 v2.0 - API 구조 문서

## 📋 프로젝트 개요
- **프로젝트명**: 쿠팡 순위 체킹기 v2.0 - Supabase 연동 24시간 시스템
- **기술 스택**: Next.js 15, React 19, TypeScript, Supabase, Tailwind CSS
- **백업 브랜치**: `20251013` (GitHub: https://github.com/paust0270-debug/copangappfinal)
- **총 API 엔드포인트**: 38개

## 🗄️ 데이터베이스 구조

### 주요 테이블 관계도
```
users (UUID) ──┐
               ├── slots (BIGINT)
               └── settlements (BIGINT)
                   
slots ──┐
        └── slot_status (BIGINT) ──┐
                                   └── keywords (BIGINT)
                                   
distributors (BIGINT) ──┐
                        └── users (UUID)
```

### 테이블별 상세 구조

#### 1. users 테이블 (UUID 기반)
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  kakao_id TEXT,
  memo TEXT,
  grade TEXT DEFAULT '일반회원' CHECK (grade IN ('일반회원', '총판회원', '최고관리자')),
  distributor TEXT DEFAULT '일반',
  manager_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  slot_used INTEGER DEFAULT 0,
  additional_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  processor TEXT
);
```

#### 2. slots 테이블 (슬롯 관리)
```sql
CREATE TABLE slots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('coupang', 'coupang-vip', 'coupang-app', 'naver-shopping', 'place', 'today-house', 'aliexpress')),
  slot_count INTEGER NOT NULL DEFAULT 1,
  payment_type TEXT CHECK (payment_type IN ('deposit', 'coupon')),
  payer_name TEXT,
  payment_amount INTEGER,
  payment_date DATE,
  usage_days INTEGER,
  memo TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. slot_status 테이블 (작업 등록 상태)
```sql
CREATE TABLE slot_status (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_count INTEGER NOT NULL,
  slot_sequence INTEGER NOT NULL,
  keyword TEXT,
  link_url TEXT,
  memo TEXT,
  current_rank TEXT,
  start_rank TEXT,
  traffic TEXT,
  equipment_group TEXT,
  status TEXT DEFAULT 'available',
  usage_days INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  expiry_date TIMESTAMP
);
```

#### 4. keywords 테이블 (키워드 관리)
```sql
CREATE TABLE keywords (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  keyword TEXT NOT NULL,
  link_url TEXT NOT NULL,
  slot_type TEXT DEFAULT 'coupang',
  slot_count INTEGER DEFAULT 1,
  current_rank INTEGER,
  last_check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  slot_sequence INTEGER,
  customer_id TEXT,
  slot_id INTEGER
);
```

#### 5. settlements 테이블 (정산 관리)
```sql
CREATE TABLE settlements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  distributor_name TEXT,
  slot_type TEXT,
  slot_count INTEGER,
  payment_type TEXT,
  payer_name TEXT,
  payment_amount INTEGER,
  usage_days INTEGER,
  memo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. distributors 테이블 (총판 관리)
```sql
CREATE TABLE distributors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT '본사',
  sub_count INTEGER DEFAULT 0,
  manager TEXT,
  domain TEXT,
  ip TEXT,
  site_name TEXT,
  menu_abbr TEXT,
  default_days INTEGER DEFAULT 30,
  coupon_days INTEGER DEFAULT 0,
  member_count INTEGER DEFAULT 0,
  memo TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔌 API 구조 상세 분석

### 1. 슬롯 관리 API (`/api/slots`)

#### GET `/api/slots`
- **기능**: 슬롯 목록 조회
- **쿼리 파라미터**:
  - `customerId`: 특정 고객 ID 필터링
  - `slotType`: 슬롯 타입 필터링
- **응답 구조**:
```typescript
{
  success: boolean;
  data: Slot[];
}

interface Slot {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string;
  payer_name: string;
  payment_amount: number;
  payment_date: string;
  usage_days: number;
  memo: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
}
```

#### POST `/api/slots`
- **기능**: 슬롯 추가 및 동기화
- **요청 본문**:
```typescript
{
  customerId: string;
  customerName: string;
  slotType: string;
  slotCount: number;
  paymentType?: string;
  payerName?: string;
  paymentAmount?: number;
  paymentDate?: string;
  usageDays?: number;
  memo?: string;
}
```
- **핵심 로직**:
  1. `slots` 테이블에 슬롯 데이터 삽입
  2. `slot_status` 테이블에 개별 레코드 생성 (슬롯 개수만큼)
  3. `slot_sequence` 자동 관리 (고객별 1부터 시작)
  4. `settlements` 테이블에 정산 데이터 저장
  5. 고객의 `additional_count` 증가

#### PUT `/api/slots`
- **기능**: 슬롯 상태 업데이트 (활성화/비활성화)
- **요청 본문**:
```typescript
{
  slotId: number;
  status: 'active' | 'inactive';
}
```

### 2. 슬롯 상태 관리 API (`/api/slot-status`)

#### GET `/api/slot-status`
- **기능**: 슬롯 현황 조회 (다중 모드 지원)
- **쿼리 파라미터**:
  - `type`: 'slots' | 'slot_status' (조회할 테이블 구분)
  - `customerId`: 특정 고객 ID
  - `username`: 실제 고객명
  - `skipSlotsTable`: slots 테이블 조회 건너뛰기
- **핵심 로직**:
  1. `type=slot_status`인 경우: 키워드가 있는 레코드만 조회
  2. 잔여 시간 계산: `created_at + usage_days - 현재시간`
  3. 시간 단위 변환: 일, 시간, 분
  4. 등록일/만료일 계산

#### POST `/api/slot-status`
- **기능**: 작업 등록 (개별 슬롯 할당)
- **요청 본문**:
```typescript
{
  customer_id: string;
  customer_name: string;
  keyword: string;
  link_url: string;
  slot_count: number;
  distributor?: string;
  work_group?: string;
  equipment_group?: string;
  current_rank?: string;
  start_rank?: string;
  traffic?: string;
  status?: string;
  memo?: string;
  slot_type?: string;
}
```
- **핵심 로직**:
  1. 사용 가능한 슬롯 수 확인
  2. 기존 빈 `slot_status` 레코드 업데이트 (새 레코드 생성 방지)
  3. `keywords` 테이블에 개별 레코드 생성 (슬롯별로)
  4. `slot_sequence` 동기화

### 3. 키워드 관리 API (`/api/keywords`)

#### GET `/api/keywords`
- **기능**: 키워드 목록 조회
- **쿼리 파라미터**:
  - `slot_type`: 슬롯 타입 필터링
  - `limit`: 조회 제한 수
  - `offset`: 오프셋
- **응답 구조**:
```typescript
{
  success: boolean;
  data: Keyword[];
  total: number;
}

interface Keyword {
  id: number;
  keyword: string;
  link_url: string;
  slot_type: string;
  slot_count: number;
  current_rank: number;
  last_check_date: string;
  created_at: string;
  updated_at: string;
  slot_sequence: number;
  customer_id: string;
  slot_id: number;
}
```

#### POST `/api/keywords`
- **기능**: 키워드 추가
- **요청 본문**:
```typescript
{
  slot_type: string;
  keyword: string;
  link_url: string;
  slot_count: number;
  current_rank: number;
}
```

### 4. 사용자 관리 API (`/api/users`)

#### GET `/api/users`
- **기능**: 사용자 목록 조회
- **응답 구조**:
```typescript
{
  users: User[];
}

interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  kakaoId: string;
  memo: string;
  grade: '일반회원' | '총판회원' | '최고관리자';
  distributor: string;
  manager_id: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  slot_used: number;
  additional_count: number;
  created_at: string;
  updated_at: string;
  approved_at: string;
  processor: string;
}
```

#### POST `/api/users`
- **기능**: 회원가입
- **요청 본문**:
```typescript
{
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  kakaoId?: string;
}
```
- **핵심 로직**:
  1. Supabase Auth로 사용자 생성
  2. `user_profiles` 테이블에 추가 정보 저장
  3. 스키마 캐시 문제 해결 적용

### 5. 정산 관리 API (`/api/settlements`)

#### GET `/api/settlements`
- **기능**: 정산 내역 조회 (completed 상태만)
- **응답 구조**:
```typescript
{
  success: boolean;
  data: Settlement[];
}

interface Settlement {
  id: number;
  customer_id: string;
  customer_name: string;
  slot_type: string;
  slot_count: number;
  payment_type: string;
  payer_name: string;
  payment_amount: number;
  payment_date: string;
  usage_days: number;
  memo: string;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}
```

#### POST `/api/settlements`
- **기능**: 정산 데이터 저장
- **요청 본문**:
```typescript
{
  settlementData: Settlement[];
}
```

### 6. 인증 API (`/api/auth`)

#### POST `/api/auth/login`
- **기능**: 로그인
- **요청 본문**:
```typescript
{
  username: string;
  password: string;
  rememberMe?: boolean;
}
```
- **핵심 로직**:
  1. `user_profiles` 테이블에서 사용자 확인
  2. 로그인 성공 시 사용자 정보 반환
  3. `rememberMe`가 true인 경우 쿠키 설정

#### POST `/api/auth/logout`
- **기능**: 로그아웃
- **핵심 로직**: 쿠키 정리 및 세션 종료

#### GET `/api/auth/check-remembered`
- **기능**: 로그인 유지 상태 확인

### 7. 개별 슬롯 관리 API

#### DELETE `/api/slot-status/[id]`
- **기능**: 개별 슬롯 삭제 (데이터 보존)
- **핵심 로직**:
  1. `slot_status` 레코드의 작업 관련 필드만 초기화
  2. `usage_days`, `created_at`, `updated_at`, `expiry_date` 보존
  3. `keywords` 테이블에서 관련 레코드 삭제

#### PUT `/api/slot-status/[id]`
- **기능**: 개별 슬롯 상태 수정
- **핵심 로직**: 지정된 필드만 업데이트, 날짜 정보 보존

#### POST `/api/slot-status/delete-all`
- **기능**: 고객별 전체 슬롯 삭제
- **요청 본문**:
```typescript
{
  customer_id: string;
  slot_ids: number[];
}
```

### 8. 폼 데이터 백업 API

#### POST `/api/slot-add-forms`
- **기능**: 슬롯 추가 폼 데이터 백업
- **요청 본문**:
```typescript
{
  customer_id: string;
  platform: string;
  product_name: string;
}
```

#### GET `/api/slot-add-forms`
- **기능**: 폼 데이터 조회
- **쿼리 파라미터**:
  - `customer_id`: 고객 ID 필터링
  - `limit`: 조회 제한 수

## 🔄 데이터 흐름 및 동기화

### 1. 슬롯 생성 흐름
```
POST /api/slots
├── slots 테이블에 슬롯 데이터 삽입
├── slot_status 테이블에 개별 레코드 생성 (슬롯 개수만큼)
├── slot_sequence 자동 관리 (고객별 1부터 시작)
├── settlements 테이블에 정산 데이터 저장
└── users 테이블의 additional_count 증가
```

### 2. 작업 등록 흐름
```
POST /api/slot-status
├── 사용 가능한 슬롯 수 확인
├── 기존 빈 slot_status 레코드 업데이트
├── keywords 테이블에 개별 레코드 생성
└── slot_sequence 동기화
```

### 3. 슬롯 삭제 흐름
```
DELETE /api/slot-status/[id]
├── slot_status 레코드의 작업 관련 필드 초기화
├── 날짜 정보 보존 (usage_days, created_at, updated_at, expiry_date)
└── keywords 테이블에서 관련 레코드 삭제
```

## ⚙️ 핵심 비즈니스 로직

### 1. 잔여 시간 계산
```typescript
// 현재 시간 기준 잔여기간 계산
const now = new Date();
const createdDate = new Date(baseData.created_at);
const usageDays = baseData.usage_days || 0;
const expiryDate = new Date(createdDate.getTime() + usageDays * 24 * 60 * 60 * 1000);
const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());

// 일, 시간, 분으로 변환
const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
```

### 2. 슬롯 순번 관리
```typescript
// 고객별 최대 순번 조회
const { data: maxSequenceData } = await supabase
  .from('slot_status')
  .select('slot_sequence')
  .eq('customer_id', customerId)
  .order('slot_sequence', { ascending: false })
  .limit(1);

let nextSequence = 1;
if (maxSequenceData && maxSequenceData.length > 0) {
  nextSequence = (maxSequenceData[0].slot_sequence || 0) + 1;
}
```

### 3. 키워드 순위 파싱
```typescript
// current_rank에서 숫자만 추출 (예: "5 [3]" -> 5)
const extractRankNumber = (rankStr) => {
  if (!rankStr) return 1;
  const match = rankStr.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 1;
};
```

### 4. 날짜 포맷팅
```typescript
// 로컬 시간 포맷팅
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
```

## 🔧 환경 설정

### 필수 환경 변수
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Supabase 클라이언트 설정
```typescript
// lib/supabase.ts
export const supabase = createSupabaseClient();

export function createSupabaseClient() {
  return _createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
}
```

## 🚨 에러 처리 및 예외 상황

### 1. 스키마 캐시 문제
```typescript
// 스키마 캐시 문제 해결
export async function fixSchemaCacheIssues() {
  try {
    await forceSchemaRefresh();
    const { data, error } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}
```

### 2. Rate Limiting 처리
```typescript
// 회원가입 Rate Limiting 오류 처리
if (authError.message.includes('56 seconds') || authError.message.includes('rate limit')) {
  return NextResponse.json(
    { 
      error: '회원가입 요청이 너무 빈번합니다. 1분 후에 다시 시도해주세요.',
      code: 'RATE_LIMIT',
      retryAfter: 60
    },
    { status: 429 }
  );
}
```

### 3. 중복 사용자 처리
```typescript
// 중복 사용자 오류 처리
if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
  return NextResponse.json(
    { 
      error: '이미 등록된 사용자입니다. 다른 아이디를 사용해주세요.',
      code: 'USER_EXISTS'
    },
    { status: 400 }
  );
}
```

## 🔄 복원 시 주의사항

### 1. 데이터베이스 스키마
- `supabase-schema.sql` 파일을 Supabase SQL Editor에서 실행
- RLS 정책이 올바르게 설정되었는지 확인
- 인덱스가 생성되었는지 확인

### 2. 환경 변수 설정
- `.env.local` 파일에 Supabase 연결 정보 설정
- 환경 변수 이름이 정확한지 확인

### 3. 의존성 설치
```bash
npm install
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 데이터베이스 연결 테스트
- `http://localhost:3000/supabase-test` 페이지에서 연결 상태 확인

## 📊 성능 최적화

### 1. 데이터베이스 최적화
- 인덱스 생성
- RLS 정책 최적화
- 쿼리 성능 개선

### 2. API 최적화
- Supabase 클라이언트 캐싱
- 쿼리 최적화
- 에러 처리 개선

### 3. 캐싱 전략
- Supabase 클라이언트 캐싱
- 브라우저 캐싱
- API 응답 캐싱

## 🚀 배포 가이드

### 1. Vercel 배포
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포

### 2. 수동 배포
```bash
npm run build
npm start
```

## 📚 추가 리소스

### 1. 관련 파일
- `supabase-schema.sql`: 데이터베이스 스키마
- `lib/supabase.ts`: Supabase 클라이언트 설정
- `lib/schema-utils.ts`: 스키마 캐시 유틸리티

### 2. 디버깅 도구
- `http://localhost:3000/supabase-test`: Supabase 연결 테스트
- `emergency-schema-fix.sql`: 긴급 스키마 수정

---

**이 문서는 프로젝트의 API 구조와 핵심 로직을 상세히 기록하여 향후 복원 시 참고할 수 있도록 작성되었습니다.**
