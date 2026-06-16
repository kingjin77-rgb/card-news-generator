@echo off
chcp 65001 > nul
title 네이버 자동 댓글 시스템

echo ================================
echo  네이버 자동 댓글 자동화 시스템
echo ================================
echo.
echo 1. 즉시 실행 (run)
echo 2. 테스트 실행 (dry-run, 실제 게시 안 함)
echo 3. 스케줄러 시작 (자동 반복)
echo 4. 현황 확인 (status)
echo 5. URL 추가 (add)
echo 0. 종료
echo.
set /p choice=선택 (번호 입력):

if "%choice%"=="1" (
    echo.
    echo [실행 중...] 실제 댓글을 작성합니다.
    node index.js run
)
if "%choice%"=="2" (
    echo.
    echo [테스트 모드] 실제 게시 없이 댓글 생성만 확인합니다.
    node index.js run --dry-run
)
if "%choice%"=="3" (
    echo.
    echo [스케줄러 시작] Ctrl+C 로 종료할 수 있습니다.
    node index.js schedule
)
if "%choice%"=="4" (
    echo.
    node index.js status
    pause
    goto :eof
)
if "%choice%"=="5" (
    echo.
    set /p url=URL 입력:
    node index.js add %url%
    pause
    goto :eof
)
if "%choice%"=="0" exit

pause
