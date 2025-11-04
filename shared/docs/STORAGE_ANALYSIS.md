# 📦 STORAGE ANALYSIS - planStore vs appStore

**Date:** 2025-01-03  
**Question:** Why create appStore when planStore exists?

---

## ✅ **EXISTING: planStore.ts**

**What it does:**
- `loadPlanSections()` - Loads plan sections from localStorage
- `savePlanSections()` - Saves plan sections to localStorage
- Uses session-based keys: `plan_sections_${sessionId}`

**Used by:**
- `pages/preview.tsx`
- `features/editor/components/Phase4Integration.tsx`
- `features/editor/engine/EditorDataProvider.ts`
- `pages/export.tsx`

**Status:** ✅ WORKING, actively used

---

## ❌ **NEW: appStore.ts (DUPLICATE?)**

**What it does:**
- Extends planStore functionality
- Adds: userAnswers, enhancedPayload, selectedProgram, planSettings, planSeed
- Re-exports planStore functions for backward compatibility

**Problem:** 
- Creates duplicate functionality
- planStore.ts already exists and works
- Should EXTEND planStore.ts instead of creating new file

---

## 🎯 **SOLUTION: Extend planStore.ts**

**Instead of appStore.ts, we should:**
1. Add new functions to planStore.ts
2. Keep single source of truth
3. Remove appStore.ts

**New functions to add to planStore.ts:**
- `saveUserAnswers()` / `loadUserAnswers()`
- `saveEnhancedPayload()` / `loadEnhancedPayload()`
- `saveSelectedProgram()` / `loadSelectedProgram()`
- `savePlanSettings()` / `loadPlanSettings()`
- `savePlanSeed()` / `loadPlanSeed()`

---

## ✅ **ACTION PLAN**

1. ✅ Extend planStore.ts with new functions
2. ✅ Update components to use planStore (not appStore)
3. ✅ Remove appStore.ts
4. ✅ Test everything still works

