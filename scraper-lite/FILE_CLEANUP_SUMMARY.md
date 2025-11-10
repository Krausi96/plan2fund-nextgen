# File Cleanup Summary

## Root Directory Files

### Keep (Essential):
- `unified-scraper.ts` - Main entry point
- `README.md` - Main documentation
- `run-cycles.ps1` - Utility script

### Consolidate/Delete:
- `DASHBOARD_PROPOSAL.md` - Can be merged into README or dashboard/README.md
- `FULL_CYCLE_TEST_REPORT.md` - Can be merged into README or deleted (outdated)
- `TEST_RESULTS.md` - Can be merged into README or deleted (outdated)
- `LOGIN_SETUP.md` - Keep (useful reference)

## Test Directory

### Keep (Reusable):
- `test/reusable/` - All files (useful monitoring tools)
- `test/manage-blacklist.ts` - Useful utility
- `test/db-status.ts` - Useful utility

### Delete (Outdated/Redundant):
- `test/analyze-test-files.ts` - Redundant with reusable tools
- `test/full-cycle-demo.ts` - Redundant (use unified-scraper.ts)
- `test/learn-requirement-patterns.ts` - Merged into auto-learning.ts
- `test/test-merged-learning.ts` - Test file, no longer needed
- `test/test-next-batch-features.ts` - Test file, no longer needed
- `test/test-small-batch.ts` - Test file, no longer needed
- `test/show-full-cycle-status.ts` - Redundant with dashboard
- `test/fix-category-names.ts` - One-time fix, can delete
- `test/normalize-funding-types.ts` - One-time fix, can delete
- `test/recheck-blacklist.ts` - Redundant (use manage-blacklist.ts)

### Keep (One-time utilities):
- `test/one-time/` - Keep for reference but mark as archived

## Docs Directory

### Keep:
- `docs/ARCHITECTURE.md` - Important reference
- `docs/DOCUMENTATION.md` - Main docs
- `docs/FORCE_UPDATE_USAGE.md` - Useful reference
- `docs/INVALID_FUNDING_TYPES_EXPLANATION.md` - Useful reference

## Dashboard Directory

### Keep:
- All files (newly created, essential)

## Action Plan

1. Delete redundant test files
2. Merge outdated reports into README
3. Keep all docs (they're useful)
4. Consolidate root markdown files

