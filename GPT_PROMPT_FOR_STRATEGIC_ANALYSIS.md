# 🎯 Strategic Analysis & Implementation Prompt for GPT

## Context: Plan2Fund Platform

### What We Do
Plan2Fund is a specialized platform that helps entrepreneurs in Austria and the EU create funding-ready business plans and find matching funding programs. We provide:

1. **Funding Program Discovery** - Automated web scraper that discovers and extracts data from 32+ Austrian/EU funding institutions
2. **Smart Matching** - Recommendation system (Reco/SmartWizard) that matches users to funding programs based on their profile
3. **Business Plan Editor** - Guided editor that helps users create program-specific business plans
4. **AI Assistance** - LLM-powered content generation and compliance checking

### Target Group
- **Primary:** Solo entrepreneurs and startup founders in Austria/EU
- **Stages:** Idea-stage to ready-to-apply
- **Funding Types:** Grants, Bank Loans, Equity, Services, Visa programs
- **Languages:** English and German

### Core Products
1. **Strategy Plan** - Early-stage strategic documents (Business Model Canvas, Go-to-Market Strategy, Funding Fit Summary)
2. **Review Plan** - Review and improve existing business plans
3. **Submission Plan** - Full business plan + companion documents tailored to specific funding programs

### Additional Documents
- Pitch Decks
- Application Forms
- Financial Plans
- Project Descriptions
- Compliance Documents
- All extracted from funding program requirements via scraper-lite

### Funding Types Supported
- **Grants** (FFG, AWS, Horizon Europe, etc.)
- **Bank Loans** (Austrian banks, EU loans)
- **Equity** (VC, Angel investors)
- **Services** (AMS, IP services, consulting)
- **Visa Programs** (Red-White-Red Card, etc.)

---

## Architecture & File Linkages

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN2FUND PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. SCRAPER-LITE (Data Collection)                          │
│     └─> Discovers funding programs                           │
│     └─> Extracts 35 requirement categories                  │
│     └─> Stores in PostgreSQL/Neon database                  │
│                                                               │
│  2. RECO/SMARTWIZARD (Matching)                              │
│     └─> Uses scraper-lite data                              │
│     └─> Question engine matches users to programs           │
│     └─> EnhancedReco engine for scoring                      │
│                                                               │
│  3. EDITOR ENTRY (Template Selection)                        │
│     └─> Loads master templates (sections.ts)                │
│     └─> Merges program-specific overrides                   │
│     └─> Creates editor sections                             │
│                                                               │
│  4. EDITOR (Content Creation)                                │
│     └─> RestructuredEditor.tsx (main UI)                    │
│     └─> RequirementsChecker (compliance)                    │
│     └─> EnhancedAIChat (AI assistance)                     │
│     └─> DocumentCustomizationPanel (formatting)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key File Linkages

#### Data Flow
1. **Scraper-Lite → Database**
   - `scraper-lite/src/scraper.ts` → `scraper-lite/src/db/neon-client.ts`
   - Extracts: `pages` table (metadata) + `requirements` table (35 categories)
   - Stores: URL, title, description, funding amounts, deadlines, contact, categorized_requirements

2. **Database → Reco System**
   - `pages/api/programmes/[id]/requirements.ts` → Reads from database
   - `features/reco/engine/questionEngine.ts` → Uses requirements for matching
   - `features/reco/engine/enhancedRecoEngine.ts` → Scores programs

3. **Database → Editor**
   - `pages/api/programmes/[id]/requirements.ts` → Provides requirements
   - `features/editor/engine/categoryConverters.ts` → Converts to editor sections
   - `shared/lib/templates/sections.ts` → Master templates
   - `shared/lib/templates/program-overrides.ts` → Program-specific overrides

4. **Editor → Requirements Checker**
   - `features/editor/components/RequirementsChecker.tsx` → Fetches from `/api/programmes/[id]/requirements`
   - `shared/lib/readiness.ts` → Validates plan against requirements

5. **Editor → AI Assistant**
   - `features/editor/components/EnhancedAIChat.tsx` → Uses AI helper
   - `features/editor/engine/aiHelper.ts` → Calls `/api/ai/openai`
   - `pages/api/ai/openai.ts` → OpenAI integration

#### Component Interactions
- **UnifiedEditor.tsx** → Orchestrates all editor components
- **Phase4Integration.tsx** → Handles template loading and state
- **RestructuredEditor.tsx** → Main editing UI with sections
- **ProgramSelector.tsx** → Lets users select funding program
- **EntryPointsManager.tsx** → Manages entry points (wizard, direct, library)

---

## Strategic Questions (Answer First)

### 1. Competitive Positioning
**Question:** Based on current architecture, how am I going to compete against ChatGPT and other providers, also considering future advances? What makes me different? What is missing? Cursor is a good example - specialized in programming. Should this be my strategic direction?

**Context:**
- We're specialized in Austrian/EU funding programs (niche)
- We have structured data (35 categories) vs. generic LLM responses
- We provide end-to-end workflow (discovery → matching → creation → compliance)
- We have program-specific templates and requirements

**Consider:**
- What unique value do we provide that ChatGPT can't?
- How do we differentiate from generic business plan tools?
- Should we go deeper into specialization (like Cursor for programming)?
- What features would make us indispensable?

### 2. Machine Learning / LLM Strategy
**Question:** Should I create an LLM or use Machine Learning to learn patterns of programs or business plans to further improve? In what areas of the web application should I do that and how would I integrate that?

**Context:**
- Currently using pattern-based extraction (35.7% coverage, 42.9% missing categories)
- LLM extraction available but not fully integrated
- Question engine uses rule-based matching
- AI assistant uses GPT-4o-mini for content generation

**Consider:**
- Should we use LLM for extraction (replace pattern-based)?
- Should we train ML models on successful business plans?
- Should we use LLM for program matching (semantic search)?
- Should we use LLM for quality assessment?
- Where would ML/LLM provide the most value?

### 3. LLM Integration Strategy
**Question:** How am I going to integrate an LLM approach to cover the important areas the best way?

**Context:**
- LLM extraction code exists (`scraper-lite/src/llm-extract.ts`)
- OpenAI integration exists (`pages/api/ai/openai.ts`)
- AI helper exists (`features/editor/engine/aiHelper.ts`)
- Need to decide: full LLM, hybrid, or pattern-based

**Consider:**
- Where should LLM be used vs. pattern-based?
- How to balance cost vs. quality?
- How to ensure consistency?
- How to handle edge cases?

---

## Important Areas (Detailed Analysis)

### Area 1: Scraper-Lite

#### What It's Doing
- **URL Discovery:** Finds funding program pages from 32+ institutions
- **Metadata Extraction:** Title, description, funding amounts, deadlines, contact info
- **Requirements Extraction:** 35 categories (eligibility, financial, timeline, geographic, team, impact, etc.)
- **Storage:** PostgreSQL/Neon database (`pages` + `requirements` tables)

#### Current State
- Pattern-based extraction: 35.7% average coverage
- Missing 42.9% of categories (15/35)
- Only 2 categories have high coverage (financial, innovation_focus)
- LLM extraction code exists but not integrated

#### Questions
1. **How can we replace this 1:1 with an LLM?**
   - Should we use full LLM extraction (`extractWithLLM`)?
   - Should we use hybrid mode (`extractHybrid` - pattern + LLM)?
   - How to handle cost (currently $0, LLM would be ~$0.01/page)?
   - How to ensure consistency and quality?

2. **How should we store the data?**
   - Current: PostgreSQL with `pages` and `requirements` tables
   - Should we add LLM confidence scores?
   - Should we store extraction method (pattern vs. LLM)?
   - Should we cache LLM results?

3. **How can Areas 2, 3, and 4 use the data?**
   - Reco system: How to use LLM-extracted data for matching?
   - Editor entry: How to use requirements for templates?
   - Editor: How to use requirements for compliance checking?

#### Direct Cursor Instructions Needed
- [ ] Replace pattern-based extraction with LLM (or hybrid)
- [ ] Update database schema to store LLM metadata
- [ ] Create API endpoints for LLM extraction
- [ ] Integrate LLM extraction into scraper workflow
- [ ] Add caching for LLM results
- [ ] Update data flow to Areas 2, 3, 4

---

### Area 2: Reco/SmartWizard & Advanced Search

#### What It Does
- **SmartWizard:** Multi-step questionnaire that matches users to funding programs
- **Question Engine:** Generates questions based on program requirements
- **EnhancedReco Engine:** Scores programs based on user answers
- **Advanced Search:** Filter programs by criteria

#### Current State
- Uses scraper-lite data from database
- Rule-based matching (question engine)
- Scoring based on requirement overlap
- Uses `features/reco/engine/questionEngine.ts` and `enhancedRecoEngine.ts`

#### Questions
1. **Should we use both or should we integrate?**
   - Keep SmartWizard + Advanced Search separate?
   - Merge into one unified interface?
   - When to use which?

2. **How are we using the data from scraper-lite or the new LLM approach?**
   - Current: Reads from `/api/programmes/[id]/requirements`
   - Should we use LLM-extracted data directly?
   - Should we use semantic search (embeddings)?
   - Should we use LLM for matching (not just extraction)?

3. **Shall we use EnhancedReco and results?**
   - Current: EnhancedReco exists but usage unclear
   - Should we prioritize EnhancedReco over basic matching?
   - How to improve scoring accuracy?

4. **What about the scoring? How can we make this work?**
   - Current scoring: Based on requirement overlap
   - Should we use LLM for semantic matching?
   - Should we use ML models trained on successful matches?
   - How to weight different requirements?

#### Direct Cursor Instructions Needed
- [ ] Integrate LLM-extracted data into matching
- [ ] Improve scoring algorithm (LLM-based or ML-based)
- [ ] Unify SmartWizard and Advanced Search
- [ ] Add semantic search capabilities
- [ ] Improve question generation (LLM-based)
- [ ] Add confidence scores to matches

---

### Area 3: Editor Entry

#### What Templates We Are Using
- **Master Templates:** `shared/lib/templates/sections.ts`
  - Grants: 10 sections (Executive Summary, Project Description, Innovation, Impact, etc.)
  - Bank Loans: 8 sections
  - Equity: 11 sections
  - Visa: 8 sections

- **Program-Specific Overrides:** Database `categorized_requirements`
  - Merges with master templates
  - Priority: Program-specific → Master → Default

#### What We Base Them On
- Official sources: Horizon Europe, FFG, WKO, Sequoia Capital, etc.
- High-quality, source-verified templates
- Word count ranges based on typical program limits

#### Questions
1. **Should we parse the templates also with LLM approach?**
   - Current: Static templates in code
   - Should we generate templates from program requirements (LLM)?
   - Should we use LLM to adapt templates to specific programs?
   - Should we use LLM to create new templates?

2. **How to link templates to program requirements?**
   - Current: `categoryConverters.ts` converts requirements to sections
   - Should we use LLM to map requirements to template sections?
   - Should we use LLM to generate section prompts?

#### Direct Cursor Instructions Needed
- [ ] Use LLM to generate/adapt templates from requirements
- [ ] Improve template-program requirement mapping
- [ ] Use LLM to create section prompts
- [ ] Dynamic template generation based on program

---

### Area 4: Editor

#### Current UI Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Program Selector, Export, Save                    │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar:    │  Main Editor:                               │
│  - Sections  │  - Rich Text Editor                         │
│  - Progress  │  - Section Content                          │
│  - Status    │  - Prompts & Hints                          │
│              │                                              │
│  Right:      │                                              │
│  - Document  │                                              │
│    Custom.   │                                              │
│  - Req.      │                                              │
│    Checker   │                                              │
│  - AI Chat   │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

#### Components
- **RestructuredEditor.tsx:** Main editor UI
- **DocumentCustomizationPanel.tsx:** Formatting options
- **RequirementsChecker.tsx:** Compliance checking
- **EnhancedAIChat.tsx:** AI assistant
- **RichTextEditor.tsx:** Content editing
- **Phase4Integration.tsx:** Template loading

#### Questions

##### 4.1. UI: How to Place Components
**Question:** How to place (Chapter navigation, DocumentCustomizationPanel, RequirementsChecker, AI Assistant, Chapters of business plans)? I like the interface/navigation of Canva.

**Consider:**
- Canva-style: Left sidebar (chapters), center (canvas), right (tools)
- Current: Left (sections), center (editor), right (panels)
- How to simplify and improve UX?
- How to make it more intuitive?

##### 4.2. Chapter/Templates of Business Plans
**Questions:**
1. **How should we present chapters and integrate template in the main editor?**
   - Current: Sections listed in sidebar
   - Should we use a visual chapter view?
   - How to show template structure?

2. **What is the order of Chapters?**
   - Executive Summary should be created automatically (from other sections)
   - What's the logical flow?
   - Should order be customizable?

3. **How do we create financials, graphs, insert pictures, add descriptions to pictures?**
   - Current: Text-only editor
   - Need: Financial tables, charts, images
   - How to integrate these features?

4. **How can we link the chapters to the templates?**
   - Current: Sections mapped to templates
   - Should we show template structure in UI?
   - How to guide users through template requirements?

5. **What will the user actually have in front of him?**
   - Small questions per chapter?
   - How much must the user answer?
   - How to ensure high-quality document?

6. **How should we include the preview?**
   - Current: Export to PDF/DOCX
   - Should we have live preview?
   - How to show formatted output?

7. **How can we offer a free version and for what must the user pay?**
   - Free: Basic editor, limited sections?
   - Paid: Full editor, AI assistance, export?
   - What's the freemium model?

##### 4.3. Additional Documents
**Questions:**
1. **How can we create this in addition to our business plan?**
   - Pitch Deck, Application Form, etc.
   - Should they be separate documents?
   - How to link them to business plan?

2. **How is it linked?**
   - Should additional documents reference business plan sections?
   - Should they share data (financials, team, etc.)?

3. **Where do we get the structure and format from?**
   - Scraper-lite extracts document requirements
   - Should we use LLM to generate document structures?
   - Should we use templates?

4. **How do we make sure that not all of the additional sound the same?**
   - Need variety in generated content
   - Should we use LLM with different prompts?
   - Should we use templates with variations?

5. **How can we edit them like business plan?**
   - Should they use the same editor?
   - Should they have their own editor?
   - How to switch between documents?

##### 4.4. LLM-Based Components, Requirements Checker, and AI Assistant
**Questions:**
1. **Should we integrate that to one component?**
   - Current: Separate components (RequirementsChecker, EnhancedAIChat)
   - Should we merge into one "AI Assistant"?
   - How to organize features?

2. **I need to cross-check program requirements from LLM with Business Plan. How to do that the best way?**
   - Current: RequirementsChecker validates plan
   - Should we use LLM for semantic comparison?
   - How to show gaps and suggestions?

3. **I need to give business expert advice per chapter (e.g., financial advice (depreciation type influences your final yearly result?), assist in market research, assist in defining target group, etc.)**
   - Current: AI assistant provides general help
   - Need: Chapter-specific expert advice
   - How to structure this?
   - Should we use LLM with specialized prompts?

#### Direct Cursor Instructions Needed
- [ ] Redesign UI (Canva-style navigation)
- [ ] Create chapter navigation component
- [ ] Integrate financial tables and charts
- [ ] Add image insertion and description
- [ ] Create executive summary auto-generation
- [ ] Implement live preview
- [ ] Create additional documents editor
- [ ] Link additional documents to business plan
- [ ] Merge RequirementsChecker and AI Assistant
- [ ] Add chapter-specific expert advice
- [ ] Implement freemium model
- [ ] Improve template integration in UI

---

## Request: Direct Cursor Instructions

After analyzing all areas, provide **direct Cursor instructions** that:

1. **Address all issues** mentioned above
2. **Prioritize** by impact and feasibility
3. **Provide specific code changes** (file paths, functions, components)
4. **Include implementation steps** (what to do first, second, etc.)
5. **Consider dependencies** (what needs to be done before other things)
6. **Provide code examples** where helpful
7. **Include testing recommendations**

### Format for Cursor Instructions

For each issue/improvement, provide:

```markdown
## Issue: [Title]

**Priority:** High/Medium/Low
**Dependencies:** [What needs to be done first]
**Estimated Time:** [Hours/Days]

### Current State
[What exists now]

### Desired State
[What we want]

### Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Code Changes
- File: `path/to/file.ts`
  - Function: `functionName()`
  - Change: [What to change]
  - Code:
    ```typescript
    // New code here
    ```

### Testing
[How to test the changes]
```

---

## Additional Context

### Technology Stack
- **Frontend:** Next.js 14 (pages-router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, PostgreSQL/Neon
- **AI:** OpenAI GPT-4o-mini (via `openai` package)
- **Scraping:** Cheerio, fetch (no Puppeteer)
- **Database:** PostgreSQL/Neon (via `pg` package)

### Key Files to Review
- `scraper-lite/src/scraper.ts` - Main scraper
- `scraper-lite/src/extract.ts` - Pattern-based extraction
- `scraper-lite/src/llm-extract.ts` - LLM extraction (new)
- `features/reco/engine/questionEngine.ts` - Question generation
- `features/reco/engine/enhancedRecoEngine.ts` - Scoring
- `features/editor/components/RestructuredEditor.tsx` - Main editor
- `features/editor/components/RequirementsChecker.tsx` - Compliance
- `features/editor/components/EnhancedAIChat.tsx` - AI assistant
- `shared/lib/templates/sections.ts` - Master templates
- `pages/api/programmes/[id]/requirements.ts` - API endpoint

### Current Limitations
- Pattern-based extraction: 35.7% coverage, 42.9% missing categories
- Editor: Text-only, no financial tables/charts, no images
- Matching: Rule-based, no semantic search
- Templates: Static, not dynamically generated
- Additional documents: Not fully implemented

---

## Final Request

Please analyze this codebase (you have GitHub access) and provide:

1. **Strategic answers** to the 3 strategic questions
2. **Detailed analysis** of all 4 areas
3. **Direct Cursor instructions** for implementing improvements
4. **Prioritized roadmap** (what to do first, second, etc.)
5. **Architecture recommendations** (how to structure new features)
6. **Code examples** where helpful

Focus on making this platform **indispensable** for Austrian/EU entrepreneurs seeking funding, with a **specialized, Cursor-like approach** that generic tools can't match.

---

**Thank you for your analysis!** 🚀

