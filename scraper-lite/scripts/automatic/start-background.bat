@echo off
REM Start background scraper runner (Windows)
REM Usage: start-background.bat

cd /d "%~dp0"

REM Check if node is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if already running
tasklist /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq background-runner*" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ⚠️  Background runner may already be running
    echo    Check task manager for node.exe processes
)

REM Start in background
start /B node scripts\automatic\background-runner.js

echo ✅ Background runner started
echo    Logs: logs\background-runner.log
echo    Errors: logs\background-runner-errors.log
echo.
echo To stop: Check task manager for node.exe processes
echo To check status: type logs\background-runner.log



