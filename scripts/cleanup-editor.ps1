# Editor Cleanup Script (PowerShell)
# Removes unused files from features/editor

Write-Host "🧹 Cleaning up unused editor files..." -ForegroundColor Cyan

# Delete unused components
Write-Host "Deleting unused components..." -ForegroundColor Yellow
Remove-Item -Path "features/editor/components/ProductSelectionModal.tsx" -ErrorAction SilentlyContinue
Remove-Item -Path "features/editor/components/ProgramSelector.tsx" -ErrorAction SilentlyContinue

# Delete unused prompts
Write-Host "Deleting unused prompts..." -ForegroundColor Yellow
Remove-Item -Path "features/editor/prompts/sectionPrompts.ts" -ErrorAction SilentlyContinue

# Delete unused types
Write-Host "Deleting unused types..." -ForegroundColor Yellow
Remove-Item -Path "features/editor/types/editor.ts" -ErrorAction SilentlyContinue

# Remove empty prompts folder if it exists
if (Test-Path "features/editor/prompts") {
    $items = Get-ChildItem "features/editor/prompts" -ErrorAction SilentlyContinue
    if ($null -eq $items -or $items.Count -eq 0) {
        Write-Host "Removing empty prompts folder..." -ForegroundColor Yellow
        Remove-Item -Path "features/editor/prompts" -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Files deleted:" -ForegroundColor Cyan
Write-Host "  - ProductSelectionModal.tsx"
Write-Host "  - ProgramSelector.tsx"
Write-Host "  - sectionPrompts.ts"
Write-Host "  - editor.ts"
Write-Host ""
Write-Host "⚠️  Please verify no broken imports with:" -ForegroundColor Yellow
Write-Host "  Select-String -Pattern 'ProductSelectionModal|ProgramSelector|sectionPrompts' -Path features/,pages/ -Recurse"

