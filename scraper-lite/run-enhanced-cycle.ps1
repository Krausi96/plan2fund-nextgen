# Enhanced cycle with relaxed discovery and quality checks
# Usage: .\scraper-lite\run-enhanced-cycle.ps1

Write-Host "========================================"
Write-Host "ENHANCED SCRAPER CYCLE"
Write-Host "========================================"
Write-Host ""

# Set environment variables for better discovery
$env:LITE_ALL_INSTITUTIONS=1
$env:MAX_CYCLES=3
$env:SCRAPE_BATCH_SIZE=100
$env:LITE_MAX_DISCOVERY_PAGES=500
$env:MIN_NEW_URLS=1

Write-Host "Configuration:"
Write-Host "  - All institutions: ENABLED"
Write-Host "  - Max cycles: 3"
Write-Host "  - Batch size: 100"
Write-Host "  - Max discovery pages: 500"
Write-Host "  - Relaxed URL filtering: ENABLED"
Write-Host ""

# Run automatic cycle
Write-Host "Starting enhanced cycle..."
node scraper-lite/scripts/automatic/auto-cycle.js

Write-Host ""
Write-Host "========================================"
Write-Host "Cycle complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Checking database..."
node scraper-lite/check-db-tables.js

