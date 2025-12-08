# How Program Connection is Supposed to Work

**Date:** 2024  
**Status:** Documentation - Explains the intended flow  
**Purpose:** Understanding the program connection mechanism for Phase 2.1 fix

---

## Overview

When a user connects a funding program (e.g., AWS, FFG, EU), the system should:
1. Load program data from localStorage (saved by ProgramFinder)
2. Extract program-specific sections and documents from `categorized_requirements`
3. Merge program sections with master product sections
4. Add merged sections to the plan
5. Display program requirements and metadata

---

## Flow Diagram

```
User Action (Connect Program)
    ↓
handleConnectProgram (useProgramConnection)
    ↓
Sets programId → triggers fetchProgramDetails
    ↓
fetchProgramDetails loads from localStorage
    ↓
Creates programSummary with program metadata
    ↓
programSummary passed to useProductSelection
    ↓
useProductSelection detects programSummary change
    ↓
Calls applyHydration(programSummary, ...)
    ↓
hydrate(product, { programId, programName, summary, ... })
    ↓
getSections('grants', product, programId, baseUrl)
    ↓
loadProgramSections(programId) extracts from categorized_requirements
    ↓
mergeSections(masterSections, programSections)
    ↓
Returns merged sections with origin: 'program'
    ↓
Plan is built with merged sections
    ↓
Program sections appear in Step 3 (Sections & Documents)
```

---

## Key Components

### 1. Program Connection Hook (`useProgramConnection.ts`)

**Location:** `features/editor/lib/hooks/useProgramConnection.ts`

**Responsibilities:**
- Load program from URL query (`?programId=...`) or localStorage
- Fetch program details from localStorage
- Normalize program input (ID, URL, etc.)
- Manage program connection state (`programId`, `programSummary`, `programError`)

**Key Functions:**

#### `handleConnectProgram(rawInput: string | null)`
- Normalizes program input (extracts ID from URL or uses ID directly)
- Sets `programId` state
- Updates URL query parameter
- Triggers `fetchProgramDetails` via `useEffect`

#### `fetchProgramDetails(id: string)`
- Loads program from localStorage using `loadSelectedProgram()`
- Extracts program data: `name`, `type`, `deadline`, `funding_amount_min/max`, `region`
- Maps program type to funding type using `mapProgramTypeToFunding()`
- Creates `ProgramSummary` object with:
  - `id`: Program ID
  - `name`: Program name
  - `fundingType`: Template funding type (grants, loans, equity, visa)
  - `fundingProgramTag`: Funding program tag (grant, loan, equity, visa)
  - `deadline`: Program deadline
  - `amountRange`: Funding amount range
  - `region`: Program region
- Saves complete summary to localStorage

**Data Source:**
- Programs are saved to localStorage by ProgramFinder when user selects a program
- Data structure includes `categorized_requirements` with:
  - `project`: Project-related requirements
  - `financial`: Financial requirements
  - `technical`: Technical requirements
  - `documents`: Required documents

---

### 2. Template Loading (`templates/index.ts` and `templates/api.ts`)

**Location:** `features/editor/lib/templates/`

**Responsibilities:**
- Load master sections for product type
- Load program sections from localStorage
- Merge master and program sections
- Return merged template list

**Key Functions:**

#### `getSections(fundingType, productType, programId?, baseUrl?)`
- Loads master sections for product type (`MASTER_SECTIONS[productType]`)
- If `programId` is provided, calls `loadProgramSections(programId)`
- Merges master sections with program sections using `mergeSections()`
- Returns merged sections with `origin: 'master'` or `origin: 'program'`

#### `loadProgramSections(programId: string)`
- Loads program from localStorage
- Extracts `categorized_requirements` from saved program data
- Maps requirements to `SectionTemplate[]`:
  - `categorized_requirements.project` → sections with `category: 'project'`
  - `categorized_requirements.financial` → sections with `category: 'financial'`
  - `categorized_requirements.technical` → sections with `category: 'technical'`
- Each section gets:
  - `id`: `prog_section_{category}_{idx}`
  - `title`: Requirement value
  - `description`: Requirement description
  - `origin: 'program'`
  - `programId`: Program ID
  - `visibility: 'programOnly'`
  - `order: 1000 + idx` (placed after master sections)

#### `mergeSections(masterSections, programSections)`
- Merges master sections with program sections
- **Exact ID match**: Program section overrides master section
- **Fuzzy slug match**: Program section merges with master section (keeps master ID/title)
- **Program-only sections**: Added as new sections after master sections
- Preserves stricter requirements (word counts, required flags)
- Sets `origin: 'program'` for merged/added sections
- Sorts by `order` field

---

### 3. Plan Hydration (`useEditorStore.ts`)

**Location:** `features/editor/lib/hooks/useEditorStore.ts`

**Responsibilities:**
- Build plan from templates
- Convert templates to plan sections
- Preserve existing plan data (document sections, title pages, etc.)
- Set initial active section

**Key Function:**

#### `hydrate(product, context)`
- Calls `getSections('grants', product, context?.programId, baseUrl)`
- Filters out disabled sections
- Adds custom sections
- Converts templates to plan sections using `buildSectionFromTemplate()`
- Preserves existing plan data (document sections, title pages, references, appendices)
- Creates new plan with merged sections
- Sets plan state with program metadata:
  - `programId`: `context?.programId`
  - `programName`: `context?.programName`
  - `programSummary`: `context?.summary`

**Context Structure:**
```typescript
{
  fundingType: string;
  programId?: string;
  programName?: string;
  summary?: ProgramSummary;
  disabledSectionIds?: string[];
  disabledDocumentIds?: string[];
  customSections?: SectionTemplate[];
  customDocuments?: DocumentTemplate[];
}
```

---

### 4. Product Selection Hook (`useProductSelection.ts`)

**Location:** `features/editor/lib/hooks/useProductSelection.ts`

**Responsibilities:**
- Manage product selection state
- Trigger hydration when product/program changes
- Apply template updates (disabled sections, custom sections)

**Key Functions:**

#### `applyHydration(summary, options)`
- Calls `hydrate(selectedProduct, { programId, programName, summary, ... })`
- Passes `programId: summary?.id` to hydration context
- This is the bridge between program connection and plan hydration

#### `useEffect` (watches `programSummary`)
- **Current Issue**: Only hydrates if `!currentPlan || currentPlan.productType !== selectedProduct`
- **Problem**: If plan exists and product hasn't changed, connecting a program won't trigger re-hydration
- **Solution Needed**: Also check if `programSummary` changed or if plan's `programId` differs from current `programSummary?.id`

---

## Current Issues (Why It's Not Working)

### Issue 1: Hydration Not Triggered on Program Connection

**Problem:**
- `useProductSelection` only hydrates when:
  - Plan doesn't exist (`!currentPlan`), OR
  - Product type changed (`currentPlan.productType !== selectedProduct`)
- When user connects a program AFTER selecting a product, the plan already exists and product hasn't changed
- Therefore, hydration is skipped and program sections are never added

**Location:** `features/editor/lib/hooks/useProductSelection.ts` lines 49-80

**Current Logic:**
```typescript
const needsHydration = !currentPlan || currentPlan.productType !== selectedProduct;
```

**Should Also Check:**
```typescript
const needsHydration = 
  !currentPlan || 
  currentPlan.productType !== selectedProduct ||
  currentPlan.metadata?.programId !== programSummary?.id ||
  (!currentPlan.metadata?.programId && programSummary); // New program connected
```

### Issue 2: Program Sections Not Loaded from localStorage

**Problem:**
- `loadProgramSections()` expects `categorized_requirements` in saved program data
- If ProgramFinder doesn't save this structure, sections won't be extracted
- Need to verify what ProgramFinder actually saves to localStorage

**Location:** `features/editor/lib/templates/api.ts` lines 114-232

**Check:**
- What does `loadSelectedProgram()` return?
- Does it include `categorized_requirements`?
- Are the categories (`project`, `financial`, `technical`) present?

### Issue 3: Program Summary Not Updated in Plan

**Problem:**
- When program is connected, `programSummary` is set in `useProgramConnection`
- But if hydration doesn't run, the plan's `programSummary` field is never updated
- This means requirements checker won't have program data

**Location:** `features/editor/lib/hooks/useEditorStore.ts` line 341

**Check:**
- Is `context?.summary` passed correctly?
- Is it set in the plan?

---

## Expected Behavior

### When User Connects Program:

1. **User selects program in ProgramFinder**
   - Program saved to localStorage with `categorized_requirements`
   - User redirected to editor with `?programId=...` or program in localStorage

2. **User connects program in Editor (Step 2)**
   - `handleConnectProgram()` called with program ID/URL
   - `fetchProgramDetails()` loads program from localStorage
   - `programSummary` created and set
   - `programSummary` change detected by `useProductSelection`
   - `applyHydration()` called with `programId`
   - `hydrate()` loads sections with `getSections(..., programId)`
   - `loadProgramSections()` extracts sections from `categorized_requirements`
   - `mergeSections()` merges master + program sections
   - Plan rebuilt with merged sections
   - Program sections appear in Step 3 (Sections & Documents)

3. **Program Sections in Plan**
   - Sections have `origin: 'program'`
   - Sections have `programId` in metadata
   - Sections appear after master sections (order > 1000)
   - Sections can be toggled on/off like master sections
   - Disconnecting program keeps sections as custom (per design decision)

---

## Testing Checklist

### Test 1: Program Connection via ProgramFinder
- [ ] Select program in ProgramFinder
- [ ] Verify program saved to localStorage with `categorized_requirements`
- [ ] Navigate to editor
- [ ] Verify program loaded from localStorage
- [ ] Verify `programSummary` is set
- [ ] Verify hydration triggered
- [ ] Verify program sections appear in Step 3

### Test 2: Program Connection via Manual Input
- [ ] Open editor configurator
- [ ] Go to Step 2 (Program Selection)
- [ ] Enter program ID or paste program URL
- [ ] Click "Connect"
- [ ] Verify `handleConnectProgram()` called
- [ ] Verify `fetchProgramDetails()` loads program
- [ ] Verify `programSummary` is set
- [ ] Verify hydration triggered
- [ ] Verify program sections appear in Step 3

### Test 3: Program Sections Extraction
- [ ] Connect program with `categorized_requirements.project`
- [ ] Verify project sections extracted
- [ ] Connect program with `categorized_requirements.financial`
- [ ] Verify financial sections extracted
- [ ] Connect program with `categorized_requirements.technical`
- [ ] Verify technical sections extracted
- [ ] Verify sections have `origin: 'program'`
- [ ] Verify sections have correct `programId`

### Test 4: Section Merging
- [ ] Connect program with section matching master section ID
- [ ] Verify program section overrides master section
- [ ] Connect program with section matching master section title (fuzzy match)
- [ ] Verify program section merges with master section
- [ ] Connect program with new section (not in master)
- [ ] Verify new section added after master sections

### Test 5: Program Disconnection
- [ ] Connect program
- [ ] Verify program sections added
- [ ] Disconnect program
- [ ] Verify program sections kept as custom (per design)
- [ ] Verify `programSummary` cleared
- [ ] Verify plan's `programId` cleared

---

## Files to Investigate/Modify

### Primary Files:
1. **`features/editor/lib/hooks/useProductSelection.ts`**
   - Fix hydration trigger to check program changes
   - Add logic to re-hydrate when program is connected/disconnected

2. **`features/editor/lib/hooks/useProgramConnection.ts`**
   - Verify `fetchProgramDetails()` correctly loads program data
   - Verify `programSummary` is set correctly
   - Add logging to debug connection flow

3. **`features/editor/lib/templates/api.ts`**
   - Verify `loadProgramSections()` correctly extracts from `categorized_requirements`
   - Add error handling for missing data
   - Add logging to debug extraction

4. **`features/editor/lib/hooks/useEditorStore.ts`**
   - Verify `hydrate()` correctly passes `programId` to `getSections()`
   - Verify `programSummary` is set in plan
   - Add logging to debug hydration

### Secondary Files:
5. **`features/editor/components/Editor.tsx`**
   - Verify `handleConnectProgram` is passed correctly
   - Verify `programSummary` is passed to `useProductSelection`

6. **`features/editor/components/layout/Workspace/Navigation/Configuration/CurrentSelection/ProgramSelection/ProgramSelection.tsx`**
   - Verify UI correctly calls `onConnectProgram`
   - Verify error messages display correctly

---

## Debugging Steps

### Step 1: Verify Program Data in localStorage
```javascript
// In browser console:
const saved = JSON.parse(localStorage.getItem('selectedProgram'));
console.log('Program data:', saved);
console.log('Has categorized_requirements:', !!saved?.categorized_requirements);
console.log('Categories:', saved?.categorized_requirements ? Object.keys(saved.categorized_requirements) : []);
```

### Step 2: Verify Program Connection Flow
```javascript
// Add to useProgramConnection.ts fetchProgramDetails:
console.log('[fetchProgramDetails] Loading program', { id, saved });
console.log('[fetchProgramDetails] Program summary created', summary);
```

### Step 3: Verify Hydration Trigger
```javascript
// Add to useProductSelection.ts useEffect:
console.log('[useProductSelection] Program summary changed', { 
  programSummary, 
  currentPlanProgramId: currentPlan?.metadata?.programId,
  needsHydration 
});
```

### Step 4: Verify Section Loading
```javascript
// Add to templates/api.ts loadProgramSections:
console.log('[loadProgramSections] Extracted sections', { 
  programId, 
  sectionsCount: sections.length,
  categories: {
    project: categorizedRequirements.project?.length || 0,
    financial: categorizedRequirements.financial?.length || 0,
    technical: categorizedRequirements.technical?.length || 0
  }
});
```

### Step 5: Verify Section Merging
```javascript
// Add to templates/index.ts getSections:
console.log('[getSections] Merged sections', { 
  masterCount: masterSections.length,
  programCount: programSections.length,
  mergedCount: merged.length,
  programSections: merged.filter(s => s.origin === 'program').map(s => s.id)
});
```

---

## Success Criteria

Program connection is working when:

1. ✅ User can connect program via all methods (ProgramFinder, manual input, URL paste)
2. ✅ Program data loads correctly from localStorage
3. ✅ `programSummary` is set and passed to hydration
4. ✅ Hydration triggers when program is connected (even if plan already exists)
5. ✅ Program sections are extracted from `categorized_requirements`
6. ✅ Program sections are merged with master sections
7. ✅ Merged sections appear in Step 3 (Sections & Documents)
8. ✅ Program sections have `origin: 'program'` and `programId`
9. ✅ Requirements checker has access to program data
10. ✅ Program metadata (deadline, amount range, region) displays correctly

---

## Next Steps

1. **Investigate current state:**
   - Check what ProgramFinder saves to localStorage
   - Verify `categorized_requirements` structure
   - Test program connection flow with logging

2. **Fix hydration trigger:**
   - Update `useProductSelection` to detect program changes
   - Re-hydrate when program is connected/disconnected

3. **Fix section extraction:**
   - Verify `loadProgramSections()` works correctly
   - Handle missing/invalid data gracefully

4. **Test end-to-end:**
   - Test all connection methods
   - Verify sections appear in Step 3
   - Verify requirements are loaded

5. **Document fixes:**
   - Update this document with actual behavior
   - Add to handover document

---

**Last Updated:** 2024  
**Status:** Documentation - Ready for Phase 2.1 implementation

