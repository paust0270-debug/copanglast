# 🚨 문제 해결 가이드

## 고객 목록을 불러오는데 실패했습니다 - 해결 방법

### 🔍 1단계: 문제 진단

먼저 Supabase 테스트 페이지에서 정확한 오류를 확인하세요:

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
http://localhost:3000/supabase-test
```

### 🛠️ 2단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**환경 변수 값 찾는 방법:**
1. [https://supabase.com](https://supabase.com)에서 프로젝트 대시보드 접속
2. **Settings** → **API** 클릭
3. **Project URL**과 **anon public** 키 복사

### 🗄️ 3단계: 데이터베이스 스키마 생성

#### 방법 1: 간단한 스키마 (권장)
1. Supabase 대시보드 → **SQL Editor** 클릭
2. `simple-schema.sql` 파일 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

#### 방법 2: 전체 스키마
1. Supabase 대시보드 → **SQL Editor** 클릭
2. `supabase-schema.sql` 파일 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

### 🔄 4단계: 개발 서버 재시작

환경 변수를 변경했다면 반드시 개발 서버를 재시작하세요:

```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

### ✅ 5단계: 테스트

1. `http://localhost:3000/supabase-test` 접속
2. "연결 재테스트" 버튼 클릭
3. "고객 목록 로드" 버튼 클릭
4. "고객 추가 테스트" 버튼 클릭

### 🚨 일반적인 오류와 해결 방법

#### 오류 1: "환경 변수가 설정되지 않았습니다"
**해결:** `.env.local` 파일이 프로젝트 루트에 있는지 확인

#### 오류 2: "customers 테이블이 존재하지 않습니다"
**해결:** `simple-schema.sql`을 Supabase SQL Editor에서 실행

#### 오류 3: "RLS 정책 오류입니다"
**해결:** `simple-schema.sql`에서 RLS를 비활성화했는지 확인

#### 오류 4: "Invalid API key"
**해결:** Supabase 프로젝트가 활성 상태인지 확인

### 🔧 고급 문제 해결

#### Supabase 프로젝트 상태 확인
1. Supabase 대시보드에서 프로젝트 상태 확인
2. 프로젝트가 일시정지되었다면 재시작

#### 네트워크 문제
1. 방화벽이나 프록시 설정 확인
2. 다른 네트워크에서 테스트

#### 데이터베이스 연결 확인
1. Supabase 대시보드 → **Database** → **Connection Pooling**
2. 연결 상태 확인

### 📱 테스트 완료 후

모든 테스트가 성공하면:

1. `http://localhost:3000/coupangapp/add` 접속
2. 새로운 슬롯 등록 시도
3. 새로고침 후에도 데이터가 유지되는지 확인

### 🆘 여전히 문제가 있다면

1. **브라우저 개발자 도구** → **Console** 탭에서 오류 메시지 확인
2. **Supabase 대시보드** → **Logs**에서 서버 오류 확인
3. **환경 변수**가 정확한지 재확인
4. **데이터베이스 스키마**가 제대로 생성되었는지 확인

---

**💡 팁:** `simple-schema.sql`을 먼저 시도해보세요. 이 파일은 RLS를 비활성화하고 간단한 구조로 되어 있어 대부분의 문제를 해결할 수 있습니다.

