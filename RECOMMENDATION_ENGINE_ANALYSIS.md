# Plan2Fund Recommendation Engine Analysis & Web Scraper Strategy

## Current State Analysis

### 1. Current Recommendation Engine Architecture

**Files Involved:**
- `src/lib/enhancedRecoEngine.ts` - Main scoring engine
- `src/lib/enhancedDecisionTree.ts` - Decision tree logic
- `src/lib/scoring.ts` - Basic scoring functions
- `src/lib/decisionTree.ts` - Legacy decision tree
- `pages/advanced-search.tsx` - Advanced search UI
- `data/programs.json` - Static program data (26,670+ lines)

**Current Data Flow:**
1. Static JSON data loaded from `data/programs.json`
2. User answers processed through `enhancedRecoEngine.ts`
3. Programs scored using rule-based matching
4. Results ranked and displayed

**Current Limitations:**
- **Static Data**: Programs stored in static JSON file
- **Manual Updates**: No automated data refresh mechanism
- **Limited Coverage**: Only 214 programs in current dataset
- **Basic Scoring**: Rule-based scoring without ML/AI enhancement
- **No Real-time Updates**: Program changes not reflected automatically
- **Limited Requirements Extraction**: Basic overlay system for requirements

### 2. Current Program Data Structure

```json
{
  "id": "aws_preseed_innovative_solutions",
  "name": "aws Preseed – Innovative Solutions",
  "type": "grant",
  "eligibility": [...],
  "thresholds": {...},
  "overlays": [...]
}
```

**Issues:**
- Inconsistent data structure across programs
- Limited requirement categorization
- No structured requirement extraction
- Manual maintenance required

## Strategic Document Requirements

### 1. Target Groups & Products
- **Solo Entrepreneurs**: Strategy Document (free) + Submission Document
- **SMEs**: Review Document + Submission Document with specialized modules
- **Advisors**: All plan types + White-label options + Client management
- **Universities**: Education-specific plans + Multi-user accounts

### 2. Required Documents by Funding Type × Target Group
- **Grants**: Project plan, Budget, CVs, Environmental/TRL proofs
- **Bank Loans**: Financial statements, Collateral, Cashflow projections
- **Equity**: Pitch deck, Cap table, IP proofs, 5-year forecast
- **Visa/AMS**: CVs, Certificates, Business plan, Integration plan

### 3. Dynamic Requirements System
- Central CMS for program requirements
- Automatic question generation from requirements
- Real-time requirement updates
- LLM-enhanced requirement extraction

## Recommended Web Scraper Architecture

### 1. Multi-Source Scraping System

**Target Sources:**
- Austrian funding programs (AWS, FFG, WKO, etc.)
- EU funding calls (Horizon Europe, EIC, etc.)
- Bank financing programs
- Visa/AMS requirements
- University research programs

**Scraping Strategy:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Scraper   │───▶│  Data Processor  │───▶│  Requirements   │
│                 │    │                  │    │   Extractor     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Structured     │    │   Semi-          │    │  Unstructured   │
│  Data Sources   │    │  Structured      │    │  Data Sources   │
│  (JSON/XML)     │    │  (HTML Tables)   │    │  (PDFs/Text)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 2. Data Processing Pipeline

**Phase 1: Data Collection**
- **Structured Sources**: APIs, RSS feeds, JSON endpoints
- **Semi-structured**: HTML tables, forms, structured web pages
- **Unstructured**: PDFs, Word docs, plain text

**Phase 2: Data Extraction**
- **LLM-powered extraction** for unstructured data
- **Rule-based parsing** for structured data
- **Hybrid approach** for semi-structured data

**Phase 3: Data Normalization**
- Standardized requirement categories
- Consistent data format
- Quality validation

**Phase 4: Data Integration**
- Real-time updates
- Change detection
- Version control

### 3. Enhanced Recommendation Engine

**New Architecture:**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Scraper   │───▶│  Requirements    │───▶│  Dynamic        │
│   & Data        │    │  Database        │    │  Decision Tree  │
│   Processor     │    │  (Real-time)     │    │  Generator      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  LLM-Enhanced   │    │  Scoring Engine  │    │  Editor         │
│  Extraction     │    │  (ML + Rules)    │    │  Pre-filling    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Recommendations

### 1. Immediate Changes (Phase 1)

**A. Replace Static Data with Dynamic System**
```typescript
// New data structure
interface ProgramData {
  id: string;
  name: string;
  type: FundingType;
  targetGroups: TargetGroup[];
  requirements: StructuredRequirements;
  documents: DocumentRequirements;
  scoring: ScoringRules;
  metadata: {
    lastUpdated: Date;
    source: string;
    confidence: number;
  };
}
```

**B. Implement Web Scraper Foundation**
- Create `src/lib/scraper/` directory
- Implement base scraper classes
- Add data validation and normalization

**C. Enhance Current Recommendation Engine**
- Integrate LLM for requirement extraction
- Add real-time data updates
- Improve scoring algorithms

### 2. Medium-term Changes (Phase 2)

**A. Full Web Scraper Implementation**
- Multi-source scraping system
- Automated data updates
- Change detection and notifications

**B. Advanced Recommendation Logic**
- ML-based scoring
- Personalized recommendations
- Dynamic question generation

**C. Enhanced Editor Integration**
- Real-time requirement checking
- Dynamic document generation
- Target group-specific templates

### 3. Long-term Changes (Phase 3)

**A. AI-Powered Features**
- Natural language requirement extraction
- Automated document generation
- Intelligent matching algorithms

**B. Advanced Analytics**
- Success rate tracking
- Program performance analysis
- User behavior insights

## Technical Implementation Plan

### 1. Web Scraper Architecture

**Core Components:**
```typescript
// Base scraper interface
interface Scraper {
  scrape(): Promise<ProgramData[]>;
  validate(data: ProgramData[]): ValidationResult;
  normalize(data: ProgramData[]): ProgramData[];
}

// Specific scrapers
class AustrianGrantScraper implements Scraper { ... }
class EUScraper implements Scraper { ... }
class BankLoanScraper implements Scraper { ... }
class VisaRequirementScraper implements Scraper { ... }
```

**Data Processing Pipeline:**
```typescript
class DataProcessor {
  async processRawData(rawData: any[]): Promise<ProgramData[]> {
    // 1. Extract requirements using LLM
    const requirements = await this.extractRequirements(rawData);
    
    // 2. Normalize data structure
    const normalized = this.normalizeData(requirements);
    
    // 3. Validate data quality
    const validated = this.validateData(normalized);
    
    // 4. Store in database
    await this.storeData(validated);
    
    return validated;
  }
}
```

### 2. Enhanced Recommendation Engine

**New Scoring System:**
```typescript
class EnhancedScoringEngine {
  async scorePrograms(
    userAnswers: UserAnswers,
    programs: ProgramData[]
  ): Promise<ProgramScore[]> {
    // 1. Rule-based scoring (current system)
    const ruleScores = this.calculateRuleScores(userAnswers, programs);
    
    // 2. ML-based scoring (new)
    const mlScores = await this.calculateMLScores(userAnswers, programs);
    
    // 3. LLM-enhanced reasoning (new)
    const llmScores = await this.calculateLLMScores(userAnswers, programs);
    
    // 4. Combine scores
    return this.combineScores(ruleScores, mlScores, llmScores);
  }
}
```

### 3. Dynamic Question Generation

**Question Generator:**
```typescript
class DynamicQuestionGenerator {
  generateQuestions(programs: ProgramData[]): Question[] {
    // 1. Extract common requirements
    const commonRequirements = this.extractCommonRequirements(programs);
    
    // 2. Generate questions based on requirements
    const questions = this.generateQuestionsFromRequirements(commonRequirements);
    
    // 3. Optimize question order
    return this.optimizeQuestionOrder(questions);
  }
}
```

## Benefits of New System

### 1. For Users
- **Real-time Data**: Always up-to-date program information
- **Better Matching**: More accurate program recommendations
- **Comprehensive Coverage**: Access to all Austrian and EU programs
- **Personalized Experience**: Target group-specific recommendations

### 2. For Business
- **Reduced Maintenance**: Automated data updates
- **Better Conversion**: More accurate recommendations
- **Scalability**: Easy to add new funding sources
- **Competitive Advantage**: Most comprehensive program database

### 3. For Development
- **Maintainable Code**: Modular architecture
- **Extensible System**: Easy to add new features
- **Data Quality**: Automated validation and normalization
- **Performance**: Efficient data processing and caching

## Conclusion

The current system is a good foundation but needs significant enhancement to meet the strategic requirements. The recommended web scraper approach will:

1. **Automate data collection** from all relevant sources
2. **Enhance recommendation accuracy** with ML and LLM
3. **Provide real-time updates** for program changes
4. **Support all target groups** with personalized experiences
5. **Enable dynamic question generation** based on current requirements

This will transform Plan2Fund into a state-of-the-art platform that automatically stays current with the Austrian and EU funding landscape while providing highly personalized and accurate recommendations to all target groups.
