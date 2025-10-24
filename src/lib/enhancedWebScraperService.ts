// Enhanced Web Scraper Service with Learning Engine
// This extends the existing webScraperService.ts with intelligent learning capabilities
// Based on RAG Alternatives: Toolformer/API-calling + LangChain Agents + Fine-tuning

import { WebScraperService } from './webScraperService';
import { ScrapedProgram } from './ScrapedProgram';
import * as cheerio from 'cheerio';

// Import the scraper config from the original file
const SCRAPER_CONFIG = {
  institutions: {
    aws: { 
      name: 'Austria Wirtschaftsservice', 
      baseUrl: 'https://aws.at', 
      priority: 1,
      category: 'grants',
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
      category: 'grants',
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
      category: 'grants',
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
      priority: 3,
      category: 'business_support',
      enabled: true,
      rateLimit: { requests: 3, window: 60000 },
      robotsTxt: 'https://www.wko.at/robots.txt',
      sitemap: 'https://www.wko.at/sitemap.xml',
      customSelectors: {
        programLinks: 'a[href*="/foerderung"], a[href*="/programme"]',
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      }
    }
  },
  scraping: {
    timeout: 10000,
    retryAttempts: 3,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
} as const;

// ============================================================================
// LEARNING DATA STRUCTURES (RAG Alternative: Fine-tuning with domain-specific data)
// ============================================================================

interface LearningData {
  // Institution-specific learning
  institutions: Record<string, {
    successRate: number;
    avgResponseTime: number;
    optimalTimeout: number;
    retryStrategy: { attempts: number; delay: number };
    successfulPatterns: string[];
    failedPatterns: string[];
    language: string;
    lastUpdated: string;
  }>;
  
  // URL pattern learning (Toolformer/API-calling approach)
  urlPatterns: Record<string, {
    pattern: string;
    successCount: number;
    failureCount: number;
    successRate: number;
    lastUsed: string;
    institution: string;
  }>;
  
  // Performance optimization
  performance: {
    totalScrapes: number;
    avgSuccessRate: number;
    avgResponseTime: number;
    lastOptimization: string;
  };
  
  // Language detection patterns
  languagePatterns: Record<string, {
    language: string;
    patterns: string[];
    successRate: number;
    institutions: string[];
  }>;
}

// ============================================================================
// ENHANCED WEB SCRAPER SERVICE WITH LEARNING
// ============================================================================

export class EnhancedWebScraperService extends WebScraperService {
  private learningData: LearningData;
  private learningFile: string = 'data/scraper-learning.json';
  
  constructor() {
    super();
    this.learningData = this.loadLearningData();
  }
  
  // ============================================================================
  // LEARNING DATA MANAGEMENT
  // ============================================================================
  
  private loadLearningData(): LearningData {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const filepath = path.join(process.cwd(), this.learningFile);
      if (fs.existsSync(filepath)) {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        console.log('🧠 Loaded learning data:', Object.keys(data.institutions || {}).length, 'institutions');
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Could not load learning data:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    return {
      institutions: {},
      urlPatterns: {},
      performance: {
        totalScrapes: 0,
        avgSuccessRate: 0,
        avgResponseTime: 0,
        lastOptimization: new Date().toISOString()
      },
      languagePatterns: {}
    };
  }
  
  private saveLearningData(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const filepath = path.join(dataDir, 'scraper-learning.json');
      fs.writeFileSync(filepath, JSON.stringify(this.learningData, null, 2));
      console.log('💾 Saved learning data');
    } catch (error) {
      console.error('❌ Failed to save learning data:', error);
    }
  }
  
  // ============================================================================
  // INTELLIGENT URL DISCOVERY (RAG Alternative: Toolformer/API-calling)
  // ============================================================================
  
  /**
   * Get URL patterns for an institution (enhanced with funding type awareness)
   */
  private getUrlPatterns(institutionId: string): string[] {
    // Use institution-specific patterns from SCRAPER_CONFIG
    const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
    if (institution?.customSelectors?.programLinks) {
      // Extract patterns from custom selectors
      const patterns = institution.customSelectors.programLinks
        .split(',')
        .map(selector => selector.match(/href\*="([^"]+)"/)?.[1])
        .filter(Boolean) as string[];
      
      if (patterns.length > 0) {
        return patterns;
      }
    }
    
    // Enhanced fallback patterns based on institution category
    const category = institution?.category || 'general';
    const basePatterns = this.getCategoryBasedPatterns(category);
    
    // Add geographic patterns based on institution location
    const geographicPatterns = this.getGeographicPatterns(this.detectCountryFromInstitution(institutionId));
    
    // Add funding type patterns based on institution type
    const fundingTypePatterns = this.getFundingTypePatterns(this.detectFundingTypeFromInstitution(institutionId));
    
    // Add learned patterns if available
    const learnedPatterns = this.getLearnedPatterns(institutionId);
    
    // Combine all patterns and remove duplicates
    const allPatterns = [...basePatterns, ...geographicPatterns, ...fundingTypePatterns, ...learnedPatterns];
    return [...new Set(allPatterns)]; // Remove duplicates
  }
  
  /**
   * Get category-based URL patterns (enhanced with geographic and funding type awareness)
   */
  private getCategoryBasedPatterns(category: string): string[] {
    const categoryPatterns: { [key: string]: string[] } = {
      'austrian_grants': ['/foerderung', '/programme', '/subvention', '/finanzierung', '/beihilfe', '/zuschuss'],
      'research_grants': ['/foerderung', '/programme', '/forschung', '/rd', '/innovation', '/technologie'],
      'business_grants': ['/foerderung', '/programme', '/wirtschaft', '/unternehmen', '/kmU', '/mittelstand'],
      'eu_programs': ['/funding', '/programme', '/grants', '/calls', '/opportunities', '/calls-for-proposals'],
      'environmental': ['/foerderung', '/programme', '/umwelt', '/klima', '/nachhaltigkeit', '/green'],
      'digital': ['/funding', '/programme', '/digital', '/innovation', '/tech', '/digitalisierung'],
      'health': ['/funding', '/programme', '/health', '/gesundheit', '/medizin', '/healthcare'],
      'climate': ['/funding', '/programme', '/life', '/klima', '/climate', '/environment'],
      'energy': ['/funding', '/programme', '/energy', '/energie', '/renewable', '/sustainability'],
      'culture': ['/funding', '/programme', '/culture', '/kultur', '/creative', '/arts'],
      'employment': ['/foerderung', '/programme', '/beschäftigung', '/arbeitsmarkt', '/jobs', '/employment'],
      'consulting': ['/beratung', '/coaching', '/service', '/support', '/consulting', '/advisory'],
      'regional_grants': ['/funding', '/programme', '/regional', '/erdf', '/regional-development', '/territorial']
    };
    
    return categoryPatterns[category] || ['/foerderung', '/programme', '/funding'];
  }
  
  /**
   * Get geographic-specific URL patterns
   */
  private getGeographicPatterns(country: string): string[] {
    const geographicPatterns: { [key: string]: string[] } = {
      'austria': ['/foerderung', '/subvention', '/finanzierung', '/beihilfe', '/zuschuss'],
      'germany': ['/foerderung', '/zuwendung', '/beihilfe', '/subvention', '/finanzierung'],
      'switzerland': ['/foerderung', '/beitrag', '/subvention', '/finanzierung', '/support'],
      'eu': ['/funding', '/grants', '/calls', '/opportunities', '/programmes'],
      'general': ['/funding', '/grants', '/programs', '/support', '/financing']
    };
    
    return geographicPatterns[country] || geographicPatterns['general'];
  }
  
  /**
   * Get funding type-specific URL patterns
   */
  private getFundingTypePatterns(fundingType: string): string[] {
    const fundingTypePatterns: { [key: string]: string[] } = {
      'grants': ['/foerderung', '/grants', '/subvention', '/beihilfe'],
      'loans': ['/darlehen', '/kredit', '/loan', '/financing'],
      'equity': ['/eigenkapital', '/beteiligung', '/equity', '/investment'],
      'leasing': ['/leasing', '/mietkauf', '/rental', '/financing'],
      'investors': ['/investor', '/venture', '/capital', '/angel'],
      'consulting': ['/beratung', '/coaching', '/service', '/support'],
      'general': ['/funding', '/programs', '/support', '/financing']
    };
    
    return fundingTypePatterns[fundingType] || fundingTypePatterns['general'];
  }
  
  /**
   * Detect country from institution ID
   */
  private detectCountryFromInstitution(institutionId: string): string {
    const countryMap: { [key: string]: string } = {
      'aws': 'austria',
      'ffg': 'austria', 
      'vba': 'austria',
      'ams': 'austria',
      'wko': 'austria',
      'oesb': 'austria',
      'eic': 'eu',
      'horizon': 'eu',
      'umwelt': 'austria',
      'digital': 'eu',
      'health': 'eu',
      'climate': 'eu',
      'energy': 'eu',
      'culture': 'eu',
      'regional': 'eu'
    };
    
    return countryMap[institutionId] || 'general';
  }
  
  /**
   * Detect funding type from institution ID
   */
  private detectFundingTypeFromInstitution(institutionId: string): string {
    const fundingTypeMap: { [key: string]: string } = {
      'aws': 'grants',
      'ffg': 'grants',
      'vba': 'grants',
      'ams': 'employment',
      'wko': 'business_grants',
      'oesb': 'consulting',
      'eic': 'equity',
      'horizon': 'grants',
      'umwelt': 'grants',
      'digital': 'grants',
      'health': 'grants',
      'climate': 'grants',
      'energy': 'grants',
      'culture': 'grants',
      'regional': 'grants'
    };
    
    return fundingTypeMap[institutionId] || 'grants';
  }
  
  private getLearnedPatterns(institutionId: string): string[] {
    const patterns: string[] = [];
    
    // Get patterns with high success rate for this institution
    Object.values(this.learningData.urlPatterns).forEach(patternData => {
      if (patternData.institution === institutionId && patternData.successRate > 0.7) {
        patterns.push(patternData.pattern);
      }
    });
    
    return patterns;
  }
  
  /**
   * Basic requirement extraction for quick mode (avoids page.evaluate issues)
   */
  private async extractBasicRequirements(content: string, institution: string): Promise<any> {
    try {
      // Simple pattern-based extraction for quick mode
      const requirements: any = {};
      
      // Enhanced funding type detection with comprehensive keywords
      const fundingTypePatterns = [
        { pattern: /förderung|grant|subsidy|zuschuss|beihilfe|subvention|förderung|finanzhilfe|stipendium|stipend/i, type: 'grants' },
        { pattern: /darlehen|loan|kredit|finanzierung|credit|finanzierung|kredit|anleihe|obligation/i, type: 'loans' },
        { pattern: /equity|eigenkapital|beteiligung|investition|venture|angel|aktien|shares|kapitalbeteiligung|beteiligungskapital/i, type: 'equity' },
        { pattern: /leasing|miete|pacht|rental|mietkauf|finanzierung|leasing|mietvertrag/i, type: 'leasing' },
        { pattern: /investor|investment|venture capital|angel|crowdfunding|risikokapital|private equity|wagniskapital/i, type: 'investors' },
        { pattern: /beratung|consulting|coaching|mentoring|support|unterstützung|hilfe|assistance/i, type: 'consulting' },
        { pattern: /visa|visum|einwanderung|immigration|aufenthalt|residence|migration|zuwanderung/i, type: 'visa' },
        { pattern: /inkubator|incubator|accelerator|beschleuniger|startup|gründerzentrum|business center/i, type: 'incubator' },
        { pattern: /crowdfunding|crowd|spenden|donation|sponsoring|sponsor|patenschaft/i, type: 'crowdfunding' },
        { pattern: /subvention|subsidy|beihilfe|zuschuss|prämie|bonus|rabatt|discount/i, type: 'subsidies' }
      ];
      
      const detectedFundingTypes = fundingTypePatterns
        .filter(p => p.pattern.test(content))
        .map(p => p.type);
      
      if (detectedFundingTypes.length > 0) {
        requirements.funding_type = {
          required: true,
          evidence: detectedFundingTypes,
          confidence: 0.8,
          extraction_method: 'quick_mode_patterns',
          source_institution: institution
        };
      }
      
      // Enhanced program category detection with comprehensive keywords
      const categoryPatterns = [
        { pattern: /forschung|research|innovation|wissenschaft|science|entwicklung|development|rd|r&d|forschung|wissenschaftlich/i, category: 'research_grants' },
        { pattern: /umwelt|environment|klima|climate|nachhaltigkeit|sustainability|ökologie|ecology|green|grün|co2|emission/i, category: 'environmental' },
        { pattern: /digital|it|software|technologie|technology|ai|artificial intelligence|digitalisierung|digitization|cyber|internet|online|web/i, category: 'digital' },
        { pattern: /gesundheit|health|medizin|medicine|pharma|pharmaceutical|krankenhaus|hospital|therapie|therapy|behandlung|treatment/i, category: 'health' },
        { pattern: /kultur|culture|kunst|art|creative|kreativ|künstler|artist|musik|music|theater|theatre|film|cinema/i, category: 'culture' },
        { pattern: /beschäftigung|employment|arbeitsplatz|job|arbeit|workplace|arbeitsmarkt|labor market|qualifizierung|qualification/i, category: 'employment' },
        { pattern: /energie|energy|solar|wind|renewable|erneuerbar|strom|electricity|kernenergie|nuclear|wasserstoff|hydrogen/i, category: 'energy' },
        { pattern: /landwirtschaft|agriculture|agrar|farming|bauern|farmer|lebensmittel|food|bio|organic|tierhaltung|livestock/i, category: 'agriculture' },
        { pattern: /tourismus|tourism|hotel|gastronomie|reise|travel|urlaub|vacation|gäste|guests|veranstaltung|event/i, category: 'tourism' },
        { pattern: /handwerk|craft|artisan|meister|traditional|traditionell|zunft|guild|beruf|profession|ausbildung|training/i, category: 'crafts' },
        { pattern: /bildung|education|schule|school|universität|university|studium|study|ausbildung|training|fortbildung|further education/i, category: 'education' },
        { pattern: /verkehr|transport|mobilität|mobility|infrastruktur|infrastructure|straße|road|bahn|rail|flug|flight/i, category: 'transport' },
        { pattern: /wohnen|housing|wohnung|apartment|bauen|building|immobilien|real estate|miete|rent|eigentum|property/i, category: 'housing' },
        { pattern: /sport|sports|fitness|olympia|olympics|verein|club|mannschaft|team|training|wettkampf|competition/i, category: 'sports' }
      ];
      
      const detectedCategories = categoryPatterns
        .filter(p => p.pattern.test(content))
        .map(p => p.category);
      
      if (detectedCategories.length > 0) {
        requirements.program_category = {
          required: true,
          evidence: detectedCategories,
          confidence: 0.8,
          extraction_method: 'quick_mode_patterns',
          source_institution: institution
        };
      }
      
      // Enhanced target group detection with comprehensive keywords
      const targetGroupPatterns = [
        { pattern: /einzelunternehmer|freelancer|solo entrepreneur|selbständig|selbstständig|freiberufler|freelance/i, type: 'single_founders' },
        { pattern: /frauen|women|weiblich|female|damen|mädchen|girls|unternehmerin|businesswoman/i, type: 'women' },
        { pattern: /jugend|youth|jung|young|unter 30|u30|junge|teenager|student|studenten|auszubildende|apprentice/i, type: 'youth' },
        { pattern: /kmu|sme|kleinunternehmen|mittelstand|small business|mittelbetrieb|family business|familienbetrieb/i, type: 'sme' },
        { pattern: /startup|neugründung|gründer|founder|start-up|neugründer|entrepreneur|unternehmer|business owner/i, type: 'startups' },
        { pattern: /migranten|migrants|zuwanderer|immigrants|ausländer|foreigners|flüchtlinge|refugees|asyl|asylum/i, type: 'migrants' },
        { pattern: /behinderte|disabled|handicapped|beeinträchtigt|inclusion|inklusion|barrierefrei|accessible/i, type: 'disabled' },
        { pattern: /senioren|seniors|ältere|elderly|pensionisten|pensioners|ruhestand|retirement/i, type: 'seniors' },
        { pattern: /arbeitslose|unemployed|arbeitslosigkeit|unemployment|jobsuchende|job seekers/i, type: 'unemployed' },
        { pattern: /studierende|students|akademiker|academics|absolventen|graduates|universität|university/i, type: 'students' },
        { pattern: /künstler|artists|kreative|creative|designer|musiker|musicians|schriftsteller|writers/i, type: 'artists' },
        { pattern: /landwirte|farmers|bauern|agricultural|landwirtschaftlich|rural|ländlich/i, type: 'farmers' }
      ];
      
      const detectedTargetGroups = targetGroupPatterns
        .filter(p => p.pattern.test(content))
        .map(p => p.type);
      
      if (detectedTargetGroups.length > 0) {
        requirements.target_group = {
          required: true,
          evidence: detectedTargetGroups,
          confidence: 0.8,
          extraction_method: 'quick_mode_patterns',
          source_institution: institution
        };
      }
      
      // Enhanced geographic detection with comprehensive keywords
      const geographicPatterns = [
        { pattern: /österreich|austria|at|wien|salzburg|tirol|steiermark|oberösterreich|niederösterreich|kärnten|vorarlberg|burgenland/i, type: 'austria' },
        { pattern: /deutschland|germany|de|berlin|münchen|hamburg|bayern|nordrhein|westfalen|baden|württemberg|sachsen|thüringen/i, type: 'germany' },
        { pattern: /schweiz|switzerland|ch|zürich|bern|basel|genf|luzern|st.gallen|winterthur|lausanne|biel/i, type: 'switzerland' },
        { pattern: /european|eu|europa|brussels|europe|union|europäisch|european|europäische union/i, type: 'eu' },
        { pattern: /frankreich|france|fr|paris|lyon|marseille|toulouse|nice|nantes|strasbourg|montpellier/i, type: 'france' },
        { pattern: /italien|italy|it|rom|milan|florenz|napoli|turin|palermo|genua|bologna|venezia/i, type: 'italy' },
        { pattern: /spanien|spain|es|madrid|barcelona|valencia|sevilla|zaragoza|málaga|murcia|palma|las palmas/i, type: 'spain' },
        { pattern: /niederlande|netherlands|nl|holland|amsterdam|rotterdam|den haag|utrecht|eindhoven|tilburg/i, type: 'netherlands' },
        { pattern: /belgien|belgium|be|brüssel|brussels|antwerpen|gent|charleroi|liège|bruges/i, type: 'belgium' },
        { pattern: /luxemburg|luxembourg|lu|luxembourg|esch|differdange|dudelange|ettelbruck/i, type: 'luxembourg' },
        { pattern: /polen|poland|pl|warschau|warsaw|krakau|cracow|gdansk|wroclaw|poznan|lodz/i, type: 'poland' },
        { pattern: /tschechien|czech republic|cz|prag|prague|brno|ostrava|plzen|olomouc|budweis/i, type: 'czech_republic' },
        { pattern: /slowakei|slovakia|sk|bratislava|kosice|presov|zilina|nitra|trencin|trnava/i, type: 'slovakia' },
        { pattern: /ungarn|hungary|hu|budapest|debrecen|szeged|miskolc|pecs|gyor|nyiregyhaza/i, type: 'hungary' },
        { pattern: /slowenien|slovenia|si|ljubljana|maribor|celje|kranj|velenje|koper|novo mesto/i, type: 'slovenia' }
      ];
      
      const detectedGeographic = geographicPatterns
        .filter(p => p.pattern.test(content))
        .map(p => p.type);
      
      if (detectedGeographic.length > 0) {
        requirements.geographic = {
          required: true,
          evidence: detectedGeographic,
          confidence: 0.8,
          extraction_method: 'quick_mode_patterns',
          source_institution: institution
        };
      }
      
      return requirements;
    } catch (error) {
      console.warn('Basic requirement extraction failed:', error);
      return {};
    }
  }
  
  
  // private getLanguagePatterns(_institutionId: string, _baseUrl: string): string[] {
  //   const patterns: string[] = [];
  //   
  //   // Detect language from base URL
  //   const language = this.detectLanguageFromUrl(_baseUrl);
  //   
  //   // Get language-specific patterns
  //   const langPatterns = this.learningData.languagePatterns[language];
  //   if (langPatterns && langPatterns.successRate > 0.5) {
  //     patterns.push(...langPatterns.patterns);
  //   } else {
  //     // Use default patterns for this language
  //     patterns.push(...this.getDefaultLanguagePatterns(language));
  //   }
  //   
  //   return patterns;
  // }
  
  // private getDefaultLanguagePatterns(language: string): string[] {
  //   const patterns: Record<string, string[]> = {
  //     'de': ['/foerderung', '/programme', '/stipendien', '/beihilfen', '/subventionen', '/finanzierung'],
  //     'en': ['/funding', '/programs', '/grants', '/scholarships', '/subsidies', '/financing'],
  //     'at': ['/foerderung', '/programme', '/stipendien', '/beihilfen', '/subventionen', '/finanzierung'],
  //     'unknown': ['/foerderung', '/funding', '/programme', '/programs', '/grants']
  //   };
  //   
  //   return patterns[language] || patterns['unknown'];
  // }
  
  // private getFallbackPatterns(): string[] {
  //   return ['/foerderung', '/programme', '/funding', '/grants', '/stipendien', '/beihilfen'];
  // }
  
  private detectLanguageFromUrl(url: string): string {
    if (url.includes('/de/') || url.includes('.de/')) return 'de';
    if (url.includes('/en/') || url.includes('.com/')) return 'en';
    if (url.includes('.at/')) return 'at';
    return 'unknown';
  }
  
  // ============================================================================
  // PERFORMANCE OPTIMIZATION (RAG Alternative: LangChain Agents)
  // ============================================================================
  
  /**
   * Get optimized timeout based on learning data
   * This is like a LangChain agent that decides the best strategy
   */
  private getOptimizedTimeout(institutionId: string): number {
    const institution = this.learningData.institutions[institutionId];
    
    if (institution) {
      return institution.optimalTimeout;
    }
    
    // Default timeout based on performance
    const avgSuccessRate = this.learningData.performance.avgSuccessRate;
    if (avgSuccessRate > 0.8) return 5000;  // 5 seconds for reliable sites
    if (avgSuccessRate < 0.3) return 15000; // 15 seconds for problematic sites
    return 10000; // 10 seconds default
  }
  
  /**
   * Get intelligent retry strategy
   */
  private getRetryStrategy(institutionId: string): { attempts: number; delay: number } {
    const institution = this.learningData.institutions[institutionId];
    
    if (institution) {
      return institution.retryStrategy;
    }
    
    // Default strategy based on performance
    const avgSuccessRate = this.learningData.performance.avgSuccessRate;
    if (avgSuccessRate > 0.7) return { attempts: 2, delay: 1000 };
    if (avgSuccessRate < 0.3) return { attempts: 1, delay: 5000 };
    return { attempts: 3, delay: 2000 };
  }
  
  // ============================================================================
  // LEARNING FROM RESULTS (RAG Alternative: Fine-tuning with domain-specific data)
  // ============================================================================
  
  /**
   * Learn from successful scraping results
   */
  private learnFromSuccess(url: string, institutionId: string, _program: ScrapedProgram, patterns: string[]): void {
    const now = new Date().toISOString();
    
    // Update institution data
    if (!this.learningData.institutions[institutionId]) {
      this.learningData.institutions[institutionId] = {
        successRate: 0,
        avgResponseTime: 0,
        optimalTimeout: 10000,
        retryStrategy: { attempts: 3, delay: 2000 },
        successfulPatterns: [],
        failedPatterns: [],
        language: this.detectLanguageFromUrl(url),
        lastUpdated: now
      };
    }
    
    const institution = this.learningData.institutions[institutionId];
    institution.successRate = Math.min(1, institution.successRate + 0.1);
    institution.successfulPatterns.push(...patterns);
    institution.lastUpdated = now;
    
    // Update URL patterns
    patterns.forEach(pattern => {
      const patternKey = `${institutionId}-${pattern}`;
      if (!this.learningData.urlPatterns[patternKey]) {
        this.learningData.urlPatterns[patternKey] = {
          pattern,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          lastUsed: now,
          institution: institutionId
        };
      }
      
      const patternData = this.learningData.urlPatterns[patternKey];
      patternData.successCount++;
      patternData.successRate = patternData.successCount / (patternData.successCount + patternData.failureCount);
      patternData.lastUsed = now;
    });
    
    // Update language patterns
    const language = this.detectLanguageFromUrl(url);
    if (!this.learningData.languagePatterns[language]) {
      this.learningData.languagePatterns[language] = {
        language,
        patterns: [],
        successRate: 0,
        institutions: []
      };
    }
    
    const langPatterns = this.learningData.languagePatterns[language];
    langPatterns.patterns.push(...patterns);
    langPatterns.institutions.push(institutionId);
    langPatterns.successRate = Math.min(1, langPatterns.successRate + 0.1);
    
    console.log(`🧠 Learned from success: ${url} (${institutionId})`);
  }
  
  /**
   * Learn from failed scraping attempts
   */
  private learnFromFailure(url: string, institutionId: string, error: string, patterns: string[]): void {
    const now = new Date().toISOString();
    
    // Update institution data
    if (!this.learningData.institutions[institutionId]) {
      this.learningData.institutions[institutionId] = {
        successRate: 0,
        avgResponseTime: 0,
        optimalTimeout: 10000,
        retryStrategy: { attempts: 3, delay: 2000 },
        successfulPatterns: [],
        failedPatterns: [],
        language: this.detectLanguageFromUrl(url),
        lastUpdated: now
      };
    }
    
    const institution = this.learningData.institutions[institutionId];
    institution.successRate = Math.max(0, institution.successRate - 0.05);
    institution.failedPatterns.push(...patterns);
    institution.lastUpdated = now;
    
    // Update URL patterns
    patterns.forEach(pattern => {
      const patternKey = `${institutionId}-${pattern}`;
      if (!this.learningData.urlPatterns[patternKey]) {
        this.learningData.urlPatterns[patternKey] = {
          pattern,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          lastUsed: now,
          institution: institutionId
        };
      }
      
      const patternData = this.learningData.urlPatterns[patternKey];
      patternData.failureCount++;
      patternData.successRate = patternData.successCount / (patternData.successCount + patternData.failureCount);
      patternData.lastUsed = now;
    });
    
    console.log(`🧠 Learned from failure: ${url} - ${error}`);
  }
  
  // ============================================================================
  // ENHANCED SCRAPING METHODS
  // ============================================================================
  
  /**
   * Enhanced scraping with learning capabilities
   */
  async scrapeAllProgramsWithLearning(): Promise<ScrapedProgram[]> {
    console.log('🧠 Starting intelligent scraping with learning...');
    
    try {
      // Initialize the base scraper
      await this.init();
      
      // Get all institutions
      const institutions = Object.entries(SCRAPER_CONFIG.institutions);
      const allPrograms: ScrapedProgram[] = [];
      
      for (const [institutionId, institution] of institutions) {
        if (!institution.enabled) continue;
        
        console.log(`🔍 Scraping ${institution.name} (${institutionId})...`);
        const startTime = Date.now();
        
        try {
          // Get URL patterns for this institution
          const patterns = this.getUrlPatterns(institutionId);
          
          // Get optimized timeout
          const timeout = this.getOptimizedTimeout(institutionId);
          
          // Get retry strategy
          const retryStrategy = this.getRetryStrategy(institutionId);
          
          // Scrape with learning
          const programs = await this.scrapeInstitutionWithLearning(
            institutionId, 
            institution, 
            patterns, 
            timeout, 
            retryStrategy
          );
          
          allPrograms.push(...programs);
          
          // Learn from results
          const responseTime = Date.now() - startTime;
          this.updatePerformanceMetrics(institutionId, true, responseTime);
          
          // Learn successful URL patterns
          if (programs.length > 0) {
            // const successfulPatterns = patterns.slice(0, Math.min(3, patterns.length)); // Learn from first 3 patterns
            // this.urlDiscovery.learnFromSuccess(institutionId, successfulPatterns); // Removed - urlDiscovery deleted
          }
          
          console.log(`✅ Scraped ${programs.length} programs from ${institution.name}`);
          
        } catch (error) {
          console.error(`❌ Failed to scrape ${institution.name}:`, error);
          this.updatePerformanceMetrics(institutionId, false, 0);
        }
      }
      
      // Save learning data
      this.saveLearningData();
      
      // Update performance metrics
      this.learningData.performance.totalScrapes++;
      this.learningData.performance.lastOptimization = new Date().toISOString();
      
      console.log(`🧠 Learning complete. Total programs: ${allPrograms.length}`);
      return allPrograms;
      
    } catch (error) {
      console.error('❌ Intelligent scraping failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
  
  private async scrapeInstitutionWithLearning(
    institutionId: string,
    institution: any,
    patterns: string[],
    _timeout: number,
    retryStrategy: { attempts: number; delay: number }
  ): Promise<ScrapedProgram[]> {
    const programs: ScrapedProgram[] = [];
    
    for (const pattern of patterns) {
      const url = new URL(pattern, institution.baseUrl).href;
      
      for (let attempt = 1; attempt <= retryStrategy.attempts; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${retryStrategy.attempts}: ${url}`);
          
          // Use the base scraper's method
          const program = await (this as any).scrapeProgramFromUrl(url, institutionId);
          
          if (program) {
            programs.push(program);
            
            // Learn from success
            this.learnFromSuccess(url, institutionId, program, [pattern]);
            break; // Success, no need to retry
          }
          
        } catch (error) {
          console.warn(`⚠️ Attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          if (attempt === retryStrategy.attempts) {
            // Final attempt failed, learn from failure
            this.learnFromFailure(url, institutionId, error instanceof Error ? error.message : 'Unknown error', [pattern]);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryStrategy.delay));
          }
        }
      }
    }
    
    return programs;
  }
  
  private updatePerformanceMetrics(institutionId: string, success: boolean, responseTime: number): void {
    if (!this.learningData.institutions[institutionId]) {
      this.learningData.institutions[institutionId] = {
        successRate: 0,
        avgResponseTime: 0,
        optimalTimeout: 10000,
        retryStrategy: { attempts: 3, delay: 2000 },
        successfulPatterns: [],
        failedPatterns: [],
        language: 'unknown',
        lastUpdated: new Date().toISOString()
      };
    }
    
    const institution = this.learningData.institutions[institutionId];
    
    // Update success rate
    if (success) {
      institution.successRate = Math.min(1, institution.successRate + 0.1);
    } else {
      institution.successRate = Math.max(0, institution.successRate - 0.05);
    }
    
    // Update response time
    if (responseTime > 0) {
      institution.avgResponseTime = institution.avgResponseTime === 0 
        ? responseTime 
        : (institution.avgResponseTime + responseTime) / 2;
    }
    
    // Update optimal timeout based on success rate
    if (institution.successRate > 0.8) {
      institution.optimalTimeout = 5000;
      institution.retryStrategy = { attempts: 2, delay: 1000 };
    } else if (institution.successRate < 0.3) {
      institution.optimalTimeout = 15000;
      institution.retryStrategy = { attempts: 1, delay: 5000 };
    } else {
      institution.optimalTimeout = 10000;
      institution.retryStrategy = { attempts: 3, delay: 2000 };
    }
    
    // Update global performance metrics
    const allInstitutions = Object.values(this.learningData.institutions);
    if (allInstitutions.length > 0) {
      this.learningData.performance.avgSuccessRate = 
        allInstitutions.reduce((sum, inst) => sum + inst.successRate, 0) / allInstitutions.length;
      
      this.learningData.performance.avgResponseTime = 
        allInstitutions.reduce((sum, inst) => sum + inst.avgResponseTime, 0) / allInstitutions.length;
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  /**
   * Get learning statistics
   */
  getLearningStats(): any {
    return {
      institutions: Object.keys(this.learningData.institutions).length,
      urlPatterns: Object.keys(this.learningData.urlPatterns).length,
      languagePatterns: Object.keys(this.learningData.languagePatterns).length,
      avgSuccessRate: this.learningData.performance.avgSuccessRate,
      avgResponseTime: this.learningData.performance.avgResponseTime,
      totalScrapes: this.learningData.performance.totalScrapes,
      lastOptimization: this.learningData.performance.lastOptimization
    };
  }
  
  /**
   * Reset learning data (for testing)
   */
  resetLearning(): void {
    this.learningData = {
      institutions: {},
      urlPatterns: {},
      performance: {
        totalScrapes: 0,
        avgSuccessRate: 0,
        avgResponseTime: 0,
        lastOptimization: new Date().toISOString()
      },
      languagePatterns: {}
    };
    this.saveLearningData();
    console.log('🧠 Learning data reset');
  }

  // ============================================================================
  // QUICK SCRAPING METHODS (FOR DEVELOPMENT)
  // ============================================================================

  /**
   * Quick scraping for development - limited scope, no PDF parsing, no deep crawling
   */
  async scrapeAllProgramsWithLearningQuick(): Promise<ScrapedProgram[]> {
    console.log('⚡ Starting quick scraping (dev mode)...');
    
    try {
      // Initialize the base scraper
      await this.init();
      
      // Test all institutions in quick mode (but with shorter timeouts)
      const quickInstitutions = Object.entries(SCRAPER_CONFIG.institutions)
        .filter(([_, institution]) => institution.enabled)
        .sort(([_, a], [__, b]) => a.priority - b.priority);
      
      const allPrograms: ScrapedProgram[] = [];
      
      for (const [institutionId, institution] of quickInstitutions) {
        console.log(`⚡ Quick scraping ${institution.name} (${institutionId})...`);
        const startTime = Date.now();
        
        try {
          // Use institution-specific URL patterns
          const patterns = this.getUrlPatterns(institutionId);
          
          // Use shorter timeout for quick mode
          const timeout = 3000; // 3 seconds (faster)
          
          // Use minimal retry strategy
          const retryStrategy = { attempts: 1, delay: 1000 };
          
          // Quick scrape without deep crawling or PDF parsing
          const programs = await this.scrapeInstitutionQuick(
            institutionId, 
            institution, 
            patterns, 
            timeout, 
            retryStrategy
          );
          
          allPrograms.push(...programs);
          
          const responseTime = Date.now() - startTime;
          console.log(`⚡ Quick scraped ${programs.length} programs from ${institution.name} in ${responseTime}ms`);
          
        } catch (error) {
          console.warn(`⚠️ Quick scraping failed for ${institution.name}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
      
      console.log(`⚡ Quick scraping complete. Total programs: ${allPrograms.length}`);
      return allPrograms;
      
    } catch (error) {
      console.error('❌ Quick scraping failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
  
  private async scrapeInstitutionQuick(
    institutionId: string,
    institution: any,
    patterns: string[],
    timeout: number,
    _retryStrategy: { attempts: number; delay: number }
  ): Promise<ScrapedProgram[]> {
    const programs: ScrapedProgram[] = [];
    
    // Only try the first pattern in quick mode
    const pattern = patterns[0];
    const url = new URL(pattern, institution.baseUrl).href;
    
    try {
      console.log(`⚡ Quick attempt: ${url}`);
      
      // Use a simplified scraping method for quick mode
      const program = await this.scrapeProgramFromUrlQuick(url, institutionId, timeout);
      
      if (program) {
        programs.push(program);
        console.log(`⚡ Quick success: Found program from ${institution.name}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Quick attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return programs;
  }
  
  /**
   * Simplified scraping method for quick mode - no deep discovery, no PDF parsing
   */
  private async scrapeProgramFromUrlQuick(url: string, institutionId: string, _timeout: number): Promise<ScrapedProgram | null> {
    try {
      if (!(this as any).browser) return null;
      
      const page = await (this as any).browser.newPage();
      await page.setUserAgent(SCRAPER_CONFIG.scraping.userAgent);
      
      // Use shorter timeout for quick mode
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      const content = await page.content();
      const $ = cheerio.load(content);
      
      const institution = SCRAPER_CONFIG.institutions[institutionId as keyof typeof SCRAPER_CONFIG.institutions];
      const selectors = institution?.customSelectors || {
        programTitle: 'h1, h2, .program-title',
        programDescription: '.description, .content, p'
      };
      
      // Extract basic information only
      const name = $(selectors.programTitle).first().text().trim() || 'Unknown Program';
      const description = $(selectors.programDescription).first().text().trim() || 'No description available';
      
      // Use basic requirement extraction for quick mode (avoid page.evaluate issues)
      const requirements = await this.extractBasicRequirements(content, institution?.name || 'Unknown');
      
      const program: ScrapedProgram = {
        id: `${institutionId}_${Date.now()}`,
        name: name,
        description: description,
        type: 'grant',
        program_type: 'grant',
        currency: 'EUR',
        source_url: url,
        institution: institution?.name || 'Unknown',
        program_category: institution?.category || 'grants',
        eligibility_criteria: this.extractEligibilityCriteria(content, name, description),
        requirements: requirements,
        funding_amount_min: 0,
        funding_amount_max: 0,
        deadline: undefined,
        contact_info: {},
        scraped_at: new Date(),
        confidence_score: 0.7,
        is_active: true
      };
      
      await page.close();
      return program;
      
    } catch (error) {
      console.warn(`⚠️ Quick scraping failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Extract eligibility criteria from scraped content
   */
  private extractEligibilityCriteria(content: string, name: string, description: string): any {
    const criteria: any = {};
    const text = `${content} ${name} ${description}`.toLowerCase();
    
    // Location criteria
    if (text.includes('österreich') || text.includes('austria') || text.includes('at-')) {
      criteria.location = 'Austria';
    } else if (text.includes('deutschland') || text.includes('germany') || text.includes('de-')) {
      criteria.location = 'Germany';
    } else if (text.includes('schweiz') || text.includes('switzerland') || text.includes('ch-')) {
      criteria.location = 'Switzerland';
    } else if (text.includes('europa') || text.includes('europe') || text.includes('eu-')) {
      criteria.location = 'Europe';
    }
    
    // Company age criteria
    const ageMatch = text.match(/(\d+)\s*(?:jahre?|years?|jahren?)\s*(?:alt|old|age)/i);
    if (ageMatch) {
      criteria.max_company_age = parseInt(ageMatch[1]);
    }
    
    // Team size criteria
    const teamMatch = text.match(/(\d+)\s*(?:mitarbeiter|employees?|team|personen)/i);
    if (teamMatch) {
      criteria.min_team_size = parseInt(teamMatch[1]);
    }
    
    // Revenue criteria
    const revenueMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:million|mio|millionen)/i);
    if (revenueMatch) {
      criteria.revenue_min = parseFloat(revenueMatch[1]) * 1000000;
    }
    
    // Research focus
    if (text.includes('forschung') || text.includes('research') || text.includes('innovation') || text.includes('entwicklung')) {
      criteria.research_focus = true;
    }
    
    // International collaboration
    if (text.includes('international') || text.includes('kollaboration') || text.includes('partnership') || text.includes('zusammenarbeit')) {
      criteria.international_collaboration = true;
    }
    
    // Industry focus
    if (text.includes('technologie') || text.includes('technology') || text.includes('digital') || text.includes('it')) {
      criteria.industry_focus = 'technology';
    } else if (text.includes('biotech') || text.includes('life science') || text.includes('medizin')) {
      criteria.industry_focus = 'biotech';
    } else if (text.includes('energie') || text.includes('energy') || text.includes('klima') || text.includes('climate')) {
      criteria.industry_focus = 'energy';
    }
    
    console.log(`📊 Extracted eligibility criteria:`, criteria);
    return criteria;
  }
}
