
# 쿠팡 네트워크 헤더 비교 분석 리포트

## 분석 대상
- **요청**: `https://ljc.coupang.com/api/v2/submit?appCode=coupang&market=KR`
- **분석 시간**: 2025-10-03T08:27:48.418Z

## 헤더 차이점 분석

### 1. User-Agent 차이
- **우리 스크립트**: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
- **수동 브라우저**: `Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36`
- **차이점**: 데스크톱 Chrome 120 vs 모바일 Android Chrome 140

### 2. sec-ch-ua 차이
- **우리 스크립트**: `"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"`
- **수동 브라우저**: `"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"`
- **차이점**: 브라우저 버전 및 브랜드 문자열 다름

### 3. sec-ch-ua-platform 차이
- **우리 스크립트**: `"Windows"`
- **수동 브라우저**: `"Android"`
- **차이점**: Windows vs Android

### 4. sec-ch-ua-mobile 차이
- **우리 스크립트**: `?0`
- **수동 브라우저**: `?1`
- **차이점**: 모바일 여부 (0 vs 1)

### 5. accept-language 차이
- **우리 스크립트**: `ko-KR,ko;q=0.9,en;q=0.8`
- **수동 브라우저**: `ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7`
- **차이점**: 언어 우선순위 세부사항 다름

## 요약
- 총 5개의 주요 헤더에서 차이점 발견
- 플랫폼: 데스크톱 vs 모바일
- 브라우저 버전: Chrome 120 vs Chrome 140
- 운영체제: Windows vs Android

## 권장사항
모바일 환경 시뮬레이션을 위해 다음 헤더 업데이트 필요:
- User-Agent를 Android Chrome으로 변경
- sec-ch-ua-platform을 "Android"로 변경
- sec-ch-ua-mobile을 "?1"로 변경
