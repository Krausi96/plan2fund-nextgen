# API Cleanup & Reorganization Summary

## ✅ TypeScript Errors Fixed

### 1. `pages/api/payments/success.ts`
- **Fixed**: Updated import path from `@/shared/lib/emailService` → `@/shared/lib/services/emailService`
- **Fixed**: Removed client-side `documentStore` usage (localStorage doesn't work server-side)
- **Action**: Document email functionality disabled until server-side document storage is implemented

### 2. `pages/api/programs.ts`
- **Fixed**: Updated import from `../../scraper-lite/db/db` → `@/shared/lib/database`
- **Fixed**: Both `searchPages`/`getAllPages` and `getPool` now use shared database module

### 3. Empty Endpoints Implemented
- **Fixed**: `pages/api/data-collection/templates.ts` - Now accepts template usage tracking
- **Fixed**: `pages/api/data-collection/scraper-quality.ts` - Now accepts scraper quality metrics
- **Note**: Both endpoints log data in dev mode; database storage TODO for production

---

## 📋 File Status & Recommendations

### 🟢 **KEEP - Essential Files**

#### Core Functionality
- `programs.ts` - Main programs listing endpoint (static JSON fallback)
- `programs/recommend.ts` - Program recommendation engine
- `programmes/[id]/requirements.ts` - Get program requirements by ID
- `payments/create-session.ts` - Stripe payment session creation
- `payments/success.ts` - Payment success handler
- `stripe/webhook.ts` - Stripe webhook handler (needs implementation)
- `user/profile.ts` - User profile management
- `auth/*.ts` - Authentication endpoints (login, logout, register, session)
- `data-collection/consent/[userId].ts` - GDPR consent management
- `data-collection/plans.ts` - Plan data collection
- `data-collection/export.ts` - Data export functionality
- `data-collection/templates.ts` - ✅ **NOW IMPLEMENTED** - Template usage tracking
- `data-collection/scraper-quality.ts` - ✅ **NOW IMPLEMENTED** - Scraper quality metrics
- `usage/[userId].ts` - Usage tracking
- `plan/save.ts` - Plan saving
- `images/upload.ts` - Image upload
- `analytics/track.ts` - Analytics tracking
- `ai/openai.ts` - OpenAI API proxy
- `gdpr/delete-data.ts` - GDPR data deletion
- `db/setup.ts` - Database setup

### 🟡 **CONDITIONAL - Dev/Testing Files**

#### `test-email.ts`
- **Status**: Dev-only endpoint (blocked in production)
- **Usage**: Only referenced in API_ANALYSIS.md, not used in codebase
- **Recommendation**: 
  - **Option A**: Keep for development/testing (useful for email debugging)
  - **Option B**: Remove if email testing is done via other means
- **Action**: Document as dev utility or remove based on team preference

---

## 🔄 Reorganization Opportunities

### High Priority (Reduces Complexity)

#### 1. **Consolidate Consent Endpoints** ⭐
**Current**: 
- `data-collection/consent.ts` (POST)
- `data-collection/consent/[userId].ts` (GET)

**Proposed**: Merge into single file `data-collection/consent/[userId].ts` with GET/POST methods
- **Benefit**: Single source of truth, RESTful design
- **Complexity**: Low (simple merge)

#### 2. **Consolidate Usage Endpoints** ⭐
**Current**:
- `usage/track.ts` (POST) - if exists
- `usage/[userId].ts` (GET)

**Proposed**: Single file `usage/[userId].ts` with GET/POST methods
- **Benefit**: Consistent pattern with consent
- **Complexity**: Low

#### 3. **Standardize Database Connections** ⭐
**Current**: Mixed usage of:
- Shared `getPool()` from `@/shared/lib/database` (preferred)
- Individual Pool instances (inconsistent)

**Files needing update**:
- `data-collection/consent.ts`
- `data-collection/consent/[userId].ts`
- `usage/track.ts` (if exists)
- `usage/[userId].ts`
- `data-collection/plans.ts`

**Action**: Migrate all to use `getPool()` from `@/shared/lib/database`
- **Benefit**: Connection pooling, consistent error handling
- **Complexity**: Medium (requires testing)

### Medium Priority (Improves Maintainability)

#### 4. **Reorganize Programs Endpoints**
**Current**:
- `programs.ts` (static JSON)
- `programmes/[id]/requirements.ts` (database)
- `programs/recommend.ts` (recommendation)

**Proposed**:
```
programs/
  index.ts              # GET /api/programs (static JSON)
  [id]/
    requirements.ts     # GET /api/programs/[id]/requirements
  recommend.ts          # POST /api/programs/recommend
```

**Benefit**: Consistent naming, clear structure
**Complexity**: Medium (requires route updates)

#### 5. **Consolidate Payment Endpoints**
**Current**:
- `payments/create-session.ts`
- `payments/success.ts`
- `stripe/webhook.ts`

**Proposed**: Keep as-is (already well-organized) OR move `stripe/webhook.ts` to `payments/webhook.ts`
- **Benefit**: All payment logic in one place
- **Complexity**: Low

### Low Priority (Nice to Have)

#### 6. **Create Shared Utilities**
- Error handler middleware
- CORS middleware
- Auth middleware
- Input validation (Zod/Yup)

**Benefit**: DRY principle, consistency
**Complexity**: Medium (requires refactoring)

---

## 🚫 What Would Add Complexity (Avoid)

### ❌ **Don't Do These**
1. **Over-abstract**: Don't create too many layers of abstraction
2. **Premature optimization**: Don't optimize endpoints that work fine
3. **Breaking changes**: Don't reorganize without updating all references
4. **Remove working code**: Don't remove endpoints that are actively used

---

## 📊 Summary Statistics

- **Total API Files**: 26
- **TypeScript Errors Fixed**: 6
- **Empty Files Implemented**: 2
- **Files Needing Database Migration**: ~5
- **Consolidation Opportunities**: 2-3 endpoints
- **Unused Files**: 1 (`test-email.ts` - conditional)

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Fixes (✅ DONE)
- [x] Fix TypeScript errors
- [x] Implement empty endpoints
- [x] Fix import paths

### Phase 2: High Priority (Next)
1. Migrate database connections to shared `getPool()`
2. Consolidate consent endpoints (2 → 1)
3. Consolidate usage endpoints (if applicable)

### Phase 3: Medium Priority (Future)
4. Reorganize programs endpoints
5. Create shared error/CORS middleware
6. Document or remove `test-email.ts`

### Phase 4: Low Priority (Nice to Have)
7. Extract transformation utilities
8. Add input validation
9. Standardize logging

---

## 🔍 What We Absolutely Need

### Essential Endpoints (Core Functionality)
1. **Programs**: `programs.ts`, `programs/recommend.ts`, `programmes/[id]/requirements.ts`
2. **Payments**: `payments/create-session.ts`, `payments/success.ts`, `stripe/webhook.ts`
3. **Auth**: `auth/login.ts`, `auth/logout.ts`, `auth/register.ts`, `auth/session.ts`
4. **User**: `user/profile.ts`
5. **Data Collection**: `data-collection/consent/[userId].ts`, `data-collection/plans.ts`, `data-collection/export.ts`
6. **Analytics**: `analytics/track.ts`, `usage/[userId].ts`
7. **AI**: `ai/openai.ts`
8. **GDPR**: `gdpr/delete-data.ts`
9. **Utilities**: `db/setup.ts`, `images/upload.ts`, `plan/save.ts`

### What Adds Complexity (Avoid)
- Multiple ways to do the same thing (e.g., database connections)
- Inconsistent patterns (e.g., consent split across 2 files)
- Unused abstractions
- Over-engineering simple endpoints

---

## ✅ Next Steps

1. **Review this document** with the team
2. **Decide on `test-email.ts`**: Keep for dev or remove?
3. **Prioritize Phase 2 items** based on business needs
4. **Create tickets** for each improvement
5. **Implement incrementally** to avoid breaking changes

---

*Last updated: After TypeScript fixes and endpoint implementation*

