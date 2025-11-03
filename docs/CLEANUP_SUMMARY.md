# ✅ CLEANUP SUMMARY

**Date:** 2025-01-03  
**Actions:** Removed unused files, kept payments/email

---

## ✅ **DELETED FILES:**

### **features/export/**
1. ✅ **AddOnChips.tsx** - Not used anywhere
2. ✅ **addons.ts** - Not used anywhere  
3. ✅ **export.ts** - Replaced by renderer.tsx

### **features/intake/**
4. ✅ **targetGroupDetection.ts** - Integrated into intakeEngine.ts

---

## ✅ **KEPT (As Requested):**

1. ✅ **payments.ts** - Kept (might be used in future)
2. ✅ **email.ts** - Kept (might be used in future)

---

## ❓ **SUSPICIOUS (Need Decision):**

### **features/intake/**
1. ❓ **PlanIntake.tsx** - No page route, not imported
   - **Question:** Delete or create page for it?

2. ❓ **intakeEngine.ts** - Used by `/api/intake/parse`
   - **Question:** Is `/api/intake/parse` actually called? (Not found)

3. ❓ **pages/api/intake/parse.ts** - API endpoint exists
   - **Question:** Is it called by any component? (Not found)

4. ❓ **pages/api/intake/plan.ts** - Just a stub
   - **Question:** Only called by PlanIntake (which is unused)

---

## 📊 **STATUS:**

**Deleted:** 4 files  
**Kept:** 2 files (payments, email)  
**Suspicious:** 4 files (need decision on intake)

**Next:** Decide on intake files - delete or keep?

