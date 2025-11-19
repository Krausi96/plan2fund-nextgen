# Chat Prompt: Plan2Fund Reco & Editor Optimization

## 1. Who We Are & What We're Doing

**Plan2Fund** is an AI-powered funding operating system for Austrian/EU advisors, incubators, and founders. We help users create funding-ready business plans and match them to relevant funding programs across Austria and the EU.

**Our Market Position:**
- **Primary Target Groups (B2B/B2B2C):**
  1. **Business Advisors & Förderberater** - Consultants who write dozens of business plans per year for clients (e.g., Minted, Fördermanager.at, regional innovation agencies). They need efficiency (cut time by 30-60%), multi-client workspace, program discovery, and use Plan2Fund as a productivity engine, not replacement.
  2. **Universities & Incubators** - Programs that coach cohorts of startups (e.g., tech2b, accent, INiTS, FH programs). They need standardized teaching, mentor view (see all participants, comment, track readiness), and cohort management.
  3. **Secondary (B2C):** Solo founders and SMEs seeking funding. Price-sensitive, may use solo or with expert review, need clear guidance.

**Our Products:**
- **Strategy** (5 sections): Executive Summary, Market, Business Model, Competitive Analysis, Financials
- **Review** (10+ sections): Adds Project Description, Innovation, Impact, Team, etc.
- **Submission** (10+ sections): Full grant-ready application with all required sections

**Our Differentiation:**
- **Funding-first logic**: We start with location + company type + stage + co-financing + amount + industry + use of funds → matches to funding programs, not generic business plans
- **Cross-institution coverage**: AWS + FFG + Wirtschaftsagentur + AMS + WKO + EU calls + banks in one system
- **Deep template logic**: Program-specific business plan structures (grants vs loans vs equity vs visa)
- **Requirements checker**: Rules engine validating formalities (TRLs, company age, size, location, co-financing) and content gaps
- **Virtual expert**: LLM that explains program fit, suggests plan tweaks, acts like a funding-savvy Unternehmensberater at scale
- **End-to-end workflow**: Questionnaire → Program shortlist → Program-specific template → AI drafting → Financials → Requirements check → Document exports

**Market Context:**
- 36,000+ new enterprises founded in Austria in 2022; 21,128 in first half of 2025
- 579-588k SMEs making up ~99.7-99.8% of all companies
- 3,700+ startups since 2013, 2,600+ active at any time
- Institutionalized business plan culture (i2b initiative 20+ years, hundreds of expert feedbacks per year)
- WKO, Austrian Business Agency, Vienna Business Agency, AWS, FFG all require structured business plans

---

## 2. System Descriptions

### 2.1 Reco (Recommendation System)

**What Q&A users see:**
- A static Q&A wizard (`ProgramFinder` component) with 12+ predefined questions in fixed order:
  - **Core questions** (required for results): `company_type`, `location`, `co_financing`, `company_stage`, `funding_amount`
  - **Optional questions**: `industry_focus`, `use_of_funds`
  - **Advanced questions**: `team_size`, `revenue_status`, `impact_focus`, `deadline_urgency`, `project_duration`
- Questions shown sequentially with progress bar (numbered bubbles)
- Users must answer minimum 4 critical questions before results appear
- All questions visible by default (no progressive disclosure)
- Questions are hardcoded in `ProgramFinder.tsx` - we pre-determine what information to collect

**What the results display:**
- Programs scored using `enhancedRecoEngine.ts` with weighted matching:
  - Location (35%), Company Type (20%), Funding Amount (20%), Industry (10%), Team Size (5%), Revenue Status (3%), Impact Focus (4%), Deadline Urgency (3%)
- Each program shows: Score (0-100), Eligibility status, Confidence level (High/Medium/Low), Matched criteria with reasons, Gaps (what doesn't match), Funding amount range, region, program type
- Results also use LLM-based generation (`generateProgramsWithLLM`) to create program recommendations from user answers

**What happens after selecting a program:**
- User clicks a program card → navigates to `/editor?programId=X&product=Y&route=Z`
- Editor loads program-specific section templates
- User can start writing their business plan

**Current Problem:**
- Q&As come from our side (static questions defined in `ProgramFinder.tsx`)
- This creates bias - we're pre-determining what information to collect
- Questions may not adapt to user context or program requirements
- May miss important signals that could improve matching

---

### 2.2 Editor (Business Plan Editor)

**How components act and interact:**

**Architecture:**
- Unified three-column layout powered by Zustand store (`useEditorStore`):
  1. **Sidebar**: Product/funding selectors, ordered section list with inline progress indicators
  2. **SectionWorkspace**: Question cards with `SimpleTextEditor`, inline AI suggestion chips, "Ask AI" trigger
  3. **RightPanel**: Tabbed views (`ai`, `data`, `preview`/`requirements`)

**Component Flow:**
- **Editor.tsx** (main container):
  - Checks for `programId` in URL → if missing, shows `ProgramSelector`
  - If `programId` exists → calls `getSections(fundingType, product, programId)` to load templates
  - Converts `SectionTemplate[]` to `BusinessPlan` model (sections with questions)
  - Manages state: `plan`, `activeSectionId`, `activeQuestionId`, `rightPanelView`
  - Auto-saves to localStorage via `persistPlan()`

- **SectionWorkspace**:
  - Shows one section at a time
  - Each section has multiple `Question` objects (from template)
  - Questions have: `prompt`, `answer` (rich text), `status` (blank/draft/complete/unknown), `requiredAssets` (table/chart/kpi)
  - User types in `SimpleTextEditor` → `updateAnswer()` → auto-saves
  - "Ask AI" button → `requestAISuggestions()` → calls `aiHelper.generateSectionContent()` → updates question with suggestions

- **RightPanel**:
  - **AI tab**: Shows current question, answer preview, AI suggestions, conversation history, quick actions (outline, improve, suggest data/KPIs)
  - **Data tab**: `DataPanel` for managing datasets, KPIs, media assets; can attach to questions
  - **Preview tab**: `PreviewPane` shows read-only document preview; Requirements validation shows per-section progress, per-question validation (word count, keywords, attachments)

**Template Approach:**
- Templates loaded from `shared/lib/templates/sections.ts` (master) + program-specific overrides from API
- Each template defines: section structure, question prompts, word count requirements, required assets (tables/KPIs/media), validation rules
- Program-specific templates adapt section order, word counts, and angles for different funding types (grants vs loans vs equity vs visa)
- Templates support three product tiers: Strategy (5 sections), Review (10+ sections), Submission (10+ sections with full grant requirements)

**Key Interactions:**
- User selects section → `setActiveSection()` → updates `activeSectionId`
- User selects question → `setActiveQuestion()` → updates `activeQuestionId`
- User types answer → `updateAnswer(questionId, content)` → updates question, recalculates section progress
- User clicks "Ask AI" → `requestAISuggestions(sectionId, questionId)` → AI generates content using section template prompts, current answer, linked datasets/KPIs/media, program requirements, user answers from reco wizard
- User adds dataset/KPI/media → `addDataset/Kpi/Media()` → stored in section, can attach to questions
- User runs requirements check → `runRequirementsCheck()` → validates all sections against templates, shows progress summary


## 3. Questions

### Question 1: How can we simplify reco? Problem: we have Q&As that come from our side. Can we simplify that to reduce bias? What engine would you recommend? Maybe Q&A is not the best.

**Current State:**
- Static Q&A form with 12+ predefined questions hardcoded in `ProgramFinder.tsx`
- Matching uses rule-based scoring (`enhancedRecoEngine.ts`) with fixed weights + LLM-based generation
- Minimum 4 questions required before showing results
- All questions visible by default, no adaptive flow

**Concerns:**
- Bias: We're pre-determining what information matters
- May miss important signals (e.g., specific program requirements, user context)
- Questions may not adapt to user journey (e.g., if user already knows they want AWS Seedfinancing, why ask 12 questions?)
- Could be overwhelming for advisors who already know what they need
- Advisors may want to skip Q&A entirely and go straight to editor with a program

**Considerations:**
- Founders may benefit from guided discovery, but questions could be more adaptive
- Programs have different requirements - maybe questions should be program-aware
- Could we use LLM to extract user intent from free text instead of structured Q&A?
- Could we learn from user behavior (which programs they select, which they ignore) to improve questions?

**What we need:**
- Recommendations for alternative approaches (conversational, program-aware, adaptive, etc.)
- Engine recommendations (LLM-based extraction, hybrid rule+ML, etc.)
- How to reduce bias while maintaining matching quality
- How to serve different user types (advisors vs founders) with different flows

---

### Question 2: Shall we simplify the template section and just use existing approach? What master file should we use? Existing approach seems unstable.

**Current Template Approach:**
- Templates loaded from `shared/lib/templates/sections.ts` (master) + program-specific overrides from API
- Each template defines: section structure, question prompts, word count requirements, required assets, validation rules
- Program-specific templates adapt section order, word counts, and angles for different funding types
- Templates support three product tiers: Strategy, Review, Submission

**Concerns:**
- Template system may be overly complex
- Program-specific overrides may create maintenance burden
- Existing approach may be unstable or hard to maintain

**What we need:**
- Assessment of current template approach stability
- Recommendations for simplification while maintaining flexibility
- Whether to keep program-specific customization or standardize

---

### Question 3: How can we build editor to serve our target groups? Check all components especially sections, templates, requirements checker and AI assistant and give your verdict. Should we build this simpler?

**Target Groups:**
1. **Advisors/Förderberater** (B2B): Write 10-50+ plans/year, need efficiency (30-60% time savings), multi-client workspace, program discovery. Use Plan2Fund as productivity engine.
2. **Incubators/Universities** (B2B2C): Manage cohorts (10-50+ teams), need standardized teaching, mentor view, cohort management.
3. **Founders/SMEs** (B2C): One active project, price-sensitive, may use solo or with expert review.

**Current Editor Components:**

**Sections:**
- One section displayed at a time in `SectionWorkspace` component
- Each section contains multiple `Question` objects loaded from templates
- Questions have: `prompt` (text guidance), `answer` (rich text HTML), `status` (blank/draft/complete/unknown), `requiredAssets` (array of table/chart/kpi requirements)
- Status tracking: `blank` (no content), `draft` (minimal content entered), `complete` (substantive answer), `unknown` (explicitly marked as not applicable with optional note)
- Section progress calculated from completed questions only (excludes blank/unknown)
- User navigates sections via sidebar with inline progress indicators showing completion percentage
- Questions displayed as cards with `SimpleTextEditor` for rich text input, auto-saves to localStorage on every change
- Inline AI suggestion chips appear below questions when suggestions are available

**Templates:**
- Master templates loaded from `shared/lib/templates/sections.ts` (static file)
- Program-specific overrides fetched from API when `programId` is provided
- Template structure: `SectionTemplate` defines `id`, `title`, `description`, `prompts[]` (array of question prompts), `wordCountMin/Max`, `requiredAssets[]`, `validationRules` (required fields, keywords)
- Three product tiers: Strategy (5 sections), Review (10+ sections), Submission (10+ sections with full grant requirements)
- Program-specific templates adapt: section order (grants emphasize innovation/impact, loans emphasize financials), word count ranges (grants 500-800 words, loans 300-500 words), question angles (visa applications focus on relocation, equity focuses on growth/traction)
- Template loading: `getSections(fundingType, product, programId)` merges master + program overrides, converts to `BusinessPlan` model with sections/questions structure
- Templates support funding type variations: grants, bankLoans, equity, visa - each has different section emphasis

**Requirements Checker:**
- Validation runs via `runRequirementsCheck()` function, triggered manually or on export
- Per-question validation via `validateQuestionRequirements()`:
  - **Status validation**: Required questions must be `complete` or explicitly `unknown` (error if blank)
  - **Word count validation**: Checks against template `wordCountMin/Max` with ±10% tolerance (warning if outside range)
  - **Required fields validation**: Checks for presence of template `validationRules.requiredFields` keywords in answer text (warning if missing)
  - **Required assets validation**: Ensures `requiredAssets` (tables/KPIs/media) are attached before marking complete (error if missing)
- Progress summary: `calculateSectionProgress()` computes completion percentage per section, aggregates to plan-level progress
- Results displayed in Preview tab's Requirements view: per-section progress bars, per-question validation with error/warning indicators, blocking issues highlighted
- Validation results passed to AI assistant context as `requirementHints` so AI can explain how to fix issues

**AI Assistant:**
- Per-question AI suggestions via `requestAISuggestions(sectionId, questionId, options)` 
- Context-aware generation: AI receives question `prompt`, current `answer`, question `status`, `attachmentSummary` (linked datasets/KPIs/media), `requirementHints` (validation issues), `conversationHistory` (per-question chat history)
- Guidance modes: `blank/unknown` status → guidance mode (suggests structure, examples), `draft/complete` status → critique mode (improves, refines existing content)
- Conversation history: Stored per question key `${sectionId}::${questionId}` in localStorage, maintains context across multiple AI interactions
- Quick actions: `outline` intent (generates structure), `improve` intent (refines existing text), `data` intent (suggests KPIs/datasets to create)
- AI response structure: Returns `content` (generated text), `suggestions[]` (actionable tips), `citations[]` (references), can also suggest KPIs to create
- Integration: AI suggestions appear as chips below questions, can be inserted into editor, conversation history shown in RightPanel AI tab with ability to copy/insert past responses
- Context building: `buildAiQuestionContext()` assembles full context including section description, program requirements, linked attachments, validation issues, user answers from reco wizard

**What we need:**
- Component-by-component analysis (sections, templates, requirements checker, AI assistant)
- Recommendations for serving each target group
- How to simplify approach.
- Priority recommendations for B2B/B2B2C-first strategy

---

## Your Task

Based on the descriptions above, provide:

1. **Smart, minimal changes** to make current systems work better for our target groups:
   - **Reco system**: What specific changes to Q&A flow, question structure, or matching engine would improve experience for advisors (who may skip Q&A) vs founders (who need guidance)? Should we add a "skip to program search" option? Should questions be adaptive based on user type?
   - **Editor system**: What minimal additions to current components (sections, templates, requirements checker, AI assistant) would serve advisors/incubators without major rebuild? For example: Can we add basic multi-plan switching via localStorage keys? Can requirements checker be enhanced to show advisor-friendly summaries? Can AI assistant be configured for advisor vs founder personas?
   - **Template system**: What specific simplifications would reduce maintenance while keeping program-specific flexibility? Should we consolidate master templates, reduce override complexity, or standardize validation rules?
   - **Workflow improvements**: What small UX changes (navigation, shortcuts, bulk actions) would cut advisor time by 30-60%? What would help incubators track cohort progress without full collaboration features?

2. **Answers to Question 1**: How to simplify reco and reduce bias (alternative approaches, engine recommendations)

3. **Answers to Question 2**: Assessment of template approach and simplification recommendations

4. **Answers to Question 3**: Component-by-component analysis and recommendations for building editor to serve target groups

Focus on actionable, minimal changes that align with our B2B/B2B2C-first strategy. Prioritize changes that can be implemented without major architectural changes.

