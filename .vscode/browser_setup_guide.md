# 브라우저 기반 쿠팡 순위 체크 시스템 설정 가이드

## 📋 개요

Zero Rank 프로그램과 동일한 방식으로 **PC 브라우저**를 사용하여 쿠팡 순위를 체크하는 시스템입니다.

### 🎯 핵심 특징
- **PC 브라우저 기반**: 실제 브라우저 창에서 작업
- **모바일 환경 모방**: User-Agent 및 헤더 설정
- **자동화된 워크플로우**: 키워드 → 검색 → 순위 확인 → DB 업데이트
- **실시간 모니터링**: 브라우저 창에서 작업 과정 확인 가능

## 🔧 필요 사항

### 1. Node.js 환경
```bash
# Node.js 18+ 버전
node --version

# 필요한 패키지 설치
npm install puppeteer @supabase/supabase-js dotenv
```

### 2. 브라우저 환경
- **Chrome/Chromium** (Puppeteer 기본)
- **모바일 User-Agent** 설정
- **JavaScript 활성화**

### 3. 네트워크 환경
- **인터넷 연결**
- **모바일 테더링** (IP 변경용, 선택사항)
- **ADB** (모바일 IP 변경용, 선택사항)

## 🚀 사용 방법

### 1. 기본 실행
```bash
# 브라우저 기반 순위 체크 실행
node browser_coupang_rank_checker.js
```

### 2. 실행 과정
```
🚀 브라우저 기반 쿠팡 순위 체크 시작...
📍 현재 IP: 175.223.31.24
🚀 브라우저 초기화 중...
✅ 브라우저 초기화 완료

[2025-10-01 23:31:29] 작업 가져오기...
📋 키워드 작업 가져오기...
✅ 키워드 작업 발견: 무선마우스
🔍 키워드 처리 시작: 무선마우스
🔍 쿠팡 검색: 무선마우스
✅ 쿠팡 검색 페이지 로드 완료: 무선마우스
📦 상품 순위 확인: 8473798698
✅ 상품 순위 확인: 8473798698 - 15위
✅ slot_status 업데이트 완료: 무선마우스
✅ rank_history 저장 완료: 무선마우스
✅ 키워드 처리 완료: 무선마우스 - 15위
⏳ 5초 대기 중...

[2025-10-01 23:31:40] 작업 가져오기...
📋 키워드 작업 가져오기...
📝 처리할 작업 없음
⏳ 10초 후 다음 시작...
```

### 3. 브라우저 창에서 확인
- **Chrome 브라우저** 자동 실행
- **쿠팡 모바일 페이지** 로드
- **검색 결과** 실시간 확인
- **상품 순위** 자동 감지

## ⚙️ 설정 옵션

### 1. 브라우저 설정
```javascript
// browser_coupang_rank_checker.js에서 수정 가능
this.browser = await puppeteer.launch({
  headless: false,        // 브라우저 창 표시
  defaultViewport: null,  // 전체 화면
  args: [
    '--start-maximized',  // 최대화
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ]
});
```

### 2. User-Agent 설정
```javascript
// 모바일 환경 모방
await this.page.setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');
```

### 3. 처리 간격 설정
```javascript
// 키워드 처리 간격 (초)
this.checkInterval = 10000; // 10초

// 처리 후 대기 시간
await new Promise(resolve => setTimeout(resolve, 5000)); // 5초
```

## 🔍 작업 흐름

### 1. 키워드 가져오기
```sql
-- keywords 테이블에서 쿠팡 슬롯 조회
SELECT * FROM keywords 
WHERE slot_type = 'coupang' 
ORDER BY id ASC 
LIMIT 1;
```

### 2. 브라우저 작업
1. **쿠팡 모바일 페이지** 접속
2. **검색어 입력** 및 검색
3. **상품 목록** 로드
4. **특정 상품** 순위 확인

### 3. 데이터베이스 업데이트
```sql
-- slot_status 테이블 업데이트
UPDATE slot_status 
SET current_rank = 15, 
    start_rank = COALESCE(start_rank, 15),
    last_check_date = NOW()
WHERE keyword = '무선마우스' 
AND link_url = 'products/8473798698';

-- rank_history 테이블에 기록
INSERT INTO rank_history (
  slot_status_id, keyword, link_url, 
  current_rank, start_rank, check_date
) VALUES (
  123, '무선마우스', 'products/8473798698',
  15, 15, NOW()
);

-- keywords 테이블에서 삭제
DELETE FROM keywords WHERE id = 456;
```

## 📊 모니터링 및 로깅

### 1. 실시간 로그
```
[2025-10-01 23:31:29.801] (unkn) # 작업 가져오기...
[2025-10-01 23:31:29.983] GetKeywordsForRankCheck: {"status":1}
[2025-10-01 23:31:29.990] (unkn) # 처리할 작업 없음
[2025-10-01 23:31:30.000] (unkn) # 10초 후 다음 시작...
```

### 2. 성공/실패 통계
```javascript
// 처리 결과 통계
const stats = {
  total: this.results.length,
  success: this.results.filter(r => r.success).length,
  failed: this.results.filter(r => !r.success).length
};
```

### 3. 오류 처리
```javascript
// 오류 발생 시 재시도 로직
try {
  await this.processKeyword(keyword);
} catch (error) {
  console.error('❌ 작업 처리 중 오류:', error);
  console.log('⏳ 10초 후 재시도...');
  await new Promise(resolve => setTimeout(resolve, 10000));
}
```

## 🔄 IP 변경 (선택사항)

### 1. 모바일 테더링 설정
```bash
# ADB를 통한 모바일 데이터 재연결
adb shell svc data disable
adb shell svc data enable
```

### 2. IP 변경 주기
```javascript
// 3개 키워드마다 IP 변경
if (i % 3 === 0) {
  console.log('🔄 IP 변경 중...');
  await this.rotateMobileIP();
}
```

### 3. IP 확인
```javascript
// 현재 IP 확인
const response = await fetch('https://ipinfo.io/ip');
const currentIP = await response.text();
console.log(`📍 현재 IP: ${currentIP.trim()}`);
```

## 🛠️ 문제 해결

### 1. 브라우저 실행 문제
```bash
# 문제: Puppeteer 설치 실패
# 해결: Chrome 설치 확인
npm install puppeteer --unsafe-perm=true --allow-root

# 문제: 브라우저 창이 열리지 않음
# 해결: headless: false 설정 확인
```

### 2. 네트워크 연결 문제
```bash
# 문제: 쿠팡 페이지 로드 실패
# 해결: 네트워크 연결 확인
ping m.coupang.com

# 문제: 타임아웃 오류
# 해결: 타임아웃 시간 증가
timeout: 30000
```

### 3. 순위 확인 문제
```javascript
// 문제: 상품을 찾을 수 없음
// 해결: 셀렉터 수정
const productLinks = document.querySelectorAll('a[href*="/products/"]');

// 문제: 순위가 정확하지 않음
// 해결: 페이지 로딩 대기 시간 증가
await this.page.waitForTimeout(3000);
```

## 📈 성능 최적화

### 1. 메모리 사용량 최적화
```javascript
// 페이지 정리
await this.page.close();
await this.browser.newPage();
```

### 2. 네트워크 최적화
```javascript
// 불필요한 리소스 차단
await this.page.setRequestInterception(true);
this.page.on('request', (req) => {
  if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet') {
    req.abort();
  } else {
    req.continue();
  }
});
```

### 3. 처리 속도 최적화
```javascript
// 병렬 처리 (여러 키워드 동시 처리)
const promises = keywords.map(keyword => this.processKeyword(keyword));
const results = await Promise.all(promises);
```

## 🔒 보안 고려사항

### 1. User-Agent 로테이션
```javascript
// 다양한 User-Agent 사용
const userAgents = [
  'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
];
```

### 2. 요청 간격 조정
```javascript
// 자연스러운 사용자 행동 모방
const delay = Math.random() * 2000 + 1000; // 1-3초 랜덤 대기
await new Promise(resolve => setTimeout(resolve, delay));
```

### 3. 프록시 사용 (선택사항)
```javascript
// 프록시 설정
await puppeteer.launch({
  args: ['--proxy-server=http://proxy-server:port']
});
```

## 📞 지원 및 문의

### 1. 일반적인 문제
- **브라우저 실행 문제**: Chrome 설치 및 Puppeteer 설정 확인
- **네트워크 문제**: 인터넷 연결 및 방화벽 설정 확인
- **순위 확인 문제**: 페이지 로딩 시간 및 셀렉터 확인

### 2. 고급 설정
- **성능 최적화**: 메모리 사용량 및 처리 속도 조정
- **안정성 향상**: 오류 처리 및 재시도 로직 개선
- **모니터링**: 실시간 상태 확인 및 알림 설정

---

**주의사항**: 이 시스템은 교육 및 연구 목적으로만 사용해야 합니다. 상업적 목적이나 불법적인 활동에 사용하지 마세요.














