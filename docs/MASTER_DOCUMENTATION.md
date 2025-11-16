# Master Documentation - Plan2Fund NextGen

## 🎯 Mission Overview

This document serves as the master source for all areas that need to be documented, tested, and maintained in the Plan2Fund NextGen application.

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow Documentation](#data-flow-documentation)
3. [Component Documentation](#component-documentation)
4. [API Documentation](#api-documentation)
5. [Testing Documentation](#testing-documentation)
6. [Integration Points](#integration-points)
7. [Known Issues & Solutions](#known-issues--solutions)
8. [Performance & Optimization](#performance--optimization)
9. [Security & Compliance](#security--compliance)
10. [Deployment & Operations](#deployment--operations)

---

## 🏗️ System Architecture

### Core Components

#### 1. ProgramFinder (Recommendation Engine)
**Location:** `features/reco/components/ProgramFinder.tsx`

**Purpose:** Q&A-based program recommendation system

**Key Features:**
- 12 core questions with multiple input types
- Sub-categories (industry, impact details)
- Skip logic and conditional questions
- LLM-based program generation
- Deep requirement extraction (15 categories)
- Scoring and ranking system

**Dependencies:**
- `features/reco/engine/enhancedRecoEngine.ts` - Scoring logic
- `features/reco/engine/llmExtract.ts` - LLM extraction
- `features/reco/engine/normalization.ts` - Answer normalization
- `pages/api/programs/recommend.ts` - API endpoint

**Data Flow:**
```
User Answers → API → LLM Generation → Extraction → Scoring → Display → Editor
```

**Documentation Status:** ✅ Handover document created (`docs/RECO_HANDOVER_TESTING.md`)

---

#### 2. Editor (Application Builder)
**Location:** `features/editor/components/Editor.tsx`

**Purpose:** AI-powered grant application editor

**Key Features:**
- Section-based template system
- AI content generation with program requirements
- Real-time validation
- Export functionality
- Program requirement integration

**Dependencies:**
- `features/editor/engine/aiHelper.ts` - AI content generation
- `features/editor/templates/` - Section templates
- `shared/user/storage/planStore.ts` - Data persistence

**Integration Points:**
- Reads `selectedProgram` from localStorage (set by ProgramFinder)
- Uses `categorized_requirements` to enhance AI prompts
- Maps extracted requirements to editor format

**Documentation Status:** ⚠️ Needs detailed documentation

---

#### 3. Export System
**Location:** `features/export/`

**Purpose:** Export grant applications to various formats

**Key Features:**
- PDF export
- Word document export
- Formatting and styling
- Template-based rendering

**Documentation Status:** ⚠️ Needs documentation

---

## 📊 Data Flow Documentation

### Complete Data Flow: ProgramFinder → Editor

**Status:** ✅ Documented in `docs/RECO_HANDOVER_TESTING.md`

**Key Flows:**

1. **ProgramFinder Q&A → API**
   - User answers 6+ questions
   - Answers sent to `/api/programs/recommend`
   - Minimum questions: 6 (configurable)

2. **API → LLM Generation**
   - `generateProgramsWithLLM()` creates user profile
   - LLM generates program suggestions
   - Returns basic program info

3. **LLM Generation → Deep Extraction**
   - For each program: `extractWithLLM()` extracts 15 categories
   - Categories: geographic, eligibility, financial, team, project, timeline, documents, technical, legal, impact, application, funding_details, restrictions, terms, compliance

4. **Extraction → Scoring**
   - `scoreProgramsEnhanced()` scores programs
   - Filters programs with score > 0
   - Sorts by score (highest first)
   - Returns top 5

5. **Scoring → Display**
   - Results shown in modal
   - Displays: name, score, funding amount, matches, gaps, reasons

6. **Display → Editor**
   - User selects program
   - `localStorage.setItem('selectedProgram', ...)`
   - Navigates to `/editor?product=submission`
   - Editor reads from localStorage

7. **Editor → AI Helper**
   - Editor loads `categorized_requirements`
   - Maps to editor format (editor[], library[], decision_tree[])
   - Enhances AI prompts with requirements

**Data Structures:**
- `selectedProgram`: { id, name, categorized_requirements, metadata, selectedAt }
- `categorized_requirements`: 15 categories with { type, value, confidence }
- Editor expects: { editor[], library[], decision_tree[] }

**Current Issue:** Category format mismatch (extracted vs editor expected)

---

## 🧩 Component Documentation

### Components to Document

#### ProgramFinder Components
- [x] `ProgramFinder.tsx` - Main Q&A component
- [ ] Question rendering logic
- [ ] Answer validation
- [ ] Results display modal
- [ ] Navigation system

#### Editor Components
- [ ] `Editor.tsx` - Main editor component
- [ ] `SectionContentRenderer.tsx` - Section rendering
- [ ] `RequirementsModal.tsx` - Requirements display
- [ ] Section templates (all templates in `features/editor/templates/`)

#### Shared Components
- [ ] UI components (`shared/components/ui/`)
- [ ] Form components
- [ ] Modal components

---

## 🔌 API Documentation

### API Endpoints

#### `/api/programs/recommend` (POST)
**Status:** ✅ Documented in handover doc

**Purpose:** Generate program recommendations

**Request:**
```typescript
{
  answers: UserAnswers,
  max_results?: number,
  extract_all?: boolean,
  use_seeds?: boolean
}
```

**Response:**
```typescript
{
  success: boolean,
  programs: Program[],
  count: number,
  extraction_results: ExtractionResult[],
  source: 'llm_generated' | 'mixed'
}
```

**Process:**
1. LLM generation (`generateProgramsWithLLM()`)
2. Deep extraction (`extractWithLLM()` for each program)
3. Optional seed URL extraction
4. Return programs with requirements

---

#### `/api/programmes/[id]/requirements` (GET)
**Purpose:** Get program requirements by ID

**Status:** ⚠️ Needs documentation

---

#### `/api/ai/openai` (POST)
**Purpose:** OpenAI API proxy

**Status:** ⚠️ Needs documentation

---

#### Other APIs
- [ ] `/api/user/profile` - User profile management
- [ ] `/api/db/setup` - Database setup
- [ ] All other API endpoints

---

## 🧪 Testing Documentation

### Testing Areas

#### 1. ProgramFinder Testing
**Status:** ✅ Checklist in `docs/RECO_HANDOVER_TESTING.md`

**Test Scenarios:**
- [ ] Q&A form completion
- [ ] API call and response
- [ ] LLM generation
- [ ] Requirement extraction
- [ ] Scoring and ranking
- [ ] Results display
- [ ] Program selection
- [ ] Error handling

#### 2. Editor Testing
**Status:** ⚠️ Needs test scenarios

**Test Scenarios:**
- [ ] Program data loading from localStorage
- [ ] Section rendering
- [ ] AI content generation
- [ ] Requirement integration
- [ ] Export functionality
- [ ] Data persistence

#### 3. Integration Testing
**Status:** ⚠️ Needs test scenarios

**Test Scenarios:**
- [ ] ProgramFinder → Editor flow
- [ ] Data transmission (localStorage)
- [ ] Category mapping
- [ ] AI prompt enhancement
- [ ] End-to-end user journey

#### 4. API Testing
**Status:** ⚠️ Needs test scenarios

**Test Scenarios:**
- [ ] API endpoint responses
- [ ] Error handling
- [ ] Rate limiting
- [ ] LLM fallbacks
- [ ] Data validation

---

## 🔗 Integration Points

### Critical Integrations

#### 1. ProgramFinder → Editor
**Status:** ✅ Documented

**Mechanism:** localStorage (`selectedProgram`)

**Data Format:**
```typescript
{
  id: string,
  name: string,
  categorized_requirements: Record<string, RequirementItem[]>,
  type: string,
  url: string,
  selectedAt: string,
  metadata: {
    funding_amount_min?: number,
    funding_amount_max?: number,
    currency?: string
  }
}
```

**Current Issue:** Category format mismatch

---

#### 2. Editor → AI Helper
**Status:** ⚠️ Needs documentation

**Mechanism:** `aiHelper.ts` reads `categorized_requirements`

**Expected Format:**
```typescript
{
  editor: Array<{ section_name, prompt, hints, ... }>,
  library: Array<{ compliance_requirements }>,
  decision_tree: Array<{ questions }>
}
```

**Current Format (from extraction):**
```typescript
{
  geographic: Array<{ type, value, confidence }>,
  eligibility: Array<{ type, value, confidence }>,
  // ... 13 more categories
}
```

**Solution Needed:** Mapping function or format update

---

#### 3. LLM Integration
**Status:** ⚠️ Needs documentation

**Providers:**
- OpenAI (via `OPENAI_API_KEY`)
- Custom LLM (via `CUSTOM_LLM_ENDPOINT`)

**Usage:**
- Program generation (`generateProgramsWithLLM()`)
- Requirement extraction (`extractWithLLM()`)
- AI content generation (`aiHelper.ts`)

**Configuration:**
- Environment variables
- Retry logic
- Rate limiting
- Error handling

---

## 🐛 Known Issues & Solutions

### Critical Issues

#### 1. Category Format Mismatch
**Status:** ⚠️ Needs solution

**Problem:**
- `extractWithLLM()` extracts 15 categories (geographic, eligibility, etc.)
- Editor expects 3 categories (editor, library, decision_tree)

**Impact:** Editor may not use extracted requirements effectively

**Solutions:**
1. Create mapping function to convert extracted → editor format
2. Update editor to use extracted format directly
3. Hybrid: Map on-the-fly when needed

**Priority:** High

---

#### 2. Data Transmission Method
**Status:** ⚠️ Needs review

**Current:** localStorage (works but not ideal for multi-tab)

**Alternatives:**
- URL parameters
- API endpoint with session
- Context/state management

**Priority:** Medium

---

#### 3. Editor Requirements Format
**Status:** ⚠️ Needs clarification

**Current:** Editor expects specific structure with section_name, prompt, hints

**Question:** Should extracted requirements be mapped to this format, or should editor be updated?

**Priority:** High

---

### Minor Issues

- [ ] TypeScript path aliases consistency
- [ ] Error messages user-friendliness
- [ ] Loading states during extraction
- [ ] Progress indicators
- [ ] Logging and debugging tools

---

## ⚡ Performance & Optimization

### Performance Areas

#### 1. LLM Calls
**Status:** ⚠️ Needs optimization

**Current:**
- Sequential extraction for each program
- No caching
- Full retry on failure

**Optimizations:**
- Parallel extraction
- Response caching
- Incremental retries

---

#### 2. Data Processing
**Status:** ⚠️ Needs review

**Areas:**
- Normalization functions
- Scoring algorithm
- Requirement matching

---

#### 3. UI Performance
**Status:** ⚠️ Needs review

**Areas:**
- Large result sets
- Modal rendering
- Form validation

---

## 🔒 Security & Compliance

### Security Areas

#### 1. API Security
**Status:** ⚠️ Needs documentation

**Areas:**
- Authentication
- Rate limiting
- Input validation
- Error handling (no sensitive data exposure)

---

#### 2. Data Privacy
**Status:** ⚠️ Needs documentation

**Areas:**
- localStorage data handling
- User data storage
- GDPR compliance
- Data retention

---

#### 3. LLM Security
**Status:** ⚠️ Needs documentation

**Areas:**
- API key management
- Request sanitization
- Response validation
- Cost controls

---

## 🚀 Deployment & Operations

### Deployment Areas

#### 1. Environment Variables
**Status:** ⚠️ Needs documentation

**Required:**
- `OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT`
- Database connection strings
- Feature flags

---

#### 2. Build & Compilation
**Status:** ✅ TypeScript compilation verified

**Process:**
- `npx tsc --noEmit` - Type checking
- Next.js build process
- Path alias configuration

---

#### 3. Monitoring & Logging
**Status:** ⚠️ Needs documentation

**Areas:**
- Error tracking
- Performance monitoring
- LLM usage tracking
- User analytics

---

## 📝 Documentation Status Summary

### ✅ Completed
- [x] ProgramFinder data flow (`docs/RECO_HANDOVER_TESTING.md`)
- [x] Testing checklist for ProgramFinder
- [x] TypeScript compilation fixes
- [x] Master documentation structure (this file)

### ⚠️ In Progress
- [ ] Editor component documentation
- [ ] API endpoint documentation
- [ ] Integration point details
- [ ] Testing scenarios for Editor

### ❌ Not Started
- [ ] Export system documentation
- [ ] Security documentation
- [ ] Deployment guide
- [ ] Performance optimization guide
- [ ] User guide

---

## 🎯 Next Steps

### Immediate (High Priority)
1. **Fix category format mismatch** - Map extracted requirements to editor format
2. **Document Editor component** - Complete component documentation
3. **Create mapping function** - Convert 15 categories → editor format
4. **Test end-to-end flow** - Verify ProgramFinder → Editor integration

### Short Term (Medium Priority)
1. **API documentation** - Document all endpoints
2. **Testing scenarios** - Create comprehensive test cases
3. **Error handling** - Improve error messages and handling
4. **Performance optimization** - Parallel extraction, caching

### Long Term (Low Priority)
1. **Export system docs** - Document export functionality
2. **Security audit** - Complete security documentation
3. **Deployment guide** - Production deployment steps
4. **User guide** - End-user documentation

---

## 📚 Related Documents

- `docs/RECO_HANDOVER_TESTING.md` - ProgramFinder handover and testing
- `docs/RECO_FILES_ANALYSIS.md` - File structure analysis
- `docs/MIGRATION_COMPLETE.md` - Migration status
- `pages/api/API_ANALYSIS.md` - API analysis

---

## 🔄 Maintenance

**Last Updated:** 2024-01-XX
**Maintained By:** Development Team
**Review Frequency:** Weekly

**Update Process:**
1. Update relevant sections as work progresses
2. Mark items as ✅ when complete
3. Add new areas as they are discovered
4. Review and update status regularly

---

## 📞 Questions & Support

For questions about:
- **ProgramFinder:** See `docs/RECO_HANDOVER_TESTING.md`
- **Editor:** See Editor component documentation (to be created)
- **API:** See API documentation (to be created)
- **General:** Refer to this master document

---

**This is a living document. Update it as the system evolves.**

