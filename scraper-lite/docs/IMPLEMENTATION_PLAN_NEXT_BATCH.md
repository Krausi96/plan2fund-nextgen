# Implementation Plan - Next Batch

## Questions Answered

### 4) Overview Pages (Filter Pages)

**Current**: ✅ Detection works, basic handling
**Problem**: Filter pages (e.g., FFG `/en/fundings?field_funding_type=...`) detected but not systematically explored

**Solution**: ✅ **Implemented** - `utils-overview-filters.ts
- Extract filter options from HTML
- Generate strategic filter combinations
- Build filter URLs
- Discover programs from filtered pages

**How It Works**:
1. Detect overview page with filters
2. Extract filter options (selects, checkboxes)
3. Generate combinations (single filters, pairs, etc.)
4. Build URLs with filter params
5. Discover programs from filter URLs

**Integration**: Feature flag `ENABLE_FILTER_EXPLORATION`

---

### 5) Re-Scraping: Unified or Separate?

**Current**: ⚠️ Separate systems (overview re-check, blacklist re-check)

**Solution**: ✅ **Unified** - `unified-rescraping.ts`
- Single system for all re-scraping
- Priority queue (overview pages: priority 8, blacklist: priority 5)
- Unified scheduling and monitoring

**Benefits**:
- Single system to manage
- Better priority handling
- Unified logging
- Easier to schedule

**Recommendation**: ✅ **Unify** - Implemented unified system

---

### 6) Login/Authentication Pages

**Current**: ✅ Detection works, pages are excluded

**Solution**: ✅ **Optional Manual Login** - `utils-login.ts`
- Manual login configuration
- Session cookie management
- Fetch with authentication

**How It Works**:
1. User provides login config (email, password, selectors)
2. System logs in and gets session cookie
3. Uses cookie for authenticated requests

**Security**:
- Credentials stored in environment variables (encrypted)
- Session cookies managed securely
- Optional feature (disabled by default)

**Recommendation**: ✅ **Optional Manual Login** - Implemented, use for specific sites (e.g., AWS FörderManager)

**Note**: Automated login is complex and might violate ToS. Manual login is safer.

---

### 7) HTML Parsing

**Current**: ✅ **Exists and Working**
- Cheerio for HTML parsing
- Used for:
  - Link extraction
  - Content cleaning (remove scripts, styles, etc.)
  - Overview page detection
  - Login detection
  - Filter extraction (new)

**Not Used For**:
- Pattern-based extraction (removed - LLM-only)
- Direct requirement extraction (LLM handles this)

**Status**: ✅ **Working as intended** - HTML parsing for structure, LLM for extraction

---

### 8) Implementation Without Disturbing Usual Parsing

**Strategy**: ✅ **Feature Flags + Separate Functions**

**Approach**:
1. **Feature Flags**: Enable/disable new features via env vars
2. **Separate Functions**: New logic in separate modules
3. **Gradual Integration**: Test in parallel, then integrate
4. **Backward Compatible**: Default behavior unchanged

**Implementation**:
```typescript
// Feature flags in config
const CONFIG = {
  ENABLE_FILTER_EXPLORATION: process.env.ENABLE_FILTER_EXPLORATION === 'true',
  ENABLE_LOGIN: process.env.ENABLE_LOGIN === 'true',
  ENABLE_UNIFIED_RECRAPING: process.env.ENABLE_UNIFIED_RECRAPING === 'true',
};

// Separate functions (don't affect existing flow)
if (CONFIG.ENABLE_FILTER_EXPLORATION && isOverviewPage(url)) {
  const filterUrls = extractFilterUrls(html, url);
  // Add to discovery queue (non-blocking)
}

// Unified re-scraping (optional, doesn't affect discovery)
if (CONFIG.ENABLE_UNIFIED_RECRAPING) {
  const tasks = await getReScrapeTasks();
  // Process tasks (separate from main flow)
}
```

**Status**: ✅ **Safe Implementation** - All new features are optional and don't affect existing parsing

---

## Implementation Summary

### ✅ Completed

1. **Overview Filter Exploration**: `utils-overview-filters.ts`
   - Extract filter options
   - Generate combinations
   - Build filter URLs

2. **Unified Re-Scraping**: `unified-rescraping.ts`
   - Single system for all re-scraping
   - Priority queue
   - Statistics

3. **Optional Login**: `utils-login.ts`
   - Manual login configuration
   - Session management
   - Authenticated fetching

### ⚠️ Integration Needed

1. **Integrate Filter Exploration** into discovery
2. **Integrate Unified Re-Scraping** into main flow
3. **Add Login Config** to environment variables
4. **Test All Features** with small batch

---

## Next Steps

1. **Test Filter Exploration**: Run with FFG filter pages
2. **Test Unified Re-Scraping**: Check if it finds tasks correctly
3. **Test Login (Optional)**: Test with AWS FörderManager (if credentials provided)
4. **Monitor Performance**: Ensure no impact on existing parsing

---

## Environment Variables

```bash
# Feature flags
ENABLE_FILTER_EXPLORATION=true
ENABLE_UNIFIED_RECRAPING=true
ENABLE_LOGIN=false  # Only enable if you have credentials

# Login config (if ENABLE_LOGIN=true)
LOGIN_URL=https://example.com/login
LOGIN_EMAIL=your-email@example.com
LOGIN_PASSWORD=your-password  # Should be encrypted
```

---

## Usage Examples

### Filter Exploration
```typescript
import { extractFilterUrls } from './src/utils-overview-filters';

const filterUrls = extractFilterUrls(html, baseUrl, maxUrls=10);
// Returns: ['/fundings?field_type[0]=grant', '/fundings?field_type[0]=loan', ...]
```

### Unified Re-Scraping
```typescript
import { getReScrapeTasks } from './src/unified-rescraping';

const tasks = await getReScrapeTasks(overviewDays=7, blacklistDays=30);
// Returns: Array of ReScrapeTask with priorities
```

### Login
```typescript
import { loginToSite, fetchHtmlWithAuth } from './src/utils-login';

const loginConfig = {
  url: 'https://example.com/login',
  email: 'user@example.com',
  password: 'password',
  emailFieldSelector: 'input[name="email"]',
  passwordFieldSelector: 'input[name="password"]'
};

const result = await loginToSite(loginConfig);
if (result.success) {
  const page = await fetchHtmlWithAuth('https://example.com/protected', loginConfig);
}
```

