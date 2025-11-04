# 🔍 FEATURES FOLDER AUDIT - Step by Step

**Date:** 2025-01-03  
**Goal:** Identify what's USED vs UNUSED in features/

---

## 📋 **STEP 1: Check Existing Storage**

### **planStore.ts vs appStore.ts**

**planStore.ts exists:**
- `loadPlanSections()` - Loads plan sections
- `savePlanSections()` - Saves plan sections
- Uses session-based localStorage keys

**appStore.ts (NEW - duplicate?):**
- Extends planStore with more fields
- Adds: userAnswers, enhancedPayload, selectedProgram, planSettings, planSeed

**Question:** Should we extend planStore.ts instead of creating appStore.ts?

---

## 📋 **STEP 2: Audit Features Usage**

### **features/editor/**

**Components:**
- Phase4Integration.tsx - ✅ USED (in UnifiedEditor)
- UnifiedEditor.tsx - ✅ USED (in pages/editor.tsx)
- RequirementsChecker.tsx - ✅ USED (in Phase4Integration)
- RichTextEditor.tsx - ❓ CHECK
- ExportSettings.tsx - ❓ CHECK
- EntryPointsManager.tsx - ❓ CHECK
- DocumentCustomizationPanel.tsx - ❓ CHECK
- EnhancedAIChat.tsx - ❓ CHECK
- ProgramSelector.tsx - ❓ CHECK

**Engine:**
- EditorEngine.ts - ❓ CHECK
- EditorDataProvider.ts - ❓ CHECK
- EditorNormalization.ts - ❓ CHECK
- categoryConverters.ts - ❓ CHECK
- dataSource.ts - ❓ CHECK
- doctorDiagnostic.ts - ❓ CHECK
- EditorValidation.ts - ❓ CHECK
- aiHelper.ts - ❓ CHECK

**Templates:**
- productSectionTemplates.ts - ❓ CHECK

**Types:**
- editor.ts - ❓ CHECK

---

### **features/reco/**

**Components:**
- SmartWizard.tsx - ❓ CHECK
- ProgramDetailsModal.tsx - ❓ CHECK

**Contexts:**
- RecommendationContext.tsx - ❓ CHECK

**Engine:**
- enhancedRecoEngine.ts - ❓ CHECK
- payload.ts - ❓ CHECK
- questionEngine.ts - ❓ CHECK

**Types:**
- reco.ts - ❓ CHECK

---

### **features/export/**

**Components:**
- CartSummary.tsx - ✅ USED (in checkout.tsx)
- AddOnChips.tsx - ❓ CHECK
- pricing/ - ❓ CHECK

**Engine:**
- payments.ts - ❓ CHECK
- pricing.ts - ❓ CHECK
- export.ts - ❓ CHECK
- addons.ts - ❓ CHECK
- email.ts - ❓ CHECK

**Renderer:**
- renderer.tsx - ✅ USED (in preview.tsx, export.tsx)

---

### **features/intake/**

**Components:**
- PlanIntake.tsx - ❓ CHECK

**Engine:**
- intakeEngine.ts - ❓ CHECK
- prefill.ts - ✅ USED (in Phase4Integration)
- targetGroupDetection.ts - ❓ CHECK

---

### **features/library/**

**Components:**
- ProgramDetails.tsx - ❓ CHECK

**Extractor:**
- libraryExtractor.ts - ❓ CHECK

---

## 🎯 **NEXT STEPS**

1. ✅ Check planStore.ts - can we extend it instead of appStore?
2. ✅ Find all imports for each feature file
3. ✅ Mark USED vs UNUSED
4. ✅ Remove unused files
5. ✅ Consolidate storage

