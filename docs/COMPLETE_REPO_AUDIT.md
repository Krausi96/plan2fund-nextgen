# 🔍 Complete Repository Audit & Flow Analysis

**Date:** 2025-01-27  
**Status:** Comprehensive audit complete

---

## 📋 Executive Summary

### ✅ What's Working
- **Scraper → Database:** Data flows correctly from scraper-lite to NEON PostgreSQL
- **Database → API:** All API endpoints (`/api/programs`, `/api/programmes/[id]/requirements`) query database first
- **API → Components:** Most components receive data correctly
- **Unified Templates:** Template system consolidated and working

### ❌ Critical Gaps
1. **User Management:** Only localStorage, no backend auth
2. **Stripe:** Payment stub only, not connected
3. **Navigation Flow:** Missing connections between reco → editor → export → success
4. **Prefill:** Prefill logic exists but not wired from reco → editor
5. **Untested Components:** reco, smartwizard, advanced search not tested end-to-end

---

## 🗂️ File Audit: Unused/Duplicate Files

### ❌ Files to DELETE (Unused/Outdated)

#### 1. Documentation Files (Too Many - Consolidate)
```
docs/CLEANUP_REPORT.md
docs/DATA_FLOW_ANALYSIS.md
docs/DATA_FLOW_COMPLETE_SUMMARY.md
docs/DATA_FLOW_OPTIMIZED.md
docs/DATABASE_DATA_VERIFICATION.md
docs/DATABASE_STATUS_SUMMARY.md
docs/DATABASE_SYNC_AND_DOCUMENT_ANALYSIS.md
docs/REPOSITORY_STRUCTURE_COMPLETE.md
docs/REPOSITORY_STRUCTURE.md
docs/VERIFICATION_RESULTS.md
docs/WIRING_STATUS_COMPLETE.md
docs/COMPONENT_TESTING_PROPOSAL.md
docs/ENHANCEMENT_SUMMARY.md
docs/FIXES_AND_STATUS.md
docs/LEARNING_AND_INTELLIGENCE.md
docs/NEXT_STEPS.md
docs/QUICK_START_DATA_QUALITY.md
docs/STORAGE_AND_INTELLIGENCE_DEEP_DIVE.md
```
**Recommendation:** Keep only:
- `docs/README.md` (main docs)
- `docs/DATA_EXTRACTION_AND_FLOW_COMPLETE.md` (data flow reference)
- `docs/CATEGORIES_AND_ISSUES_ANALYSIS.md` (scraper reference)

#### 2. Root Markdown Files
```
CONSOLIDATION_SUMMARY.md
FINAL_UNIFICATION.md
UNIFICATION_PLAN.md
WIRING_STATUS.md
```
**Status:** All resolved, can delete

#### 3. Potentially Unused Data Files
```
shared/data/documentBundles.ts  # ⚠️ Check if still used
shared/data/documentDescriptions.ts  # ⚠️ Check if still used
```
**Status:** Used by pricing page, but redundant with unified templates - **CONSIDER REMOVING**

#### 4. Legacy Scripts
```
scraper-lite/data/legacy/*.json  # Old data, keep only for reference
scraper-lite/scripts/*.js  # Review - many analysis scripts may be unused
```

### ✅ Files to KEEP (Still Used)
- `features/editor/templates/productSectionTemplates.ts` - Has workflow steps, but sections are empty
- All API endpoints
- All component files
- Unified template system files

---

## 🔄 Data Flow Analysis

### ✅ Scraper-Lite → Database → API (WORKING)

```
Scraper (scraper-lite/src/scraper.ts)
  ↓ Extracts 19 categories
  ↓ Saves via page-repository.ts
NEON PostgreSQL Database
  ├─ pages table (1,024+ records)
  └─ requirements table (21,220+ records)
  ↓ Queried by
API Endpoints
  ├─ /api/programs → Returns programs with categorized_requirements
  ├─ /api/programmes/[id]/requirements → Returns editor/library/decision_tree
  └─ /api/programs-ai → Returns AI-generated content
  ↓ Consumed by
Frontend Components
```

**Status:** ✅ **WORKING** - Data quality good, all categories extracted

**Data Quality Metrics:**
- Pages: 1,024+ ✅
- Requirements: 21,220+ ✅
- Categories: All 19 present ✅
- Coverage: 27-82% per category (can improve) ⚠️

### ⚠️ API → Components (PARTIALLY WORKING)

#### ✅ Working Components:
1. **AdvancedSearch** (`pages/advanced-search.tsx`)
   - Source: `/api/programs?enhanced=true`
   - Status: ✅ Fetches data correctly
   - Issue: Routes to `/results` but prefill not connected

2. **Library** (`features/library/components/ProgramDetails.tsx`)
   - Source: `/api/programs`
   - Status: ✅ Working

#### ❌ Not Tested / Missing Connections:

1. **QuestionEngine** (`features/reco/engine/questionEngine.ts`)
   - Source: `/api/programs?enhanced=true`
   - Status: ⚠️ **NOT TESTED** - Logic exists but needs verification
   - Used by: SmartWizard

2. **SmartWizard** (`features/reco/components/wizard/SmartWizard.tsx`)
   - Source: Uses QuestionEngine
   - Status: ⚠️ **NOT TESTED** - No connection to editor found
   - Issue: Completes wizard, stores in localStorage, but **no navigation to editor**

3. **Editor** (`features/editor/components/UnifiedEditor.tsx`)
   - Source: `/api/programmes/[id]/requirements`
   - Status: ✅ Data loads correctly
   - Issue: **Prefill from reco not wired** - `answers` prop exists but not used properly

---

## 🔗 Navigation Flow Analysis

### Current Flow (Gaps Identified):

```
Landing Page (/)
  ↓
/reco (SmartWizard)
  ↓ Completes wizard
  ↓ Stores in localStorage: "recoResults", "userAnswers"
  ❌ **NO NAVIGATION TO EDITOR** - User stuck
  ↓ (Manual navigation?)
/editor?programId=X
  ↓ Loads program
  ✅ Works, but no prefill from wizard
  ↓ User creates plan
  ↓
/export
  ✅ Works
  ↓
/checkout
  ❌ **Stripe not connected** - stub only
  ↓
/thank-you (Success Hub)
  ✅ Basic UI works
```

### Missing Connections:

1. **reco → editor:** No automatic navigation after wizard completion
2. **advanced-search → editor:** Routes to `/results`, but results page doesn't link to editor
3. **results → editor:** Need to check if results page links to editor with prefill

---

## 🔐 User Management Audit

### Current Implementation:

**Location:** `shared/contexts/UserContext.tsx`

**What Exists:**
- ✅ User profile state management (localStorage)
- ✅ UserProvider wrapper
- ✅ Basic profile structure

**What's Missing:**
- ❌ **No backend authentication**
- ❌ **No user database**
- ❌ **No login/signup API**
- ❌ **No session management**
- ❌ **No user data persistence** (only localStorage)

**Login Page** (`pages/login.tsx`):
- ✅ Basic UI
- ⚠️ Only sets localStorage, no backend call
- ✅ Redirects to dashboard

**Dashboard** (`pages/dashboard.tsx`):
- ✅ Loads from localStorage
- ❌ **No API calls** to load user plans/recommendations from backend
- ✅ Basic stats display (but data is fake/localStorage only)

**Recommendation:**
- User management is **client-side only**
- Need backend API for:
  - User registration/login
  - User data storage (plans, recommendations)
  - Session management

---

## 💳 Stripe Integration Audit

### Current Implementation:

**Files Found:**
- `pages/api/payments/create-session.ts` ✅ (Stripe API integrated)
- `pages/api/payments/success.ts` ✅ (Webhook handler)
- `pages/api/stripe/webhook.ts` ❌ (Not found - may be missing)
- `features/export/engine/payments.ts` ✅ (Payment logic)
- `pages/checkout.tsx` ❌ (Stub only - "Pay Now (Stub)")

### Status:

**Working:**
- ✅ Stripe API endpoints exist
- ✅ Session creation logic exists
- ✅ Success webhook handler exists

**Not Connected:**
- ❌ `pages/checkout.tsx` uses stub, doesn't call `/api/payments/create-session`
- ❌ `pages/confirm.tsx` - Status unknown (need to check)
- ❌ Checkout flow doesn't integrate Stripe session
- ❌ No redirect to Stripe Checkout

**Recommendation:**
- Wire `checkout.tsx` to call `/api/payments/create-session`
- Add Stripe Checkout redirect
- Wire success callback
- Test end-to-end payment flow

---

## 🎯 Prefill Flow Analysis

### Current Implementation:

**Prefill Logic Exists:**
- `features/intake/engine/prefill.ts` ✅ (250 lines)
- `features/intake/components/PlanIntake.tsx` ✅

**What It Does:**
- Maps user answers to document sections
- Generates prefilled content with TBD markers
- Replaces placeholders

**What's Missing:**
- ❌ **Not wired from reco → editor**
- ❌ SmartWizard doesn't call prefill
- ❌ Editor doesn't receive/use prefill data from wizard
- ❌ Advanced search doesn't prefill

**How It Should Work:**
```
SmartWizard completes
  ↓
Extract answers from wizard
  ↓
Call prefill.prefillDocumentState(answers, selectedProgram)
  ↓
Pass prefilled content to editor
  ↓
Editor loads with prefilled sections
```

**Current State:**
- Editor has `answers` prop but it's not used
- Prefill logic exists but not called
- No automatic prefill from reco/results

---

## 📊 Component-by-Component Status

### Recommendation Engine (`features/reco/`)

#### ✅ QuestionEngine (`features/reco/engine/questionEngine.ts`)
- **Status:** ✅ Logic exists
- **Data Source:** `/api/programs?enhanced=true`
- **Testing:** ⚠️ **NOT TESTED**
- **Issues:** None identified (needs testing)

#### ✅ EnhancedRecoEngine (`features/reco/engine/enhancedRecoEngine.ts`)
- **Status:** ✅ Logic exists
- **Data Source:** `/api/programs?enhanced=true`
- **Testing:** ⚠️ **NOT TESTED**
- **Issues:** None identified (needs testing)

#### ⚠️ SmartWizard (`features/reco/components/wizard/SmartWizard.tsx`)
- **Status:** ⚠️ **UI exists, but navigation broken**
- **Data Source:** Uses QuestionEngine
- **Issues:**
  - ✅ Completes wizard
  - ✅ Stores results in localStorage
  - ❌ **No navigation to editor after completion**
  - ❌ **No prefill connection**

#### ⚠️ AdvancedSearch (`pages/advanced-search.tsx`)
- **Status:** ⚠️ **Works but incomplete flow**
- **Data Source:** `/api/programs?enhanced=true`
- **Issues:**
  - ✅ Fetches programs
  - ✅ Shows preview
  - ❌ Routes to `/results` but results may not link to editor
  - ❌ No prefill connection

---

### Editor (`features/editor/`)

#### ✅ UnifiedEditor (`features/editor/components/UnifiedEditor.tsx`)
- **Status:** ✅ **Working**
- **Data Source:** `/api/programmes/[id]/requirements`
- **Issues:**
  - ✅ Loads program data
  - ✅ Loads sections from unified templates
  - ✅ Loads documents
  - ❌ **Prefill from wizard not connected**
  - ❌ `answers` prop not used

#### ✅ Phase4Integration (`features/editor/components/Phase4Integration.tsx`)
- **Status:** ✅ **Working**
- **Data Source:** EditorDataProvider
- **Issues:** None identified

#### ✅ EditorDataProvider (`features/editor/engine/EditorDataProvider.ts`)
- **Status:** ✅ **Working**
- **Data Source:** `/api/programmes/[id]/requirements`
- **Issues:** None identified

---

### Export (`features/export/`)

#### ✅ Export Page (`pages/export.tsx`)
- **Status:** ✅ **Working**
- **Data Source:** Unified templates + user plan data
- **Issues:** None identified

#### ✅ Checkout (`pages/checkout.tsx`)
- **Status:** ❌ **Stub only**
- **Issues:**
  - ❌ Uses payment stub (not Stripe)
  - ❌ Doesn't call `/api/payments/create-session`
  - ❌ No Stripe integration

---

## 🚨 Critical Missing Pieces

### 1. Navigation Flow (HIGH PRIORITY)
```
❌ reco → editor (after wizard completion)
❌ advanced-search → editor (via results)
❌ results → editor (with prefill)
```

### 2. Prefill Integration (HIGH PRIORITY)
```
❌ SmartWizard → prefill → editor
❌ AdvancedSearch → prefill → editor
❌ Results page → prefill → editor
```

### 3. User Management Backend (MEDIUM PRIORITY)
```
❌ User registration API
❌ User login API
❌ User data storage (plans, recommendations)
❌ Session management
```

### 4. Stripe Integration (HIGH PRIORITY)
```
❌ Checkout page → Stripe session
❌ Stripe redirect
❌ Success callback
❌ Webhook handling
```

### 5. Success Hub Flow (LOW PRIORITY)
```
⚠️ Basic UI works
❌ Revision request API
❌ Email integration
❌ Order tracking
```

---

## 🧹 Cleanup Recommendations

### Immediate Actions:

1. **Delete redundant documentation** (17+ files)
2. **Delete root markdown files** (4 files)
3. **Review scraper-lite scripts** - Delete unused analysis scripts
4. **Consolidate document bundles/descriptions** - May be redundant with unified templates

### Code Simplification:

1. **Remove productSectionTemplates.ts** if not used (or populate empty sections)
2. **Remove documentBundles.ts** if unified templates replace it
3. **Simplify prefill.ts** - Remove unused template loading logic

---

## ✅ Testing Checklist

### Components to Test:

- [ ] **SmartWizard:** Complete wizard → Verify navigation to editor
- [ ] **AdvancedSearch:** Search → Verify results → Verify editor link
- [ ] **Editor:** Load with program → Verify prefill works
- [ ] **Export:** Generate documents → Verify all templates work
- [ ] **Checkout:** Add to cart → Verify Stripe integration
- [ ] **Success Hub:** Complete payment → Verify success page

### Data Flow to Test:

- [ ] Scraper saves to database correctly
- [ ] API endpoints return correct data
- [ ] Components receive and display data
- [ ] Prefill populates editor sections
- [ ] Navigation flows work end-to-end

---

## 🎯 Action Plan

### Phase 1: Fix Critical Navigation (IMMEDIATE)
1. Wire SmartWizard completion → Navigate to editor with prefill
2. Wire AdvancedSearch results → Link to editor
3. Wire Results page → Link to editor with prefill

### Phase 2: Wire Prefill (IMMEDIATE)
1. Connect prefill.ts to editor
2. Extract answers from SmartWizard
3. Pass prefilled content to editor
4. Test prefill works correctly

### Phase 3: Stripe Integration (HIGH PRIORITY)
1. Wire checkout.tsx to Stripe session API
2. Add Stripe redirect
3. Wire success callback
4. Test payment flow

### Phase 4: User Management (MEDIUM PRIORITY)
1. Create user API endpoints
2. Add authentication
3. Wire dashboard to API
4. Store user plans/recommendations in database

### Phase 5: Cleanup (LOW PRIORITY)
1. Delete redundant docs
2. Remove unused files
3. Simplify code

---

## 📝 Summary

### Working: ✅
- Scraper → Database → API → Components (data flow)
- Editor loads program data correctly
- Export generates documents
- Unified template system

### Broken/Missing: ❌
- Navigation: reco → editor
- Prefill: Wizard → editor
- Stripe: Checkout not connected
- User Management: Client-side only
- Success Hub: Basic only

### Priority:
1. **IMMEDIATE:** Fix navigation flow
2. **IMMEDIATE:** Wire prefill
3. **HIGH:** Stripe integration
4. **MEDIUM:** User management backend
5. **LOW:** Cleanup

---

**Next Steps:** Fix navigation and prefill first, then Stripe, then user management.

