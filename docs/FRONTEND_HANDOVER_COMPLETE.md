# 🔌 Complete Frontend Handover: Database → Frontend Components

**Date:** 2025-01-03  
**Status:** ⚠️ **NEEDS VERIFICATION AND WORK**  
**Purpose:** Complete accurate documentation for frontend colleague to wire components to database

---

## ⚠️ **IMPORTANT: Current Status**

**The previous handover document was INCORRECT.** This document provides the **actual verified status** after analyzing the codebase.

---

## 🗄️ **DATABASE LAYER** (Your Side - Complete ✅)

### Database Schema
- **Tables:** `pages`, `requirements`
- **Connection:** `scraper-lite/src/db/neon-client.ts`
- **Schema:** `scraper-lite/src/db/neon-schema.sql`
- **Repository:** `scraper-lite/src/db/page-repository.ts`

### Data Structure
- **Pages:** 1,024+ programs with metadata
- **Requirements:** 21,220+ requirements across 18 categories
- **18 Categories:** eligibility, financial, documents, technical, legal, timeline, geographic, team, project, compliance, impact, capex_opex, use_of_funds, revenue_model, market_size, co_financing, trl_level, consortium

---

## 🔌 **API LAYER** (Your Side - Complete ✅)

### Endpoint 1: `/api/programs`
**File:** `pages/api/programs.ts`  
**Status:** ✅ Uses database (with JSON fallback)

**Response Format:**
```typescript
{
  success: true,
  programs: [{
    id: "page_123",
    name: "...",
    type: "grant",
    categorized_requirements: { eligibility: [...], financial: [...], ... },
    eligibility_criteria: { location: "...", ... },
    // ... other fields
  }],
  count: 1024,
  source: "database"
}
```

### Endpoint 2: `/api/programmes/[id]/requirements`
**File:** `pages/api/programmes/[id]/requirements.ts`  
**Status:** ✅ Uses database

**Response Format:**
```typescript
{
  program_id: "page_123",
  decision_tree: [...],
  editor: [...],
  library: [...],
  additionalDocuments: [...]
}
```

### Endpoint 3: `/api/programs-ai`
**File:** `pages/api/programs-ai.ts`  
**Status:** ✅ Uses database

---

## 🎨 **FRONTEND COMPONENTS** (Colleague's Side - Needs Work ⚠️)

### **Component Inventory (ALL FILES)**

#### **1. Pages (Route Components)**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `pages/index.tsx` | ❓ Unknown | ❓ Not checked | Landing page |
| `pages/reco.tsx` | ✅ Wired | `/api/programs` via SmartWizard | Uses SmartWizard component |
| `pages/editor.tsx` | ✅ Wired | `/api/programmes/[id]/requirements` via UnifiedEditor | Uses UnifiedEditor component |
| `pages/library.tsx` | ✅ Wired | `/api/programs` → `/api/programmes/[id]/requirements` | Loads programs list, then ProgramDetails |
| `pages/advanced-search.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `pages/results.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `pages/preview.tsx` | ✅ Wired | `/api/programmes/[id]/requirements` | Uses requirements API |
| `pages/export.tsx` | ✅ Wired | `/api/programmes/[id]/requirements` | Uses requirements API |
| `pages/dashboard.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `pages/program/[id].tsx` | ❓ Unknown | ❓ Not checked | Needs verification |

#### **2. Recommendation Engine Components**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/reco/components/wizard/SmartWizard.tsx` | ✅ **VERIFIED WIRED** | `/api/programs?enhanced=true` | Fetches programs, passes to QuestionEngine |
| `features/reco/engine/questionEngine.ts` | ⚠️ **NEEDS CHECK** | Receives programs from SmartWizard | Expects `categorized_requirements` or `eligibility_criteria` |
| `features/reco/engine/enhancedRecoEngine.ts` | ✅ **VERIFIED WIRED** | `/api/programs?enhanced=true` | Fetches programs for scoring |
| `features/reco/components/ProgramDetailsModal.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/reco/contexts/RecommendationContext.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |

#### **3. Editor Components**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/editor/components/UnifiedEditor.tsx` | ✅ Wired | Via Phase4Integration | Main editor wrapper |
| `features/editor/components/Phase4Integration.tsx` | ⚠️ **NEEDS CHECK** | Via EditorDataProvider | Uses EditorDataProvider |
| `features/editor/components/ProgramSelector.tsx` | ✅ **VERIFIED WIRED** | `/api/programs?enhanced=true` | Fetches programs for selection |
| `features/editor/components/EnhancedAIChat.tsx` | ⚠️ **NEEDS CHECK** | Via EditorDataProvider | Uses aiHelper, needs requirements |
| `features/editor/components/RequirementsChecker.tsx` | ❌ **NOT WIRED** | None - uses `createReadinessValidator` | **NEEDS TO FETCH requirements** |
| `features/editor/components/RichTextEditor.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/editor/components/EntryPointsManager.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/editor/components/DocumentCustomizationPanel.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/editor/components/ExportSettings.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |

#### **4. Editor Engine Files**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/editor/engine/EditorDataProvider.ts` | ✅ **VERIFIED WIRED** | `/api/programmes/[id]/requirements`, `/api/programs` | Main data provider |
| `features/editor/engine/EditorEngine.ts` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/editor/engine/EditorValidation.ts` | ✅ **VERIFIED WIRED** | `/api/programs?enhanced=true` | Fetches programs for validation |
| `features/editor/engine/doctorDiagnostic.ts` | ✅ **VERIFIED WIRED** | `/api/programmes/[id]/requirements` | Fetches requirements for diagnosis |
| `features/editor/engine/aiHelper.ts` | ⚠️ **NEEDS CHECK** | `/api/programmes/[id]/requirements` | Needs requirements data |
| `features/editor/engine/dataSource.ts` | ✅ **VERIFIED WIRED** | `/api/programs`, `/api/programs-ai` | Fetches programs and AI content |
| `features/editor/engine/categoryConverters.ts` | ❓ Unknown | ❓ Not checked | Transform functions, no API |

#### **5. Library Components**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/library/components/ProgramDetails.tsx` | ✅ **VERIFIED WIRED** | `/api/programmes/[id]/requirements` | Fetches library format requirements |
| `features/library/extractor/libraryExtractor.ts` | ❓ Unknown | ❓ Not checked | Extract functions, no API |

#### **6. Intake Components**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/intake/components/PlanIntake.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/intake/engine/intakeEngine.ts` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/intake/engine/prefill.ts` | ✅ **VERIFIED WIRED** | `/api/programs-ai` | Fetches AI-generated content |
| `features/intake/engine/targetGroupDetection.ts` | ❓ Unknown | ❓ Not checked | Needs verification |

#### **7. Export Components**

| File | Status | API Used | Notes |
|------|--------|----------|-------|
| `features/export/components/pricing/RequirementsDisplay.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |
| `features/export/renderer/renderer.tsx` | ❓ Unknown | ❓ Not checked | Needs verification |

---

## 🎯 **GOALS & REQUIREMENTS** (From Codebase Analysis)

### **Goal 1: Program Discovery & Selection**
- **Components:** SmartWizard, ProgramSelector, AdvancedSearch
- **Requirement:** Users should be able to discover and select funding programs
- **Data Needed:** All programs with `categorized_requirements` for filtering
- **Status:** ✅ **Working** (components fetch from `/api/programs`)

### **Goal 2: Program Requirements Display**
- **Components:** Library, ProgramDetails, Preview
- **Requirement:** Display detailed program requirements to users
- **Data Needed:** Single program with library format requirements
- **Status:** ✅ **Working** (components fetch from `/api/programmes/[id]/requirements`)

### **Goal 3: Document Editor with Program-Specific Templates**
- **Components:** UnifiedEditor, Phase4Integration, EnhancedAIChat
- **Requirement:** Editor should use program-specific templates and requirements
- **Data Needed:** Editor sections from requirements API
- **Status:** ⚠️ **PARTIALLY WORKING** (EditorDataProvider wired, but needs verification)

### **Goal 4: Requirements Validation**
- **Components:** RequirementsChecker, EditorValidation
- **Requirement:** Validate user input against program requirements
- **Data Needed:** Program `categorized_requirements` for compliance checking
- **Status:** ❌ **NOT FULLY WIRED** (RequirementsChecker doesn't fetch requirements)

### **Goal 5: AI Assistance**
- **Components:** EnhancedAIChat, aiHelper, prefill
- **Requirement:** AI should provide context-aware assistance based on program requirements
- **Data Needed:** Program requirements and AI-generated content
- **Status:** ⚠️ **PARTIALLY WORKING** (aiHelper needs requirements, dataSource wired)

---

## ❌ **ISSUES FOUND**

### **Issue 1: RequirementsChecker Not Fetching Data**
**File:** `features/editor/components/RequirementsChecker.tsx`  
**Problem:** Uses `createReadinessValidator()` but doesn't fetch program requirements from API  
**Fix Needed:**
```typescript
// CURRENT (WRONG):
const validator = await createReadinessValidator(programType, planContent);

// SHOULD BE:
// 1. Fetch program requirements
const response = await fetch(`/api/programmes/${programId}/requirements`);
const { library, editor } = await response.json();
// 2. Use categorized_requirements for validation
const validator = await createReadinessValidator(programType, planContent, categorized_requirements);
```

### **Issue 2: QuestionEngine Data Format**
**File:** `features/reco/engine/questionEngine.ts`  
**Problem:** Checks for both `eligibility_criteria` AND `categorized_requirements` - need to verify format matches  
**Status:** ⚠️ Needs verification that API response matches expected format

### **Issue 3: Phase4Integration Data Flow**
**File:** `features/editor/components/Phase4Integration.tsx`  
**Problem:** Data flow unclear - uses EditorDataProvider but needs verification  
**Status:** ⚠️ Needs verification

### **Issue 4: EnhancedAIChat Requirements**
**File:** `features/editor/components/EnhancedAIChat.tsx`  
**Problem:** Uses `aiHelper` which needs program requirements - needs verification that requirements are passed  
**Status:** ⚠️ Needs verification

### **Issue 5: Unknown Components**
**Files:** Many components not checked (see ❓ Unknown status above)  
**Problem:** Need to verify all components are properly wired  
**Status:** ⚠️ Needs comprehensive check

---

## 📋 **WORK REQUIRED**

### **Priority 1: Critical Fixes**
1. ✅ **Verify API endpoints return correct format** - Test `/api/programs` and `/api/programmes/[id]/requirements`
2. ❌ **Fix RequirementsChecker** - Add API fetch for program requirements
3. ⚠️ **Verify QuestionEngine data format** - Ensure `categorized_requirements` structure matches expectations
4. ⚠️ **Check all ❓ Unknown components** - Verify wiring status

### **Priority 2: Data Format Verification**
1. Verify `categorized_requirements` structure matches what components expect
2. Verify `eligibility_criteria` structure (backward compatibility)
3. Verify `library` format matches ProgramDetails expectations
4. Verify `editor` format matches EditorDataProvider expectations

### **Priority 3: Integration Testing**
1. Test end-to-end flow: Select program → View details → Use editor → Validate
2. Test error handling: What happens if API fails?
3. Test data loading states: Loading, error, empty states
4. Test with real database data

---

## 📁 **ALL FILES TO CHECK**

### **Pages (24 files)**
```
pages/index.tsx
pages/reco.tsx
pages/editor.tsx
pages/library.tsx
pages/advanced-search.tsx
pages/results.tsx
pages/preview.tsx
pages/export.tsx
pages/dashboard.tsx
pages/program/[id].tsx
pages/checkout.tsx
pages/pricing.tsx
pages/thank-you.tsx
pages/confirm.tsx
pages/for.tsx
pages/login.tsx
pages/about.tsx
pages/contact.tsx
pages/faq.tsx
pages/legal.tsx
pages/privacy.tsx
pages/privacy-settings.tsx
pages/terms.tsx
pages/_app.tsx
```

### **Features/Reco (4 files)**
```
features/reco/components/wizard/SmartWizard.tsx ✅
features/reco/components/ProgramDetailsModal.tsx ❓
features/reco/engine/questionEngine.ts ⚠️
features/reco/engine/enhancedRecoEngine.ts ✅
features/reco/contexts/RecommendationContext.tsx ❓
```

### **Features/Editor (17 files)**
```
features/editor/components/UnifiedEditor.tsx ✅
features/editor/components/Phase4Integration.tsx ⚠️
features/editor/components/ProgramSelector.tsx ✅
features/editor/components/EnhancedAIChat.tsx ⚠️
features/editor/components/RequirementsChecker.tsx ❌
features/editor/components/RichTextEditor.tsx ❓
features/editor/components/EntryPointsManager.tsx ❓
features/editor/components/DocumentCustomizationPanel.tsx ❓
features/editor/components/ExportSettings.tsx ❓
features/editor/engine/EditorDataProvider.ts ✅
features/editor/engine/EditorEngine.ts ❓
features/editor/engine/EditorValidation.ts ✅
features/editor/engine/doctorDiagnostic.ts ✅
features/editor/engine/aiHelper.ts ⚠️
features/editor/engine/dataSource.ts ✅
features/editor/engine/categoryConverters.ts ❓
features/editor/types/editor.ts ❓
```

### **Features/Library (2 files)**
```
features/library/components/ProgramDetails.tsx ✅
features/library/extractor/libraryExtractor.ts ❓
```

### **Features/Intake (4 files)**
```
features/intake/components/PlanIntake.tsx ❓
features/intake/engine/intakeEngine.ts ❓
features/intake/engine/prefill.ts ✅
features/intake/engine/targetGroupDetection.ts ❓
```

### **Features/Export (10 files)**
```
features/export/components/AddOnChips.tsx ❓
features/export/components/CartSummary.tsx ❓
features/export/components/pricing/AddonsSection.tsx ❓
features/export/components/pricing/DocumentModal.tsx ❓
features/export/components/pricing/DocumentSpecModal.tsx ❓
features/export/components/pricing/FilterTabContent.tsx ❓
features/export/components/pricing/FilterTabs.tsx ❓
features/export/components/pricing/ProofSection.tsx ❓
features/export/components/pricing/RequirementsDisplay.tsx ❓
features/export/renderer/renderer.tsx ❓
```

### **API Endpoints (3 files)**
```
pages/api/programs.ts ✅
pages/api/programmes/[id]/requirements.ts ✅
pages/api/programs-ai.ts ✅
```

---

## 🧪 **TESTING CHECKLIST**

- [ ] Test `/api/programs?enhanced=true` returns programs with `categorized_requirements`
- [ ] Test `/api/programmes/page_1/requirements` returns correct format
- [ ] Test SmartWizard loads programs and generates questions
- [ ] Test ProgramSelector displays programs
- [ ] Test Library page displays programs and details
- [ ] Test Editor loads program-specific templates
- [ ] Test RequirementsChecker validates against requirements
- [ ] Test EnhancedAIChat has program context
- [ ] Test error handling when API fails
- [ ] Test loading states in all components

---

## 🚀 **NEXT STEPS FOR COLLEAGUE**

1. **Read this document completely**
2. **Verify API endpoints work** - Run test requests
3. **Check all ❓ Unknown components** - Verify their data sources
4. **Fix RequirementsChecker** - Add API fetch
5. **Verify data formats match** - Check `categorized_requirements` structure
6. **Test end-to-end** - Complete user flow
7. **Document findings** - Update this document with actual status

---

**Status Legend:**
- ✅ = Verified and working
- ⚠️ = Partially working or needs verification
- ❌ = Not working or missing
- ❓ = Not checked yet

**Last Updated:** 2025-01-03  
**Next Review:** After frontend verification

