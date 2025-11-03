@echo off
REM Full automatic cycle - runs discovery, scraping, learning, quality checks
REM Usage: run-cycle.bat

echo ========================================
echo FULLY AUTOMATIC SCRAPER CYCLE
echo ========================================
echo.

REM Set environment variables
set LITE_ALL_INSTITUTIONS=1
set MAX_CYCLES=10
set SCRAPE_BATCH_SIZE=50
set LITE_MAX_DISCOVERY_PAGES=200

REM Run automatic cycle
echo Starting automatic cycle...
node scripts\automatic\auto-cycle.js

echo.
echo ========================================
echo Cycle complete!
echo ========================================
pause

