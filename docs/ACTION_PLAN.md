# 🔧 ACTION PLAN - Make Application Usable

**Date:** 2025-01-03  
**Priority:** Fix user flows and broken endpoints

---

## ✅ **WHAT WORKS**

1. ✅ Scraper-lite → Database (all 18 categories)
2. ✅ Database → API (all endpoints query database)
3. ✅ RequirementsChecker now uses scraper-lite data (FIXED)
4. ✅ Wizard → Results → Editor flow WORKS (results page routes correctly)

---

## ❌ **WHAT'S BROKEN - MUST FIX**

### **1. POST API Endpoint** 🔴

**File:** `pages/api/programmes/[id]/requirements.ts`

**Problem:** POST handler throws error

**Fix:** Remove POST handler (no component uses it)

```typescript
// In pages/api/programmes/[id]/requirements.ts
// REMOVE lines 21-28 (POST handler)
// Keep only GET handler
```

---

### **2. Editor → Export Button** 🔴

**File:** `features/editor/components/Phase4Integration.tsx`

**Problem:** No visible export button

**Fix:** Add export button in editor UI

```typescript
// Add import
import { useRouter } from 'next/router';

// Add router
const router = useRouter();

// Add button in UI (near export settings)
<Button onClick={() => router.push(`/export?programId=${programProfile?.programId}`)}>
  Export Plan
</Button>
```

---

### **3. Remove Empty Folder** 🟡

**Action:** Delete `pages/api/scraper/` folder

---

## ⚠️ **WHAT'S UNCLEAR**

### **User Flow Navigation**

**Current Flow (WORKS):**
- Home → `/reco` (wizard) → `/results` → `/editor` → (missing export button)

**Fix:** Add export button in editor

**Optional:** Add breadcrumbs or progress indicator

---

## 📋 **FILES TO UPDATE**

1. `pages/api/programmes/[id]/requirements.ts` - Remove POST handler
2. `features/editor/components/Phase4Integration.tsx` - Add export button
3. Delete `pages/api/scraper/` folder

---

## 🧪 **TEST AFTER FIXES**

1. ✅ Test: Home → Wizard → Results → Editor
2. ❌ Test: Editor → Export (will work after fix)
3. ❌ Test: Export → Download (verify PDF generation)

---

**Estimated Time:** 30 minutes  
**Complexity:** Low (just add button, remove broken code)

