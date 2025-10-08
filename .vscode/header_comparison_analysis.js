const fs = require('fs');
const path = require('path');

// 우리 스크립트에서 수집된 헤더 (log에서 추출)
const ourScriptHeaders = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "sec-ch-ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\", \"Google Chrome\";v=\"120\"",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-ch-ua-mobile": "?0",
  "accept-language": "ko-KR,ko;q=0.9,en;q=0.8"
};

// 사용자가 수동 추출한 헤더
const manualBrowserHeaders = {
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
  "sec-ch-ua-platform": "\"Android\"",
  "sec-ch-ua-mobile": "?1",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
};

// ljc.coupang.com 요청을 추출
const ljcRequests = [];

const logData = JSON.parse(fs.readFileSync(path.join(__dirname, 'logs_2025-10-03T06-18-12-113Z', 'network_requests.log'), 'utf8'));

logData.forEach(entry => {
  if (entry.url && entry.url.includes('ljc.coupang.com/api/v2/submit')) {
    ljcRequests.push({
      timestamp: entry.timestamp,
      method: entry.method,
      headers: entry.headers,
      status: entry.status
    });
  }
});

// network_requests.json 파일 생성
fs.writeFileSync(
  path.join(__dirname, 'network_requests.json'),
  JSON.stringify(ljcRequests, null, 2)
);

// 헤더 차이점 분석
const headerDifferences = [];

Object.keys(manualBrowserHeaders).forEach(header => {
  const ourValue = ourScriptHeaders[header];
  const manualValue = manualBrowserHeaders[header];
  
  if (ourValue !== manualValue) {
    headerDifferences.push({
      header,
      ourValue,
      manualValue,
      difference: `${ourValue} !== ${manualValue}`
    });
  }
});

// 리포트 생성
const reportContent = `
# 쿠팡 네트워크 헤더 비교 분석 리포트

## 분석 대상
- **요청**: \`https://ljc.coupang.com/api/v2/submit?appCode=coupang&market=KR\`
- **분석 시간**: ${new Date().toISOString()}

## 헤더 차이점 분석

### 1. User-Agent 차이
- **우리 스크립트**: \`${ourScriptHeaders["user-agent"]}\`
- **수동 브라우저**: \`${manualBrowserHeaders["user-agent"]}\`
- **차이점**: 데스크톱 Chrome 120 vs 모바일 Android Chrome 140

### 2. sec-ch-ua 차이
- **우리 스크립트**: \`${ourScriptHeaders["sec-ch-ua"]}\`
- **수동 브라우저**: \`${manualBrowserHeaders["sec-ch-ua"]}\`
- **차이점**: 브라우저 버전 및 브랜드 문자열 다름

### 3. sec-ch-ua-platform 차이
- **우리 스크립트**: \`${ourScriptHeaders["sec-ch-ua-platform"]}\`
- **수동 브라우저**: \`${manualBrowserHeaders["sec-ch-ua-platform"]}\`
- **차이점**: Windows vs Android

### 4. sec-ch-ua-mobile 차이
- **우리 스크립트**: \`${ourScriptHeaders["sec-ch-ua-mobile"]}\`
- **수동 브라우저**: \`${manualBrowserHeaders["sec-ch-ua-mobile"]}\`
- **차이점**: 모바일 여부 (0 vs 1)

### 5. accept-language 차이
- **우리 스크립트**: \`${ourScriptHeaders["accept-language"]}\`
- **수동 브라우저**: \`${manualBrowserHeaders["accept-language"]}\`
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
`;

// 리포트 파일 생성
fs.writeFileSync(path.join(__dirname, 'report.md'), reportContent);

console.log('✅ 분석 완료!');
console.log(`📁 network_requests.json 파일 생성됨 (${ljcRequests.length}개 요청)`);
console.log('📁 report.md 파일 생성됨');
console.log(`🔍 총 ${headerDifferences.length}개 헤더 차이점 발견`);
