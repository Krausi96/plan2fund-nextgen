// Phase 1: Stealth Scraper with 18 Categories
import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { institutions, InstitutionConfig, autoDiscoveryPatterns } from './institutionConfig';

interface ScrapedProgram {
  id: string;
  name: string;
  description: string;
  type: string;
  program_type: string;
  source_url: string;
  institution: string;
  program_category: string;
  funding_types: string[]; // From institution config
  program_focus: string[]; // Auto-detected
  eligibility_criteria: any;
  categorized_requirements: any;
  contact_info: any;
  scraped_at: Date;
  confidence_score: number;
  is_active: boolean;
}

// 18 Categories for Requirements
const REQUIREMENT_CATEGORIES = [
  'eligibility', 'documents', 'financial', 'technical', 'legal', 
  'timeline', 'geographic', 'team', 'project', 'compliance', 
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model', 
  'market_size', 'co_financing', 'trl_level', 'consortium'
];

export class WebScraperService {
  private browser: Browser | null = null;

  async init() {
    // Stealth configuration
    this.browser = await puppeteer.launch({
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
    });
  }

  async scrapeAllPrograms(cycleOnly: boolean = false): Promise<ScrapedProgram[]> {
    console.log('🚀 Enhanced scraper with cycle support and skip logic...');
    console.log(`📊 Total institutions: ${institutions.length}`);
    console.log(`📊 Cycle mode: ${cycleOnly}`);
    
    try {
      if (!this.browser) {
        console.log('🔧 Initializing browser...');
        await this.init();
        console.log('✅ Browser initialized');
        
        // Test browser with a simple page
        try {
          const testPage = await this.browser!.newPage();
          await testPage.goto('https://httpbin.org/get', { waitUntil: 'domcontentloaded', timeout: 10000 });
          console.log('✅ Browser test successful');
          await testPage.close();
        } catch (error) {
          console.error('❌ Browser test failed:', error);
        }
      }

      // Load existing programs to skip
      const existingPrograms = this.loadExistingPrograms();
      const existingUrls = new Set(existingPrograms.map(p => p.source_url));
      console.log(`📋 Found ${existingPrograms.length} existing programs to skip`);

      const programs: ScrapedProgram[] = [];
      let skippedCount = 0;
      
      // Process 3 institutions per cycle if cycleOnly=true
      const institutionsToProcess = cycleOnly ? institutions.slice(0, 3) : institutions;
      console.log(`📊 Processing ${institutionsToProcess.length} institutions in ${cycleOnly ? 'CYCLE' : 'FULL'} mode`);
      
      for (const institution of institutionsToProcess) {
        console.log(`🔍 Processing institution: ${institution.name}`);
        console.log(`🔍 Institution URLs: ${institution.programUrls.length}`);
        
        const programUrls = await this.discoverRealProgramUrls(institution);
        console.log(`📍 Found ${programUrls.length} program URLs`);
        
        for (const url of programUrls.slice(0, 3)) { // Reduced to 3 for faster testing
          // Skip if already exists
          if (existingUrls.has(url)) {
            skippedCount++;
            console.log(`  ⏭️ Skipping (already exists): ${url}`);
            continue;
          }
          
          console.log(`  📍 Processing: ${url}`);
          try {
            const program = await this.scrapeProgramFromUrl(url, institution);
            if (program && this.isValidProgram(program)) {
              programs.push(program);
              console.log(`✅ Extracted: ${program.name}`);
            } else if (program) {
              console.log(`❌ Invalid program filtered: ${program.name}`);
      } else {
              console.log(`⚠️ No program extracted from: ${url}`);
            }
    } catch (error) {
            console.error(`❌ Error scraping ${url}:`, error);
          }
        }
      }

      // Merge with existing
      const allPrograms = [...existingPrograms, ...programs];
      console.log(`\n📊 Stats:`);
      console.log(`   New programs: ${programs.length}`);
      console.log(`   Skipped: ${skippedCount}`);
      console.log(`   Total programs: ${allPrograms.length}`);
      
      await this.browser?.close();
      this.browser = null;
      
      this.saveScrapedData(allPrograms);
      return allPrograms;
      
    } catch (error) {
      console.error('❌ Scraper error:', error);
      await this.browser?.close();
      this.browser = null;
      
      // Return empty array on error
      return [];
    }
  }

  private async discoverRealProgramUrls(institution: InstitutionConfig): Promise<string[]> {
    const programUrls: string[] = [];
    
    // Use predefined URLs as seed URLs
    for (const url of institution.programUrls) {
      if (this.isRealProgramUrl(url)) {
        programUrls.push(url);
        console.log(`  ✅ Added seed URL: ${url}`);
      }
    }
    
    // Enable auto-discovery to find more program URLs
    if (institution.autoDiscovery && programUrls.length > 0) {
      console.log(`  🔍 Auto-discovering additional URLs...`);
      
      for (const seedUrl of programUrls.slice(0, 2)) { // Use first 2 seed URLs
        try {
          const page = await this.browser!.newPage();
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
          await page.goto(seedUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
          
          // Find program links on the overview page
          const links = await page.evaluate((keywords, exclusionKeywords) => {
            const linkElements = Array.from(document.querySelectorAll('a[href]'));
            return linkElements
              .map(el => el.getAttribute('href'))
              .filter(href => href && (
                keywords.some(keyword => href.toLowerCase().includes(keyword)) ||
                href.includes('foerderung') || 
                href.includes('program') || 
                href.includes('grant') ||
                href.includes('funding') ||
                href.includes('startup') ||
                href.includes('innovation')
              ))
              .filter(href => href && 
                !exclusionKeywords.some(keyword => href.toLowerCase().includes(keyword))
              )
              .map(href => {
                if (href?.startsWith('/')) {
                  return new URL(href, window.location.origin).href;
                }
                return href;
              })
              .filter(href => href && href.startsWith('http'));
          }, institution.keywords, autoDiscoveryPatterns.exclusionKeywords);
          
          await page.close();
          
          // Add discovered URLs
          const discoveredUrls = links.filter((url): url is string => 
            url !== null && 
            url !== undefined &&
            url !== seedUrl && 
            this.isRealProgramUrl(url)
          );
          
          programUrls.push(...discoveredUrls);
          console.log(`  🔗 Found ${discoveredUrls.length} additional URLs from ${seedUrl || 'unknown'}`);
          
        } catch (error) {
          console.error(`❌ Error in auto-discovery from ${seedUrl || 'unknown'}:`, error);
        }
      }
    }
    
    return [...new Set(programUrls)]; // Remove duplicates
  }


  private isRealProgramUrl(url: string): boolean {
    const programKeywords = [
      'foerderung', 'program', 'grant', 'funding', 'startup', 'innovation',
      'research', 'development', 'investment', 'loan', 'equity', 'kredit',
      'finanzierung', 'darlehen', 'subvention', 'beihilfe'
    ];
    
    const blacklistKeywords = [
      'cookie', 'consent', 'newsletter', 'news', 'press', 'media', 
      'contact', 'about', 'imprint', 'privacy', 'datenschutz',
      'login', 'register', 'signup', 'signin', 'logout', 'account',
      'legal', 'terms', 'conditions', 'agreement', 'policy',
      'sitemap', 'search', 'menu', 'navigation', 'footer', 'header',
      '404', 'error', 'not-found', 'nicht-gefunden', 'tut-leid',
      'welcome', 'willkommen', 'home', 'start', 'index'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Must contain program keywords
    const hasProgramKeyword = programKeywords.some(keyword => urlLower.includes(keyword));
    
    // Must NOT contain blacklist keywords
    const hasBlacklistKeyword = blacklistKeywords.some(keyword => urlLower.includes(keyword));
    
    return hasProgramKeyword && !hasBlacklistKeyword;
  }

  private isValidProgram(program: ScrapedProgram): boolean {
    const blacklistNames = [
      'cookie consent', 'seite wurde nicht gefunden', '404', 'error',
      'not found', 'nicht gefunden', 'tut uns leid', 'welcome',
      'willkommen', 'home', 'start', 'index', 'newsletter'
    ];
    
    const nameLower = program.name.toLowerCase();
    const descriptionLower = program.description.toLowerCase();
    
    // Check if name or description contains blacklisted terms
    const hasBlacklistedName = blacklistNames.some(term => 
      nameLower.includes(term) || descriptionLower.includes(term)
    );
    
    return !hasBlacklistedName && program.name.length > 3;
  }

  private async scrapeProgramFromUrl(url: string, institution: InstitutionConfig): Promise<ScrapedProgram | null> {
    const page = await this.browser!.newPage();
    
    try {
      // Stealth measures
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      });
      
      // Normal delay for better extraction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Phase 3: Enhanced content extraction
      const name = this.extractEnhancedText($, institution.selectors.name) || 'Unknown Program';
      const description = this.extractEnhancedText($, institution.selectors.description) || 'No description available';
      
      // Extract 18 categories with enhanced parsing
      const categorized_requirements = this.extract18CategoriesEnhanced($, institution.selectors, content);
      
      // Auto-detect program focus
      const programFocus = this.detectProgramFocus(content, institution);
      
      // Detect funding type from content
      const fundingType = this.detectFundingType(content, institution.fundingTypes);
      
      await page.close();
      
      return {
        id: `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        type: fundingType,
        program_type: fundingType,
        source_url: url,
        institution: institution.name,
        program_category: fundingType,
        funding_types: institution.fundingTypes,
        program_focus: programFocus,
        eligibility_criteria: this.extractEligibilityCriteria($, institution.selectors),
        categorized_requirements,
        contact_info: this.extractContactInfo($, institution.selectors),
        scraped_at: new Date(),
        confidence_score: 0.8,
        is_active: true
      };
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error);
      try {
        await page.close();
      } catch (closeError) {
        // Ignore close errors
      }
      return null;
    }
  }

  private extractText($: cheerio.Root, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text) return text;
    }
    return '';
  }

  private extractEnhancedText($: cheerio.Root, selectors: string[]): string {
    // Try multiple strategies for better text extraction
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Try different text extraction methods
        let text = element.text().trim();
        if (text) {
          // Clean up the text
          text = text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
          if (text.length > 10) return text; // Only return meaningful text
        }
        
        // Try alt text for images
        text = element.attr('alt') || '';
        if (text && text.length > 10) return text;
        
        // Try title attribute
        text = element.attr('title') || '';
        if (text && text.length > 10) return text;
      }
    }
    
    // Fallback: try to find any meaningful text on the page
    const fallbackSelectors = ['h1', 'h2', 'h3', '.title', '.heading', '.program-name', '.foerderung-title'];
    for (const selector of fallbackSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 5 && !text.includes('Newsletter') && !text.includes('404')) {
        return text.replace(/\s+/g, ' ').trim();
      }
    }
    
    return '';
  }

  // Unused function - kept for reference
  /*
  private extract18Categories($: cheerio.Root, selectors: any): any {
    const categorized: any = {};
    
    // Initialize all 18 categories
    REQUIREMENT_CATEGORIES.forEach(category => {
      categorized[category] = [];
    });
    
    // Extract from eligibility section
    const eligibilityText = this.extractText($, selectors.eligibility);
    if (eligibilityText) {
      // Parse eligibility text for requirements
      this.parseEligibilityText(eligibilityText, categorized);
    }
    
    // Extract from requirements section
    const requirementsText = this.extractText($, selectors.requirements);
    if (requirementsText) {
      this.parseRequirementsText(requirementsText, categorized);
    }
    
    return categorized;
  }
  */

  private extract18CategoriesEnhanced($: cheerio.Root, selectors: any, content: string): any {
    const categorized: any = {};
    
    // Initialize all 18 categories
    REQUIREMENT_CATEGORIES.forEach(category => {
      categorized[category] = [];
    });
    
    // Phase 3: Enhanced extraction from multiple sources
    const allText = this.extractAllRelevantText($, content);
    
    // Parse from eligibility section
    const eligibilityText = this.extractEnhancedText($, selectors.eligibility);
    if (eligibilityText) {
      this.parseEligibilityTextEnhanced(eligibilityText, categorized);
    }
    
    // Parse from requirements section
    const requirementsText = this.extractEnhancedText($, selectors.requirements);
    if (requirementsText) {
      this.parseRequirementsTextEnhanced(requirementsText, categorized);
    }
    
    // Parse from full page content
    this.parseFullPageContent(allText, categorized);
    
    // Extract from specific page elements
    this.extractFromPageElements($, categorized);
    
    return categorized;
  }

  private extractAllRelevantText($: cheerio.Root, _content: string): string {
    // Extract text from multiple sources
    const textSources = [
      $('body').text(),
      $('.content').text(),
      $('.main').text(),
      $('.program-info').text(),
      $('.foerderung-info').text(),
      $('.requirements').text(),
      $('.eligibility').text(),
      $('.voraussetzungen').text(),
      $('.bedingungen').text()
    ];
    
    return textSources.join(' ').replace(/\s+/g, ' ').trim();
  }

  private extractFromPageElements($: cheerio.Root, categorized: any): void {
    // Look for specific elements that might contain requirements
    
    // Financial information
    $('.amount, .funding, .foerderung, .betrag').each((_, el) => {
      const text = $(el).text();
      if (text.includes('€') || text.includes('EUR') || text.includes('euro')) {
        categorized.financial.push({
          type: 'funding_amount',
          value: this.extractAmount(text),
          required: true,
          source: 'page_element'
        });
      }
    });
    
    // Timeline information
    $('.deadline, .frist, .laufzeit, .duration').each((_, el) => {
      const text = $(el).text();
      if (text.includes('jahr') || text.includes('month') || text.includes('deadline')) {
        categorized.timeline.push({
          type: 'duration',
          value: this.extractDuration(text),
          required: true,
          source: 'page_element'
        });
      }
    });
    
    // Geographic information
    $('.location, .standort, .region').each((_, el) => {
      const text = $(el).text();
      if (text.includes('österreich') || text.includes('austria') || text.includes('wien')) {
        categorized.geographic.push({
          type: 'location',
          value: 'Austria',
          required: true,
          source: 'page_element'
        });
      }
    });
  }

  private parseFullPageContent(text: string, categorized: any): void {
    const lowerText = text.toLowerCase();
    
    // Phase 4: Complete 18 categories parsing
    
    // 1. ELIGIBILITY
    if (lowerText.includes('startup') || lowerText.includes('neugründung') || lowerText.includes('gründung')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Startup',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('unternehmen') || lowerText.includes('firma') || lowerText.includes('company')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Company',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 2. DOCUMENTS
    if (lowerText.includes('dokument') || lowerText.includes('unterlagen') || lowerText.includes('antrag')) {
      categorized.documents.push({
        type: 'required_documents',
        value: 'Various documents required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('business plan') || lowerText.includes('geschäftsplan')) {
      categorized.documents.push({
        type: 'business_plan',
        value: 'Business plan required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 3. FINANCIAL
    if (lowerText.includes('eigenmittel') || lowerText.includes('eigenkapital') || lowerText.includes('co-financing')) {
      categorized.financial.push({
        type: 'co_financing',
        value: this.extractPercentage(text) || 'Required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('förderhöhe') || lowerText.includes('maximal') || lowerText.includes('bis zu')) {
      categorized.financial.push({
        type: 'funding_amount',
        value: this.extractAmount(text),
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('umsatz') || lowerText.includes('revenue') || lowerText.includes('turnover')) {
      categorized.financial.push({
        type: 'revenue_requirement',
        value: this.extractAmount(text),
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 4. TECHNICAL
    if (lowerText.includes('trl') || lowerText.includes('technology readiness')) {
      categorized.technical.push({
        type: 'trl_level',
        value: this.extractTRL(text),
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('technologie') || lowerText.includes('technology') || lowerText.includes('digital')) {
      categorized.technical.push({
        type: 'technology_focus',
        value: 'Technology focus required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 5. LEGAL
    if (lowerText.includes('rechtlich') || lowerText.includes('legal') || lowerText.includes('compliance')) {
      categorized.legal.push({
        type: 'legal_compliance',
        value: 'Legal compliance required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 6. TIMELINE
    if (lowerText.includes('laufzeit') || lowerText.includes('duration') || lowerText.includes('zeitraum')) {
      categorized.timeline.push({
        type: 'duration',
        value: this.extractDuration(text),
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('deadline') || lowerText.includes('bewerbung') || lowerText.includes('einreichung')) {
      categorized.timeline.push({
        type: 'deadline',
        value: 'Application deadline exists',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 7. GEOGRAPHIC
    if (lowerText.includes('österreich') || lowerText.includes('austria')) {
      categorized.geographic.push({
        type: 'location',
        value: 'Austria',
            required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('wien') || lowerText.includes('vienna')) {
      categorized.geographic.push({
        type: 'specific_location',
        value: 'Vienna',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('deutschland') || lowerText.includes('germany')) {
      categorized.geographic.push({
        type: 'location',
        value: 'Germany',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('frankreich') || lowerText.includes('france')) {
      categorized.geographic.push({
        type: 'location',
        value: 'France',
              required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('eu') || lowerText.includes('europe')) {
      categorized.geographic.push({
        type: 'location',
        value: 'EU',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 8. TEAM
    if (lowerText.includes('team') || lowerText.includes('mitarbeiter') || lowerText.includes('personal')) {
      categorized.team.push({
        type: 'team_size',
        value: this.extractNumber(text) || 'Multiple',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('qualifikation') || lowerText.includes('ausbildung') || lowerText.includes('studium')) {
      categorized.team.push({
        type: 'qualification',
        value: 'Specific qualifications required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 9. PROJECT
    if (lowerText.includes('innovation') || lowerText.includes('forschung') || lowerText.includes('entwicklung')) {
      categorized.project.push({
        type: 'innovation_focus',
        value: 'Innovation/Research required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('nachhaltigkeit') || lowerText.includes('sustainability') || lowerText.includes('klima')) {
      categorized.project.push({
        type: 'sustainability_focus',
        value: 'Sustainability focus required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 10. COMPLIANCE
    if (lowerText.includes('compliance') || lowerText.includes('regulierung') || lowerText.includes('regulation')) {
      categorized.compliance.push({
        type: 'regulatory_compliance',
        value: 'Regulatory compliance required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 11. IMPACT
    if (lowerText.includes('nachhaltigkeit') || lowerText.includes('sustainability')) {
      categorized.impact.push({
        type: 'sustainability',
        value: 'Sustainability impact required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('arbeitsplätze') || lowerText.includes('jobs') || lowerText.includes('employment')) {
      categorized.impact.push({
        type: 'employment_impact',
        value: 'Job creation impact',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 12. CAPEX_OPEX
    if (lowerText.includes('investition') || lowerText.includes('investment') || lowerText.includes('kapital')) {
      categorized.capex_opex.push({
        type: 'investment_type',
        value: 'Capital investment required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('betriebskosten') || lowerText.includes('operating') || lowerText.includes('opex')) {
      categorized.capex_opex.push({
        type: 'operating_costs',
        value: 'Operating cost coverage',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 13. USE_OF_FUNDS
    if (lowerText.includes('verwendung') || lowerText.includes('use of funds') || lowerText.includes('zweck')) {
      categorized.use_of_funds.push({
        type: 'fund_usage',
        value: 'Specific fund usage required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('forschung') || lowerText.includes('research') || lowerText.includes('entwicklung')) {
      categorized.use_of_funds.push({
        type: 'research_funding',
        value: 'Research and development funding',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 14. REVENUE_MODEL
    if (lowerText.includes('umsatz') || lowerText.includes('revenue') || lowerText.includes('einnahmen')) {
      categorized.revenue_model.push({
        type: 'revenue_requirement',
        value: 'Revenue generation required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('profit') || lowerText.includes('gewinn') || lowerText.includes('rentabilität')) {
      categorized.revenue_model.push({
        type: 'profitability',
        value: 'Profitability required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 15. MARKET_SIZE
    if (lowerText.includes('markt') || lowerText.includes('market') || lowerText.includes('zielgruppe')) {
      categorized.market_size.push({
        type: 'market_requirement',
        value: 'Market size requirement',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('international') || lowerText.includes('global') || lowerText.includes('weltweit')) {
      categorized.market_size.push({
        type: 'market_scope',
        value: 'International market scope',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // 16. CO_FINANCING (already covered in financial)
    
    // 17. TRL_LEVEL (already covered in technical)
    
    // 18. CONSORTIUM
    if (lowerText.includes('konsortium') || lowerText.includes('consortium') || lowerText.includes('partnerschaft')) {
      categorized.consortium.push({
        type: 'consortium_required',
        value: 'Consortium partnership required',
        required: true,
        source: 'full_page_content'
      });
    }
    if (lowerText.includes('kooperation') || lowerText.includes('cooperation') || lowerText.includes('zusammenarbeit')) {
      categorized.consortium.push({
        type: 'cooperation',
        value: 'Cooperation required',
        required: true,
        source: 'full_page_content'
      });
    }
  }

  private parseEligibilityText(text: string, categorized: any): void {
    const lowerText = text.toLowerCase();
    
    // Financial requirements - Enhanced detection
    if (lowerText.includes('co-financing') || lowerText.includes('eigenmittel') || lowerText.includes('eigenkapital')) {
      categorized.financial.push({
        type: 'co_financing',
        value: this.extractPercentage(text) || this.extractNumber(text) + '%',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('förderhöhe') || lowerText.includes('maximal') || lowerText.includes('bis zu')) {
      categorized.financial.push({
        type: 'funding_amount',
        value: this.extractAmount(text),
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Geographic requirements - Enhanced detection
    if (lowerText.includes('österreich') || lowerText.includes('austria') || lowerText.includes('at-')) {
      categorized.geographic.push({
        type: 'location',
        value: 'Austria',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('wien') || lowerText.includes('vienna')) {
      categorized.geographic.push({
        type: 'specific_location',
        value: 'Vienna',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Team requirements - Enhanced detection
    if (lowerText.includes('team') || lowerText.includes('mitarbeiter') || lowerText.includes('personal')) {
      categorized.team.push({
        type: 'team_size',
        value: this.extractNumber(text) || 'Multiple',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('qualifikation') || lowerText.includes('ausbildung') || lowerText.includes('studium')) {
      categorized.team.push({
        type: 'qualification',
        value: 'Specific qualifications required',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Timeline requirements - Enhanced detection
    if (lowerText.includes('laufzeit') || lowerText.includes('duration') || lowerText.includes('zeitraum')) {
      categorized.timeline.push({
        type: 'duration',
        value: this.extractDuration(text),
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('deadline') || lowerText.includes('bewerbung') || lowerText.includes('einreichung')) {
      categorized.timeline.push({
        type: 'deadline',
        value: 'Application deadline exists',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Project requirements - Enhanced detection
    if (lowerText.includes('innovation') || lowerText.includes('forschung') || lowerText.includes('entwicklung')) {
      categorized.project.push({
        type: 'innovation_focus',
        value: 'Innovation/Research required',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('trl') || lowerText.includes('technology readiness')) {
      categorized.technical.push({
        type: 'trl_level',
        value: this.extractTRL(text),
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Company requirements - Enhanced detection
    if (lowerText.includes('startup') || lowerText.includes('neugründung')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Startup',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('unternehmen') || lowerText.includes('firma')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Company',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    // Impact requirements - Enhanced detection
    if (lowerText.includes('nachhaltigkeit') || lowerText.includes('sustainability')) {
      categorized.impact.push({
        type: 'sustainability',
        value: 'Sustainability impact required',
        required: true,
        source: 'eligibility_text'
      });
    }
    
    if (lowerText.includes('arbeitsplätze') || lowerText.includes('jobs') || lowerText.includes('employment')) {
      categorized.impact.push({
        type: 'employment_impact',
        value: 'Job creation impact',
        required: true,
        source: 'eligibility_text'
      });
    }
  }

  private parseRequirementsText(text: string, categorized: any): void {
    const lowerText = text.toLowerCase();
    
    // Document requirements
    if (lowerText.includes('dokument') || lowerText.includes('unterlagen')) {
      categorized.documents.push({
        type: 'required_documents',
        value: 'Various documents required',
        required: true,
        source: 'requirements_text'
      });
    }
    
    // Legal requirements
    if (lowerText.includes('rechtlich') || lowerText.includes('legal')) {
      categorized.legal.push({
        type: 'legal_compliance',
        value: 'Legal compliance required',
        required: true,
        source: 'requirements_text'
      });
    }
  }

  private parseEligibilityTextEnhanced(text: string, categorized: any): void {
    // Enhanced version of parseEligibilityText with more patterns
    this.parseEligibilityText(text, categorized);
    
    const lowerText = text.toLowerCase();
    
    // Additional patterns for Phase 3
    if (lowerText.includes('unternehmen') || lowerText.includes('firma') || lowerText.includes('company')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Company required',
        required: true,
        source: 'enhanced_eligibility'
      });
    }
    
    if (lowerText.includes('startup') || lowerText.includes('neugründung') || lowerText.includes('gründung')) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Startup',
        required: true,
        source: 'enhanced_eligibility'
      });
    }
    
    if (lowerText.includes('umsatz') || lowerText.includes('revenue') || lowerText.includes('turnover')) {
      categorized.financial.push({
        type: 'revenue_requirement',
        value: this.extractAmount(text),
        required: true,
        source: 'enhanced_eligibility'
      });
    }
  }

  private parseRequirementsTextEnhanced(text: string, categorized: any): void {
    // Enhanced version of parseRequirementsText
    this.parseRequirementsText(text, categorized);
    
    const lowerText = text.toLowerCase();
    
    // Additional patterns for Phase 3
    if (lowerText.includes('bewerbung') || lowerText.includes('application') || lowerText.includes('antrag')) {
      categorized.documents.push({
        type: 'application_documents',
        value: 'Application documents required',
        required: true,
        source: 'enhanced_requirements'
      });
    }
    
    if (lowerText.includes('business plan') || lowerText.includes('geschäftsplan')) {
      categorized.documents.push({
        type: 'business_plan',
        value: 'Business plan required',
        required: true,
        source: 'enhanced_requirements'
      });
    }
    
    if (lowerText.includes('finanzplan') || lowerText.includes('financial plan')) {
      categorized.financial.push({
        type: 'financial_plan',
        value: 'Financial plan required',
        required: true,
        source: 'enhanced_requirements'
      });
    }
  }

  private extractEligibilityCriteria($: cheerio.Root, selectors: any): any {
    const eligibilityText = this.extractText($, selectors.eligibility);
    const criteria: any = {};
    
    if (eligibilityText) {
      const lowerText = eligibilityText.toLowerCase();
      
      // Extract common eligibility criteria
      if (lowerText.includes('unternehmen')) criteria.company_type = 'company';
      if (lowerText.includes('startup')) criteria.company_type = 'startup';
      if (lowerText.includes('forschung')) criteria.research_focus = true;
      if (lowerText.includes('innovation')) criteria.innovation_focus = true;
    }
    
    return criteria;
  }

  private extractContactInfo($: cheerio.Root, selectors: any): any {
    const contactText = this.extractText($, selectors.contact);
    return {
      text: contactText,
      email: this.extractEmail(contactText),
      phone: this.extractPhone(contactText)
    };
  }

  private detectFundingType(content: string, institutionTypes: string[]): string {
    const lowerContent = content.toLowerCase();
    
    // Check for specific funding types
    if (lowerContent.includes('grant') || lowerContent.includes('förderung')) return 'grant';
    if (lowerContent.includes('loan') || lowerContent.includes('kredit')) return 'loan';
    if (lowerContent.includes('equity') || lowerContent.includes('beteiligung')) return 'equity';
    if (lowerContent.includes('startup')) return 'startup';
    if (lowerContent.includes('research') || lowerContent.includes('forschung')) return 'research';
    
    // Default to first institution type
    return institutionTypes[0] || 'grant';
  }

  // Helper methods for text extraction
  private extractPercentage(text: string): string {
    const match = text.match(/(\d+)%/);
    return match ? match[1] + '%' : 'Unknown';
  }

  private extractNumber(text: string): string {
    const match = text.match(/(\d+)/);
    return match ? match[1] : 'Unknown';
  }

  private extractAmount(text: string): string {
    const match = text.match(/(\d+[\.,]\d+|\d+)\s*(€|EUR|euro|million|mio|k|tausend)/i);
    return match ? match[0] : 'Unknown amount';
  }

  private extractDuration(text: string): string {
    const match = text.match(/(\d+)\s*(jahr|month|monat|jahr|years?)/i);
    return match ? match[1] + ' ' + match[2] : 'Unknown duration';
  }

  private extractTRL(text: string): string {
    const match = text.match(/trl\s*(\d+)/i);
    return match ? 'TRL ' + match[1] : 'Unknown TRL';
  }

  private extractPhone(text: string): string {
    if (!text) return '';
    
    // Common phone patterns
    const phonePatterns = [
      /\+43\s*\d{1,4}\s*\d{3,4}\s*\d{3,4}/g, // Austrian format
      /\+49\s*\d{1,4}\s*\d{3,4}\s*\d{3,4}/g, // German format
      /\+33\s*\d{1,4}\s*\d{3,4}\s*\d{3,4}/g, // French format
      /\(\d{3,4}\)\s*\d{3,4}\s*\d{3,4}/g,    // US format
      /\d{3,4}\s*\d{3,4}\s*\d{3,4}/g,        // General format
      /Tel[.:\s]*(\+?\d[\d\s\-\(\)]+)/gi,     // Tel: prefix
      /Phone[.:\s]*(\+?\d[\d\s\-\(\)]+)/gi,   // Phone: prefix
      /Telefon[.:\s]*(\+?\d[\d\s\-\(\)]+)/gi // German Telefon: prefix
    ];
    
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    return '';
  }

  private extractEmail(text: string): string {
    const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : '';
  }

  private detectProgramFocus(text: string, institution: InstitutionConfig): string[] {
    const lowerText = text.toLowerCase();
    const detectedFocus: string[] = [];
    
    // Program focus keywords mapping
    const focusKeywords = {
      'innovation': ['innovation', 'innovativ', 'innovazione', 'innovación', 'innovatie', 'innover', 'innovatif'],
      'research': ['research', 'forschung', 'recherche', 'ricerca', 'investigación', 'onderzoek', 'research'],
      'startup': ['startup', 'neugründung', 'création', 'creazione', 'creación', 'oprichting', 'start-up'],
      'export': ['export', 'ausfuhr', 'exportation', 'esportazione', 'exportación', 'uitvoer', 'exportation'],
      'employment': ['employment', 'beschäftigung', 'emploi', 'occupazione', 'empleo', 'werkgelegenheid', 'employment'],
      'training': ['training', 'ausbildung', 'formation', 'formazione', 'formación', 'opleiding', 'formation'],
      'business': ['business', 'unternehmen', 'entreprise', 'impresa', 'empresa', 'bedrijf', 'entreprise'],
      'sustainability': ['sustainability', 'nachhaltigkeit', 'durabilité', 'sostenibilità', 'sostenibilidad', 'duurzaamheid', 'durabilité'],
      'transport': ['transport', 'verkehr', 'transport', 'trasporto', 'transporte', 'vervoer', 'transport'],
      'technology': ['technology', 'technologie', 'technologie', 'tecnologia', 'tecnología', 'technologie', 'technologie'],
      'digital': ['digital', 'digital', 'numérique', 'digitale', 'digital', 'digitaal', 'numérique'],
      'environment': ['environment', 'umwelt', 'environnement', 'ambiente', 'medio ambiente', 'milieu', 'environnement'],
      'energy': ['energy', 'energie', 'énergie', 'energia', 'energía', 'energie', 'énergie'],
      'healthcare': ['healthcare', 'gesundheit', 'santé', 'sanità', 'salud', 'gezondheidszorg', 'santé'],
      'education': ['education', 'bildung', 'éducation', 'istruzione', 'educación', 'onderwijs', 'éducation']
    };
    
    // Check each focus area
    for (const [focus, keywords] of Object.entries(focusKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedFocus.push(focus);
      }
    }
    
    // Also check institution keywords for additional context
    for (const keyword of institution.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerKeyword.includes('innovation') && !detectedFocus.includes('innovation')) {
        detectedFocus.push('innovation');
      }
      if (lowerKeyword.includes('startup') && !detectedFocus.includes('startup')) {
        detectedFocus.push('startup');
      }
      if (lowerKeyword.includes('export') && !detectedFocus.includes('export')) {
        detectedFocus.push('export');
      }
      if (lowerKeyword.includes('research') && !detectedFocus.includes('research')) {
        detectedFocus.push('research');
      }
    }
    
    return [...new Set(detectedFocus)]; // Remove duplicates
  }

  private loadExistingPrograms(): ScrapedProgram[] {
    const dataPath = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
    
    if (!fs.existsSync(dataPath)) {
      return [];
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return data.programs || [];
    } catch (error) {
      console.error('Error loading existing programs:', error);
      return [];
    }
  }

  private saveScrapedData(programs: ScrapedProgram[]): void {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const data = {
      timestamp: new Date().toISOString(),
      totalPrograms: programs.length,
      programs: programs
    };
    
    fs.writeFileSync(
      path.join(dataDir, 'scraped-programs-latest.json'),
      JSON.stringify(data, null, 2)
    );
    
    console.log(`💾 Saved ${programs.length} programs with 18 categories`);
  }
}