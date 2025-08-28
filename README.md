# 🚀 쿠팡 랭킹 체커

쿠팡 상품의 검색 랭킹을 실시간으로 모니터링하고 추적하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🔍 **상품 랭킹 모니터링**: 특정 키워드로 검색했을 때의 상품 순위 추적
- 📊 **랭킹 변화 분석**: 상품의 순위 변화를 시각적으로 표시
- 🕒 **자동 체크**: 정기적으로 랭킹을 자동으로 확인
- 💾 **데이터 저장**: Supabase를 통한 안전한 데이터 저장
- 📱 **반응형 UI**: 모바일과 데스크톱에서 모두 사용 가능

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (권장)

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

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 Supabase 설정을 추가하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📖 사용 방법

### 상품 추가
1. "새 상품 추가" 섹션에서 쿠팡 상품 ID 입력
2. 검색할 키워드 입력
3. "상품 추가" 버튼 클릭

### 랭킹 체크
1. 개별 상품의 "랭킹 체크" 버튼 클릭
2. 또는 "일괄 체크" 버튼으로 모든 상품 한 번에 체크

### 랭킹 모니터링
- 현재 랭킹과 이전 랭킹 비교
- 랭킹 변화를 색상으로 표시 (▲ 상승, ▼ 하락)
- 마지막 체크 시간 표시

## 🔧 개발 가이드

자세한 개발 가이드는 [SETUP.md](./SETUP.md)를 참조하세요.

### 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 메인 페이지
├── components/          # React 컴포넌트
│   ├── CoupangRankChecker.tsx  # 메인 기능
│   ├── SupabaseTest.tsx        # 연결 테스트
│   └── ui/             # shadcn/ui 컴포넌트
└── lib/                # 유틸리티 및 설정
    └── supabase.ts     # Supabase 클라이언트
```

## 📊 데이터베이스 스키마

### products 테이블
- `id`: 고유 식별자
- `user_id`: 사용자 ID
- `product_id`: 쿠팡 상품 ID
- `keyword`: 검색 키워드
- `current_rank`: 현재 랭킹
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

### rank_history 테이블
- `id`: 고유 식별자
- `product_id`: 상품 ID
- `rank`: 랭킹
- `checked_at`: 체크 시간

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

문제가 있거나 질문이 있으시면:
- [Issues](../../issues) 페이지에 이슈 생성
- 개발팀에 직접 문의

---

**쿠팡 랭킹 체커로 상품 순위를 효과적으로 관리하세요! 🎯**
