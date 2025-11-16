# API Reorganization Plan

## Current Structure Issues

### 1. **Inconsistent Naming**
- `programs.ts` (root level) → `/api/programs`
- `programmes/[id]/requirements.ts` → `/api/programmes/[id]/requirements`
- `programs/recommend.ts` → `/api/programs/recommend`

**Problem**: Two different spellings (`programs` vs `programmes`) for the same concept

### 2. **Root Level Files**
- `programs.ts` should be in `programs/` folder
- `test-email.ts` (dev utility, should stay or be moved to dev folder)

### 3. **Payment Endpoints Split**
- `payments/create-session.ts` → `/api/payments/create-session`
- `payments/success.ts` → `/api/payments/success`
- `stripe/webhook.ts` → `/api/stripe/webhook`

**Problem**: Stripe webhook is separate from other payment endpoints

---

## Proposed Reorganization

### Option A: Minimal Changes (Recommended)
**Keep routes the same, just organize files better**

```
pages/api/
├── programs/
│   ├── index.ts              # GET /api/programs (move from programs.ts)
│   ├── recommend.ts          # POST /api/programs/recommend (already here)
│   └── [id]/
│       └── requirements.ts  # GET /api/programs/[id]/requirements (move from programmes/)
├── payments/
│   ├── create-session.ts     # POST /api/payments/create-session (already here)
│   ├── success.ts            # POST /api/payments/success (already here)
│   └── webhook.ts            # POST /api/payments/webhook (move from stripe/)
└── stripe/                   # DELETE (empty after move)
```

**Route Changes Required:**
- `/api/programmes/[id]/requirements` → `/api/programs/[id]/requirements`
  - Update in: `pages/main/export.tsx`, `pages/export.tsx`, `features/editor/engine/aiHelper.ts`, etc.

**Benefits:**
- ✅ Consistent naming (`programs` everywhere)
- ✅ All program endpoints in one folder
- ✅ All payment endpoints in one folder
- ✅ Minimal breaking changes

---

### Option B: Keep Current Routes (No Breaking Changes)
**Just move files, keep routes via Next.js routing**

```
pages/api/
├── programs/
│   ├── index.ts              # GET /api/programs (move from programs.ts)
│   ├── recommend.ts          # POST /api/programs/recommend (already here)
│   └── [id]/
│       └── requirements.ts   # GET /api/programs/[id]/requirements (move from programmes/)
├── programmes/               # KEEP (for backward compatibility)
│   └── [id]/
│       └── requirements.ts  # Redirect to /api/programs/[id]/requirements
├── payments/
│   ├── create-session.ts
│   ├── success.ts
│   └── webhook.ts            # Move from stripe/
└── stripe/                   # DELETE (empty after move)
```

**Benefits:**
- ✅ No breaking changes (backward compatible)
- ✅ Better organization
- ⚠️ Still have duplicate routes (programmes vs programs)

---

### Option C: Full Reorganization (Most Organized)
**Complete restructure with route updates**

```
pages/api/
├── programs/
│   ├── index.ts              # GET /api/programs
│   ├── recommend.ts          # POST /api/programs/recommend
│   └── [id]/
│       └── requirements.ts   # GET /api/programs/[id]/requirements
├── payments/
│   ├── sessions.ts           # POST /api/payments/sessions (rename create-session)
│   ├── success.ts            # POST /api/payments/success
│   └── webhook.ts            # POST /api/payments/webhook
└── (other folders stay the same)
```

**Route Changes:**
- `/api/payments/create-session` → `/api/payments/sessions`
- `/api/programmes/[id]/requirements` → `/api/programs/[id]/requirements`

---

## Recommendation: **Option A**

### Why Option A?
1. **Minimal breaking changes** - Only one route changes (`/api/programmes` → `/api/programs`)
2. **Better organization** - Related endpoints grouped together
3. **Consistent naming** - `programs` everywhere
4. **Easy to implement** - Just move files and update references

### Files to Update (if we change `/api/programmes` → `/api/programs`):
1. `pages/main/export.tsx` (2 references)
2. `pages/export.tsx` (2 references)
3. `features/editor/engine/aiHelper.ts` (1 reference)
4. `features/editor/templates/index.ts` (1 reference)
5. `pages/preview.tsx` (1 reference)
6. `shared/components/common/StructuredRequirementsDisplay.tsx` (1 reference)

**Total: ~8 references to update**

---

## Implementation Steps

1. ✅ **Restore `test-email.ts`** (revert deletion)
2. **Move `programs.ts` → `programs/index.ts`**
3. **Move `programmes/[id]/requirements.ts` → `programs/[id]/requirements.ts`**
4. **Move `stripe/webhook.ts` → `payments/webhook.ts`**
5. **Update all route references** (if changing `/api/programmes` → `/api/programs`)
6. **Delete empty `programmes/` folder**
7. **Delete empty `stripe/` folder** (if moving webhook)

---

## Questions to Answer Before Proceeding

1. **Do we want to change `/api/programmes` → `/api/programs`?**
   - If YES: Update all references (Option A)
   - If NO: Keep both routes (Option B)

2. **Should `test-email.ts` stay or be removed?**
   - Currently: Dev-only utility
   - Recommendation: Keep for now, document as dev utility

3. **Should we rename `create-session.ts` → `sessions.ts`?**
   - Current: `/api/payments/create-session`
   - Proposed: `/api/payments/sessions`
   - Recommendation: Keep as-is (less breaking changes)

---

## Summary

**Recommended: Option A (Minimal Changes)**
- Move files to proper folders
- Update `/api/programmes` → `/api/programs` (8 references)
- Keep all other routes the same
- Better organization, minimal breaking changes

**Estimated Time:** 15-20 minutes
**Risk Level:** Low (only one route change)

