# Plan2Fund Web Scraper Integration - Simplified Architecture

## Overview and Goals

Plan2Fund is a funding platform that currently relies on a static JSON data source of 214 programs, which is outdated and limited. The goal is to replace this with a **simplified, practical web scraper integration** to support 500+ Austrian and EU funding programs in real-time.

### Key Objectives:
- **Incremental Enhancement**: Build upon existing codebase rather than complete overhaul
- **Simplified Architecture**: Focus on practical implementation over complex systems
- **Real-time Data**: Replace static JSON with dynamic, scraped program data
- **Program-Aware Features**: Enhance all components with program-specific intelligence
- **Maintainable Solution**: Easy to understand, debug, and extend

## Simplified System Architecture

### Current State
```
Static JSON (214 programs) → Basic Components → Generic User Experience
```

### Enhanced State
```
Web Scraper → Database → Cache → Enhanced Components → Intelligent User Experience
    ↓           ↓         ↓           ↓                        ↓
500+ Programs → PostgreSQL → Redis → Smart Features → Program-Specific Guidance
```

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

## Component Integration Strategy

### 1. Recommendation Engine (Wizard/Advanced Search)

#### Current State:
- Static decision tree with hardcoded questions
- Basic rule-based scoring
- 214 static programs
- Manual updates required

#### Enhanced State:
- **Dynamic questions** generated from program requirements
- **AI + Rules hybrid scoring** with confidence levels
- **500+ programs** with real-time updates
- **Doctor-like diagnostic** for intelligent matching

#### Implementation:
```typescript
// Enhanced recommendation engine
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

### 2. Document Library

#### Current State:
- Basic program list
- Static program information
- Manual requirement documentation

#### Enhanced State:
- **Requirements matrix** with program comparison
- **Dynamic categorization** by funding type
- **Rich metadata** from scraped data
- **Interactive filtering** and search

#### Implementation:
```typescript
// Document library with requirements matrix
export const DocumentLibrary = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  
  // Load programs with requirements
  useEffect(() => {
    loadProgramsWithRequirements();
  }, []);
  
  const loadProgramsWithRequirements = async () => {
    const programs = await dataSource.getPrograms();
    const requirements = await dataSource.getAllRequirements();
    setPrograms(programs);
    setRequirements(requirements);
  };
};
```

### 3. Editor (Readiness Check & Formatting)

#### Current State:
- Generic document templates
- Basic completion tracking
- Static formatting rules

#### Enhanced State:
- **Program-specific templates** based on requirements
- **Real-time readiness checking** against program criteria
- **Dynamic formatting** based on program guidelines
- **Context-aware AI assistance**

#### Implementation:
```typescript
// Program-aware editor
export const EditorShell = ({ programId }: { programId: string }) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  
  // Load program-specific data
  useEffect(() => {
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

### 4. AI Assistant

#### Current State:
- General business planning advice
- Generic templates and guidance
- No program context awareness

#### Enhanced State:
- **Program-specific expert guidance**
- **Context-aware advice** based on selected program
- **Expert modules** for different business areas
- **Integration with readiness checking**

#### Implementation:
```typescript
// Context-aware AI assistant
export class AIAssistant {
  async getAdvice(query: string, programId?: string): Promise<string> {
    let context = '';
    
    if (programId) {
      const program = await dataSource.getProgramById(programId);
      context = this.generateProgramContext(program);
    }
    
    return await this.llm.generateResponse(query, context);
  }
  
  private generateProgramContext(program: Program): string {
    return `
      Program: ${program.name}
      Type: ${program.program_type}
      Requirements: ${JSON.stringify(program.requirements)}
      Guidelines: ${program.guidelines}
    `;
  }
}
```

## Database Schema

### Programs Table
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

### Program Requirements Table
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

### Rubrics Table
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

## Web Scraper Implementation

### Scraper Architecture
```typescript
// Web scraper service
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
    const sources = [
      'https://aws.at/programs',
      'https://ffg.at/programs',
      'https://wko.at/programs'
    ];
    
    const programs = [];
    for (const source of sources) {
      const scraped = await this.scrapeSource(source);
      programs.push(...scraped);
    }
    
    return programs;
  }
}
```

### Scraping Strategy
- **Daily cron job** for regular updates
- **Incremental updates** to avoid full re-scraping
- **Error handling** with retry logic
- **Rate limiting** to avoid being blocked
- **Data validation** to ensure quality

## API Endpoints

### Core Endpoints
```typescript
// GET /api/programs
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const programs = await dataSource.getPrograms(req.query);
  res.json(programs);
}

// GET /api/programs/[id]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const program = await dataSource.getProgramById(req.query.id as string);
  res.json(program);
}

// POST /api/recommendations
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const recommendations = await recommendationEngine.getRecommendations(req.body);
  res.json(recommendations);
}
```

### Editor-Specific Endpoints
```typescript
// POST /api/editor/validate
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const validation = await editorService.validateDocument(req.body);
  res.json(validation);
}

// GET /api/editor/readiness/[programId]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const readiness = await editorService.checkReadiness(req.query.programId as string);
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
