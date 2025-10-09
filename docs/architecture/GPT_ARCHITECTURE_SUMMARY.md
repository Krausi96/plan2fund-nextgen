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

**WHAT TO SCRAPE FOR LAYER 1**:
- **Basic Program Info**: Name, description, funding amounts, deadlines, source URL
- **Eligibility Requirements**: Company size, age, location, legal form, consortium requirements
- **Document Requirements**: Business plan, financial projections, technical documentation, legal documents
- **Financial Details**: CAPEX/OPEX requirements, co-funding ratios, funding rates, cost breakdowns
- **Technical Requirements**: TRL levels, innovation criteria, technology stack, prototype requirements
- **Impact Requirements**: Environmental impact, sustainability goals, market impact, innovation impact
- **Team Requirements**: Team size, qualifications, experience, advisory board requirements
- **Project Requirements**: Goals, deliverables, milestones, timeline, research focus
- **Compliance Requirements**: Standards, certifications, reporting requirements, audit requirements
- **Geographic Requirements**: Location restrictions, EU membership, regional requirements

### Layer 2: Data Processing (Categorization) - **MAIN FOCUS**
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

## 📊 THE 10 CATEGORIES + MISSING ONES

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
  | 'impact'         // Environmental, innovation, market impact
  | 'capex_opex'     // Capital and operational expenditure
  | 'use_of_funds'   // How funding will be used
  | 'revenue_model'  // Business model and revenue streams
  | 'market_size'    // Market opportunity and size
  | 'co_financing'   // Co-funding ratios and requirements
  | 'trl_level'      // Technology readiness levels
  | 'consortium'     // Partnership and consortium requirements
```

## 📋 CONSOLIDATED DELIVERABLES (Sequential Order)

### **Phase 1: Research & Analysis**
1. **Research Austrian/EU funding requirements patterns**
   - Target: Austrian companies in EU/Austrian market
   - Funding Types: Bank loans, leasing, grants, investors, equity, consulting, WKO, AMS, others
   - Key Questions: What requirements do Austrian/EU funding programs actually have? How to parse complex requirements like "innovation impact", "co-funding ratios"?

2. **Analyze ALL key files in each layer and identify what's broken**
   - **Layer 1**: `src/lib/webScraperService.ts`, `pages/api/scraper/run.ts`, `pages/api/scraper/status.ts`, `src/lib/ScrapedProgram.ts`
   - **Layer 2**: `src/lib/enhancedDataPipeline.ts`, `src/types/requirements.ts`
   - **Layer 3**: `scripts/database/setup-database.sql`, `src/lib/database.ts`
   - **Layer 4**: `pages/api/programs.ts`, `pages/api/programs-ai.ts`, `pages/api/programmes/[id]/requirements.ts`
   - **Layer 5**: `src/lib/enhancedRecoEngine.ts`, `src/lib/dynamicQuestionEngine.ts`, `src/lib/dynamicDecisionTree.ts`, `src/lib/readiness.ts`, `src/lib/doctorDiagnostic.ts`, `src/lib/aiHelper.ts`
   - **Layer 6**: `src/components/decision-tree/DynamicWizard.tsx`, `src/components/editor/StructuredEditor.tsx`, `src/components/editor/RequirementsChecker.tsx`, `src/components/editor/EnhancedAIChat.tsx`, `src/components/results/StructuredRequirementsDisplay.tsx`, `src/contexts/RecommendationContext.tsx`

### **Phase 2: Layer 1 - Fix Scraping (What to Extract)**
3. **Provide code instructions for better scraping logic to extract complex requirements**
   - **File**: `src/lib/webScraperService.ts` (108KB)
   - **Instructions**: How to add patterns for categories and other categories like (IMPACT, CAPEX/OPEX, co-funding ratios, TRL levels)
   - **Instructions**: How to implement proper text segmentation for long requirement descriptions
   - **Instructions**: How to add rate limiting and robots.txt compliance
   - **Instructions**: How to extract all 10 data categories from Austrian/EU funding websites

### **Phase 3: Layer 2 - Fix Categorization (MAIN FOCUS)**
4. **Provide code instructions for improved categorization algorithm to populate all categories**
   - **File**: `src/lib/enhancedDataPipeline.ts` (32KB) - MAIN FOCUS
   - **Instructions**: How to add missing categories: IMPACT, CAPEX/OPEX, USE_OF_FUNDS, REVENUE_MODEL, MARKET_SIZE
   - **Instructions**: How to implement multiple category assignment per requirement
   - **Instructions**: How to add Austrian/EU specific pattern recognition
   - **Instructions**: How to fix poor pattern matching that leaves categories empty
   - **File**: `src/types/requirements.ts` - Update category definitions

### **Phase 4: Layer 3 - Fix Database**
5. **Provide code instructions for database schema fixes**
   - **File**: `scripts/database/setup-database.sql`
   - **Instructions**: How to add new categories to database schema
   - **Instructions**: How to add indexes on JSONB fields for efficient queries
   - **Instructions**: How to add fields for new categories (impact_score, capex_amount, etc.)
   - **File**: `src/lib/database.ts` - Update connection logic if needed

### **Phase 5: Layer 4 - Fix APIs**
6. **Provide code instructions for API endpoint fixes to serve proper data**
   - **File**: `pages/api/programs.ts` - Main programs API
   - **File**: `pages/api/programs-ai.ts` - AI-enhanced programs API
   - **File**: `pages/api/programmes/[id]/requirements.ts` - Requirements API
   - **Instructions**: How to read from database instead of fallback JSON
   - **Instructions**: How to add query parameters for filtering by category
   - **Instructions**: How to improve error handling and return meaningful messages

### **Phase 6: Layer 5 - Fix Business Logic**
7. **Provide code instructions for business logic fixes to work with better data**
   - **File**: `src/lib/enhancedRecoEngine.ts` (46KB) - Recommendation scoring
   - **File**: `src/lib/dynamicQuestionEngine.ts` - Question generation
   - **File**: `src/lib/dynamicDecisionTree.ts` - Decision tree logic
   - **File**: `src/lib/readiness.ts` - Readiness validation
   - **File**: `src/lib/doctorDiagnostic.ts` - Advanced search logic
   - **File**: `src/lib/aiHelper.ts` - AI assistance
   - **Instructions**: How to update scoring logic to consider new categories
   - **Instructions**: How to fix question generation to work with populated categories
   - **Instructions**: How to ensure dynamic generation from database requirements

### **Phase 7: Layer 6 - Fix Frontend**
8. **Provide code instructions for frontend component fixes to display meaningful data**
   - **File**: `src/components/decision-tree/DynamicWizard.tsx` - Decision tree UI
   - **File**: `src/components/editor/StructuredEditor.tsx` - Business plan editor
   - **File**: `src/components/editor/RequirementsChecker.tsx` - Requirements validation
   - **File**: `src/components/editor/EnhancedAIChat.tsx` - AI assistant
   - **File**: `src/components/results/StructuredRequirementsDisplay.tsx` - Results display
   - **File**: `src/contexts/RecommendationContext.tsx` - State management
   - **Instructions**: How to update components to show proper questions and data
   - **Instructions**: How to ensure all components work with populated categories
   - **Instructions**: How to implement dynamic UI generation from database requirements

### **Phase 8: Architecture Simplification**
9. **Provide code instructions for simplifying the architecture**
   - **Instructions**: How to evaluate if 6 layers can be reduced to 4
   - **Instructions**: How to consolidate overlapping responsibilities
   - **Instructions**: How to ensure clear data contracts between layers
   - **Instructions**: How to reduce complexity while maintaining functionality
   - **Instructions**: How to find outdated files, duplicates, remove them or integrate files

### **Phase 9: Implementation**
10. **Provide specific code instructions for implementation**
    - **Deliverable**: Complete system analysis with specific problems identified
    - **Deliverable**: Research findings on Austrian/EU funding requirements patterns
    - **Deliverable**: Simplified system architecture design
    - **Deliverable**: Fixed categorization algorithm with code instructions
    - **Deliverable**: Working data flow fixes with code instructions
    - **Deliverable**: Complete implementation plan with priorities
    - **Deliverable**: Step-by-step code instructions for each file modification

## 🎯 DYNAMIC SYSTEM PRINCIPLE

Everything is DYNAMIC, not hardcoded - questions, editor sections, categories, AI guidance, and templates are all generated dynamically from database requirements.