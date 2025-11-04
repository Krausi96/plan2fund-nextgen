# 🔍 Database Sync, Document Analysis & Enhancement Guide

**Date:** 2025-11-02  
**Status:** Complete Analysis

---

## 📊 Database vs JSON Synchronization

### Verification

**Run:**
```bash
node scraper-lite/scripts/verify-database-json-sync.js
```

**What it checks:**
- Database page count vs JSON program count
- Database requirements vs JSON requirements
- Sample comparison (first 5 pages)
- JSON-only programs (not in database)

**Expected:**
- Database should have MORE or EQUAL pages (newer data)
- JSON is fallback only
- Any JSON-only programs should be migrated

---

## 📄 Document Extraction Analysis

### Current Extraction Depth

**What We Extract:**

1. **Basic Documents** (Simple List)
   - Type: `documents_required`
   - Value: Document name/text
   - Required: true/false
   - Source: extraction method

2. **Documents with Structure** (Enhanced)
   - Type: `document_with_structure`
   - Value: Document name
   - Description: Structure/requirements description
   - Format: Format requirements (PDF, max pages, etc.)
   - Requirements: Nested requirements (what document must contain)
   - Source: `table`, `contextual_list`, etc.

### Extraction Sources

**Current Methods:**
1. ✅ Context extraction (regex patterns)
2. ✅ Table extraction (structured tables)
3. ✅ List extraction (ul/ol with structure)
4. ✅ Definition lists (dl/dt/dd - German sites)
5. ✅ Nested lists (sub-requirements within documents)

**What We Capture:**
- ✅ Document name
- ✅ Structure/description (if available)
- ✅ Format requirements (PDF, max pages, etc.)
- ✅ Nested requirements (what document must contain)

---

## 🔄 Document Flow to Frontend

### Database → API → Components

```
Database (requirements table)
  category='documents'
  ↓
  - type: 'documents_required' or 'document_with_structure'
  - value: Document name
  - description: Structure/requirements (optional)
  - format: Format requirements (optional)
  - requirements: Nested requirements (optional)
  ↓
pages/api/programmes/[id]/requirements.ts
  ↓ Transforms to categorized_requirements
  ↓
categoryConverters.convertToEditorSections()
  ↓ Uses documents for editor sections
  ↓
categoryConverters.convertToLibraryData()
  ↓ extractDocuments() (currently empty!)
  ↓
Components:
  - Library: Shows documents as simple list
  - Editor: Uses documents for section hints/guidance
  - RequirementsChecker: Checks document requirements
```

---

## ⚠️ Issues Found

### 1. Document Extraction in Library (Not Used!)

**Problem:** `extractDocuments()` in `categoryConverters.ts` is empty:
```typescript
private extractDocuments(_categorizedRequirements: CategorizedRequirements): string[] {
  return [];  // ❌ Returns empty array!
}
```

**Impact:**
- Library component shows empty documents list
- Document requirements not displayed

**Fix Needed:**
- Extract documents from `categorizedRequirements.documents`
- Use document `value`, `description`, `format`

---

### 2. Document Structure Not Used for Editor

**Current:**
- Editor sections created from standard templates
- Documents extracted but not used to structure editor
- Document requirements not integrated into editor sections

**Opportunity:**
- Use document structure to create editor sections
- Each document → editor section with template
- Use document description as section guidance
- Use document format as section format hints

---

### 3. Program Focus Not Deep Enough

**Current:**
- Extracts basic project focus/innovation focus
- Stored in `program_focus` array (from institution config)

**Can Improve:**
- Extract deeper focus areas from content
- Extract specific research areas
- Extract technology domains
- Extract market segments

---

### 4. Requirements Depth

**Current:**
- Basic requirement extraction
- Some categories have good depth (eligibility, financial)
- Others are shallow (use_of_funds, revenue_model)

**Can Improve:**
- Deeper extraction for shallow categories
- More specific values (not just generic)
- Better context extraction
- Relationship extraction (requirements linked to other requirements)

---

## 💡 Enhancement Recommendations

### Priority 1: Fix Document Extraction (Critical)

**Problem:** Documents not displayed in Library

**Fix:**
```typescript
// In categoryConverters.ts
private extractDocuments(categorizedRequirements: CategorizedRequirements): string[] {
  const docs = categorizedRequirements.documents || [];
  return docs.map(doc => {
    let text = doc.value || '';
    if (doc.description) text += ` (${doc.description})`;
    if (doc.format) text += ` [${doc.format}]`;
    return text;
  });
}
```

**Impact:** Library will show documents correctly

---

### Priority 2: Use Documents for Editor Structure (High Value)

**Idea:** Create editor sections from document requirements

**Implementation:**
```typescript
// In categoryConverters.ts
public convertToEditorSectionsFromDocuments(
  categorizedRequirements: CategorizedRequirements
): EditorSection[] {
  const docs = categorizedRequirements.documents || [];
  return docs.map(doc => ({
    id: `doc_${doc.value.toLowerCase().replace(/\s+/g, '_')}`,
    title: doc.value,
    category: 'documents',
    template: doc.description || `Prepare ${doc.value}`,
    guidance: doc.description || `Requirements for ${doc.value}`,
    hints: doc.requirements || [],
    format: doc.format,
    required: doc.required !== false
  }));
}
```

**Benefits:**
- Editor automatically structured by required documents
- Each document becomes an editor section
- Users know exactly what to prepare

---

### Priority 3: Deeper Focus Extraction (Medium Priority)

**Current:** Basic focus extraction

**Enhancement:**
- Extract specific research areas
- Extract technology domains
- Extract industry sectors
- Extract market segments

**Implementation:**
```typescript
// In extract.ts
// Add deeper focus extraction
const researchAreas = [
  ...safeMatchAll(text, /(?:forschung|research)[\s]+(?:im|in|zu|für)[\s]+([^\.\n]{10,100})/gi),
  ...safeMatchAll(text, /(?:schwerpunkt|focus|thema|topic)[\s:]+([^\.\n]{10,100})/gi)
];

// Extract technology domains
const techDomains = [
  ...safeMatchAll(text, /(?:technologie|technology|innovation)[\s:]+([^\.\n]{10,100})/gi)
];
```

---

### Priority 4: Deeper Requirements (Medium Priority)

**Categories Needing Improvement:**
- `use_of_funds`: Currently shallow (8% coverage)
- `revenue_model`: Currently shallow (3% coverage)
- `market_size`: Currently shallow (2% coverage)

**Enhancement:**
- Better pattern matching
- More context extraction
- Relationship extraction

---

## 🔍 Quality Check Results

### Current Quality (from verify-database-quality.js):

```
Pages: 1,024
Requirements: 21,220
Avg Requirements/Page: 20.7

Requirement Distribution:
- geographic: 3,754 items (37%)
- impact: 3,471 items (34%)
- financial: 3,200 items (31%)
- timeline: 3,027 items (30%)
- documents: 1,529 items (15%)
- eligibility: 1,492 items (15%)
- project: 1,084 items (11%)
- team: 672 items (7%)

Metadata Completeness:
- Title: 100%
- Description: 100%
- Min Amount: 17.6% ⚠️
- Max Amount: 17.6% ⚠️
- Deadline: 7.6% ⚠️
- Contact Email: 12.7% ⚠️
- Region: 46.0%
```

### Areas for Improvement:

1. **Funding Amounts**: 17.6% coverage
   - Improve regex patterns
   - Better currency detection
   - Range extraction

2. **Deadlines**: 7.6% coverage
   - Better date parsing
   - Multiple deadline detection
   - Relative date parsing (e.g., "within 6 months")

3. **Contact Info**: 12.7% coverage
   - Better email detection
   - Phone number extraction
   - Contact form detection

4. **Documents**: Good extraction depth available
   - Structure, format, nested requirements extracted
   - But not used in frontend properly!

---

## 📋 Component Update Check

### How Components Get Data

**Database → API → Component Flow:**

1. **SmartWizard**
   - ✅ Uses `/api/programs?enhanced=true`
   - ✅ Gets fresh database data
   - ✅ Components update automatically

2. **Library**
   - ✅ Uses `/api/programmes/[id]/requirements`
   - ✅ Gets database data
   - ⚠️ Documents not displayed (extractDocuments() empty)

3. **Editor**
   - ✅ Uses `/api/programmes/[id]/requirements`
   - ✅ Gets editor sections
   - ⚠️ Documents not used to structure editor

4. **RequirementsChecker**
   - ✅ Can use database when programId provided
   - ✅ Checks requirements

**Status:** Components get fresh data, but document extraction in frontend needs fixing

---

## 🎯 Intelligence Enhancement Ideas

### 1. Document-Driven Editor Structure (High Value)

**Concept:**
- Each required document → Editor section
- Document description → Section guidance
- Document format → Section format hints
- Nested requirements → Section sub-requirements

**Implementation:**
- Modify `convertToEditorSections()` to check documents
- Create sections from document requirements
- Merge with standard sections

**Benefits:**
- Editor automatically structured by program requirements
- Users know exactly what documents to prepare
- Better compliance

---

### 2. Deeper Focus Extraction

**What to Extract:**
- Specific research areas (AI, biotech, cleantech, etc.)
- Technology domains (IoT, blockchain, etc.)
- Industry sectors (healthcare, finance, etc.)
- Market segments (B2B, B2C, B2G)

**Implementation:**
- Enhanced regex patterns
- Industry keyword database
- Technology taxonomy
- Market segment detection

---

### 3. Requirement Relationships

**Concept:**
- Link related requirements
- "If X then Y" relationships
- Requirement dependencies
- Cross-category relationships

**Example:**
- If `co_financing` > 30%, then `financial` section required
- If `trl_level` >= 5, then `technical` details required
- If `consortium` required, then `team` section must include partners

---

### 4. Automatic Quality Improvement

**Feedback Loop:**
- Track extraction success per site
- Learn which patterns work best
- Auto-improve extraction over time
- Site-specific extractors

---

## 📊 Summary & Action Items

### ✅ What's Working

1. Database is source of truth
2. All components connected to database
3. Document structure extracted (description, format, nested requirements)
4. Good requirement coverage (20.7 avg per page)

### ⚠️ What Needs Fixing

1. **CRITICAL:** `extractDocuments()` returns empty array
   - Library shows no documents
   - Fix in `categoryConverters.ts`

2. **HIGH VALUE:** Documents not used for editor structure
   - Opportunity to auto-structure editor from documents
   - Would improve UX significantly

3. **MEDIUM:** Metadata extraction low (funding 17.6%, deadlines 7.6%)
   - Improve extraction patterns
   - Better regex/parsing

4. **MEDIUM:** Shallow categories need deeper extraction
   - use_of_funds, revenue_model, market_size
   - Better context extraction

### 🚀 Enhancement Priorities

1. **Fix Document Extraction** (Critical - Library broken)
2. **Document-Driven Editor** (High Value - Better UX)
3. **Deeper Focus Extraction** (Medium - Better filtering)
4. **Requirement Relationships** (Medium - Better compliance)

---

**Status:** ✅ Analysis Complete - Ready for Implementation

