@echo off
title Supabase 연동 24시간 연속 순위 체킹기 v1.0
echo.
echo ========================================
echo  Supabase 연동 24시간 연속 순위 체킹기 v1.0
echo ========================================
echo.
echo 🎯 Supabase DB에서 작업 목록을 지속적으로 처리합니다.
echo.
echo 📋 처리 과정:
echo    1. keywords 테이블에서 작업 목록 조회 (id 오름차순)
echo    2. slot_type별로 플랫폼 구분 (coupang, naver, 11st)
echo    3. 각 플랫폼별 순위 체킹 수행
echo    4. URL에서 상품번호 추출하여 해당 상품 순위 검색
echo    5. slot_status 테이블에 결과 저장
echo    6. 처리된 키워드 삭제
echo    7. 작업 목록이 비어있으면 10초 대기 후 재조회
echo.
echo 🔧 지원 플랫폼:
echo    - 쿠팡 (coupang): 완전 구현
echo    - 네이버 (naver): 스텁 구현 (향후 확장)
echo    - 11번가 (11st): 스텁 구현 (향후 확장)
echo.
echo ⚠️  주의사항:
echo    - .env 파일에 Supabase 연결 정보가 설정되어 있어야 합니다
echo    - Ctrl+C로 안전하게 종료할 수 있습니다
echo    - 24시간 무중단 실행을 위해 안정적인 네트워크 연결이 필요합니다
echo.
echo 🚀 시작하려면 아무 키나 누르세요...
pause >nul
echo.
echo ⚡ 24시간 연속 순위 체킹을 시작합니다...
echo.

cd /d "%~dp0"

REM 환경 변수 확인
if not exist ".env" (
    echo ❌ .env 파일이 없습니다!
    echo.
    echo 📝 .env 파일을 생성하고 다음 내용을 추가하세요:
    echo.
    echo SUPABASE_URL=your_supabase_url_here
    echo SUPABASE_ANON_KEY=your_supabase_anon_key_here
    echo TARGET_PRODUCT_ID=8617045901
    echo NODE_ENV=production
    echo.
    pause
    exit /b 1
)

REM Node.js 설치 확인
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다!
    echo.
    echo 📥 Node.js를 설치한 후 다시 실행하세요.
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 의존성 확인
if not exist "node_modules" (
    echo 📦 의존성 패키지를 설치합니다...
    npm install
    if errorlevel 1 (
        echo ❌ 패키지 설치 실패!
        pause
        exit /b 1
    )
)

REM 메인 스크립트 실행
echo 🚀 24시간 연속 순위 체킹기 시작...
echo.
node continuous-rank-checker.js

echo.
echo 🏁 순위 체킹이 완료되었습니다!
echo.
echo 결과를 확인하려면 아무 키나 누르세요...
pause >nul

