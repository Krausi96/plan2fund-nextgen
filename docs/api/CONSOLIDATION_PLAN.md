# API Consolidation Plan

## Current Issues

### 1. **Single-File Folders** (Not necessarily bad, but could consolidate)
- `ai/` - 1 file (openai.ts)
- `db/` - 1 file (setup.ts) - Admin utility
- `gdpr/` - 1 file (delete-data.ts)
- `user/` - 1 file (profile.ts)

### 2. **Documentation Files in API Folder** (Should move)
- `API_ANALYSIS.md`
- `CLEANUP_SUMMARY.md`
- `REORGANIZATION_PLAN.md`
- `REORGANIZATION_COMPLETE.md`
- `FINAL_ORGANIZATION_PLAN.md`
- `CONSOLIDATION_PLAN.md` (this file)

### 3. **Potential Consolidations**

---

## Proposed Consolidations

### Option A: Merge User-Related (Recommended)

**Merge `gdpr/` into `user/`:**
- `gdpr/delete-data.ts` → `user/delete-data.ts`
- **Reason**: GDPR deletion is user-related
- **Route**: `/api/gdpr/delete-data` → `/api/user/delete-data`

**Keep others separate:**
- `ai/` - May expand (Claude, Gemini, etc.)
- `db/` - Admin utility (could rename to `admin/`)

---

### Option B: Create Services Folder

**Merge AI and other services:**
- `ai/openai.ts` → `services/openai.ts`
- Future: `services/claude.ts`, `services/gemini.ts`

**Keep user-related together:**
- `user/profile.ts`
- `user/delete-data.ts` (from gdpr/)

---

### Option C: Minimal Changes (Safest)

**Only move documentation:**
- Move all `.md` files → `docs/api/`

**Optionally rename:**
- `db/` → `admin/` (clearer purpose)

**Keep everything else as-is** - Single-file folders are fine for future expansion

---

## Recommendation: **Option A + Move Docs**

### Actions:
1. ✅ **Merge `gdpr/delete-data.ts` → `user/delete-data.ts`**
2. ✅ **Move all `.md` files → `docs/api/`**
3. ⚠️ **Optionally rename `db/` → `admin/`** (or keep as-is)

### Result:
```
pages/api/
├── ai/              # AI services (may expand)
├── analytics/       # Analytics
├── auth/            # Authentication
├── db/ or admin/    # Admin utilities
├── ml-training/      # ML training
├── payments/        # Payments
├── programs/        # Programs
└── user/            # User management (profile + GDPR)
    ├── profile.ts
    └── delete-data.ts
```

---

## What to Do?

**Quick wins:**
1. Move docs to `docs/api/`
2. Merge `gdpr/` → `user/` (1 route change)
3. Optionally rename `db/` → `admin/`

**Keep as-is:**
- `ai/` - Fine as single folder (may expand)
- Other single-file folders are acceptable

