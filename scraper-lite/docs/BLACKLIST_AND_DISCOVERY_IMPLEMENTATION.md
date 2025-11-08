# Blacklist & Discovery Implementation Plan

## 2. Blacklisting - Using Existing `url_patterns` Table

### Current System Analysis

**Existing `url_patterns` table** (from schema):
- `host` - Domain name
- `pattern_type` - 'include' or 'exclude' (but currently only stores 'include')
- `pattern` - URL path pattern (e.g., `/program/:id`)
- `learned_from_url` - Source URL
- `confidence` - 0-1 score
- `usage_count` - How many times used
- `success_rate` - Success percentage

**Current Usage**:
- ✅ Stores **include** patterns (learned from successful scrapes)
- ❌ Does NOT store **exclude** patterns (blacklist)
- ❌ Hardcoded exclusions in `utils.ts` and `institutionConfig.ts`

### Why Database-Backed Blacklist is Better

**Advantages**:
1. **Dynamic Updates**: Add/remove blacklist without code changes
2. **Learning from Mistakes**: Auto-learn exclusions from failed scrapes
3. **Centralized**: All patterns in one place
4. **Queryable**: Can analyze what's being excluded
5. **Version Control**: Track when patterns were added/removed
6. **Institution-Specific**: Different exclusions per host

**Current Hardcoded Problems**:
- ❌ Scattered across multiple files
- ❌ Requires code deployment to update
- ❌ No learning from failed scrapes
- ❌ Hard to maintain

### Implementation Plan

#### Step 1: Use `url_patterns` for Exclusions

**Current**: Only stores `pattern_type = 'include'`
**Change**: Also store `pattern_type = 'exclude'` for blacklist

**Migration**:
1. Keep hardcoded patterns as **fallback** (for common exclusions)
2. Add database exclusions as **primary** (for specific URLs/patterns)
3. Check database first, then fallback to hardcoded

#### Step 2: Auto-Learn Exclusions

**When to add exclusion**:
- URL returns 404
- URL requires login (detected)
- URL has 0 requirements extracted
- URL is marked as "not a program page" by LLM
- URL matches known bad patterns (email-protection, etc.)

**Implementation**:
```typescript
// In unified-scraper.ts after failed scrape
if (result.status === 404 || requiresLogin || reqCount === 0) {
  await learnUrlPatternFromPage(url, host, false); // false = exclusion
}
```

#### Step 3: Check Database Exclusions During Discovery

**Add function**:
```typescript
async function isUrlExcluded(url: string): Promise<boolean> {
  const pool = getPool();
  const urlObj = new URL(url);
  const host = urlObj.hostname.replace('www.', '');
  const path = urlObj.pathname;
  
  // Check database exclusions
  const excludePatterns = await pool.query(`
    SELECT pattern FROM url_patterns
    WHERE host = $1 AND pattern_type = 'exclude'
    ORDER BY confidence DESC
  `, [host]);
  
  for (const row of excludePatterns.rows) {
    const regex = new RegExp(row.pattern.replace(':id', '\\d+'));
    if (regex.test(path)) {
      return true; // Excluded!
    }
  }
  
  // Fallback to hardcoded patterns (keep for common exclusions)
  return checkHardcodedExclusions(url);
}
```

#### Step 4: Manual Blacklist Management

**Script**: `scraper-lite/test/manage-blacklist.ts`
- Add exclusion: `npm run blacklist:add -- --url="pattern" --host="example.com"`
- Remove exclusion: `npm run blacklist:remove -- --pattern="pattern" --host="example.com"`
- List exclusions: `npm run blacklist:list`
- Clear low-confidence: `npm run blacklist:clean`

### What About Blacklisted Pages That Actually Have Data?

**Problem**: What if we blacklist a URL, but it later has valid data?

**Solution**: **Re-scrape Check System**

1. **Periodic Re-Check** (e.g., every 30 days):
   ```typescript
   // Re-check blacklisted URLs that are older than 30 days
   const blacklistedToRecheck = await pool.query(`
     SELECT url FROM pages
     WHERE metadata_json->>'is_blacklisted' = 'true'
     AND fetched_at < NOW() - INTERVAL '30 days'
   `);
   ```

2. **Manual Override**:
   - Script to remove from blacklist: `npm run blacklist:remove -- --url="exact-url"`
   - Re-scrape: `npm run scraper:unified -- scrape --url="exact-url" --force-update`

3. **Confidence-Based**:
   - Low confidence exclusions (< 0.5) re-checked more often
   - High confidence exclusions (> 0.9) re-checked less often

4. **Feedback Loop**:
   - If blacklisted URL successfully scrapes → remove from blacklist
   - If excluded pattern matches good URL → lower confidence or remove

---

## 3. Discovery Improvements

### Better Logging

**Current**: Unclear why seeds are processed
**Change**: Show explicit reason for each seed

**Implementation**:
```typescript
// In unified-scraper.ts discoverPrograms()
for (const seed of seedsToProcess) {
  let reason = '';
  if (overviewUrlsToRecheck.has(seed)) {
    const lastChecked = overviewPages.rows.find(r => r.url === seed)?.fetched_at;
    reason = `🔄 Re-checking overview page (last: ${lastChecked})`;
  } else if (!existingSeeds.has(seed)) {
    reason = `✅ New seed URL`;
  } else {
    reason = `⚠️  Already in DB but processing anyway`;
  }
  
  console.log(`📄 [${index}/${total}] ${seed.substring(0, 60)}...`);
  console.log(`   ${reason}\n`);
}
```

### Separate Overview Re-Check

**Current**: Mixed with new seed discovery
**Change**: Separate command/phase

**Implementation**:
```typescript
// Option 1: Separate function
async function recheckOverviewPages(): Promise<number> {
  const pool = getPool();
  const overviewPages = await pool.query(`
    SELECT url, fetched_at 
    FROM pages 
    WHERE metadata_json->>'is_overview_page' = 'true'
    AND (fetched_at IS NULL OR fetched_at < NOW() - INTERVAL '7 days')
    ORDER BY fetched_at ASC
    LIMIT $1
  `, [CONFIG.MAX_DISCOVERY]);
  
  // Process only overview pages
  // ...
}

// Option 2: Separate command
// npm run scraper:unified -- recheck-overviews
// npm run scraper:unified -- discover (only new seeds)
// npm run scraper:unified -- full (both)
```

**Recommended**: **Option 1** - Keep in same function but separate phase

```typescript
async function discoverPrograms(): Promise<number> {
  // Phase 1: New seeds only
  const newSeeds = seeds.filter(s => !existingSeeds.has(s));
  // Process new seeds...
  
  // Phase 2: Overview re-check (separate, clear logging)
  if (overviewUrlsToRecheck.size > 0) {
    console.log(`\n🔄 Phase 2: Re-checking ${overviewUrlsToRecheck.size} overview pages...\n`);
    // Process overview pages...
  }
}
```

---

## 1. Adding Industry-Specific Seed URLs

### What to Add

**Current**: Generic government/institutional funding
**Add**: Industry-specific programs

### Examples

#### Tech/IT Industry
```typescript
{
  name: 'Austrian Research Promotion Agency - Digital Innovation',
  baseUrl: 'https://www.ffg.at',
  programUrls: [
    'https://www.ffg.at/en/programme/digital-innovation',
    'https://www.ffg.at/en/programme/ict',
    'https://www.ffg.at/en/programme/ai-funding',
  ],
  fundingTypes: ['grant'],
  programFocus: ['technology', 'digital', 'innovation', 'ai'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['digital', 'ICT', 'AI', 'software', 'tech', 'innovation']
}
```

#### Manufacturing/Industry 4.0
```typescript
{
  name: 'AWS - Industry 4.0 Funding',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-digitalization/industry-4.0/',
    'https://www.aws.at/en/aws-digitalization/automation/',
  ],
  fundingTypes: ['grant', 'loan'],
  programFocus: ['manufacturing', 'automation', 'industry'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['industry 4.0', 'manufacturing', 'automation', 'production']
}
```

#### Green/Energy
```typescript
{
  name: 'Klima- und Energiefonds - Green Tech',
  baseUrl: 'https://www.klimafonds.gv.at',
  programUrls: [
    'https://www.klimafonds.gv.at/foerderung/green-tech/',
    'https://www.klimafonds.gv.at/foerderung/renewable-energy/',
  ],
  fundingTypes: ['grant'],
  programFocus: ['sustainability', 'energy', 'climate'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['green tech', 'renewable', 'climate', 'energy', 'sustainability']
}
```

#### Healthcare/Biotech
```typescript
{
  name: 'FFG - Health Research',
  baseUrl: 'https://www.ffg.at',
  programUrls: [
    'https://www.ffg.at/en/programme/health-research',
    'https://www.ffg.at/en/programme/biotech',
  ],
  fundingTypes: ['grant'],
  programFocus: ['healthcare', 'research', 'biotech'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['health', 'biotech', 'medical', 'pharma', 'research']
}
```

#### Tourism
```typescript
{
  name: 'ÖHT - Tourism Innovation',
  baseUrl: 'https://www.oeht.at',
  programUrls: [
    'https://www.oeht.at/produkte/tourism-innovation/',
    'https://www.oeht.at/produkte/digital-tourism/',
  ],
  fundingTypes: ['loan', 'grant'],
  programFocus: ['tourism', 'hospitality'],
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['tourism', 'hospitality', 'hotel', 'travel']
}
```

### How to Add

1. **Identify Industry-Specific Programs**:
   - Research funding institutions
   - Find industry-specific funding pages
   - Check for program listings

2. **Add to `institutionConfig.ts`**:
   - Either add to existing institution (if same baseUrl)
   - Or create new institution entry (if different organization)

3. **Set Appropriate Metadata**:
   - `fundingTypes`: What type of funding (grant, loan, equity)
   - `programFocus`: Industry/category (tech, manufacturing, green, healthcare, tourism)
   - `keywords`: Industry-specific terms for discovery

4. **Test**:
   - Run discovery: `npm run scraper:unified -- discover --max=10`
   - Check if new URLs are found
   - Verify they're correctly categorized

---

## Implementation Priority

### High Priority (Do First)
1. ✅ **Better Logging** - Quick win, immediate clarity
2. ✅ **Use `url_patterns` for Exclusions** - Leverage existing table
3. ✅ **Separate Overview Re-Check** - Fix AWS appearing issue

### Medium Priority
4. ✅ **Auto-Learn Exclusions** - Improve over time
5. ✅ **Re-Check Blacklisted URLs** - Handle false positives

### Low Priority (Nice to Have)
6. ✅ **Industry-Specific Seeds** - Expand coverage gradually
7. ✅ **Blacklist Management Script** - Manual control

---

## Summary

### Blacklisting
- ✅ Use existing `url_patterns` table with `pattern_type = 'exclude'`
- ✅ Keep hardcoded patterns as fallback
- ✅ Auto-learn exclusions from failed scrapes
- ✅ Re-check blacklisted URLs periodically (30 days)
- ✅ Manual override for false positives

### Discovery
- ✅ Better logging: Show why each seed is processed
- ✅ Separate overview re-check phase (don't mix with new seeds)
- ✅ Clear distinction: "New seed" vs "Re-checking overview"

### Industry Seeds
- ✅ Add industry-specific institutions/programs
- ✅ Focus on: Tech, Manufacturing, Green, Healthcare, Tourism
- ✅ Set appropriate `programFocus` and `keywords`

