@echo off
setlocal

echo.
echo ========================================
echo 🎯 쿠팡 순위체크 테스트 실행
echo ========================================
echo.

echo 📦 의존성 확인 중...
if not exist node_modules (
    echo 📥 npm install 실행 중...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install 실패
        pause
        exit /b 1
    )
    echo ✅ npm install 완료
) else (
    echo ✅ node_modules 확인됨
)

echo 🎭 Playwright 브라우저 확인 중...
npx playwright install --silent
if %errorlevel% neq 0 (
    echo ❌ Playwright 브라우저 설치 실패
    pause
    exit /b 1
)
echo ✅ Playwright 브라우저 확인됨

echo.
echo 🚀 테스트 실행 옵션을 선택하세요:
echo.
echo 1. 기본 실행 (백그라운드)
echo 2. 브라우저 창 보면서 실행  
echo 3. 디버그 모드
echo 4. 종료
echo.

set /p choice="선택 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🚀 기본 모드로 테스트 실행 중...
    npx playwright test rank_check_test_with_playwright.js
) else if "%choice%"=="2" (
    echo.
    echo 🚀 브라우저 창 보면서 모드로 테스트 실행 중...
    npx playwright test rank_check_test_with_playwright.js --headed
) else if "%choice%"=="3" (
    echo.
    echo 🚀 디버그 모드로 테스트 실행 중...
    echo 💡 브라우저 창에서 수동으로 단계를 진행할 수 있습니다.
    npx playwright test rank_check_test_with_playwright.js --debug
) else if "%choice%"=="4" (
    echo 👋 테스트를 종료합니다.
    exit /b 0
) else (
    echo ❌ 잘못된 선택입니다.
    pause
    exit /b 1
)

echo.
echo ✅ 테스트 완료!
echo 📊 결과는 test-results 폴더에서 확인할 수 있습니다.
echo.

pause
