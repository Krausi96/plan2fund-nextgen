# Overview Pages & Re-Scraping Strategy

## Current State

### Overview Pages

**Detection**: ✅ **Working**
- `isOverviewPage()` detects:
  - URL patterns (`/fundings`, `/programme`, etc.)
  - Filter query parameters (`field_`, `filter`, `type`, etc.)
  - Filter UI elements (select, input, filter classes)
  - Listing structure (multiple articles, cards, grids)

**Handling**: ⚠️ **Basic**
- Overview pages are detected and marked in metadata
- Links are extracted and classified with LLM
- Re-checked every 7 days

**Problem**: 
- Filter pages (e.g., FFG `/en/fundings?field_funding_type=...`) are detected but not systematically explored
- We don't extract all filter combinations to discover new programs

### Re-Scraping

**Current**: ⚠️ **Separate Systems**
1. **Overview Pages**: Re-checked every 7 days in discovery
2. **Blacklist**: Re-check system exists but separate

**Problem**: 
- Two separate re-check mechanisms
- No unified approach
- Blacklist re-check doesn't integrate with discovery

---

## Proposed Solutions

### 1. Overview Pages - Enhanced Filter Exploration

**Problem**: FFG has filter pages like `/en/fundings?field_funding_type%5B0%5D=...` that we detect but don't explore systematically.

**Solution**: Extract filter combinations and discover new programs

**Implementation**:
1. Detect filter pages (already done)
2. Extract filter options from HTML (select options, checkboxes, etc.)
3. Generate filter combinations (or sample strategically)
4. Discover programs from filtered pages
5. Queue new programs for scraping

**Approach**:
- **Option A**: Extract all filter combinations (might be too many)
- **Option B**: Sample strategically (e.g., one per filter type)
- **Option C**: Use LLM to identify most relevant filter combinations

**Recommendation**: **Option C** - Use LLM to identify relevant filters, then explore those combinations.

### 2. Unified Re-Scraping System

**Problem**: Separate systems for overview re-check and blacklist re-check.

**Solution**: Unified re-scraping system

**Implementation**:
```typescript
interface ReScrapeTask {
  url: string;
  type: 'overview' | 'blacklist' | 'manual';
  priority: number;
  lastChecked: Date;
  reason: string;
}

async function getReScrapeTasks(): Promise<ReScrapeTask[]> {
  // Get overview pages older than 7 days
  // Get blacklisted URLs with low confidence
  // Get manually flagged URLs
  // Return unified list sorted by priority
}
```

**Benefits**:
- Single system for all re-scraping
- Unified priority queue
- Better logging and monitoring
- Easier to schedule/manage

**Recommendation**: **Unify** - Create single re-scraping system that handles both.

### 3. Login/Authentication Pages

**Current**: ✅ **Detection Working**
- `requiresLogin()` detects login pages
- Pages are marked and excluded

**Problem**: Can't access pages behind login.

**Solution Options**:

**Option A**: Manual Login (Simple)
- User provides credentials
- Store session cookies
- Use cookies for requests
- **Pros**: Simple, works for specific sites
- **Cons**: Manual setup, session expiry, security concerns

**Option B**: Automated Login (Complex)
- Detect login form
- Fill credentials
- Submit form
- Handle session/cookies
- **Pros**: Automated
- **Cons**: Complex, fragile, security concerns, might violate ToS

**Option C**: Skip Login Pages (Current)
- Mark as requires_login
- Exclude from scraping
- **Pros**: Simple, safe, no ToS issues
- **Cons**: Misses some programs

**Recommendation**: **Option A (Optional)** - Add manual login capability for specific sites, but keep it optional and secure.

**Implementation**:
```typescript
interface LoginConfig {
  url: string;
  email: string;
  password: string; // Encrypted
  sessionCookie?: string;
  expiresAt?: Date;
}

async function loginToSite(config: LoginConfig): Promise<string> {
  // Login and return session cookie
}

async function fetchWithAuth(url: string, loginConfig?: LoginConfig): Promise<FetchResult> {
  // Use session cookie if available
}
```

### 4. HTML Parsing

**Current**: ✅ **Exists**
- Cheerio for HTML parsing
- Used for:
  - Link extraction
  - Content cleaning (remove scripts, styles, etc.)
  - Overview page detection
  - Login detection

**How It Works**:
1. `fetchHtml()` fetches HTML
2. Cheerio loads HTML
3. Content is cleaned (scripts, styles, nav, footer removed)
4. Main content extracted
5. Links extracted for discovery
6. Cleaned content sent to LLM

**Not Used For**:
- Pattern-based extraction (removed - LLM-only now)
- Direct requirement extraction (LLM handles this)

**Status**: ✅ **Working as intended** - HTML parsing is for structure, LLM is for extraction.

### 5. Implementation Without Disturbing Usual Parsing

**Strategy**: Feature flags and separate functions

**Approach**:
1. **Feature Flags**: Enable/disable new features
2. **Separate Functions**: New logic in separate functions
3. **Gradual Integration**: Test in parallel, then integrate
4. **Backward Compatible**: Default behavior unchanged

**Example**:
```typescript
// Feature flags
const CONFIG = {
  ENABLE_FILTER_EXPLORATION: process.env.ENABLE_FILTER_EXPLORATION === 'true',
  ENABLE_LOGIN: process.env.ENABLE_LOGIN === 'true',
  ENABLE_UNIFIED_RECRAPING: process.env.ENABLE_UNIFIED_RECRAPING === 'true',
};

// Separate functions
async function exploreFilterPages(url: string): Promise<string[]> {
  // New logic - doesn't affect existing flow
}

// Integration point
if (CONFIG.ENABLE_FILTER_EXPLORATION && isOverviewPage(url)) {
  const newUrls = await exploreFilterPages(url);
  // Add to discovery queue
}
```

---

## Recommendations

### Immediate (High Priority)

1. ✅ **Unify Re-Scraping**: Create unified system for overview + blacklist re-check
2. ✅ **Enhanced Overview Handling**: Extract filter combinations for filter pages
3. ⚠️ **Login (Optional)**: Add manual login capability (optional, secure)

### Future (Medium Priority)

4. ⚠️ **Automated Filter Exploration**: Use LLM to identify relevant filter combinations
5. ⚠️ **Better Filter Page Detection**: Improve detection of dynamic filter pages

### Low Priority

6. ⚠️ **Automated Login**: Only if manual login proves valuable

---

## Implementation Plan

### Phase 1: Unified Re-Scraping
- Create `unified-rescraping.ts`
- Merge overview re-check and blacklist re-check
- Add priority queue
- Test with small batch

### Phase 2: Enhanced Overview Pages
- Add filter extraction logic
- Generate filter combinations
- Discover programs from filters
- Test with FFG filter pages

### Phase 3: Optional Login
- Add login configuration
- Implement session management
- Add secure credential storage
- Test with one site (e.g., AWS FörderManager)

### Phase 4: Integration
- Enable features via flags
- Monitor and adjust
- Document usage

---

## Questions to Answer

1. **Filter Exploration**: How many filter combinations should we explore?
   - **Answer**: Start with 5-10 most common, expand if valuable

2. **Login**: Which sites need login?
   - **Answer**: AWS FörderManager (user mentioned), others TBD

3. **Re-Scraping Frequency**: How often should we re-check?
   - **Answer**: Overview pages: 7 days (current), Blacklist: 30 days (new)

4. **Priority**: What's most important?
   - **Answer**: Unified re-scraping > Enhanced overview > Optional login

