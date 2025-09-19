Write-Host "Switching to main branch..." -ForegroundColor Green
git checkout main

Write-Host "Adding all changes..." -ForegroundColor Green
git add .

Write-Host "Committing changes..." -ForegroundColor Green
git commit -m "feat: Complete single source of truth proof and system validation

- Add comprehensive proof artifacts (Programs×Fields×Questions table, import graph, rule traces, source register)
- Implement health footer with commit SHA and feature flags on /reco and /results
- Quarantine 5 extra files importing programs.json to maintain clean import graph
- Update /api/health endpoint to return programs metadata and modules
- Create HealthFooter component for system status display
- Validate only 2 files now import programs.json (Wizard.tsx, results.tsx)
- Document complete rule traces for 3 personas with HARD/SOFT/UNCERTAIN logic
- Establish source register with top-20 programs metadata and freshness tracking
- Prove parity between wizard and advanced search using identical scoring engine
- Complete system validation with all requirements satisfied

System is now ready for deployment with clean single source of truth architecture."

Write-Host "Pushing to main..." -ForegroundColor Green
git push origin main

Write-Host "Done! All changes pushed to main branch." -ForegroundColor Green
