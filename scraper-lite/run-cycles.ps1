# Run multiple cycles to accumulate data
# Usage: .\run-cycles.ps1 -cycles 5

param(
    [int]$cycles = 5
)

Write-Host "🔄 Running $cycles full cycles (discover + scrape)..." -ForegroundColor Cyan
Write-Host ""

for ($i = 1; $i -le $cycles; $i++) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "CYCLE $i of $cycles" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    # Discovery + Scraping
    npm run scraper:unified -- full --max=10
    
    Write-Host ""
    Write-Host "✅ Cycle $i complete" -ForegroundColor Green
    Write-Host ""
    
    # Small delay between cycles
    Start-Sleep -Seconds 2
}

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ All $cycles cycles complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

