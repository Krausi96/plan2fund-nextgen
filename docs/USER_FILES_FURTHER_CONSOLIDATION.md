# Further User Files Consolidation

## Current Issues

1. **Unnecessary index.ts files** - Just re-export wrappers
   - `analytics/index.ts` - Only re-exports
   - `segmentation/index.ts` - Only re-exports

2. **Small auth folder** - Only 2 small files (42 lines total)
   - `auth/utils.ts` - 27 lines
   - `auth/withAuth.tsx` - 42 lines
   - Could merge into single file

3. **Standalone featureFlags.ts** - 238 lines, could be organized better

## Proposed Consolidations

### Option 1: Remove index.ts files (Recommended)
- Delete `analytics/index.ts` - Update main index.ts to export directly from analytics.ts
- Delete `segmentation/index.ts` - Update main index.ts to export directly from segmentation files
- **Result:** 2 fewer files, cleaner structure

### Option 2: Merge auth files
- Merge `auth/utils.ts` into `auth/withAuth.tsx` or create `auth/index.ts` with both
- **Result:** 1 file instead of 2

### Option 3: Organize featureFlags
- Move `featureFlags.ts` into `utils/` folder or merge with analytics (it's related to user tiers)
- **Result:** Better organization

## Recommended Actions

1. ✅ Remove `analytics/index.ts` - Update exports
2. ✅ Remove `segmentation/index.ts` - Update exports  
3. ✅ Merge `auth/utils.ts` into `auth/withAuth.tsx` (or rename to `auth.tsx`)
4. ⚠️ Keep `featureFlags.ts` as-is (it's substantial and standalone)

**Total reduction: 4 more files → 2 files**

