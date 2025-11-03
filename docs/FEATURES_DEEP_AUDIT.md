# 🔍 DEEP FEATURES AUDIT - Step by Step

**Date:** 2025-01-03  
**Goal:** Check if files are USED, REPLACED, or UNUSED

---

## 📋 **STEP 1: features/editor/components/**

### **ExportSettings.tsx** ❓

**Check:**
- Not imported in UnifiedEditor.tsx (shows in modal but need to verify if modal is used)
- Check if replaced by ExportRenderer or other export functionality

**Status:** ❓ VERIFY

---

## 📋 **STEP 2: features/editor/engine/**

### **categoryConverters.ts** ❓

**Check:**
- Used by EditorEngine or EditorDataProvider?
- Check if replaced by categoryConverter in shared/lib/readiness.ts

**Status:** ❓ VERIFY

### **EditorValidation.ts** ❓

**Check:**
- Used by EditorEngine or other components?
- Check if validation is done elsewhere

**Status:** ❓ VERIFY

---

## 📋 **STEP 3: features/reco/**

### **ProgramDetailsModal.tsx** ❓

**Check:**
- Used in pages or components?
- Check if replaced by ProgramDetails component

**Status:** ❓ VERIFY

### **payload.ts** ❓

**Check:**
- Used by enhancedRecoEngine or other reco files?
- Check if it's actually imported

**Status:** ❓ VERIFY

### **questionEngine.ts** ❓

**Check:**
- Used by SmartWizard or RecommendationContext?
- Check if replaced by QuestionEngine in shared/lib/readiness.ts

**Status:** ❓ VERIFY

---

## 📋 **STEP 4: features/export/**

### **AddOnChips.tsx** ❓

**Check:**
- Used in checkout, export, or pricing pages?
- Check if addon functionality is used

**Status:** ❓ VERIFY

### **pricing.ts** ❓

**Check:**
- Used by CartSummary or other export components?
- Check if pricing logic is used

**Status:** ❓ VERIFY

### **payments.ts** ❓

**Check:**
- Used by checkout or export pages?
- Check if payment logic is in API endpoints instead

**Status:** ❓ VERIFY

### **export.ts** ❓

**Check:**
- Used by export page or renderer?
- Check if export functionality is in renderer.tsx

**Status:** ❓ VERIFY

### **addons.ts** ❓

**Check:**
- Used by AddOnChips or other components?
- Check if addon functionality is used

**Status:** ❓ VERIFY

### **email.ts** ❓

**Check:**
- Used by export or thank-you pages?
- Check if email functionality is used

**Status:** ❓ VERIFY

---

## 📋 **STEP 5: features/intake/**

### **PlanIntake.tsx** ❓

**Check:**
- Used in pages?
- Check if intake flow is used

**Status:** ❓ VERIFY

### **intakeEngine.ts** ❓

**Check:**
- Used by PlanIntake or API endpoints?
- Check if /api/intake/parse uses it

**Status:** ❓ VERIFY

### **targetGroupDetection.ts** ❓

**Check:**
- Used by PlanIntake or other components?
- Check if target group detection is used

**Status:** ❓ VERIFY

---

## 📋 **STEP 6: features/library/**

### **ProgramDetails.tsx** ❓

**Check:**
- Used in pages/library.tsx?
- Check if library page uses it

**Status:** ❓ VERIFY

### **libraryExtractor.ts** ❓

**Check:**
- Used by ProgramDetails or library page?
- Check if extraction logic is used

**Status:** ❓ VERIFY

---

## 🎯 **NEXT: Check each file systematically**

