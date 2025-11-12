// Consolidated utilities: URL handling, HTTP fetching, HTML storage
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// ============================================================================
// URL UTILITIES
// ============================================================================

export function normalizeUrl(base: string, href: string): string | null {
  try {
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return null;
    // Filter out email protection URLs
    if (href.includes('cdn-cgi/l/email-protection') || href.includes('email-protection#')) return null;
    const url = href.startsWith('http') ? new URL(href) : new URL(href, base);
    return url.href;
  } catch {
    return null;
  }
}

export function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

export function isDownload(url: string): boolean {
  return /\.(pdf|docx?|xlsx?|pptx?)(?:$|[?#])/i.test(url) || url.toLowerCase().includes('download');
}

export function isQueryListing(url: string): boolean {
  const lower = url.toLowerCase();
  if (!lower.includes('?')) return false;
  // Enhanced: Catch more query parameter patterns (filter, sort, page, type, year, combine, etc.)
  // Fixed: Case-insensitive and catch double-B pattern (type%5BB0%5D)
  return /(filter|field_|search|suche|query|sort=|type%5b|type%5bb|year%5b|combine_|combine%5b|page=|offset=|limit=|year=|type=|category=)/i.test(lower);
}

/**
 * Detect if a page is an overview/listing page (e.g., FFG /en/fundings with filters)
 * Overview pages have multiple program links but don't contain detailed requirements themselves
 */
export function isOverviewPage(url: string, html?: string): boolean {
  try {
    const u = new URL(url);
    const urlPath = u.pathname.toLowerCase();
    const urlLower = url.toLowerCase();
    
    // Known overview page patterns (without query params)
    const overviewPatterns = [
      // FFG
      /^\/en\/fundings\/?$/,
      /^\/foerderungen\/?$/,
      // AWS
      /^\/en\/aws-[^\/]+$/,
      /^\/en\/aws-[^\/]+\/$/,
      /\/aws-[^\/]+\/(equity|loan|guarantee|digitalization|innovation)/i,
      // Generic patterns
      /^\/programme\/?$/,
      /^\/programm\/?$/,
      /^\/foerderungen\/?$/,
      /^\/ausschreibungen\/?$/,
      /^\/calls\/?$/,
      // WKO
      /\/foerderungen\/?$/,
      /\/foerderung\/?$/,
    ];
    
    if (overviewPatterns.some(pattern => pattern.test(urlPath))) {
      return true;
    }
    
    // Check for filter/query parameters (FFG filter pages)
    // e.g., /en/fundings?field_funding_type%5B0%5D=...
    if (u.searchParams.toString().length > 0) {
      const hasFilterParams = 
        u.searchParams.has('field_') ||
        u.searchParams.has('filter') ||
        u.searchParams.has('type') ||
        u.searchParams.has('category') ||
        urlLower.includes('field_') ||
        urlLower.includes('filter') ||
        urlLower.includes('type%5b') ||
        urlLower.includes('combine_');
      
      // If URL has filter params AND is on a fundings/programme path, it's an overview page
      if (hasFilterParams && (
        urlPath.includes('/fundings') ||
        urlPath.includes('/foerderungen') ||
        urlPath.includes('/programme') ||
        urlPath.includes('/programm')
      )) {
        return true;
      }
    }
    
    // If HTML provided, analyze content structure
    if (html) {
      try {
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
      
        // Check for filter/search UI elements (FFG filter pages)
        const hasFilterUI = 
          $('select[name*="field_"]').length > 0 ||
          $('input[name*="filter"]').length > 0 ||
          $('[class*="filter"]').length > 0 ||
          $('[class*="search"]').length > 0 ||
          $('[id*="filter"]').length > 0 ||
          $('[id*="search"]').length > 0;
        
        // Count program detail links
        let programLinkCount = 0;
        $('a[href]').each((_: any, el: any) => {
          const href = $(el).attr('href') || '';
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = new URL(href, url).toString();
          } else if (!href.startsWith('http')) {
            fullUrl = new URL(href, url).toString();
          }
          
          // Check if link points to a program detail page
          if (fullUrl.match(/\/program[me]?s?\/|\/foerderung|\/grant|\/funding|\/node\/\d+/i)) {
            programLinkCount++;
          }
        });
        
        // Also check for listing indicators in content
        const hasListingStructure = 
          $('article').length >= 3 || // Multiple article elements (common in listing pages)
          $('[class*="card"]').length >= 3 || // Card-based listings
          $('[class*="listing"]').length > 0 || // Explicit listing classes
          $('[class*="grid"]').length > 0 && $('a[href]').length > 10; // Grid with many links
        
        // If page has filter UI OR (5+ program detail links AND listing structure), it's an overview page
        if (hasFilterUI || (programLinkCount >= 5 && hasListingStructure)) {
          return true;
        }
      } catch {
        // If cheerio fails, fall back to URL pattern matching only
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Detect if a page requires login/authentication
 */
export function requiresLogin(url: string, html?: string): boolean {
  try {
    const urlLower = url.toLowerCase();
    const htmlLower = html ? html.toLowerCase() : '';
    
    // URL patterns that indicate login pages
    const loginUrlPatterns = [
      /\/login\/?$/i,
      /\/anmeldung\/?$/i,
      /\/sign-in\/?$/i,
      /\/register\/?$/i,
      /\/registration\/?$/i,
      /\/auth\/?$/i,
      /\/authenticate\/?$/i,
      /\/foerdermanager/i, // AWS FörderManager
      /\/portal\/?$/i,
      /\/dashboard\/?$/i,
    ];
    
    if (loginUrlPatterns.some(pattern => pattern.test(urlLower))) {
      return true;
    }
    
    // HTML content patterns
    if (html) {
      const hasLoginForm = 
        htmlLower.includes('login') ||
        htmlLower.includes('anmeldung') ||
        htmlLower.includes('password') ||
        htmlLower.includes('passwort') ||
        htmlLower.includes('sign in') ||
        htmlLower.includes('register') ||
        htmlLower.includes('registration');
      
      const hasLoginFields = 
        htmlLower.includes('type="password"') ||
        htmlLower.includes('name="password"') ||
        htmlLower.includes('id="password"') ||
        htmlLower.includes('class="password"');
      
      // Check for "requires login" or "login required" messages
      const requiresLoginMessage = 
        htmlLower.includes('login required') ||
        htmlLower.includes('anmeldung erforderlich') ||
        htmlLower.includes('please log in') ||
        htmlLower.includes('bitte anmelden') ||
        htmlLower.includes('access restricted') ||
        htmlLower.includes('zugriff beschränkt');
      
      // If page has login form fields OR requires login message, it needs login
      if ((hasLoginForm && hasLoginFields) || requiresLoginMessage) {
        return true;
      }
    }
    
    return false;
  } catch {
    return false;
  }
}

// Load learned patterns from collected URLs
let learnedPatternsCache: any = null;
function loadLearnedPatterns() {
  if (learnedPatternsCache) return learnedPatternsCache;
  try {
    const fs = require('fs');
    const path = require('path');
    const patternsFile = path.join(__dirname, '..', 'data', 'lite', 'url-patterns.json');
    if (fs.existsSync(patternsFile)) {
      learnedPatternsCache = JSON.parse(fs.readFileSync(patternsFile, 'utf8'));
      return learnedPatternsCache;
    }
  } catch {}
  return {};
}

export async function isProgramDetailPage(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const urlPath = u.pathname.toLowerCase();
    const pathSegments = urlPath.split('/').filter(s => s.length > 0);
    const host = u.hostname.toLowerCase();
    
    // Quick exclusions: downloads, query filters
    if (url.match(/\.(pdf|docx?|xlsx?|ppt)$/i) || url.toLowerCase().includes('download')) {
      return false;
    }
    if (url.includes('?') && (url.includes('field_') || url.includes('filter') || url.includes('name%5B') || url.includes('status%5B'))) {
      return false;
    }
    
    // CRITICAL: Exclude non-funding content
    const urlLower = url.toLowerCase();
    const exclusionPatterns = [
      // Housing/Real Estate
      /wohnbau|wohnung|wohnbauförderung|wohnungsbau|wohnbeihilfe|bauen-wohnen|raumplanung/i,
      /housing|real.estate|immobilie|baufinanzierung|hypothek|mortgage/i,
      // Agriculture/Forestry
      /landwirtschaft|forstwirtschaft|agriculture|forestry/i,
      /pflanzenschutz|gentechnik|almwirtschaft|agrarbehoerde|bodenschutz|schutzwald|forstliche|walderschliessung/i,
      // Infrastructure/Construction
      /verkehrsinfrastruktur|traffic|bahninfrastruktur|eisenbahn|bau-neubau|bauordnung|baurecht|bauprojekt/i,
      /construction|infrastructure|building|neubau/i,
      // Private consumer
      /privatkunden|private|consumer|endkunde/i
    ];
    
    if (exclusionPatterns.some(pattern => pattern.test(urlLower))) {
      return false;
    }
    
    // Load learned patterns from collected URLs (JSON fallback)
    const learnedPatterns = loadLearnedPatterns();
    const hostKey = host.replace('www.', '');
    
    // Use learned patterns if available (JSON fallback)
    if (learnedPatterns[hostKey] && learnedPatterns[hostKey].patterns) {
      const patterns = learnedPatterns[hostKey].patterns;
      
      // Check exclusions first
      for (const excludePattern of patterns.exclude || []) {
        const regex = new RegExp(excludePattern);
        if (regex.test(urlPath)) {
          return false;
        }
      }
      
      // Check include patterns
      for (const includePattern of patterns.include || []) {
        const regex = new RegExp(includePattern);
        if (regex.test(urlPath)) {
          return true;
        }
      }
      
      // If patterns exist but none matched, default to exclude
      if (patterns.include.length > 0) {
        return false;
      }
    }
    
    // NOTE: Database-learned patterns are now handled via url_patterns table in db.ts
    // This function uses JSON fallback patterns from url-patterns.json file
    
    // FALLBACK: INSTITUTION-SPECIFIC PATTERNS (strict whitelist per institution)
    
    // FFG patterns
    if (host.includes('ffg.at')) {
      // /ausschreibung/{program-name}
      if (urlPath.match(/\/ausschreibung\/[^\/]+[^\/]$/) && !urlPath.endsWith('/ausschreibung')) {
        return true;
      }
      // /programm/{program-name}
      if (urlPath.match(/\/programm\/[^\/]+[^\/]$/) && !urlPath.endsWith('/programm')) {
        return true;
      }
      // /node/{number}
      if (urlPath.match(/\/node\/\d+$/)) {
        return true;
      }
      // /call/{call-name} or /calls/{call-name}
      if (urlPath.match(/\/(call|calls)\/[^\/]+/)) {
        return true;
      }
      // /europa/ausschreibungen/{call-name}
      if (urlPath.match(/\/europa\/ausschreibungen\/[^\/]+/)) {
        return true;
      }
      // /europa/heu/calls/{call-id}
      if (urlPath.match(/\/europa\/heu\/calls\/[^\/]+/)) {
        return true;
      }
      // /europa/heu/cluster{number}/call{year}
      if (urlPath.match(/\/europa\/heu\/cluster\d+\/call\d+/)) {
        return true;
      }
      // /europa/dep/calls/{call-id}
      if (urlPath.match(/\/europa\/dep\/calls\/[^\/]+/)) {
        return true;
      }
      // Program codes (e.g., /eureka-celtic-call2025)
      if (urlPath.match(/\/([a-z]{2,}\-[a-z]{2,}\-?\d{4})/)) {
        return true;
      }
      
      // FFG exclusions
      if (urlPath.includes('/category/') || urlPath.includes('/taxonomy/term/')) {
        return false;
      }
      // Exclude /themen (without trailing detail page)
      if (urlPath === '/themen' || urlPath === '/en/themen' || urlPath.endsWith('/themen')) {
        return false;
      }
      // Exclude /foerderungen and /programme listing pages
      if (urlPath === '/foerderungen' || urlPath === '/en/foerderungen' || urlPath.endsWith('/foerderungen')) {
        return false;
      }
      if (urlPath === '/programme' || urlPath === '/en/programme' || urlPath.endsWith('/programme')) {
        return false;
      }
      // Exclude category listing pages (but keep detail pages like /europa/ausschreibungen/{call-name})
      if (urlPath === '/europa/' || urlPath === '/ausschreibungen/' || 
          (urlPath.startsWith('/europa/ausschreibungen/') && urlPath.split('/').filter(s => s).length <= 3)) {
        return false; // Category listing page
      }
      if (urlPath.includes('/europa/heu/') && !urlPath.match(/\/calls\/|\/cluster\d+\/call\d+/)) {
        return false; // Category page
      }
      // Exclude generic program listing pages
      if (urlPath === '/programm/' || urlPath === '/programme/' || urlPath === '/programm' || urlPath === '/programme') {
        return false;
      }
      if (urlPath.includes('/europa/dep') && !urlPath.includes('/calls/')) {
        return false;
      }
      if (urlPath.includes('/europa/veranstaltungen')) {
        return false;
      }
      
      return false; // Default exclude for FFG
    }
    
    // AWS patterns
    if (host.includes('aws.at')) {
      // /spezialprogramme/{program-name}/
      if (urlPath.match(/\/spezialprogramme\/[^\/]+\/?$/)) {
        return true;
      }
      // /{category}/{program-name}/ (deep paths, exclude category segments)
      if (pathSegments.length >= 2) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        const categoryWords = ['foerderungen', 'foerderung', 'kmu', 'startup', 'export', 'innovation', 'investition', 'implementierung'];
        // Last segment must be a program name (not a category word, and long enough)
        if (!categoryWords.includes(lastSegment.toLowerCase()) && lastSegment.length > 10) {
          // Exclude if it's a category path like /foerderungen/{category}
          const firstSegment = pathSegments[0];
          if (firstSegment !== 'foerderungen' && firstSegment !== 'foerderung') {
            return true;
          }
        }
      }
      // Direct program name at root (e.g., /stromkosten-ausgleich-2022/)
      if (pathSegments.length === 1 && pathSegments[0].length > 15 && !pathSegments[0].includes('foerderung')) {
        return true;
      }
      // /aws-innovationsschutz/{category}/{program}/
      if (urlPath.match(/\/aws-innovationsschutz\/[^\/]+\/[^\/]+\/?$/)) {
        return true;
      }
      
      // AWS exclusions
      if (urlPath.includes('/service/') && !urlPath.includes('/service/foerderungen')) {
        return false;
      }
      if (urlPath.includes('/events/') || urlPath.includes('/karriere/')) {
        return false;
      }
      if (urlPath.includes('/foerderungen/') && urlPath.match(/\/foerderungen\/(kmu|startup|export|innovation|investition)-foerderungen/)) {
        return false; // Category pages
      }
      
      return false; // Default exclude for AWS
    }
    
    // VBA patterns
    if (host.includes('vba.at')) {
      // /foerderungen/{program-name} (but need to check if it's actually a program, not a category)
      if (urlPath.match(/\/foerderungen\/[^\/]+\/?$/) && !urlPath.match(/\/foerderungen\/(startup|innovation|export)-foerderungen$/)) {
        // Check if it looks like a specific program (not a category)
        const segments = pathSegments;
        if (segments.length >= 2) {
          const programSegment = segments[segments.length - 1];
          if (programSegment.length > 10) {
            return true;
          }
        }
      }
      
      // VBA exclusions
      if (urlPath.includes('/events-workshops/')) {
        return false; // Events, not programs
      }
      
      return false;
    }
    
    // WKO patterns
    if (host.includes('wko.at')) {
      // /oe/foerderungen/{category}/{program-name}
      if (urlPath.match(/\/oe\/foerderungen\/[^\/]+\/[^\/]+/)) {
        return true;
      }
      // /foerderung/foerderungen/{program-name} (need to verify this pattern)
      
      return false;
    }
    
    // GLOBAL PATTERNS (work across institutions)
    // /ausschreibung/{program-name}
    if (urlPath.match(/\/ausschreibung\/[^\/]+[^\/]$/) && !urlPath.endsWith('/ausschreibung')) {
      return true;
    }
    // /programm/{program-name}
    if (urlPath.match(/\/programm\/[^\/]+[^\/]$/) && !urlPath.endsWith('/programm')) {
      return true;
    }
    // /call/{call-name}
    if (urlPath.match(/\/(call|calls)\/[^\/]+/)) {
      return true;
    }
    
    // GLOBAL EXCLUSIONS
    if (urlPath.includes('/category/') || urlPath.includes('/taxonomy/term/')) {
      return false;
    }
    if (urlPath.includes('/events/') || urlPath.includes('/events-workshops/')) {
      return false;
    }
    
    // Generic category page exclusions (but allow detail pages under these paths)
    const categoryPagePatterns = [
      /^\/themen\/$/i,  // Exact /themen/ only (not /themen/xyz/)
      /\/brancheninformationen/i,
      /\/gastronomie-und-tourismus/i,
      /^\/programm\/$/i,  // Exact /programm/ only (not /programm/xyz/)
      /^\/programme\/$/i,
      /^\/foerderungen\/$/i,
      /^\/ausschreibungen\/$/i,
      /^\/calls\/$/i
    ];
    
    if (categoryPagePatterns.some(pattern => pattern.test(urlPath))) {
      return false;
    }
    
    // IMPROVEMENT: For known institutions, be more lenient
    // Check if URL is from a known institution
    const knownHosts = [
      'ffg.at', 'aws.at', 'vba.at', 'wko.at', 'sfg.at', 'ams.at',
      'speedinvest.com', 'eic.ec.europa.eu', 'tecnet.at', 'noebeg.at', 
      'wkbg.at', 'conda.at', 'kfw.de', 'bpi.fr', 'eib.org', 'eif.org',
      'horizon', 'europa.eu', 'eif.org', 'bmwk.de', 'rvo.nl', 'invest-nl.nl'
    ];
    
    const hostname = u.hostname.toLowerCase();
    const isKnownInstitution = knownHosts.some(knownHost => hostname.includes(knownHost));
    
    if (isKnownInstitution) {
      // For known institutions, accept more patterns
      // ENHANCED: More comprehensive funding/program keywords in URL
      const fundingKeywords = ['funding', 'foerderung', 'förderung', 'programm', 'program', 'ausschreibung', 'call', 'grant', 'loan', 'equity', 'subsidy', 'financing', 'finanzierung', 'subvention', 'darlehen', 'kredit', 'investition', 'innovation', 'research', 'forschung', 'startup', 'unternehmen', 'kmu', 'sme', 'beihilfe', 'support', 'unterstützung', 'venture', 'seed', 'preseed', 'incubator', 'accelerator', 'fellowship', 'scholarship', 'stipendium', 'zuschuss', 'finanzhilfe', 'foerderbetrag', 'foerderhoehe', 'digitalisierung', 'digitalization', 'ai.start', 'deep.tech', 'growth.investment', 'first.incubator', 'innovation.protection', 'erp.loan', 'guarantee', 'bürgschaft', 'innovation.voucher', 'bridge', 'collective.research', 'spin.off', 'diversitec', 'diversity', 'tech4people', 'international.market.entry', 'creative.industry', 'quality.of.life', 'startklar', 'ideenreich', 'wachstumsschritt', 'greensinvest', 'cybersicher', 'lebensnah'];
      const hasFundingKeyword = fundingKeywords.some(keyword => urlPath.includes(keyword));
      
      // Accept if has funding keyword AND has depth (not just root/category page)
      if (hasFundingKeyword && pathSegments.length >= 2) {
        // Additional check: not a known category-only page
        const categoryOnly = ['category', 'taxonomy', 'tag', 'events', 'news', 'blog', 'contact', 'about'];
        const isCategoryOnly = categoryOnly.some(cat => urlPath.includes(`/${cat}/`) || urlPath.endsWith(`/${cat}`));
        if (!isCategoryOnly) {
          return true;
        }
      }
    }
    
    // DEFAULT: EXCLUDE (be strict - only include what we're confident about)
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// HTML STORAGE
// ============================================================================

const RAW_DIR = path.join(__dirname, '..', 'data', 'lite', 'raw');

export function ensureRawDir(): void {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
}

export function saveRawHtml(html: string, url: string): string {
  ensureRawDir();
  const hash = createHash('sha256').update(url).digest('hex');
  const filePath = path.join(RAW_DIR, `${hash}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
  return filePath;
}

export function getRawHtmlPath(url: string): string | null {
  const hash = createHash('sha256').update(url).digest('hex');
  const filePath = path.join(RAW_DIR, `${hash}.html`);
  return fs.existsSync(filePath) ? filePath : null;
}

// ============================================================================
// HTTP FETCHING
// ============================================================================

const hostNextTime: Record<string, number> = {};
const PER_HOST_DELAY_MS = 250; // ~4 req/s per host

async function throttleHost(url: string): Promise<void> {
  try {
    const host = new URL(url).host;
    const now = Date.now();
    const next = hostNextTime[host] || 0;
    if (now < next) {
      await new Promise(r => setTimeout(r, next - now));
    }
    hostNextTime[host] = Date.now() + PER_HOST_DELAY_MS;
  } catch {
    // ignore
  }
}

export interface FetchResult {
  html: string;
  rawHtmlPath: string;
  status: number;
  etag?: string;
  lastModified?: string;
}

export async function fetchHtml(url: string, saveRaw = true): Promise<FetchResult> {
  await throttleHost(url);
  
  // CRITICAL FIX: Add AbortController for native timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'plan2fund-lite/1.0 (+https://plan2fund.local)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const rawHtmlPath = saveRaw ? saveRawHtml(html, url) : '';
    return {
      html,
      rawHtmlPath,
      status: res.status,
      etag: res.headers.get('etag') || undefined,
      lastModified: res.headers.get('last-modified') || undefined
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Fetch timeout after 30s');
    }
    throw error;
  }
}

