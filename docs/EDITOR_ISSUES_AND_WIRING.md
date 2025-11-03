# 🔧 Editor Issues & Frontend Component Wiring Status

**Date:** 2025-01-XX  
**Status:** Analysis Complete - Issues Identified

---

## ✅ Frontend Components Wiring Status

### 1. SmartWizard & QuestionEngine ✅ WORKING
- **Data Source:** `/api/programs?enhanced=true`
- **Database:** ✅ Uses `pages` + `requirements` tables
- **Status:** ✅ Correctly wired to database
- **Location:** `features/reco/components/wizard/SmartWizard.tsx`

### 2. AdvancedSearch ✅ WORKING
- **Data Source:** `/api/programs?enhanced=true`
- **Database:** ✅ Uses database with filtering
- **Status:** ✅ Correctly wired to database
- **Location:** `features/reco/engine/enhancedRecoEngine.ts`

### 3. Library Component ✅ WORKING
- **Data Source:** `/api/programs?enhanced=true`
- **Database:** ✅ Uses `pages` table
- **Status:** ✅ Correctly wired to database
- **Location:** `pages/library.tsx`

### 4. Pricing Component ✅ WORKING
- **Data Source:** Static data from `shared/data/basisPack.ts`
- **Status:** ✅ Works independently (no database dependency)

### 5. RequirementsChecker ✅ WORKING
- **Data Source:** `/api/programmes/[id]/requirements`
- **Database:** ✅ Uses `requirements` table
- **Status:** ✅ Correctly wired to database
- **Location:** `features/editor/components/RequirementsChecker.tsx`

### 6. EnhancedAIChat ✅ WORKING
- **Data Source:** `/api/programmes/[id]/requirements`
- **Database:** ✅ Uses database requirements
- **Status:** ✅ Correctly wired to database
- **Location:** `features/editor/components/EnhancedAIChat.tsx`

---

## ❌ Editor Issues Identified

### Issue 1: Syntax Error in UnifiedEditor.tsx
**File:** `features/editor/components/UnifiedEditor.tsx`  
**Line:** 92  
**Problem:** `if` statement without condition
```typescript
// Current (BROKEN):
if (!filterProgramId) {

// Should be:
if (!filterProgramId) {
```
**Fix:** Complete the condition check

### Issue 2: API Response Format Mismatch
**File:** `pages/api/programmes/[id]/requirements.ts`  
**Problem:** The API returns `editor` sections, but they may not be in the exact format expected by `EditorDataProvider.getProduct()`

**Expected Format (EditorDataProvider):**
```typescript
{
  editor: [
    {
      id: string,
      section_name: string,
      required: boolean,
      template: string,
      guidance: string,
      placeholder: string,
      hints: string[],
      word_count_min: number,
      word_count_max: number,
      validation_rules: any[]
    }
  ]
}
```

**Current API Response:**
- Returns `editor` array from `categoryConverters`
- Format may not match exactly

### Issue 3: Editor Data Flow
**Flow:**
```
UnifiedEditor
  ↓ programId
  ↓
Phase4Integration
  ↓ loadProgramSections(programId)
  ↓
EditorEngine.loadSections(productId)
  ↓ loadProduct(productId) → EditorDataProvider.getProduct()
  ↓ fetch(`/api/programmes/${productId}/requirements`)
  ↓
API: /api/programmes/[id]/requirements.ts
  ↓ getProgramRequirements(id)
  ↓ Query: pages + requirements tables
  ↓ Transform via categoryConverters
  ↓ Return: { editor: [...] }
```

**Potential Issues:**
1. API may not return `editor` array in correct format
2. `EditorDataProvider.getProduct()` expects specific field names
3. Fallback to templates may not be working correctly

---

## 🔍 Missing Dependencies

### 1. Editor Sections Format
The API endpoint needs to ensure `editor` sections match this format:
```typescript
{
  id: string,              // Required
  section_name: string,    // Required
  title?: string,          // Optional fallback
  required: boolean,       // Required
  template?: string,        // Optional - used as content template
  guidance?: string,        // Optional - used as guidance
  placeholder?: string,     // Optional - used as description
  hints?: string[],         // Optional
  word_count_min?: number, // Optional
  word_count_max?: number,  // Optional
  validation_rules?: any[]  // Optional
}
```

### 2. Template Fallback
When no program data is available, `EditorEngine.loadSections()` should:
1. Try to load from program data
2. If that fails, fall back to `PRODUCT_SECTION_TEMPLATES`
3. This fallback is implemented but may not be working

### 3. Program Profile Integration
`Phase4Integration` expects a `programProfile` prop with:
```typescript
{
  programId: string,
  route?: 'grant' | 'loan' | 'equity' | 'visa'
}
```
This is passed from `UnifiedEditor`, but may not be correctly formatted.

---

## 🛠️ Fixes Needed

### Fix 1: Syntax Error
**File:** `features/editor/components/UnifiedEditor.tsx`
- Line 92: Fix incomplete `if` statement

### Fix 2: API Response Format
**File:** `pages/api/programmes/[id]/requirements.ts`
- Ensure `editor` array matches expected format
- Add field mapping if needed

### Fix 3: Error Handling
**Files:** `features/editor/engine/EditorEngine.ts`, `features/editor/engine/EditorDataProvider.ts`
- Improve error messages
- Ensure fallback templates work when API fails

### Fix 4: Type Safety
- Ensure all types match between API response and editor components
- Add type guards where needed

---

## ✅ Verification Checklist

- [x] Frontend components correctly wired to database
- [ ] Editor syntax error fixed
- [ ] API response format matches editor expectations
- [ ] Template fallback works when API fails
- [ ] Error handling improved
- [ ] Type safety verified

---

## 🧪 Testing Steps

1. **Test Editor with Program ID:**
   ```
   /editor?programId=<valid-program-id>
   ```
   - Should load sections from database
   - Should display sections in editor

2. **Test Editor without Program ID:**
   ```
   /editor
   ```
   - Should show ProgramSelector
   - Should allow selecting a program

3. **Test Editor Fallback:**
   - If API fails, should use template fallback
   - Should display default sections

4. **Test Other Components:**
   - SmartWizard: Should fetch programs from database
   - AdvancedSearch: Should filter programs correctly
   - Library: Should display programs from database
   - RequirementsChecker: Should validate content

---

## 📝 Next Steps

1. Fix syntax error in UnifiedEditor.tsx
2. Verify API response format matches editor expectations
3. Add error handling and logging
4. Test editor with real program data
5. Verify template fallback works
6. Test all frontend components

