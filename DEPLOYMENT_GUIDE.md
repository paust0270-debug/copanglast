# 배포 가이드 - Coupang Rank Checker Web Application

## 개요
이 가이드는 Coupang Rank Checker 웹 애플리케이션을 다른 서버에 배포하는 방법을 설명합니다.

## 시스템 요구사항

### 필수 요구사항
- **Node.js**: 20.15.0 이상
- **npm**: 10.7.0 이상
- **Supabase 계정**: 데이터베이스 서비스용

### 권장 사양
- **RAM**: 4GB 이상
- **저장공간**: 2GB 이상
- **네트워크**: 안정적인 인터넷 연결

## 설치 단계

### 1. 저장소 클론
```bash
git clone https://github.com/paust0270-debug/copanglast.git
cd copanglast
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인
2. 새 프로젝트 생성
3. 프로젝트 설정에서 API URL과 키 복사

### 4. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**예시:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 데이터베이스 설정

### 1. 테이블 생성
Supabase SQL Editor에서 `DATABASE_SCHEMA_BACKUP.md` 파일의 스키마를 실행하여 테이블을 생성합니다.

### 2. 데이터 복원
백업된 데이터가 있는 경우:

```bash
# 백업 스크립트 실행
node backup-database.js
```

또는 Supabase SQL Editor에서 `database-backup-YYYY-MM-DD.sql` 파일의 내용을 실행합니다.

### 3. Row Level Security (RLS) 설정
모든 테이블에 RLS가 활성화되어 있습니다. 필요에 따라 정책을 조정하세요.

## 빌드 및 배포

### 개발 환경 실행
```bash
npm run dev
```
애플리케이션이 `http://localhost:3000`에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

### 프로덕션 실행
```bash
npm start
```

### Vercel 배포 (권장)
1. [Vercel](https://vercel.com)에 로그인
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 완료

## 주요 기능

### 1. 고객 관리
- 고객 정보 등록 및 수정
- 소속총판 관리
- 슬롯 할당

### 2. 슬롯 관리
- 동적 슬롯 할당
- 사용량 추적
- 만료일 관리

### 3. 순위 체킹
- 키워드 기반 순위 추적
- 히스토리 관리
- 데스크톱 프로그램 연동

### 4. 정산 관리
- 정산 내역 관리
- 상태 추적
- 히스토리 관리

## API 엔드포인트

### 주요 API
- `GET /api/slots` - 슬롯 조회
- `POST /api/slots` - 슬롯 생성
- `GET /api/slot-status` - 슬롯 상태 조회
- `POST /api/slot-status` - 작업 등록
- `GET /api/keywords` - 키워드 조회
- `POST /api/rank-update` - 순위 업데이트
- `GET /api/rank-history` - 순위 히스토리

## 문제 해결

### 일반적인 문제

#### 1. 환경 변수 오류
```
❌ 환경 변수가 설정되지 않았습니다.
```
**해결방법**: `.env.local` 파일이 올바른 위치에 있고 내용이 정확한지 확인

#### 2. 데이터베이스 연결 오류
```
❌ 데이터베이스 연결 실패
```
**해결방법**: Supabase 프로젝트 URL과 키가 올바른지 확인

#### 3. 빌드 오류
```
❌ 빌드 실패
```
**해결방법**: Node.js 버전 확인 및 `npm install` 재실행

### 로그 확인
```bash
# 개발 서버 로그
npm run dev

# 프로덕션 로그
npm start
```

## 보안 고려사항

### 1. 환경 변수 보호
- `.env.local` 파일을 버전 관리에 포함하지 않음
- 프로덕션에서는 환경 변수를 안전하게 관리

### 2. API 키 관리
- Service Role Key는 서버에서만 사용
- Anon Key는 클라이언트에서 사용 가능

### 3. 데이터베이스 보안
- RLS 정책 적절히 설정
- 불필요한 권한 제거

## 모니터링

### 성능 모니터링
- Supabase 대시보드에서 쿼리 성능 확인
- Vercel Analytics 사용 권장

### 오류 모니터링
- 콘솔 로그 확인
- Supabase 로그 확인

## 업데이트 방법

### 1. 코드 업데이트
```bash
git pull origin main
npm install
npm run build
```

### 2. 데이터베이스 마이그레이션
Supabase SQL Editor에서 스키마 변경사항 적용

## 지원 및 문의

### 문서
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)

### 문제 신고
GitHub Issues를 통해 문제를 신고해주세요.

---

**백업 생성일**: 2025-10-13  
**프로젝트 버전**: 1.0.0  
**지원 Node.js 버전**: 20.15.0+
