# 🔍 INTAKE FILES ANALYSIS - Are They Outdated?

**Date:** 2025-01-03  
**Question:** Are intake files actually used or outdated?

---

## ✅ **DELETED (As Requested):**

1. ✅ **AddOnChips.tsx** - Deleted (not used)
2. ✅ **addons.ts** - Deleted (not used)
3. ✅ **export.ts** - Deleted (replaced by renderer.tsx)

**KEPT:**
- ✅ **payments.ts** - Kept (as requested)
- ✅ **email.ts** - Kept (as requested)

---

## ❓ **INTAKE FILES STATUS:**

### **1. features/intake/components/PlanIntake.tsx** ❌ **OUTDATED**

**Findings:**
- ❌ No page route found for `/intake`
- ❌ Component not imported in any pages
- ✅ Calls `/api/intake/plan` (but that API is just a stub)
- Uses localStorage directly (should use planStore)

**Status:** ❌ **LIKELY OUTDATED** - No page uses it, no route exists

**Action:** ❓ DELETE or CREATE PAGE?

---

### **2. features/intake/engine/intakeEngine.ts** ❓ **SUSPICIOUS**

**Findings:**
- ✅ Used by `/api/intake/parse`
- ❓ But is `/api/intake/parse` actually called by any component?
- ✅ Has comment: "INTEGRATED: targetGroupDetection.ts"
- Contains 1256 lines - very large file

**Status:** ❓ **SUSPICIOUS** - API exists but might not be called

**Action:** ❓ Check if API is called, if not - DELETE

---

### **3. features/intake/engine/prefill.ts** ✅ **USED**

**Findings:**
- ✅ Used by Phase4Integration.tsx
- ✅ Active in editor prefill flow

**Status:** ✅ **KEEP** - Actively used

---

### **4. features/intake/engine/targetGroupDetection.ts** ❌ **INTEGRATED**

**Findings:**
- ✅ Comment in intakeEngine.ts says: "INTEGRATED: targetGroupDetection.ts"
- ✅ Detection logic is in intakeEngine.ts
- ❌ Not imported anywhere

**Status:** ❌ **DUPLICATE/INTEGRATED** - Logic is in intakeEngine.ts

**Action:** ❌ **DELETE** - Integrated into intakeEngine.ts

---

### **5. pages/api/intake/parse.ts** ❓ **SUSPICIOUS**

**Findings:**
- ✅ Uses intakeEngine.ts
- ❓ No component calls this API endpoint
- ❓ Might be legacy/unused

**Status:** ❓ **SUSPICIOUS** - API exists but might not be called

**Action:** ❓ Check if used, if not - DELETE

---

### **6. pages/api/intake/plan.ts** ❌ **STUB**

**Findings:**
- ❌ Just returns skeleton chapters
- ❌ No real logic
- ✅ Called by PlanIntake.tsx (but that component is not used)

**Status:** ❌ **STUB** - Not doing real work

**Action:** ❓ DELETE if PlanIntake is deleted

---

## 🎯 **RECOMMENDATIONS:**

### **DELETE:**
1. ❌ **targetGroupDetection.ts** - Integrated into intakeEngine.ts
2. ❓ **PlanIntake.tsx** - No page uses it
3. ❓ **pages/api/intake/plan.ts** - Stub, only called by unused PlanIntake

### **KEEP (for now):**
1. ✅ **prefill.ts** - Used by editor
2. ❓ **intakeEngine.ts** - Used by API, but verify if API is called
3. ❓ **pages/api/intake/parse.ts** - Verify if called

---

## ❓ **QUESTIONS:**

1. Is `/api/intake/parse` called by any component? (No found)
2. Should we delete PlanIntake.tsx if no page uses it?
3. Is targetGroupDetection.ts really integrated? (Yes - comment says so)

