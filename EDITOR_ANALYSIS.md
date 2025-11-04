# Editor Analysis - Current State & Issues

**Date:** 2025-01-03  
**Purpose:** Analyze why editor doesn't work and how it's supposed to work

---

## 🔍 **CURRENT FLOW ANALYSIS**

### **1. Entry Point: `/editor`**

**File:** `pages/editor.tsx`
- Reads `programId`, `route`, `product` from URL query
- Passes to `UnifiedEditor` component

**Status:** ✅ **WORKING**

---

### **2. UnifiedEditor Component**

**File:** `features/editor/components/UnifiedEditor.tsx`

**Flow:**
1. Normalizes input data (line 40-50)
2. If no `programId`, shows `ProgramSelector` (line 92-108)
3. If `programId` exists, passes to `Phase4Integration` (line 119-128)

**Problem Found:**
- Line 74-89: `loadProgramSections()` function is empty - just logs to console
- Line 121: Only passes `programProfile` if `filterProgramId` exists
- **MISSING:** No actual section loading logic here

**Status:** ⚠️ **PARTIALLY WORKING** - Passes programId but doesn't load sections

---

### **3. Phase4Integration Component**

**File:** `features/editor/components/Phase4Integration.tsx`

**Flow:**
1. Receives `programProfile` prop (line 34-40)
2. Has `loadProgramSections()` function (line 217-354)
3. Creates `PlanDocument` with sections (line 315-341)

**Problems Found:**

#### **✅ Problem 1: Auto-Loading EXISTS**

**Location:** Line 179-183

**Current Code:**
```typescript
useEffect(() => {
  if (programProfile && programProfile.programId) {
    loadProgramSections(programProfile.programId);
  }
}, [programProfile]);
```

**Status:** ✅ **WORKING** - Auto-loads sections when programProfile is provided

#### **❌ Problem 2: Sections Have Prompts But No Content**

**Location:** Line 330-338

**Flow:**
1. Calls `editorEngineRef.current.loadSections(programId)` (line 230)
2. Gets sections from `EditorEngine`
3. Creates `PlanDocument` with sections (line 315)
4. Sets plan and sections (line 343-344)

**Content Assignment:**
```typescript
content: section.template || section.guidance || section.content || '',  // Line 333
```

**Problem:**
- `section.template` = prompts (questions like "What problem does your project solve?")
- `section.guidance` = description (text like "Brief overview of your project")
- `section.content` = empty (from prefill if available)
- **Result:** Content is just prompts/questions, NOT actual business plan content!

**Example:**
- Section content = "What problem does your project solve? What makes your approach innovative?"
- This is NOT a business plan - it's just questions!

#### **❌ Problem 3: Prefill Expects Different Answer Format**

**Location:** `features/intake/engine/prefill.ts` line 254-303

**Current State:**
- Prefill expects answers like: `business_name`, `business_description`, `target_market`, `funding_amount`
- But wizard provides: `location`, `company_age`, `current_revenue`, `team_size`

**Problem:**
- `mapAnswersToSections()` looks for `answers.business_name` (line 309)
- But wizard answers have `location`, `company_age`, etc.
- **Result:** Prefill doesn't match wizard answers, generates empty content with TBD markers

**Example Prefill Output:**
```
[TBD: Business Name] is seeking [TBD: Funding Amount]...
```

**Missing:** Mapping from wizard answers to prefill format

---

### **4. EditorEngine**

**File:** `features/editor/engine/EditorEngine.ts`

**Flow:**
1. `loadSections(productId)` called (line 58)
2. Tries to load from program data (line 61-73)
3. Falls back to `loadSectionsFromTemplates()` (line 79)

**Problems Found:**

#### **⚠️ Problem 4: loadProduct() May Return Empty Sections**

**Location:** `EditorDataProvider.ts` line 40-99

**Flow:**
1. Fetches from `/api/programmes/${id}/requirements` (line 35)
2. Gets `editor` array from API (line 65)
3. Merges with fallback templates (line 66-84)

**Issue:**
- If API returns empty `editor` array, sections are empty
- Falls back to master templates, but only if API call succeeds
- If API fails, returns empty sections

**Status:** ⚠️ **PARTIALLY WORKING** - Works if API returns editor sections

#### **❌ Problem 5: Template Fallback Uses Unified Templates**

**Location:** Line 85-119

**Flow:**
1. Calls `getSections(fundingType)` from unified template system
2. Gets `MASTER_SECTIONS` from `shared/lib/templates/sections.ts`
3. Converts to `UnifiedEditorSection` format

**Status:** ✅ **WORKING** - Falls back to master templates

---

### **5. Template System**

**File:** `shared/lib/templates/sections.ts`

**Content:**
- `MASTER_SECTIONS` for grants, bankLoans, equity, visa
- Each section has:
  - `id`, `title`, `description`
  - `prompts` (array of prompt questions)
  - `validationRules`
  - `wordCountMin/Max`

**Status:** ✅ **WORKING** - Templates exist

**Problem:** Templates have prompts but NO generated content

---

### **6. API Endpoint**

**File:** `pages/api/programmes/[id]/requirements.ts`

**Flow:**
1. Fetches program from database
2. Gets requirements (18 categories)
3. Converts to `editor` sections using `categoryConverter.convertToEditorSections()` (line 142)
4. Returns `editor` array

**Status:** ✅ **WORKING** - Returns editor sections

**Problem:** Sections have prompts but NO content generation

---

### **7. Category Converters**

**File:** `features/editor/engine/categoryConverters.ts`

**Flow:**
1. Gets standard sections from `getStandardSections(programType)` (line 93)
2. Enhances with program-specific requirements (line 96-98)
3. Returns `EditorSection[]` with prompts

**Status:** ✅ **WORKING** - Converts requirements to editor sections

**Problem:** Only creates prompts, doesn't generate content

---

## 🔴 **ROOT CAUSES**

### **1. No Content Generation**
- Sections have prompts/guidance but NO actual content
- Content starts empty: `content: section.template || section.guidance || ''`
- `section.template` is just prompts (text questions), not actual content

### **2. Missing AI/Content Generation Logic**
- No integration with AI to generate content from prompts
- No integration with prefill to generate content from wizard answers
- User must write everything manually

### **3. Prefill Answer Format Mismatch**
- Prefill expects: `business_name`, `business_description`, `target_market`, `funding_amount`
- Wizard provides: `location`, `company_age`, `current_revenue`, `team_size`
- Result: Prefill generates content with `[TBD: ...]` markers instead of actual content

---

## ✅ **HOW IT'S SUPPOSED TO WORK**

### **Expected Flow:**

1. **User selects program** → `programId` passed to `Phase4Integration`
2. **Auto-load sections:**
   - Fetch program requirements from `/api/programmes/${id}/requirements`
   - Convert to editor sections via `categoryConverter`
   - Merge with master templates
   - Result: Sections with prompts/guidance

3. **Generate initial content:**
   - Option A: Use wizard answers + prefill engine
   - Option B: Use AI to generate from prompts
   - Option C: Use template prompts as starting point
   - Result: Sections with actual content

4. **User edits content:**
   - RichTextEditor allows editing
   - Content saved to localStorage
   - Progress tracked

5. **Export:**
   - Preview page shows formatted document
   - Export to PDF/DOCX

---

## 🔧 **WHAT'S MISSING**

### **Critical Missing Pieces:**

1. **Content generation:**
   - AI integration to generate content from prompts
   - OR better prefill integration
   - OR template content expansion

2. **Prefill answer mapping:**
   - Create mapper from wizard format to prefill format
   - Use existing wizard answers to generate content

3. **Template content:**
   - Templates should have example content, not just prompts
   - OR prompts should be expanded into initial content

---

## 📊 **SUMMARY**

| Component | Status | Issue |
|-----------|--------|-------|
| **Entry Point** | ✅ Working | - |
| **UnifiedEditor** | ⚠️ Partial | Empty loadProgramSections() (but not needed) |
| **Phase4Integration** | ⚠️ Partial | Auto-loading works, but no content generation |
| **EditorEngine** | ✅ Working | Falls back to templates |
| **Templates** | ✅ Working | But no content, only prompts |
| **API Endpoint** | ✅ Working | Returns editor sections |
| **Category Converters** | ✅ Working | Converts requirements to sections |
| **RichTextEditor** | ✅ Working | Can edit content |
| **Prefill** | ❌ Broken | Answer format mismatch (wizard vs prefill) |
| **AI Generation** | ❌ Missing | No AI to generate content |

---

## 🎯 **RECOMMENDED FIXES**

### **Priority 1: Fix Content Generation**
- Option A: Integrate AI to generate content from prompts
- Option B: Improve prefill to always generate content
- Option C: Add template content examples

### **Priority 2: Fix Prefill Answer Mapping**
- Map wizard answers (`location`, `company_age`, etc.) to prefill format (`business_name`, `business_description`, etc.)
- Similar to `answerMapper.ts` in reco feature
- Generate actual content from answers, not TBD markers

---

**Status:** Editor structure exists but content generation is missing

