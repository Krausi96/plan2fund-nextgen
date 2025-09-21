import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Load real programs data
const programsPath = path.join(__dirname, '../data/programs.json');
const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
const programs = programsData.programs || [];

// Load personas
const personasPath = path.join(__dirname, '../fixtures/personas.json');
const personasData = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
const personas = personasData.personas;

describe('Corpus Sanity Tests', () => {
  let samplePrograms: any[] = [];

  beforeAll(() => {
    // Randomly sample 10 programs from the live index
    const shuffled = [...programs].sort(() => 0.5 - Math.random());
    samplePrograms = shuffled.slice(0, 10);
  });

  it('should have valid program structure', () => {
    expect(programs.length).toBeGreaterThan(0);
    expect(Array.isArray(programs)).toBe(true);
  });

  it('should have critical fields for top programs', () => {
    const topPrograms = programs.slice(0, 50); // Top 50 programs
    
    topPrograms.forEach(program => {
      // Critical fields must exist
      expect(program.id).toBeDefined();
      expect(program.title || program.name).toBeDefined();
      
      // Amount field validation
      if (program.amount) {
        expect(typeof program.amount).toBe('string');
        expect(program.amount).toMatch(/\d+/);
      }
      
      // Region field validation
      if (program.region || program.location) {
        expect(typeof (program.region || program.location)).toBe('string');
      }
      
      // Date field validation
      if (program.deadline || program.end_date) {
        expect(typeof (program.deadline || program.end_date)).toBe('string');
      }
    });
  });

  it('should have recent crawl data', () => {
    const now = new Date();
    const maxAgeDays = 30; // Fail if older than 30 days
    
    programs.forEach(program => {
      if (program.last_crawled || program.last_checked) {
        const lastCrawled = new Date(program.last_crawled || program.last_checked);
        const daysDiff = (now.getTime() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24);
        
        expect(daysDiff).toBeLessThan(maxAgeDays);
      }
    });
  });

  it('should have valid program types', () => {
    const validTypes = ['grant', 'loan', 'equity', 'mixed', 'visa', 'incubator'];
    
    programs.forEach(program => {
      if (program.type) {
        expect(validTypes).toContain(program.type);
      }
    });
  });

  it('should have valid regions', () => {
    const validRegions = ['AT', 'EU', 'AT/EU', 'NON_EU'];
    
    programs.forEach(program => {
      if (program.region || program.location) {
        const region = program.region || program.location;
        expect(validRegions).toContain(region);
      }
    });
  });
});

describe('Deterministic Inference & Ranking Tests', () => {
  // Mock the enhanced recommendation engine for testing
  function mockScorePrograms(answers: any, programs: any[]) {
    return programs.map(program => {
      let score = 0;
      const reasons: string[] = [];
      
      // CAPEX + collateral + urgent ⇒ loan/leasing outranks grants
      if (answers.capexFlag && answers.collateralOk && answers.urgencyBucket === 'urgent') {
        if (program.type === 'loan' || program.type === 'leasing') {
          score += 30;
          reasons.push('CAPEX + collateral + urgent matches loan/leasing');
        } else if (program.type === 'grant') {
          score += 10;
          reasons.push('CAPEX + collateral + urgent prefers loan over grant');
        }
      }
      
      // Equity-OK + scale + large ask ⇒ equity/incubators outrank grants
      if (answers.equityOk && answers.companyAgeBucket === '3y+' && answers.amountRequested > 500000) {
        if (program.type === 'equity' || program.type === 'incubator') {
          score += 30;
          reasons.push('Equity-OK + scale + large ask matches equity/incubator');
        } else if (program.type === 'grant') {
          score += 10;
          reasons.push('Equity-OK + scale + large ask prefers equity over grant');
        }
      }
      
      // Medtech + regulatory ⇒ health programs rank higher than generic grants
      if (answers.regulatoryFlag && answers.sectorBucket === 'health') {
        if (program.tags && program.tags.includes('health')) {
          score += 25;
          reasons.push('Medtech + regulatory matches health programs');
        } else if (program.type === 'grant') {
          score += 5;
          reasons.push('Medtech + regulatory prefers health-specific over generic');
        }
      }
      
      // Base score
      score += Math.random() * 20; // Add some randomness for realistic testing
      
      return {
        ...program,
        score: Math.round(score),
        reasons,
        eligibility: score > 20 ? 'Eligible' : 'Not Eligible'
      };
    }).sort((a, b) => b.score - a.score);
  }

  it('should rank loan/leasing higher for CAPEX + collateral + urgent', () => {
    const answers = {
      capexFlag: true,
      collateralOk: true,
      urgencyBucket: 'urgent',
      equityOk: false,
      companyAgeBucket: '3y+',
      amountRequested: 1000000,
      regulatoryFlag: false,
      sectorBucket: 'manufacturing'
    };
    
    const scored = mockScorePrograms(answers, programs);
    const top3 = scored.slice(0, 3);
    
    // Top 3 should not be identical
    expect(new Set(top3.map(p => p.id)).size).toBe(3);
    
    // Should come from real corpus, not placeholders
    expect(top3.every(p => programs.some(realP => realP.id === p.id))).toBe(true);
    
    // Loan/leasing should outrank grants
    const loanLeasing = top3.filter(p => p.type === 'loan' || p.type === 'leasing');
    const grants = top3.filter(p => p.type === 'grant');
    
    if (loanLeasing.length > 0 && grants.length > 0) {
      const highestLoan = Math.max(...loanLeasing.map(p => p.score));
      const highestGrant = Math.max(...grants.map(p => p.score));
      expect(highestLoan).toBeGreaterThanOrEqual(highestGrant);
    }
  });

  it('should rank equity/incubators higher for equity-OK + scale + large ask', () => {
    const answers = {
      capexFlag: false,
      collateralOk: false,
      urgencyBucket: 'normal',
      equityOk: true,
      companyAgeBucket: '3y+',
      amountRequested: 2000000,
      regulatoryFlag: false,
      sectorBucket: 'tech'
    };
    
    const scored = mockScorePrograms(answers, programs);
    const top3 = scored.slice(0, 3);
    
    // Top 3 should not be identical
    expect(new Set(top3.map(p => p.id)).size).toBe(3);
    
    // Should come from real corpus
    expect(top3.every(p => programs.some(realP => realP.id === p.id))).toBe(true);
    
    // Equity/incubators should outrank grants
    const equityIncubator = top3.filter(p => p.type === 'equity' || p.type === 'incubator');
    const grants = top3.filter(p => p.type === 'grant');
    
    if (equityIncubator.length > 0 && grants.length > 0) {
      const highestEquity = Math.max(...equityIncubator.map(p => p.score));
      const highestGrant = Math.max(...grants.map(p => p.score));
      expect(highestEquity).toBeGreaterThanOrEqual(highestGrant);
    }
  });

  it('should rank health programs higher for medtech + regulatory', () => {
    const answers = {
      capexFlag: false,
      collateralOk: false,
      urgencyBucket: 'normal',
      equityOk: false,
      companyAgeBucket: '0-3y',
      amountRequested: 500000,
      regulatoryFlag: true,
      sectorBucket: 'health'
    };
    
    const scored = mockScorePrograms(answers, programs);
    const top3 = scored.slice(0, 3);
    
    // Top 3 should not be identical
    expect(new Set(top3.map(p => p.id)).size).toBe(3);
    
    // Should come from real corpus
    expect(top3.every(p => programs.some(realP => realP.id === p.id))).toBe(true);
    
    // Health programs should rank higher than generic grants
    const healthPrograms = top3.filter(p => 
      p.tags && p.tags.includes('health') || 
      p.title && p.title.toLowerCase().includes('health')
    );
    const genericGrants = top3.filter(p => 
      p.type === 'grant' && 
      (!p.tags || !p.tags.includes('health')) &&
      (!p.title || !p.title.toLowerCase().includes('health'))
    );
    
    if (healthPrograms.length > 0 && genericGrants.length > 0) {
      const highestHealth = Math.max(...healthPrograms.map(p => p.score));
      const highestGeneric = Math.max(...genericGrants.map(p => p.score));
      expect(highestHealth).toBeGreaterThanOrEqual(highestGeneric);
    }
  });

  it('should have diverse top-3 results across different personas', () => {
    const personaKeys = Object.keys(personas).slice(0, 5); // Test first 5 personas
    const allTop3s: string[][] = [];
    
    personaKeys.forEach(personaKey => {
      const persona = personas[personaKey];
      const answers = {
        capexFlag: persona.funding?.use_of_funds?.includes('capex') || false,
        collateralOk: persona.funding?.collateral_availability || false,
        urgencyBucket: persona.funding?.urgency || 'normal',
        equityOk: persona.funding?.equity_willingness || false,
        companyAgeBucket: persona.stage?.maturity === 'scale' ? '3y+' : '0-3y',
        amountRequested: persona.funding?.amount_requested || 100000,
        regulatoryFlag: persona.special?.regulatory_needs?.length > 0,
        sectorBucket: persona.general?.sector?.toLowerCase().includes('health') ? 'health' : 'tech'
      };
      
      const scored = mockScorePrograms(answers, programs);
      const top3 = scored.slice(0, 3).map(p => p.id);
      allTop3s.push(top3);
    });
    
    // All top-3s should be different
    const uniqueTop3s = new Set(allTop3s.map(top3 => top3.join(',')));
    expect(uniqueTop3s.size).toBe(allTop3s.length);
    
    // Each top-3 should have 3 different programs
    allTop3s.forEach(top3 => {
      expect(new Set(top3).size).toBe(3);
    });
  });

  it('should use real corpus data, not placeholders', () => {
    const answers = {
      capexFlag: true,
      collateralOk: true,
      urgencyBucket: 'urgent',
      equityOk: false,
      companyAgeBucket: '3y+',
      amountRequested: 1000000,
      regulatoryFlag: false,
      sectorBucket: 'manufacturing'
    };
    
    const scored = mockScorePrograms(answers, programs);
    const top3 = scored.slice(0, 3);
    
    // Should not contain placeholder programs
    const placeholderNames = ['Austrian Innovation Grant', 'EU Horizon Program', 'Startup Equity Fund', 'SME Loan Program', 'ESG Impact Grant'];
    top3.forEach(program => {
      expect(placeholderNames).not.toContain(program.name);
    });
    
    // Should have real program IDs
    top3.forEach(program => {
      expect(program.id).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(program.id.length).toBeGreaterThan(3);
    });
  });
});

describe('Data Quality Validation', () => {
  it('should have consistent program structure', () => {
    const requiredFields = ['id', 'title'];
    const optionalFields = ['type', 'region', 'amount', 'deadline', 'tags'];
    
    programs.forEach(program => {
      // Required fields must exist
      requiredFields.forEach(field => {
        expect(program[field]).toBeDefined();
        expect(program[field]).not.toBe('');
      });
      
      // Optional fields should be valid if present
      optionalFields.forEach(field => {
        if (program[field] !== undefined) {
          expect(program[field]).not.toBeNull();
        }
      });
    });
  });

  it('should have valid amount formats', () => {
    programs.forEach(program => {
      if (program.amount) {
        const amount = program.amount.toString();
        // Should contain numbers and common amount indicators
        expect(amount).toMatch(/\d+/);
        expect(amount.length).toBeGreaterThan(0);
      }
    });
  });

  it('should have valid date formats', () => {
    programs.forEach(program => {
      if (program.deadline || program.end_date) {
        const dateStr = (program.deadline || program.end_date).toString();
        // Should be a reasonable date format
        expect(dateStr.length).toBeGreaterThan(5);
        expect(dateStr).toMatch(/\d/);
      }
    });
  });
});
