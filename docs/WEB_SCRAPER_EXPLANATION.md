# Web Scraper - Complete Plain English Explanation

## 1. WHAT IS IT SCRAPING?

### Real-Life Example:
Think of it like a researcher browsing funding websites all day, looking for:
- "AWS Preseed funding for startups"
- "FFG research grants"
- "EU Horizon funding"
- "EIC accelerator programs"

### What Data It Extracts:

**Basic Data** (Always scraped):
- Program name: "AWS Preseed"
- Description: "Funding for innovative startups"
- Funding amount: €50,000 - €200,000
- Deadline: 2025-12-31
- Institution: "Austria Wirtschaftsservice"

**Deep Requirements** (via pattern matching):
- Co-financing: "Mindestens 50% Eigenbeitrag" → extracts: 50%
- TRL Level: "Technology Readiness Level 3-7" → extracts: "3-7"
- Impact: "Innovation impact required" → extracts: innovation
- Consortium: "International partners required" → extracts: yes/no
- Industry: "Digital services" → extracts: digital

### Funding Types It Detects:

**It's NOT just grants!** It detects 6 types:

1. **Grant** (non-repayable): "Förderung", "subvention", "grant"
   - Example: "AWS Preseed: €50k funding for startups"

2. **Loan** (repayable): "Kredit", "darlehen", "loan", "interest rate"
   - Example: "Startup loan: €100k at 2% interest, repayable in 5 years"

3. **Equity** (investment): "Eigenkapital", "equity", "venture capital"
   - Example: "Seed investment: €250k for 15% equity"

4. **Visa** (immigration): "Visum", "visa", "residency"
   - Example: "Red-White-Red Card for startup founders"

5. **Consulting** (free guidance): "Beratung", "consulting", "coaching"
   - Example: "Free startup consulting from WKO"

6. **Service** (incubation/support): "Inkubation", "networking", "workshops"
   - Example: "Incubator program: office space + mentoring"

### How It Detects Type:

It reads the page content and looks for keywords:

**Loan Detection:**
- Sees: "Darlehen" + "Zurückzahlen" + "Zins" → LOAN
- Real page: "Startup-Darlehen: €50,000 zu 2% Zinssatz, monatliche Rückzahlung"
- Extracts: type = "loan"

**Equity Detection:**
- Sees: "Eigenkapital" + "Investment" + "Beteiligung" → EQUITY  
- Real page: "Seed Investment: €100,000 für 10% Eigenkapital"
- Extracts: type = "equity"

**Grant Detection:**
- Sees: "Förderung" or "Grant" without repayment → GRANT
- Real page: "AWS Preseed: €50,000 Förderung (nicht zurückzahlbar)"
- Extracts: type = "grant"

## 2. FILES AND SIMPLIFICATION

### Current Files:

**KEEP (Core):**
1. `src/lib/webScraperService.ts` - Main scraper logic (handles all institutions, patterns, extraction)
2. `pages/api/enhanced-scraper-test-quick.ts` - API endpoint to trigger scraper
3. `scripts/independent-scraper.ts` - Standalone runner (no server needed)

**DELETE (Unused):**
1. ~~`scripts/optimized-scraper-cron.js`~~ - Old, not used anywhere
2. ~~`pages/api/cron/scraper.ts`~~ - Requires dev server, not fully automated
3. ~~`scripts/crontab-example.txt`~~ - Just an example, not implemented

**Result:** Just 3 files total!

## 3. HOW TO AUTOMATE?

### Option A: Simple Cron (Recommended)

**Step 1:** Add to your system cron:
```bash
crontab -e
```

**Step 2:** Add this line (runs every 6 hours):
```
0 */6 * * * cd /path/to/plan2fund-nextgen && npm run scraper:run >> scraper.log 2>&1
```

**What this does:**
- Every 6 hours, runs the scraper
- Saves fresh data to `data/scraped-programs-latest.json`
- SmartWizard automatically uses new data (no restart needed)

### Option B: Vercel Cron (For Production)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/scraper",
    "schedule": "0 */6 * * *"
  }]
}
```

**What this does:**
- Vercel automatically calls your API endpoint
- Runs scraping in the cloud
- Updates data automatically

### Option C: GitHub Actions (For CI/CD)

Create `.github/workflows/scraper.yml`:
```yaml
name: Run Scraper
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run scraper:run
      - run: git add data/scraped-programs-latest.json && git commit -m "Auto-update data" && git push
```

**What this does:**
- GitHub automatically runs scraper every 6 hours
- Commits fresh data back to repo
- Always has latest data

## 4. SELF-LEARNING EXPLAINED

### Real Example 1: URL Discovery

**Before Learning:**
- Scraper finds: "https://aws.at/foerderung/startup"
- Doesn't know if it's relevant

**After Learning:**
- Scraper successfully extracts data from "startup" URLs
- Learns: "startup" keyword = relevant
- Next time: Prioritizes URLs with "startup"
- Confidence: Grows from 1 → 5 → 10 after repeated successes

### Real Example 2: Pattern Matching

**Pattern:** Co-financing detection

**Text on page:** "Der Eigenbeitrag beträgt mindestens 50%"

**Before:** 
- Scraper might miss it or extract incorrectly

**After (Self-Learning):**
- Scraper extracts: co_financing = "50%"
- Scores pattern confidence based on success rate
- If pattern works 95% of the time → High confidence, always use it
- If pattern works 30% of the time → Low confidence, try alternatives

### Real Example 3: Geographic Expansion

Currently: Only Austria/EU

**How to add Germany:**
1. Add to `SCRAPER_CONFIG.institutions`:
```javascript
bmwi: { 
  name: 'German Federal Ministry', 
  baseUrl: 'https://www.bmwi.de',
  category: 'german_grants',
  enabled: true
}
```
2. Scraper automatically:
   - Discovers URLs from bmwi.de
   - Learns German keywords ("förderung", "programm", etc.)
   - Self-adapts to German patterns

**No code changes needed for basic sites!**

## 5. MAXIMUM OUTPUT WITH MINIMUM FILES

### Simplified Architecture:

```
1. src/lib/webScraperService.ts (MASTER FILE - Everything here)
   - All institutions
   - All patterns
   - All learning logic
   - All extraction

2. scripts/independent-scraper.ts (RUNNER)
   - Just calls webScraperService
   - Saves to JSON

3. pages/api/enhanced-scraper-test-quick.ts (API)
   - Just calls webScraperService
   - Returns JSON

That's it! Everything else removed.
```

## SUMMARY

**What it scrapes:** Grants, loans, equity, visa, consulting, services  
**How it learns:** Keyword confidence, pattern success rates  
**How to automate:** Cron job, Vercel cron, or GitHub Actions  
**Files needed:** Just 3 files  
**Geographic expansion:** Add institution, it auto-adapts  
**Funding type expansion:** Already detects 6 types, auto-adapts

**Next Step:** Choose automation method and we'll implement it!

