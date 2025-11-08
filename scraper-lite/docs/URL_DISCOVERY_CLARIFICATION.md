# URL Discovery System - Clarification

## 1. How to Add New Seed URLs

### Current System

**Location**: `scraper-lite/src/institutionConfig.ts`

**How it works**:
- Each institution has a `programUrls` array (seed URLs)
- Only institutions with `autoDiscovery: true` are used
- `getAllSeedUrls()` in `config.ts` collects all seed URLs

**Current Coverage**:
- ✅ **Austria**: AWS, FFG, VBA, SFG, AMS, WKO, regional institutions
- ✅ **EU**: Horizon Europe, EIC, EIB, EIF, ERDF, ESF
- ✅ **Germany**: BMWK, KfW
- ✅ **France**: Bpifrance
- ✅ **Spain**: CDTI, ENISA
- ✅ **Italy**: Invitalia, CDP
- ✅ **Netherlands**: RVO, Invest-NL
- ⚠️ **Limited**: Mostly government/institutional, not industry-specific

### Adding New Seed URLs

**Option 1: Add to Existing Institution**
```typescript
{
  name: 'Austria Wirtschaftsservice (AWS)',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-digitalisierung/ai-unternehmen-wachstum/ai-adoption/',
    // ADD NEW URL HERE
    'https://www.aws.at/en/new-program/',
  ],
  autoDiscovery: true,
}
```

**Option 2: Create New Institution**
```typescript
{
  name: 'Industry-Specific Institution',
  baseUrl: 'https://example.com',
  programUrls: [
    'https://example.com/funding/tech',
    'https://example.com/funding/manufacturing',
  ],
  fundingTypes: ['grant', 'loan'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['tech', 'manufacturing', 'industry']
}
```

### Recommendations

**Should you expand beyond AT/EU?**
- ✅ **Yes, but strategically**:
  - Start with **industry-specific** Austrian institutions
  - Then expand to **neighboring countries** (Switzerland, Czech Republic, Slovakia)
  - Then **major EU markets** (already have some)
  - Finally **international** (US, UK, etc.)

**Should you go deeper into industries/branches?**
- ✅ **Yes, definitely!** Current system is too generic
- **Examples**:
  - **Tech/IT**: Specific tech funding programs
  - **Manufacturing**: Industry 4.0, automation funding
  - **Green/Energy**: Climate, renewable energy programs
  - **Healthcare**: Medical innovation, biotech funding
  - **Tourism**: Tourism-specific funding (already have ÖHT)

**How to add industry-specific seeds**:
1. Identify industry-specific funding institutions
2. Add them as new institutions in `institutionConfig.ts`
3. Set appropriate `fundingTypes` and `programFocus`
4. Add industry-specific `keywords`

---

## 2. How Blacklisting Works

### Current Blacklisting System

**There are MULTIPLE layers of blacklisting**:

#### Layer 1: Hardcoded Exclusion Patterns
**Location**: `scraper-lite/src/institutionConfig.ts` (line 1498-1556)
```typescript
exclusionKeywords: [
  'newsletter', 'news', 'press', 'contact', 'about',
  'housing', 'real estate', 'agriculture', 'forestry',
  'infrastructure', 'construction', 'private consumer',
  // ... many more
]
```

#### Layer 2: URL Pattern Exclusions
**Location**: `scraper-lite/src/utils.ts` (line 244-256)
```typescript
const exclusionPatterns = [
  /wohnbau|wohnung|wohnbauförderung/i,
  /housing|real.estate|immobilie/i,
  /landwirtschaft|forstwirtschaft|agriculture/i,
  // ... more patterns
];
```

#### Layer 3: Institution-Specific Patterns
**Location**: `scraper-lite/src/utils.ts` (line 227-515)
- FFG-specific exclusions
- AWS-specific exclusions
- Learned patterns from `url-patterns.json` (if exists)

#### Layer 4: LLM Classification
**Location**: `scraper-lite/src/llm-discovery.ts`
- LLM classifies URLs as program pages or not
- Uses exclusion patterns in prompt

### Problems with Current System

❌ **No Dynamic Blacklist**:
- All exclusions are hardcoded
- No way to update blacklist from database
- No learning from mistakes

❌ **No Centralized Blacklist**:
- Patterns scattered across multiple files
- Hard to maintain
- Inconsistent

❌ **No Blacklist Updates**:
- Can't add new exclusions without code changes
- No feedback loop from failed scrapes

### Recommendations

**Option 1: Database-Backed Blacklist** (Recommended)
- Create `blacklisted_urls` table
- Store URL patterns or exact URLs
- Update via admin interface or script
- Check during discovery

**Option 2: Pattern Learning** (Already partially implemented)
- Learn from failed scrapes
- Store in `url_patterns` table (already exists!)
- Auto-update exclusion patterns

**Option 3: Hybrid Approach**
- Keep hardcoded patterns for common exclusions
- Add database blacklist for specific URLs
- Use pattern learning for new patterns

---

## 3. Discovery Cycle - Are We Really Skipping Seen URLs?

### Current Logic

**Discovery Flow** (`unified-scraper.ts`):

1. **Get All Seeds** (line 128):
   ```typescript
   const seeds = getAllSeedUrls();
   ```

2. **Check Against Database** (line 132-136):
   ```typescript
   const seedCheck = await pool.query(
     `SELECT url FROM pages WHERE url = ANY($1::text[])`,
     [seeds]
   );
   const existingSeeds = new Set(seedCheck.rows.map((r: any) => r.url));
   ```

3. **Filter Seeds** (line 149-151):
   ```typescript
   const seedsToCheck = seeds.filter(s => 
     !existingSeeds.has(s) || overviewUrlsToRecheck.has(s)
   );
   ```
   - ✅ Skips if already in `pages` table
   - ⚠️ **BUT**: Re-checks if it's an overview page (older than 7 days)

4. **Re-Check Overview Pages** (line 138-147):
   ```typescript
   const overviewPages = await pool.query(`
     SELECT url, fetched_at 
     FROM pages 
     WHERE url = ANY($1::text[])
       AND metadata_json->>'is_overview_page' = 'true'
       AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
   `, [seeds]);
   ```
   - ⚠️ **This is why AWS keeps appearing!**

5. **Process Seeds** (line 189-194):
   ```typescript
   for (const seed of seedsToProcess.slice(0, CONFIG.MAX_DISCOVERY)) {
     if (seen.has(seed)) continue; // Skip if already seen in this run
     seen.add(seed);
   ```

### Why AWS Keeps Appearing

**Root Cause**: AWS seed URLs are likely **overview pages** that get re-checked every 7 days!

**Example**:
- `https://www.aws.at/en/aws-digitalization/` → Overview page
- Gets marked as `is_overview_page: true` in database
- After 7 days, it's re-checked for new programs
- This is **intentional** (to find new programs), but **confusing**!

**Solutions**:

1. **Better Logging**:
   - Show WHY a seed is being processed
   - "Re-checking overview page (7 days old)"
   - vs "New seed URL"

2. **Separate Overview Re-Check**:
   - Don't mix overview re-checks with new seeds
   - Run overview re-check separately

3. **Smarter Overview Detection**:
   - Don't mark seed URLs as overview pages
   - Only mark discovered pages as overview pages

4. **Configurable Re-Check Interval**:
   - Make 7 days configurable
   - Or disable overview re-check for seed URLs

### Current Issues

❌ **Confusing Behavior**:
- Seeds appear to be "rediscovered" every 7 days
- No clear indication why

❌ **Inefficient**:
- Re-checking same overview pages repeatedly
- Wasting time on pages with no new programs

❌ **No Distinction**:
- Can't tell if seed is new or re-check

### Recommendations

**Option 1: Disable Overview Re-Check for Seeds** (Simplest)
```typescript
// Only re-check discovered overview pages, not seed URLs
const overviewPages = await pool.query(`
  SELECT url, fetched_at 
  FROM pages 
  WHERE url NOT = ANY($1::text[]) -- Exclude seeds!
    AND metadata_json->>'is_overview_page' = 'true'
    AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
`);
```

**Option 2: Better Logging** (Quick Fix)
```typescript
if (overviewUrlsToRecheck.has(seed)) {
  console.log(`   🔄 Re-checking overview page (last checked: ${lastChecked})`);
} else if (existingSeeds.has(seed)) {
  console.log(`   ⏭️  Already in DB, skipping`);
} else {
  console.log(`   ✅ New seed URL`);
}
```

**Option 3: Separate Commands** (Best)
- `npm run scraper:unified -- discover` - Only new seeds
- `npm run scraper:unified -- recheck-overviews` - Only overview pages
- `npm run scraper:unified -- full` - Both

---

## Summary

### 1. Adding Seed URLs
- ✅ Add to `institutionConfig.ts`
- ✅ Expand to industry-specific institutions
- ✅ Go deeper into branches/industries
- ✅ Keep AT/EU focus but add more granularity

### 2. Blacklisting
- ❌ Currently hardcoded, scattered
- ✅ Should use database-backed blacklist
- ✅ Should learn from failed scrapes
- ✅ Should be centralized and updatable

### 3. Discovery Cycle
- ✅ Does skip seen URLs (if in `pages` table)
- ⚠️ BUT re-checks overview pages every 7 days
- ⚠️ This is why AWS keeps appearing!
- ✅ Should improve logging and separate overview re-check

---

## Next Steps

1. **Improve Logging**: Show why seeds are processed
2. **Separate Overview Re-Check**: Don't mix with new seeds
3. **Database Blacklist**: Create `blacklisted_urls` table
4. **Industry Seeds**: Add more industry-specific institutions
5. **Better Documentation**: Explain overview re-check behavior

