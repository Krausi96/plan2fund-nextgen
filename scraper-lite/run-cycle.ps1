# Full automatic cycle - runs discovery, scraping, learning, quality checks
# Usage: .\run-cycle.ps1

Write-Host "========================================"
Write-Host "FULLY AUTOMATIC SCRAPER CYCLE"
Write-Host "========================================"
Write-Host ""

# Set environment variables
$env:LITE_ALL_INSTITUTIONS=1
$env:MAX_CYCLES=10
$env:SCRAPE_BATCH_SIZE=50
$env:LITE_MAX_DISCOVERY_PAGES=200

# Run automatic cycle
Write-Host "Starting automatic cycle..."
node scripts/automatic/auto-cycle.js

Write-Host ""
Write-Host "========================================"
Write-Host "Cycle complete!"
Write-Host "========================================"


