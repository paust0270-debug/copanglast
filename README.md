# 🎯 쿠팡 순위 체킹기 v1.0 - 최종 완성체

[![GitHub](https://img.shields.io/github/license/paust0270-debug/coupang-rank-checker)](https://github.com/paust0270-debug/coupang-rank-checker)
[![Node.js](https://img.shields.io/node/v/playwright)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-27.0.0-blue)](https://electronjs.org/)

## 📋 개요
쿠팡에서 특정 상품의 검색 순위를 자동으로 체킹하는 고성능 도구입니다.  
GUI 버전과 콘솔 버전을 모두 제공하며, 실시간 모니터링과 통계 기능을 포함합니다.

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/paust0270-debug/coupang-rank-checker.git
cd coupang-rank-checker
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Playwright 브라우저 설치
```bash
npx playwright install
```

### 4. 실행
```bash
# GUI 버전 (권장)
npm start

# 또는 배치 파일 실행
쿠팡_순위_체킹기_GUI_실행.bat
```

## 🚀 실행 방법

### 1. GUI 버전 (권장)
```bash
# 더블클릭으로 실행
쿠팡_순위_체킹기_GUI_실행.bat
```

**특징:**
- ✅ 시작/중지 버튼이 있는 아름다운 GUI
- ✅ 실시간 로그 출력
- ✅ 진행 상황 표시
- ✅ 통계 정보 제공
- ✅ 키보드 단축키 지원 (Ctrl+S: 시작, Ctrl+Q: 중지)

### 2. 콘솔 버전
```bash
# 더블클릭으로 실행
쿠팡_순위_체킹기_실행.bat
```

**특징:**
- ✅ 빠른 실행
- ✅ 상세한 로그 출력
- ✅ 순위 결과 표시

## 📦 검색 상품 목록

현재 설정된 검색 상품:

1. **이동식 트롤리** (상품번호: `8473798698`)
2. **자전거 자물쇠** (상품번호: `7446595001`)
3. **자전거 라이트** (상품번호: `8188782600`)

## ⚡ 주요 기능

- **고속 검색**: 최적화된 네트워크 설정으로 빠른 검색
- **깊은 탐색**: 최대 20페이지 (약 1000개 상품)까지 탐색
- **정확한 순위**: 중복 제거 및 정확한 순위 계산
- **안정성**: HTTP/2 비활성화로 연결 안정성 확보
- **실시간 모니터링**: 진행 상황 및 통계 실시간 표시

## 🔧 기술 스택

- **Playwright**: 브라우저 자동화
- **Electron**: GUI 애플리케이션
- **Node.js**: 백엔드 실행 환경

## 📊 성능 최적화

- **리소스 차단**: 불필요한 이미지, 폰트, 추적 스크립트 차단
- **빠른 로딩**: 600ms 대기 시간으로 최적화
- **병렬 처리**: 효율적인 페이지 탐색
- **메모리 관리**: 중복 제거 및 효율적인 데이터 구조

## 🎯 사용법

1. **GUI 버전 사용 시:**
   - `쿠팡_순위_체킹기_GUI_실행.bat` 더블클릭
   - "🚀 시작하기" 버튼 클릭
   - 실시간 로그 확인
   - "⏹️ 중지하기" 버튼으로 언제든 중지 가능

2. **콘솔 버전 사용 시:**
   - `쿠팡_순위_체킹기_실행.bat` 더블클릭
   - 자동으로 검색 시작
   - 콘솔에서 결과 확인

## 📈 결과 예시

```
🎯 "이동식 트롤리" 페이지 1에서 타겟 상품 발견! 전체 순위: 5
🎉 결과: 상품번호 8473798698은 "이동식 트롤리" 검색결과에서 5위입니다.

📊 고속 검색 통계: 1페이지 확인, 44개 상품 수집
```

## 🛠️ 문제 해결

### 일반적인 문제들:

1. **브라우저가 열리지 않는 경우:**
   - Playwright 브라우저 설치: `npx playwright install`

2. **검색이 느린 경우:**
   - 인터넷 연결 상태 확인
   - 방화벽 설정 확인

3. **상품을 찾지 못하는 경우:**
   - 상품번호 확인
   - 키워드 정확성 확인

## 📁 프로젝트 구조

```
CoupangRankChecker/
├── 📄 main.js                    # Electron 메인 프로세스
├── 📄 index.html                 # GUI 인터페이스
├── 📄 optimized_fast_checker_gui.js  # GUI용 순위 체킹 엔진
├── 📄 test_new_3_products_final.js  # 콘솔용 순위 체킹 엔진
├── 📄 package.json               # 프로젝트 설정
├── 📄 package-gui.json           # GUI 빌드 설정
├── 📁 database/                  # 데이터베이스 파일
│   ├── 📄 products.json          # 상품 및 검색 기록
│   └── 📄 README.md              # 데이터베이스 설명
├── 📁 dist/                      # 빌드 결과물
└── 📄 *.bat                      # 실행 배치 파일
```

## 🔧 개발 환경 설정

### 필수 요구사항
- **Node.js**: v16.0.0 이상
- **npm**: v8.0.0 이상
- **Windows**: 10 이상 (권장)

### 개발 도구 설치
```bash
# 프로젝트 클론
git clone https://github.com/paust0270-debug/coupang-rank-checker.git
cd coupang-rank-checker

# 의존성 설치
npm install

# Playwright 브라우저 설치
npx playwright install chromium

# 개발 모드 실행
npm start
```

### 빌드 및 배포
```bash
# Windows 실행 파일 생성
npm run build

# 배포용 패키지 생성
npm run dist
```

## 📊 데이터베이스

프로젝트는 JSON 기반 데이터베이스를 사용합니다:

- **상품 정보**: 검색할 상품들의 목록
- **검색 기록**: 과거 검색 결과 및 순위 변화
- **설정 정보**: 애플리케이션 설정값

자세한 내용은 [`database/README.md`](database/README.md)를 참조하세요.

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [`LICENSE`](LICENSE) 파일을 참조하세요.

## 🎉 완성!

최종 완성체 v1.0이 완성되었습니다! 
GUI 버전과 콘솔 버전 모두 제공되며, 사용자의 편의에 따라 선택하여 사용할 수 있습니다.

## 📞 지원 및 문의

- **GitHub Issues**: [이슈 보고](https://github.com/paust0270-debug/coupang-rank-checker/issues)
- **개발자**: paust0270-debug
- **버전**: v1.0
- **최종 업데이트**: 2024-01-15

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!