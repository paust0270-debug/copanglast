# 쿠팡 상품 순위체크 서비스

쿠팡에서 특정 키워드로 검색했을 때 상품의 순위를 모니터링하고 추적하는 웹 서비스입니다.

## 🚀 주요 기능

- **상품 순위 모니터링**: 특정 키워드로 검색했을 때의 상품 순위 추적
- **사용자 관리**: 개인별 상품 모니터링 목록 관리
- **순위 변화 알림**: 순위 변동 시 사용자에게 알림
- **데이터 시각화**: 순위 변화 추이를 차트로 표시

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Crawling**: Playwright/Puppeteer
- **Code Quality**: ESLint, Prettier, Husky

## 📋 요구사항

- Node.js 20.17.0 이상
- npm 또는 yarn

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd cupang-ranking-checker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
cupang-ranking-checker/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 컴포넌트
│   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   └── ...             # 커스텀 컴포넌트
│   ├── lib/                 # 유틸리티 함수
│   └── types/               # TypeScript 타입 정의
├── .taskmaster/             # Task Master 설정
├── .husky/                  # Git hooks
└── ...
```

## 🧪 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 검사
- `npm run lint:fix` - ESLint 문제 자동 수정
- `npm run format` - Prettier 코드 포맷팅
- `npm run format:check` - 포맷팅 문제 확인

## 🔧 개발 환경 설정

### 코드 품질 도구

- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **Husky**: Git hooks
- **lint-staged**: 커밋 전 자동 코드 검사

### Git Hooks

프로젝트는 Husky를 사용하여 Git hooks를 설정합니다:

- **pre-commit**: 커밋 전 자동으로 ESLint와 Prettier 실행

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
