# ✅ FEATURES USAGE AUDIT - Step by Step

**Date:** 2025-01-03  
**Goal:** Identify what's USED vs UNUSED in features/

---

## 📋 **STEP 1: features/editor/components/**

### **✅ USED Components:**

1. **Phase4Integration.tsx** ✅
   - Used by: `UnifiedEditor.tsx`
   - Status: ✅ ACTIVE

2. **UnifiedEditor.tsx** ✅
   - Used by: `pages/editor.tsx`
   - Status: ✅ ACTIVE

3. **RequirementsChecker.tsx** ✅
   - Used by: `Phase4Integration.tsx`
   - Status: ✅ ACTIVE

### **❓ NEED TO CHECK:**

4. **RichTextEditor.tsx** ❓
   - Check if used in Phase4Integration

5. **ExportSettings.tsx** ❓
   - Check if used in UnifiedEditor

6. **EntryPointsManager.tsx** ❓
   - Check if used in Phase4Integration

7. **DocumentCustomizationPanel.tsx** ❓
   - Check if used in Phase4Integration

8. **EnhancedAIChat.tsx** ❓
   - Check if used in Phase4Integration

9. **ProgramSelector.tsx** ❓
   - Check if used in UnifiedEditor

---

## 📋 **STEP 2: features/editor/engine/**

### **✅ USED:**

1. **EditorEngine.ts** ✅
   - Used by: `EditorDataProvider.ts`, `Phase4Integration.tsx`
   - Status: ✅ ACTIVE

2. **EditorDataProvider.ts** ✅
   - Used by: `Phase4Integration.tsx`
   - Status: ✅ ACTIVE

### **❓ NEED TO CHECK:**

3. **EditorNormalization.ts** ❓
   - Check if used

4. **categoryConverters.ts** ❓
   - Check if used

5. **dataSource.ts** ❓
   - Check if used

6. **doctorDiagnostic.ts** ❓
   - Check if used

7. **EditorValidation.ts** ❓
   - Check if used

8. **aiHelper.ts** ❓
   - Check if used

---

## 📋 **STEP 3: features/reco/**

### **✅ USED:**

1. **SmartWizard.tsx** ✅
   - Used by: `pages/reco.tsx`
   - Status: ✅ ACTIVE

2. **RecommendationContext.tsx** ✅
   - Used by: `SmartWizard.tsx`
   - Status: ✅ ACTIVE

3. **enhancedRecoEngine.ts** ✅
   - Used by: `pages/api/recommend.ts`
   - Status: ✅ ACTIVE

### **❓ NEED TO CHECK:**

4. **ProgramDetailsModal.tsx** ❓
   - Check if used

5. **payload.ts** ❓
   - Check if used

6. **questionEngine.ts** ❓
   - Check if used

---

## 📋 **STEP 4: features/export/**

### **✅ USED:**

1. **CartSummary.tsx** ✅
   - Used by: `pages/checkout.tsx`
   - Status: ✅ ACTIVE

2. **renderer.tsx** ✅
   - Used by: `pages/preview.tsx`, `pages/export.tsx`
   - Status: ✅ ACTIVE

### **❓ NEED TO CHECK:**

3. **AddOnChips.tsx** ❓
   - Check if used

4. **pricing/** folder ❓
   - Check if used

5. **payments.ts** ❓
   - Check if used

6. **pricing.ts** ❓
   - Check if used

7. **export.ts** ❓
   - Check if used

8. **addons.ts** ❓
   - Check if used

9. **email.ts** ❓
   - Check if used

---

## 📋 **STEP 5: features/intake/**

### **✅ USED:**

1. **prefill.ts** ✅
   - Used by: `Phase4Integration.tsx`
   - Status: ✅ ACTIVE

### **❓ NEED TO CHECK:**

2. **PlanIntake.tsx** ❓
   - Check if used

3. **intakeEngine.ts** ❓
   - Check if used

4. **targetGroupDetection.ts** ❓
   - Check if used

---

## 📋 **STEP 6: features/library/**

### **❓ NEED TO CHECK:**

1. **ProgramDetails.tsx** ❓
   - Check if used

2. **libraryExtractor.ts** ❓
   - Check if used

---

## 🎯 **NEXT STEPS:**

1. ✅ Check each component/engine file for imports
2. ✅ Mark USED vs UNUSED
3. ✅ Remove unused files
4. ✅ Document what's actually used

