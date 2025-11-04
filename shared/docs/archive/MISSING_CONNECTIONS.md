# ❌ MISSING CONNECTIONS - Complete Flow Analysis

**Date:** 2025-01-03  
**Critical:** These connections prevent users from completing the flow

---

## 🔴 **CRITICAL MISSING CONNECTIONS**

### **1. Wizard Answers → Editor Prefill** ❌ **BROKEN**

**Problem:** User answers from wizard are NOT prefilling editor sections

**Current State:**
- ✅ Wizard stores answers in `localStorage.userAnswers` and `localStorage.enhancedPayload`
- ✅ Results page routes to `/editor?programId=X&answers=...&pf=...`
- ✅ Editor receives `answers` prop from URL
- ❌ **BUT:** Editor does NOT use answers to prefill sections

**Files:**
- `pages/editor.tsx` - Parses `answers` from URL query
- `features/editor/components/UnifiedEditor.tsx` - Receives `answers` prop
- `features/editor/components/Phase4Integration.tsx` - **MISSING:** Doesn't read answers to prefill

**Code That Exists But Not Used:**
- `features/editor/engine/EditorNormalization.ts` - Has `extractPrefillData()` function
- `features/intake/engine/prefill.ts` - Has prefill functions

**Missing Implementation:**
```typescript
// In Phase4Integration.tsx - loadProgramSections()
// Should add:
const userAnswers = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('userAnswers') || '{}')
  : {};
const enhancedPayload = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('enhancedPayload') || '{}')
  : {};

// Then prefill sections
const { mapAnswersToSections } = await import('@/features/intake/engine/prefill');
const prefilledData = mapAnswersToSections(userAnswers, programData);
// Apply prefilledData to sections
```

**Impact:** User fills wizard → Gets to editor → Has to type everything again

---

### **2. Preview → Export Button** ❌ **MISSING**

**Problem:** Preview page has no export button

**Current State:**
- Preview page shows plan preview
- Has "Continue to Confirm" link
- ❌ **BUT:** No "Export" button

**Missing:**
```typescript
// In preview.tsx - Add export button
<button onClick={() => router.push(`/export?programId=${programId}`)}>
  Export Plan
</button>
```

**Impact:** User can preview but can't export directly

---

### **3. Export → Checkout** ⚠️ **PARTIAL**

**Current State:**
- Export page has checkout link (`href="/checkout"`)
- ✅ **WORKING** - But may not pass required data

**Status:** ⚠️ Needs verification if checkout receives plan data

---

### **4. Checkout → Thank You** ❌ **MISSING**

**Problem:** Checkout doesn't route to thank-you after payment

**Current State:**
- Checkout page has stub payment
- ❌ **BUT:** "Pay Now" button doesn't route anywhere
- Thank-you page exists but not connected

**Missing:**
```typescript
// In checkout.tsx - After payment success
router.push('/thank-you?downloadUrl=...');
```

**Impact:** User pays but doesn't get thank-you page or download link

---

### **5. UnifiedEditor → Phase4Integration Data Pass** ⚠️ **INCOMPLETE**

**Problem:** `UnifiedEditor` receives `answers` and `payload` but doesn't pass to `Phase4Integration`

**Current State:**
- `UnifiedEditor` receives props: `answers`, `payload`
- ❌ **BUT:** `Phase4Integration` doesn't receive these props
- ❌ `Phase4Integration` doesn't read from localStorage

**Missing:**
```typescript
// In UnifiedEditor.tsx - Pass answers/payload to Phase4Integration
<Phase4Integration
  initialPlan={undefined}
  programProfile={...}
  wizardAnswers={normalizedData.allData.wizardAnswers} // ADD THIS
  enhancedPayload={normalizedData.allData.enhancedPayload} // ADD THIS
/>
```

---

## 📋 **COMPLETE FLOW STATUS**

```
1. Home → Wizard ✅
   ↓
2. Wizard → Results ✅ (stores answers)
   ↓
3. Results → Editor ✅ (routes with answers)
   ↓
4. Editor → Prefill Sections ❌ **BROKEN** - Answers not used
   ↓
5. Editor → Write Plan ✅ (can write manually)
   ↓
6. Editor → Preview ✅ (just fixed)
   ↓
7. Preview → Export ❌ **MISSING** - No export button
   ↓
8. Preview → Confirm ⚠️ (has link)
   ↓
9. Confirm → Checkout ✅ (has link)
   ↓
10. Export → Checkout ⚠️ (has link but may not pass data)
   ↓
11. Checkout → Thank You ❌ **MISSING** - No route after payment
   ↓
12. Thank You → Download ⚠️ (page exists but needs download link)
```

---

## 🎯 **PRIORITY FIXES**

### **Fix 1: Wizard Answers → Editor Prefill** 🔴 **CRITICAL**

**File:** `features/editor/components/Phase4Integration.tsx`

**Add to `loadProgramSections` function:**
```typescript
// Read wizard answers from localStorage
const userAnswers = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('userAnswers') || '{}')
  : {};
const enhancedPayload = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('enhancedPayload') || '{}')
  : {};

// Use prefill engine to populate sections
if (Object.keys(userAnswers).length > 0) {
  const { mapAnswersToSections } = await import('@/features/intake/engine/prefill');
  const prefilledSections = mapAnswersToSections(userAnswers, programData);
  
  // Merge prefilled content into sections
  sections = sections.map(section => {
    const prefill = prefilledSections[section.id] || prefilledSections[section.key];
    if (prefill && prefill.content) {
      return { ...section, content: prefill.content };
    }
    return section;
  });
}
```

---

### **Fix 2: Preview → Export Button** 🔴 **CRITICAL**

**File:** `pages/preview.tsx`

**Add export button next to "Continue to Confirm":**
```typescript
<button
  onClick={() => {
    const { programId } = router.query;
    router.push(`/export?programId=${programId || ''}`);
  }}
  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg"
>
  📄 Export Plan
</button>
```

---

### **Fix 3: Checkout → Thank You** 🟡

**File:** `pages/checkout.tsx`

**Update "Pay Now" button:**
```typescript
<button 
  onClick={async () => {
    // Process payment (stub for now)
    // After success:
    router.push('/thank-you?payment=success');
  }}
  className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
>
  Pay Now
</button>
```

---

### **Fix 4: UnifiedEditor → Phase4Integration Data Pass** 🟡

**File:** `features/editor/components/UnifiedEditor.tsx`

**Pass answers/payload to Phase4Integration:**
```typescript
<Phase4Integration
  initialPlan={undefined}
  programProfile={...}
  wizardAnswers={normalizedData.allData.wizardAnswers}
  enhancedPayload={normalizedData.allData.enhancedPayload}
/>
```

**Then in Phase4Integration:**
```typescript
interface Phase4IntegrationProps {
  // ... existing props
  wizardAnswers?: Record<string, any>;
  enhancedPayload?: Record<string, any>;
}
```

---

## ✅ **WHAT'S WORKING**

1. ✅ Home → Wizard routing
2. ✅ Wizard → Results (stores answers)
3. ✅ Results → Editor routing (passes answers in URL)
4. ✅ Editor saves content
5. ✅ Editor → Preview button (just added)
6. ✅ Preview page loads plan
7. ✅ Export page exists
8. ✅ Checkout page exists
9. ✅ Thank-you page exists

---

## 📊 **SUMMARY**

**Critical Missing:**
- ❌ Wizard answers → Editor prefill (users retype everything)
- ❌ Preview → Export button
- ❌ Checkout → Thank-you route

**Partial:**
- ⚠️ UnifiedEditor → Phase4Integration data pass
- ⚠️ Export → Checkout data pass

**Working:**
- ✅ All routing works
- ✅ Data saves
- ✅ Pages exist

**Main Issue:** Data flows but doesn't populate editor sections with wizard answers

