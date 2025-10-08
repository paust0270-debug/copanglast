@echo off
REM 쿠팡 상품 순위 확인 실행 배치 파일 (Windows)

echo ========================================
echo  쿠팡 상품 순위 확인 도구
echo ========================================
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo    https://nodejs.org 에서 Node.js를 설치하세요.
    pause
    exit /b 1
)

echo ✅ Node.js 확인됨: 
node --version

REM npm 패키지 설치 상태 확인
if not exist "node_modules" (
    echo 📦 npm 패키지 설치 중...
    npm install
    if errorlevel 1 (
        echo ❌ npm install 실패
        pause
        exit /b 1
    )
)

REM Commander 패키지 설치 (필요시)
echo 📦 의존성 패키지 확인 중...
npm install commander >nul 2>&1

REM Playwright 브라우저 설치 상태 확인
echo 🌐 Playwright 브라우저 확인 중...
npx playwright.exe install chromium >nul 2>&1

echo.
echo 🚀 순위 확인 시작...
echo.

REM 기본 상품 번호로 실행
node run_coupang_rank_check.js check

echo.
echo 작업 완료!
pause
