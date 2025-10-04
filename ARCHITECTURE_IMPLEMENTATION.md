# Plan2Fund Web Scraper Integration - Simplified Architecture

## Overview

This document outlines the **simplified, practical implementation** of web scraper integration for Plan2Fund, focusing on incremental enhancement of the existing codebase rather than complete architectural overhaul.

## Current State vs. Enhanced State

### Current Architecture
```
Static JSON (214 programs) → Basic Recommendations → Generic Editor
```

### Enhanced Architecture
```
Web Scraper → Database → Cache → API → Enhanced Components
    ↓           ↓         ↓      ↓           ↓
500+ Programs → PostgreSQL → Redis → Next.js → Smart Features
```

## Simplified Implementation Strategy

### Phase 1: Core Data Integration (Week 1-2)
- **Replace static JSON** with database-driven data source
- **Add web scraper** for Austrian/EU funding programs
- **Implement caching** with Redis for performance
- **Enhance API endpoints** to serve dynamic data

### Phase 2: Component Enhancement (Week 3-4)
- **Enhance Recommendation Engine** with program-specific questions
- **Upgrade Editor** with program-aware validation and templates
- **Improve Advanced Search** with intelligent free-text parsing
- **Add Document Library** with requirements matrix

### Phase 3: AI Integration (Week 5-6)
- **Enhance AI Assistant** with program context awareness
- **Add expert modules** for business planning
- **Implement readiness checking** with program requirements
- **Add real-time updates** and notifications

## Technical Architecture

### Data Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Scraper   │───▶│  PostgreSQL DB   │───▶│  Redis Cache    │
│   (Daily Cron)  │    │  (Program Data)  │    │  (Fast Access)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Next.js API    │◀───│  Data Source     │◀───│  Cache Layer    │
│  (Serverless)   │    │  (Enhanced)      │    │  (Redis)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  (Enhanced)     │
└─────────────────┘
```

### Database Schema

#### Programs Table
```sql
CREATE TABLE programs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  program_type VARCHAR(100), -- grant, loan, equity, visa
  funding_amount_min INTEGER,
  funding_amount_max INTEGER,
  currency VARCHAR(3) DEFAULT 'EUR',
  deadline DATE,
  eligibility_criteria JSONB,
  requirements JSONB,
  contact_info JSONB,
  source_url VARCHAR(500),
  scraped_at TIMESTAMP DEFAULT NOW(),
  confidence_score FLOAT DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true
);
```

#### Program Requirements Table
```sql
CREATE TABLE program_requirements (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  section_key VARCHAR(255),
  label VARCHAR(255),
  required BOOLEAN DEFAULT false,
  constraints JSONB, -- {max_words, max_pages, format, language}
  attachments JSONB, -- ["budget", "cv", "patent"]
  validation_rules JSONB,
  scraped_at TIMESTAMP DEFAULT NOW()
);
```

#### Rubrics Table
```sql
CREATE TABLE rubrics (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  criteria JSONB, -- [{name, desc, section_hint, weight, validation_type}]
  program_type VARCHAR(100),
  target_group VARCHAR(100),
  scraped_at TIMESTAMP DEFAULT NOW()
);
```

## Component Integration

### 1. Enhanced Data Source
```typescript
// src/lib/dataSource.ts
export class EnhancedDataSource {
  async getPrograms(filters?: ProgramFilters): Promise<Program[]> {
    // Check cache first
    const cached = await this.getFromCache('programs', filters);
    if (cached) return cached;
    
    // Fallback to database
    const programs = await this.getFromDatabase(filters);
    await this.setCache('programs', programs, filters);
    return programs;
  }
  
  async getProgramById(id: string): Promise<Program> {
    // Similar caching logic
  }
}
```

### 2. Web Scraper Service
```typescript
// src/lib/webScraper.ts
export class WebScraperService {
  async scrapeAllPrograms(): Promise<ScrapedProgram[]> {
    const programs = [];
    
    // Scrape Austrian programs
    programs.push(...await this.scrapeAustrianPrograms());
    
    // Scrape EU programs
    programs.push(...await this.scrapeEUPrograms());
    
    // Scrape bank programs
    programs.push(...await this.scrapeBankPrograms());
    
    return programs;
  }
  
  async scrapeAustrianPrograms(): Promise<ScrapedProgram[]> {
    // AWS, FFG, WKO programs
  }
}
```

### 3. Enhanced Recommendation Engine
```typescript
// src/lib/enhancedRecoEngine.ts (enhanced)
export class EnhancedRecommendationEngine {
  async getRecommendations(userAnswers: UserAnswers): Promise<Recommendation[]> {
    // Get programs from enhanced data source
    const programs = await this.dataSource.getPrograms();
    
    // Apply doctor diagnostic logic
    const diagnosis = await this.doctorDiagnostic.analyze(userAnswers);
    
    // Score programs with enhanced logic
    const scoredPrograms = await this.scorePrograms(programs, userAnswers, diagnosis);
    
    return scoredPrograms;
  }
}
```

### 4. Program-Aware Editor
```typescript
// src/components/editor/EditorShell.tsx (enhanced)
export const EditorShell = ({ programId }: { programId: string }) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  
  useEffect(() => {
    // Load program-specific data
    loadProgramData(programId);
  }, [programId]);
  
  const loadProgramData = async (id: string) => {
    const program = await dataSource.getProgramById(id);
    const requirements = await dataSource.getProgramRequirements(id);
    const readiness = await dataSource.getReadinessCheck(id);
    
    setProgram(program);
    setRequirements(requirements);
    setReadiness(readiness);
  };
};
```

## API Endpoints

### Core Endpoints
```typescript
// pages/api/programs/index.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const programs = await dataSource.getPrograms(req.query);
  res.json(programs);
}

// pages/api/programs/[id].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const program = await dataSource.getProgramById(req.query.id as string);
  res.json(program);
}

// pages/api/recommendations.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const recommendations = await recommendationEngine.getRecommendations(req.body);
  res.json(recommendations);
}
```

### Editor-Specific Endpoints
```typescript
// pages/api/editor/validate.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validation = await editorService.validateDocument(req.body);
  res.json(validation);
}

// pages/api/editor/readiness.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const readiness = await editorService.checkReadiness(req.body);
  res.json(readiness);
}
```

## Implementation Phases

### Phase 1: Data Foundation (Week 1-2)
- [ ] Set up PostgreSQL database with enhanced schema
- [ ] Implement web scraper for Austrian programs (AWS, FFG, WKO)
- [ ] Create enhanced data source with caching
- [ ] Update API endpoints to use new data source
- [ ] Test data flow and caching

### Phase 2: Component Enhancement (Week 3-4)
- [ ] Enhance recommendation engine with program-specific logic
- [ ] Update editor with program-aware validation
- [ ] Improve advanced search with intelligent parsing
- [ ] Add document library with requirements matrix
- [ ] Test all components with new data

### Phase 3: AI Integration (Week 5-6)
- [ ] Enhance AI assistant with program context
- [ ] Add expert modules for business planning
- [ ] Implement real-time readiness checking
- [ ] Add notifications for program updates
- [ ] Performance optimization and monitoring

## Key Benefits

### For Users
- ✅ **500+ programs** instead of 214 static programs
- ✅ **Program-specific guidance** tailored to each funding type
- ✅ **Real-time accuracy** with automatic updates
- ✅ **Better success rates** with program-aware documents
- ✅ **Intelligent recommendations** with AI-powered matching

### For Platform
- ✅ **Reduced maintenance** with automated data updates
- ✅ **Higher user satisfaction** with better guidance
- ✅ **Competitive advantage** with program-specific features
- ✅ **Scalable architecture** for future growth
- ✅ **Data-driven insights** for platform improvement

## Technical Considerations

### Performance
- **Redis caching** for sub-second API responses
- **Incremental updates** to avoid full re-scraping
- **Concurrent scraping** with rate limiting
- **Database indexing** for fast queries

### Reliability
- **Error handling** with retry logic
- **Fallback mechanisms** if scraper fails
- **Data validation** to ensure quality
- **Monitoring** with alerts for failures

### Compliance
- **GDPR compliance** for data handling
- **Accessibility** (WCAG 2.1) for all UI components
- **Data retention** policies for scraped content
- **Transparency** with data source attribution

## Success Metrics

### Technical Metrics
- **API response time** < 200ms for cached requests
- **Scraper success rate** > 95%
- **Data freshness** < 24 hours
- **System uptime** > 99.9%

### Business Metrics
- **User engagement** increase with program-specific features
- **Application success rate** improvement with better guidance
- **Platform usage** growth with more programs
- **User satisfaction** scores for new features

## Conclusion

This simplified architecture provides a practical path to enhance Plan2Fund with web scraper integration while maintaining the existing codebase structure. The phased approach allows for incremental improvements and testing, ensuring a smooth transition to a more intelligent and data-driven platform.

The key is to start simple, test thoroughly, and enhance incrementally based on user feedback and performance metrics.
