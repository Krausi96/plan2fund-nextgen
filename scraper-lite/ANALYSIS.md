# Scraper Analysis - Current State & Improvements

## 1. Adding New Seed URLs (Discovery)

### Current State ✅
- **Location**: `src/config/institutionConfig.ts`
- **Method**: Add URLs to `programUrls` array in institution config
- **Current Coverage**: 
  - **Austria**: AWS, FFG, Vienna Business Agency, SFG, AMS, WKO, ÖBB, Bank Austria, Erste Bank
  - **EU**: Limited (mostly Austrian institutions)
  - **Industry/Branches**: Not granular - institutions are general, not industry-specific

### Current Implementation
```typescript
{
  id: 'institution_aws',
  name: 'Austria Wirtschaftsservice (AWS)',
  baseUrl: 'https://aws.at',
  programUrls: [
    'https://www.aws.at/en/aws-digitalisierung/...',
    'https://www.aws.at/en/aws-equity/...',
    // ... more URLs
  ],
  fundingTypes: ['grant', 'loan', 'bank_loan', 'equity', 'guarantee'],
  region: 'Austria',
  programFocus: undefined, // Not set - could be industry-specific
}
```

### What's Missing ❌
1. **Industry-Specific Institutions**: No tech, manufacturing, green/energy, healthcare, tourism-specific institutions
2. **Branch-Specific URLs**: Institutions have general URLs, not broken down by industry
3. **Program Focus**: `programFocus` field exists but not used for granular discovery
4. **Meta Areas**: No parsing of industry/branch metadata for better categorization

### Recommendations ✅
1. **Add Industry-Specific Institutions**:
   ```typescript
   {
     id: 'institution_aws_tech',
     name: 'AWS - Technology Programs',
     baseUrl: 'https://aws.at',
     programUrls: [
       'https://www.aws.at/en/aws-digitalisierung/ai-unternehmen-wachstum/',
       'https://www.aws.at/en/aws-digitalization/ai-start/',
     ],
     fundingTypes: ['grant', 'equity'],
     region: 'Austria',
     programFocus: ['technology', 'AI', 'digitalization'], // Industry-specific
   }
   ```

2. **Expand to More Regions**:
   - Germany (KfW, BMWi, etc.)
   - Switzerland (Innosuisse, etc.)
   - EU-wide (Horizon Europe, etc.)

3. **Use `programFocus` for Granular Discovery**:
   - Filter discovery by industry/branch
   - Track which industries are covered
   - Prioritize missing industries

4. **Parse Meta Areas from Pages**:
   - Extract industry tags from pages
   - Use LLM to categorize by industry
   - Store in `program_focus` field

---

## 2. Blacklisting - How It Works

### Current State ✅
- **Location**: `src/utils/blacklist.ts`
- **Storage**: 
  - **Database**: `url_patterns` table (learned patterns)
  - **Hardcoded**: Fallback patterns in code
- **Updates**: Automatic - patterns learned from scraping

### How It Works
1. **Database Patterns** (Primary):
   - Stored in `url_patterns` table
   - Pattern type: `'exclude'`
   - Confidence threshold: > 0.7
   - Learned automatically from failed scrapes

2. **Hardcoded Patterns** (Fallback):
   - Career/job pages (`/karriere/`, `/career/`, etc.)
   - Contact pages (`/contact/`, `/kontakt/`)
   - About pages (`/about/`, `/ueber/`)
   - Legal pages (`/imprint/`, `/privacy/`)
   - News/media pages (`/news/`, `/press/`)

3. **Check Process**:
   ```typescript
   isUrlExcluded(url) → 
     Check database patterns (confidence > 0.7) →
     Check hardcoded patterns →
     Return true/false
   ```

### Updates ✅
- **Automatic**: Patterns learned from each scrape
- **Manual**: Can add via `npm run blacklist:add`
- **Re-check**: Low-confidence patterns re-checked every 7 days

### Current Issues ⚠️
- No UI for managing blacklist
- Hardcoded patterns need manual code updates
- No way to see all learned patterns easily

### Recommendations ✅
1. **Add Blacklist Management UI**:
   - View all patterns (database + hardcoded)
   - Edit/delete patterns
   - See confidence scores

2. **Make Hardcoded Patterns Configurable**:
   - Move to database or config file
   - Allow runtime updates

3. **Better Pattern Learning**:
   - Learn from classification feedback
   - Improve confidence scoring

---

## 3. Discovery Cycle - Skipping Already Seen URLs

### Current State ✅
**YES, it does skip already seen URLs** - but with exceptions:

```typescript
// Line 155-157 in unified-scraper.ts
const seedsToCheck = seeds.filter(s => 
  !existingSeeds.has(s) ||  // Skip if already in DB
  overviewUrlsToRecheck.has(s)  // EXCEPT: re-check overview pages
);
```

### Why You See AWS Every Time 🔍
1. **Overview Pages Re-Checked**: Overview pages are re-checked every 7 days (line 144-151)
2. **New Links from Overview**: Overview pages may have new links each time
3. **Smart Discovery**: System prioritizes URLs with different funding types

### Current Logic
- ✅ **Skips**: URLs already in database (unless overview page)
- ✅ **Re-checks**: Overview pages older than 7 days
- ✅ **Processes**: New seed URLs not in database
- ✅ **LLM Classification**: Quick check if seed is overview page before fetching

### Recommendations ✅
1. **Better Logging**: Show WHY a seed is being processed
   - "New seed URL"
   - "Re-checking overview page (last: 2024-01-15)"
   - "Already in DB but processing anyway"

2. **Separate Overview Re-Check**: 
   - Don't mix with new seeds
   - Clear phase separation

3. **Skip Logic Improvement**:
   - Skip if URL exists AND not overview AND not force update
   - Better tracking of why URLs are processed

---

## 4. Overview Pages - Filter Handling

### Current State ⚠️
- **Detection**: ✅ Works (`isOverviewPage()`)
- **Marking**: ✅ Works (marked in database)
- **Re-checking**: ✅ Works (every 7 days)
- **Filter Exploration**: ⚠️ **EXISTS BUT NOT INTEGRATED**

### Filter Exploration Code Exists
- **Location**: `src/utils/overview-filters.ts`
- **Functions**:
  - `extractFilterOptions()` - Extract filters from page
  - `generateFilterCombinations()` - Generate filter URLs
  - `extractFilterUrls()` - Get all filter URLs

### Current Implementation
```typescript
// Overview page detected
if (isOverview) {
  console.log(`📋 Overview page detected - extracting all program links...`);
  // But filter exploration is NOT called!
}
```

### What's Missing ❌
1. **Filter Exploration Not Called**: Code exists but not used in discovery
2. **No Filter URL Generation**: FFG filter pages not explored
3. **No Filter Combination Strategy**: Don't know which filters to try

### Recommendations ✅
1. **Integrate Filter Exploration**:
   ```typescript
   if (isOverview) {
     // Extract filter options
     const filterUrls = extractFilterUrls(result.html, seed, 10);
     // Classify filter URLs
     // Queue high-quality ones
   }
   ```

2. **Smart Filter Strategy**:
   - Try one filter at a time first
   - Then try combinations
   - Limit to avoid URL explosion

3. **Track Filter URLs**:
   - Store filter parameters in metadata
   - Avoid re-exploring same filters

---

## 5. Re-Scraping - Unified or Separate?

### Current State ✅
**ALREADY UNIFIED!** Both are in `unified-rescraping.ts`:

```typescript
export async function getReScrapeTasks() {
  // 1. Overview pages (60% of tasks)
  // 2. Blacklisted URLs (30% of tasks)
  // 3. Manual flags (10% - future)
}
```

### Integration Status ✅
- **Location**: `src/rescraping/unified-rescraping.ts`
- **Integration**: ✅ Integrated into main flow (line 695-742 in unified-scraper.ts)
- **Types**: 
  - `'overview'` - Overview pages (priority 8)
  - `'blacklist'` - Low-confidence blacklisted URLs (priority 5)
  - `'manual'` - Manually flagged (future)

### Current Flow
```
Scraping Phase →
  Auto Re-Scraping (line 695-742):
    - Get re-scrape tasks (overview + blacklist)
    - Process up to 3 tasks
    - Mark as completed
  Auto Blacklist Re-Check (line 744-763):
    - Re-check low-confidence exclusions
    - Runs every 7 days
```

### Recommendation ✅
**KEEP UNIFIED** - Current structure is good:
- Single source of truth
- Priority-based processing
- Easy to extend (manual flags ready)

### Potential Improvement
- **Separate Phases**: Could separate overview re-check from blacklist re-check for clarity
- **But**: Current unified approach is cleaner and works well

---

## 6. Login/Authentication Pages

### Current State ⚠️
- **Detection**: ✅ Works (`requiresLogin()`)
- **Handling**: ⚠️ **DETECTED BUT NOT HANDLED**

### Detection
```typescript
// Line 530 in unified-scraper.ts
const needsLogin = requiresLogin(url, result.html);
// But then what? Just marks as failed!
```

### Login Code Exists
- **Location**: `src/utils/login.ts`
- **Functions**:
  - `loginToSite()` - Login to a site
  - `fetchHtmlWithAuth()` - Fetch with authentication

### Current Implementation
```typescript
// Line 643-648 in unified-scraper.ts
if (requiresLogin(url, result.html)) {
  console.log(`   ⏭️  Requires login, marking as failed`);
  // Just marks as failed - no login attempt!
}
```

### What's Missing ❌
1. **No Login Attempt**: Detected but not handled
2. **No Credential Storage**: No way to store login credentials
3. **No Session Management**: No cookie/session handling
4. **No Config**: No way to configure login per institution

### Recommendations ✅
1. **Add Login Configuration**:
   ```typescript
   // In institutionConfig.ts
   {
     loginConfig: {
       url: 'https://example.com/login',
       email: process.env.EXAMPLE_EMAIL,
       password: process.env.EXAMPLE_PASSWORD,
     }
   }
   ```

2. **Integrate Login Handling**:
   ```typescript
   if (requiresLogin(url, result.html)) {
     const institution = findInstitutionByUrl(url);
     if (institution.loginConfig) {
       // Try to login
       const loginResult = await loginToSite(institution.loginConfig);
       if (loginResult.success) {
         // Fetch with auth
         const result = await fetchHtmlWithAuth(url, institution.loginConfig);
       }
     }
   }
   ```

3. **Secure Credential Storage**:
   - Use environment variables
   - Encrypt in database
   - Per-institution credentials

4. **Session Management**:
   - Store cookies/sessions
   - Reuse sessions
   - Handle session expiry

---

## Summary & Priority

### High Priority 🔴
1. **Add More Seed URLs** - Industry-specific, more regions
2. **Integrate Filter Exploration** - FFG filter pages not explored
3. **Add Login Handling** - Detected but not handled

### Medium Priority 🟡
1. **Better Discovery Logging** - Show why seeds are processed
2. **Blacklist Management UI** - View/edit patterns
3. **Program Focus Parsing** - Extract industry metadata

### Low Priority 🟢
1. **Separate Overview Re-Check Phase** - Current unified approach works
2. **Configurable Hardcoded Patterns** - Current approach is fine
3. **Filter Combination Strategy** - Basic strategy exists

---

## Quick Wins

1. **Add Industry-Specific Seed URLs** (30 min):
   - Add tech, manufacturing, green/energy institutions
   - Use `programFocus` field

2. **Integrate Filter Exploration** (1 hour):
   - Call `extractFilterUrls()` when overview page detected
   - Classify and queue filter URLs

3. **Add Login Handling** (2 hours):
   - Add `loginConfig` to institution config
   - Integrate `loginToSite()` and `fetchHtmlWithAuth()`

4. **Better Logging** (30 min):
   - Show why each seed is processed
   - Separate overview re-check phase

