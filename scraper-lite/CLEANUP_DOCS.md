# Documentation Cleanup - Files to Delete

## Files to Delete (Redundant/Outdated)

### Root Level
- ✅ `MERGE_SUMMARY.md` → Info merged into ARCHITECTURE.md
- ✅ `ARCHITECTURE_ANALYSIS.md` → Outdated (pre-merge), info in ARCHITECTURE.md
- ✅ `IMPROVEMENTS.md` → Historical, info in HISTORY.md
- ✅ `IMPROVEMENTS_SUMMARY.md` → Historical, info in HISTORY.md

### Test Folder
- ✅ `test/README.md` → Info in main README.md
- ✅ `test/ORGANIZATION.md` → Outdated
- ✅ `test/ORGANIZATION_SUMMARY.md` → Redundant
- ✅ `test/ORGANIZATION_COMPLETE.md` → Redundant
- ✅ `test/FINAL_ORGANIZATION.md` → Redundant

### Docs Folder (Historical - Can Archive or Delete)
All files in `docs/` are historical implementation records. Most can be deleted:

**Keep (if useful):**
- `docs/FORCE_UPDATE_USAGE.md` - Usage guide
- `docs/INVALID_FUNDING_TYPES_EXPLANATION.md` - Technical explanation

**Delete (historical):**
- `docs/TEST_RESULTS*.md` - Old test results
- `docs/IMPLEMENTATION_*.md` - Completed implementation plans
- `docs/CLEANUP_*.md` - Completed cleanup plans
- `docs/CRITICAL_ANALYSIS.md` - Old analysis
- `docs/404_AND_PERFORMANCE_FIXES.md` - Fixed issues
- `docs/PERFORMANCE_AND_404_FIXES.md` - Duplicate
- `docs/ALL_IMPROVEMENTS_IMPLEMENTED.md` - Completed
- `docs/BLACKLIST_AND_DISCOVERY_IMPLEMENTATION.md` - Completed
- `docs/URL_DISCOVERY_CLARIFICATION.md` - Clarified
- `docs/FUNDING_TYPES_AND_BLACKLIST_ANALYSIS.md` - Completed
- `docs/FOOLPROOF_BLACKLIST_AND_DEADLINE_FILTERING.md` - Completed
- `docs/OVERVIEW_PAGES_AND_RECRAPING.md` - Completed
- `docs/RECO_AND_SCRAPER_INTEGRATION.md` - Completed
- `docs/COMPREHENSIVE_CATEGORY_ANALYSIS.md` - Completed
- `docs/IMPROVEMENTS_AND_GOALS.md` - Completed

## Final Documentation Structure

```
scraper-lite/
├── README.md                    # Main documentation (comprehensive)
├── ARCHITECTURE.md              # Architecture overview
├── HISTORY.md                   # Historical decisions
├── INTEGRATION_COMPLETE.md     # Integration status
├── TEST_FILES_ANALYSIS.md      # Test files organization
├── AUTOMATED_IMPROVEMENTS.md   # Automation status
└── docs/                       # (Optional) Archive historical docs
```

## Commands to Delete

```bash
# Root level
rm scraper-lite/MERGE_SUMMARY.md
rm scraper-lite/ARCHITECTURE_ANALYSIS.md
rm scraper-lite/IMPROVEMENTS.md
rm scraper-lite/IMPROVEMENTS_SUMMARY.md

# Test folder
rm scraper-lite/test/README.md
rm scraper-lite/test/ORGANIZATION.md
rm scraper-lite/test/ORGANIZATION_SUMMARY.md
rm scraper-lite/test/ORGANIZATION_COMPLETE.md
rm scraper-lite/test/FINAL_ORGANIZATION.md

# Docs folder (optional - archive or delete)
# Most can be deleted, or move to docs/archive/
```

