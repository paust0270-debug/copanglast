# Vercel 배포 가이드

## 환경 변수 설정

Vercel에서 배포하기 전에 다음 환경 변수들을 설정해야 합니다:

### 1. Vercel 대시보드에서 환경 변수 설정

1. Vercel 대시보드에 로그인
2. 프로젝트 선택
3. Settings → Environment Variables 이동
4. 다음 환경 변수들을 추가:

```
NEXT_PUBLIC_SUPABASE_URL=https://cwsdvgkjptuvbdtxcejt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2R2Z2tqcHR1dmJkdHhjZWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTQ0MzksImV4cCI6MjA3MTk3MDQzOX0.kSKAYjtFWoxHn0PNq6mAZ2OEngeGR7i_FW3V75Hrby8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3c2R2Z2tqcHR1dmJkdHhjZWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NDQzOSwiZXhwIjoyMDcxOTcwNDM5fQ.KOOooT-vz-JW2rcdwJdQdirePPIERmYWR4Vqy2v_2NY
```

### 2. 환경 변수 설명

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키 (클라이언트용)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키 (서버용)

### 3. 배포 후 확인사항

1. 빌드가 성공적으로 완료되는지 확인
2. 애플리케이션이 정상적으로 로드되는지 확인
3. 데이터베이스 연결이 정상적으로 작동하는지 확인

## 문제 해결

### 빌드 오류: "supabaseUrl is required"

이 오류는 환경 변수가 설정되지 않았을 때 발생합니다. 위의 환경 변수들을 Vercel에서 설정한 후 다시 배포하세요.

### 환경 변수 설정 방법

1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. 각 환경 변수를 개별적으로 추가
3. Production, Preview, Development 환경 모두에 설정
4. 저장 후 재배포
