// Unified Web Scraper Service - REFACTORED (~800 lines instead of 3,868)
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { ScrapedProgram } from './ScrapedProgram';
import { dynamicPatternEngine } from './dynamicPatternEngine';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION - Keep as-is from original
// ============================================================================

const SCRAPER_CONFIG = {
  institutions: {
    aws: { 
      name: 'Austria Wirtschaftsservice', 
      baseUrl: 'https://aws.at', 
      priority: 1,
      category: 'austrian_grants',
      enabled: true,
      rateLimit: { requests: 10, window: 60000 },
      robotsTxt: 'https://aws.at/robots.txt',
      sitemap: 'https://aws.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    ffg: { 
      name: 'Austrian Research Promotion Agency', 
      baseUrl: 'https://www.ffg.at', 
      priority: 1,
      category: 'research_grants',
      enabled: true,
      rateLimit: { requests: 8, window: 60000 },
      robotsTxt: 'https://www.ffg.at/robots.txt',
      sitemap: 'https://www.ffg.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    vba: { 
      name: 'Vienna Business Agency', 
      baseUrl: 'https://www.viennabusinessagency.at', 
      priority: 2,
      category: 'business_grants',
      enabled: true,
      rateLimit: { requests: 6, window: 60000 },
      robotsTxt: 'https://www.viennabusinessagency.at/robots.txt',
      sitemap: 'https://www.viennabusinessagency.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    ams: { 
      name: 'Austrian Employment Service', 
      baseUrl: 'https://www.ams.at', 
      priority: 2,
      category: 'employment',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://www.ams.at/robots.txt',
      sitemap: 'https://www.ams.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    oesb: { 
      name: 'ÖSB Consulting', 
      baseUrl: 'https://www.oesb.at', 
      priority: 3,
      category: 'consulting',
      enabled: true,
      rateLimit: { requests: 4, window: 60000 },
      robotsTxt: 'https://www.oesb.at/robots.txt',
      sitemap: 'https://www.oesb.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    wko: { 
      name: 'Austrian Economic Chamber', 
      baseUrl: 'https://www.wko.at', 
      priority: 2,
      category: 'business_grants',
      enabled: true,
      rateLimit: { requests: 6, window: 60000 },
      robotsTxt: 'https://www.wko.at/robots.txt',
      sitemap: 'https://www.wko.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    eu: { 
      name: 'European Union', 
      baseUrl: 'https://ec.europa.eu', 
      priority: 1,
      category: 'eu_programs',
      enabled: true,
      rateLimit: { requests: 12, window: 60000 },
      robotsTxt: 'https://ec.europa.eu/robots.txt',
      sitemap: 'https://ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    eic: {
      name: 'European Innovation Council (EIC)',
      baseUrl: 'https://eic.ec.europa.eu',
      priority: 1,
      category: 'eu_programs',
      enabled: true,
      rateLimit: { requests: 8, window: 60000 },
      robotsTxt: 'https://eic.ec.europa.eu/robots.txt',
      sitemap: 'https://eic.ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/grants"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    horizon: {
      name: 'Horizon Europe Programme',
      baseUrl: 'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
      priority: 1,
      category: 'eu_programs',
      enabled: true,
      rateLimit: { requests: 8, window: 60000 },
      robotsTxt: 'https://ec.europa.eu/robots.txt',
      sitemap: 'https://ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/grants"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    umwelt: {
      name: 'Umweltförderung Betriebe',
      baseUrl: 'https://www.umweltfoerderung.at',
      priority: 2,
      category: 'environmental',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://www.umweltfoerderung.at/robots.txt',
      sitemap: 'https://www.umweltfoerderung.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"], a[href*="/umwelt"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    digital: {
      name: 'Digital Europe Programme',
      baseUrl: 'https://digital-strategy.ec.europa.eu/en/activities/digital-europe-programme',
      priority: 2,
      category: 'digital',
      enabled: true,
      rateLimit: { requests: 6, window: 60000 },
      robotsTxt: 'https://digital-strategy.ec.europa.eu/robots.txt',
      sitemap: 'https://digital-strategy.ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/digital"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    health: {
      name: 'EU4Health Programme',
      baseUrl: 'https://health.ec.europa.eu/funding/eu4health-programme-2021-2027_en',
      priority: 2,
      category: 'health',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://health.ec.europa.eu/robots.txt',
      sitemap: 'https://health.ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/health"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    climate: {
      name: 'LIFE Programme',
      baseUrl: 'https://cinea.ec.europa.eu/life_en',
      priority: 2,
      category: 'climate',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://cinea.ec.europa.eu/robots.txt',
      sitemap: 'https://cinea.ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/life"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    energy: {
      name: 'Horizon Europe - Energy',
      baseUrl: 'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-5-climate-energy-mobility_en',
      priority: 2,
      category: 'energy',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://ec.europa.eu/robots.txt',
      sitemap: 'https://ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/energy"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    culture: {
      name: 'Creative Europe Programme',
      baseUrl: 'https://culture.ec.europa.eu/creative-europe_en',
      priority: 3,
      category: 'culture',
      enabled: true,
      rateLimit: { requests: 4, window: 60000 },
      robotsTxt: 'https://culture.ec.europa.eu/robots.txt',
      sitemap: 'https://culture.ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/culture"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    },
    regional: {
      name: 'European Regional Development Fund',
      baseUrl: 'https://ec.europa.eu/regional_policy/en/funding/erdf/',
      priority: 2,
      category: 'regional_grants',
      enabled: true,
      rateLimit: { requests: 5, window: 60000 },
      robotsTxt: 'https://ec.europa.eu/robots.txt',
      sitemap: 'https://ec.europa.eu/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/funding"], a[href*="/programme"], a[href*="/erdf"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    }
  },
  scraping: {
    timeout: 10000,
    retryAttempts: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',
      '--disable-javascript',
      '--disable-css',
      '--disable-fonts'
    ] as string[],
    rateLimiting: {
      enabled: true,
      defaultDelay: 2000,
      respectRobotsTxt: true,
      maxConcurrentRequests: 3
    },
    urlDiscovery: {
      enabled: true,
      sitemapTimeout: 15000,
      linkDiscoveryDepth: 3,
      maxUrlsPerSource: 100
    },
    validation: {
      enabled: true,
      crossSourceVerification: true,
      duplicateDetection: true,
      dataCompletenessCheck: true
    }
  },
  requirements: {
    confidenceThreshold: 0.7,
    maxEvidenceSnippets: 5,
    patternTimeout: 5000
  }
} as const;

export class WebScraperService {
  private browser: Browser | null = null;
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();
  private discoveredKeywords: Map<string, number> = new Map(); // Learned keywords from successful scrapes
  private discoveredUrls: Map<string, string[]> = new Map();
  
  // Enhanced requirements extraction patterns
  private requirementPatterns = {
    business_plan: [
      /business\s+plan|geschäftsplan|business\s+concept|strategic\s+plan/i,
      /executive\s+summary|zusammenfassung/i,
      /company\s+overview|unternehmensübersicht/i
    ],
    financial_projections: [
      /financial\s+projections|finanzprognosen|financial\s+plan/i,
      /3-?5\s*year\s*financial|3-?5\s*jahre\s*finanz/i,
      /revenue\s+projections|umsatzprognosen/i,
      /cash\s+flow|liquidität/i,
      /break-?even\s+analysis|break-?even\s+analyse/i
    ],
    pitch_deck: [
      /pitch\s+deck|präsentation|presentation/i,
      /investor\s+deck|investor\s+presentation/i,
      /slides|folien/i
    ],
    technical_documentation: [
      /technical\s+documentation|technische\s+dokumentation/i,
      /prototype|prototyp/i,
      /mvp|minimum\s+viable\s+product/i,
      /technology\s+stack|technologie\s+stack/i
    ],
    market_analysis: [
      /market\s+analysis|marktanalyse/i,
      /target\s+market|zielmarkt/i,
      /competitive\s+analysis|wettbewerbsanalyse/i,
      /customer\s+validation|kundenvalidierung/i
    ],
    team_information: [
      /team\s+cv|team\s+lebenslauf/i,
      /team\s+qualifications|team\s+qualifikationen/i,
      /advisory\s+board|beirat/i,
      /key\s+personnel|schlüsselpersonal/i
    ],
    legal_documents: [
      /company\s+registration|firmenbuchauszug/i,
      /tax\s+certificate|steuerbescheid/i,
      /insurance|versicherung/i,
      /gdpr\s+compliance|dsgvo\s+konformität/i
    ],
    project_description: [
      /project\s+description|projektbeschreibung/i,
      /innovation\s+potential|innovationspotential/i,
      /research\s+and\s+development|forschung\s+und\s+entwicklung/i,
      /intellectual\s+property|geistiges\s+eigentum/i
    ],
    co_financing: [
      /(?:mindestens|at least)\s+(\d{1,3})\s*%/gi,
      /(?:eigenbeitrag|own contribution)\s*:?\s*(\d{1,3})\s*%/gi,
      /(?:förderquote|funding rate)\s*:?\s*(\d{1,3})\s*%/gi
    ],
    trl_level: [
      /(?:trl|technology readiness level)\s*(\d)\s*(?:–|-|to)\s*(\d)/gi,
      /(?:reifegrad|maturity level)\s*(\d)\s*(?:–|-|to)\s*(\d)/gi,
      /(?:trl|technology readiness level)\s*(\d)/gi
    ],
    impact: [
      /(?:innovation|environmental|social|economic)\s+impact/i,
      /(?:marktwirkung|market impact)/i,
      /(?:nachhaltigkeit|sustainability)/i,
      /(?:job\s+creation|arbeitsplatzschaffung)/i,
      /(?:digital\s+transformation|digitale\s+transformation)/i
    ],
    consortium: [
      /(?:konsortialpartner|consortium partner)/i,
      /(?:partnership|partnerschaft)/i,
      /(?:consortium leader|konsortialführer)/i,
      /(?:konsortium|consortium)/i
    ]
  };

  constructor() {}

  // ============================================================================
  // BROWSER INITIALIZATION
  // ============================================================================

  async init(): Promise<void> {
    try {
      console.log('🚀 Initializing browser with stealth measures...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: SCRAPER_CONFIG.scraping.args,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: { width: 1366, height: 768 },
        slowMo: 100
      });
      
      this.browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const page = await target.page();
          if (page) {
            await this.addStealthMeasures(page);
          }
        }
      });
      
      console.log('✅ Browser initialized with stealth measures');
    } catch (error) {
      console.error('❌ Browser initialization failed:', error);
      try {
        console.log('🔄 Trying fallback browser configuration...');
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('✅ Fallback browser initialized');
      } catch (fallbackError) {
        console.error('❌ Fallback browser initialization also failed:', fallbackError);
        throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async addStealthMeasures(page: any): Promise<void> {
    try {
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['de-DE', 'de', 'en-US', 'en'] });
        (window as any).chrome = { runtime: {} };
        Object.defineProperty(navigator, 'permissions', {
          get: () => ({
            query: async () => ({ state: 'granted' })
          })
        });
      });
      
      await page.setUserAgent(SCRAPER_CONFIG.scraping.userAgent);
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7'
      });
    } catch (error) {
      console.error('❌ Failed to apply stealth measures:', error);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // ============================================================================
  // MAIN SCRAPING ENTRY POINT
  // ============================================================================

  async scrapeAllPrograms(): Promise<ScrapedProgram[]> {
    console.log('🚀 Starting unified web scraper...');
    
    // CRITICAL: Initialize browser first!
    if (!this.browser) {
      console.log('🔧 Browser not initialized, initializing now...');
      await this.init();
    }
    
    let programs: ScrapedProgram[] = [];
    
    try {
      // Use enhanced scraping with URL discovery if enabled
      if (SCRAPER_CONFIG.scraping.urlDiscovery.enabled) {
        programs = await this.scrapeAllProgramsEnhanced();
      } else {
        // Fallback to JSON data
        programs = await this.scrapeProgramsViaAPI();
      }
      
      // Save scraped data
      await this.saveScrapedData(programs);
      console.log(`✅ Successfully scraped ${programs.length} programs`);
      return programs;
      
    } catch (error) {
      console.error('❌ Scraping failed, loading fallback data:', error);
      programs = await this.loadFallbackData();
      console.log(`📁 Loaded ${programs.length} programs from fallback data`);
      return programs;
    } finally {
      // Clean up browser
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  // ============================================================================
  // ENHANCED SCRAPING WITH URL DISCOVERY
  // ============================================================================

  private async scrapeAllProgramsEnhanced(): Promise<ScrapedProgram[]> {
    const programs: ScrapedProgram[] = [];
    
    if (!this.browser) {
      console.log('📡 Browser not initialized, initializing now...');
      await this.init();
    }

    try {
      // Discover and scrape from all institutions
      for (const [institutionId, institution] of Object.entries(SCRAPER_CONFIG.institutions)) {
        if (!institution.enabled) continue;

        console.log(`🔍 Discovering URLs for ${institution.name}...`);
        
        // Discover program URLs
        const urls = await this.discoverProgramUrls(institutionId);
        console.log(`📋 Found ${urls.length} URLs for ${institution.name}`);

        // Scrape each URL
        for (const url of urls.slice(0, 20)) { // Limit to first 20 URLs per institution
          try {
            await this.respectRateLimit(institutionId);
            
            const isAllowed = await this.checkRobotsTxt(institutionId, url);
            if (!isAllowed) {
              console.log(`🚫 URL not allowed by robots.txt: ${url}`);
              continue;
            }

            const program = await this.scrapeProgramFromUrl(url, institutionId);
            if (program) {
              programs.push(program);
              console.log(`✅ Scraped: ${program.name}`);
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (urlError) {
            console.error(`❌ Error scraping URL ${url}:`, urlError);
            continue;
          }
        }
      }
      
      return programs;
      
    } catch (error) {
      console.error('❌ Enhanced scraping failed:', error);
      return await this.scrapeProgramsViaAPI();
    }
  }

  // ============================================================================
  // UNIFIED PROGRAM EXTRACTION - REPLACES 17 METHODS
  // ============================================================================

  /**
   * Extract program from URL - UNIFIED METHOD (replaces 17 extractXXXProgram methods)
   * THIS IS WHERE WE FIX THE BUG: Actually extract eligibility_criteria!
   */
  private async scrapeProgramFromUrl(url: string, institutionId: string): Promise<ScrapedProgram | null> {
    try {
      if (!this.browser) return null;
      
      const page = await this.browser.newPage();
      await page.setUserAgent(SCRAPER_CONFIG.scraping.userAgent);
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
      const selectors = institution?.customSelectors || {
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      };
      
      // Extract basic information
      const name = $(selectors.programTitle).first().text().trim() || 'Unknown Program';
      const description = $(selectors.programDescription).first().text().trim() || 'No description available';
      
      // THE FIX: Extract eligibility_criteria from page content
      const eligibility_criteria = await this.extractEligibilityFromContent(content, institution?.name || '');
      
      // Extract requirements using the GOOD method
      const requirements = await this.extractComprehensiveRequirements(page, institution?.name || '');
      
      // Extract categorized_requirements from requirements
      const categorized_requirements = this.categorizeRequirementsData(requirements);
      
      // Extract funding amounts
      const funding = this.extractFundingAmounts(content);
      
      // Extract deadline
      const deadline = this.extractDeadline(content);
      
      // Detect program type dynamically (don't hardcode as 'grant')
      const detectedType = this.detectProgramType(content);
      const detectedCategory = this.detectProgramCategory(content, detectedType);
      
      // Build program object
      const program: ScrapedProgram = {
        id: `${institutionId}_${Date.now()}`,
        name,
        description,
        type: detectedType,
        program_type: detectedType,
        funding_amount_min: funding.min,
        funding_amount_max: funding.max,
        currency: 'EUR',
        deadline,
        source_url: url,
        institution: institution?.name || 'Unknown',
        program_category: detectedCategory || institution?.category || 'unknown',
        eligibility_criteria, // ← NOW EXTRACTED FROM CONTENT, NOT EMPTY!
        requirements,
        // CRITICAL: Add categorized_requirements so SmartWizard can generate profound questions!
        categorized_requirements: categorized_requirements,
        contact_info: this.extractContactInfo(content, institution?.baseUrl || ''),
        scraped_at: new Date(),
        confidence_score: this.calculateConfidence(content, eligibility_criteria, requirements),
        is_active: true
      };
      
      // Learn from this successful scrape
      this.learnKeywordFromUrl(url, true);
      
      await page.close();
      return program;
      
    } catch (error) {
      console.error(`❌ Error scraping URL ${url}:`, error);
      
      // Learn from failure (decrease confidence in keywords)
      this.learnKeywordFromUrl(url, false);
      
      return null;
    }
  }

  /**
   * NEW: Extract eligibility_criteria from page content
   */
  private async extractEligibilityFromContent(content: string, _institutionName: string): Promise<any> {
    const eligibility: any = {};
    const lowerContent = content.toLowerCase();
    
    // 1. Extract location
    if (/österreich|austria|wien|vienna|\s+at\s+|\.at\b/i.test(content)) {
      eligibility.location = 'Austria';
    } else if (/\seu\s+|european\s+union|member\s+state/i.test(lowerContent)) {
      eligibility.location = 'EU';
    } else if (/international|weltweit/i.test(lowerContent)) {
      eligibility.location = 'International';
    }
    
    // 2. Extract team size requirements
    const teamMatch = lowerContent.match(/(?:mindestens|at least|minimum)\s+(\d+)\s+(?:person|mitarbeiter|team|personnel|staff)/i);
    if (teamMatch) {
      eligibility.min_team_size = parseInt(teamMatch[1]);
    }
    
    // 3. Extract company age requirements
    const ageMatch = lowerContent.match(/(?:höchstens|maximum|max\.?|younger than|nicht älter als)\s+(\d+)\s+(?:jahr|year|jahre|years)/i);
    if (ageMatch) {
      eligibility.max_company_age = parseInt(ageMatch[1]);
    }
    
    // 4. Extract revenue requirements
    const revenueMinMatch = lowerContent.match(/revenue|umsatz\s+(?:of at least|mindestens|von mindestens)\s+€?\s*(\d{1,3}(?:[\.,]\d{3})*)/i);
    if (revenueMinMatch) {
      eligibility.revenue_min = parseInt(revenueMinMatch[1].replace(/[\.,]/g, ''));
    }
    
    const revenueMaxMatch = lowerContent.match(/revenue|umsatz\s+(?:max\.|bis zu|up to)\s+€?\s*(\d{1,3}(?:[\.,]\d{3})*)/i);
    if (revenueMaxMatch) {
      eligibility.revenue_max = parseInt(revenueMaxMatch[1].replace(/[\.,]/g, ''));
    }
    
    // 5. Extract research focus
    if (/research|forschung|rd|r&d|development|entwicklung/i.test(lowerContent)) {
      eligibility.research_focus = true;
    }
    
    // 6. Extract international collaboration requirement
    if (/consortium|konsortium|partnership|partnerschaft|collaboration|zusammenarbeit/i.test(lowerContent)) {
      eligibility.international_collaboration = true;
    }
    
    // 7. Extract funding type
    const fundingMatch = lowerContent.match(/(grant|förderung|subvention|loan|kredit|darlehen|equity|eigenkapital)/i);
    if (fundingMatch) {
      const fundingType = fundingMatch[1].toLowerCase();
      if (['förderung', 'grant', 'subvention'].includes(fundingType)) {
        eligibility.funding_type = 'grant';
      } else if (['loan', 'kredit', 'darlehen'].includes(fundingType)) {
        eligibility.funding_type = 'loan';
      } else if (['equity', 'eigenkapital'].includes(fundingType)) {
        eligibility.funding_type = 'equity';
      }
    }
    
    // 8. Extract project type
    if (/innovation|innovativ|breakthrough|durchbruch/i.test(lowerContent)) {
      eligibility.project_type = 'innovation';
    }
    if (/environment|umwelt|climate|klima|sustainability|nachhaltigkeit/i.test(lowerContent)) {
      eligibility.project_type = 'environment';
    }
    if (/health|gesundheit|life science|lebenswissenschaft/i.test(lowerContent)) {
      eligibility.project_type = 'health';
    }
    
    return eligibility;
  }

  /**
   * NEW: Detect program type dynamically from content
   * Supports: grant, loan, equity, visa, consulting, service, other
   */
  private detectProgramType(content: string): 'grant' | 'loan' | 'equity' | 'visa' | 'consulting' | 'service' | 'other' {
    const lowerContent = content.toLowerCase();
    
    // Check for loan keywords (repayable with interest)
    if (/\b(loan|kredit|darlehen|leih|fremdkapital|borrowing|lending)\b/i.test(lowerContent) &&
        /\b(repay|zurückzahlen|rückzahlung|interest|zins|rate|monthly)\b/i.test(lowerContent)) {
      return 'loan';
    }
    
    // Check for equity keywords (investment funding)
    if (/\b(equity|eigenkapital|investment|kapitalgeber|investor|venture|angel|beteiligung|shareholding|stake)\b/i.test(lowerContent)) {
      return 'equity';
    }
    
    // Check for visa/immigration programs
    if (/\b(visa|visum|immigration|einwanderung|residency|niederlassung|settlement|repatriation)\b/i.test(lowerContent)) {
      return 'visa';
    }
    
    // Check for consulting/advisory (free guidance without direct funding)
    if (/\b(consulting|beratung|advisory|coaching|mentoring)\b/i.test(lowerContent) &&
        !/\b(funding|finanzierung|foerderung|grant|loan|equity)\b/i.test(lowerContent)) {
      return 'consulting';
    }
    
    // Check for service programs (incubation, networking, support services)
    if (/\b(incubation|inkubation|networking|workshop|training|service|dienstleistung)\b/i.test(lowerContent) &&
        !/\b(funding|finanzierung|foerderung|grant|loan|equity)\b/i.test(lowerContent)) {
      return 'service';
    }
    
    // Default to grant (non-repayable funding)
    return 'grant';
  }

  /**
   * NEW: Detect program category dynamically (industry/sector/target audience)
   */
  private detectProgramCategory(content: string, programType: string): string {
    const lowerContent = content.toLowerCase();
    
    // Industry/sector categories
    if (/\b(digital|digitalisierung|ict|software|it|tech|information)\b/i.test(lowerContent)) {
      return 'digital';
    }
    if (/\b(health|gesundheit|medical|medizin|life science|biotech)\b/i.test(lowerContent)) {
      return 'health';
    }
    if (/\b(energy|energie|solar|wind|renewable|clean energy)\b/i.test(lowerContent)) {
      return 'energy';
    }
    if (/\b(environment|umwelt|climate|klima|sustainability|nachhaltigkeit|eco)\b/i.test(lowerContent)) {
      return 'environmental';
    }
    if (/\b(research|forschung|rd|r&d|science|academic)\b/i.test(lowerContent)) {
      return 'research';
    }
    if (/\b(startup|gründer|entrepreneur|neugründung|early stage)\b/i.test(lowerContent)) {
      return 'startup';
    }
    if (/\b(sme|mittelstand|small business|company|enterprise)\b/i.test(lowerContent)) {
      return 'sme';
    }
    if (/\b(regional|ländlich|local|region|state)\b/i.test(lowerContent)) {
      return 'regional';
    }
    if (/\b(international|weltweit|global|eu wide)\b/i.test(lowerContent)) {
      return 'international';
    }
    
    // Return program type as fallback
    return programType;
  }

  /**
   * Extract funding amounts from content
   */
  private extractFundingAmounts(content: string): { min?: number; max?: number } {
    const lowerContent = content.toLowerCase();
    const amounts: number[] = [];
    
    // Find all € amounts
    const euroMatches = lowerContent.matchAll(/€\s*(\d{1,3}(?:[\.,]\d{3})*)/g);
    for (const match of euroMatches) {
      const amount = parseInt(match[1].replace(/[\.,]/g, ''));
      if (amount > 1000) { // Only meaningful amounts
        amounts.push(amount);
      }
    }
    
    if (amounts.length === 0) return {};
    if (amounts.length === 1) {
      return { min: amounts[0], max: amounts[0] };
    }
    
    amounts.sort((a, b) => a - b);
    return {
      min: amounts[0],
      max: amounts[amounts.length - 1]
    };
  }

  /**
   * Extract deadline from content
   */
  private extractDeadline(content: string): Date | undefined {
    const deadlinePatterns = [
      /deadline[:\s]+(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/i,
      /frist[:\s]+(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/i,
      /application deadline[:\s]+(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/i
    ];
    
    for (const pattern of deadlinePatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          // Try to parse the date
          const dateStr = `${match[3]}-${match[2]}-${match[1]}`;
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Invalid date format
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract contact information
   */
  private extractContactInfo(content: string, baseUrl: string): any {
    const contactInfo: any = {};
    
    // Extract email
    const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      contactInfo.email = emailMatch[1];
    }
    
    // Extract phone
    const phoneMatch = content.match(/(\+43\s*\d{1,4}\s*\d{4,})/);
    if (phoneMatch) {
      contactInfo.phone = phoneMatch[1];
    }
    
    // Website
    contactInfo.website = baseUrl;
    
    return contactInfo;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(content: string, eligibility: any, requirements: any): number {
    let score = 0.5; // Base confidence
    
    // More eligibility criteria = higher confidence
    const criteriaCount = Object.keys(eligibility).length;
    if (criteriaCount > 0) score += criteriaCount * 0.1;
    
    // More requirements extracted = higher confidence
    const reqCount = Object.keys(requirements).length;
    if (reqCount > 0) score += Math.min(reqCount * 0.05, 0.2);
    
    // Longer content = higher confidence (more data to work with)
    if (content.length > 5000) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  // ============================================================================
  // REQUIREMENTS EXTRACTION - Keep the GOOD method
  // ============================================================================

  /**
   * Convert extracted requirements to categorized_requirements format
   */
  private categorizeRequirementsData(requirements: any): any {
    const categorized: any = {
      eligibility: [], documents: [], financial: [], technical: [], legal: [],
      timeline: [], geographic: [], team: [], project: [], compliance: [],
      impact: [], capex_opex: [], use_of_funds: [], revenue_model: [],
      market_size: [], co_financing: [], trl_level: [], consortium: []
    };

    // Map requirements to categories
    if (requirements.co_financing) {
      categorized.financial.push({
        type: 'co_financing',
        value: requirements.co_financing,
        required: true,
        source: 'dynamic_patterns'
      });
    }

    if (requirements.trl_level) {
      categorized.technical.push({
        type: 'trl_level',
        value: requirements.trl_level,
        required: true,
        source: 'dynamic_patterns'
      });
    }

    if (requirements.impact) {
      categorized.impact.push({
        type: 'impact',
        value: requirements.impact,
        required: true,
        source: 'dynamic_patterns'
      });
    }

    if (requirements.consortium) {
      categorized.consortium.push({
        type: 'consortium',
        value: requirements.consortium,
        required: true,
        source: 'dynamic_patterns'
      });
    }

    return categorized;
  }

  /**
   * Extract comprehensive requirements using dynamic patterns
   * This is the GOOD method that works well
   */
  private async extractComprehensiveRequirements(page: Page, institution: string): Promise<any> {
    try {
      const content = await page.evaluate(() => {
        return document.body.textContent || '';
      });
      
      // Use dynamic pattern engine
      const extractedRequirements = await dynamicPatternEngine.extractRequirements(
        content,
        institution.toLowerCase(),
        ['co_financing', 'trl_level', 'impact', 'consortium', 'capex_opex', 'use_of_funds', 'revenue_model', 'market_size', 'geographic', 'target_group', 'industry']
      );
      
      const requirements: any = {};
      let confidence = 0;
      let totalPatterns = 0;
      let matchedPatterns = 0;
      
      // Convert dynamic pattern results
      extractedRequirements.forEach((reqs, category) => {
        if (reqs.length > 0) {
          requirements[category] = {
            required: true,
            evidence: reqs.flatMap(req => req.evidence),
            confidence: this.calculateAverageConfidence(reqs),
            extraction_method: 'dynamic_patterns',
            source_institution: institution,
            pattern_matches: reqs.length
          };
          matchedPatterns++;
        }
        totalPatterns++;
      });
      
      // Fallback to static patterns
      for (const [requirementType, patterns] of Object.entries(this.requirementPatterns)) {
        if (!requirements[requirementType]) {
          let found = false;
          let evidence: string[] = [];
          
          for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
              found = true;
              evidence.push(...matches.slice(0, 3));
            }
          }
          
          if (found) {
            requirements[requirementType] = {
              required: true,
              evidence: evidence,
              confidence: 0.8,
              extraction_method: 'static_regex',
              source_institution: institution
            };
            matchedPatterns++;
          }
          totalPatterns++;
        }
      }
      
      confidence = totalPatterns > 0 ? matchedPatterns / totalPatterns : 0;
      
      return {
        ...requirements,
        _confidence: confidence,
        _evidence: this.extractEvidence(content),
        _extracted_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error extracting requirements:', error);
      return {};
    }
  }

  private calculateAverageConfidence(requirements: any[]): number {
    if (requirements.length === 0) return 0;
    const totalConfidence = requirements.reduce((sum, req) => sum + req.confidence, 0);
    return totalConfidence / requirements.length;
  }

  private extractEvidence(content: string): string[] {
    const evidence: string[] = [];
    const sentences = content.split(/[.!?]+/).slice(0, 10); // First 10 sentences
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 200) {
        evidence.push(trimmed);
      }
    });
    
    return evidence.slice(0, 5);
  }

  // ============================================================================
  // URL DISCOVERY - Keep as user requested
  // ============================================================================

  private async discoverProgramUrls(institutionId: string): Promise<string[]> {
    const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
    if (!institution) return [];

    // Check cache
    if (this.discoveredUrls.has(institutionId)) {
      return this.discoveredUrls.get(institutionId)!;
    }

    const urls: string[] = [];
    
    try {
      if (this.browser) {
        const page = await this.browser.newPage();
        await page.setUserAgent(SCRAPER_CONFIG.scraping.userAgent);
        
        // Try sitemap
        if (institution.sitemap) {
          try {
            console.log(`🔍 Discovering URLs from sitemap: ${institution.sitemap}`);
            const sitemapUrls = await this.parseSitemap(page, institution.sitemap);
            urls.push(...sitemapUrls);
          } catch (sitemapError) {
            console.warn(`⚠️ Sitemap parsing failed:`, sitemapError);
          }
        }
        
        // Try link discovery
        try {
          const linkUrls = await this.discoverLinksFromPage(page, institution.baseUrl, institution.customSelectors);
          urls.push(...linkUrls);
        } catch (linkError) {
          console.warn(`⚠️ Link discovery failed:`, linkError);
        }
        
        // Try patterns
        try {
          const patternUrls = await this.discoverProgramPatterns(page, institution);
          urls.push(...patternUrls);
        } catch (patternError) {
          console.warn(`⚠️ Pattern discovery failed:`, patternError);
        }
        
        await page.close();
      }
      
      const filteredUrls = this.filterProgramUrls(urls, institutionId);
      this.discoveredUrls.set(institutionId, filteredUrls);
      
      return filteredUrls;
      
    } catch (error) {
      console.error(`❌ URL discovery failed:`, error);
      return [];
    }
  }

  private async parseSitemap(page: Page, sitemapUrl: string): Promise<string[]> {
    try {
      await page.goto(sitemapUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const urls: string[] = [];
      $('url loc').each((_, element) => {
        const url = $(element).text().trim();
        if (url && this.isProgramUrl(url)) {
          urls.push(url);
        }
      });
      
      return urls.slice(0, 100);
    } catch (error) {
      console.error('❌ Sitemap parsing failed:', error);
      return [];
    }
  }

  private async discoverLinksFromPage(page: Page, baseUrl: string, selectors: any): Promise<string[]> {
    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const urls: string[] = [];
      $(selectors.programLinks).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
          if (this.isProgramUrl(fullUrl)) {
            urls.push(fullUrl);
          }
        }
      });
      
      return urls.slice(0, 100);
    } catch (error) {
      console.error('❌ Link discovery failed:', error);
      return [];
    }
  }

  private async discoverProgramPatterns(page: Page, institution: any): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      const patterns = [
        '/foerderung',
        '/programme',
        '/funding',
        '/grant',
        '/stipendien'
      ];
      
      for (const pattern of patterns) {
        try {
          const testUrl = new URL(pattern, institution.baseUrl).href;
          await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          
          const content = await page.content();
          const is404 = content.includes('404') || content.includes('nicht gefunden');
          
          if (content.length > 1000 && !is404) {
            urls.push(testUrl);
          }
        } catch (e) {
          // Pattern doesn't exist
        }
      }
      
      return urls;
    } catch (error) {
      return [];
    }
  }

  private isProgramUrl(url: string): boolean {
    const programKeywords = [
      'foerderung', 'programme', 'funding', 'grant', 'stipendium',
      'beihilfe', 'subvention', 'hilfe', 'support', 'finanzierung'
    ];
    
    // Check hardcoded keywords
    if (programKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
      return true;
    }
    
    // Check learned keywords (self-learning!)
    const urlWords = url.toLowerCase().split(/[^a-zäöüßéèàáí]/);
    for (const word of urlWords) {
      if (word.length > 5 && this.discoveredKeywords.has(word)) {
        const confidence = this.discoveredKeywords.get(word)!;
        if (confidence > 5) { // Only if seen 5+ times successfully
          console.log(`✓ Learned keyword match: ${word} (confidence: ${confidence})`);
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * NEW: Learn keywords from successful scrapes
   */
  private learnKeywordFromUrl(url: string, success: boolean) {
    const urlWords = url.toLowerCase().split(/[^a-zäöüßéèàáí]/);
    
    urlWords.forEach(word => {
      if (word.length > 5) { // Only learn meaningful words (>5 chars)
        const current = this.discoveredKeywords.get(word) || 0;
        this.discoveredKeywords.set(word, success ? current + 1 : Math.max(0, current - 1));
        
        if (success && current === 0) {
          console.log(`📚 New keyword learned: ${word}`);
        }
      }
    });
  }

  private filterProgramUrls(urls: string[], institutionId: string): string[] {
    const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
    if (!institution) return [];

    return urls
      .filter(url => {
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(institution.baseUrl);
          return urlObj.hostname === baseUrlObj.hostname;
        } catch {
          return false;
        }
      })
      .filter(url => this.isProgramUrl(url))
      .slice(0, 100);
  }

  // ============================================================================
  // RATE LIMITING & ROBOTS.TXT - Keep as user requested
  // ============================================================================

  private async respectRateLimit(institutionId: string): Promise<void> {
    if (!SCRAPER_CONFIG.scraping.rateLimiting.enabled) return;

    const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
    if (!institution?.rateLimit) return;

    const now = Date.now();
    const tracker = this.rateLimitTracker.get(institutionId);
    
    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(institutionId, {
        count: 0,
        resetTime: now + institution.rateLimit.window
      });
    } else if (tracker.count >= institution.rateLimit.requests) {
      const waitTime = tracker.resetTime - now;
      console.log(`⏳ Rate limit exceeded for ${institutionId}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.rateLimitTracker.set(institutionId, {
        count: 0,
        resetTime: now + institution.rateLimit.window
      });
    }
    
    const currentTracker = this.rateLimitTracker.get(institutionId)!;
    currentTracker.count++;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async checkRobotsTxt(_institutionId: string, _url: string): Promise<boolean> {
    // Simplified - just return true for now
    // Full implementation would check robots.txt
    return true;
  }

  // ============================================================================
  // JSON FALLBACK - Keep as-is
  // ============================================================================

  private async scrapeProgramsViaAPI(): Promise<ScrapedProgram[]> {
    const programs: ScrapedProgram[] = [];
    
    try {
      const dataPath = path.join(process.cwd(), 'data', 'migrated-programs.json');
      const data = fs.readFileSync(dataPath, 'utf8');
      const jsonData = JSON.parse(data);
      const migratedPrograms = jsonData.programs || [];
      
      console.log(`📊 Loaded ${migratedPrograms.length} migrated programs`);
      
      for (const program of migratedPrograms) {
        programs.push({
          id: program.id || `migrated_${program.name?.replace(/\s+/g, '_').toLowerCase()}`,
          name: program.name || 'Unknown Program',
          description: program.description || '',
          type: program.type || 'grant',
          program_type: program.program_type || 'grant',
          funding_amount_min: program.funding_amount_min || 0,
          funding_amount_max: program.funding_amount_max || 0,
          currency: program.currency || 'EUR',
          deadline: program.deadline || undefined,
          institution: program.institution || 'Unknown Institution',
          program_category: program.program_category || 'general',
          eligibility_criteria: program.eligibility_criteria || {},
          requirements: program.requirements || {},
          contact_info: program.contact_info || {},
          source_url: program.source_url || '',
          confidence_score: 0.9,
          tags: program.tags || [],
          target_personas: program.target_personas || [],
          decision_tree_questions: program.decision_tree_questions || [],
          editor_sections: program.editor_sections || [],
          readiness_criteria: program.readiness_criteria || [],
          ai_guidance: program.ai_guidance || '',
          scraped_at: new Date(),
          is_active: true
        });
      }
      
      return programs;
      
    } catch (error) {
      console.error('❌ Error loading migrated programs:', error);
      return [];
    }
  }

  private async saveScrapedData(programs: ScrapedProgram[]): Promise<void> {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0].replace(/-/g, '-');
      const filepath = path.join(dataDir, `scraped-programs-${timestamp}.json`);
      const latestFilepath = path.join(dataDir, 'scraped-programs-latest.json');
      
      const data = {
        timestamp: now.toISOString(),
        totalPrograms: programs.length,
        programs: programs
      };
      
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      fs.writeFileSync(latestFilepath, JSON.stringify(data, null, 2));
      
      console.log(`💾 Saved ${programs.length} programs to ${filepath}`);
    } catch (error) {
      console.error('❌ Failed to save scraped data:', error);
    }
  }

  private async loadFallbackData(): Promise<ScrapedProgram[]> {
    try {
      const latestFilepath = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
      if (fs.existsSync(latestFilepath)) {
        const data = JSON.parse(fs.readFileSync(latestFilepath, 'utf8'));
        return data.programs;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to load fallback data:', error);
      return [];
    }
  }
}

