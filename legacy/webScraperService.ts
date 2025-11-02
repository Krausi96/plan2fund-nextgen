// Phase 1: Stealth Scraper with 18 Categories
import puppeteer, { Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { institutions, InstitutionConfig, autoDiscoveryPatterns } from './institutionConfig';

interface ScrapedProgram {
  cofinancing_pct?: number;  // Standardized field name per contract review
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
  'market_size', 'co_financing', 'trl_level', 'consortium',
  'diversity'
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

    // Keep a reference to avoid unused warning in strict TypeScript builds
    // (method is used in experimental flows)
    (this as any).__keep_preValidate = this.preValidateUrl;
  }

  // Load learned keywords from data/learned-keywords.json (non-fatal if missing)
  private loadLearnedKeywords(): Record<string, { global_keywords?: string[]; by_funding_type?: Record<string, string[]>; allow_fragments?: string[]; deny_fragments?: string[]; } > {
    try {
      const filePath = path.join(__dirname, '..', '..', 'data', 'learned-keywords.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) || {};
      }
    } catch (_e) {
      // ignore
    }
    return {};
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
      
      // FIXED: Process ALL institutions (not just first 10)
      // In cycle mode, we limit URLs per institution to keep cycles fast
      // Optional targeting via env: comma-separated names or ids
      const targetListRaw = process.env.TARGET_INSTITUTIONS || '';
      const targetList = targetListRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const institutionsToProcess = targetList.length > 0
        ? institutions.filter(inst => {
            const idLower = (inst.id || '').toLowerCase();
            const nameLower = (inst.name || '').toLowerCase();
            return targetList.includes(idLower) || targetList.includes(nameLower);
          })
        : institutions; // Process all institutions by default
      console.log(`📊 Processing ${institutionsToProcess.length} institutions in ${cycleOnly ? 'CYCLE' : 'FULL'} mode${targetList.length>0 ? ' (targeted)' : ''}`);
      
      const learned = this.loadLearnedKeywords();
      for (const originalInst of institutionsToProcess) {
        const instId = originalInst.id || '';
        const learnedForInst = instId && learned ? (learned as any)[instId]?.global_keywords || [] : [];
        const mergedKeywords = Array.from(new Set([...(originalInst.keywords || []), ...learnedForInst]));
        const institution = { ...originalInst, keywords: mergedKeywords } as InstitutionConfig;
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔍 [INSTITUTION] Processing: ${institution.name}`);
        console.log(`🔍 [INSTITUTION] Base URL: ${institution.baseUrl}`);
        console.log(`🔍 [INSTITUTION] Seed URLs: ${institution.programUrls.length}`);
        institution.programUrls.forEach((url, idx) => {
          console.log(`  ${idx + 1}. ${url}`);
        });
        console.log(`🔍 [INSTITUTION] Auto-discovery: ${institution.autoDiscovery ? 'ENABLED' : 'DISABLED'}`);
        console.log(`🔍 [INSTITUTION] Keywords: ${institution.keywords.join(', ')}`);
        
        // FIXED: Load existing unscraped URLs FIRST, then discover new ones (unless SCRAPE_ONLY)
        const state = this.loadDiscoveryState(institution.name);
        const existingUnscrapedUrls = state.unscrapedUrls || [];
        console.log(`📍 [DISCOVERY] Found ${existingUnscrapedUrls.length} existing unscraped URLs`);
        
        const skipDiscovery = process.env.SCRAPE_ONLY === '1';
        let newlyDiscoveredUrls: string[] = [];
        if (!skipDiscovery) {
        // Discover new URLs (adds to unscrapedUrls)
          newlyDiscoveredUrls = await this.discoverRealProgramUrls(institution, discoveryMode);
        } else {
          console.log(`⏭️  [DISCOVERY] Skipped (scrape-only mode)`);
        }
        const updatedState = this.loadDiscoveryState(institution.name);
        const allUnscrapedUrls = updatedState.unscrapedUrls || [];
        
        console.log(`📍 [DISCOVERY] Total unscraped URLs: ${allUnscrapedUrls.length} (${newlyDiscoveredUrls.length} newly discovered)`);
        
        // Use ALL unscraped URLs (existing + new)
        const prioritizedUrls = this.prioritizeUrls(allUnscrapedUrls, existingUrls);
        
        // HIGH-PERFORMANCE: Process more URLs per institution (parallelization handles speed)
        const unscrapedCount = prioritizedUrls.filter(url => !existingUrls.has(url)).length;
        const shortCycle = process.env.SHORT_CYCLE === '1';
        // Allow overriding via env MAX_URLS for deterministic batches
        const maxUrlsOverride = process.env.MAX_URLS ? parseInt(process.env.MAX_URLS, 10) : NaN;
        const urlsPerInstitution = !isNaN(maxUrlsOverride)
          ? Math.max(1, maxUrlsOverride)
          : (cycleOnly ? (shortCycle ? 10 : 100) : 250); // Short cycle drastically limits per institution
        const urlsToProcess = prioritizedUrls.slice(0, urlsPerInstitution);
        console.log(`📍 [BATCH] Processing ${urlsToProcess.length} URLs from ${institution.name} (${unscrapedCount} total unscraped remaining for this institution)...\n`);
        
        // HIGH-PERFORMANCE: Parallel scraping - 35 concurrent workers (20 in short cycle)
        const CONCURRENT_LIMIT = shortCycle ? 20 : 35; // Tune per environment/network
        const filteredUrls = urlsToProcess.filter(url => {
          // Quick filters (synchronous checks only)
          if (existingUrls.has(url)) return false;
          
          const existingProgram = existingPrograms.find(p => p.source_url === url);
          if (existingProgram) {
            const scrapedAt = existingProgram.scraped_at ? new Date(existingProgram.scraped_at) : null;
            if (scrapedAt && (Date.now() - scrapedAt.getTime()) < 24 * 60 * 60 * 1000) {
              return false; // Skip recently scraped
            }
          }
          
          // Skip query URLs and PDFs
          if (url.includes('?') && (url.includes('field_') || url.includes('filter'))) return false;
          if (url.match(/\.(pdf|docx?|xlsx?|ppt)$/i)) return false;

          // Business relevance deny-list (skip obvious non-SME/solo topics)
          const lowerUrl = url.toLowerCase();
          const denyFragments = [
            'wohn', 'miete', 'privat', 'haushalt', 'familie', 'schule', 'student',
            '/awards/', '/award', '/preis', '/preise/', '/events/', '/veranstaltungen/', '/news/', '/press',
            '/downloads/', '/download/', '/fileadmin/', '/media/', '/blog/'
          ];
          if (denyFragments.some(f => lowerUrl.includes(f))) return false;
          const allowFragments = [
            'foerder', 'förder', 'grant', 'funding', 'programm', 'programme', 'support', 'unternehmen', 'kmu', 'sme', 'startup', 'apply', 'antrag'
          ];
          if (!allowFragments.some(f => lowerUrl.includes(f))) return false;
          if (!this.isProgramDetailPage(url)) return false;
          
          return true;
        });
        
        console.log(`⚡ [PERF] Processing ${filteredUrls.length} URLs with ${CONCURRENT_LIMIT} parallel workers...`);
        
        // Process in batches of CONCURRENT_LIMIT
        for (let i = 0; i < filteredUrls.length; i += CONCURRENT_LIMIT) {
          const batch = filteredUrls.slice(i, i + CONCURRENT_LIMIT);
          const batchNum = Math.floor(i / CONCURRENT_LIMIT) + 1;
          const totalBatches = Math.ceil(filteredUrls.length / CONCURRENT_LIMIT);
          
          console.log(`\n⚡ [BATCH ${batchNum}/${totalBatches}] Processing ${batch.length} URLs in parallel...`);
          
          // Process batch in parallel (skip validation for speed - URLs already filtered)
          const batchPromises = batch.map(async (url) => {
          try {
            const program = await this.scrapeProgramFromUrl(url, institution);
            if (program && this.isValidProgram(program)) {
                return { success: true, program };
              }
              return { success: false, reason: program ? 'filtered' : 'empty' };
          } catch (error) {
              return { success: false, reason: 'error', error: error instanceof Error ? error.message : String(error) };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          
          // Collect successful programs
          batchResults.forEach((result, idx) => {
            const url = batch[idx];
            if (result.success && result.program) {
              programs.push(result.program);
              console.log(`  ✅ [${i + idx + 1}/${filteredUrls.length}] "${result.program.name}"`);
            } else {
              console.log(`  ❌ [${i + idx + 1}/${filteredUrls.length}] ${url.substring(0, 60)}... - ${result.reason}`);
            }
          });
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

  /**
   * FAST DISCOVERY-ONLY METHOD (2-minute mini cycles)
   * Only discovers URLs, NO scraping
   * Per strategy: Fast cycles for URL discovery
   */
  public async discoverUrlsOnly(
    institution: InstitutionConfig,
    maxTimeMs: number = 30000,  // 30 seconds default - MUCH faster
    discoveryMode: 'incremental' | 'deep' = 'incremental'
  ): Promise<{ newUrls: number, totalUrls: number, timeElapsed: number }> {
    const startTime = Date.now();
    console.log(`⚡ [FAST DISCOVERY] Starting for ${institution.name} (max ${maxTimeMs/1000}s)...`);
    
    try {
      if (!this.browser) {
        await this.init();
      }
      
      // Use existing discovery logic but with time limit
      const discoveredUrls = await this.discoverRealProgramUrls(institution, discoveryMode, maxTimeMs);
      
      // Save discovery state
      const state = this.loadDiscoveryState(institution.name);
      const newUrlsBefore = state.unscrapedUrls.length;
      
      // Update state with discovered URLs
      this.saveDiscoveryState(institution.name, {
        ...state,
        unscrapedUrls: Array.from(new Set([...state.unscrapedUrls, ...discoveredUrls]))
      });
      
      const finalState = this.loadDiscoveryState(institution.name);
      const newUrlsAfter = finalState.unscrapedUrls.length;
      const newUrlsFound = newUrlsAfter - newUrlsBefore;
      const timeElapsed = Date.now() - startTime;
      
      console.log(`✅ [FAST DISCOVERY] Completed in ${(timeElapsed/1000).toFixed(1)}s`);
      console.log(`   📊 New URLs found: ${newUrlsFound}`);
      console.log(`   📊 Total unscraped URLs: ${finalState.unscrapedUrls.length}`);
      
      return {
        newUrls: newUrlsFound,
        totalUrls: finalState.unscrapedUrls.length,
        timeElapsed
      };
    } catch (error) {
      console.error(`❌ [FAST DISCOVERY] Error for ${institution.name}:`, error);
      return { newUrls: 0, totalUrls: 0, timeElapsed: Date.now() - startTime };
    }
  }

  private async discoverRealProgramUrls(
    institution: InstitutionConfig,
    discoveryMode: 'incremental' | 'deep' = 'incremental',
    maxTimeMs?: number  // Optional time limit for fast discovery
  ): Promise<string[]> {
    console.log(`  🔍 [DISCOVERY] Starting ${discoveryMode} URL discovery...`);
    
    // Load discovery state for this institution
    const state = this.loadDiscoveryState(institution.name);
    const discoveredUrls = new Set<string>();
    const urlQueue: Array<{url: string, depth: number, seedUrl?: string}> = [];
    
    // Add seed URLs to queue for exploration ALWAYS (even if not matching heuristics)
    for (const seedUrl of institution.programUrls) {
      // Seeds can be listing hubs; enqueue for exploration regardless of heuristics
      urlQueue.push({url: seedUrl, depth: 0, seedUrl});
      discoveredUrls.add(seedUrl);
      console.log(`  ✅ [DISCOVERY] Added seed URL to queue (forced): ${seedUrl}`);
    }
    
    console.log(`  🔍 [DISCOVERY] Queue initialized with ${urlQueue.length} URLs to explore`);
    
    // Breadth-first exploration with pagination support
    const maxDepth = 4; // INCREASED: Go deeper to find all programs in category pages (was 3)
    const maxUrlsToDiscover = 500; // INCREASED: Find more programs (was 200)
    const startTime = Date.now();  // Track time for fast discovery mode
    
    // First, add any unscraped URLs from already-explored sections to discoveredUrls
    const existingPrograms = this.loadExistingPrograms();
    const existingUrlsSet = new Set(existingPrograms.map(p => p.source_url));
    
    // Load existing URLs from explored sections, but filter category pages immediately
    for (const section of state.exploredSections) {
      const unscrapedFromSection = section.discoveredUrls.filter(url => {
        // Exclude already-scraped URLs
        if (existingUrlsSet.has(url)) return false;
        // Exclude query/filter URLs (listing pages)
        if (url.includes('?') && (url.includes('field_') || url.includes('filter') || url.includes('name%5B') || url.includes('status%5B'))) {
          return false;
        }
        // Only include detail pages (not category pages)
        return this.isProgramDetailPage(url);
      });
      unscrapedFromSection.forEach(url => {
        discoveredUrls.add(url);
        console.log(`  ➕ [DISCOVERY] Added detail page from explored section: ${url}`);
      });
    }
    
    while (urlQueue.length > 0 && discoveredUrls.size < maxUrlsToDiscover) {
      // FAST DISCOVERY: Check time limit
      if (maxTimeMs && (Date.now() - startTime) > maxTimeMs) {
        console.log(`  ⏰ [DISCOVERY] Time limit reached (${maxTimeMs/1000}s). Stopping discovery.`);
        break;
      }
      
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
        // FIXED: Category pages MUST be explored deeper to find detail links
        const allExplorationLinks = [...paginationLinks, ...categoryLinks];
        for (const exploreLink of allExplorationLinks) {
          if (!discoveredUrls.has(exploreLink) && depth < maxDepth) {
            urlQueue.push({url: exploreLink, depth: depth + 1, seedUrl: currentSeed});
            discoveredUrls.add(exploreLink);
            console.log(`  ➕ [DISCOVERY] Added exploration link (category/pagination, depth ${depth + 1}): ${exploreLink}`);
          } else if (!discoveredUrls.has(exploreLink)) {
            // Even if depth limit reached, track it
            discoveredUrls.add(exploreLink);
          }
        }
        
        // FIXED: Also extract ANY additional links from category pages that might be program links
        // Some program links might not have been caught by initial filtering
        if (categoryLinks.length > 0) {
          const additionalLinks = links.filter(link => 
            link !== url &&
            !discoveredUrls.has(link) &&
            this.isRealProgramUrl(link) &&
            // Include if it looks like a program detail page OR if it's deep enough
            (this.isProgramDetailPage(link) || new URL(link).pathname.split('/').filter(s => s).length >= 3)
          );
          for (const additionalLink of additionalLinks) {
            if (!discoveredUrls.has(additionalLink)) {
              discoveredUrls.add(additionalLink);
              // If it's a detail page, mark it directly; otherwise add to queue if depth allows
              if (this.isProgramDetailPage(additionalLink)) {
                console.log(`  ✅ [DISCOVERY] Found program DETAIL page from category page: ${additionalLink}`);
              } else if (depth < maxDepth) {
                urlQueue.push({url: additionalLink, depth: depth + 1, seedUrl: currentSeed});
                console.log(`  ➕ [DISCOVERY] Added additional link for exploration (depth ${depth + 1}): ${additionalLink}`);
              }
            }
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
    
    // CRITICAL FIX: Only add DETAIL pages to unscrapedUrls, NOT category/listing pages or PDFs
    // Category pages are kept in knownUrls for tracking, but not scrapable
    const detailPagesOnly = state.knownUrls.filter(url => {
      // Skip query/filter URLs (listing pages)
      if (url.includes('?') && (url.includes('field_') || url.includes('filter') || url.includes('name%5B') || url.includes('status%5B'))) {
        return false;
      }
      // Skip PDFs and documents
      if (url.match(/\.(pdf|docx?|xlsx?|ppt)$/i)) {
        return false;
      }
      // Only include detail pages (not category pages)
      return this.isProgramDetailPage(url);
    });
    
    // Calculate unscraped URLs: detail pages that are NOT in existing programs database
    state.unscrapedUrls = detailPagesOnly.filter(url => !existingUrlsSet.has(url));
    
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
    
    // ENHANCED: Allow query parameter URLs if they have program keywords
    // Many institutions (like FFG) use query params for filtered program listings
    // These pages often contain links to actual program detail pages
    const hasQueryParams = urlLower.includes('?');
    const isQueryFilterPage = hasQueryParams && (urlLower.includes('field_') || urlLower.includes('filter'));
    
    // Allow query parameter pages IF they have program keywords (likely program listing pages)
    // Block query pages without keywords (likely generic search/filter pages)
    if (isQueryFilterPage) {
      // Only allow if it has program keywords - these are likely program listing/filter pages
      return hasProgramKeyword && !hasBlacklistKeyword;
    }
    
    // Exclude obvious non-detail/document endpoints
    if (urlLower.match(/\.(pdf|docx?|xlsx?|ppt)$/)) return false;
    if (urlLower.includes('download') || urlLower.includes('file=')) return false;
    if (urlLower.includes('suche') || urlLower.includes('search')) return false;

    // For non-query URLs, use standard validation
    const hasValidStructure = !hasQueryParams || 
                             (hasQueryParams && !urlLower.includes('field_') && !urlLower.includes('filter'));
    
    // Require some minimal path depth to avoid top-level hubs
    let sufficientDepth = true;
    try {
      const segs = new URL(url).pathname.split('/').filter(s => s);
      sufficientDepth = segs.length >= 3;
    } catch {
      // ignore URL parse errors
    }
    
    return hasProgramKeyword && !hasBlacklistKeyword && hasValidStructure && sufficientDepth;
  }

  // ENHANCED: Check if URL is a program DETAIL page (not a category/listing page)
  private isProgramDetailPage(url: string): boolean {
    if (!this.isRealProgramUrl(url)) {
      return false;
    }
    
    // Query parameter URLs are always listing/filter pages (not detail pages)
    if (url.includes('?') && (url.includes('field_') || url.includes('filter') || url.includes('name%5B') || url.includes('status%5B'))) {
      return false;
    }
    // Exclude downloads/documents
    if (url.match(/\.(pdf|docx?|xlsx?|ppt)$/i) || url.toLowerCase().includes('download')) {
      return false;
    }
    
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname.toLowerCase();
    const pathSegments = urlPath.split('/').filter(s => s.length > 0);
    
    // ENHANCED: Category/listing page indicators (exclude these more comprehensively)
    const categoryIndicators = [
      '/foerderungen', '/foerderung', '/fundings', '/funding',
      // FWF and similar portfolio/listing hubs
      '/funding/portfolio', '/en/funding/portfolio', '/foerdern/foerderportfolio',
      '/programme', '/programs', '/program', '/programma',
      '/spezialprogramme', '/special-programmes', '/special-programms',
      '/alle-', '/all-', '/overview', '/liste', '/list', '/listing',
      '/wettbewerbe', '/competitions', '/universitaeten', '/universities', 
      '/weitere', '/others', '/more', '/weitere-foerderungen',
      '/archiv', '/archive',
      '/investors-incubators', '/investoren-inkubatoren',
      '/unternehmen/kredite', '/unternehmen/finanzierung', // Bank product category pages
      '/unternehmen/startup', '/unternehmen/leasing',
      '/privatkunden', '/private', // Private customer pages
      '/kredite', '/kredit', '/credits', '/credit', // Generic credit pages
      '/initiative', '/initiativen', '/initiatives', // Initiative overview pages
      '/thema/', '/topic/', '/topics/' // Topic pages
    ];
    
    // Check if URL path contains or ends with a category indicator
    const isCategoryPage = categoryIndicators.some(indicator => {
      const indicatorLower = indicator.toLowerCase();
      return urlPath === indicatorLower || 
             urlPath === indicatorLower + '/' ||
             urlPath.endsWith(indicatorLower) ||
             urlPath.endsWith(indicatorLower + '/') ||
             (indicatorLower.includes('/') && urlPath.includes(indicatorLower + '/'));
    });
    
    if (isCategoryPage) {
      return false;
    }
    
    // ENHANCED: Detail page detection - must have specific characteristics
    
    // 1. Check for specific program identifiers in URL (node IDs, program codes, etc.)
    const hasNodeId = urlPath.match(/\/node\/(\d+)/); // e.g., /node/202361
    const hasProgramCode = urlPath.match(/\/([a-z]{2,}\-[a-z]{2,}\-?\d{4})/); // e.g., /eureka-celtic-call2025
    const hasSpecificCall = urlPath.match(/\/calls?\/([\w\-]+)/); // e.g., /calls/SO1_2025
    const hasAusschreibung = urlPath.match(/\/ausschreibung\/([\w\-]+)/); // German for "call"
    
    if (hasNodeId || hasProgramCode || hasSpecificCall || hasAusschreibung) {
      return true; // These are detail pages
    }
    
    // 2. Check for deep paths that are NOT category pages
    // Minimum 3 segments AND contains specific program-like identifiers
    if (pathSegments.length >= 3) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const secondLastSegment = pathSegments[pathSegments.length - 2];
      
      // Exclude if ends with category-like terms
      const categoryTerms = ['foerderungen', 'programme', 'programs', 'initiative', 'thema', 'kredite', 'unternehmen'];
      if (categoryTerms.some(term => lastSegment === term || secondLastSegment === term)) {
        return false;
      }
      
      // Include if has specific identifiers (long strings, numbers, etc.)
      const hasLongIdentifier = lastSegment.length > 15 || /[\d_\-]{5,}/.test(lastSegment);
      if (hasLongIdentifier) {
        return true;
      }
    }
    
    // FFG-specific relaxed rules: accept common detail patterns
    const host = urlObj.hostname.toLowerCase();
    if (host.includes('ffg.at')) {
      if ((urlPath.includes('/ausschreibung/') || urlPath.includes('/programm/')) && !urlPath.endsWith('/')) {
        if (pathSegments.length >= 2) return true;
      }
      if (urlPath.includes('/europa/heu/') && urlPath.includes('/calls/') && pathSegments.length >= 4) {
        return true;
      }
    }

    // 3. Check for specific program patterns in path
    // Examples: /programme/Innovationsscheck, /europa/dep/calls/SO1_2025
    if (pathSegments.length >= 2) {
      const containsProgramPath = pathSegments.some((segment, idx) => {
        // Look for program-related segments followed by specific program names
        if (['programme', 'program', 'programma', 'ausschreibung', 'calls', 'call', 'dep', 'heu'].includes(segment.toLowerCase())) {
          // Next segment should be a specific program (not a category)
          const nextSegment = pathSegments[idx + 1];
          if (nextSegment && nextSegment.length > 5 && !categoryIndicators.some(ind => ind.includes(nextSegment))) {
            return true;
          }
        }
        return false;
      });
      
      if (containsProgramPath) {
        return true;
      }
    }
    
    // Default: if it's a deep path (4+ segments) and not a category page, likely a detail page
    return pathSegments.length >= 4;
  }

  // ENHANCED: Extract structured data (amounts, deadlines, contact)
  private extractStructuredData(content: string, $?: cheerio.Root): any {
    const structuredData: any = {
      funding_amount_min: null,
      funding_amount_max: null,
      currency: 'EUR',
      deadline: null,
      contact_email: null,
      contact_phone: null
    };
    
    // Extract actual text content (not HTML tags)
    let text = '';
    if ($) {
      // Get text from body, removing script/style tags
      text = $('body').clone().find('script, style, noscript').remove().end().text();
    } else {
      // Fallback: strip HTML tags from content
      text = content.replace(/<[^>]*>/g, ' ');
    }
    
    // Also search in specific HTML elements for amounts
    let amountText = text;
    if ($) {
      const amountElements = $('.amount, .funding-amount, .foerderbetrag, .foerderung, .betrag, [class*="amount"], [class*="funding"], [class*="foerderung"], .financial-info, .funding-info').text();
      if (amountElements) {
        amountText += ' ' + amountElements;
      }
      // Check tables for amount data
      $('table td, table th').each((_, el) => {
        const cellText = $(el).text();
        if (cellText.includes('€') || cellText.includes('EUR') || cellText.includes('euro')) {
          amountText += ' ' + cellText;
        }
      });
      // Check definition lists
      $('dl dt, dl dd').each((_, el) => {
        const dlText = $(el).text();
        if (dlText.includes('€') || dlText.includes('EUR') || dlText.includes('euro')) {
          amountText += ' ' + dlText;
        }
      });
    }
    
    const lowerText = amountText.toLowerCase();
    
    // Extract funding amounts - ENHANCED patterns with better formats
    const amountPatterns = [
      // German patterns with various formats
      /(?:bis zu|maximal|höchstens|up to|maximum|max\.?)\s*:?\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|€|eur)?/gi,
      /(?:fördermittel|förderhöhe|förderbetrag|förderung|finanzierung)\s*:?\s*(?:bis zu|maximal|höchstens)?\s*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?/gi,
      /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|EUR)?/gi,
      /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*€/gi,
      // Without euro symbol but with context
      /(?:kredit|darlehen|finanzierung)\s*(?:bis zu|maximal|höchstens)?\s*:?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:\.|,)?\s*(?:euro|EUR|€)?/gi,
      // Patterns with spaces (like "50 000 EUR" or "50.000 EUR")
      /(?:bis zu|maximal|höchstens|up to)\s*(\d{1,3}(?:\s\d{3}){1,3})\s*(?:EUR|€|euro)/gi,
      // Simple number patterns near keywords
      /(?:foerderung|funding|grant|kredit)\s*.*?(\d{1,3}(?:[.,]\d{3}){1,})\s*(?:EUR|€|euro)?/gi,
      // Numbers with "million" or "millionen"
      /(\d{1,3}(?:[.,]\d{3})?)\s*(?:millionen|million|mio|mio\.)/gi
    ];
    
    const foundAmounts: number[] = [];
    for (const pattern of amountPatterns) {
      const matches = [...lowerText.matchAll(pattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          // Clean the amount string
          let amountStr = match[1].replace(/[^\d.,\s]/g, '').trim();
          // Handle space as thousands separator (e.g., "50 000")
          amountStr = amountStr.replace(/\s/g, '');
          // Handle comma/dot as decimal or thousands
          if (amountStr.includes(',') && amountStr.includes('.')) {
            // Both present: comma is decimal, dot is thousands
            amountStr = amountStr.replace(/\./g, '').replace(',', '.');
          } else if (amountStr.includes(',')) {
            // Only comma: check if decimal or thousands
            const parts = amountStr.split(',');
            if (parts[1] && parts[1].length <= 2) {
              // Decimal separator
              amountStr = amountStr.replace(',', '.');
            } else {
              // Thousands separator
              amountStr = amountStr.replace(/,/g, '');
            }
          } else if (amountStr.includes('.')) {
            // Only dot: check if decimal or thousands
            const parts = amountStr.split('.');
            if (parts.length === 2 && parts[1].length <= 2) {
              // Likely decimal
              amountStr = amountStr;
            } else {
              // Thousands separator
              amountStr = amountStr.replace(/\./g, '');
            }
          }
          
          const numAmount = parseFloat(amountStr);
          // Handle millions
          if (match[0].toLowerCase().includes('million')) {
            const multiplied = numAmount * 1000000;
            if (multiplied > 0 && multiplied < 100000000) {
              foundAmounts.push(multiplied);
            }
          } else if (numAmount > 0 && numAmount < 100000000) { // Reasonable range up to 100M
            foundAmounts.push(numAmount);
          }
        }
      }
    }
    
    if (foundAmounts.length > 0) {
      // Use the maximum amount found
      structuredData.funding_amount_max = Math.max(...foundAmounts);
      // Find minimum if patterns suggest it
      if (foundAmounts.length > 1 && Math.min(...foundAmounts) < structuredData.funding_amount_max * 0.9) {
        structuredData.funding_amount_min = Math.min(...foundAmounts);
      }
    }
    
    // Extract deadlines - ENHANCED with better date detection
    let deadlineText = text;
    if ($) {
      const deadlineElements = $('.deadline, .frist, .deadline-date, .application-deadline, [class*="deadline"], [class*="frist"], [class*="fristen"]').text();
      if (deadlineElements) {
        deadlineText += ' ' + deadlineElements;
      }
      // Check tables for deadline data
      $('table td, table th').each((_, el) => {
        const cellText = $(el).text();
        if (cellText.match(/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/)) {
          deadlineText += ' ' + cellText;
        }
      });
    }
    
    const lowerDeadlineText = deadlineText.toLowerCase();
    
    const deadlinePatterns = [
      // German patterns with labels
      /(?:bewerbungsfrist|deadline|einreichung|application deadline|antragsfrist|abgabefrist|frist)\s*:?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      /(?:bis zum|bis|deadline|by|until)\s+(?:den|the)?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      // English patterns
      /(?:deadline|application|due|submission)\s*(?:by|until|is)?\s*:?\s*(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      // Date after deadline keywords
      /(?:deadline|frist)\s*:?\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/gi,
      // ISO dates
      /(?:deadline|frist)\s*:?\s*(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})/gi,
      // Standalone dates near deadline context (more permissive)
      /(?:deadline|frist|bewerbung|application).{0,50}(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})/gi,
      // Month name formats (German & English)
      /(?:bewerbungsfrist|deadline|antragsfrist|bis|by|until)\s*(?:den|the)?\s*(\d{1,2}\s*(?:jan(?:uar)?|feb(?:ruar)?|märz|maerz|apr(?:il)?|mai|jun(?:i)?|jul(?:i)?|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|dez(?:ember)?|january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4})/gi,
      // Month name without day
      /(?:bewerbungsfrist|deadline|antragsfrist|bis|by|until)\s*(?:den|the)?\s*(?:end\s*of\s*)?(?:jan(?:uar)?|feb(?:ruar)?|märz|maerz|apr(?:il)?|mai|jun(?:i)?|jul(?:i)?|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|dez(?:ember)?|january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4}/gi
    ];
    
    const foundDeadlines: string[] = [];
    for (const pattern of deadlinePatterns) {
      const matches = [...lowerDeadlineText.matchAll(pattern)];
      if (matches.length > 0) {
        for (const match of matches) {
          const dateStr = match[1].trim();
          if (dateStr && dateStr.length >= 6) {
            // Validate it's a reasonable date
          if (this.isValidDate(dateStr)) {
              foundDeadlines.push(dateStr);
          }
        }
        }
      }
    }
    
    if (foundDeadlines.length > 0) {
      // Use the first valid deadline found
      structuredData.deadline = this.formatDate(foundDeadlines[0]);
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
  // relaxedMode: true = less strict (URL already passed isProgramDetailPage check)
  private async preValidateUrl(url: string, relaxedMode: boolean = false): Promise<boolean> {
    console.log(`  🔍 [VALIDATE] Starting validation for: ${url}${relaxedMode ? ' (relaxed mode)' : ''}`);
    try {
      const page = await this.browser!.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Quick check with reasonable timeout
      console.log(`  🔍 [VALIDATE] Fetching page...`);
      const response = await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: relaxedMode ? 8000 : 5000 // Slightly longer for relaxed mode
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
      
      // ENHANCED: Check for program signals AND exclude listing page patterns
      const programSignals = [
        'foerderung', 'foerderhoehe', 'foerder', 'grant', 'subsid', 'beihilfe',
        'kredit', 'darlehen', 'leasing', 'beteiligung', 'equity', 
        'garantie', 'buergschaft', 'investment', 'steuer', 'incentive',
        'eligibility', 'voraussetzungen', 'requirements', 'bedingungen',
        'einreichung', 'bewerbung', 'application', 'antrag',
        'deadline', 'antragsfrist', 'frist', 'bewerbungsfrist',
        '€', 'euro', 'eur', 'betrag', 'summe', 'hohe'
      ];
      
      // Listing page indicators (these have signals but aren't detail pages)
      const listingIndicators = [
        'alle foerderungen', 'alle programme', 'all funding', 'all programs',
        'programmübersicht', 'program overview', 'foerderungsliste', 'programm liste',
        'weiter zum nächsten', 'next page', 'vorherige', 'previous',
        'anzeigen', 'show more', 'mehr', 'more programs',
        'filter', 'suche', 'search', 'sortieren', 'sort'
      ];
      
      const contentText = contentLower;
      const foundSignals = programSignals.filter(signal => contentText.includes(signal));
      const signalCount = foundSignals.length;
      
      // Check for listing page indicators
      const hasListingIndicators = listingIndicators.some(indicator => 
        titleLower.includes(indicator) || contentText.includes(indicator)
      );
      
      // Check for excessive links (listing pages have many links to programs)
      const linkCount = (content.match(/<a\s+href/gi) || []).length;
      // RELAXED: Many program detail pages have 100+ links (navigation, footer, related programs)
      // Only flag as listing if it has BOTH indicators AND very high link count
      const isLikelyListingPage = linkCount > 150 && hasListingIndicators;
      
      console.log(`  🔍 [VALIDATE] Program signals: ${signalCount}, Links: ${linkCount}, Listing indicators: ${hasListingIndicators}`);
      
      // RELAXED: Only reject if clearly a listing page (high link count + indicators)
      // If URL already passed isProgramDetailPage, be more lenient
      if (!relaxedMode && (isLikelyListingPage || (hasListingIndicators && linkCount > 50))) {
        console.log(`  ❌ [VALIDATE] Detected listing page (not a program detail page)`);
        return false;
      }
      
      // RELAXED: In relaxed mode, require only 1 signal (URL already passed detail page check)
      // Otherwise require 2 signals
      const minSignals = relaxedMode ? 1 : 2;
      if (signalCount < minSignals) {
        console.log(`  ❌ [VALIDATE] Too few program signals (${signalCount} < ${minSignals}) for ${url}`);
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
    if ((categorized.eligibility?.length || 0) === 0 && (lowerText.includes('startup') || lowerText.includes('neugründung') || lowerText.includes('gründung'))) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Startup',
        required: true,
        source: 'full_page_content'
      });
    }
    if ((categorized.eligibility?.length || 0) === 0 && (lowerText.includes('unternehmen') || lowerText.includes('firma') || lowerText.includes('company'))) {
      categorized.eligibility.push({
        type: 'company_type',
        value: 'Company',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // DOCUMENTS
    if ((categorized.documents?.length || 0) === 0 && (lowerText.includes('dokument') || lowerText.includes('unterlagen') || lowerText.includes('antrag'))) {
      categorized.documents.push({
        type: 'required_documents',
        value: 'Various documents required',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // FINANCIAL - Enhanced co_financing detection
    const coFinancingKeywords = [
      'eigenmittel', 'eigenkapital', 'co-financing', 'cofinanzierung', 
      'eigenanteil', 'mitfinanzierung', 'eigenbeitrag', 'selbstfinanzierung',
      'eigenbeteiligung', 'eigenfinanzierung', 'eigenleistung', 'eigenmitteln',
      'eigenfinanzierungsanteil', 'selbstbeteiligung', 'co-finance', 'co finance'
    ];
    if ((categorized.co_financing?.length || 0) === 0 && coFinancingKeywords.some(keyword => lowerText.includes(keyword))) {
      // Try to extract percentage value
      const percentageMatch = text.match(/(\d{1,3})[%\s]*(?:eigen|co-financ|mitfinanz|eigenbeitrag)/i);
      const percentage = percentageMatch ? percentageMatch[1] + '%' : 'Required';
      categorized.co_financing.push({
        type: 'co_financing',
        value: percentage,
        required: true,
        source: 'full_page_content'
      });
    }
    
    // TECHNICAL - Enhanced TRL detection
    const trlKeywords = [
      'trl', 'technology readiness', 'technology readiness level',
      'reifegrad', 'technologiereifegrad', 'technologie-reifegrad',
      'technological readiness', 'readiness level', 'trl-level',
      'trl level', 'trl 1', 'trl 2', 'trl 3', 'trl 4', 'trl 5', 'trl 6', 'trl 7', 'trl 8', 'trl 9'
    ];
    if ((categorized.trl_level?.length || 0) === 0 && trlKeywords.some(keyword => lowerText.includes(keyword))) {
      // Extract TRL level if possible
      const trlMatch = text.match(/trl[\s\-]?(\d{1})/i) || text.match(/technology readiness level[\s\-]?(\d{1})/i);
      const trlValue = trlMatch ? 'TRL ' + trlMatch[1] : this.extractTRL(text);
      categorized.trl_level.push({
        type: 'trl_level',
        value: trlValue,
        required: true,
        source: 'full_page_content'
      });
    }
    
    // GEOGRAPHIC
    if ((categorized.geographic?.length || 0) === 0 && (lowerText.includes('österreich') || lowerText.includes('austria'))) {
      categorized.geographic.push({
        type: 'location',
        value: 'Austria',
        required: true,
        source: 'full_page_content'
      });
    }
    
    // DEADLINES: Try to extract if missing in timeline
    const hasDeadline = (categorized.timeline || []).some((i: any) => (i.type || '').toLowerCase().includes('deadline'));
    if (!hasDeadline) {
      const datePattern = /(frist|deadline|einreichfrist|bewerbungsfrist|antragsfrist)[:\s]*([0-3]?\d[\.\/-][01]?\d[\.\/-](?:20)?\d{2}|[0-3]?\d\s+(jan|feb|mär|mae|mar|apr|mai|jun|jul|aug|sep|okt|nov|dez|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i;
      const m = text.match(datePattern);
      if (m) {
        categorized.timeline = categorized.timeline || [];
        categorized.timeline.push({
          type: 'deadline',
          value: m[0].trim(),
          required: true,
          source: 'full_page_content'
        });
      }
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
    // HIGH-PERFORMANCE: Use HTTP fetch first (10x faster than Puppeteer)
    // Fallback to Puppeteer only if fetch fails or page needs JS
    let content: string;
    let $: cheerio.Root;
    
    try {
      // Try fast HTTP fetch first
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
          },
          signal: AbortSignal.timeout(5000) // 5s timeout for HTTP
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        content = await response.text();
        $ = cheerio.load(content);
        
      } catch (fetchError) {
        // Fallback to Puppeteer if HTTP fails (JS-heavy pages)
        const page = await this.browser!.newPage();
        try {
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'font', 'stylesheet', 'media'].includes(resourceType)) {
              req.abort();
            } else {
              req.continue();
            }
          });
          
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
          content = await page.content();
          $ = cheerio.load(content);
          await page.close();
        } catch (puppeteerError) {
          await page.close().catch(() => {});
          throw puppeteerError;
        }
      }
      
      // Fast extraction (no verbose logging in parallel mode)
      const name = this.extractTitle($, institution.selectors.name);
      const description = this.extractDescription($, institution.selectors.description);
      
      // Extract structured data
      const structuredData = this.extractStructuredData(content, $);
      
      // Extract 18 categories
      const categorized_requirements = this.extract18Categories($, institution.selectors, content);
      
      // Program focus and funding type
      const programFocus = this.detectProgramFocus(content, institution);
      const fundingType = this.detectFundingType(content, institution.fundingTypes);
      
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
          // NORMALIZED: Use standard field names per contract review (cofinancing_pct vs co_financing)
          cofinancing_pct: this.extractCoFinancingPct(categorized_requirements.co_financing || [], structuredData),
          scraped_at: new Date(),
          confidence_score: 0.8,
          is_active: true
      };
    } catch (error) {
      // Error already logged if Puppeteer was used
      return null;
    }
  }

  private extractText($: cheerio.Root, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        // Try text first
        let text = element.text().trim();
        if (text && text.length > 10) return text;
        
        // Try alt text for images
        text = element.attr('alt') || '';
        if (text && text.length > 10) return text;
        
        // Try title attribute
        text = element.attr('title') || '';
        if (text && text.length > 10) return text;
      }
    }
    
    // Fallback: try common heading/paragraph selectors
    const fallbackSelectors = ['h1', 'h2.title', '.title', '.program-title', '.foerderung-title', 'main h1', 'article h1'];
    for (const selector of fallbackSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 5 && !text.toLowerCase().includes('newsletter') && !text.toLowerCase().includes('404')) {
        return text;
    }
    }
    
    return '';
  }

  /**
   * Extract co-financing percentage from categorized requirements or structured data
   * Normalizes to cofinancing_pct (per contract review)
   */
  private extractCoFinancingPct(coFinancingReqs: any[], structuredData: any): number | undefined {
    // Try structured data first
    if (structuredData.cofinancing_pct !== undefined) return structuredData.cofinancing_pct;
    if (structuredData.co_financing_pct !== undefined) return structuredData.co_financing_pct;
    
    // Try categorized requirements
    if (coFinancingReqs && coFinancingReqs.length > 0) {
      for (const req of coFinancingReqs) {
        if (req.value) {
          // Extract number from string like "30%" or "30 %"
          const match = String(req.value).match(/(\d+(?:\.\d+)?)/);
          if (match) return parseFloat(match[1]);
        }
      }
    }
    
    return undefined;
  }

  // SIMPLIFIED METHODS - Phase 1
  private extractTitle($: cheerio.Root, selectors: string[]): string {
    const title = this.extractText($, selectors);
    return title || 'Unknown Program';
  }

  private extractDescription($: cheerio.Root, selectors: string[]): string {
    let description = this.extractText($, selectors);
    
    // If no description found via selectors, try to extract from common content areas
    if (!description || description.length < 20) {
      // Try to get description from meta tags
      const metaDescription = $('meta[name="description"]').attr('content') || 
                             $('meta[property="og:description"]').attr('content') || '';
      if (metaDescription && metaDescription.length > 20) {
        description = metaDescription;
      }
    }
    
    // If still no description, extract from first meaningful paragraph
    if (!description || description.length < 20) {
      const paragraphs = $('main p, article p, .content p, .description p').filter((_, el) => {
        const text = $(el).text().trim();
        return text.length > 50 && text.length < 1000; // Meaningful length
      });
      
      if (paragraphs.length > 0) {
        description = paragraphs.first().text().trim();
      }
    }
    
    // Clean up description
    if (description) {
      description = description.replace(/\s+/g, ' ').trim(); // Normalize whitespace
      if (description.length > 2000) {
        description = description.substring(0, 2000) + '...'; // Limit length
      }
    }
    
    return description || 'No description available';
  }

  private extract18Categories($: cheerio.Root, selectors: any, content: string): any {
    const categorized: any = {};
    
    // Initialize all 18 categories
    REQUIREMENT_CATEGORIES.forEach(category => {
      categorized[category] = [];
    });
    
    // ENHANCED: Extract structured data from HTML elements first
    this.extractStructuredRequirements($, categorized);
    
    // Extract from specific selectors
    const eligibilityText = this.extractText($, selectors.eligibility);
    if (eligibilityText) {
      this.parseEligibilityText(eligibilityText, categorized);
    }
    
    const requirementsText = this.extractText($, selectors.requirements);
    if (requirementsText) {
      this.parseRequirementsText(requirementsText, categorized);
    }
    
    // Extract from full page with better pattern matching
    this.parseFullPageContent(content, categorized);
    
    return categorized;
  }
  
  // NEW: Extract structured requirements from HTML elements (tables, lists, etc.)
  private extractStructuredRequirements($: cheerio.Root, categorized: any): void {
    // Extract from tables (common pattern for funding programs)
    $('table').each((_, table) => {
      const $table = $(table);
      $table.find('tr').each((_, row) => {
        const $row = $(row);
        const cells = $row.find('td, th').map((_, cell) => $(cell).text().trim()).get();
        
        if (cells.length >= 2) {
          const label = cells[0].toLowerCase();
          const value = cells[1];
          
          // Financial amounts
          if (label.includes('förderhöhe') || label.includes('förderbetrag') || label.includes('funding amount') || label.includes('maximal') || label.includes('bis zu')) {
            const amountMatch = value.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/);
            if (amountMatch) {
              categorized.financial.push({
                type: 'funding_amount_max',
                value: value.trim(),
                required: true,
                source: 'table'
              });
            }
          }
          
          // Co-financing percentages
          if (label.includes('eigenmittel') || label.includes('eigenanteil') || label.includes('co-financing') || label.includes('mitfinanzierung')) {
            const pctMatch = value.match(/(\d{1,3})[%\s]*/);
            if (pctMatch) {
              categorized.co_financing.push({
                type: 'co_financing_percentage',
                value: pctMatch[1] + '%',
                required: true,
                source: 'table'
              });
            }
          }
          
          // Duration/Timeline
          if (label.includes('laufzeit') || label.includes('duration') || label.includes('zeitraum')) {
            const durationMatch = value.match(/(\d{1,3})\s*(jahr|jahr|monat|month|jahr)/i);
            if (durationMatch) {
              categorized.timeline.push({
                type: 'duration',
                value: value.trim(),
                required: true,
                source: 'table'
              });
            }
          }
          
          // TRL Level
          if (label.includes('trl') || label.includes('technology readiness')) {
            const trlMatch = value.match(/trl[\s\-]?(\d{1})/i);
            if (trlMatch) {
              categorized.trl_level.push({
                type: 'trl_level',
                value: 'TRL ' + trlMatch[1],
                required: true,
                source: 'table'
              });
            }
          }
          
          // Geographic location
          if (label.includes('standort') || label.includes('region') || label.includes('location')) {
            if (value && value.length > 2 && value.length < 50) {
              categorized.geographic.push({
                type: 'specific_location',
                value: value.trim(),
                required: true,
                source: 'table'
              });
            }
          }
        }
      });
    });
    
    // Extract from definition lists (dl/dt/dd - common in German sites)
    $('dl').each((_, dl) => {
      const $dl = $(dl);
      $dl.find('dt, dd').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const isTerm = $el.is('dt');
        const nextSibling = $el.next();
        
        if (isTerm && nextSibling.length && nextSibling.is('dd')) {
          const term = text.toLowerCase();
          const definition = nextSibling.text().trim();
          
          // Financial
          if ((term.includes('förderung') || term.includes('betrag') || term.includes('finanzierung')) && definition.match(/\d+.*€|€.*\d+/)) {
            categorized.financial.push({
              type: 'funding_amount',
              value: definition,
              required: true,
              source: 'definition_list'
            });
          }
          
          // Co-financing
          if (term.includes('eigenmittel') || term.includes('eigenanteil')) {
            const pctMatch = definition.match(/(\d{1,3})[%\s]*/);
            if (pctMatch) {
              categorized.co_financing.push({
                type: 'co_financing_percentage',
                value: pctMatch[1] + '%',
                required: true,
                source: 'definition_list'
              });
            }
          }
          
          // Eligibility - company type
          if (term.includes('teilnahmeberechtigt') || term.includes('eligibility') || term.includes('voraussetzung')) {
            if (definition.toLowerCase().includes('startup') || definition.toLowerCase().includes('unternehmen')) {
              categorized.eligibility.push({
                type: 'company_type',
                value: definition.trim(),
                required: true,
                source: 'definition_list'
              });
            }
          }
        }
      });
    });
    
    // Extract from structured sections with common class names
    const structuredSections = [
      { selector: '.foerderbetrag, .funding-amount, [class*="amount"]', category: 'financial', type: 'funding_amount' },
      { selector: '.deadline, .frist, [class*="deadline"]', category: 'timeline', type: 'deadline' },
      { selector: '.eigenmittel, .co-financing, [class*="eigen"]', category: 'co_financing', type: 'co_financing_percentage' },
      { selector: '.laufzeit, .duration, [class*="laufzeit"]', category: 'timeline', type: 'duration' },
      { selector: '.voraussetzung, .eligibility, [class*="voraussetzung"]', category: 'eligibility', type: 'eligibility_criteria' }
    ];
    
    structuredSections.forEach(({ selector, category, type }) => {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 5 && text.length < 200) {
          // Only add if value contains actual data (not just labels)
          if (text.match(/\d+/) || text.length > 20) {
            categorized[category].push({
              type,
              value: text,
              required: true,
              source: 'structured_section'
            });
          }
        }
      });
    });
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
    
    // Financial requirements - Enhanced co_financing detection
    const coFinancingKeywords = [
      'eigenmittel', 'eigenkapital', 'co-financing', 'cofinanzierung', 
      'eigenanteil', 'mitfinanzierung', 'eigenbeitrag', 'selbstfinanzierung',
      'eigenbeteiligung', 'eigenfinanzierung', 'eigenleistung', 'eigenmitteln',
      'eigenfinanzierungsanteil', 'selbstbeteiligung', 'co-finance', 'co finance'
    ];
    if (coFinancingKeywords.some(keyword => lowerText.includes(keyword))) {
      // Try to extract percentage value
      const percentageMatch = text.match(/(\d{1,3})[%\s]*(?:eigen|co-financ|mitfinanz|eigenbeitrag)/i);
      const percentage = percentageMatch ? percentageMatch[1] + '%' : this.extractPercentage(text) || this.extractNumber(text) + '%';
      categorized.co_financing.push({
        type: 'co_financing',
        value: percentage,
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
    
    // Enhanced TRL detection
    const trlKeywords = [
      'trl', 'technology readiness', 'technology readiness level',
      'reifegrad', 'technologiereifegrad', 'technologie-reifegrad',
      'technological readiness', 'readiness level', 'trl-level',
      'trl level', 'trl 1', 'trl 2', 'trl 3', 'trl 4', 'trl 5', 'trl 6', 'trl 7', 'trl 8', 'trl 9'
    ];
    if (trlKeywords.some(keyword => lowerText.includes(keyword))) {
      // Extract TRL level if possible
      const trlMatch = text.match(/trl[\s\-]?(\d{1})/i) || text.match(/technology readiness level[\s\-]?(\d{1})/i);
      const trlValue = trlMatch ? 'TRL ' + trlMatch[1] : this.extractTRL(text);
      categorized.trl_level.push({
        type: 'trl_level',
        value: trlValue,
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
    
    // Documents detailed detection
    const docTerms = ['pitch deck', 'businessplan', 'antragsformular', 'finanzplan', 'cv', 'lebenslauf', 'prototyp', 'meilensteinplan', 'projektbeschreibung'];
    if (docTerms.some(t => lowerText.includes(t))) {
      const matched = docTerms.filter(t => lowerText.includes(t)).join(', ');
      categorized.documents.push({
        type: 'documents_required',
        value: matched,
        required: true,
        source: 'requirements_text'
      });
    }
    
    // Enhanced co_financing detection in requirements
    const coFinancingKeywords = [
      'eigenmittel', 'eigenkapital', 'co-financing', 'cofinanzierung', 
      'eigenanteil', 'mitfinanzierung', 'eigenbeitrag', 'selbstfinanzierung',
      'eigenbeteiligung', 'eigenfinanzierung', 'eigenleistung', 'eigenmitteln',
      'eigenfinanzierungsanteil', 'selbstbeteiligung', 'co-finance', 'co finance'
    ];
    if (coFinancingKeywords.some(keyword => lowerText.includes(keyword))) {
      const percentageMatch = text.match(/(\d{1,3})[%\s]*(?:eigen|co-financ|mitfinanz|eigenbeitrag)/i);
      const percentage = percentageMatch ? percentageMatch[1] + '%' : this.extractPercentage(text) || this.extractNumber(text) + '%';
      categorized.co_financing.push({
        type: 'co_financing',
        value: percentage,
        required: true,
        source: 'requirements_text'
      });
    }
    
    // Enhanced TRL detection in requirements
    const trlKeywords = [
      'trl', 'technology readiness', 'technology readiness level',
      'reifegrad', 'technologiereifegrad', 'technologie-reifegrad',
      'technological readiness', 'readiness level', 'trl-level',
      'trl level', 'trl 1', 'trl 2', 'trl 3', 'trl 4', 'trl 5', 'trl 6', 'trl 7', 'trl 8', 'trl 9'
    ];
    if (trlKeywords.some(keyword => lowerText.includes(keyword))) {
      // Support ranges like TRL 1-3 or Reifegrad 3–6
      const trlRange = text.match(/trl\s*(\d)\s*[–-]\s*(\d)/i) || text.match(/reifegrad\s*(\d)\s*[–-]\s*(\d)/i);
      const trlMatch = text.match(/trl[\s\-]?(\d{1})/i) || text.match(/technology readiness level[\s\-]?(\d{1})/i);
      const trlValue = trlRange ? `TRL ${trlRange[1]}-${trlRange[2]}` : (trlMatch ? 'TRL ' + trlMatch[1] : this.extractTRL(text));
      categorized.trl_level.push({
        type: 'trl_level',
        value: trlValue,
        required: true,
        source: 'requirements_text'
      });
    }

    // Diversity / gender terms
    if (lowerText.includes('frauen') || lowerText.includes('female') || lowerText.includes('divers') || lowerText.includes('diversität') || lowerText.includes('gender') || lowerText.includes('esg')) {
      categorized.diversity.push({
        type: 'diversity_requirement',
        value: 'Diversity/Gender related requirement',
        required: false,
        source: 'requirements_text'
      });
    }

    // Geographic regional hints
    const regions = [
      { key: 'wien', value: 'Vienna' },
      { key: 'steiermark', value: 'Styria' },
      { key: 'österreich', value: 'Austria' },
      { key: 'austria', value: 'Austria' },
      { key: 'eu', value: 'EU' }
    ];
    regions.forEach(r => {
      if (lowerText.includes(r.key)) {
        categorized.geographic.push({
          type: 'location',
          value: r.value,
          required: true,
          source: 'requirements_text'
        });
      }
    });
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
      
      // OPTIMIZED: Faster loading for listing pages, smart loading for detail pages
      const isQueryUrl = url.includes('?') && (url.includes('field_') || url.includes('filter'));
      if (isQueryUrl) {
        // Query URLs are listing pages - fastest loading
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });
        await new Promise(resolve => setTimeout(resolve, 150)); // Reduced delay
      } else {
        // Detail pages - use domcontentloaded (faster) instead of networkidle2
        // Most funding program pages aren't heavily JS-dependent
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
      }
      
      // ENHANCED: Extract program detail links from listing/category pages
      // Prioritize finding actual program detail pages, not just more category pages
      const links = await page.evaluate((keywords, exclusionKeywords, baseUrl, currentUrl) => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        const allLinks = new Set<string>();
        const currentPath = new URL(currentUrl || baseUrl).pathname.toLowerCase();
        const isListingPage = currentPath.includes('foerderungen') || currentPath.includes('program') || 
                             currentUrl.includes('?field_') || currentUrl.includes('?filter');
        
        // Helper to check if URL looks like a program detail page
        const isDetailPagePattern = (urlPath: string): boolean => {
          // Skip query URLs
          if (urlPath.includes('?')) return false;
          
          const segments = urlPath.split('/').filter(s => s.length > 0);
          const lastSegment = segments[segments.length - 1];
          
          // Category page indicators (exclude)
          const categoryTerms = ['foerderungen', 'foerderung', 'programme', 'programs', 'program', 
                                'kredite', 'unternehmen', 'privatkunden', 'initiative', 'thema',
                                'spezialprogramme', 'wettbewerbe', 'universitaeten'];
          if (categoryTerms.some(term => lastSegment === term || segments.includes(term))) {
            return false;
          }
          
          // Detail page indicators (include)
          // 1. Has node ID pattern
          if (urlPath.match(/\/node\/\d+/)) return true;
          // 2. Has program code pattern (e.g., /eureka-celtic-call2025)
          if (urlPath.match(/\/([a-z]{2,}\-[a-z]{2,}\-?\d{4})/)) return true;
          // 3. Has call/ausschreibung pattern
          if (urlPath.match(/\/(calls?|ausschreibung)\/[\w\-]+/)) return true;
          // 4. Deep path with specific program-like identifier
          if (segments.length >= 3 && (lastSegment.length > 15 || /[\d_\-]{5,}/.test(lastSegment))) {
            return true;
          }
          // 5. Program path pattern (e.g., /programme/Innovationsscheck)
          if (segments.length >= 2) {
            const programIdx = segments.findIndex(s => ['programme', 'program', 'ausschreibung', 'calls'].includes(s.toLowerCase()));
            if (programIdx >= 0 && programIdx < segments.length - 1) {
              return true;
            }
          }
          
          return segments.length >= 4; // Very deep paths are likely detail pages
        };
        
        linkElements.forEach(el => {
          const href = el.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            const hrefLower = href.toLowerCase();
          
          // Skip blacklisted URLs
            const hasBlacklist = exclusionKeywords.some(keyword => hrefLower.includes(keyword));
            if (hasBlacklist) return;
            
          // Convert to full URL
                let fullUrl: string;
                try {
                  if (href.startsWith('/')) {
                    fullUrl = new URL(href, baseUrl).href;
                  } else if (href.startsWith('http')) {
                    fullUrl = href;
                  } else {
              return; // Skip relative URLs that aren't absolute or root-relative
                  }
                } catch {
                  return;
                }
          
          // Only include same-domain URLs
          try {
            const urlObj = new URL(fullUrl);
            const baseUrlObj = new URL(baseUrl);
            if (urlObj.hostname !== baseUrlObj.hostname) return;
            
            const urlPath = urlObj.pathname.toLowerCase();
            
            // ENHANCED: On listing pages, aggressively find ALL potential program links
            if (isListingPage) {
              // Skip query URLs (they're more filter pages)
              if (urlObj.search && (urlObj.search.includes('field_') || urlObj.search.includes('filter'))) {
                return;
              }
              
              // Strategy 1: Check if it's clearly a detail page pattern
              if (isDetailPagePattern(urlPath)) {
                allLinks.add(fullUrl);
              return;
            }
              
              // Strategy 2: Check parent element (cards, articles, list items with program content)
              const parentSelectors = [
                'article', '.card', '.teaser', '.program', '.foerderung', '.entry',
                'li[class*="program"]', 'li[class*="foerderung"]', 'li[class*="item"]',
                '.program-list li', '.foerderung-list li', '.program-card', '.program-teaser',
                '[class*="program"]', '[class*="foerderung"]', '[class*="grant"]',
                'main article', 'main .card', '.view-content article', '.view-content .card'
              ];
              
              let parentEl = null;
              for (const selector of parentSelectors) {
                parentEl = el.closest(selector);
                if (parentEl) break;
              }
              
              if (parentEl) {
                const parentText = parentEl.textContent?.toLowerCase() || '';
                const linkText = el.textContent?.toLowerCase() || '';
                const combinedText = parentText + ' ' + linkText;
                
                // Strong program indicators
                const hasStrongProgramText = 
                  combinedText.includes('foerderung') || combinedText.includes('program') || 
                  combinedText.includes('grant') || combinedText.includes('innovation') ||
                  combinedText.includes('ausschreibung') || combinedText.includes('call') ||
                  combinedText.includes('bewerbung') || combinedText.includes('application') ||
                  combinedText.includes('finanzierung') || combinedText.includes('kredit');
                
                // Funding amount indicators (€, Euro, amounts)
                const hasFundingAmount = /€|\d+[\.,]\d+\s*(?:eur|euro|€|million|mio)/i.test(combinedText);
                
                // Deadline/application indicators
                const hasDeadline = /(deadline|frist|bewerbung|einreichung|application|antrag)/i.test(combinedText);
                
                const pathDepth = urlPath.split('/').filter(s => s.length > 0).length;
                
                // Include if:
                // 1. Has strong program text AND path depth >= 2, OR
                // 2. Has funding amount/deadline AND path depth >= 3
                if (hasStrongProgramText && pathDepth >= 2) {
                  allLinks.add(fullUrl);
                return;
                }
                if ((hasFundingAmount || hasDeadline) && pathDepth >= 3) {
                  allLinks.add(fullUrl);
                  return;
                }
              }
              
              // Strategy 3: If it's from a table or structured list, likely a program link
              const isInTable = el.closest('table, .table-view, .program-table, tbody, tr');
              if (isInTable && urlPath.split('/').filter(s => s.length > 0).length >= 3) {
                allLinks.add(fullUrl);
                return;
              }
            } else {
              // On detail pages, extract links more broadly (for discovery)
              const hasKeyword = keywords.some(keyword => hrefLower.includes(keyword)) ||
                                urlPath.includes('foerderung') || urlPath.includes('program') ||
                                urlPath.includes('grant') || urlPath.includes('funding') ||
                                urlPath.includes('innovation') || urlPath.includes('startup');
              
              if (hasKeyword) {
                const pathDepth = urlPath.split('/').filter(s => s.length > 0).length;
                if (pathDepth >= 2) {
                  allLinks.add(fullUrl);
                }
                }
              }
            } catch {
              return;
            }
          });
        
        return Array.from(allLinks);
      }, institution.keywords, autoDiscoveryPatterns.exclusionKeywords, institution.baseUrl, url);
      
      await page.close();
      console.log(`    📎 [EXTRACT] Found ${links.length} links from ${url}`);
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
