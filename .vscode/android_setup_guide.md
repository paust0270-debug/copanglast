# Android 기반 쿠팡 순위 체크 시스템 설정 가이드

## 📋 필요 사항

### 1. Android 디바이스 또는 에뮬레이터
- **실제 안드로이드 기기** (권장)
- **Android 에뮬레이터** (BlueStacks, Nox, LDPlayer 등)
- **Android Studio 에뮬레이터**

### 2. ADB (Android Debug Bridge)
- **ADB 설치** (Android SDK 포함)
- **USB 디버깅 활성화**
- **개발자 옵션 활성화**

### 3. 쿠팡 앱
- **쿠팡 모바일 앱** 설치
- **최신 버전** 사용 권장

## 🔧 설정 방법

### 1. Android 디바이스 설정

#### 실제 안드로이드 기기
```bash
# 1. 개발자 옵션 활성화
# 설정 > 휴대전화 정보 > 빌드 번호 7번 탭

# 2. USB 디버깅 활성화
# 설정 > 개발자 옵션 > USB 디버깅 체크

# 3. USB로 PC 연결
# USB 케이블로 기기와 PC 연결

# 4. 연결 확인
adb devices
```

#### Android 에뮬레이터
```bash
# BlueStacks 설정
# 1. BlueStacks 실행
# 2. 설정 > 고급 > ADB 활성화
# 3. 포트: 5555

# Nox Player 설정
# 1. Nox Player 실행
# 2. 설정 > 고급 > ADB 디버깅 활성화
# 3. 포트: 62001

# LDPlayer 설정
# 1. LDPlayer 실행
# 2. 설정 > 고급 > ADB 활성화
# 3. 포트: 5555
```

### 2. ADB 설치 및 설정

#### Windows
```bash
# 1. Android SDK Platform Tools 다운로드
# https://developer.android.com/studio/releases/platform-tools

# 2. 압축 해제 후 adb.exe 경로 확인
# 예: C:\platform-tools\adb.exe

# 3. 환경 변수 설정 (선택사항)
# PATH에 platform-tools 폴더 추가
```

#### macOS
```bash
# Homebrew를 통한 설치
brew install android-platform-tools

# 또는 Android Studio 설치 시 자동 포함
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install android-tools-adb

# CentOS/RHEL
sudo yum install android-tools
```

### 3. 연결 테스트

```bash
# 1. ADB 연결 확인
adb devices

# 예상 출력:
# List of devices attached
# emulator-5554    device
# 또는
# ABC123DEF456    device

# 2. 기기 정보 확인
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# 3. IP 확인
adb shell ip route
```

## 🚀 사용 방법

### 1. 기본 실행
```bash
# Node.js 스크립트 실행
node android_coupang_rank_checker.js
```

### 2. 설정 파일 수정
```javascript
// android_coupang_rank_checker.js에서 ADB 경로 수정
class AndroidCoupangRankChecker {
  constructor() {
    this.adbPath = 'C:\\platform-tools\\adb.exe'; // 실제 경로로 변경
    // 또는
    this.adbPath = 'adb'; // PATH에 등록된 경우
  }
}
```

### 3. 에뮬레이터별 설정

#### BlueStacks
```javascript
// BlueStacks 연결
adb connect 127.0.0.1:5555
```

#### Nox Player
```javascript
// Nox Player 연결
adb connect 127.0.0.1:62001
```

#### LDPlayer
```javascript
// LDPlayer 연결
adb connect 127.0.0.1:5555
```

## 📱 쿠팡 앱 설정

### 1. 앱 설치
```bash
# 쿠팡 앱 APK 다운로드 및 설치
adb install coupang.apk

# 또는 Google Play Store에서 설치
```

### 2. 앱 권한 설정
- **위치 정보** 접근 권한
- **네트워크** 접근 권한
- **저장소** 접근 권한

### 3. 앱 설정 확인
```bash
# 앱 패키지명 확인
adb shell pm list packages | grep coupang

# 앱 메인 액티비티 확인
adb shell dumpsys package com.coupang.mobile | grep -A 1 "android.intent.action.MAIN"
```

## 🔍 문제 해결

### 1. ADB 연결 문제
```bash
# 문제: device not found
# 해결: USB 디버깅 재활성화
adb kill-server
adb start-server
adb devices

# 문제: unauthorized
# 해결: 기기에서 USB 디버깅 허용
# 기기 화면에서 "USB 디버깅 허용" 체크
```

### 2. 앱 실행 문제
```bash
# 문제: 앱이 실행되지 않음
# 해결: 앱 패키지명 확인
adb shell pm list packages | grep coupang

# 문제: 앱이 크래시됨
# 해결: 앱 재설치
adb uninstall com.coupang.mobile
adb install coupang.apk
```

### 3. IP 확인 문제
```bash
# 문제: IP를 찾을 수 없음
# 해결: 네트워크 연결 확인
adb shell ping -c 3 8.8.8.8

# 문제: 모바일 데이터 연결 실패
# 해결: 데이터 연결 상태 확인
adb shell dumpsys telephony.registry
```

## 🎯 최적화 팁

### 1. 성능 최적화
```javascript
// 처리 간격 조정
await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 대기

// IP 변경 주기 조정
if (i % 5 === 0) { // 5개마다 IP 변경
  await this.rotateMobileIP();
}
```

### 2. 안정성 향상
```javascript
// 오류 재시도 로직
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 3. 모니터링
```javascript
// 실시간 상태 모니터링
setInterval(async () => {
  const ip = await this.getCurrentIP();
  console.log(`현재 IP: ${ip}`);
}, 30000); // 30초마다 IP 확인
```

## 📊 모니터링 및 로깅

### 1. 실시간 로그
```javascript
// 상세 로그 출력
console.log(`[${new Date().toISOString()}] ${message}`);
```

### 2. 오류 추적
```javascript
// 오류 발생 시 상세 정보 기록
try {
  await operation();
} catch (error) {
  console.error('오류 발생:', {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack
  });
}
```

### 3. 성능 메트릭
```javascript
// 처리 시간 측정
const startTime = Date.now();
await operation();
const endTime = Date.now();
console.log(`처리 시간: ${endTime - startTime}ms`);
```

## 🔒 보안 고려사항

### 1. 네트워크 보안
- **VPN 사용** (선택사항)
- **프록시 설정** (필요시)
- **방화벽 설정** 확인

### 2. 데이터 보호
- **로그 파일 암호화**
- **민감한 정보 마스킹**
- **정기적인 로그 정리**

### 3. 앱 보안
- **앱 서명 확인**
- **권한 최소화**
- **정기적인 앱 업데이트**

## 📞 지원 및 문의

### 1. 일반적인 문제
- **ADB 연결 문제**: USB 케이블 및 드라이버 확인
- **앱 실행 문제**: 앱 버전 및 권한 확인
- **IP 변경 문제**: 모바일 데이터 설정 확인

### 2. 고급 문제
- **성능 최적화**: 처리 간격 및 메모리 사용량 조정
- **안정성 향상**: 오류 처리 및 재시도 로직 개선
- **모니터링**: 실시간 상태 확인 및 알림 설정

---

**주의사항**: 이 시스템은 교육 및 연구 목적으로만 사용해야 합니다. 상업적 목적이나 불법적인 활동에 사용하지 마세요.














