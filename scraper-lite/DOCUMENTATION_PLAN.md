# Documentation Cleanup Plan

## Current Markdown Files Analysis

### ✅ KEEP (Current/Active Documentation)

1. **README.md** - Main documentation (KEEP - comprehensive guide)
2. **INTEGRATION_COMPLETE.md** - Current integration status (KEEP - shows what's automated)
3. **TEST_FILES_ANALYSIS.md** - Test files organization (KEEP - useful reference)
4. **AUTOMATED_IMPROVEMENTS.md** - Automation status (KEEP - shows what's automated)

### 📝 CONSOLIDATE (Merge into new files)

#### Create: `ARCHITECTURE.md`
Consolidate from:
- `ARCHITECTURE_ANALYSIS.md` (outdated - pre-merge)
- `MERGE_SUMMARY.md` (merge info - can be summarized)
- Key architecture info from `README.md`

#### Create: `HISTORY.md`
Consolidate from:
- `IMPROVEMENTS.md` (detailed analysis - historical)
- `IMPROVEMENTS_SUMMARY.md` (summary - historical)
- Key decisions from `docs/` folder

### 🗑️ DELETE (Outdated/Redundant)

#### Root Level (Redundant):
- `MERGE_SUMMARY.md` → Merge into ARCHITECTURE.md
- `ARCHITECTURE_ANALYSIS.md` → Outdated (pre-merge), merge into ARCHITECTURE.md
- `IMPROVEMENTS.md` → Historical, merge into HISTORY.md
- `IMPROVEMENTS_SUMMARY.md` → Historical, merge into HISTORY.md

#### Test Folder (Redundant):
- `test/README.md` → Info already in main README.md
- `test/ORGANIZATION.md` → Outdated organization info
- `test/ORGANIZATION_SUMMARY.md` → Redundant
- `test/ORGANIZATION_COMPLETE.md` → Redundant
- `test/FINAL_ORGANIZATION.md` → Redundant

#### Docs Folder (Historical - Archive or Delete):
All files in `docs/` are historical implementation records. Options:
1. **Archive** - Move to `docs/archive/` (keep for reference)
2. **Delete** - Remove if not needed (most are implementation details)

**Historical docs to consider keeping (if useful):**
- `docs/FORCE_UPDATE_USAGE.md` - Usage guide (might be useful)
- `docs/INVALID_FUNDING_TYPES_EXPLANATION.md` - Technical explanation (might be useful)

**Historical docs to delete:**
- `docs/TEST_RESULTS*.md` - Old test results (not current)
- `docs/IMPLEMENTATION_*.md` - Implementation plans (completed)
- `docs/CLEANUP_*.md` - Cleanup plans (completed)
- `docs/CRITICAL_ANALYSIS.md` - Old analysis
- `docs/404_AND_PERFORMANCE_FIXES.md` - Fixed issues
- `docs/PERFORMANCE_AND_404_FIXES.md` - Duplicate
- `docs/ALL_IMPROVEMENTS_IMPLEMENTED.md` - Completed
- Most others are historical implementation details

## Proposed New Structure

```
scraper-lite/
├── README.md                    # Main documentation (KEEP)
├── ARCHITECTURE.md              # Architecture overview (NEW - consolidate)
├── HISTORY.md                   # Historical decisions (NEW - consolidate)
├── INTEGRATION_COMPLETE.md     # Integration status (KEEP)
├── TEST_FILES_ANALYSIS.md      # Test files (KEEP)
├── AUTOMATED_IMPROVEMENTS.md   # Automation status (KEEP)
└── docs/                       # Historical docs (ARCHIVE or DELETE)
    └── archive/                 # Move old docs here (optional)
```

## Action Plan

1. **Create ARCHITECTURE.md** - Consolidate architecture info
2. **Create HISTORY.md** - Consolidate historical decisions
3. **Delete redundant root files** - MERGE_SUMMARY, ARCHITECTURE_ANALYSIS, IMPROVEMENTS, IMPROVEMENTS_SUMMARY
4. **Delete redundant test docs** - All ORGANIZATION*.md files
5. **Archive or delete docs/** - Move to archive or delete historical docs

