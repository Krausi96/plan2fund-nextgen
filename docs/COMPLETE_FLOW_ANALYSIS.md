# 🔍 COMPLETE DATA FLOW ANALYSIS - What's Missing

**Date:** 2025-01-03  
**Goal:** Identify ALL missing connections from wizard → final export

---

## 📋 **COMPLETE USER JOURNEY**

1. **Home** → Wizard (`/reco`)
2. **Wizard** → Results (`/results`)
3. **Results** → Editor (`/editor?programId=X&answers=...&pf=...`)
4. **Editor** → Write Plan (with prefill from answers)
5. **Editor** → Preview (`/preview`)
6. **Preview** → Export (`/export`)
7. **Export** → Checkout (`/checkout`) OR Download
8. **Checkout** → Thank You (`/thank-you`)

---

## ✅ **WHAT'S CONNECTED**

### **1. Home → Wizard** ✅
- Home page routes to `/reco`
- ✅ **WORKING**

### **2. Wizard → Results** ✅
- SmartWizard completes → routes to `/results`
- Answers stored in `RecommendationContext`
- ✅ **WORKING**

### **3. Results → Editor** ✅
- Results page has "Continue to Plan" button
- Routes to `/editor?programId=X&route=...&product=...&answers=...&pf=...`
- Stores in localStorage: `selectedProgram`, `userAnswers`, `enhancedPayload`
- ✅ **WORKING**

### **4. Editor → Preview** ✅
- Preview button routes to `/preview?programId=X`
- ✅ **WORKING** (just added)

---

## ❌ **WHAT'S MISSING OR BROKEN**

### **Issue 1: Wizard Answers → Editor Prefill** ❌ **CRITICAL**

**Problem:** Wizard answers are NOT prefilling editor sections

**Current State:**
- Answers stored in `localStorage.userAnswers` and `localStorage.enhancedPayload`
- Editor loads but doesn't read these to prefill sections
- `prefill.ts` exists but may not be called

**Files Involved:**
- `features/reco/engine/prefill.ts` - Prefill engine exists
- `features/editor/components/UnifiedEditor.tsx` - Receives `answers` prop but doesn't use it
- `features/editor/components/Phase4Integration.tsx` - Doesn't read localStorage answers

**Missing Connection:**
```typescript
// In Phase4Integration.tsx or UnifiedEditor.tsx
// Should read:
const userAnswers = JSON.parse(localStorage.getItem('userAnswers') || '{}');
const enhancedPayload = JSON.parse(localStorage.getItem('enhancedPayload') || '{}');
// Then prefill sections using prefill.ts
```

**Fix Needed:**
- Read `userAnswers` and `enhancedPayload` in editor
- Call prefill engine to populate sections with answers
- Map wizard answers to editor section content

---

### **Issue 2: Program Requirements → Editor Sections** ⚠️ **PARTIAL**

**Current State:**
- Editor loads sections from `/api/programmes/[id]/requirements`
- Sections are loaded but not enriched with program-specific requirements

**Missing:**
- Program requirements (18 categories) should enhance section prompts
- RequirementsChecker validates but doesn't pre-populate content

**Status:** ⚠️ Sections load, but prompts not enriched enough

---

### **Issue 3: Writing Plan → Save State** ✅ **WORKING**
- Content saves to `localStorage` via `savePlanSections()`
- ✅ **WORKING**

---

### **Issue 4: Preview → Export Link** ❌ **MISSING**

**Problem:** Preview page has no clear button to export

**Current State:**
- Preview page shows plan preview
- Has "Continue to Confirm" link (goes to `/confirm`)
- **BUT:** No direct "Export" button

**Missing:**
```typescript
// In preview.tsx - should have:
<button onClick={() => router.push('/export?programId=...')}>
  Export Plan
</button>
```

**Fix Needed:**
- Add "Export" button in preview page
- Route to `/export?programId=X`

---

### **Issue 5: Export → Checkout** ❌ **UNCLEAR**

**Problem:** Export page doesn't route to checkout clearly

**Current State:**
- Export page exists (`pages/export.tsx`)
- Has export functionality (PDF/DOCX generation)
- **BUT:** No clear path to checkout for paid exports

**Missing:**
- Export button should route to checkout if payment required
- OR export directly if free tier

**Status:** ⚠️ Needs verification - check export page logic

---

### **Issue 6: Checkout → Thank You** ❌ **MISSING**

**Problem:** No clear connection between checkout and thank you

**Current State:**
- `pages/checkout.tsx` exists
- `pages/thank-you.tsx` exists
- **BUT:** Checkout may not route to thank-you after payment

**Missing:**
- Payment success → route to `/thank-you`
- Include download link in thank-you page

---

## 🔧 **MISSING CONNECTIONS - DETAILED**

### **Connection 1: Wizard Answers → Editor Prefill** 🔴 **CRITICAL**

**Location:** `features/editor/components/Phase4Integration.tsx`

**What Should Happen:**
1. Read `localStorage.userAnswers` and `localStorage.enhancedPayload`
2. Import `prefill.ts` engine
3. Call prefill to populate sections
4. Fill section content with prefill data

**Current Code:**
```typescript
// Phase4Integration.tsx - loadProgramSections
// Should add:
const userAnswers = typeof window !== 'undefined' 
  ? JSON.parse(localStorage.getItem('userAnswers') || '{}')
  : {};
const enhancedPayload = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('enhancedPayload') || '{}')
  : {};

// Then use prefill engine
const { prefillSections } = await import('@/features/reco/engine/prefill');
const prefilledSections = prefillSections(sections, userAnswers, enhancedPayload);
```

**Missing:** This logic is not implemented

---

### **Connection 2: Preview → Export** 🔴 **CRITICAL**

**Location:** `pages/preview.tsx`

**What Should Happen:**
- Add "Export" button that routes to `/export?programId=X`

**Current:** Has "Continue to Confirm" but no export button

---

### **Connection 3: Export → Checkout** 🟡 **NEEDS CHECK**

**Location:** `pages/export.tsx`

**What Should Happen:**
- If payment required → Route to `/checkout`
- If free → Download directly

**Status:** Need to check export.tsx logic

---

### **Connection 4: Checkout → Thank You** 🟡 **NEEDS CHECK**

**Location:** `pages/checkout.tsx`

**What Should Happen:**
- After successful payment → Route to `/thank-you?downloadUrl=...`

**Status:** Need to check checkout.tsx

---

## 📊 **DATA FLOW DIAGRAM**

```
Home
  ↓
Wizard (/reco)
  ↓ [stores: userAnswers, enhancedPayload]
Results (/results)
  ↓ [stores: selectedProgram]
Editor (/editor)
  ❌ MISSING: Read localStorage answers and prefill sections
  ✅ Works: Load sections from API
  ✅ Works: Save content to localStorage
  ↓
Preview (/preview)
  ❌ MISSING: Export button
  ↓
Export (/export)
  ⚠️ UNKNOWN: Routes to checkout?
  ↓
Checkout (/checkout)
  ⚠️ UNKNOWN: Routes to thank-you?
  ↓
Thank You (/thank-you)
```

---

## 🎯 **PRIORITY FIXES**

### **Priority 1: Wizard Answers → Editor Prefill** 🔴

**Fix:**
1. In `Phase4Integration.tsx` - `loadProgramSections` function
2. Read `localStorage.userAnswers` and `localStorage.enhancedPayload`
3. Call prefill engine to populate sections
4. Fill section content with prefill data

**File:** `features/editor/components/Phase4Integration.tsx`
**Function:** `loadProgramSections`

---

### **Priority 2: Preview → Export Button** 🔴

**Fix:**
1. In `pages/preview.tsx`
2. Add "Export" button
3. Route to `/export?programId=${programId}`

**File:** `pages/preview.tsx`

---

### **Priority 3: Export → Checkout Flow** 🟡

**Fix:**
1. Check `pages/export.tsx` logic
2. Verify payment flow
3. Add route to checkout if needed

**File:** `pages/export.tsx`

---

### **Priority 4: Checkout → Thank You** 🟡

**Fix:**
1. Check `pages/checkout.tsx` payment success handler
2. Route to `/thank-you` after payment
3. Include download link

**File:** `pages/checkout.tsx`

---

## 📋 **SUMMARY**

**Working:**
- ✅ Home → Wizard → Results → Editor (routing works)
- ✅ Editor saves content
- ✅ Editor → Preview (just fixed)

**Missing:**
- ❌ Wizard answers → Editor prefill (CRITICAL)
- ❌ Preview → Export button (CRITICAL)
- ⚠️ Export → Checkout (needs check)
- ⚠️ Checkout → Thank You (needs check)

**Main Issue:** User answers from wizard are NOT prefilling editor sections

