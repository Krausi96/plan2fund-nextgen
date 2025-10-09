# Plan2Fund Architecture Summary for GPT Analysis

## 🎯 THE PROBLEM

**What's Broken**: Users can't complete the funding application flow because the system has empty data, broken connections, and missing functionality.

**Expected User Journey**:
1. User answers questions → Gets personalized funding recommendations
2. User selects program → Gets program-specific business plan editor
3. User writes plan → Gets AI assistance and requirement validation
4. User exports → Gets professional business plan

**Current Reality**: None of this works because data is empty and connections are broken.

## 🏗️ SYSTEM ARCHITECTURE (6 LAYERS)

### Layer 1: Data Collection (Scraper)
**Main Files**: 
- `src/lib/webScraperService.ts` (108KB) - Main scraper service
- `pages/api/scraper/run.ts` - Scraper API endpoint
- `pages/api/scraper/status.ts` - Scraper status monitoring
- `src/lib/ScrapedProgram.ts` - Data types for scraped programs

**Purpose**: Scrapes 200+ Austrian/EU funding websites and extracts program data
**Connects to**: Layer 2 (sends raw data to enhancedDataPipeline.ts)
**Problem**: Only extracts basic data, misses complex requirements like IMPACT, CAPEX/OPEX

### Layer 2: Data Processing (Categorization)
**Main Files**:
- `src/lib/enhancedDataPipeline.ts` (32KB) - Categorization logic (MAIN FOCUS)
- `src/types/requirements.ts` - Category definitions

**Purpose**: Categorizes scraped data into 10 standardized categories
**Connects to**: Layer 1 (receives raw data) → Layer 3 (sends categorized data to database)
**Problem**: Most categories empty, poor pattern matching, missing business categories

### Layer 3: Data Storage (Database)
**Main Files**:
- `scripts/database/setup-database.sql` - Database schema
- `src/lib/database.ts` - Database connection

**Purpose**: PostgreSQL with JSONB columns for structured data storage
**Connects to**: Layer 2 (receives categorized data) → Layer 4 (serves data to APIs)
**Problem**: Categories mostly empty due to poor extraction from Layer 2

### Layer 4: API Layer
**Main Files**:
- `pages/api/programs.ts` - Programs API
- `pages/api/programs-ai.ts` - AI-enhanced programs API
- `pages/api/programmes/[id]/requirements.ts` - Requirements API

**Purpose**: Serves categorized data to frontend components
**Connects to**: Layer 3 (queries database) → Layer 5 (sends data to business logic)
**Problem**: Serving mostly empty categorized data due to Layer 2 issues

### Layer 5: Business Logic (Recommendation Engine)
**Main Files**:
- `src/lib/enhancedRecoEngine.ts` (46KB) - Recommendation scoring
- `src/lib/dynamicQuestionEngine.ts` - Question generation
- `src/lib/dynamicDecisionTree.ts` - Decision tree logic
- `src/lib/readiness.ts` - Readiness validation
- `src/lib/doctorDiagnostic.ts` - Advanced search logic
- `src/lib/aiHelper.ts` - AI assistance

**Purpose**: Scores programs, generates dynamic questions, validates readiness
**Connects to**: Layer 4 (receives program data) → Layer 6 (sends scored programs + questions to frontend)
**Problem**: Limited by poor categorized data from Layer 4

### Layer 6: Frontend Interface
**Main Files**:
- `src/components/decision-tree/DynamicWizard.tsx` - Decision tree UI
- `src/components/editor/StructuredEditor.tsx` - Business plan editor
- `src/components/editor/RequirementsChecker.tsx` - Requirements validation
- `src/components/editor/EnhancedAIChat.tsx` - AI assistant
- `src/components/results/StructuredRequirementsDisplay.tsx` - Results display
- `src/contexts/RecommendationContext.tsx` - State management

**Purpose**: Renders dynamic UI based on categorized data and user interactions
**Connects to**: Layer 5 (receives scored programs + questions) → User (displays results)
**Problem**: Can't display meaningful data due to empty categories from Layer 5

## 🔗 DATA FLOW

**Layer 1 → Layer 2**: Raw scraped data → Categorized requirements
**Layer 2 → Layer 3**: Categorized data → PostgreSQL JSONB columns
**Layer 3 → Layer 4**: JSONB data → API endpoints
**Layer 4 → Layer 5**: Program data → Scoring + Question generation
**Layer 5 → Layer 6**: Scored programs + Questions → UI rendering

## 📊 THE 10 CATEGORIES

```typescript
type RequirementCategory = 
  | 'eligibility'     // Who can apply
  | 'documents'       // What documents needed
  | 'financial'       // Funding amounts, costs
  | 'technical'       // Technology requirements
  | 'legal'          // Legal compliance
  | 'timeline'       // Deadlines, duration
  | 'geographic'     // Location requirements
  | 'team'           // Team size, qualifications
  | 'project'        // Project goals, deliverables
  | 'compliance'     // Standards, certifications
```

**Missing**: IMPACT, CAPEX/OPEX, USE_OF_FUNDS, REVENUE_MODEL, MARKET_SIZE AND OTHERS


## 📋 WHAT GPT NEEDS TO DO

**TASK**: Analyze the system, research Austrian/EU funding requirements, and fix the broken data flow.

**RESEARCH FOCUS**: 
- Target: Austrian companies in EU/Austrian market
- Funding Types: Bank loans, leasing, grants, investors, equity, consulting, WKO, AMS, others
- Key Questions: What requirements do Austrian/EU funding programs actually have? How to parse complex requirements like "innovation impact", "co-funding ratios"? What business categories are missing from our 10 categories?

**ANALYSIS & FIXES**:
1. **Analyze** key files in each layer and identify what's broken
2. **Research** Austrian/EU funding requirements patterns
3. **Fix** each layer:
   - Layer 1: Better scraping logic to extract complex requirements
   - Layer 2: Improved categorization algorithm to populate all 10 categories + more
   - Layer 3: Database schema fixes if needed
   - Layer 4: API endpoint fixes to serve proper data
   - Layer 5: Business logic fixes to work with better data and to create logic in order to ffulffill logig to be used in front end!
   - Layer 6: Frontend component fixes to display meaningful data
4. **Simplify** the architecture - reduce complexity while maintaining functionality
5. **Provide** specific code instructions for implementation

**DELIVERABLES**:
- Complete system analysis with specific problems identified
- Research findings on Austrian/EU funding requirements patterns
- Simplified system architecture design
- Fixed categorization algorithm with code
- Working data flow fixes with code
- Complete implementation plan with priorities

**DYNAMIC SYSTEM PRINCIPLE**: Everything is DYNAMIC, not hardcoded - questions, editor sections, categories, AI guidance, and templates are all generated dynamically from database requirements.