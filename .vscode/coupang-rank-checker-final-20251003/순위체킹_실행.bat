@echo off
echo 🎯 쿠팡 순위 체킹기 - 웹 연동 버전
echo ================================================
echo.
echo 웹 애플리케이션이 실행 중인지 확인하세요:
echo http://localhost:3000
echo.
echo 키워드를 먼저 추가하세요:
echo http://localhost:3000/coupangapp/add
echo.
pause
echo.
echo 순위 체킹을 시작합니다...
echo.
cd "C:\Users\qkrwn\Desktop\Course\Crawling\.vscode\coupang-rank-checker-final-20251003"
node web-integrated-checker.js
echo.
echo 순위 체킹이 완료되었습니다.
pause
