# Step 1 Clarification: How Components Work Together

## 🔍 Key Questions Answered

### 1. How do llmExtract and recommend.ts work together?

**Answer:**

```
recommend.ts (API endpoint)
    ↓
generateProgramsWithLLM() → Creates basic program objects
    ↓
For each program:
    extractWithLLM() → Extracts 15 categories of detailed requirements
    ↓
Returns: Program with categorized_requirements (15 categories)
```

**Flow:**
1. **recommend.ts** is the **API endpoint** (`/api/programs/recommend`)
2. **recommend.ts** calls `generateProgramsWithLLM()` to generate basic programs
3. **recommend.ts** then calls `extractWithLLM()` (from llmExtract.ts) for each program
4. **extractWithLLM()** extracts 15 categories: `geographic`, `eligibility`, `financial`, `team`, `project`, `timeline`, `documents`, `technical`, `legal`, `impact`, `application`, `funding_details`, `restrictions`, `terms`, `compliance`
5. **recommend.ts** combines basic program + extracted requirements
6. Returns to frontend with `categorized_requirements` (15 categories)

**Key Point:** `llmExtract.ts` is a **utility function** used BY `recommend.ts`. It's not a separate API endpoint.

---

### 2. What is recommend.ts for vs what is llmExtract for?

**recommend.ts (API endpoint):**
- **Purpose:** Generate program recommendations from user answers
- **Does:**
  1. Takes user Q&A answers
  2. Generates program suggestions (via LLM)
  3. Extracts detailed requirements for each program (via extractWithLLM)
  4. Returns complete programs with requirements
- **Returns:** Array of programs with `categorized_requirements` (15 categories)

**llmExtract.ts (Utility function):**
- **Purpose:** Extract structured requirements from program text/HTML
- **Does:**
  1. Takes program text or HTML
  2. Uses LLM to extract 15 categories of requirements
  3. Returns structured `categorized_requirements`
- **Used by:**
  - `recommend.ts` (for LLM-generated programs)
  - Seed URL extraction (optional, if enabled)
  - Any place that needs to extract requirements from text

**Key Point:** `recommend.ts` orchestrates the flow, `llmExtract.ts` does the extraction work.

---

### 3. Is CategoryConverter really needed?

**Current Situation:**

**What we extract (from llmExtract.ts):**
```typescript
categorized_requirements: {
  geographic: [{ type: "location", value: "Austria", confidence: 0.9 }],
  eligibility: [{ type: "company_type", value: "startup", confidence: 0.85 }],
  financial: [{ type: "co_financing", value: "20% required", confidence: 0.8 }],
  // ... 12 more categories
}
```

**What aiHelper.ts expects:**
```typescript
structuredRequirements: {
  editor: [
    {
      section_name: "project_description",
      prompt: "Enhanced prompt...",
      hints: ["Hint 1", "Hint 2"],
      word_count_min: 200,
      word_count_max: 500,
      ai_guidance: "...",
      template: "..."
    }
  ],
  library: [
    {
      compliance_requirements: ["Requirement 1", "Requirement 2"]
    }
  ],
  decision_tree: []
}
```

**What RequirementsModal.tsx uses:**
```typescript
// Uses categorized_requirements DIRECTLY (15 categories)
getProgramRequirementsForSection(
  categorizedRequirements,  // 15 categories
  sectionCategory
)
```

**Analysis:**

1. **RequirementsModal.tsx** ✅ **Already works!**
   - Uses `categorized_requirements` directly (15 categories)
   - Maps categories to sections: `financial` → `financial`, `team` → `team`, etc.
   - **No conversion needed**

2. **aiHelper.ts** ❌ **Doesn't work!**
   - Expects `editor[]` and `library[]` format
   - Currently gets empty arrays because we extract 15 categories
   - **Needs conversion OR direct use**

**Answer:** CategoryConverter might NOT be needed if we update aiHelper.ts to use 15 categories directly!

---

### 4. What components in editor actually need the data?

**Components that use categorized_requirements:**

#### A. RequirementsModal.tsx ✅ **WORKS**
- **Uses:** `categorized_requirements` directly (15 categories)
- **How:** Maps category to section category
- **Status:** Already working, no changes needed

#### B. aiHelper.ts ❌ **BROKEN**
- **Uses:** `structuredRequirements.editor[]` and `structuredRequirements.library[]`
- **How:**
  - `buildSectionPromptWithStructured()` - Looks for `editor[]` with `section_name` matching
  - `getSectionGuidanceFromStructured()` - Gets hints from `editor[]`
  - `getComplianceTipsFromStructured()` - Gets compliance from `library[]`
- **Status:** Currently gets empty arrays, so requirements not used in AI prompts

#### C. Editor.tsx (Main component)
- **Uses:** `programData.categorized_requirements` to pass to RequirementsModal
- **Status:** Works, just passes data through

---

## 🎯 The Real Problem

**Current Flow:**
```
ProgramFinder → recommend.ts → extractWithLLM() → 15 categories
    ↓
localStorage → Editor → aiHelper.ts
    ↓
aiHelper.ts expects: editor[], library[]
    ↓
Gets: empty arrays (because we have 15 categories, not editor[]/library[])
    ↓
AI prompts NOT enhanced with program requirements ❌
```

**RequirementsModal works because it uses 15 categories directly!**

---

## 💡 Solution Options

### Option 1: Update aiHelper.ts to use 15 categories directly (RECOMMENDED)

**Why:**
- ✅ No conversion needed
- ✅ Simpler
- ✅ RequirementsModal already does this
- ✅ Direct use of extracted data

**How:**
```typescript
// In aiHelper.ts, instead of:
structuredRequirements = {
  editor: programData.categorized_requirements.editor || [],  // Empty!
  library: programData.categorized_requirements.library || [],  // Empty!
  decision_tree: []
};

// Do:
if (programData.categorized_requirements) {
  // Use 15 categories directly
  const categorized = programData.categorized_requirements;
  
  // Map categories to section guidance
  const sectionGuidance = getGuidanceFromCategories(section, categorized);
  const complianceTips = getComplianceFromCategories(categorized);
  
  // Use in prompts
  structuredRequirements = {
    editor: [], // Not needed if we use categories directly
    library: [], // Not needed if we use categories directly
    decision_tree: [],
    // Add direct category access
    categories: categorized
  };
}
```

**Then update:**
- `buildSectionPromptWithStructured()` - Use categories directly
- `getSectionGuidanceFromStructured()` - Extract from categories
- `getComplianceTipsFromStructured()` - Extract from categories

---

### Option 2: Use CategoryConverter (MORE COMPLEX)

**Why:**
- ✅ Converts to format aiHelper expects
- ✅ More structured
- ❌ More complex
- ❌ Converter might not match exactly what aiHelper needs

**How:**
```typescript
if (programData.categorized_requirements) {
  const converter = new CategoryConverter();
  const editorSections = converter.convertToEditorSections(
    programData.categorized_requirements,
    program.type
  );
  
  structuredRequirements = {
    editor: editorSections,
    library: converter.convertToLibraryRequirements(...),
    decision_tree: []
  };
}
```

---

## 🎯 Recommendation

**Use Option 1: Update aiHelper.ts to use 15 categories directly**

**Reasons:**
1. **RequirementsModal already does this** - Proves it works
2. **Simpler** - No conversion layer
3. **Direct** - Use extracted data as-is
4. **Less code** - Fewer moving parts

**What needs to change:**
1. Update `aiHelper.ts` to extract guidance from 15 categories
2. Map categories to sections (similar to RequirementsModal)
3. Update prompt building to include category data
4. Remove dependency on `editor[]`/`library[]` format

---

## 📋 Implementation Plan

### Step 1.1: Update aiHelper.ts to use categories directly

**File:** `features/editor/engine/aiHelper.ts`

**Changes:**
1. Instead of looking for `structuredRequirements.editor[]`, extract from `categorized_requirements` directly
2. Map section name to category (e.g., "financial" section → `financial` category)
3. Extract hints/guidance from category items
4. Include category data in AI prompts

**Example:**
```typescript
// Helper function to get requirements for a section
function getRequirementsForSection(
  section: string,
  categorizedRequirements: any
): any[] {
  // Map section to category (similar to RequirementsModal)
  const categoryMapping: Record<string, string> = {
    'financial': 'financial',
    'market': 'market_size',
    'risk': 'compliance',
    'team': 'team',
    'project': 'project',
    'technical': 'technical',
    'impact': 'impact',
    'general': 'eligibility'
  };
  
  const category = categoryMapping[section.toLowerCase()] || 'eligibility';
  return categorizedRequirements[category] || [];
}
```

### Step 1.2: Update prompt building

**Update `buildSectionPromptWithStructured()` to:**
- Extract requirements from 15 categories
- Include in prompt
- Format nicely for LLM

### Step 1.3: Test

- Verify AI prompts include program requirements
- Verify generated content reflects requirements
- Compare with RequirementsModal (should work similarly)

---

## ✅ Summary

1. **recommend.ts** = API endpoint that orchestrates program generation + extraction
2. **llmExtract.ts** = Utility that extracts 15 categories from text
3. **RequirementsModal** = Already works with 15 categories directly ✅
4. **aiHelper.ts** = Needs update to use 15 categories directly (not CategoryConverter)
5. **Solution** = Update aiHelper.ts to extract from 15 categories, similar to RequirementsModal

**CategoryConverter is NOT needed** - We can use 15 categories directly!

---

**Last Updated:** 2024-01-XX
**Status:** Clarified - Ready to implement Option 1

