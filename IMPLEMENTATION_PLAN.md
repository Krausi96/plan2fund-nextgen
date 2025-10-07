# 🚀 IMPLEMENTATION PLAN: Current State → Target State

**Created**: January 15, 2025  
**Status**: Ready for Implementation  
**Based on**: System Analysis from GPT Agent + Current Architecture

---

## 🎯 **CURRENT STATE ANALYSIS**

### **✅ What's Working (Current State)**
- **Database**: 610 programs in PostgreSQL with AI-enhanced fields
- **API**: 1-2 second response times, serving 610 programs
- **Frontend**: Basic components working with real data
- **Scraper**: 200+ sources configured, real-time monitoring
- **Pipeline**: 90%+ data quality, AI field generation

### **❌ What's Missing (Gap Analysis)**
- **Program Types**: Only grants/loans, missing equity/visa/consulting
- **Categories**: Basic themes, missing 50+ detailed categories
- **Requirements**: Generic text, missing structured Decision Tree/Editor/Library
- **Frontend**: Hard-coded questions, generic templates
- **Extraction**: Basic fields only, missing eligibility/funding/deadlines

---

## 🎯 **TARGET STATE (From System Analysis)**

### **Program Types (7 total)**
- ✅ Grant (current)
- ✅ Loan (current) 
- ❌ Equity (missing)
- ❌ Visa (missing)
- ❌ Consulting (missing)
- ✅ Service (current)
- ✅ Other (current)

### **Categories (50+ total)**
- ✅ Basic themes (current)
- ❌ Detailed categories (missing): digitalisation, energy, environment, life sciences, mobility, climate, etc.

### **Requirements (3 types)**
- ❌ Decision Tree Requirements (missing)
- ❌ Editor Requirements (missing) 
- ❌ Library Requirements (missing)

---

## 📋 **IMPLEMENTATION PLAN: 9 STEPS**

### **STEP 1: Fix Current Build Issues** ⚠️ **CRITICAL**
**Priority**: IMMEDIATE  
**Files**: `pages/api/programs.ts`  
**Issue**: TypeScript error - `Cannot find name 'program'`  
**Action**: Fix the build error to enable development

```typescript
// Current (BROKEN):
if (program.program_type === 'grant' || program.program_type === 'loan') {

// Fix (WORKING):
if (programData.program_type === 'grant' || programData.program_type === 'loan') {
```

### **STEP 2: Update Type Definitions** 
**Priority**: HIGH  
**Files**: `src/types/requirements.ts`  
**Action**: Add structured requirement interfaces

```typescript
// Add to src/types/requirements.ts
export interface DecisionTreeRequirement {
  id: string;
  program_id: string;
  question_text: string;
  answer_options: string[];
  next_question_id?: string;
  validation_rules: ValidationRule[];
}

export interface EditorRequirement {
  id: string;
  program_id: string;
  section_name: string;
  prompt: string;
  hints: string[];
  word_count_min?: number;
  word_count_max?: number;
}

export interface LibraryRequirement {
  id: string;
  program_id: string;
  eligibility_text: string;
  documents: string[];
  funding_amount: string;
  deadlines: string[];
}
```

### **STEP 3: Enhance Scraper Logic**
**Priority**: HIGH  
**Files**: `src/lib/webScraperService.ts`  
**Action**: Extract structured requirements from websites

```typescript
// Add to webScraperService.ts
const extractStructuredRequirements = (html: string, institution: string) => {
  return {
    decisionTree: extractDecisionTreeQuestions(html),
    editor: extractEditorRequirements(html),
    library: extractLibraryDetails(html)
  };
};
```

### **STEP 4: Update Database Schema**
**Priority**: HIGH  
**Files**: `scripts/database/setup-database.sql`  
**Action**: Add requirement tables

```sql
-- Add to setup-database.sql
CREATE TABLE decision_tree_questions (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  question_text TEXT NOT NULL,
  answer_options JSONB,
  next_question_id INTEGER,
  validation_rules JSONB
);

CREATE TABLE editor_sections (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  section_name VARCHAR(255) NOT NULL,
  prompt TEXT,
  hints JSONB,
  word_count_min INTEGER,
  word_count_max INTEGER
);

CREATE TABLE library_details (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  eligibility_text TEXT,
  documents JSONB,
  funding_amount VARCHAR(255),
  deadlines JSONB
);
```

### **STEP 5: Regenerate Data with Requirements**
**Priority**: HIGH  
**Files**: `data/migrated-programs.json`  
**Action**: Run enhanced scraper to get structured requirements

```bash
# Run enhanced scraper
npm run scraper:run -- --action=save --enhanced=true
```

### **STEP 6: Update API Endpoints**
**Priority**: MEDIUM  
**Files**: `pages/api/programs.ts`, `pages/api/programs-ai.ts`  
**Action**: Add requirement endpoints

```typescript
// Add to API endpoints
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { programId } = req.query;
    
    if (programId) {
      // Return program with structured requirements
      const program = await getProgramWithRequirements(programId);
      return res.status(200).json(program);
    }
    
    // Return all programs with basic info
    const programs = await getAllPrograms();
    return res.status(200).json(programs);
  }
}
```

### **STEP 7: Update Frontend Components**
**Priority**: MEDIUM  
**Files**: `src/components/decision-tree/`, `src/components/editor/`, `src/components/library/`  
**Action**: Use structured requirements

```typescript
// Update DynamicWizard.tsx
const generateQuestionsFromRequirements = (requirements: DecisionTreeRequirement[]) => {
  return requirements.map(req => ({
    id: req.id,
    question: req.question_text,
    options: req.answer_options,
    validation: req.validation_rules
  }));
};
```

### **STEP 8: Add Helper Modules**
**Priority**: LOW  
**Files**: New files in `src/lib/`  
**Action**: Create requirement processing modules

```typescript
// src/lib/requirementsMapper.ts
export class RequirementsMapper {
  static mapScrapedToStructured(scrapedData: any): StructuredRequirements {
    // Map scraped text to structured requirements
  }
}

// src/lib/decisionTreeParser.ts
export class DecisionTreeParser {
  static parseConditionalLogic(text: string): DecisionTreeRequirement[] {
    // Parse conditional logic from text
  }
}
```

### **STEP 9: Testing & Validation**
**Priority**: MEDIUM  
**Action**: Test all layers work together

```bash
# Test sequence
npm run build                    # Should pass
npm run scraper:test            # Test scraper
npm run api:test                # Test API endpoints
npm run frontend:test           # Test frontend components
```

---

## 🔄 **LAYER INTEGRATION VERIFICATION**

### **Layer 1 → Layer 2**
- ✅ Scraper extracts structured requirements
- ✅ Pipeline processes requirements into database format

### **Layer 2 → Layer 3**
- ✅ Database stores structured requirements
- ✅ AI enhancement adds program-specific questions/templates

### **Layer 3 → Layer 4**
- ✅ API serves structured requirements
- ✅ Endpoints return program-specific data

### **Layer 4 → Layer 5**
- ✅ Business logic uses structured requirements
- ✅ Recommendation engine considers program-specific criteria

### **Layer 5 → Layer 6**
- ✅ Frontend components use structured requirements
- ✅ Dynamic wizard, editor, library work with real data

---

## ⚡ **QUICK START (Immediate Actions)**

1. **Fix build error** (5 minutes)
2. **Add requirement types** (30 minutes)
3. **Test current system** (15 minutes)
4. **Plan next steps** (30 minutes)

**Total**: ~1.5 hours to get started

---

## 🎯 **SUCCESS CRITERIA**

- ✅ **Build passes** without errors
- ✅ **All 6 layers** work together
- ✅ **Structured requirements** in database
- ✅ **Dynamic frontend** components
- ✅ **Program-specific** templates and questions
- ✅ **50+ categories** supported
- ✅ **7 program types** supported

---

**Next Action**: Fix the build error in `pages/api/programs.ts` and start implementing Step 1.
