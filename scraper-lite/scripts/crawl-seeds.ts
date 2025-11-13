import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as cheerio from 'cheerio';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

interface SeedEntry {
  institution_id: string;
  institution_name: string;
  seed_url: string;
  funding_types?: string[];
  keywords?: string[];
  max_results?: number;
}

interface CatalogEntry {
  url: string;
  institution_id: string;
  institution_name: string;
  funding_types: string[];
  source: string;
  seed_url: string;
}

const DEFAULT_KEYWORDS = [
  'foerder',
  'förder',
  'programm',
  'programme',
  'grant',
  'fund',
  'support',
  'invest',
  'kredit',
  'loan',
  'förderung'
];

const BLOCKED_PATTERNS = [
  'mailto:',
  'javascript:',
  '#',
  'tel:'
];

const OUTPUT_FILE = path.resolve(process.cwd(), 'scraper-lite', 'url-catalog.generated.json');
const SEED_FILE = path.resolve(process.cwd(), 'scraper-lite', 'url-seeds.json');

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function normalizeUrl(baseUrl: string, href: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (BLOCKED_PATTERNS.some(pattern => trimmed.startsWith(pattern))) return null;

  try {
    const url = new URL(trimmed, baseUrl);
    if (!isHttpUrl(url.href)) return null;
    return url.href.split('#')[0];
  } catch {
    return null;
  }
}

function matchesKeywords(url: URL, keywords: string[]): boolean {
  const haystack = `${url.pathname.toLowerCase()} ${url.href.toLowerCase()}`;
  return keywords.some(keyword => haystack.includes(keyword));
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Plan2FundCrawler/1.0 (+https://plan2fund.com)'
      }
    });
    if (!response.ok) {
      console.warn(`⚠️  ${url} responded with HTTP ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error: any) {
    console.warn(`⚠️  Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

async function crawlSeed(seed: SeedEntry): Promise<CatalogEntry[]> {
  console.log(`🔍 Crawling seed: ${seed.seed_url}`);
  const html = await fetchHtml(seed.seed_url);
  if (!html) {
    console.warn(`   Skipping seed due to fetch failure.`);
    return [];
  }

  const keywords = (seed.keywords && seed.keywords.length > 0) ? seed.keywords : DEFAULT_KEYWORDS;
  const baseUrl = new URL(seed.seed_url);
  const $ = cheerio.load(html);
  const results: CatalogEntry[] = [];
  const seen = new Set<string>();
  const maxResults = seed.max_results ?? 50;

  $('a[href]').each((_, element) => {
    if (results.length >= maxResults) {
      return false; // break out of cheerio loop
    }

    const href = $(element).attr('href');
    const normalized = normalizeUrl(seed.seed_url, href || '');
    if (!normalized) {
      return;
    }

    try {
      const candidateUrl = new URL(normalized);
      if (candidateUrl.hostname !== baseUrl.hostname) {
        return; // stay on same host for now
      }
      if (!matchesKeywords(candidateUrl, keywords)) {
        return;
      }

      if (seen.has(candidateUrl.href)) {
        return;
      }

      seen.add(candidateUrl.href);
      results.push({
        url: candidateUrl.href,
        institution_id: seed.institution_id,
        institution_name: seed.institution_name,
        funding_types: seed.funding_types && seed.funding_types.length > 0 ? seed.funding_types : ['grant'],
        source: 'crawler',
        seed_url: seed.seed_url
      });
    } catch {
      // ignore invalid URLs
    }
  });

  console.log(`   → Discovered ${results.length} candidate URLs`);
  return results;
}

async function main() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error(`❌ Seed file not found at ${SEED_FILE}`);
    process.exit(1);
  }

  const rawSeeds = fs.readFileSync(SEED_FILE, 'utf8');
  const seeds: SeedEntry[] = JSON.parse(rawSeeds);

  if (!Array.isArray(seeds) || seeds.length === 0) {
    console.error('❌ Seed file is empty or invalid.');
    process.exit(1);
  }

  const catalogEntries: CatalogEntry[] = [];
  const globalSeen = new Set<string>();

  for (const seed of seeds) {
    const entries = await crawlSeed(seed);
    for (const entry of entries) {
      if (globalSeen.has(entry.url)) continue;
      globalSeen.add(entry.url);
      catalogEntries.push(entry);
    }
  }

  catalogEntries.sort((a, b) => a.url.localeCompare(b.url));

  const catalog = {
    urls: catalogEntries.map(entry => ({
      url: entry.url,
      institution_id: entry.institution_id,
      institution_name: entry.institution_name,
      funding_types: entry.funding_types,
      source: entry.source,
      seed_url: entry.seed_url
    })),
    stats: {
      total_urls: catalogEntries.length,
      generated_at: new Date().toISOString(),
      sources: ['crawler']
    }
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(`✅ Catalog generated with ${catalogEntries.length} URLs → ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Crawler failed:', error);
    process.exit(1);
  });
}
