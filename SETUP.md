# 🚀 쿠팡 랭킹 체커 설정 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Coupang API Configuration (선택사항)
COUPANG_API_KEY=your_coupang_api_key_here
COUPANG_SECRET_KEY=your_coupang_secret_key_here
```

### Supabase 설정 방법:

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트 생성
2. 프로젝트 설정 → API에서 URL과 anon key 복사
3. `.env.local` 파일에 붙여넣기

## 2. 개발 서버 실행

```bash
# 의존성 설치 (이미 설치되어 있음)
npm install

# 개발 서버 실행
npm run dev
```

## 3. 브라우저에서 확인

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

## 4. 현재 구현된 기능

✅ **완료된 기능:**
- 기본 UI 레이아웃
- 상품 추가/삭제
- 랭킹 체크 (시뮬레이션)
- Supabase 연결 상태 확인

🔄 **다음 단계:**
- 실제 쿠팡 API 연동
- Supabase 데이터베이스 연동
- 랭킹 히스토리 저장
- 자동 체크 스케줄링

## 5. 문제 해결

### Supabase 연결 오류
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 컴포넌트 오류
- `npm run dev` 실행 후 브라우저 새로고침
- 개발자 도구 콘솔에서 오류 메시지 확인

## 6. 개발 팁

- 코드 변경 시 자동으로 브라우저가 새로고침됩니다
- TypeScript 오류는 VS Code에서 실시간으로 확인 가능
- Tailwind CSS 클래스는 자동완성 지원

---

**질문이나 문제가 있으면 이슈를 생성하거나 개발팀에 문의하세요!**
