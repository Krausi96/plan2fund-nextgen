# Plan2Fund Repository Cleanup Plan

## 🎯 **CURRENT STATUS**

### ✅ **COMPLETED CLEANUP:**
1. **✅ Removed `testrec/`** - Old test system, not integrated
2. **✅ Removed `pages/editor-old.tsx`** - Unused old editor
3. **✅ Organized documentation** - Moved to `docs/` folders
4. **✅ Organized scripts** - Moved to `scripts/` subfolders

### 🔄 **REMAINING CLEANUP NEEDED:**

#### **Scripts Directory Cleanup**
**Keep (Essential):**
- `run-tests.mjs` - Referenced in package.json
- `ci-coverage.mjs` - Referenced in package.json  
- `generate-source-register.mjs` - Referenced in package.json
- `database/` folder - Contains essential SQL scripts
- `testing/` folder - Contains test scripts

**Remove (Unused):**
- `aggressive-coverage-enhancement.mjs` - Not referenced
- `ci-corpus-validation.mjs` - Not referenced
- `ci-performance.mjs` - Not referenced
- `ci-schema-freshness.js` - Not referenced
- `cleanup-repo.mjs` - Not referenced
- `coverage-validation.mjs` - Not referenced
- `enhance-program-overlays.mjs` - Not referenced
- `fix-corpus-data.mjs` - Not referenced
- `generate-system-transparency.mjs` - Not referenced
- `parse-funding-urls.mjs` - Not referenced
- `pr-automation.js` - Not referenced
- `run-intake-tests.js` - Not referenced
- `run-replay-harness.mjs` - Not referenced
- `test-personas.mjs` - Not referenced
- `test-real-corpus-ranking.mjs` - Not referenced

#### **Tests Directory Cleanup**
**Current Structure:**
```
tests/
├── corpus-validation.spec.ts
├── derived.spec.ts
├── e2e/
│   └── replay.spec.ts
├── fixtures/
│   └── personas.json
├── intake/
│   ├── ci-tests.ts
│   ├── fuzzy-tests.ts
│   └── golden-tests.ts
├── missing-variables.spec.ts
├── personas/
│   └── acceptance-tests.ts
└── scorer.spec.ts
```

**Proposed Structure:**
```
tests/
├── unit/                    # Unit tests
│   ├── lib/                # Library tests
│   └── components/         # Component tests
├── integration/            # Integration tests
│   └── api/               # API tests
├── e2e/                   # End-to-end tests
├── fixtures/              # Test data
└── helpers/               # Test utilities
```

#### **Pages Directory Cleanup**
**Check for unused pages:**
- `pages/editor-old.tsx` - ✅ Already removed
- Check other pages for usage

#### **Src Directory Organization**
**Current structure looks good, but verify:**
- `src/components/` - Well organized
- `src/lib/` - Well organized
- `src/types/` - Well organized
- `src/editor/` - Well organized

## 🚀 **NEXT STEPS**

1. **Remove unused scripts** (safely)
2. **Reorganize tests directory** (if needed)
3. **Check for unused pages** (if any)
4. **Verify src organization** (looks good)
5. **Update documentation** (reflect changes)

## ⚠️ **SAFETY MEASURES**

- **Test before removing** - Run tests to ensure nothing breaks
- **Check references** - Verify files aren't imported elsewhere
- **Backup important data** - Keep essential test data
- **Update documentation** - Reflect new structure

## 📊 **CLEANUP BENEFITS**

- **✅ Cleaner repository** - Easier to navigate
- **✅ Better organization** - Logical file structure
- **✅ Reduced confusion** - Clear what's used vs unused
- **✅ Easier maintenance** - Less clutter to manage
- **✅ Better performance** - Smaller repository size

## 🎯 **GOAL**

Create a clean, well-organized repository that's easy to navigate and maintain, without breaking any existing functionality.
