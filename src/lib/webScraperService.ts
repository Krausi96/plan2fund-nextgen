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
  // Enhanced structured data fields
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string;
  deadline?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

// 18 Categories for Requirements
const REQUIREMENT_CATEGORIES = [
  'eligibility', 'documents', 'financial', 'technical', 'legal', 
  'timeline', 'geographic', 'team', 'project', 'compliance', 
  'impact', 'capex_opex', 'use_of_funds', 'revenue_model', 
  'market_size', 'co_financing', 'trl_level', 'consortium'
];

// Discovery State Management
interface ExploredSection {
  seedUrl: string;
  lastExplored: string; // ISO date string
  discoveredUrls: string[];
  depth: number;
}

interface InstitutionDiscoveryState {
  lastFullScan: string | null;
  exploredSections: ExploredSection[];
  knownUrls: string[];
  unscrapedUrls: string[];
}

interface DiscoveryStateCache {
  [institutionName: string]: InstitutionDiscoveryState;
}

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

  async scrapeAllPrograms(
    cycleOnly: boolean = false, 
    discoveryMode: 'incremental' | 'deep' = 'incremental'
  ): Promise<ScrapedProgram[]> {
    console.log('🚀 Enhanced scraper with cycle support and skip logic...');
    console.log(`📊 Total institutions: ${institutions.length}`);
    console.log(`📊 Cycle mode: ${cycleOnly}`);
    console.log(`📊 Discovery mode: ${discoveryMode.toUpperCase()}`);
    
    // Deep mode: Clear discovery state for full re-exploration
    if (discoveryMode === 'deep') {
      console.log('🔍 [DISCOVERY] Deep mode: Clearing discovery state for full re-exploration');
      this.clearDiscoveryState();
    }
    
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
      
      // Process MORE institutions per cycle - not just 3!
      const institutionsToProcess = cycleOnly ? institutions.slice(0, 10) : institutions;
      console.log(`📊 Processing ${institutionsToProcess.length} institutions in ${cycleOnly ? 'CYCLE' : 'FULL'} mode`);
      
      for (const institution of institutionsToProcess) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔍 [INSTITUTION] Processing: ${institution.name}`);
        console.log(`🔍 [INSTITUTION] Base URL: ${institution.baseUrl}`);
        console.log(`🔍 [INSTITUTION] Seed URLs: ${institution.programUrls.length}`);
        institution.programUrls.forEach((url, idx) => {
          console.log(`  ${idx + 1}. ${url}`);
        });
        console.log(`🔍 [INSTITUTION] Auto-discovery: ${institution.autoDiscovery ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🔍 [INSTITUTION] Keywords: ${institution.keywords.join(', ')}`);
        
        const programUrls = await this.discoverRealProgramUrls(institution, discoveryMode);
        console.log(`📍 [DISCOVERY] Found ${programUrls.length} total program URLs (taking first 15)`);
        
        // Prioritize: unscraped URLs first, then new discoveries
        const prioritizedUrls = this.prioritizeUrls(programUrls, existingUrls);
        // INCREASED: Process more URLs per institution (was 15, now 50)
        const urlsToProcess = prioritizedUrls.slice(0, 50);
        console.log(`📍 [DISCOVERY] Processing ${urlsToProcess.length} URLs...\n`);
        
        for (let idx = 0; idx < urlsToProcess.length; idx++) {
          const url = urlsToProcess[idx];
          console.log(`  ──────────────────────────────────────`);
          console.log(`  📌 [${idx + 1}/${urlsToProcess.length}] URL: ${url}`);
          
          // Skip if already exists
          if (existingUrls.has(url)) {
            skippedCount++;
            console.log(`  ⏭️  [SKIP] Already exists in database`);
            continue;
          }
          
          // ENHANCED: Pre-validate URL before scraping
          console.log(`  🔍 [CHECK] Pre-validating URL...`);
          const isValidUrl = await this.preValidateUrl(url);
          if (!isValidUrl) {
            console.log(`  ❌ [SKIP] URL failed validation`);
            continue;
          }
          
          console.log(`  📍 [SCRAPE] Starting scraping...`);
          try {
            const program = await this.scrapeProgramFromUrl(url, institution);
            if (program && this.isValidProgram(program)) {
              programs.push(program);
              console.log(`  ✅ [SUCCESS] Extracted program: "${program.name}"`);
              console.log(`     Type: ${program.type}, Institution: ${program.institution}`);
            } else if (program) {
              console.log(`  ❌ [FILTER] Program filtered out: "${program.name}"`);
            } else {
              console.log(`  ⚠️  [EMPTY] No program extracted from URL`);
            }
          } catch (error) {
            console.error(`  ❌ [ERROR] Scraping failed:`, error instanceof Error ? error.message : error);
          }
          console.log(`  ──────────────────────────────────────\n`);
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

  private async discoverRealProgramUrls(
    institution: InstitutionConfig,
    discoveryMode: 'incremental' | 'deep' = 'incremental'
  ): Promise<string[]> {
    console.log(`  🔍 [DISCOVERY] Starting ${discoveryMode} URL discovery...`);
    
    // Load discovery state for this institution
    const state = this.loadDiscoveryState(institution.name);
    const discoveredUrls = new Set<string>();
    const urlQueue: Array<{url: string, depth: number, seedUrl?: string}> = [];
    
    // Add seed URLs to queue (if not fully explored in incremental mode)
    for (const seedUrl of institution.programUrls) {
      if (!this.isRealProgramUrl(seedUrl)) {
        console.log(`  ⚠️  [DISCOVERY] Seed URL filtered: ${seedUrl}`);
        continue;
      }
      
      // SIMPLIFIED: Always explore seed URLs (no skip logic needed - unscrapedUrls already handles duplicates)
      // In incremental mode, unscraped URLs from previous runs are already added below (line 261-267)
      urlQueue.push({url: seedUrl, depth: 0, seedUrl});
      discoveredUrls.add(seedUrl);
      console.log(`  ✅ [DISCOVERY] Added seed URL to queue: ${seedUrl}`);
    }
    
    console.log(`  🔍 [DISCOVERY] Queue initialized with ${urlQueue.length} URLs to explore`);
    
    // Breadth-first exploration with pagination support
    const maxDepth = 2; // Max depth for exploration
    const maxUrlsToDiscover = 100; // Increased limit for better discovery
    
    // First, add any unscraped URLs from already-explored sections to discoveredUrls
    const existingPrograms = this.loadExistingPrograms();
    const existingUrlsSet = new Set(existingPrograms.map(p => p.source_url));
    
    for (const section of state.exploredSections) {
      const unscrapedFromSection = section.discoveredUrls.filter(url => !existingUrlsSet.has(url));
      unscrapedFromSection.forEach(url => {
        discoveredUrls.add(url);
        console.log(`  ➕ [DISCOVERY] Added unscraped URL from explored section: ${url}`);
      });
    }
    
    while (urlQueue.length > 0 && discoveredUrls.size < maxUrlsToDiscover) {
      const {url, depth, seedUrl: parentSeedUrl} = urlQueue.shift()!;
      
      if (depth > maxDepth) {
        console.log(`  ⏭️  [DISCOVERY] Skipping ${url} (depth ${depth} > ${maxDepth})`);
        continue;
      }
      
      console.log(`  🔍 [DISCOVERY] Exploring [depth ${depth}]: ${url}`);
      
      try {
        const links = await this.extractLinksFromPage(url, institution);
        const currentSeed = parentSeedUrl || url;
        
        // Separate pagination/category links from program detail links
        const paginationLinks = this.findPaginationLinks(links, url);
        const categoryLinks = links.filter(link => 
          link !== url && 
          this.isRealProgramUrl(link) &&
          !this.isProgramDetailPage(link) &&
          !discoveredUrls.has(link)
        );
        const programDetailLinks = links.filter(link => 
          link !== url && 
          this.isProgramDetailPage(link) &&
          !discoveredUrls.has(link)
        );
        
        // Add pagination/category links to queue (explore them to find detail pages)
        const allExplorationLinks = [...paginationLinks, ...categoryLinks];
        for (const exploreLink of allExplorationLinks) {
          if (!discoveredUrls.has(exploreLink) && depth < maxDepth) {
            urlQueue.push({url: exploreLink, depth: depth + 1, seedUrl: currentSeed});
            discoveredUrls.add(exploreLink);
            console.log(`  ➕ [DISCOVERY] Added exploration link (category/pagination, depth ${depth + 1}): ${exploreLink}`);
          }
        }
        
        // Add program DETAIL links directly (these are what we want to scrape)
        for (const detailLink of programDetailLinks) {
          discoveredUrls.add(detailLink);
          console.log(`  ✅ [DISCOVERY] Found program DETAIL page: ${detailLink}`);
        }
        
        // Update discovery state for this section
        if (parentSeedUrl || depth === 0) {
          const sectionUrl = parentSeedUrl || url;
          const sectionIndex = state.exploredSections.findIndex(s => s.seedUrl === sectionUrl);
          const discovered = Array.from(discoveredUrls);
          
          if (sectionIndex >= 0) {
            // Update existing section
            state.exploredSections[sectionIndex].lastExplored = new Date().toISOString();
            state.exploredSections[sectionIndex].discoveredUrls = discovered;
            state.exploredSections[sectionIndex].depth = Math.max(state.exploredSections[sectionIndex].depth, depth);
          } else {
            // Add new section
            state.exploredSections.push({
              seedUrl: sectionUrl,
              lastExplored: new Date().toISOString(),
              discoveredUrls: discovered,
              depth: depth
            });
          }
        }
        
      } catch (error) {
        console.error(`  ❌ [DISCOVERY] Error exploring ${url}:`, error instanceof Error ? error.message : error);
      }
    }
    
    // Save updated discovery state
    state.knownUrls = Array.from(discoveredUrls);
    
    // Calculate unscraped URLs: known URLs that are NOT in existing programs database
    // Use already-loaded existingPrograms to avoid double-loading
    state.unscrapedUrls = state.knownUrls.filter(url => !existingUrlsSet.has(url));
    
    if (discoveryMode === 'deep') {
      state.lastFullScan = new Date().toISOString();
    }
    this.saveDiscoveryState(institution.name, state);
    
    // Return unscraped URLs first, then all discovered URLs
    // This ensures new URLs are prioritized
    const uniqueUrls = Array.from(discoveredUrls);
    const unscraped = state.unscrapedUrls;
    const sortedUrls = [
      ...unscraped.filter(url => uniqueUrls.includes(url)), // Unscraped first
      ...uniqueUrls.filter(url => !unscraped.includes(url)) // Then already-scraped
    ];
    
    console.log(`  ✅ [DISCOVERY] Final URL count: ${uniqueUrls.length}`);
    console.log(`  📊 [DISCOVERY] Unscraped URLs: ${unscraped.length} of ${uniqueUrls.length}`);
    if (unscraped.length > 0) {
      console.log(`  🎯 [DISCOVERY] Prioritizing ${unscraped.length} unscraped URLs for scraping`);
    }
    
    return sortedUrls.length > 0 ? sortedUrls : uniqueUrls;
  }


  private isRealProgramUrl(url: string): boolean {
    const programKeywords = [
      'foerderung', 'program', 'grant', 'funding', 'startup', 'innovation',
      'research', 'development', 'investment', 'loan', 'equity', 'kredit',
      'finanzierung', 'darlehen', 'subvention', 'beihilfe', 'leasing',
      'export', 'ausbildung', 'innovation', 'forschung'
    ];
    
    const blacklistKeywords = [
      'cookie', 'consent', 'newsletter', 'news', 'press', 'media', 
      'contact', 'about', 'imprint', 'privacy', 'datenschutz',
      'login', 'register', 'signup', 'signin', 'logout', 'account',
      'legal', 'terms', 'conditions', 'agreement', 'policy',
      'sitemap', 'search', 'menu', 'navigation', 'footer', 'header',
      '404', 'error', 'not-found', 'nicht-gefunden', 'tut-leid',
      'welcome', 'willkommen', 'home', 'start', 'index',
      'kreditkarte', 'credit-card', 'wohnmesse', 'wohnfinanzierung',
      'privatkunden', 'sparkasse', 'redes-sociales', 'social-media',
      'facebook', 'twitter', 'linkedin', 'youtube', 'instagram',
      'mailing', 'subscribe', 'unsubscribe', 'opt-out', 'opt-in',
      'marketing', 'werbung', 'banner', 'popup', 'modal', 'overlay',
      'gdpr', 'dsgvo', 'faq', 'help', 'support', 'feedback',
      // Enhanced: Additional patterns from observed failures
      'kreditrechner', 'calculator', 'kampagne', '.jsp',
      '/lehre/', '/oe/', '/immo/', 'wohnfinanzierung'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Must contain program keywords
    const hasProgramKeyword = programKeywords.some(keyword => urlLower.includes(keyword));
    
    // Must NOT contain blacklist keywords
    const hasBlacklistKeyword = blacklistKeywords.some(keyword => urlLower.includes(keyword));
    
    // Additional validation: URL structure
    const hasValidStructure = !urlLower.includes('?') || 
                             (urlLower.includes('?') && !urlLower.includes('field_') && !urlLower.includes('filter'));
    
    // Must be a real page, not a query parameter page
    const isNotQueryPage = !urlLower.match(/[?&]field_[^=&]*=[^=&]*/);
    
    return hasProgramKeyword && !hasBlacklistKeyword && hasValidStructure && isNotQueryPage;
  }

  // NEW: Check if URL is a program DETAIL page (not a category/listing page)
  private isProgramDetailPage(url: string): boolean {
    if (!this.isRealProgramUrl(url)) {
      return false;
    }
    
    const urlPath = new URL(url).pathname.toLowerCase();
    
    // Category/listing page indicators (exclude these)
    const categoryIndicators = [
      '/foerderungen', '/foerderung', // Plural/list pages
      '/programme', '/programs', '/program', // Generic program listings
      '/spezialprogramme', '/special-programmes', '/special-programms', // Category pages
      '/alle-', '/all-', '/overview', '/liste', '/list',
      '/wettbewerbe', '/competitions', '/universitaeten', '/universities', '/weitere', '/others', // Category pages
      '/archiv', '/archive',
      '/investors-incubators', '/investoren-inkubatoren' // Category pages
    ];
    
    // Check if URL ends with a category indicator (likely a listing page)
    const isCategoryPage = categoryIndicators.some(indicator => 
      urlPath.endsWith(indicator + '/') || 
      urlPath.endsWith(indicator) || 
      urlPath === indicator || 
      urlPath === indicator + '/'
    );
    
    if (isCategoryPage) {
      return false;
    }
    
    // Detail page indicators (include these)
    // URLs with specific program names/IDs in the path
    const hasSpecificIdentifier = !!urlPath.match(/\/([a-z0-9\-]{10,}|[a-z]{3,}\-[a-z]{3,})/); // Long identifiers or compound names
    
    // URLs that are NOT just category listings
    // If it's a deep path (3+ segments) or has a specific program identifier
    const pathSegments = urlPath.split('/').filter(s => s.length > 0);
    const hasDepth = pathSegments.length >= 3; // e.g., /spezialprogramme/investoren-inkubatoren/
    
    // Detail pages typically have either:
    // 1. Deep path structure (category/subcategory/program)
    // 2. Specific program identifier (not generic category name)
    const isDetailPage = hasDepth || hasSpecificIdentifier;
    
    return isDetailPage;
  }

  // ENHANCED: Extract structured data (amounts, deadlines, contact)
  private extractStructuredData(content: string): any {
    const structuredData: any = {
      funding_amount_min: null,
      funding_amount_max: null,
      currency: 'EUR',
      deadline: null,
      contact_email: null,
      contact_phone: null
    };
    
    const text = content.toLowerCase();
    
    // Extract funding amounts - IMPROVED patterns
    const amountPatterns = [
      // German patterns
      /(?:bis zu|maximal|höchstens|bis zu|up to|maximum|max\.?)\s*€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|€|eur)?/gi,
      /€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|€|eur)/gi,
      /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*€/gi,
      // English patterns
      /(?:up to|maximum|max\.?)\s*€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|€|eur)?/gi,
      // Specific patterns
      /(?:förderhöhe|förderbetrag|förderung)\s*:?\s*€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi,
      /(?:finanzierung|kredit|darlehen)\s*(?:bis zu|maximal)\s*€?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi
    ];
    
    for (const pattern of amountPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          const amountStr = match[1].replace(/[^\d.,]/g, '').replace(',', '.');
          const numAmount = parseFloat(amountStr);
          if (numAmount > 0 && numAmount < 10000000) { // Reasonable range
            structuredData.funding_amount_max = numAmount;
            break;
          }
        }
        if (structuredData.funding_amount_max) break;
      }
    }
    
    // Extract deadlines - IMPROVED patterns
    const deadlinePatterns = [
      // German patterns
      /(?:bewerbungsfrist|deadline|einreichung|application|antragsfrist)\s*:?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      /(?:bis zum|bis|deadline)\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      // English patterns
      /(?:deadline|application|due)\s*(?:by|until)?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      // General date patterns
      /(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/g
    ];
    
    for (const pattern of deadlinePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        // Take the first reasonable date
        for (const match of matches) {
          const dateStr = match[1];
          if (this.isValidDate(dateStr)) {
            structuredData.deadline = this.formatDate(dateStr);
            break;
          }
        }
        if (structuredData.deadline) break;
      }
    }
    
    // Extract contact info - IMPROVED patterns
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      structuredData.contact_email = emailMatch[1];
    }
    
    const phonePatterns = [
      /(?:\+43|\+49|\+33)?\s*(\d{2,4}\s*\d{3,4}\s*\d{3,4})/g,
      /(?:0\d{3,4}\s*\d{3,4}\s*\d{3,4})/g,
      /(?:\+43\s*\d{3,4}\s*\d{3,4}\s*\d{3,4})/g
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = text.match(pattern);
      if (phoneMatch) {
        const phone = phoneMatch[0].replace(/\s/g, '');
        // Better validation: reasonable phone number length
        if (phone.length >= 8 && phone.length <= 15) {
          structuredData.contact_phone = phone;
          break;
        }
      }
    }
    
    return structuredData;
  }
  
  // Helper method to validate dates
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr.replace(/[.\-]/g, '/'));
    return !isNaN(date.getTime()) && date > new Date() && date < new Date('2030-12-31');
  }
  
  // Helper method to format dates consistently
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr.replace(/[.\-]/g, '/'));
      if (isNaN(date.getTime())) return dateStr;
      
      // Return in DD.MM.YYYY format
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}.${month}.${year}`;
    } catch (error) {
      return dateStr;
    }
  }
  
  // ENHANCED: Pre-validate URL before scraping with program signals check
  private async preValidateUrl(url: string): Promise<boolean> {
    console.log(`  🔍 [VALIDATE] Starting validation for: ${url}`);
    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Quick check with short timeout
      console.log(`  🔍 [VALIDATE] Fetching page...`);
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 5000 
      });
      
      const status = response?.status();
      const title = await page.title();
      const content = await page.content();
      
      await page.close();
      
      console.log(`  🔍 [VALIDATE] Status: ${status}, Title length: ${title.length}, Content length: ${content.length}`);
      
      // Check for valid response
      if (!status || status < 200 || status >= 400) {
        console.log(`  ❌ [VALIDATE] Invalid status ${status} for ${url}`);
        return false;
      }
      
      // Check for error pages
      const errorIndicators = [
        '404', 'not found', 'nicht gefunden', 'seite nicht gefunden',
        'error', 'fehler', 'tut uns leid', 'welcome', 'willkommen'
      ];
      
      const titleLower = title.toLowerCase();
      const contentLower = content.toLowerCase();
      
      const hasError = errorIndicators.some(indicator => 
        titleLower.includes(indicator) || contentLower.includes(indicator)
      );
      
      if (hasError) {
        console.log(`  ❌ [VALIDATE] Error page detected for ${url}`);
        return false;
      }
      
      // Check for meaningful content
      const hasContent = content.length > 1000 && title.length > 5;
      
      if (!hasContent) {
        console.log(`  ❌ [VALIDATE] Insufficient content (content: ${content.length}, title: ${title.length}) for ${url}`);
        return false;
      }
      
      // ENHANCED: Check for program signals (accepts all funding types)
      const programSignals = [
        'foerderung', 'foerderhoehe', 'foerder', 'grant', 'subsid', 'beihilfe',
        'kredit', 'darlehen', 'leasing', 'beteiligung', 'equity', 
        'garantie', 'buergschaft', 'investment', 'steuer', 'incentive',
        'eligibility', 'voraussetzungen', 'requirements', 'bedingungen',
        'einreichung', 'bewerbung', 'application', 'antrag',
        'deadline', 'antragsfrist', 'frist', 'bewerbungsfrist',
        '€', 'euro', 'eur', 'betrag', 'summe', 'hohe'
      ];
      
      const contentText = contentLower;
      const foundSignals = programSignals.filter(signal => contentText.includes(signal));
      const signalCount = foundSignals.length;
      
      console.log(`  🔍 [VALIDATE] Program signals found: ${signalCount} of ${programSignals.length} (${foundSignals.slice(0, 5).join(', ')}${foundSignals.length > 5 ? '...' : ''})`);
      
      // Require at least 2 program signals to be a valid program page
      if (signalCount < 2) {
        console.log(`  ❌ [VALIDATE] Too few program signals (${signalCount} < 2) for ${url}`);
        return false;
      }
      
      console.log(`  ✅ [VALIDATE] URL validated with ${signalCount} program signals: ${url}`);
      return true;
      
    } catch (error) {
      console.log(`  ❌ [VALIDATE] Validation failed for ${url}:`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  // SIMPLIFIED: Basic full page parsing for 18 categories
  private parseFullPageContent(text: string, categorized: any): void {
    const lowerText = text.toLowerCase();
    
    // ELIGIBILITY
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
    
    // DOCUMENTS
    if (lowerText.includes('dokument') || lowerText.includes('unterlagen') || lowerText.includes('antrag')) {
      categorized.documents.push({
        type: 'required_documents',
        value: 'Various documents required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // FINANCIAL
    if (lowerText.includes('eigenmittel') || lowerText.includes('eigenkapital') || lowerText.includes('co-financing')) {
      categorized.financial.push({
        type: 'co_financing',
        value: 'Required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // TECHNICAL
    if (lowerText.includes('trl') || lowerText.includes('technology readiness')) {
      categorized.technical.push({
        type: 'trl_level',
        value: 'Technology readiness required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // GEOGRAPHIC
    if (lowerText.includes('österreich') || lowerText.includes('austria')) {
      categorized.geographic.push({
        type: 'location',
        value: 'Austria',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // Add more categories as needed...
  }

  private isValidProgram(program: ScrapedProgram): boolean {
    const blacklistNames = [
      'cookie consent', 'seite wurde nicht gefunden', '404', 'error',
      'not found', 'nicht gefunden', 'tut uns leid', 'welcome',
      'willkommen', 'home', 'start', 'index', 'newsletter',
      'sprungmarken-navigation', 'redes sociales', 'datenschutz',
      'impressum', 'kontakt', 'about', 'privacy', 'legal',
      'kreditkarten', 'credit card', 'kreditkarte', 'sparkasse',
      'wohnmesse', 'wohnfinanzierung', 'privatkunden'
    ];
    
    const nameLower = program.name.toLowerCase();
    const descriptionLower = program.description.toLowerCase();
    
    // Check if name or description contains blacklisted terms
    const hasBlacklistedName = blacklistNames.some(term => 
      nameLower.includes(term) || descriptionLower.includes(term)
    );
    
    // Must have meaningful content
    const hasMeaningfulContent = program.name.length > 10 && 
                                 program.description.length > 20 &&
                                 !nameLower.includes('untitled') &&
                                 !descriptionLower.includes('placeholder');
    
    return !hasBlacklistedName && hasMeaningfulContent;
  }

  private async scrapeProgramFromUrl(url: string, institution: InstitutionConfig): Promise<ScrapedProgram | null> {
    console.log(`    🔍 [SCRAPE] Opening page...`);
    const page = await this.browser!.newPage();
    
    try {
      // Stealth measures
      console.log(`    🔍 [SCRAPE] Setting up browser...`);
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      });
      
      // Normal delay for better extraction
      console.log(`    🔍 [SCRAPE] Waiting 1s for page load...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`    🔍 [SCRAPE] Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      console.log(`    🔍 [SCRAPE] Extracting page content...`);
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // SIMPLIFIED: Basic content extraction
      console.log(`    🔍 [SCRAPE] Extracting title...`);
      const name = this.extractTitle($, institution.selectors.name);
      console.log(`    🔍 [SCRAPE] Title: "${name.substring(0, 60)}${name.length > 60 ? '...' : ''}"`);
      
      console.log(`    🔍 [SCRAPE] Extracting description...`);
      const description = this.extractDescription($, institution.selectors.description);
      console.log(`    🔍 [SCRAPE] Description length: ${description.length} chars`);
      
      // ENHANCED: Extract structured data
      console.log(`    🔍 [SCRAPE] Extracting structured data (amounts, deadlines)...`);
      const structuredData = this.extractStructuredData(content);
      if (structuredData.funding_amount_max) {
        console.log(`    💰 [DATA] Funding max: ${structuredData.funding_amount_max} ${structuredData.currency}`);
      }
      if (structuredData.deadline) {
        console.log(`    📅 [DATA] Deadline: ${structuredData.deadline}`);
      }
      
      // SIMPLIFIED: Basic 18 categories extraction
      console.log(`    🔍 [SCRAPE] Extracting 18 categories...`);
      const categorized_requirements = this.extract18Categories($, institution.selectors, content);
      const categoryCount = Object.keys(categorized_requirements).reduce((sum, key) => sum + categorized_requirements[key].length, 0);
      console.log(`    📊 [DATA] Categories extracted: ${categoryCount} total requirements`);
      
      // SIMPLIFIED: Basic program focus detection
      console.log(`    🔍 [SCRAPE] Detecting program focus...`);
      const programFocus = this.detectProgramFocus(content, institution);
      console.log(`    🎯 [DATA] Program focus: ${programFocus.length > 0 ? programFocus.join(', ') : 'none detected'}`);
      
      // SIMPLIFIED: Basic funding type detection
      console.log(`    🔍 [SCRAPE] Detecting funding type...`);
      const fundingType = this.detectFundingType(content, institution.fundingTypes);
      console.log(`    💵 [DATA] Funding type: ${fundingType}`);
      
      await page.close();
      console.log(`    ✅ [SCRAPE] Page closed, extraction complete`);
      
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
          // ENHANCED: Add structured data
          funding_amount_min: structuredData.funding_amount_min,
          funding_amount_max: structuredData.funding_amount_max,
          currency: structuredData.currency,
          deadline: structuredData.deadline,
          contact_email: structuredData.contact_email,
          contact_phone: structuredData.contact_phone,
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

  // SIMPLIFIED METHODS - Phase 1
  private extractTitle($: cheerio.Root, selectors: string[]): string {
    const title = this.extractText($, selectors);
    return title || 'Unknown Program';
  }

  private extractDescription($: cheerio.Root, selectors: string[]): string {
    const description = this.extractText($, selectors);
    return description || 'No description available';
  }

  private extract18Categories($: cheerio.Root, selectors: any, content: string): any {
    const categorized: any = {};
    
    // Initialize all 18 categories
    REQUIREMENT_CATEGORIES.forEach(category => {
      categorized[category] = [];
    });
    
    // SIMPLIFIED: Extract from basic selectors only
    const eligibilityText = this.extractText($, selectors.eligibility);
    if (eligibilityText) {
      this.parseEligibilityText(eligibilityText, categorized);
    }
    
    const requirementsText = this.extractText($, selectors.requirements);
    if (requirementsText) {
      this.parseRequirementsText(requirementsText, categorized);
    }
    
    // SIMPLIFIED: Basic full page parsing
    this.parseFullPageContent(content, categorized);
    
    return categorized;
  }

  // REMOVED: Complex enhanced methods (Phase 1 simplification)
  /*
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

  // REMOVED: extract18CategoriesEnhanced (replaced with simplified extract18Categories)
  /*
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
    
    // SIMPLIFIED: Basic keyword matching for 18 categories
    
    // ELIGIBILITY
    if (lowerText.includes('startup') || lowerText.includes('neugründung')) {
      categorized.eligibility.push({ type: 'company_type', value: 'Startup', required: true, source: 'full_page_content' });
    }
    
    // FINANCIAL
    if (lowerText.includes('€') || lowerText.includes('euro') || lowerText.includes('finanzierung')) {
      categorized.financial.push({ type: 'funding_available', value: 'Funding available', required: true, source: 'full_page_content' });
    }
    
    // GEOGRAPHIC
    if (lowerText.includes('österreich') || lowerText.includes('austria')) {
      categorized.geographic.push({ type: 'location', value: 'Austria', required: true, source: 'full_page_content' });
    }
    
    // TEAM
    if (lowerText.includes('team') || lowerText.includes('mitarbeiter')) {
      categorized.team.push({ type: 'team_required', value: 'Team required', required: true, source: 'full_page_content' });
    }
    
    // PROJECT
    if (lowerText.includes('innovation') || lowerText.includes('forschung') || lowerText.includes('research')) {
      categorized.project.push({ type: 'innovation_focus', value: 'Innovation/Research', required: true, source: 'full_page_content' });
    }
    
    // DOCUMENTS
    if (lowerText.includes('antrag') || lowerText.includes('bewerbung') || lowerText.includes('application')) {
      categorized.documents.push({ type: 'application_required', value: 'Application required', required: true, source: 'full_page_content' });
    }
    
    // TIMELINE
    if (lowerText.includes('deadline') || lowerText.includes('frist') || lowerText.includes('termin')) {
      categorized.timeline.push({ type: 'deadline', value: 'Deadline specified', required: true, source: 'full_page_content' });
    }
    
    // LEGAL
    if (lowerText.includes('rechtlich') || lowerText.includes('legal') || lowerText.includes('gesetz')) {
      categorized.legal.push({ type: 'legal_compliance', value: 'Legal compliance required', required: true, source: 'full_page_content' });
    }
  }
  */

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

  // REMOVED: parseEligibilityTextEnhanced and parseRequirementsTextEnhanced
  // These were never used - base functions (parseEligibilityText, parseRequirementsText) 
  // plus parseFullPageContent handle all parsing needs

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

  // Discovery State Management Methods
  private loadDiscoveryState(institutionName: string): InstitutionDiscoveryState {
    const statePath = path.join(process.cwd(), 'data', 'discovery-state.json');
    
    if (!fs.existsSync(statePath)) {
      return {
        lastFullScan: null,
        exploredSections: [],
        knownUrls: [],
        unscrapedUrls: []
      };
    }
    
    try {
      const cache: DiscoveryStateCache = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return cache[institutionName] || {
        lastFullScan: null,
        exploredSections: [],
        knownUrls: [],
        unscrapedUrls: []
      };
    } catch (error) {
      console.error(`Error loading discovery state for ${institutionName}:`, error);
      return {
        lastFullScan: null,
        exploredSections: [],
        knownUrls: [],
        unscrapedUrls: []
      };
    }
  }

  private saveDiscoveryState(institutionName: string, state: InstitutionDiscoveryState): void {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const statePath = path.join(dataDir, 'discovery-state.json');
    let cache: DiscoveryStateCache = {};
    
    // Load existing cache
    if (fs.existsSync(statePath)) {
      try {
        cache = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      } catch (error) {
        console.error('Error loading discovery state cache:', error);
        cache = {};
      }
    }
    
    // Update cache for this institution
    cache[institutionName] = state;
    
    // Save updated cache
    fs.writeFileSync(statePath, JSON.stringify(cache, null, 2));
    console.log(`  💾 [DISCOVERY] Saved discovery state for ${institutionName}`);
  }

  private clearDiscoveryState(): void {
    const statePath = path.join(process.cwd(), 'data', 'discovery-state.json');
    if (fs.existsSync(statePath)) {
      fs.writeFileSync(statePath, JSON.stringify({}, null, 2));
      console.log('  🗑️  [DISCOVERY] Cleared all discovery state');
    }
  }

  // REMOVED: isSectionFullyExplored() - Redundant with unscrapedUrls tracking
  // The unscrapedUrls array already filters out URLs that were already scraped,
  // so we don't need separate logic to skip "fully explored" sections

  private async extractLinksFromPage(
    url: string, 
    institution: InstitutionConfig
  ): Promise<string[]> {
    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      const links = await page.evaluate((keywords, exclusionKeywords) => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        return linkElements
          .map(el => el.getAttribute('href'))
          .filter((href): href is string => !!href && (
            keywords.some(keyword => href.toLowerCase().includes(keyword)) ||
            href.includes('foerderung') || 
            href.includes('program') || 
            href.includes('grant') ||
            href.includes('funding') ||
            href.includes('startup') ||
            href.includes('innovation') ||
            href.includes('kredit') ||
            href.includes('darlehen')
          ))
          .filter((href): href is string => 
            !!href && 
            !exclusionKeywords.some(keyword => href.toLowerCase().includes(keyword))
          )
          .map((href): string => {
            if (href.startsWith('/')) {
              return new URL(href, window.location.origin).href;
            }
            return href;
          })
          .filter((href): href is string => !!href && href.startsWith('http'));
      }, institution.keywords, autoDiscoveryPatterns.exclusionKeywords);
      
      await page.close();
      return links;
    } catch (error) {
      console.error(`Error extracting links from ${url}:`, error);
      return [];
    }
  }

  private findPaginationLinks(links: string[], currentUrl: string): string[] {
    const currentUrlObj = new URL(currentUrl);
    const basePath = currentUrlObj.pathname;
    
    const paginationKeywords = [
      'next', 'weiter', 'suivant', 'seguente', 'siguiente', 'volgende',
      'page', 'seite', 'page', 'pagina', 'pagina', 'pagina',
      'mehr', 'more', 'plus', 'più', 'más', 'meer',
      '2', '3', '4', // Page numbers
      'archive', 'archiv', 'archives'
    ];
    
    return links.filter(link => {
      try {
        const linkUrl = new URL(link);
        const linkPath = linkUrl.pathname.toLowerCase();
        const linkText = link.toLowerCase();
        
        // Must be same domain
        if (linkUrl.origin !== currentUrlObj.origin) return false;
        
        // Must contain pagination keywords
        const hasPaginationKeyword = paginationKeywords.some(keyword => 
          linkText.includes(keyword) || linkPath.includes(keyword)
        );
        
        // Must be different from current URL (but related path)
        const isRelatedPath = linkPath.startsWith(basePath.split('/').slice(0, -1).join('/')) ||
                              basePath.startsWith(linkPath.split('/').slice(0, -1).join('/'));
        
        return hasPaginationKeyword && isRelatedPath;
      } catch {
        return false;
      }
    });
  }

  private prioritizeUrls(urls: string[], existingUrls: Set<string>): string[] {
    return urls.sort((a, b) => {
      // Priority 1: Never scraped before
      const aExists = existingUrls.has(a);
      const bExists = existingUrls.has(b);
      if (aExists !== bExists) {
        return aExists ? 1 : -1; // Unscraped URLs first
      }
      
      // Priority 2: Program pages (have specific program keywords) > category pages
      const aIsProgram = a.match(/\/(program|foerderung|grant|kredit|darlehen)[^\/]*$/i) !== null;
      const bIsProgram = b.match(/\/(program|foerderung|grant|kredit|darlehen)[^\/]*$/i) !== null;
      if (aIsProgram !== bIsProgram) {
        return aIsProgram ? -1 : 1; // Program pages first
      }
      
      return 0; // Equal priority
    });
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