// ========= PLAN2FUND — PROGRAM WEB SCRAPER =========
// Comprehensive web scraper for Austrian/EU funding programs

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ProgramScraper {
  constructor() {
    this.browser = null;
    this.scrapedPrograms = new Map();
    this.errors = [];
    this.stats = {
      totalPrograms: 0,
      successful: 0,
      failed: 0,
      updated: 0,
      new: 0
    };
  }

  async initialize() {
    console.log('🚀 Initializing web scraper...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeAllPrograms() {
    console.log('📊 Starting comprehensive program scraping...');
    
    const sources = [
      {
        name: 'aws',
        baseUrl: 'https://www.aws.at',
        programs: [
          '/en/aws-preseed-innovative-solutions/',
          '/en/aws-preseed-seedfinancing-deep-tech/',
          '/en/aws-guarantee/',
          '/en/aws-export-guarantee/',
          '/en/aws-equity-investment/'
        ]
      },
      {
        name: 'ffg',
        baseUrl: 'https://www.ffg.at',
        programs: [
          '/en/programmes',
          '/en/basic-research-programme',
          '/en/innovation-programmes'
        ]
      },
      {
        name: 'wirtschaftsagentur',
        baseUrl: 'https://www.wirtschaftsagentur.at',
        programs: [
          '/en/funding/',
          '/en/innovation-scheque/'
        ]
      }
    ];

    for (const source of sources) {
      console.log(`\n🔍 Scraping ${source.name}...`);
      await this.scrapeSource(source);
    }

    await this.generateReport();
    await this.cleanup();
  }

  async scrapeSource(source) {
    for (const programPath of source.programs) {
      try {
        const url = source.baseUrl + programPath;
        console.log(`  📄 Scraping: ${url}`);
        
        const program = await this.scrapeProgram(url, source.name);
        if (program) {
          this.scrapedPrograms.set(program.programId, program);
          this.stats.successful++;
        }
      } catch (error) {
        console.error(`  ❌ Failed to scrape ${programPath}:`, error.message);
        this.errors.push({ url: source.baseUrl + programPath, error: error.message });
        this.stats.failed++;
      }
    }
  }

  async scrapeProgram(url, source) {
    const page = await this.browser.newPage();
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract program information
      const program = await this.extractProgramData($, url, source);
      
      // Extract requirements
      program.eligibility = await this.extractEligibility($);
      program.documents = await this.extractDocuments($);
      program.financial = await this.extractFinancial($);
      program.technical = await this.extractTechnical($);
      
      // Generate decision tree questions
      program.decisionTreeQuestions = this.generateDecisionTreeQuestions(program);
      
      // Generate editor sections
      program.editorSections = this.generateEditorSections(program);
      
      // Generate readiness criteria
      program.readinessCriteria = this.generateReadinessCriteria(program);
      
      return program;
      
    } finally {
      await page.close();
    }
  }

  async extractProgramData($, url, source) {
    const program = {
      programId: this.generateProgramId(url),
      programName: this.extractProgramName($),
      programType: this.extractProgramType($, url),
      jurisdiction: 'AT',
      sourceUrl: url,
      source: source,
      fundingAmount: this.extractFundingAmount($),
      projectDuration: this.extractProjectDuration($),
      deadlines: this.extractDeadlines($),
      targetPersonas: this.extractTargetPersonas($),
      tags: this.extractTags($),
      description: this.extractDescription($),
      contact: this.extractContact($),
      metadata: {
        scrapedAt: new Date().toISOString(),
        version: '1.0',
        confidence: 'medium'
      }
    };

    return program;
  }

  generateProgramId(url) {
    // Extract program ID from URL
    const pathParts = url.split('/').filter(part => part);
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  extractProgramName($) {
    // Try multiple selectors for program name
    const selectors = [
      'h1',
      '.program-title',
      '.page-title',
      'title',
      '.hero-title'
    ];
    
    for (const selector of selectors) {
      const name = $(selector).first().text().trim();
      if (name && name.length > 3) {
        return name;
      }
    }
    
    return 'Unknown Program';
  }

  extractProgramType($, url) {
    // Determine program type from content and URL
    const content = $.text().toLowerCase();
    const urlLower = url.toLowerCase();
    
    if (content.includes('grant') || content.includes('förderung') || urlLower.includes('preseed')) {
      return 'grant';
    } else if (content.includes('loan') || content.includes('kredit') || content.includes('darlehen')) {
      return 'loan';
    } else if (content.includes('equity') || content.includes('investment') || content.includes('beteiligung')) {
      return 'equity';
    } else if (content.includes('visa') || content.includes('aufenthalt')) {
      return 'visa';
    } else if (content.includes('ams') || content.includes('arbeitsmarktservice')) {
      return 'ams';
    }
    
    return 'grant'; // Default
  }

  extractFundingAmount($) {
    const content = $.text();
    const amountRegex = /(?:€|EUR|euro)\s*([0-9,.\s]+)\s*(?:max|maximum|bis zu|up to)/i;
    const match = content.match(amountRegex);
    
    if (match) {
      const amount = parseInt(match[1].replace(/[,\s]/g, ''));
      return {
        min: 0,
        max: amount,
        currency: 'EUR',
        raw: match[0]
      };
    }
    
    return { min: 0, max: 0, currency: 'EUR' };
  }

  extractProjectDuration($) {
    const content = $.text();
    const durationRegex = /(\d+)\s*(?:months?|monate?|m)/i;
    const match = content.match(durationRegex);
    
    if (match) {
      const duration = parseInt(match[1]);
      return {
        min: duration,
        max: duration,
        unit: 'months'
      };
    }
    
    return { min: 0, max: 0, unit: 'months' };
  }

  extractDeadlines($) {
    const content = $.text();
    
    // Look for deadline information
    const deadlineRegex = /(?:deadline|frist|einsendeschluss|bewerbung)\s*:?\s*([^.\n]+)/i;
    const match = content.match(deadlineRegex);
    
    if (match) {
      return {
        submission: match[1].trim(),
        nextDeadline: null
      };
    }
    
    return { submission: 'ongoing', nextDeadline: null };
  }

  extractTargetPersonas($) {
    const content = $.text().toLowerCase();
    const personas = [];
    
    if (content.includes('startup') || content.includes('gründer') || content.includes('entrepreneur')) {
      personas.push('solo');
    }
    if (content.includes('company') || content.includes('unternehmen') || content.includes('sme')) {
      personas.push('sme');
    }
    if (content.includes('university') || content.includes('universität') || content.includes('research')) {
      personas.push('university');
    }
    if (content.includes('advisor') || content.includes('berater')) {
      personas.push('advisor');
    }
    
    return personas.length > 0 ? personas : ['solo', 'sme'];
  }

  extractTags($) {
    const content = $.text().toLowerCase();
    const tags = [];
    
    const tagKeywords = {
      'innovation': ['innovation', 'innovativ', 'research', 'forschung'],
      'startup': ['startup', 'gründer', 'entrepreneur'],
      'non-dilutive': ['grant', 'förderung', 'zuschuss'],
      'dilutive': ['equity', 'investment', 'beteiligung'],
      'sustainability': ['sustainability', 'nachhaltigkeit', 'climate', 'klima'],
      'health': ['health', 'gesundheit', 'medical', 'medizin'],
      'technology': ['technology', 'technologie', 'digital', 'ai', 'artificial intelligence']
    };
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  extractDescription($) {
    // Try to find program description
    const selectors = [
      '.program-description',
      '.description',
      '.content',
      'p'
    ];
    
    for (const selector of selectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 50) {
        return desc.substring(0, 500) + '...';
      }
    }
    
    return '';
  }

  extractContact($) {
    // Extract contact information
    const content = $.text();
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(\+43\s?\d{1,4}\s?\d{1,4}\s?\d{1,4})/g;
    
    const emails = content.match(emailRegex) || [];
    const phones = content.match(phoneRegex) || [];
    
    return {
      emails: [...new Set(emails)],
      phones: [...new Set(phones)]
    };
  }

  async extractEligibility($) {
    const eligibility = [];
    const content = $.text();
    
    // Look for eligibility criteria
    const eligibilityKeywords = [
      'eligible', 'eligibility', 'voraussetzung', 'bedingung',
      'who can apply', 'wer kann sich bewerben', 'teilnahmeberechtigt'
    ];
    
    // Simple extraction - in reality, you'd use more sophisticated NLP
    const lines = content.split('\n');
    let inEligibilitySection = false;
    
    for (const line of lines) {
      const lineLower = line.toLowerCase().trim();
      
      if (eligibilityKeywords.some(keyword => lineLower.includes(keyword))) {
        inEligibilitySection = true;
        continue;
      }
      
      if (inEligibilitySection && line.trim().length > 10) {
        if (line.includes('•') || line.includes('-') || line.includes('*')) {
          const requirement = line.replace(/^[•\-*]\s*/, '').trim();
          if (requirement.length > 10) {
            eligibility.push({
              id: `elig_${eligibility.length + 1}`,
              category: 'eligibility',
              type: 'boolean',
              title: requirement,
              description: requirement,
              isRequired: true,
              priority: 'high',
              validationRules: [{ type: 'required', message: 'This requirement must be met' }],
              examples: [],
              guidance: 'Verify this requirement is met'
            });
          }
        }
      }
    }
    
    return eligibility;
  }

  async extractDocuments($) {
    const documents = [];
    const content = $.text();
    
    // Look for document requirements
    const documentKeywords = [
      'document', 'dokument', 'application', 'bewerbung',
      'business plan', 'geschäftsplan', 'proposal', 'antrag'
    ];
    
    const lines = content.split('\n');
    let inDocumentSection = false;
    
    for (const line of lines) {
      const lineLower = line.toLowerCase().trim();
      
      if (documentKeywords.some(keyword => lineLower.includes(keyword))) {
        inDocumentSection = true;
        continue;
      }
      
      if (inDocumentSection && line.trim().length > 5) {
        if (line.includes('•') || line.includes('-') || line.includes('*')) {
          const doc = line.replace(/^[•\-*]\s*/, '').trim();
          if (doc.length > 5) {
            documents.push({
              id: `doc_${documents.length + 1}`,
              category: 'documentation',
              type: 'document',
              title: doc,
              description: doc,
              isRequired: true,
              priority: 'high',
              format: 'PDF',
              guidance: 'Submit this document as part of your application'
            });
          }
        }
      }
    }
    
    return documents;
  }

  async extractFinancial($) {
    const financial = [];
    const content = $.text();
    
    // Extract financial requirements
    const amountRegex = /(?:€|EUR)\s*([0-9,.\s]+)/g;
    const matches = content.match(amountRegex);
    
    if (matches) {
      financial.push({
        id: 'fin_1',
        category: 'financial',
        type: 'numeric',
        title: 'Funding Amount',
        description: 'Requested funding amount',
        isRequired: true,
        priority: 'critical',
        validationRules: [
          { type: 'required', message: 'Funding amount is required' }
        ],
        examples: matches.slice(0, 3),
        guidance: 'Specify the amount you are requesting'
      });
    }
    
    return financial;
  }

  async extractTechnical($) {
    const technical = [];
    const content = $.text().toLowerCase();
    
    // Look for technical requirements
    if (content.includes('trl') || content.includes('technology readiness')) {
      technical.push({
        id: 'tech_1',
        category: 'technical',
        type: 'selection',
        title: 'Technology Readiness Level',
        description: 'Current TRL of the technology',
        isRequired: true,
        priority: 'high',
        options: [
          { value: 'TRL_1_2', label: 'Basic research' },
          { value: 'TRL_3_4', label: 'Proof of concept' },
          { value: 'TRL_5_6', label: 'Prototype' },
          { value: 'TRL_7_8', label: 'Ready for market' }
        ],
        guidance: 'Assess your current technology maturity level'
      });
    }
    
    return technical;
  }

  generateDecisionTreeQuestions(program) {
    const questions = [];
    
    // Generate questions based on program requirements
    if (program.eligibility.length > 0) {
      questions.push({
        id: 'q_company_stage',
        requirementId: 'elig_1',
        question: 'What is your company stage?',
        type: 'single',
        options: [
          { value: 'PRE_COMPANY', label: 'Just an idea or team forming' },
          { value: 'INC_LT_6M', label: 'Recently started (less than 6 months)' },
          { value: 'INC_6_36M', label: 'Early stage (6 months to 3 years)' },
          { value: 'INC_GT_36M', label: 'Established business (over 3 years)' }
        ],
        validation: [{ type: 'required', message: 'Company stage is required' }],
        followUpQuestions: [],
        skipConditions: []
      });
    }
    
    if (program.financial.length > 0) {
      questions.push({
        id: 'q_funding_amount',
        requirementId: 'fin_1',
        question: 'How much funding are you seeking?',
        type: 'number',
        options: [],
        validation: [
          { type: 'required', message: 'Funding amount is required' },
          { type: 'min', value: 1000, message: 'Minimum amount is €1,000' },
          { type: 'max', value: program.fundingAmount.max, message: `Maximum amount is €${program.fundingAmount.max}` }
        ],
        followUpQuestions: [],
        skipConditions: []
      });
    }
    
    return questions;
  }

  generateEditorSections(program) {
    const sections = [];
    
    // Generate editor sections based on program type
    const baseSections = [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        required: true,
        template: `Our business, [PROJECT_NAME], is seeking [FUNDING_AMOUNT] in ${program.programType} funding to [PROJECT_GOAL].`,
        guidance: 'Keep concise but compelling. Highlight innovation and impact.',
        requirements: ['elig_1', 'fin_1'],
        prefillData: {
          PROJECT_NAME: 'answers.business_name',
          FUNDING_AMOUNT: 'answers.funding_amount',
          PROJECT_GOAL: 'answers.project_goal'
        }
      },
      {
        id: 'project_description',
        title: 'Project Description',
        required: true,
        template: `## Project Overview\n\n[PROJECT_DESCRIPTION]\n\n## Technical Approach\n\n[TECHNICAL_APPROACH]`,
        guidance: 'Focus on innovation, feasibility, and alignment with program goals.',
        requirements: ['tech_1'],
        prefillData: {
          PROJECT_DESCRIPTION: 'answers.project_description',
          TECHNICAL_APPROACH: 'answers.technical_approach'
        }
      }
    ];
    
    // Add program-specific sections
    if (program.programType === 'grant') {
      sections.push({
        id: 'financial_plan',
        title: 'Financial Planning',
        required: true,
        template: `## Funding Request\n\n**Amount**: €[FUNDING_AMOUNT]\n**Duration**: [PROJECT_DURATION] months\n\n## Budget Breakdown\n\n[BUDGET_BREAKDOWN]`,
        guidance: 'Include detailed budget breakdown and funding requirements.',
        requirements: ['fin_1'],
        prefillData: {
          FUNDING_AMOUNT: 'answers.funding_amount',
          PROJECT_DURATION: 'answers.project_duration',
          BUDGET_BREAKDOWN: 'answers.budget_breakdown'
        }
      });
    }
    
    return [...baseSections, ...sections];
  }

  generateReadinessCriteria(program) {
    const criteria = [];
    
    // Generate readiness criteria based on requirements
    program.eligibility.forEach((req, index) => {
      criteria.push({
        id: `criterion_${index + 1}`,
        requirementId: req.id,
        title: req.title,
        description: req.description,
        checkType: 'validation',
        validator: `function(data) { return { passed: true, message: 'Requirement met', score: 100 }; }`,
        weight: req.priority === 'critical' ? 1.0 : 0.5
      });
    });
    
    return criteria;
  }

  async generateReport() {
    console.log('\n📊 Scraping Report');
    console.log('==================');
    console.log(`Total Programs: ${this.stats.totalPrograms}`);
    console.log(`Successful: ${this.stats.successful}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Updated: ${this.stats.updated}`);
    console.log(`New: ${this.stats.new}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  ${error.url}: ${error.error}`);
      });
    }
    
    // Save scraped data
    const outputDir = path.join(__dirname, 'scraped-data');
    await fs.mkdir(outputDir, { recursive: true });
    
    const programs = Array.from(this.scrapedPrograms.values());
    await fs.writeFile(
      path.join(outputDir, 'scraped_programs.json'),
      JSON.stringify(programs, null, 2)
    );
    
    console.log(`\n💾 Data saved to: ${outputDir}/scraped_programs.json`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run scraper
async function main() {
  const scraper = new ProgramScraper();
  
  try {
    await scraper.initialize();
    await scraper.scrapeAllPrograms();
  } catch (error) {
    console.error('❌ Scraper failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Export for use in other modules
module.exports = ProgramScraper;

// Run if called directly
if (require.main === module) {
  main();
}
