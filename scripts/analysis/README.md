# Codebase Analysis Scripts

This folder contains focused, single-purpose analysis scripts for optimizing your Next.js codebase safely.

## 🎯 **What Each Script Does**

### 1. `analyze-health.js` - **Health Check** (Run First)
**Purpose**: Validates the codebase is in a healthy state before optimization
**What it checks**:
- TypeScript compilation errors
- Build process success
- Linting errors
- Test status and coverage
- Dependency updates
- File structure completeness

**Output**: `health-analysis.json`
**Safe to run**: ✅ Yes - only analyzes, never modifies

---

### 2. `analyze-filesize.js` - **File Size Analysis** (Run Second)
**Purpose**: Identifies large files that impact bundle size and performance
**What it analyzes**:
- File size distribution by type and directory
- Large files (>10KB warning, >50KB critical)
- Directory size analysis
- File count statistics

**Output**: `filesize-analysis.json`
**Safe to run**: ✅ Yes - only analyzes, never modifies

---

### 3. `analyze-bundle.js` - **Bundle Analysis** (Run Third)
**Purpose**: Deep dive into Next.js bundle composition and size
**What it analyzes**:
- Bundle size using @next/bundle-analyzer
- First Load JS size
- Generates visual bundle reports
- Identifies optimization opportunities

**Output**: `bundle-analysis.json` + `.next/analyze/` visual reports
**Safe to run**: ✅ Yes - only analyzes, never modifies

---

### 4. `analyze-unused.js` - **Unused Code Detection** (Run Fourth)
**Purpose**: Finds dead code that can be safely removed
**What it finds**:
- Unused exports using `ts-unused-exports`
- Unused dependencies using `depcheck`
- Dead imports (imports that aren't used)
- Fallback analysis for missing tools

**Output**: `unused-code-analysis.json`
**Safe to run**: ✅ Yes - only analyzes, never modifies

---

### 5. `analyze-duplicates.js` - **Duplicate Detection** (Run Fifth)
**Purpose**: Identifies duplicate code and similar components
**What it finds**:
- Exact duplicate files (same content)
- Similar React components (structure, hooks, patterns)
- Duplicate utility functions
- Repeated code patterns

**Output**: `duplicate-analysis.json`
**Safe to run**: ✅ Yes - only analyzes, never modifies

---

## 🚀 **Recommended Execution Order**

```bash
# 1. Health Check (MUST run first)
node scripts/analysis/analyze-health.js

# 2. File Size Analysis
node scripts/analysis/analyze-filesize.js

# 3. Bundle Analysis (requires build)
node scripts/analysis/analyze-bundle.js

# 4. Unused Code Detection
node scripts/analysis/analyze-unused.js

# 5. Duplicate Detection
node scripts/analysis/analyze-duplicates.js
```

## 📊 **Output Files**

All scripts generate JSON reports in the project root:
- `health-analysis.json` - Health check results
- `filesize-analysis.json` - File size analysis
- `bundle-analysis.json` - Bundle analysis
- `unused-code-analysis.json` - Unused code detection
- `duplicate-analysis.json` - Duplicate detection

## ⚠️ **Important Notes**

1. **Always run health check first** - Fix any critical issues before optimization
2. **Bundle analysis requires a successful build** - Run `npm run build` first if needed
3. **All scripts are safe** - They only analyze, never delete or modify files
4. **Review recommendations carefully** - Don't blindly delete files based on analysis
5. **Start with high-priority items** - Focus on critical and high-priority recommendations first

## 🔧 **Quick Start**

```bash
# Run all analyses in sequence
npm run analyze:all

# Or run individual analyses
npm run analyze:health
npm run analyze:filesize
npm run analyze:bundle
npm run analyze:unused
npm run analyze:duplicates
```

## 📈 **Expected Results**

After running all scripts, you should have:
- Clear understanding of codebase health
- Identified large files and optimization targets
- Bundle size breakdown and optimization opportunities
- List of unused code that can be safely removed
- Duplicate code that can be consolidated

This gives you a complete picture for safe, effective optimization! 🎯
