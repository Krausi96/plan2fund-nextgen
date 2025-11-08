# Detailed Recommendations - What & Why

## 1. Adding New Seed URLs - Industry-Specific & More Regions

### Current Problem
- **Only AT/EU**: 9 institutions, all Austrian
- **General URLs**: Institutions have broad URLs, not industry-specific
- **No Industry Granularity**: Can't discover tech vs manufacturing vs green energy programs separately
- **Missing Regions**: No Germany, Switzerland, EU-wide programs

### What I Would Do

#### A. Add Industry-Specific Institutions
```typescript
// Example: Tech-specific AWS programs
{
  id: 'institution_aws_tech',
  name: 'AWS - Technology & Digitalization',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-digitalisierung/ai-unternehmen-wachstum/',
    'https://www.aws.at/en/aws-digitalization/ai-start/',
    'https://www.aws.at/en/aws-digitalisierung/',
  ],
  fundingTypes: ['grant', 'equity'],
  region: 'Austria',
  programFocus: ['technology', 'AI', 'digitalization', 'software'], // NEW: Industry tags
  keywords: ['AI', 'digitalization', 'software', 'tech', 'startup']
}

// Example: Green/Energy-specific
{
  id: 'institution_aws_green',
  name: 'AWS - Green Energy & Sustainability',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-green-energy/...', // If exists
  ],
  fundingTypes: ['grant', 'subsidy'],
  region: 'Austria',
  programFocus: ['green_energy', 'sustainability', 'renewable', 'climate'], // NEW
  keywords: ['green', 'energy', 'sustainability', 'renewable', 'climate']
}
```

#### B. Expand to More Regions
```typescript
// Germany
{
  id: 'institution_kfw',
  name: 'KfW Bankengruppe',
  baseUrl: 'https://www.kfw.de',
  programUrls: [
    'https://www.kfw.de/...',
  ],
  fundingTypes: ['loan', 'grant', 'guarantee'],
  region: 'Germany',
  programFocus: ['SME', 'startup', 'innovation']
}

// Switzerland
{
  id: 'institution_innosuisse',
  name: 'Innosuisse',
  baseUrl: 'https://www.innosuisse.ch',
  programUrls: [...],
  fundingTypes: ['grant'],
  region: 'Switzerland',
  programFocus: ['innovation', 'research']
}

// EU-wide
{
  id: 'institution_horizon',
  name: 'Horizon Europe',
  baseUrl: 'https://ec.europa.eu',
  programUrls: [...],
  fundingTypes: ['grant'],
  region: 'EU',
  programFocus: ['research', 'innovation', 'climate']
}
```

#### C. Use `programFocus` for Smart Discovery
```typescript
// In unified-scraper.ts discovery phase
const existingIndustries = await pool.query(`
  SELECT DISTINCT program_focus
  FROM pages
  WHERE program_focus IS NOT NULL
`);

// Prioritize institutions with missing industries
const missingIndustries = ['technology', 'green_energy', 'healthcare', 'tourism'];
const seedsToPrioritize = seeds.filter(seed => {
  const inst = findInstitutionByUrl(seed);
  return inst?.programFocus?.some(focus => missingIndustries.includes(focus));
});
```

### Why This Approach?

1. **Better Coverage**: Industry-specific institutions ensure we don't miss specialized programs
2. **Granular Discovery**: Can target specific industries when data shows gaps
3. **Scalable**: Easy to add new industries without touching existing config
4. **Meta Parsing Ready**: `programFocus` field already exists in database, just needs to be used
5. **Smart Prioritization**: Discovery can focus on missing industries automatically

### Implementation Steps

1. **Add 5-10 industry-specific institutions** (tech, green, healthcare, tourism, manufacturing)
2. **Add 3-5 new regions** (Germany, Switzerland, EU-wide)
3. **Update discovery logic** to use `programFocus` for prioritization
4. **Extract industry metadata** from pages during scraping (LLM can categorize)

---

## 2. Blacklisting - Better Management & Learning

### Current Problem
- **No UI**: Can't see/edit patterns easily
- **Hardcoded Patterns**: Need code changes to update
- **No Pattern Review**: Can't see which patterns are working well

### What I Would Do

#### A. Make Hardcoded Patterns Configurable
```typescript
// Move to database or config file
// scraper-lite/src/config/blacklist-patterns.json
{
  "hardcoded_exclusions": [
    { "pattern": "/karriere/", "reason": "Career pages", "priority": "high" },
    { "pattern": "/contact/", "reason": "Contact pages", "priority": "high" },
    // ... more patterns
  ]
}

// Or store in database
CREATE TABLE blacklist_patterns (
  id SERIAL PRIMARY KEY,
  pattern TEXT NOT NULL,
  pattern_type VARCHAR(20) DEFAULT 'hardcoded',
  reason TEXT,
  priority VARCHAR(10) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### B. Add Blacklist Management Functions
```typescript
// scraper-lite/src/utils/blacklist.ts

// View all patterns (database + hardcoded)
export async function getAllBlacklistPatterns(): Promise<Array<{
  source: 'database' | 'hardcoded',
  pattern: string,
  confidence?: number,
  usage_count?: number,
  reason?: string
}>> {
  const dbPatterns = await pool.query(`
    SELECT pattern, confidence, usage_count
    FROM url_patterns
    WHERE pattern_type = 'exclude'
    ORDER BY confidence DESC
  `);
  
  const hardcoded = getHardcodedPatterns(); // From config
  
  return [
    ...dbPatterns.rows.map(r => ({ source: 'database', ...r })),
    ...hardcoded.map(p => ({ source: 'hardcoded', ...p }))
  ];
}

// Edit pattern confidence
export async function updatePatternConfidence(
  pattern: string,
  newConfidence: number
): Promise<void> {
  await pool.query(`
    UPDATE url_patterns
    SET confidence = $1
    WHERE pattern = $2
  `, [newConfidence, pattern]);
}

// Add manual exclusion
export async function addManualExclusion(
  pattern: string,
  reason: string
): Promise<void> {
  await pool.query(`
    INSERT INTO url_patterns (pattern, pattern_type, confidence, learned_from_url)
    VALUES ($1, 'exclude', 0.9, 'manual')
  `, [pattern]);
}
```

#### C. Improve Pattern Learning
```typescript
// Learn from classification feedback, not just failed scrapes
export async function learnFromFeedback(): Promise<void> {
  // Get false positives (classified as program but weren't)
  const falsePositives = await pool.query(`
    SELECT url
    FROM classification_feedback
    WHERE predicted_is_program IN ('yes', 'maybe')
      AND actual_is_program = false
    LIMIT 50
  `);
  
  // Learn exclusion patterns from false positives
  for (const row of falsePositives.rows) {
    await learnUrlPatternFromPage(row.url, host, false);
  }
}
```

### Why This Approach?

1. **Flexibility**: Can update patterns without code changes
2. **Transparency**: See all patterns and their effectiveness
3. **Better Learning**: Learn from classification feedback, not just failures
4. **Manual Override**: Can manually add/remove patterns when needed
5. **Confidence Management**: Can adjust confidence scores based on results

### Implementation Steps

1. **Move hardcoded patterns to database** (one-time migration)
2. **Add management functions** (view, edit, add, remove)
3. **Add CLI commands** (`blacklist:view`, `blacklist:edit`, etc.)
4. **Integrate feedback learning** (learn from false positives)

---

## 3. Discovery Cycle - Better Logging & Skip Logic

### Current Problem
- **Unclear Why**: Can't tell why a seed is being processed
- **AWS Every Time**: Overview pages re-checked, but not clear in logs
- **Mixed Phases**: Overview re-check mixed with new seed discovery

### What I Would Do

#### A. Separate Overview Re-Check Phase
```typescript
async function discoverPrograms(): Promise<number> {
  // PHASE 1: New Seed Discovery
  console.log('📋 Phase 1: Processing NEW seed URLs\n');
  const newSeeds = seeds.filter(s => !existingSeeds.has(s));
  // ... process new seeds
  
  // PHASE 2: Overview Page Re-Check (separate, clear)
  console.log('\n🔄 Phase 2: Re-checking overview pages (7+ days old)\n');
  const overviewSeeds = seeds.filter(s => overviewUrlsToRecheck.has(s));
  // ... process overview pages
  
  // Clear separation, different logging
}
```

#### B. Better Logging with Reasons
```typescript
// Enhanced logging
console.log(`📄 [${index}/${total}] ${url.substring(0, 60)}...`);
console.log(`   Reason: ${getProcessingReason(url, existingSeeds, overviewUrlsToRecheck)}`);

function getProcessingReason(
  url: string,
  existingSeeds: Set<string>,
  overviewUrlsToRecheck: Set<string>
): string {
  if (overviewUrlsToRecheck.has(url)) {
    const lastChecked = getLastChecked(url);
    return `🔄 Overview page re-check (last: ${lastChecked}, age: ${getAge(lastChecked)} days)`;
  }
  if (!existingSeeds.has(url)) {
    return `✅ New seed URL (not in database)`;
  }
  if (CONFIG.FORCE_UPDATE) {
    return `🔄 Force update enabled`;
  }
  return `⏭️  Skipped (already in database)`;
}
```

#### C. Improve Skip Logic
```typescript
// Clear skip conditions
const shouldSkip = 
  existingSeeds.has(seed) &&           // Already in DB
  !overviewUrlsToRecheck.has(seed) &&   // Not an overview page
  !CONFIG.FORCE_UPDATE;                 // Not forcing update

if (shouldSkip) {
  console.log(`   ⏭️  Skipped: Already in database (not overview, not force update)`);
  continue;
}
```

### Why This Approach?

1. **Clarity**: Immediately see why each URL is processed
2. **Debugging**: Easy to understand why AWS appears every time
3. **Separation**: Overview re-check is distinct from new discovery
4. **Transparency**: Users understand what's happening
5. **Better Control**: Can see what's being skipped and why

### Implementation Steps

1. **Separate phases** in discovery function
2. **Add reason logging** for each URL
3. **Improve skip logic** with clear conditions
4. **Add age tracking** for overview pages

---

## 4. Overview Pages - Integrate Filter Exploration

### Current Problem
- **Code Exists**: `extractFilterUrls()` in `overview-filters.ts`
- **Not Called**: Never used during discovery
- **FFG Filters**: FFG has filter pages that aren't explored
- **Missing Programs**: Programs hidden behind filters aren't discovered

### What I Would Do

#### A. Integrate Filter Exploration
```typescript
// In unified-scraper.ts, when overview page detected
if (isOverview) {
  console.log(`   📋 Overview page detected - extracting all program links...`);
  
  // NEW: Extract filter URLs
  const { extractFilterUrls } = await import('./src/utils/overview-filters');
  const filterUrls = extractFilterUrls(result.html, seed, 10); // Max 10 filter combinations
  
  if (filterUrls.length > 0) {
    console.log(`   🔍 Found ${filterUrls.length} filter combinations to explore...`);
    
    // Classify filter URLs
    const filterClassifications = await batchClassifyUrls(
      filterUrls.map(url => ({ url })),
      improvedPrompt
    );
    
    // Queue high-quality filter URLs
    for (const classification of filterClassifications) {
      if (classification.isProgramPage !== 'no' && classification.qualityScore >= 50) {
        discovered.push(classification.url);
        await markUrlQueued(classification.url, classification.qualityScore);
      }
    }
    
    console.log(`   ✅ Queued ${filterClassifications.filter(c => c.isProgramPage !== 'no').length} filter URLs`);
  }
  
  // Continue with regular link extraction...
}
```

#### B. Smart Filter Strategy
```typescript
// Improve filter combination strategy
export function generateFilterCombinations(
  filters: Record<string, FilterOption[]>,
  maxCombinations: number = 10
): Record<string, string[]>[] {
  // Strategy 1: Single filters (one at a time)
  // Strategy 2: Important pairs (funding_type + region)
  // Strategy 3: Avoid explosion (limit combinations)
  
  const combinations: Record<string, string[]>[] = [];
  
  // Priority: funding_type, region, program_focus
  const priorityFilters = ['funding_type', 'region', 'program_focus'];
  
  // First: Try priority filters individually
  for (const filterName of priorityFilters) {
    if (filters[filterName] && combinations.length < maxCombinations) {
      filters[filterName].slice(0, 3).forEach(option => {
        combinations.push({ [filterName]: [option.value] });
      });
    }
  }
  
  // Then: Try pairs of priority filters
  // ... (avoid too many combinations)
  
  return combinations;
}
```

#### C. Track Explored Filters
```typescript
// Store explored filter combinations to avoid re-exploring
await pool.query(`
  INSERT INTO explored_filters (url, filter_params, explored_at)
  VALUES ($1, $2, NOW())
  ON CONFLICT (url, filter_params) DO NOTHING
`, [baseUrl, JSON.stringify(filterParams)]);
```

### Why This Approach?

1. **Discover Hidden Programs**: FFG filter pages have programs we're missing
2. **Leverage Existing Code**: Filter exploration code already exists, just needs integration
3. **Smart Strategy**: Prioritize important filters (funding_type, region) to avoid explosion
4. **Track Progress**: Know which filters have been explored
5. **Incremental**: Can start with 10 filter URLs, expand later

### Implementation Steps

1. **Import and call `extractFilterUrls()`** when overview page detected
2. **Classify filter URLs** with LLM
3. **Queue high-quality filter URLs** for scraping
4. **Track explored filters** in database
5. **Test with FFG** filter pages first

---

## 5. Re-Scraping - Keep Unified (Already Good!)

### Current State
- **Already Unified**: Both overview and blacklist in `unified-rescraping.ts`
- **Integrated**: Called automatically after scraping phase
- **Priority-Based**: Overview (priority 8) > Blacklist (priority 5)

### What I Would Do

#### A. Keep Current Structure (It's Good!)
```typescript
// Current structure is already optimal:
export async function getReScrapeTasks() {
  // 1. Overview pages (60% of tasks, priority 8)
  // 2. Blacklisted URLs (30% of tasks, priority 5)
  // 3. Manual flags (10%, priority 10 - future)
}
```

#### B. Minor Improvements
```typescript
// Add better statistics
export async function getReScrapeStats(): Promise<{
  overview: { total: number; oldest: Date | null; newest: Date | null };
  blacklist: { total: number; avgConfidence: number };
  manual: number;
}> {
  // More detailed stats
}

// Add progress tracking
export async function trackReScrapeProgress(
  url: string,
  type: 'overview' | 'blacklist',
  programsFound: number
): Promise<void> {
  // Track how many new programs were found
  // Update confidence for blacklist re-scrapes
}
```

### Why Keep Unified?

1. **Single Source of Truth**: All re-scraping logic in one place
2. **Priority System**: Works well - overview pages get priority
3. **Easy to Extend**: Manual flags already structured
4. **Clean Integration**: One call after scraping phase
5. **No Duplication**: Don't need separate systems

### What NOT to Do

- **Don't Separate**: Would create duplication and confusion
- **Don't Over-Complicate**: Current system is simple and works
- **Don't Change Priority Logic**: Overview pages should have higher priority

### Minor Enhancements Only

1. **Better Statistics**: Show more details about re-scrape tasks
2. **Progress Tracking**: Track how many new programs found
3. **Confidence Updates**: Update blacklist confidence after re-scrape

---

## 6. Login/Authentication Pages - Full Integration

### Current Problem
- **Detected But Ignored**: `requiresLogin()` works, but pages just marked as failed
- **Login Code Exists**: `login.ts` has functions but never called
- **No Credentials**: No way to store/login with credentials
- **Missing Data**: Programs behind login are completely inaccessible

### What I Would Do

#### A. Add Login Configuration to Institution Config
```typescript
// In institutionConfig.ts
export interface InstitutionConfig {
  // ... existing fields
  loginConfig?: {
    enabled: boolean;
    loginUrl: string;
    email: string; // From env var
    password: string; // From env var (encrypted)
    sessionCookieName?: string;
    formSelectors?: {
      emailField?: string;
      passwordField?: string;
      submitButton?: string;
    };
  };
}

// Example usage
{
  id: 'institution_aws',
  name: 'AWS',
  // ... other fields
  loginConfig: {
    enabled: true,
    loginUrl: 'https://www.aws.at/foerdermanager/login',
    email: process.env.AWS_EMAIL, // From .env.local
    password: process.env.AWS_PASSWORD, // From .env.local
    sessionCookieName: 'session_id'
  }
}
```

#### B. Integrate Login Handling
```typescript
// In unified-scraper.ts, scraping phase
const needsLogin = requiresLogin(url, result.html);

if (needsLogin) {
  console.log(`   🔐 Login required - attempting authentication...`);
  
  const institution = findInstitutionByUrl(url);
  
  if (institution?.loginConfig?.enabled) {
    try {
      // Login to site
      const { loginToSite, fetchHtmlWithAuth } = await import('./src/utils/login');
      const loginResult = await loginToSite(institution.loginConfig);
      
      if (loginResult.success && loginResult.cookies) {
        console.log(`   ✅ Login successful - fetching with authentication...`);
        
        // Fetch page with auth
        const authResult = await fetchHtmlWithAuth(url, institution.loginConfig);
        result.html = authResult.html;
        result.status = authResult.status;
        
        // Continue with normal extraction...
      } else {
        console.log(`   ❌ Login failed: ${loginResult.error}`);
        // Mark as failed
      }
    } catch (error: any) {
      console.log(`   ⚠️  Login error: ${error.message}`);
      // Mark as failed
    }
  } else {
    console.log(`   ⏭️  No login config - marking as failed`);
    // Mark as failed (current behavior)
  }
}
```

#### C. Session Management
```typescript
// Store and reuse sessions
const sessionCache = new Map<string, { cookies: Record<string, string>; expires: Date }>();

export async function getAuthenticatedSession(
  institutionId: string,
  loginConfig: LoginConfig
): Promise<Record<string, string> | null> {
  // Check cache
  const cached = sessionCache.get(institutionId);
  if (cached && cached.expires > new Date()) {
    return cached.cookies; // Reuse session
  }
  
  // Login and cache
  const loginResult = await loginToSite(loginConfig);
  if (loginResult.success && loginResult.cookies) {
    sessionCache.set(institutionId, {
      cookies: loginResult.cookies,
      expires: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    });
    return loginResult.cookies;
  }
  
  return null;
}
```

#### D. Secure Credential Storage
```typescript
// Use environment variables (never hardcode)
// .env.local
AWS_EMAIL=user@example.com
AWS_PASSWORD=encrypted_password_here

// Or use encrypted storage in database
CREATE TABLE institution_credentials (
  institution_id VARCHAR(50) PRIMARY KEY,
  email_encrypted BYTEA, -- Encrypted
  password_encrypted BYTEA, -- Encrypted
  encryption_key_id VARCHAR(50)
);
```

### Why This Approach?

1. **Unlock Hidden Data**: Access programs behind login
2. **Per-Institution**: Each institution can have its own login config
3. **Secure**: Credentials in env vars or encrypted storage
4. **Session Reuse**: Don't login every time, reuse sessions
5. **Graceful Fallback**: If login fails, mark as failed (current behavior)

### Implementation Steps

1. **Add `loginConfig` to institution config** (optional field)
2. **Integrate login check** in scraping phase
3. **Add session management** (cache and reuse)
4. **Add credential storage** (env vars or encrypted DB)
5. **Test with one institution** (e.g., AWS FörderManager)

### Security Considerations

1. **Never Hardcode**: Always use env vars or encrypted storage
2. **Encrypt Passwords**: If storing in DB, encrypt them
3. **Session Timeout**: Sessions expire after 30 min
4. **Per-Institution**: Each institution has separate credentials
5. **Optional**: Login is optional - system works without it

---

## Priority Summary

### High Priority (Do First) 🔴
1. **Integrate Filter Exploration** - Code exists, just needs integration (1 hour)
2. **Add Industry-Specific Seed URLs** - Quick win, better coverage (2 hours)
3. **Better Discovery Logging** - Helps debugging immediately (30 min)

### Medium Priority (Do Next) 🟡
4. **Add Login Handling** - Unlocks hidden data (3-4 hours)
5. **Expand to More Regions** - Germany, Switzerland, EU (2-3 hours)
6. **Blacklist Management** - Better control (2 hours)

### Low Priority (Nice to Have) 🟢
7. **Program Focus Parsing** - Extract industry metadata (1 hour)
8. **Configurable Hardcoded Patterns** - Flexibility (1 hour)
9. **Re-Scrape Statistics** - Better monitoring (30 min)

---

## Quick Wins (Start Here)

1. **Filter Exploration** (1 hour) - Biggest impact, code already exists
2. **Better Logging** (30 min) - Immediate debugging help
3. **Industry-Specific URLs** (2 hours) - Better coverage

These three will give you the most value with least effort!

