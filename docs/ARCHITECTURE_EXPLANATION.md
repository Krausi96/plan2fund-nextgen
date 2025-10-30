# Architecture Explanation: How Everything Connects

## File Structure & Data Flow

### 1. Static Configuration: `institutionConfig.ts`
**Purpose**: Defines institutions and their metadata

**What it contains**:
- 32 institution definitions
- Seed URLs (starting points for discovery)
- Funding types per institution (grant, loan, equity, etc.)
- Keywords for discovery
- CSS selectors for scraping

**Example**:
```typescript
{
  name: 'FFG',
  programUrls: ['https://www.ffg.at/foerderungen'], // Seed URL
  fundingTypes: ['grant'],
  keywords: ['foerderung', 'research', 'innovation'],
  autoDiscovery: true
}
```

**How it's used**:
- Discovery reads this to know where to start
- Scraper uses this for funding types assignment

**Static vs Dynamic**: This file is STATIC (manual updates needed to add institutions). The URLs INSIDE it are just starting points - discovery finds the rest.

---

### 2. Dynamic Discovery: `webScraperService.ts` → `discoverRealProgramUrls()`

**Purpose**: Finds program URLs by exploring websites

**How it works**:
1. Starts from seed URLs in `institutionConfig.ts`
2. Explores category/listing pages (like `/foerderungen`)
3. Extracts program detail links from those pages
4. Explores deeper (up to depth 4) to find more programs
5. Filters category pages out → only detail pages to `unscrapedUrls`
6. Saves to `discovery-state.json`

**Dynamic behavior**:
- NOT continuous parsing - runs when you trigger it
- Explores incrementally (skips already-explored sections in incremental mode)
- Finds new programs added to websites on each run
- Self-updating: each run can find new URLs

**State saved to**: `discovery-state.json`

---

### 3. Discovery State: `data/discovery-state.json`

**Purpose**: Tracks what was discovered and what needs scraping

**Structure per institution**:
```json
{
  "FFG": {
    "knownUrls": [...],        // ALL URLs found (including categories for tracking)
    "unscrapedUrls": [...],    // ONLY detail pages that need scraping
    "exploredSections": [...]  // What seed URLs were explored, what depth
  }
}
```

**Dynamic behavior**:
- Updated by discovery runs
- Filtered: category pages removed from `unscrapedUrls` (line 461-470)
- Scraper reads `unscrapedUrls` from here
- Persists between runs

**Key point**: `unscrapedUrls` = ONLY scrapable detail pages (category pages excluded)

---

### 4. Scraping: `webScraperService.ts` → `scrapeAllPrograms()`

**Purpose**: Extracts program data from detail pages

**How it works**:
1. Loads `unscrapedUrls` from `discovery-state.json`
2. Processes 15 URLs per institution (cycle mode)
3. For each URL:
   - Checks if detail page (skips category/query URLs)
   - Validates page (program signals check)
   - Extracts 18 requirement categories
   - Extracts structured data (amounts, deadlines, contacts)
   - Assigns funding types from `institutionConfig.ts`
4. Saves to `scraped-programs-latest.json`

**Dynamic behavior**:
- Reads from discovery state (not from institutionConfig)
- Processes incrementally (batches)
- Change detection: skips URLs scraped < 24h ago
- Updates discovery state after scraping (marks URLs as scraped)

---

### 5. Output: `data/scraped-programs-latest.json`

**Purpose**: Final scraped program data

**Structure**:
```json
{
  "timestamp": "...",
  "totalPrograms": 80,
  "programs": [
    {
      "name": "...",
      "institution": "FFG",
      "funding_types": ["grant"], // From institutionConfig
      "type": "grant", // Detected from page
      "source_url": "...", // From discovery-state.json → unscrapedUrls
      "categorized_requirements": { ... }, // 18 categories extracted
      ...
    }
  ]
}
```

**Dynamic behavior**:
- Accumulates programs across runs
- Never overwrites (merges with existing)

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│  institutionConfig.ts (STATIC)      │
│  - 32 institutions                  │
│  - Seed URLs                       │
│  - Funding types                   │
└─────────────┬───────────────────────┘
              │
              ↓ (discovery reads)
┌─────────────────────────────────────┐
│  webScraperService.ts                │
│  discoverRealProgramUrls()          │
│  - Explores category pages          │
│  - Finds detail links               │
│  - Filters category pages           │
└─────────────┬───────────────────────┘
              │
              ↓ (saves to)
┌─────────────────────────────────────┐
│  discovery-state.json (DYNAMIC)     │
│  - knownUrls: all found             │
│  - unscrapedUrls: detail pages only │
│  - exploredSections: what explored  │
└─────────────┬───────────────────────┘
              │
              ↓ (scraper reads unscrapedUrls)
┌─────────────────────────────────────┐
│  webScraperService.ts                │
│  scrapeAllPrograms()                 │
│  - Loads unscrapedUrls               │
│  - Processes detail pages            │
│  - Extracts 18 categories            │
│  - Uses funding types from config    │
└─────────────┬───────────────────────┘
              │
              ↓ (saves to)
┌─────────────────────────────────────┐
│  scraped-programs-latest.json        │
│  - All scraped programs              │
│  - With 18 requirement categories   │
└─────────────────────────────────────┘
```

---

## Is It Continuously Parsing?

**NO - It's batch-based and on-demand**

**Current behavior**:
1. You run discovery → finds URLs → saves to state
2. You run scraper → processes URLs from state → saves programs
3. Next discovery run → finds NEW URLs → adds to state
4. Next scraper run → processes NEW unscraped URLs

**NOT continuous**:
- Doesn't automatically run in background
- Runs when you trigger it (manual or scheduled)
- Processes in batches (15 URLs per institution per cycle)
- Stops after batch completes

**To make it continuous**: You'd need to schedule it (cron job, GitHub Actions, etc.)

---

## How Dynamic Is It?

### Static Elements:
- `institutionConfig.ts`: Static (manual updates)
- Funding types defined in config: Static per institution

### Dynamic Elements:
- `discovery-state.json`: Updates with each discovery run
- `unscrapedUrls`: Grows as discovery finds new pages
- `scraped-programs-latest.json`: Grows as scraper processes pages
- URL discovery: Finds new programs automatically (doesn't need config updates for new programs)
- Change detection: Re-scrapes if >24h old

**Key point**: You don't need to update `institutionConfig.ts` for new programs - discovery finds them automatically from the seed URLs.

---

## Scalability to 2500+ Programs

### Current State:
- **394 scrapable detail pages** ready
- **80 programs scraped** (19% complete)
- **527 known URLs** total across all institutions

### To Reach 2500 Programs:

**Discovery Capacity**:
- Current: Found 435 pages in one run
- Can find 2500+ easily (just needs more discovery runs)
- No config changes needed - auto-discovery finds them

**Scraping Strategy**:
- Current: 15 URLs per institution per cycle = 480 URLs per cycle
- For 2500 programs: Need ~5-6 cycles (each 5-10 min = 30-60 min total)
- OR: Run full mode (50 URLs per institution) = ~3 cycles

**State Management**:
- `discovery-state.json` tracks progress per institution
- Never loses progress (state persists)
- Can resume anytime

**Complexity**:
- Current code: ~2100 lines (does discovery + scraping)
- For 2500 programs: Same code works, just more cycles
- No complexity increase needed

---

## Gaps & Recommendations

### ✅ What's Working:
1. Discovery finds detail pages (100% scrapable now)
2. Filters category pages correctly
3. State-based tracking (never loses progress)
4. Incremental processing (fast cycles)

### ⚠️ Potential Issues at Scale:
1. **State file size**: `discovery-state.json` could get large (currently ~500 URLs, manageable)
2. **Scraped file size**: `scraped-programs-latest.json` with 2500 programs = large file
3. **No rate limiting**: Could hit rate limits on some sites
4. **Error handling**: Some institutions have broken URLs (ERR_NAME_NOT_RESOLVED)

### 🔧 Recommendations for 2500+ Programs:

1. **Database instead of JSON**:
   - Current: JSON files (good for <1000 programs)
   - At scale: Use SQLite or PostgreSQL
   - Benefits: Faster queries, better indexing, easier updates

2. **Parallel scraping** (already partially implemented):
   - Current: Sequential (one institution at a time)
   - Could: Parallel batches of institutions
   - Benefit: 3-4x faster

3. **Caching**:
   - Cache page content hashes
   - Skip re-scraping if content unchanged
   - Benefit: Faster, less load on target sites

4. **Queue system**:
   - Use job queue (Bull, BullMQ) for scraping
   - Retry failed URLs automatically
   - Benefit: More reliable, handles failures better

5. **Monitoring**:
   - Track success rates per institution
   - Alert on high error rates
   - Track discovery vs scraping gaps

---

## Summary: How Everything Links

1. **institutionConfig.ts** → Static config (institutions, seed URLs, funding types)
2. **Discovery** → Dynamic URL finding (explores sites, finds programs)
3. **discovery-state.json** → Dynamic state (what's found, what needs scraping)
4. **Scraper** → Reads state, scrapes detail pages
5. **scraped-programs-latest.json** → Final output

**NOT continuous**: Batch-based, on-demand
**IS dynamic**: Finds new programs automatically, state updates incrementally
**Scalable**: Current architecture handles 2500+ with same code, just more cycles


