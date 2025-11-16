# Architecture Explanation: How Reco & Editor Work Together

## 🎯 Key Questions Answered

### 1. Should we merge llmExtract and recommend.ts?

**Answer: NO - Keep them separate**

**Why:**
- **Separation of concerns:** `recommend.ts` = API orchestration, `llmExtract.ts` = extraction utility
- **Reusability:** `llmExtract.ts` can be used by:
  - `recommend.ts` (for LLM-generated programs)
  - Seed URL extraction (optional feature)
  - Any future feature that needs requirement extraction
- **Testability:** Easier to test extraction logic separately
- **Maintainability:** Clear responsibilities

**Current Architecture:**
```
recommend.ts (API endpoint)
    ↓
generateProgramsWithLLM() → Basic programs
    ↓
extractWithLLM() (from llmExtract.ts) → Detailed requirements
    ↓
Combined result → Frontend
```

**Keep this separation!** ✅

---

### 2. How does the flow work in reco?

**Complete Flow:**

```
1. User answers Q&A in ProgramFinder.tsx
   ↓
2. Frontend calls POST /api/programs/recommend
   ↓
3. recommend.ts receives answers
   ↓
4. generateProgramsWithLLM() creates basic programs:
   - Takes user answers
   - Calls LLM to generate program suggestions
   - Returns: name, institution, funding amounts, location, etc.
   ↓
5. For each program, extractWithLLM() extracts detailed requirements:
   - Takes program text/description
   - Calls LLM to extract 15 categories
   - Returns: categorized_requirements (15 categories)
   ↓
6. recommend.ts combines:
   - Basic program info (from step 4)
   - Detailed requirements (from step 5)
   ↓
7. Returns to frontend with complete programs
   ↓
8. Frontend scores programs, displays top 5
   ↓
9. User selects program → localStorage → Editor
```

**Key Point:** `extractWithLLM()` **DOES extract more detailed requirements** than the basic generation. It extracts:
- 15 comprehensive categories
- Sub-types within each category
- Confidence scores
- Full descriptions (not just keywords)

---

### 3. What should we keep to serve both reco & editor?

**Answer: Keep the 15 categories format - it serves both!**

**What Reco Uses:**
- `categorized_requirements` (15 categories) for:
  - Scoring programs (matching user answers)
  - Displaying requirements in results
  - Filtering programs

**What Editor Uses:**
- `categorized_requirements` (15 categories) for:
  - AI prompt enhancement (aiHelper.ts)
  - Requirements display (RequirementsModal.tsx)
  - Section-specific guidance

**Shared Format:**
```typescript
categorized_requirements: {
  geographic: [{ type: "location", value: "Austria", confidence: 0.9 }],
  eligibility: [{ type: "company_type", value: "startup", confidence: 0.85 }],
  financial: [{ type: "co_financing", value: "20% required", confidence: 0.8 }],
  team: [...],
  project: [...],
  timeline: [...],
  documents: [...],
  technical: [...],
  legal: [...],
  impact: [...],
  application: [...],
  funding_details: [...],
  restrictions: [...],
  terms: [...],
  compliance: [...]
}
```

**This format works for BOTH!** ✅

**What to Keep:**
1. ✅ `llmExtract.ts` - Extracts 15 categories (used by recommend.ts)
2. ✅ `recommend.ts` - API endpoint (orchestrates flow)
3. ✅ 15 categories format - Serves both reco & editor
4. ✅ localStorage transmission - Simple, works

**What NOT to Keep:**
- ❌ CategoryConverter - Not needed, use 15 categories directly
- ❌ editor[]/library[] format - Only needed for legacy database programs

---

## 🔄 How It Works Now

### In aiHelper.ts (UPDATED)

**Before (Broken):**
```typescript
// Expected editor[]/library[] format
structuredRequirements = {
  editor: programData.categorized_requirements.editor || [],  // Always empty!
  library: programData.categorized_requirements.library || []  // Always empty!
};
```

**After (Fixed):**
```typescript
// Uses 15 categories directly
categorizedRequirements = programData.categorized_requirements;  // 15 categories!

// Extract requirements for section
const programRequirements = this.getRequirementsForSection(section, categorizedRequirements);

// Include in AI prompt
=== PROGRAM-SPECIFIC REQUIREMENTS FOR ${section} ===
${programRequirements.map(req => `- ${req}`).join('\n')}
```

**How It Works:**
1. **Loads from localStorage:** Gets `categorized_requirements` (15 categories)
2. **Maps section to category:** "financial" section → `financial` category
3. **Extracts requirements:** Gets relevant requirements for that section
4. **Includes in prompt:** Adds program requirements to AI prompt
5. **AI generates:** Content that reflects program requirements

**Helper Methods:**
- `getRequirementsForSection()` - Maps section → category, extracts requirements
- `getSectionGuidanceFromCategories()` - Gets guidance from categories
- `getComplianceTipsFromCategories()` - Gets compliance from categories
- `calculateReadinessScoreFromCategories()` - Scores based on categories

---

### In RequirementsModal.tsx (Already Working)

**How It Works:**
```typescript
// Uses 15 categories directly
function getProgramRequirementsForSection(
  categorizedRequirements: any,  // 15 categories
  sectionCategory: string
): string[] {
  // Map section category to program requirement category
  const categoryMapping = {
    'financial': 'financial',
    'market': 'market_size',
    'risk': 'compliance',
    'team': 'team',
    // ... etc
  };
  
  const reqCategory = categoryMapping[sectionCategory] || 'eligibility';
  const requirements = categorizedRequirements[reqCategory] || [];
  
  // Extract values as strings
  return requirements
    .map(req => req.value)
    .filter(Boolean);
}
```

**How It Works:**
1. **Receives 15 categories** from `programData.categorized_requirements`
2. **Maps section category** to requirement category
3. **Extracts values** from that category
4. **Displays** in modal UI

**This already works!** ✅

---

## 📊 Data Flow Summary

### ProgramFinder → Editor Flow

```
1. ProgramFinder
   User answers Q&A
   ↓
2. recommend.ts API
   generateProgramsWithLLM() → Basic programs
   extractWithLLM() → 15 categories
   ↓
3. Frontend
   Scores, displays, user selects
   ↓
4. localStorage
   {
     categorized_requirements: { 15 categories },
     metadata: { ... },
     ...
   }
   ↓
5. Editor
   aiHelper.ts → Uses 15 categories for AI prompts
   RequirementsModal.tsx → Uses 15 categories for display
```

---

## 🎯 What Serves Both Reco & Editor

### The 15 Categories Format

**Extracted by:** `llmExtract.ts`
**Used by:**
- ✅ **Reco:** Scoring, matching, filtering
- ✅ **Editor:** AI prompts, requirements display

**Categories:**
1. `geographic` - Location requirements
2. `eligibility` - Company type, stage, age
3. `financial` - Funding amounts, co-financing, revenue
4. `team` - Team size, composition
5. `project` - Industry focus, sector, TRL
6. `timeline` - Deadlines, duration
7. `documents` - Required documents
8. `technical` - Technical requirements
9. `legal` - Legal/compliance
10. `impact` - Environmental, social, economic
11. `application` - Application process
12. `funding_details` - Use of funds
13. `restrictions` - Eligibility restrictions
14. `terms` - Terms and conditions
15. `compliance` - Compliance requirements

**This is the shared format!** ✅

---

## 🔧 Implementation Details

### aiHelper.ts Changes

**New Methods:**
1. `getRequirementsForSection()` - Maps section → category, extracts requirements
2. `getSectionGuidanceFromCategories()` - Gets guidance from 15 categories
3. `getComplianceTipsFromCategories()` - Gets compliance from 15 categories
4. `calculateReadinessScoreFromCategories()` - Scores from 15 categories

**Updated Methods:**
1. `generateSectionContent()` - Now uses `categorizedRequirements` directly
2. `buildSectionPromptWithStructured()` - Includes program requirements in prompt

**Legacy Methods (Kept for Backward Compatibility):**
- `getSectionGuidanceFromStructured()` - For editor[]/library[] format
- `getComplianceTipsFromStructured()` - For editor[]/library[] format
- `calculateReadinessScoreFromStructured()` - For editor[]/library[] format

---

### RequirementsModal.tsx (No Changes Needed)

**Already Works:**
- Uses `getProgramRequirementsForSection()` helper
- Maps section category → requirement category
- Extracts and displays requirements

**Same Pattern as aiHelper.ts:**
- Both use 15 categories directly
- Both map section → category
- Both extract values

---

## ✅ Summary

### Architecture Decisions:

1. **Keep llmExtract.ts separate** ✅
   - Reusable utility
   - Clear separation of concerns

2. **Keep recommend.ts as API endpoint** ✅
   - Orchestrates flow
   - Uses llmExtract.ts

3. **Use 15 categories format for both** ✅
   - Reco: Scoring, matching
   - Editor: AI prompts, display

4. **No CategoryConverter needed** ✅
   - Use 15 categories directly
   - Simpler, more direct

### How It Works:

**Reco Flow:**
```
Q&A → recommend.ts → generateProgramsWithLLM() → extractWithLLM() → 15 categories → Frontend
```

**Editor Flow:**
```
localStorage (15 categories) → aiHelper.ts → Extract for section → Include in AI prompt
localStorage (15 categories) → RequirementsModal.tsx → Extract for section → Display
```

**Both use the same 15 categories format!** ✅

---

**Last Updated:** 2024-01-XX
**Status:** Implementation complete, architecture clarified

