# Product-Specific Sections Implementation Specification

**Date:** 2025-01-03  
**Target:** Another agent to implement  
**Status:** Ready for implementation

---

## 🎯 **OBJECTIVE**

Add product-specific section templates (strategy/review/submission) to `MASTER_SECTIONS` while maintaining high quality and compliance.

---

## 📋 **EXACT FILE CHANGES REQUIRED**

### **File 1: `shared/lib/templates/sections.ts`**

#### **Change 1.1: Restructure MASTER_SECTIONS Type**

**FROM:**
```typescript
export const MASTER_SECTIONS: Record<string, SectionTemplate[]> = {
  grants: [...],
  bankLoans: [...],
  equity: [...],
  visa: [...]
}
```

**TO:**
```typescript
export const MASTER_SECTIONS: Record<string, Record<string, SectionTemplate[]>> = {
  grants: {
    strategy: [...],
    review: [...],
    submission: [...]
  },
  bankLoans: {
    strategy: [...],
    review: [...],
    submission: [...]
  },
  equity: {
    strategy: [...],
    review: [...],
    submission: [...]
  },
  visa: {
    strategy: [...],
    review: [...],
    submission: [...]
  }
}
```

#### **Change 1.2: Create Product-Specific Sections**

**Strategy Product Sections (5-7 focused sections per funding type):**

For each funding type (grants, bankLoans, equity, visa), create a `strategy` array with these sections:

**Grants Strategy (5 sections):**
1. `executive_summary` - Use existing, but adjust wordCountMax: 300
2. `market_opportunity` - Use existing from equity, or create new
3. `business_model` - Use existing from equity, or create new
4. `competitive_analysis` - Use existing from equity, or create new
5. `financial_overview` - New simplified version of financial_plan (150-300 words)

**Bank Loans Strategy (5 sections):**
1. `executive_summary` - Use existing, adjust wordCountMax: 300
2. `market_analysis` - Use existing
3. `financial_stability` - Use existing
4. `repayment_plan` - Use existing
5. `business_model` - New for loans (revenue streams, cash flow)

**Equity Strategy (5 sections):**
1. `executive_summary` - Use existing company_purpose_vision
2. `market_opportunity` - Use existing
3. `business_model` - Use existing
4. `competitive_analysis` - Use existing
5. `financials` - Use existing but simplified

**Visa Strategy (5 sections):**
1. `executive_summary` - Use existing
2. `market_opportunity` - Use existing
3. `business_concept` - Use existing
4. `financial_plan` - Use existing
5. `job_creation_plan` - Use existing

**Review Product Sections (All sections):**

For each funding type, `review` array = ALL existing sections from current master template (unchanged).

**Submission Product Sections (All sections):**

For each funding type, `submission` array = ALL existing sections from current master template (unchanged).

#### **Change 1.3: Update Helper Functions**

**FROM:**
```typescript
export function getStandardSections(fundingType: string): SectionTemplate[] {
  const type = fundingType.toLowerCase();
  switch (type) {
    case 'grants':
    case 'grant':
      return MASTER_SECTIONS.grants;
    // ...
  }
}
```

**TO:**
```typescript
export function getStandardSections(
  fundingType: string, 
  productType?: 'strategy' | 'review' | 'submission'
): SectionTemplate[] {
  const type = fundingType.toLowerCase();
  const product = productType || 'submission'; // Default to submission
  
  let sections: SectionTemplate[] | undefined;
  
  switch (type) {
    case 'grants':
    case 'grant':
      sections = MASTER_SECTIONS.grants?.[product];
      break;
    case 'bankloans':
    case 'bank_loans':
    case 'loan':
      sections = MASTER_SECTIONS.bankLoans?.[product];
      break;
    case 'equity':
    case 'investment':
      sections = MASTER_SECTIONS.equity?.[product];
      break;
    case 'visa':
    case 'residency':
      sections = MASTER_SECTIONS.visa?.[product];
      break;
    default:
      sections = MASTER_SECTIONS.grants?.[product];
  }
  
  // Fallback chain: product → submission → grants.submission
  if (!sections) {
    sections = MASTER_SECTIONS[type]?.submission || 
               MASTER_SECTIONS.grants?.submission || 
               [];
  }
  
  return sections;
}
```

**Update other helper functions similarly:**
- `getSectionById()` - Add `productType?` parameter
- `getSectionsByCategory()` - Add `productType?` parameter

---

### **File 2: `shared/lib/templates/index.ts`**

#### **Change 2.1: Update getSections() Function**

**FROM:**
```typescript
export async function getSections(
  fundingType: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  const masterSections = MASTER_SECTIONS[fundingType] || MASTER_SECTIONS.grants;
  // ...
}
```

**TO:**
```typescript
export async function getSections(
  fundingType: string,
  productType?: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  // Normalize product type
  const product = productType && ['strategy', 'review', 'submission'].includes(productType.toLowerCase())
    ? productType.toLowerCase() as 'strategy' | 'review' | 'submission'
    : 'submission'; // Default to submission
  
  // Get product-specific master sections
  const masterSections = MASTER_SECTIONS[fundingType]?.[product] 
    || MASTER_SECTIONS[fundingType]?.submission 
    || MASTER_SECTIONS.grants?.submission 
    || [];
  
  // If programId provided, load program-specific and merge
  if (programId) {
    const programSections = await loadProgramSections(programId, baseUrl);
    if (programSections.length > 0) {
      return mergeSections(masterSections, programSections);
    }
  }
  
  return masterSections;
}
```

#### **Change 2.2: Update getSection() Function**

**FROM:**
```typescript
export async function getSection(
  fundingType: string,
  sectionId: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}
```

**TO:**
```typescript
export async function getSection(
  fundingType: string,
  sectionId: string,
  productType?: string,
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate | undefined> {
  const sections = await getSections(fundingType, productType, programId, baseUrl);
  return sections.find((s: SectionTemplate) => s.id === sectionId);
}
```

---

### **File 3: `features/editor/engine/EditorEngine.ts`**

#### **Change 3.1: Update loadSectionsFromTemplates()**

**FROM:**
```typescript
private async loadSectionsFromTemplates(_productId: string, templateId?: string): Promise<UnifiedEditorSection[]> {
  const fundingType = templateId ? this.mapTemplateIdToFundingType(templateId) : 'grants';
  const sections = await getSections(fundingType);
  // ...
}
```

**TO:**
```typescript
private async loadSectionsFromTemplates(
  _productId: string, 
  templateId?: string,
  productType?: string
): Promise<UnifiedEditorSection[]> {
  const fundingType = templateId ? this.mapTemplateIdToFundingType(templateId) : 'grants';
  const sections = await getSections(fundingType, productType);
  // ...
}
```

**Also update `loadSections()` to accept and pass `productType`:**

```typescript
async loadSections(
  productId: string, 
  productType?: string
): Promise<UnifiedEditorSection[]> {
  // ... existing code ...
  // Pass productType to loadSectionsFromTemplates
  return await this.loadSectionsFromTemplates(productId, templateId, productType);
}
```

---

### **File 4: `features/editor/components/Phase4Integration.tsx`**

#### **Change 4.1: Pass Product Type to loadSections**

**Find where `loadProgramSections()` calls `editorEngineRef.current.loadSections()`:**

**FROM:**
```typescript
let sections = await editorEngineRef.current.loadSections(programId);
```

**TO:**
```typescript
// Get product type from plan or normalizedData
const productType = plan?.product || normalizedData?.product || 'submission';
let sections = await editorEngineRef.current.loadSections(programId, productType);
```

**Note:** You may need to import `normalizeEditorInput` or get product from `programProfile` or route.

---

## 📐 **EXACT OUTPUT FORMAT**

### **MASTER_SECTIONS Structure:**

```typescript
export const MASTER_SECTIONS: Record<string, Record<string, SectionTemplate[]>> = {
  grants: {
    strategy: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        description: 'Provide a concise strategic overview...',
        required: true,
        wordCountMin: 200,
        wordCountMax: 300,  // REDUCED from 500 for strategy
        order: 1,
        category: 'general',
        prompts: [
          'Summarise your strategic vision in two to three sentences.',
          'What is your business purpose and long-term vision?',
          'What makes your approach strategically sound?',
          'Briefly state the expected strategic impact.'
        ],
        validationRules: {
          requiredFields: ['strategic_overview', 'business_purpose', 'strategic_impact'],
          formatRequirements: ['clear_vision', 'strategic_thinking']
        },
        source: {
          verified: true,
          verifiedDate: '2025-11-04',
          officialProgram: 'WKO Businessplan Guide',
          sourceUrl: 'https://www.wko.at/gruendung/inhalte-businessplan',
          version: '1.0'
        }
      },
      {
        id: 'market_opportunity',
        title: 'Market Opportunity',
        description: 'Demonstrate the size and attractiveness of your target market...',
        required: true,
        wordCountMin: 150,
        wordCountMax: 350,
        order: 2,
        category: 'market',
        prompts: [
          'Quantify the total addressable market (TAM) and the portion you can realistically capture (SAM/SOM).',
          'Identify key market segments and customer personas.',
          'Discuss trends or catalysts that make this market attractive right now.',
          'Explain barriers to entry and how they affect your opportunity.'
        ],
        validationRules: {
          requiredFields: ['tam_sam_som', 'market_segments', 'growth_trends', 'barriers_to_entry'],
          formatRequirements: ['credible_sources', 'data_visualisation']
        },
        source: {
          verified: true,
          verifiedDate: '2025-11-04',
          officialProgram: 'Sequoia Capital Pitch Deck Template',
          sourceUrl: 'https://www.slidegenius.com/cm-faq-question/what-is-the-recommended-pitch-deck-template-provided-by-sequoia-capital',
          version: '1.0'
        }
      },
      // ... 3 more sections (business_model, competitive_analysis, financial_overview)
    ],
    review: [
      // ALL 10 sections from current grants master (EXACT COPY)
      // ... existing sections unchanged
    ],
    submission: [
      // ALL 10 sections from current grants master (EXACT COPY)
      // ... existing sections unchanged
    ]
  },
  // Repeat for bankLoans, equity, visa
}
```

---

## ✅ **QUALITY VALIDATION RULES**

### **Strategy Product:**
- Minimum 70% quality score
- Focus on strategic thinking
- Market fit validation
- Business model validation

### **Review Product:**
- Minimum 80% quality score
- All sections reviewed
- Quality improvement focus

### **Submission Product:**
- **100% compliance required**
- All mandatory fields
- Program-specific requirements met
- RequirementsChecker score: 100%

---

## 🧪 **TESTING CRITERIA**

### **Test 1: Structure**
```typescript
// Verify structure
const grantsStrategy = MASTER_SECTIONS.grants?.strategy;
assert(grantsStrategy !== undefined);
assert(grantsStrategy.length >= 5);
assert(grantsStrategy.length <= 7);

const grantsReview = MASTER_SECTIONS.grants?.review;
assert(grantsReview !== undefined);
assert(grantsReview.length === 10); // All sections

const grantsSubmission = MASTER_SECTIONS.grants?.submission;
assert(grantsSubmission !== undefined);
assert(grantsSubmission.length === 10); // All sections
```

### **Test 2: API**
```typescript
// Test getSections with product type
const strategySections = await getSections('grants', 'strategy');
assert(strategySections.length >= 5);

const reviewSections = await getSections('grants', 'review');
assert(reviewSections.length === 10);

const submissionSections = await getSections('grants', 'submission');
assert(submissionSections.length === 10);
```

### **Test 3: Backward Compatibility**
```typescript
// Test without product type (should default to submission)
const defaultSections = await getSections('grants');
assert(defaultSections.length === 10); // Should be submission sections
```

---

## 📝 **STEP-BY-STEP INSTRUCTIONS**

### **Step 1: Backup Current Structure**
1. Read current `MASTER_SECTIONS` from `sections.ts`
2. Store all sections in variables: `grantsAll`, `bankLoansAll`, `equityAll`, `visaAll`

### **Step 2: Create Strategy Sections**
For each funding type:
1. Select 5-7 key sections from existing master
2. Adjust `wordCountMax` for strategy (reduce by ~30-40%)
3. Modify prompts to focus on strategic thinking
4. Update `validationRules` to focus on strategic elements
5. Keep same `source` verification

### **Step 3: Create Review Sections**
For each funding type:
1. Copy ALL existing sections unchanged
2. Use as `review` array

### **Step 4: Create Submission Sections**
For each funding type:
1. Copy ALL existing sections unchanged
2. Use as `submission` array

### **Step 5: Restructure MASTER_SECTIONS**
```typescript
export const MASTER_SECTIONS: Record<string, Record<string, SectionTemplate[]>> = {
  grants: {
    strategy: [...],  // Step 2 result
    review: [...],    // Step 3 result
    submission: [...] // Step 4 result
  },
  // ... repeat for other funding types
}
```

### **Step 6: Update Helper Functions**
- Update `getStandardSections()` to accept `productType?`
- Update `getSectionById()` to accept `productType?`
- Update `getSectionsByCategory()` to accept `productType?`

### **Step 7: Update Template Registry**
- Update `getSections()` in `index.ts` to accept `productType?`
- Update `getSection()` in `index.ts` to accept `productType?`

### **Step 8: Update Editor Engine**
- Update `loadSectionsFromTemplates()` to accept `productType?`
- Update `loadSections()` to accept and pass `productType?`

### **Step 9: Update Phase4Integration**
- Get product type from plan or normalizedData
- Pass product type to `loadSections()`

### **Step 10: Test**
- Run TypeScript compilation: `npx tsc --noEmit`
- Verify all tests pass
- Check backward compatibility

---

## ✅ **VALIDATION CHECKLIST**

Before considering implementation complete:

- [ ] `MASTER_SECTIONS` structure changed to `Record<string, Record<string, SectionTemplate[]>>`
- [ ] Strategy sections created for all 4 funding types (5-7 sections each)
- [ ] Review sections created for all 4 funding types (all sections)
- [ ] Submission sections created for all 4 funding types (all sections)
- [ ] `getStandardSections()` updated to accept `productType?`
- [ ] `getSections()` updated to accept `productType?`
- [ ] `getSection()` updated to accept `productType?`
- [ ] `EditorEngine.loadSections()` updated to accept `productType?`
- [ ] `Phase4Integration` passes product type to `loadSections()`
- [ ] TypeScript compilation passes: `npx tsc --noEmit`
- [ ] Backward compatibility verified (no product type = submission)
- [ ] All sections have source verification
- [ ] All sections have validation rules
- [ ] Word counts appropriate for each product type

---

## 📊 **EXPECTED SECTION COUNTS**

| Funding Type | Strategy | Review | Submission |
|-------------|----------|--------|------------|
| **Grants** | 5 sections | 10 sections | 10 sections |
| **Bank Loans** | 5 sections | 8 sections | 8 sections |
| **Equity** | 5 sections | 11 sections | 11 sections |
| **Visa** | 5 sections | 8 sections | 8 sections |

---

## 🎯 **QUALITY REQUIREMENTS**

### **Strategy Sections:**
- Word counts: 150-350 words (reduced from standard)
- Focus: Strategic thinking, market fit, business model
- Prompts: Strategy-focused

### **Review Sections:**
- Word counts: Same as current master (unchanged)
- Focus: Comprehensive review, quality improvement
- Prompts: Same as current master (unchanged)

### **Submission Sections:**
- Word counts: Same as current master (unchanged)
- Focus: Full compliance, program-specific
- Prompts: Same as current master (unchanged)

---

## ⚠️ **IMPORTANT NOTES**

1. **DO NOT DELETE** existing sections - reuse them for review/submission
2. **DO NOT CHANGE** source verification - keep all `source` objects
3. **DO NOT CHANGE** validation rules for review/submission - keep them identical
4. **ONLY MODIFY** word counts and prompts for strategy sections
5. **MAINTAIN** backward compatibility - default to submission if no product type
6. **PRESERVE** all existing functionality

---

## 🔍 **VERIFICATION**

After implementation, verify:
1. ✅ Structure: `MASTER_SECTIONS.grants.strategy` exists
2. ✅ Counts: Strategy has 5 sections, Review/Submission have all
3. ✅ API: `getSections('grants', 'strategy')` returns 5 sections
4. ✅ Backward: `getSections('grants')` returns submission (10 sections)
5. ✅ Types: No TypeScript errors
6. ✅ Quality: All sections have validation rules and source verification

---

## 📄 **FILES TO MODIFY**

1. ✅ `shared/lib/templates/sections.ts` - Restructure MASTER_SECTIONS
2. ✅ `shared/lib/templates/index.ts` - Update getSections() API
3. ✅ `features/editor/engine/EditorEngine.ts` - Pass product type
4. ✅ `features/editor/components/Phase4Integration.tsx` - Get and pass product type

---

**This specification is complete and ready for another agent to implement.**

