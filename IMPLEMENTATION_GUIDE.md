# Plan2Fund Web Scraper Implementation Guide - GPT-Enhanced

## Quick Start Implementation

This guide provides step-by-step instructions for implementing the web scraper integration with Plan2Fund, incorporating GPT's comprehensive recommendations for an AI-powered, intelligence-driven platform.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Vercel Postgres recommended)
- Redis instance (Upstash Redis recommended)
- Existing Plan2Fund codebase

## Phase 1: Database Setup (Day 1-2) - GPT-Enhanced

### 1.1 Create Enhanced Database Schema (GPT-Recommended)

```sql
-- Create programs table with GPT enhancements
CREATE TABLE programs (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  program_type VARCHAR(100),
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
  is_active BOOLEAN DEFAULT true,
  -- GPT-Recommended Enhancements:
  target_personas JSONB, -- ["solo", "sme", "startup", "researcher"]
  tags JSONB, -- ["innovation", "startup", "non-dilutive", "biotech"]
  decision_tree_questions JSONB, -- Generated questions for wizard
  editor_sections JSONB, -- Program-specific business plan sections
  readiness_criteria JSONB, -- Automated compliance checks
  ai_guidance JSONB -- AI assistant context and prompts
);

-- Create program_requirements table
CREATE TABLE program_requirements (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  section_key VARCHAR(255),
  label VARCHAR(255),
  required BOOLEAN DEFAULT false,
  constraints JSONB,
  attachments JSONB,
  validation_rules JSONB,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE rubrics (
  id SERIAL PRIMARY KEY,
  program_id VARCHAR(255) REFERENCES programs(id),
  criteria JSONB,
  program_type VARCHAR(100),
  target_group VARCHAR(100),
  scraped_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Install Dependencies

```bash
npm install puppeteer cheerio pg redis @types/pg
```

### 1.3 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Scraper
SCRAPER_ENABLED=true
SCRAPER_SCHEDULE="0 2 * * *" # Daily at 2 AM
```

## Phase 2: Web Scraper Implementation (Day 3-5)

### 2.1 Create Scraper Service

```typescript
// src/lib/webScraper.ts
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export class WebScraperService {
  private browser: puppeteer.Browser | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeAllPrograms(): Promise<ScrapedProgram[]> {
    const programs = [];
    
    // Scrape Austrian programs
    programs.push(...await this.scrapeAustrianPrograms());
    
    // Scrape EU programs
    programs.push(...await this.scrapeEUPrograms());
    
    return programs;
  }

  async scrapeAustrianPrograms(): Promise<ScrapedProgram[]> {
    const page = await this.browser!.newPage();
    const programs = [];

    try {
      // AWS programs
      await page.goto('https://aws.at/programs');
      const awsPrograms = await this.extractPrograms(page, 'AWS');
      programs.push(...awsPrograms);

      // FFG programs
      await page.goto('https://ffg.at/programs');
      const ffgPrograms = await this.extractPrograms(page, 'FFG');
      programs.push(...ffgPrograms);

    } catch (error) {
      console.error('Error scraping Austrian programs:', error);
    } finally {
      await page.close();
    }

    return programs;
  }

  private async extractPrograms(page: puppeteer.Page, source: string): Promise<ScrapedProgram[]> {
    const content = await page.content();
    const $ = cheerio.load(content);
    const programs = [];

    // Extract program data using Cheerio selectors
    $('.program-item').each((index, element) => {
      const program = {
        id: `${source.toLowerCase()}_${index}`,
        name: $(element).find('.program-title').text().trim(),
        description: $(element).find('.program-description').text().trim(),
        program_type: this.detectProgramType($(element)),
        funding_amount_min: this.extractMinAmount($(element)),
        funding_amount_max: this.extractMaxAmount($(element)),
        deadline: this.extractDeadline($(element)),
        source_url: page.url(),
        scraped_at: new Date(),
        confidence_score: 0.9
      };
      programs.push(program);
    });

    return programs;
  }

  private detectProgramType(element: cheerio.Cheerio): string {
    const text = element.text().toLowerCase();
    if (text.includes('grant') || text.includes('förderung')) return 'grant';
    if (text.includes('loan') || text.includes('kredit')) return 'loan';
    if (text.includes('equity') || text.includes('beteiligung')) return 'equity';
    return 'grant'; // default
  }

  private extractMinAmount(element: cheerio.Cheerio): number {
    const text = element.text();
    const match = text.match(/(\d+)\s*€/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractMaxAmount(element: cheerio.Cheerio): number {
    const text = element.text();
    const match = text.match(/(\d+)\s*€/g);
    return match && match.length > 1 ? parseInt(match[1]) : 0;
  }

  private extractDeadline(element: cheerio.Cheerio): Date | null {
    const text = element.text();
    const match = text.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
    return match ? new Date(match[1]) : null;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 2.2 Create Database Service

```typescript
// src/lib/database.ts
import { Pool } from 'pg';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async savePrograms(programs: ScrapedProgram[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const program of programs) {
        await client.query(`
          INSERT INTO programs (id, name, description, program_type, funding_amount_min, funding_amount_max, deadline, source_url, scraped_at, confidence_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            program_type = EXCLUDED.program_type,
            funding_amount_min = EXCLUDED.funding_amount_min,
            funding_amount_max = EXCLUDED.funding_amount_max,
            deadline = EXCLUDED.deadline,
            source_url = EXCLUDED.source_url,
            scraped_at = EXCLUDED.scraped_at,
            confidence_score = EXCLUDED.confidence_score
        `, [
          program.id,
          program.name,
          program.description,
          program.program_type,
          program.funding_amount_min,
          program.funding_amount_max,
          program.deadline,
          program.source_url,
          program.scraped_at,
          program.confidence_score
        ]);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPrograms(filters?: ProgramFilters): Promise<Program[]> {
    let query = 'SELECT * FROM programs WHERE is_active = true';
    const params: any[] = [];
    
    if (filters?.program_type) {
      query += ' AND program_type = $1';
      params.push(filters.program_type);
    }
    
    if (filters?.funding_amount_min) {
      query += ' AND funding_amount_max >= $2';
      params.push(filters.funding_amount_min);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getProgramById(id: string): Promise<Program | null> {
    const result = await this.pool.query('SELECT * FROM programs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}
```

### 2.3 Create Cache Service

```typescript
// src/lib/cache.ts
import { createClient } from 'redis';

export class CacheService {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL
    });
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}
```

## Phase 3: Enhanced Data Source (Day 6-7)

### 3.1 Create Enhanced Data Source

```typescript
// src/lib/dataSource.ts
import { DatabaseService } from './database';
import { CacheService } from './cache';

export class EnhancedDataSource {
  private db: DatabaseService;
  private cache: CacheService;

  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
  }

  async getPrograms(filters?: ProgramFilters): Promise<Program[]> {
    const cacheKey = `programs:${JSON.stringify(filters || {})}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      console.log('Serving from cache');
      return cached;
    }
    
    // Fallback to database
    console.log('Serving from database');
    const programs = await this.db.getPrograms(filters);
    
    // Cache for 1 hour
    await this.cache.set(cacheKey, programs, 3600);
    
    return programs;
  }

  async getProgramById(id: string): Promise<Program | null> {
    const cacheKey = `program:${id}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fallback to database
    const program = await this.db.getProgramById(id);
    
    if (program) {
      // Cache for 1 hour
      await this.cache.set(cacheKey, program, 3600);
    }
    
    return program;
  }

  async getProgramRequirements(programId: string): Promise<Requirement[]> {
    // Implementation for getting program requirements
    // This would query the program_requirements table
    return [];
  }

  async getReadinessCheck(programId: string): Promise<ReadinessCheck> {
    // Implementation for readiness checking
    // This would analyze user progress against program requirements
    return {
      programId,
      progress: 0,
      requirements: [],
      missing: [],
      nextSteps: []
    };
  }
}
```

## Phase 4: API Endpoints (Day 8-9)

### 4.1 Update Existing API Endpoints

```typescript
// pages/api/programs/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedDataSource } from '../../../src/lib/dataSource';

const dataSource = new EnhancedDataSource();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const programs = await dataSource.getPrograms(req.query);
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
}
```

```typescript
// pages/api/programs/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedDataSource } from '../../../src/lib/dataSource';

const dataSource = new EnhancedDataSource();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const program = await dataSource.getProgramById(req.query.id as string);
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(program);
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
}
```

### 4.2 Create Editor-Specific Endpoints

```typescript
// pages/api/editor/validate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { EnhancedDataSource } from '../../../src/lib/dataSource';

const dataSource = new EnhancedDataSource();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { programId, sections, attachments } = req.body;
    
    // Get program requirements
    const requirements = await dataSource.getProgramRequirements(programId);
    
    // Validate against requirements
    const validation = {
      missing_required: [],
      over_limits: [],
      rubric_not_covered: [],
      deadline_status: 'valid'
    };
    
    // Check missing required sections
    for (const req of requirements) {
      if (req.required && !sections[req.section_key]) {
        validation.missing_required.push(req.section_key);
      }
    }
    
    res.json(validation);
  } catch (error) {
    console.error('Error validating document:', error);
    res.status(500).json({ error: 'Failed to validate document' });
  }
}
```

## Phase 5: Frontend Integration (Day 10-12)

### 5.1 Update Recommendation Engine

```typescript
// src/lib/enhancedRecoEngine.ts (update existing)
import { EnhancedDataSource } from './dataSource';

export class EnhancedRecommendationEngine {
  private dataSource: EnhancedDataSource;

  constructor() {
    this.dataSource = new EnhancedDataSource();
  }

  async getRecommendations(userAnswers: UserAnswers): Promise<Recommendation[]> {
    // Get programs from enhanced data source
    const programs = await this.dataSource.getPrograms();
    
    // Apply existing scoring logic
    const scoredPrograms = await this.scorePrograms(programs, userAnswers);
    
    return scoredPrograms;
  }

  private async scorePrograms(programs: Program[], userAnswers: UserAnswers): Promise<Recommendation[]> {
    // Existing scoring logic enhanced with new data
    return programs.map(program => ({
      program,
      score: this.calculateScore(program, userAnswers),
      reasons: this.generateReasons(program, userAnswers)
    }));
  }
}
```

### 5.2 Update Editor Components

```typescript
// src/components/editor/EditorShell.tsx (update existing)
import { useEffect, useState } from 'react';
import { EnhancedDataSource } from '../../lib/dataSource';

interface EditorShellProps {
  programId: string;
}

export const EditorShell = ({ programId }: EditorShellProps) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  
  const dataSource = new EnhancedDataSource();
  
  useEffect(() => {
    loadProgramData(programId);
  }, [programId]);
  
  const loadProgramData = async (id: string) => {
    try {
      const program = await dataSource.getProgramById(id);
      const requirements = await dataSource.getProgramRequirements(id);
      const readiness = await dataSource.getReadinessCheck(id);
      
      setProgram(program);
      setRequirements(requirements);
      setReadiness(readiness);
    } catch (error) {
      console.error('Error loading program data:', error);
    }
  };
  
  return (
    <div className="editor-shell">
      {program && (
        <div className="program-info">
          <h2>{program.name}</h2>
          <p>{program.description}</p>
          <div className="requirements">
            {requirements.map(req => (
              <div key={req.id} className={`requirement ${req.completed ? 'completed' : 'pending'}`}>
                {req.label} {req.required && '*'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Phase 6: Scraper Scheduling (Day 13-14)

### 6.1 Create Scraper API Endpoint

```typescript
// pages/api/scraper/run.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperService } from '../../../src/lib/webScraper';
import { DatabaseService } from '../../../src/lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const scraper = new WebScraperService();
  const db = new DatabaseService();
  
  try {
    await scraper.init();
    
    // Scrape all programs
    const programs = await scraper.scrapeAllPrograms();
    
    // Save to database
    await db.savePrograms(programs);
    
    res.json({ 
      success: true, 
      programsScraped: programs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: 'Scraping failed' });
  } finally {
    await scraper.close();
  }
}
```

### 6.2 Set Up Cron Job

```typescript
// pages/api/cron/scraper.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Trigger scraper
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scraper/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    res.json({ 
      success: true, 
      message: 'Scraper triggered successfully',
      result 
    });
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: 'Cron job failed' });
  }
}
```

## Phase 7: Testing and Deployment (Day 15-16)

### 7.1 Test Scraper

```bash
# Test scraper locally
curl -X POST http://localhost:3000/api/scraper/run
```

### 7.2 Test API Endpoints

```bash
# Test programs endpoint
curl http://localhost:3000/api/programs

# Test specific program
curl http://localhost:3000/api/programs/aws_1
```

### 7.3 Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Set up cron job in Vercel dashboard
# Add cron job: 0 2 * * * /api/cron/scraper
```

## Monitoring and Maintenance

### 7.4 Add Monitoring

```typescript
// src/lib/monitoring.ts
export class MonitoringService {
  static async logScraperRun(success: boolean, programsScraped: number, error?: string) {
    console.log(`Scraper run: ${success ? 'SUCCESS' : 'FAILED'}, Programs: ${programsScraped}, Error: ${error || 'None'}`);
    
    // Send to monitoring service (e.g., Sentry, DataDog)
    if (!success && error) {
      // Send alert
    }
  }
  
  static async logAPIUsage(endpoint: string, responseTime: number, success: boolean) {
    console.log(`API ${endpoint}: ${success ? 'SUCCESS' : 'FAILED'}, Time: ${responseTime}ms`);
  }
}
```

## Success Checklist

- [ ] Database schema created and populated
- [ ] Web scraper extracting data from Austrian programs
- [ ] Cache layer working with Redis
- [ ] API endpoints serving enhanced data
- [ ] Frontend components using new data source
- [ ] Cron job running daily
- [ ] Monitoring and error handling in place
- [ ] Performance optimized (< 200ms API responses)
- [ ] All tests passing
- [ ] Deployed to production

## Next Steps

1. **Week 3-4**: Enhance recommendation engine with program-specific logic
2. **Week 5-6**: Add document library with requirements matrix
3. **Week 7-8**: Implement AI assistant with program context
4. **Week 9-10**: Add advanced features and optimizations

This implementation guide provides a practical, step-by-step approach to integrating web scraper functionality with Plan2Fund while maintaining the existing codebase structure.
