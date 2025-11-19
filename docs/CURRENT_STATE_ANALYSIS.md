# Plan2Fund Current State Analysis & Improvement Recommendations

## Executive Summary

This document analyzes the current state of Plan2Fund's Recommender and Editor systems against the optimization recommendations provided. The analysis is divided into two main sections: **Recommender** and **Editor**.

---

## PART 1: RECOMMENDER SYSTEM

### Current State

#### ✅ What's Working Well
1. **Static Question-Based Wizard**: The `ProgramFinder` component has a well-structured question flow with:
   - Core questions (7): company_type, location, co_financing, company_stage, funding_amount, industry_focus, use_of_funds
   - Advanced questions (5): team_size, revenue_status, impact_focus, deadline_urgency, project_duration
   - Progressive disclosure with advanced filters toggle
   - Minimum 4 critical questions required before showing results

2. **Enhanced Scoring Engine**: The `enhancedRecoEngine.ts` implements:
   - Weighted scoring system (location: 35%, companyType: 20%, funding: 20%, industry: 10%, advanced questions: 15%)
   - Eligibility matching for location, company type, funding amount
   - Industry matching with subcategories
   - Advanced question matching (team size, revenue, impact, deadline)

3. **LLM-Powered Program Generation**: The `/api/programs/recommend.ts` endpoint:
   - Uses OpenAI to generate programs when database doesn't have matches
   - Includes program knowledge base (Austria, Germany, EU programs)
   - Returns structured JSON with metadata

4. **Persona Selection**: Login form includes persona selection (founder, advisor, incubator, SME) that's stored in user profile

#### ❌ What's Missing (Compared to Recommendations)

1. **Persona-Based Paths**: 
   - ❌ No persona-based routing in ProgramFinder
   - ❌ All users see the same wizard flow
   - ❌ No abbreviated form for advisors/incubators
   - ❌ No direct program search for power users

2. **LLM-Powered Open-Ended Intake**:
   - ❌ No free-text input box or chat interface
   - ❌ No conversational recommender that extracts attributes from natural language
   - ❌ No follow-up questions from LLM when critical info is missing

3. **Direct Selection Path**:
   - ❌ No "skip wizard" option for experts
   - ❌ No search bar with filters (location, funding type, amount) in ProgramFinder
   - ❌ Users must always go through the wizard

4. **Data-Driven Ranking**:
   - ❌ No feedback loop tracking which programs users ultimately choose
   - ❌ No semantic matching using embeddings
   - ❌ No learning from user behavior to adjust weights

5. **Rule-Based Eligibility Engine**:
   - ❌ No formal rule engine like Grants4Companies
   - ❌ Basic matching logic but not legally robust eligibility checks

---

### RECOMMENDER IMPROVEMENTS

#### Priority 1: Persona-Based Paths
**Current Gap**: All users see the same wizard, regardless of expertise level.

**Recommendation**:
1. **On Wizard Start**: Detect persona from user profile (founder/advisor/incubator)
2. **Founder Path**: Keep current guided wizard with progressive disclosure
3. **Advisor/Incubator Path**: 
   - Show abbreviated form (only critical questions: location, company_type, funding_amount)
   - Add "Advanced Search" button that opens filters (location, funding_type, amount range, industry)
   - Allow skipping directly to program search

**Implementation**:
- Modify `ProgramFinder.tsx` to check user persona
- Create `AbbreviatedForm` component for advisors
- Create `ProgramSearch` component with filters
- Add routing logic based on persona

#### Priority 2: LLM-Powered Open-Ended Intake
**Current Gap**: No way for users to describe their project in natural language.

**Recommendation**:
1. **Add Chat Interface Tab**: Next to "Guided Questions" tab, add "Describe Your Project" tab
2. **LLM Extraction**: Use OpenAI to extract:
   - Sector/industry
   - Location
   - Company stage
   - Funding need
   - Co-financing capability
3. **Conversational Flow**: If critical info missing, LLM asks follow-up questions
4. **Hybrid Approach**: Use extracted attributes to populate wizard answers, then run matching

**Implementation**:
- Create `OpenEndedIntake.tsx` component with chat interface
- Add API endpoint `/api/reco/extract-attributes` that uses OpenAI
- Integrate extracted attributes into existing matching engine
- Show extracted answers in wizard for user confirmation

#### Priority 3: Direct Selection Path
**Current Gap**: Experts who know the program must still go through wizard.

**Recommendation**:
1. **"Skip to Search" Button**: Add prominent button at wizard start
2. **Program Search Component**: 
   - Search bar (program name, organization)
   - Filters: location, funding_type, amount_min, amount_max, industry
   - Results list with eligibility badges
3. **Direct Program Selection**: Allow selecting program from search → launch editor

**Implementation**:
- Create `ProgramSearch.tsx` component
- Add search API endpoint `/api/programs/search`
- Add filters UI (location dropdown, funding type checkboxes, amount sliders)
- Integrate with existing `onProgramSelect` callback

#### Priority 4: Data-Driven Ranking
**Current Gap**: No learning from user behavior.

**Recommendation**:
1. **Track User Choices**: When user selects a program, log:
   - User answers
   - Program selected
   - Programs shown (ranking)
2. **Feedback Loop**: Use this data to:
   - Adjust scoring weights (e.g., if users consistently choose programs with high industry match, increase industry weight)
   - Improve LLM prompts
   - Identify patterns (e.g., "users who answer X usually prefer Y")
3. **Semantic Matching**: 
   - Embed program descriptions and user free-text into vectors
   - Use cosine similarity for theme matching (e.g., climate tech, AI)

**Implementation**:
- Add analytics tracking to `onProgramSelect` callback
- Create database table `user_program_selections`
- Build feedback analysis script to adjust weights
- Integrate embedding API (OpenAI embeddings or similar)

#### Priority 5: Rule-Based Eligibility Engine
**Current Gap**: Matching logic is basic, not legally robust.

**Recommendation**:
1. **Formalize Eligibility Rules**: Create structured eligibility rules per program:
   ```typescript
   {
     location: { type: 'must_match', values: ['austria', 'eu'] },
     company_type: { type: 'must_match', values: ['startup', 'sme'] },
     co_financing: { type: 'required', percentage: 30 },
     // ...
   }
   ```
2. **Rule Engine**: Evaluate rules against user answers
3. **Legal Compliance**: Ensure rules match official program documentation

**Implementation**:
- Create `eligibilityEngine.ts` with rule evaluation logic
- Store eligibility rules in program metadata
- Add "Eligibility Check" badge to program cards
- Show clear reasons for ineligibility

---

## PART 2: EDITOR SYSTEM

### Current State

#### ✅ What's Working Well
1. **Unified Template System**: `features/editor/templates.ts` provides:
   - Master templates per product tier (strategy, review, submission)
   - Section templates with validation rules
   - Document templates (pitch decks, financial models, etc.)
   - Template knowledge base with best practices

2. **Section-Based Editor**: `Editor.tsx` implements:
   - Sidebar navigation with sections
   - Single-section editing view
   - Progress tracking per section
   - AI assistant integration

3. **Requirements Checker**: Basic validation exists:
   - Word count checking (min/max)
   - Required fields checking
   - Format requirements (tables, charts)
   - Progress summary showing completion percentage

4. **AI Assistant**: `aiHelper.ts` provides:
   - Context-aware suggestions using section content
   - Program requirements integration
   - Template knowledge integration
   - Conversation history

5. **Data Integration**: Supports datasets, KPIs, and media assets per section

#### ❌ What's Missing (Compared to Recommendations)

1. **Template Configuration**:
   - ⚠️ Templates are hardcoded in `templates.ts`, not stored as data
   - ⚠️ Program-specific overrides exist but are complex
   - ⚠️ No runtime configuration from database/API

2. **Requirements Checker**:
   - ❌ Only checks word counts and required fields
   - ❌ No evaluation against program criteria (excellence, impact, implementation)
   - ❌ No content heuristics (quantitative data, customer identification, value proposition)
   - ❌ No NLP-based topic detection
   - ❌ No actionable summaries with links to sections

3. **AI Assistant Data Sources**:
   - ⚠️ Uses user content and program requirements
   - ❌ No external knowledge base integration
   - ❌ No feedback loop (thumbs up/down) to refine prompts
   - ❌ No persona-specific prompts (founder vs advisor)

4. **Additional Documents**:
   - ✅ Pitch deck template exists
   - ✅ Financial model template exists
   - ❌ No auto-population from business plan data
   - ❌ No export to PPTX/XLSX
   - ❌ No application form pre-filling

5. **Adaptive UI**:
   - ⚠️ Single-section view exists
   - ❌ No "all sections" view for power users
   - ❌ No keyboard shortcuts (Ctrl+↑/↓)
   - ❌ No collapsible outline

6. **Project Management**:
   - ❌ No multi-plan management
   - ❌ No project switcher
   - ❌ No plan duplication

7. **Collaboration**:
   - ❌ No read-only share links
   - ❌ No PDF export with professional formatting
   - ❌ No commenting system

---

### EDITOR IMPROVEMENTS

#### Priority 1: Robust Requirements Checker
**Current Gap**: Only checks word counts, not substantive criteria.

**Recommendation**:
1. **Link to Program Criteria**: For each program, map evaluation criteria to sections:
   - **Excellence**: Innovation section → check for novelty explanation
   - **Impact**: Market section → check for market size, user pain points, societal impact
   - **Implementation**: Team section → check for competence, work plan, risk management

2. **Content Heuristics**:
   - Detect quantitative market data (numbers, percentages)
   - Identify customer segments (mentions of "target customers", "user personas")
   - Check for value proposition clarity (mentions of "unique", "different", "advantage")
   - Verify revenue model explanation (mentions of "pricing", "revenue stream", "monetization")

3. **NLP-Based Topic Detection**: Use OpenAI to classify whether required topics are mentioned:
   ```typescript
   // Example: Check if innovation section mentions "novelty"
   const topics = await checkTopics(content, ['novelty', 'innovation', 'technology']);
   ```

4. **Actionable Summaries**: Show report with:
   - Missing areas (with links to sections)
   - Weak areas (with suggestions)
   - Severity levels (critical, important, nice-to-have)
   - Allow advisors to dismiss checks

**Implementation**:
- Create `requirementsChecker.ts` with heuristic functions
- Add NLP topic detection API endpoint
- Enhance `RequirementsModal.tsx` to show actionable summaries
- Store program criteria mappings in database

#### Priority 2: Template Configuration System
**Current Gap**: Templates are hardcoded, making program-specific customization difficult.

**Recommendation**:
1. **Program Configuration Files**: Store program-specific tweaks as data:
   ```json
   {
     "programId": "ffg_basis",
     "requiredSections": ["executive_summary", "project_description", "financials"],
     "optionalSections": ["consortium"],
     "wordCountOverrides": {
       "executive_summary": { "min": 300, "max": 500 }
     },
     "additionalQuestions": [
       { "sectionId": "project_description", "text": "Explain co-financing plan" }
     ]
   }
   ```

2. **Runtime Application**: Load master template + program config → merge at runtime

3. **Reduce Granularity**: Group programs by funding agency:
   - FFG grants → one template variant
   - Bank loans → one template variant
   - Edge cases handled via config

**Implementation**:
- Create `programConfigs` table in database
- Modify `getSections()` to merge master template with program config
- Create admin UI to edit program configs
- Add conditional logic in templates (e.g., `if (coFinancingRequired) show coFinancingQuestion`)

#### Priority 3: Enhanced AI Assistant
**Current Gap**: AI doesn't adapt to persona or learn from feedback.

**Recommendation**:
1. **Persona-Specific Prompts**:
   - **Founder**: Educational, explanatory ("Here's what an impact section should include...")
   - **Advisor**: Concise, professional ("Add market size quantification here...")

2. **External Knowledge Base**: Integrate business/funding literature:
   - Fine-tune on successful proposals
   - Include EU funding guidelines
   - Add competitor analysis (LivePlan features)

3. **Feedback Loop**: 
   - Add thumbs up/down to AI suggestions
   - Track which suggestions users accept/reject
   - Adjust prompts based on feedback

4. **Multiple AI Modes**:
   - **Explain**: Educational guidance
   - **Draft**: Generate first version
   - **Polish**: Improve existing content

**Implementation**:
- Modify `aiHelper.ts` to accept persona parameter
- Create prompt templates per persona
- Add feedback API endpoint
- Create feedback analysis script
- Add AI mode selector in UI

#### Priority 4: Additional Documents Generation
**Current Gap**: Templates exist but no auto-population from business plan.

**Recommendation**:
1. **Pitch Deck Auto-Population**:
   - Extract data from business plan sections
   - Populate 10-slide structure (Title, Problem, Solution, Market, Business Model, Traction, Marketing, Competition, Team, Financials/Ask)
   - Allow editing and polishing

2. **Financial Model Generation**:
   - Extract numbers from Financials section
   - Generate spreadsheet template (sales forecast, P&L, cash flow, balance sheet)
   - Support import of user's own projections

3. **Application Form Pre-Filling**:
   - Extract company data, team, project summary, budget from business plan
   - Pre-fill program application forms
   - Allow advisor review before submission

4. **Export Functionality**:
   - Export pitch deck as PPTX
   - Export financial model as XLSX
   - Export business plan as PDF (with cover page, ToC)

**Implementation**:
- Create `documentGenerator.ts` with extraction logic
- Integrate with export system (`pages/export.tsx`)
- Add PPTX/XLSX export libraries (e.g., `pptxgenjs`, `exceljs`)
- Create form pre-filling API endpoint

#### Priority 5: Adaptive UI & Project Management
**Current Gap**: No multi-plan management or power user features.

**Recommendation**:
1. **All Sections View**: 
   - Toggle between single-section and all-sections view
   - Scrollable list of all sections with quick edit

2. **Keyboard Shortcuts**:
   - Ctrl+↑/↓ to navigate sections
   - Ctrl+S to save
   - Ctrl+/ to search

3. **Project Switcher**:
   - Sidebar shows list of plans
   - Create, open, duplicate plans
   - Store plans in database (when accounts integrated)

4. **Collaboration**:
   - Generate read-only share link
   - PDF export with professional formatting
   - Comment system (future)

**Implementation**:
- Add view toggle in `Editor.tsx`
- Implement keyboard shortcuts
- Create `ProjectSwitcher.tsx` component
- Add plan management API endpoints
- Enhance PDF export with formatting

---

## Summary of Priority Improvements

### Recommender (Priority Order)
1. **Persona-Based Paths** - Different flows for founders vs advisors
2. **LLM-Powered Open-Ended Intake** - Chat interface for natural language input
3. **Direct Selection Path** - Search and filters for experts
4. **Data-Driven Ranking** - Learn from user choices
5. **Rule-Based Eligibility Engine** - Legally robust eligibility checks

### Editor (Priority Order)
1. **Robust Requirements Checker** - Evaluate against program criteria, not just word counts
2. **Template Configuration System** - Store program-specific tweaks as data
3. **Enhanced AI Assistant** - Persona-specific prompts, feedback loop, multiple modes
4. **Additional Documents Generation** - Auto-populate pitch decks, financial models, forms
5. **Adaptive UI & Project Management** - Multi-plan support, keyboard shortcuts, collaboration

---

## Implementation Effort Estimate

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Persona-Based Paths | Medium | High | P1 |
| LLM Open-Ended Intake | High | High | P1 |
| Direct Selection Path | Low | Medium | P2 |
| Data-Driven Ranking | High | Medium | P3 |
| Rule-Based Eligibility | Medium | Medium | P3 |
| Robust Requirements Checker | High | High | P1 |
| Template Configuration | Medium | High | P1 |
| Enhanced AI Assistant | Medium | High | P2 |
| Document Generation | High | Medium | P2 |
| Project Management | Medium | Low | P3 |

---

## Next Steps

1. **Immediate (Week 1-2)**:
   - Implement persona-based paths in ProgramFinder
   - Add direct selection path (search + filters)
   - Enhance requirements checker with content heuristics

2. **Short-term (Week 3-4)**:
   - Build LLM-powered open-ended intake
   - Create template configuration system
   - Add persona-specific AI prompts

3. **Medium-term (Month 2)**:
   - Implement data-driven ranking
   - Build document generation (pitch deck, financial model)
   - Add project management features

4. **Long-term (Month 3+)**:
   - Rule-based eligibility engine
   - Advanced collaboration features
   - Feedback loop for AI assistant

