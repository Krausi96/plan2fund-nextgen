# Module Analysis: Export, Analytics, User, and Lib

## Executive Summary

This analysis examines the dependencies, duplicates, unused code, and integration opportunities across:
- `features/export` - Export functionality
- `shared/user/analytics` - Analytics tracking
- `shared/user` - User management
- `shared/lib` - Shared utilities

## Key Findings

### 🔴 Critical Issues

#### 1. **DUPLICATE CODE: ExportRenderer**
- **Location 1**: `features/export/renderer/renderer.tsx` (2093 lines)
- **Location 2**: `features/editor/components/layout/Workspace/Preview/DocumentRenderer.tsx` (2093 lines)
- **Impact**: Code duplication, maintenance burden, potential inconsistencies
- **Current Usage**:
  - `PreviewWorkspace.tsx` imports from `./DocumentRenderer` (local copy)
  - `pages/preview.tsx` imports from `@/features/export/renderer/renderer`
- **Recommendation**: Remove duplicate, use single source

#### 2. **Scattered Export Feature**
The export feature is split across multiple locations:
- `features/export/renderer/` - UI rendering
- `features/export/engine/` - Export logic (PDF/DOCX generation)
- `features/export/components/` - UI components (CartSummary)

**Current Dependencies:**
- Export engine → `@/shared/user/featureFlags` (minimal, appropriate)
- Export renderer → Used in both editor and preview pages
- No direct dependency on analytics (commented out in export.ts)

### 🟡 Moderate Issues

#### 3. **Empty/Unused Files**
- `shared/lib/content/index.ts` - Empty export file
- `shared/lib/services/index.ts` - Only has 2 exports (emailService, seo)
- `pages/api/ml-training/plans.ts` - Empty file (2 lines)

#### 4. **Analytics Integration**
- Analytics is well-centralized in `shared/user/analytics/analytics.ts`
- Export feature has commented-out analytics import: `// import analytics from './analytics';`
- Analytics tracking is missing from export operations (should track PDF/DOCX exports)

### 🟢 Good Practices

#### 5. **Well-Structured Modules**
- `shared/user/analytics` - Comprehensive analytics with usage tracking
- `shared/user/featureFlags` - Clean feature flag system
- `shared/lib/database.ts` - Centralized database operations
- `shared/lib/utils.ts` - Simple utility (cn function)

## Detailed Analysis

### Export Feature Dependencies

**What Export Needs:**
1. ✅ `@/shared/user/featureFlags` - For checking PDF export permissions
2. ✅ `@/features/editor/lib/types/plan` - For PlanDocument type
3. ❌ Analytics (commented out) - Should track export events

**What Export Provides:**
- `exportManager` - PDF/DOCX generation
- `ExportRenderer` - Preview/rendering component
- `calculatePricing` - Pricing calculations
- `CartSummary` - UI component

### Analytics Module

**Location**: `shared/user/analytics/analytics.ts` (727 lines)

**Exports:**
- Default analytics instance
- Event tracking methods
- Usage tracking (freemium limits)
- ML training data collection
- Consent management

**Dependencies:**
- None (self-contained)
- Uses localStorage for session management
- Calls `/api/analytics/track` endpoint

**Usage:**
- Used in 20+ files across the codebase
- Well-integrated with user context
- Missing from export operations

### User Module Structure

**Well-organized:**
```
shared/user/
├── analytics/          # Analytics tracking
├── auth/              # Authentication
├── components/        # User-related UI
├── context/           # UserContext provider
├── database/          # User database operations
├── schemas/           # Type definitions
├── segmentation/     # User segmentation
├── storage/           # Plan/document storage
└── featureFlags.ts    # Feature flag system
```

**Dependencies:**
- `shared/lib/database.ts` - Used by `database/repository.ts`
- Self-contained otherwise

### Lib Module Structure

**Current State:**
```
shared/lib/
├── content/           # Empty (unused)
├── database.ts        # Database operations (663 lines)
├── services/          # Email, SEO services
└── utils.ts          # cn() utility function
```

**Issues:**
- `content/index.ts` is empty
- `services/index.ts` only re-exports 2 services
- Could be consolidated

## Recommendations

### Priority 1: Remove Duplicate Code

**Action**: Consolidate ExportRenderer
1. Keep `features/export/renderer/renderer.tsx` as the single source
2. Update `PreviewWorkspace.tsx` to import from `@/features/export/renderer/renderer`
3. Delete `features/editor/components/layout/Workspace/Preview/DocumentRenderer.tsx`

**Benefits:**
- Single source of truth
- Easier maintenance
- Consistent behavior

### Priority 2: Move Renderer Closer to Editor

**Option A: Move to Editor** (Recommended)
- Move `features/export/renderer/` → `features/editor/components/preview/`
- Keep export engine separate: `features/export/engine/`
- Rationale: Renderer is primarily used in editor context

**Option B: Keep Separate** (Alternative)
- Keep renderer in export feature
- Ensure single source (remove duplicate)
- Rationale: Renderer is also used in preview page

**Recommendation**: Option A - Move renderer to editor since it's primarily an editor feature

### Priority 3: Clean Up Unused Files

**Action**: Remove or populate empty files
1. Delete `shared/lib/content/index.ts` (or add content if needed)
2. Review `pages/api/ml-training/plans.ts` - implement or remove
3. Consolidate `shared/lib/services/index.ts` if only re-exporting

### Priority 4: Integrate Analytics

**Action**: Add analytics tracking to export
1. Uncomment analytics import in `features/export/engine/export.ts`
2. Add tracking for:
   - Export start (`trackExportStart`)
   - Export complete (`trackExportComplete`)
   - Export format (PDF/DOCX)
   - Export success/failure

### Priority 5: Consolidate Export Structure

**Current:**
```
features/export/
├── renderer/          # UI rendering
├── engine/            # Export logic
└── components/        # UI components
```

**Proposed (if moving renderer):**
```
features/export/
├── engine/            # Export logic (PDF/DOCX)
└── components/        # Export-specific UI (CartSummary, etc.)

features/editor/
└── components/preview/
    └── DocumentRenderer.tsx  # Moved from export/renderer
```

**Alternative (keep together):**
```
features/export/
├── renderer/          # UI rendering (single source)
├── engine/            # Export logic
└── components/        # UI components
```

## Dependencies Map

### Export → Other Modules
```
features/export/
├── engine/export.ts
│   ├── @/shared/user/featureFlags ✅ (minimal, appropriate)
│   └── @/features/editor/lib/types/plan ✅ (type dependency)
│
├── renderer/renderer.tsx
│   └── @/features/editor/lib/types/plan ✅ (type dependency)
│
└── components/CartSummary.tsx
    └── @/features/export/engine/pricing ✅ (internal)
```

### Analytics → Other Modules
```
shared/user/analytics/
└── analytics.ts
    └── No dependencies ✅ (self-contained)
```

### User Module → Other Modules
```
shared/user/
├── database/repository.ts
│   └── @/shared/lib/database ✅ (appropriate)
│
└── featureFlags.ts
    └── @/shared/user/analytics/analytics ✅ (dynamic import, optional)
```

## Integration Opportunities

### 1. Export + Analytics
- **Current**: No analytics tracking in export
- **Opportunity**: Track export events for usage analytics
- **Impact**: Better understanding of export feature usage

### 2. Export + Editor
- **Current**: Renderer duplicated, used in both
- **Opportunity**: Move renderer to editor, keep engine separate
- **Impact**: Better code organization, single source

### 3. Lib Consolidation
- **Current**: Empty content module, minimal services
- **Opportunity**: Consolidate or remove unused modules
- **Impact**: Cleaner codebase

## Action Items

### Immediate (High Priority)
1. ✅ Remove duplicate `DocumentRenderer.tsx`
2. ✅ Update imports to use single source
3. ✅ Add analytics tracking to export operations

### Short-term (Medium Priority)
4. ⚠️ Move renderer to editor (if agreed)
5. ⚠️ Clean up empty files
6. ⚠️ Review and consolidate lib structure

### Long-term (Low Priority)
7. 📋 Consider feature-based organization
8. 📋 Document module boundaries
9. 📋 Establish dependency guidelines

## Conclusion

The codebase is generally well-organized, but has:
- **1 critical issue**: Duplicate ExportRenderer code
- **Several moderate issues**: Empty files, missing analytics integration
- **Good structure**: Analytics and user modules are well-organized

**Primary Recommendation**: Remove duplicate code first, then consider moving renderer closer to editor for better cohesion.

