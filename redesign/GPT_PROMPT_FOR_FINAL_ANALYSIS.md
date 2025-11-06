# GPT Prompt: Final Strategic Analysis & Implementation Review

**Purpose:** Get comprehensive analysis of current implementation vs original requirements, identify gaps, and receive direct Cursor instructions for remaining work.

**Context:** You are analyzing a Next.js web application for Austrian/EU funding applications. The system has been partially redesigned based on a strategic analysis report. You need to review what's been implemented, identify what's missing from the original requirements, and provide specific Cursor instructions to complete the implementation.

---

## 📋 CONTEXT: What We Do

### Business Overview
**Plan2Fund** is a specialized platform for entrepreneurs seeking Austrian and EU funding. We help users:
1. **Discover** funding programs from 32+ Austrian/EU institutions
2. **Match** with the best programs based on their project
3. **Create** program-specific business plans and application documents
4. **Ensure compliance** with program requirements before submission

### Target Group
- **Primary:** Entrepreneurs, startups, SMEs seeking funding in Austria/EU
- **Secondary:** Consultants helping clients with funding applications
- **Tertiary:** Researchers and innovators applying for grants

### Funding Types We Support
- **Grants:** FFG Basisprogramm, AWS Preseed, Horizon Europe, EIC, etc.
- **Bank Loans:** Traditional business loans, working capital, equipment financing
- **Equity:** Venture capital, angel investment, equity crowdfunding
- **Visa:** Red-White-Red Card, startup residence permits

### Core Products
1. **Business Plan Editor:** Program-specific templates, compliance checking, AI assistance
2. **Additional Documents:** Pitch decks, application forms, financial plans, work plans
3. **Program Matching:** SmartWizard (guided) + Advanced Search (manual) with semantic search
4. **Compliance Validation:** Real-time checking against program requirements

---

## 🏗️ CURRENT ARCHITECTURE & FILE LINKAGE

### Area 1: Scraper-Lite (`scraper-lite/`)
**What it does:**
- **URL Discovery:** Iteratively discovers pages from 32+ institutions using seed URLs
- **Metadata Extraction:** Extracts title, description, institution, program name, deadlines
- **Requirements Extraction:** Extracts 35 categories of requirements:
  - Eligibility (eligibility_criteria, company_type, geographic_scope, etc.)
  - Financial (funding_amount, co_financing, use_of_funds, etc.)
  - Timeline (application_deadline, project_duration, etc.)
  - Team (team_requirements, qualifications, etc.)
  - Impact (environmental_impact, social_impact, economic_impact, etc.)
  - Project (innovation_focus, technology_area, project_scope, etc.)
  - Documents (required_documents, format_requirements, etc.)
  - And more...

**Current Implementation:**
- ✅ **Hybrid extraction:** Pattern-based (regex) + LLM (gpt-4o-mini) for missing categories
- ✅ **Caching:** `llmCache.ts` caches LLM results by URL hash (7-day TTL)
- ✅ **Database:** Stores in `pages` and `requirements` tables with `extraction_method` and `confidence` fields
- ✅ **Files:**
  - `scraper-lite/src/scraper.ts` - Main orchestrator, calls `extractHybrid` from `llm-extract.ts`
  - `scraper-lite/src/extract.ts` - Pattern-based extraction (35 categories)
  - `scraper-lite/src/llm-extract.ts` - LLM extraction (`extractWithLLM`, `extractHybrid`)
  - `scraper-lite/src/llmCache.ts` - Caching layer
  - `scraper-lite/src/db/page-repository.ts` - Saves pages and requirements
  - `scraper-lite/src/db/neon-schema.sql` - Database schema

**How Areas 2, 3, 4 use this data:**
- **Area 2 (Reco):** Uses `categorized_requirements` for matching and scoring
- **Area 3 (Editor Entry):** Uses requirements to generate program-specific templates
- **Area 4 (Editor):** Uses requirements for compliance checking and AI context

**Status:** ✅ 100% Complete (hybrid approach, not pure LLM replacement)

---

### Area 2: Reco/SmartWizard & Advanced Search (`features/reco/`)
**What it does:**
- Lets users find the best funding program based on their input
- Uses requirements from scraper-lite to match programs
- Provides scoring and explanations

**Current Implementation:**
- ✅ **Unified Component:** `ProgramFinder.tsx` replaces both SmartWizard and AdvancedSearch
- ✅ **Two Modes:**
  - **Guided Mode:** Uses `QuestionEngine` to ask dynamic questions
  - **Manual Mode:** Filters + semantic search query
- ✅ **Semantic Search:** Uses OpenAI embeddings (`text-embedding-3-small`) + pgvector
- ✅ **Hybrid Scoring:** 70% rule-based (EnhancedReco) + 30% semantic similarity
- ✅ **Files:**
  - `features/reco/components/ProgramFinder.tsx` - Unified UI component
  - `features/reco/engine/enhancedRecoEngine.ts` - Rule-based scoring
  - `features/reco/engine/questionEngine.ts` - Dynamic question generation
  - `pages/api/programmes/search.ts` - Search API (semantic + rule-based)
  - `shared/lib/embeddings.ts` - Embedding generation and similarity search
  - `pages/reco.tsx` - Renders ProgramFinder in guided mode
  - `pages/advanced-search.tsx` - Renders ProgramFinder in manual mode
  - `pages/main/results.tsx` - Results display page

**Status:** ✅ 100% Complete

---

### Area 3: Editor Entry (`shared/lib/templates/`)
**What it does:**
- Generates program-specific section templates from scraped requirements
- Merges master templates with program-specific overrides

**Current Implementation:**
- ✅ **Master Templates:** `sections.ts` defines standard sections for grants, loans, equity, visa
- ✅ **LLM Template Generation:** `templateGenerator.ts` uses LLM to create program-specific templates
- ✅ **Template Versioning:** `templateVersioning.ts` stores templates in DB with metadata
- ✅ **Program Overrides:** `program-overrides.ts` loads and merges templates
- ✅ **Files:**
  - `shared/lib/templates/sections.ts` - Master section templates
  - `shared/lib/templates/program-overrides.ts` - Loads program-specific templates (LLM or rule-based)
  - `shared/lib/templateGenerator.ts` - LLM-based template generation
  - `shared/lib/templates/templateVersioning.ts` - Version management
  - `features/editor/engine/categoryConverters.ts` - Maps requirements to sections (rule-based)

**Status:** ✅ 80% Complete (LLM generation + versioning done, dynamic mapping partial)

---

### Area 4: Editor (`features/editor/`)
**What it does:**
- Allows users to create business plans with program-specific templates
- Provides compliance checking and AI assistance
- Supports financial tables, charts, images, additional documents

**Current UI Layout (Canva-style):**
```
┌─────────────┬──────────────────────────────┬──────────────┐
│             │                              │              │
│   LEFT      │        CENTER CANVAS         │    RIGHT     │
│  SIDEBAR    │      (Main Editor)           │   DRAWER     │
│             │                              │              │
│ SectionTree │  RichTextEditor              │  Tabs:       │
│ (Navigation)│  - Financial Tables          │  - Compliance│
│             │  - Charts                    │  - Format    │
│ - Sections  │  - Images                    │  - Preview   │
│ - Progress  │  - Content editing            │  - Documents │
│ - Icons     │                              │              │
│             │                              │              │
└─────────────┴──────────────────────────────┴──────────────┘
```

**Current Components:**
- ✅ **UnifiedEditorLayout.tsx** - Main Canva-style layout
- ✅ **SectionTree.tsx** - Left navigation with sections, progress, icons
- ✅ **RichTextEditor.tsx** - Main content editor (Quill-based)
- ✅ **ComplianceAIHelper.tsx** - Merged compliance checker + AI assistant (right drawer)
- ✅ **DocumentCustomizationPanel.tsx** - Format settings (right drawer)
- ✅ **PreviewPanel.tsx** - Live PDF preview (right drawer, react-pdf)
- ✅ **AdditionalDocumentsEditor.tsx** - Additional documents editor (right drawer tab)
- ✅ **FinancialTable.tsx** - Editable financial tables
- ✅ **ChartGenerator.tsx** - Charts from table data (Recharts)
- ✅ **ImageUpload.tsx** - Image upload component

**Chapter/Template System:**
- **Order:** Defined in `sections.ts` by `order` field (1, 2, 3, ...)
- **Executive Summary:** Auto-generated from other sections (button in editor)
- **Templates:** Loaded from `program-overrides.ts` (LLM-generated or rule-based)
- **User Experience:** 
  - User sees section list in left sidebar
  - Clicks section → sees description and prompts in center
  - Writes free-form content (not step-by-step questions)
  - Prompts shown as guidance, not required answers
- **Quality Assurance:**
  - ReadinessValidator checks compliance with program requirements
  - Word count validation (min/max per section)
  - ComplianceAIHelper shows issues and AI suggestions
  - No broader quality scoring beyond compliance

**Financials, Graphs, Images:**
- ✅ Financial tables: `FinancialTable.tsx` with templates (P&L, cash flow, etc.)
- ✅ Charts: `ChartGenerator.tsx` creates bar/line/pie charts from table data
- ✅ Images: `ImageUpload.tsx` uploads to `/public/uploads/images/`, inserts into editor
- ✅ Image descriptions: Supported in image upload component

**Additional Documents:**
- ✅ `AdditionalDocumentsEditor.tsx` - Separate editor for pitch decks, forms, etc.
- ✅ Auto-population from business plan sections
- ✅ Templates loaded from program requirements and master templates
- ⚠️ Content variation: Auto-population exists but no strategy to ensure documents don't sound the same

**Freemium Model:**
- ✅ Feature flags: `shared/lib/featureFlags.ts` defines free vs premium features
- ✅ Premium features: Semantic search, advanced AI, PDF export, additional documents
- ✅ Free features: Basic editor, image upload, unlimited plans
- ⚠️ Pricing model: Not fully defined in code (just feature flags)

**Status:** ✅ 95% Complete

---

## ❓ STRATEGIC QUESTIONS

### 1. Competitive Positioning
**Question:** Based on current architecture, how am I going to compete against ChatGPT and other providers, also considering future advances? What makes me different? What is missing? Cursor is a good example, specialized in programming. Should this be my strategic direction?

**Current Differentiation:**
- ✅ Structured, up-to-date data from 32+ institutions (scraper-lite)
- ✅ Program-specific templates and compliance checking
- ✅ End-to-end workflow (discovery → matching → creation → validation)
- ✅ Austrian/EU funding expertise built-in
- ✅ Semantic search + rule-based matching

**What to Analyze:**
- Is specialization (like Cursor for code) the right strategy?
- What gaps exist vs ChatGPT/Claude for funding applications?
- How to defend against future LLM advances?
- What unique value can't be replicated by generic AI?

---

### 2. LLM/ML Strategy
**Question:** Should I create an LLM or use AI/Machine Learning to learn patterns of programs or business plans to further improve? In what areas of the web application should I do that and how would I integrate that?

**Current LLM Usage:**
- ✅ Scraper: Hybrid extraction (pattern + LLM for missing categories)
- ✅ Editor Entry: LLM template generation from requirements
- ✅ Editor: AI assistant with expert prompts
- ✅ Reco: Semantic search with embeddings

**What to Analyze:**
- Should we train a fine-tuned model on funding applications?
- Where would ML pattern learning add most value?
- How to integrate ML without breaking existing architecture?
- What data do we need to collect?

---

### 3. LLM Integration Strategy
**Question:** How am I going to integrate an LLM approach to cover the important areas the best way?

**Current State:**
- ✅ Scraper: Hybrid (pattern-first, LLM for gaps)
- ✅ Reco: Semantic embeddings for similarity
- ✅ Editor Entry: LLM template generation
- ✅ Editor: AI assistant with comprehensive knowledge

**What to Analyze:**
- Should scraper be pure LLM or keep hybrid?
- How to optimize LLM costs while maintaining quality?
- What areas need more LLM integration?
- How to ensure consistency across LLM outputs?

---

## 🔍 DETAILED AREA ANALYSIS REQUESTS

### Area 1: Scraper-Lite
**Original Question:** "How can we replace this 1:1 with an LLM, how should we store the data and how are 2, 3 and 4 can use the data."

**Current State:**
- Hybrid approach (pattern + LLM)
- Data stored in `pages` and `requirements` tables
- Used by Areas 2, 3, 4 via API

**What to Analyze:**
- Should we move to pure LLM extraction?
- How to ensure data quality with pure LLM?
- Storage structure optimal?
- How to improve data flow to Areas 2, 3, 4?

---

### Area 2: Reco/SmartWizard & Advanced Search
**Original Questions:**
- "Should we use both or should we integrate?" ✅ DONE (unified)
- "How are we using the data from scraper lite or the new LLM Approach?" ✅ DONE (semantic + rule-based)
- "Shall we use EnhancedReco and results?" ✅ DONE
- "What about the scoring? how can we make this work?" ✅ DONE (hybrid 70/30)

**What to Analyze:**
- Is the 70/30 split optimal?
- Should we add ML-based scoring?
- How to improve explanations?
- What's missing for better matching?

---

### Area 3: Editor Entry
**Original Question:** "What templates we are using and what we base them on? Should we parse the templates also with LLM approach?"

**Current State:**
- ✅ Master templates in `sections.ts`
- ✅ LLM template generation from requirements
- ✅ Template versioning

**What to Analyze:**
- Template quality sufficient?
- Should we use LLM to improve master templates?
- Dynamic section mapping integration needed?
- Admin editing interface priority?

---

### Area 4: Editor
**Original Questions:**

#### 4.1 UI: ✅ DONE
- Canva-style layout implemented
- Left navigation, center canvas, right drawer
- All components placed correctly

#### 4.2 Chapters/Templates:
**Questions:**
- "What is the order of Chapters?" ✅ DONE (defined in sections.ts)
- "Executive summary should be created automatically?" ✅ DONE (button exists)
- "How do we create financials, graphs, insert pictures, add descriptions to pictures?" ✅ DONE
- "How can we link the chapters to the templates?" ✅ DONE (via program-overrides.ts)
- **"What will the user actually have in front of him? Small questions per chapter?"** ⚠️ **UNCLEAR**
  - Current: Free-form writing with prompts as guidance
  - Question: Should it be step-by-step questions or free-form?
- **"how much must the user answer?"** ⚠️ **UNCLEAR**
  - Current: Word count min/max, compliance checks
  - Question: What's the minimum viable content per section?
- **"How we gonna assure that this will be a high quality document?"** ⚠️ **PARTIAL**
  - Current: Compliance checking, word count validation
  - Missing: Broader quality scoring, readability checks, completeness gates
- **"How should we include the preview?"** ✅ DONE (react-pdf in right drawer)
- **"How can we offer a free version and for what must the user pay?"** ⚠️ **PARTIAL**
  - Current: Feature flags exist
  - Missing: Clear pricing model, what's free vs premium

#### 4.3 Additional Documents:
**Questions:**
- "how can we create this in addition to our business plan?" ✅ DONE (AdditionalDocumentsEditor)
- "how is it linked?" ✅ DONE (auto-population from business plan)
- "where do we get the structure and format from?" ✅ DONE (program requirements + master templates)
- **"how do we make sure that not all of the additional sound the same?"** ❌ **MISSING**
  - Current: Auto-population exists but no variation strategy
  - Missing: Content variation algorithm, template diversity
- "How can we edit them like business plan?" ✅ DONE (same RichTextEditor)

#### 4.4 LLM Components:
**Questions:**
- "Should we integrate that to one component?" ✅ DONE (ComplianceAIHelper)
- "I need to cross check program requirements from LLM with Business Plan?" ✅ DONE (ReadinessValidator)
- "I need to give business expert advice per chapter" ✅ DONE (sectionPrompts.ts)

---

## 🎯 WHAT'S ACTUALLY MISSING (From Original Request)

### Critical Missing Items:

1. **User Experience Flow (4.2)**
   - ❌ **Step-by-step questions vs free-form:** Unclear which approach is better
   - ❌ **Minimum content requirements:** What's the minimum viable content per section?
   - ❌ **Quality assurance beyond compliance:** How to ensure high-quality documents?
   - ❌ **Completion gates:** When is a document "ready" for submission?

2. **Freemium Model Details (4.2)**
   - ⚠️ Feature flags exist but pricing model not defined
   - ❌ What exactly is free vs premium?
   - ❌ Pricing tiers and limits

3. **Content Variation Strategy (4.3)**
   - ❌ How to ensure additional documents don't sound the same?
   - ❌ Template diversity strategy
   - ❌ Content personalization

4. **Quality Scoring (4.2)**
   - ⚠️ Compliance checking exists
   - ❌ Broader quality metrics (readability, completeness, persuasiveness)
   - ❌ Quality gates before export

---

## 📝 YOUR TASK

**Provide direct Cursor instructions to:**

1. **Clarify and implement missing UX flows:**
   - Should chapters use step-by-step questions or free-form writing?
   - What's the minimum content per section?
   - How to ensure document quality?
   - What are the completion gates?

2. **Define freemium model:**
   - Clear free vs premium feature breakdown
   - Pricing tiers
   - Feature limits

3. **Implement content variation:**
   - Strategy to ensure additional documents are unique
   - Template diversity
   - Content personalization

4. **Enhance quality assurance:**
   - Broader quality scoring beyond compliance
   - Readability checks
   - Completeness gates

5. **Address strategic questions:**
   - Competitive positioning strategy
   - LLM/ML integration recommendations
   - Areas for improvement

**Format:** Provide specific file paths, code changes, and implementation steps that I can give directly to Cursor.

---

## 🔗 KEY FILES TO REVIEW

**Scraper:**
- `scraper-lite/src/scraper.ts`
- `scraper-lite/src/extract.ts`
- `scraper-lite/src/llm-extract.ts`
- `scraper-lite/src/db/page-repository.ts`

**Reco:**
- `features/reco/components/ProgramFinder.tsx`
- `features/reco/engine/enhancedRecoEngine.ts`
- `pages/api/programmes/search.ts`

**Editor Entry:**
- `shared/lib/templates/sections.ts`
- `shared/lib/templates/program-overrides.ts`
- `shared/lib/templateGenerator.ts`

**Editor:**
- `features/editor/components/UnifiedEditorLayout.tsx`
- `features/editor/components/ComplianceAIHelper.tsx`
- `features/editor/components/AdditionalDocumentsEditor.tsx`
- `shared/lib/readiness.ts`
- `shared/lib/featureFlags.ts`

---

**Please analyze the GitHub repository, review the current implementation, and provide specific Cursor instructions to address all gaps and strategic questions.**

