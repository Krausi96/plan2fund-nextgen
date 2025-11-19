# User Files Consolidation Plan

## Current Structure (28 files)

### Storage (4 files) - **CONSOLIDATE**
- `planStore.ts` (382 lines) - Main plan storage, keep as-is
- `documentStore.ts` (~100 lines) - Document tracking
- `paymentStore.ts` (~160 lines) - Payment records
- `multiUser.ts` (34 lines) - Client management

**Action:** Merge `documentStore.ts`, `paymentStore.ts`, and `multiUser.ts` into `planStore.ts` since they're all localStorage utilities and related.

### Analytics (4 files) - **CONSOLIDATE**
- `analytics.ts` (~300 lines) - Main analytics class
- `dataCollection.ts` (~255 lines) - ML training data collection
- `usageTracking.ts` (~186 lines) - Freemium limits tracking
- `index.ts` (7 lines) - Re-exports

**Action:** Merge `dataCollection.ts` and `usageTracking.ts` into `analytics.ts` as separate classes/modules. Keep index.ts for exports.

### Schemas (2 files) - **CONSOLIDATE**
- `userProfile.ts` (~189 lines) - User profile schema
- `index.ts` (3 lines) - Re-exports

**Action:** Merge `index.ts` into `userProfile.ts` (remove index.ts, export directly from userProfile.ts)

### Segmentation (3 files) - **KEEP AS-IS**
- `index.ts` - Exports
- `personaMapping.ts` - Persona mapping (just created)
- `targetGroupDetection.ts` - Target group detection

**Reason:** Small, well-organized, clear separation of concerns.

### Auth (2 files) - **KEEP AS-IS**
- `utils.ts` - Auth utilities
- `withAuth.tsx` - HOC component

**Reason:** Small, clear separation.

### Components (5 files) - **KEEP AS-IS**
- UI components should stay separate

### Database (3 files) - **KEEP AS-IS**
- `repository.ts` - Database operations
- `schema.sql` - SQL schema
- `README.md` - Documentation

**Reason:** Clear separation, database-specific.

### Context (1 file) - **KEEP AS-IS**
- `UserContext.tsx` - React context

## Consolidation Summary

**Before:** 28 files
**After:** ~20 files (8 files removed/merged)

### Files to Merge:
1. ✅ `documentStore.ts` → `planStore.ts`
2. ✅ `paymentStore.ts` → `planStore.ts`
3. ✅ `multiUser.ts` → `planStore.ts`
4. ✅ `dataCollection.ts` → `analytics.ts`
5. ✅ `usageTracking.ts` → `analytics.ts`
6. ✅ `schemas/index.ts` → `schemas/userProfile.ts`

### Result:
- **Storage:** 4 files → 1 file (`planStore.ts`)
- **Analytics:** 4 files → 2 files (`analytics.ts` + `index.ts`)
- **Schemas:** 2 files → 1 file (`userProfile.ts`)

**Total reduction: 8 files → 3 files**

