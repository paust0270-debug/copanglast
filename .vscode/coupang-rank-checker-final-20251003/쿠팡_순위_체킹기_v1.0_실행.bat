@echo off
title 쿠팡 순위 체킹기 v1.0
color 0A

echo.
echo ================================================
echo           쿠팡 순위 체킹기 v1.0
echo ================================================
echo.
echo 📅 개발일: 2025-01-03
echo 🔧 버전: v1.0
echo 🌐 웹 연동: 지원
echo.
echo ================================================
echo.

echo 📋 실행 전 체크리스트:
echo.
echo 1. 웹 애플리케이션이 실행 중인지 확인
echo    http://localhost:3000
echo.
echo 2. 키워드가 추가되어 있는지 확인
echo    http://localhost:3000/coupangapp/add
echo.
echo 3. Node.js가 설치되어 있는지 확인
echo.

echo 계속하려면 아무 키나 누르세요...
pause >nul

echo.
echo 🚀 순위 체킹을 시작합니다...
echo.

cd "C:\Users\qkrwn\Desktop\Course\Crawling\.vscode\coupang-rank-checker-final-20251003"

echo 📁 작업 디렉토리: %CD%
echo.

node coupang-rank-checker-v1.0.js

echo.
echo ================================================
echo           순위 체킹 완료
echo ================================================
echo.
echo 결과를 확인하려면 웹 애플리케이션을 확인하세요:
echo http://localhost:3000/ranking-status
echo.
echo 종료하려면 아무 키나 누르세요...
pause >nul
