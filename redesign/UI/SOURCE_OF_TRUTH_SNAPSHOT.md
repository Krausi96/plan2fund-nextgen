# Source of Truth - Current Implementation Snapshot

**Created:** 2025-11-06 21:08:22
**Purpose:** Baseline snapshot before UI improvements

## Files to be Modified

### Navigation Components
- `shared/components/layout/Header.tsx`
- `shared/components/layout/Footer.tsx`
- `shared/components/layout/Breadcrumbs.tsx`
- `shared/components/layout/SiteBreadcrumbs.tsx`
- `shared/components/layout/AppShell.tsx`

### UI Components
- `shared/components/ui/button.tsx`

### New Components
- `shared/components/common/PageEntryIndicator.tsx` (to be created)

### Pages
- `pages/main/reco.tsx`
- `pages/main/advanced-search.tsx`
- `pages/main/results.tsx`
- `pages/main/editor.tsx`
- `pages/main/preview.tsx`
- `pages/main/export.tsx`
- `pages/main/checkout.tsx`
- `pages/main/thank-you.tsx`
- `pages/main/dashboard.tsx`
- `pages/main/pricing.tsx`
- `pages/main/about.tsx`
- `pages/main/legal.tsx`
- `shared/components/auth/LoginModal.tsx`

## Git Status
- Branch: main
- Status: Clean working tree (at snapshot time)

## Lint Status
- One lint error in `scraper-lite/src/utils.ts` (not related to UI work)
- UI files: To be checked before each phase

## Notes
- This snapshot represents the state before UI unification work begins
- All changes will be tracked in PROGRESS.md
- Test after each phase before proceeding

