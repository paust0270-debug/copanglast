# 쿠팡 랭킹 체커 (Cupang Ranking Checker)

쿠팡 상품의 랭킹을 추적하고 관리하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **작업 등록**: 새로운 키워드와 상품 링크로 슬롯 등록
- **고객 관리**: 등록된 고객과 작업 상태 관리
- **랭킹 추적**: 현재 순위와 시작 순위 비교
- **슬롯 관리**: 사용 가능한 슬롯 수량 관리
- **데이터 영구 저장**: Supabase를 통한 클라우드 데이터베이스 연동

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (권장)

## 📋 사전 요구사항

- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정

## 🚀 빠른 시작

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd cupang-ranking-checker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 설정

#### 3.1 Supabase 프로젝트 생성
1. [https://supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 API 키 복사

#### 3.2 환경 변수 설정
프로젝트 루트에 `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 3.3 데이터베이스 스키마 생성
1. Supabase 대시보드 → SQL Editor
2. `supabase-schema.sql` 파일 내용 복사하여 실행

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📁 프로젝트 구조

```
cupang-ranking-checker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── coupangapp/        # 쿠팡APP 관련 페이지
│   │   │   ├── add/          # 작업 등록 페이지
│   │   │   ├── edit/         # 작업 편집 페이지
│   │   │   └── page.tsx      # 메인 목록 페이지
│   │   ├── admin/            # 관리자 페이지
│   │   └── api/              # API 라우트
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   └── SupabaseTest.tsx  # Supabase 연결 테스트
│   └── lib/                   # 유틸리티 및 설정
│       └── supabase.ts        # Supabase 클라이언트
├── supabase-schema.sql        # 데이터베이스 스키마
├── SUPABASE_SETUP.md          # Supabase 설정 가이드
└── README.md                  # 이 파일
```

## 🔧 주요 컴포넌트

### 작업 등록 페이지 (`/coupangapp/add`)
- 새로운 키워드와 상품 링크로 슬롯 등록
- 작업 그룹 및 장비 그룹 설정
- 메모 및 추가 정보 입력

### 고객 목록 페이지 (`/coupangapp`)
- 등록된 모든 고객 작업 목록
- 상태별 필터링 및 검색
- 작업 편집 및 삭제

### Supabase 테스트 (`/supabase-test`)
- 데이터베이스 연결 상태 확인
- 고객 추가/조회 테스트
- 환경 변수 설정 확인

## 🗄️ 데이터베이스 스키마

### customers 테이블
- `id`: 고유 식별자
- `name`: 고객명 (자동 생성)
- `keyword`: 검색 키워드
- `link_url`: 상품 링크
- `slot_count`: 슬롯 수량
- `work_group`: 작업 그룹 (공통, VIP, 프리미엄, 기본)
- `equipment_group`: 장비 그룹 (지정안함, 그룹A, 그룹B, 그룹C)
- `status`: 작업 상태 (작동중, 만료, 정지)
- `created_at`: 생성일시
- `updated_at`: 수정일시

## 🔐 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 API 키 | ✅ |

## 🧪 테스트

### Supabase 연결 테스트
```bash
# 개발 서버 실행 후
http://localhost:3000/supabase-test
```

### 작업 등록 테스트
1. `/coupangapp/add` 페이지 접속
2. 폼 작성 후 "작업등록" 버튼 클릭
3. 새로고침 후 데이터 유지 확인

## 🚀 배포

### Vercel 배포 (권장)
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포

### 수동 배포
```bash
npm run build
npm start
```

## 🐛 문제 해결

### 환경 변수 오류
```
Error: Missing Supabase environment variables
```
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 개발 서버 재시작

### 데이터베이스 연결 오류
```
Error: Invalid API key
```
- Supabase URL과 API 키가 정확한지 확인
- 프로젝트가 활성 상태인지 확인

### RLS 정책 오류
```
Error: new row violates row-level security policy
```
- SQL Editor에서 RLS 정책이 제대로 생성되었는지 확인
- `supabase-schema.sql` 재실행

## 📚 추가 문서

- [Supabase 설정 가이드](./SUPABASE_SETUP.md)
- [데이터베이스 스키마](./supabase-schema.sql)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. Supabase 대시보드 로그 확인
3. 환경 변수 설정 재확인
4. 데이터베이스 스키마 재생성

---

**Happy Coding! 🎉**



