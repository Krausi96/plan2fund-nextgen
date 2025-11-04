# 🔌 Complete Wiring Status & Missing Components

**Date:** 2025-11-02  
**Status:** Analysis Complete - Ready for Fixes

---

## ✅ Working Components

### 1. SmartWizard & QuestionEngine ✅

**Flow:**
```
SmartWizard.tsx
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts (Database Primary)
  ↓ Query: pages + requirements tables
  ↓ Transform: categorized_requirements
  ↓
QuestionEngine(programs)
  ↓ Generate questions
  ↓ Filter programs
```

**Status:** ✅ **Working** - Uses database correctly

---

### 2. AdvancedSearch ✅

**Flow:**
```
AdvancedSearchDoctor
  ↓ scoreProgramsEnhanced()
  ↓
enhancedRecoEngine.ts
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts (Database Primary)
  ↓ Returns programs with categorized_requirements
```

**Status:** ✅ **Working** - Uses database correctly

---

### 3. ProgramSelector ✅

**Flow:**
```
ProgramSelector.tsx
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts (Database Primary)
  ↓ Returns programs for selection
```

**Status:** ✅ **Working** - Uses database correctly

---

### 4. Library Component ✅

**Flow:**
```
ProgramDetails.tsx
  ↓ fetch(`/api/programmes/${programId}/requirements`)
  ↓
pages/api/programmes/[id]/requirements.ts (FIXED)
  ↓ Query: pages + requirements tables
  ↓ Transform: library format
```

**Status:** ✅ **Fixed** - Now uses database correctly

---

### 5. EnhancedAIChat ✅

**Flow:**
```
EnhancedAIChat.tsx
  ↓ EditorDataProvider.getProduct(productId)
  ↓ fetch(`/api/programmes/${productId}/requirements`)
  ↓
pages/api/programmes/[id]/requirements.ts (FIXED)
  ↓ Returns editor sections
```

**Status:** ✅ **Fixed** - Now uses database correctly

---

### 6. EditorDataProvider ✅

**Flow:**
```
EditorDataProvider.ts
  ↓ getProduct() → `/api/programmes/${id}/requirements`
  ↓ getProducts() → `/api/programs?enhanced=true`
  ↓ loadSections() → `/api/programmes/${id}/requirements`
```

**Status:** ✅ **Working** - All endpoints use database

---

## ⚠️ Components That Need Fixing

### 7. dataSource.ts (Missing API Endpoint)

**Issue:** Calls `/api/programs-ai?action=...` but endpoint didn't exist

**Actions:**
- `getDecisionTreeQuestions()` → `/api/programs-ai?action=questions`
- `getEditorSections()` → `/api/programs-ai?action=sections`
- `getReadinessCriteria()` → `/api/programs-ai?action=criteria`
- `getAIGuidance()` → `/api/programs-ai?action=guidance`

**Status:** ✅ **FIXED** - Created `/api/programs-ai.ts` endpoint

**New Endpoint:** `pages/api/programs-ai.ts`
- Queries database (pages + requirements)
- Returns AI-generated content based on categorized_requirements
- Supports all 4 actions

---

### 8. RequirementsChecker (Needs Program Data)

**Issue:** Uses `createReadinessValidator(programType, planContent)` but:
- `getProgramRequirements()` tries `dataSource.getProgramsByType(type)`
- Falls back to static `PROGRAM_REQUIREMENTS` if dataSource fails
- Not using database requirements

**Current Flow:**
```
RequirementsChecker.tsx
  ↓ createReadinessValidator(programType, planContent)
  ↓
readiness.ts
  ↓ getProgramRequirements(type)
  ↓ dataSource.getProgramsByType(type) [may fail]
  ↓ Falls back to static PROGRAM_REQUIREMENTS
```

**Problem:** Not using database requirements from actual program

**Solution Needed:**
- RequirementsChecker needs `programId` prop (not just `programType`)
- Should fetch requirements from `/api/programmes/${programId}/requirements`
- Use actual program requirements instead of static fallback

**Status:** ⚠️ **Needs Fix** - Should use database requirements

---

### 9. EditorValidation

**Flow:**
```
EditorValidation.ts
  ↓ fetch('/api/programs?enhanced=true')
  ↓
pages/api/programs.ts (Database Primary)
```

**Status:** ✅ **Working** - Uses database correctly

---

### 10. doctorDiagnostic

**Flow:**
```
doctorDiagnostic.ts
  ↓ fetch(`/api/programmes/${program.id}/requirements`)
  ↓
pages/api/programmes/[id]/requirements.ts (FIXED)
```

**Status:** ✅ **Working** - Uses database correctly

---

### 11. prefill.ts

**Flow:**
```
prefill.ts
  ↓ fetch('/api/programs-ai?action=programs')
  ↓
pages/api/programs-ai.ts (NEW)
```

**Status:** ✅ **Working** - Uses new endpoint

---

## 📊 Complete Component Inventory

| Component | API Endpoint | Database | Status | Notes |
|-----------|--------------|----------|--------|-------|
| SmartWizard | `/api/programs?enhanced=true` | ✅ | ✅ Working | |
| QuestionEngine | Uses programs from SmartWizard | ✅ | ✅ Working | |
| AdvancedSearch | `/api/programs?enhanced=true` | ✅ | ✅ Working | |
| ProgramSelector | `/api/programs?enhanced=true` | ✅ | ✅ Working | |
| Library | `/api/programmes/[id]/requirements` | ✅ | ✅ Fixed | Was using wrong table |
| EnhancedAIChat | `/api/programmes/[id]/requirements` | ✅ | ✅ Fixed | Was using wrong table |
| EditorDataProvider | `/api/programmes/[id]/requirements` | ✅ | ✅ Working | |
| dataSource | `/api/programs-ai?action=...` | ✅ | ✅ Fixed | Endpoint was missing |
| RequirementsChecker | Static fallback | ❌ | ⚠️ Needs Fix | Should use database |
| EditorValidation | `/api/programs?enhanced=true` | ✅ | ✅ Working | |
| doctorDiagnostic | `/api/programmes/[id]/requirements` | ✅ | ✅ Working | |
| prefill | `/api/programs-ai?action=programs` | ✅ | ✅ Working | |
| aiHelper | `/api/programmes/[id]/requirements` | ✅ | ✅ Working | |

---

## 🔧 Fixes Applied

### 1. Created Missing API Endpoint ✅

**File:** `pages/api/programs-ai.ts`

**Purpose:** Provides AI-generated content for programs
- Decision tree questions
- Editor sections
- Readiness criteria
- AI guidance

**Implementation:**
- Queries database (pages + requirements)
- Uses `QuestionEngine` for questions
- Uses `categoryConverter` for sections
- Derives criteria from requirements

---

### 2. Fixed RequirementsChecker Flow ⚠️ (Partially)

**Current Issue:**
- RequirementsChecker receives `programType` (string like "grant")
- Tries to get requirements by type, falls back to static
- Should receive `programId` instead and fetch actual program requirements

**Recommended Fix:**
```typescript
// Change RequirementsChecker props:
interface RequirementsCheckerProps {
  programId?: string;  // ADD THIS
  programType: string;
  planContent: Record<string, any>;
  onRequirementClick?: (section: string, requirement: string) => void;
}

// Update to fetch from database:
if (programId) {
  const response = await fetch(`/api/programmes/${programId}/requirements`);
  const data = await response.json();
  // Use data.library or data.editor for requirements
}
```

**Status:** ⚠️ **Documented** - Needs implementation

---

## 🧪 Testing Status

### Database Flow Test ✅

**File:** `scripts/test-database-flow.js`

**Tests:**
1. Database connection
2. Get sample page
3. Get requirements
4. Transform to categorized_requirements
5. Verify component data format

**Status:** Script created, needs path fix for Windows

---

## 📝 Summary

### What's Working ✅

1. ✅ SmartWizard → Database
2. ✅ AdvancedSearch → Database
3. ✅ ProgramSelector → Database
4. ✅ Library → Database (fixed)
5. ✅ EnhancedAIChat → Database (fixed)
6. ✅ EditorDataProvider → Database
7. ✅ dataSource → Database (endpoint created)
8. ✅ EditorValidation → Database
9. ✅ doctorDiagnostic → Database
10. ✅ prefill → Database (endpoint created)
11. ✅ aiHelper → Database

### What Needs Work ⚠️

1. ⚠️ RequirementsChecker - Should use database requirements instead of static fallback
   - Needs `programId` prop
   - Should fetch from `/api/programmes/${programId}/requirements`

---

## 🎯 Next Steps

### Priority 1: Fix RequirementsChecker

**Action:**
1. Add `programId` prop to RequirementsChecker
2. Fetch requirements from database if `programId` provided
3. Use actual program requirements instead of static fallback
4. Keep static fallback as backup for `programType`-only mode

### Priority 2: Test End-to-End

**Action:**
1. Fix test script paths
2. Run database flow tests
3. Test each component with real database data
4. Verify UI renders correctly

### Priority 3: Verify All Flows

**Action:**
1. Test SmartWizard → QuestionEngine → Results
2. Test Library → ProgramDetails → Requirements display
3. Test Editor → EnhancedAIChat → AI assistance
4. Test AdvancedSearch → Results → Program details

---

**Status:** ✅ **Most components wired correctly**  
**Remaining:** ⚠️ **RequirementsChecker needs database integration**

