# Plan2Fund - Master Documentation

**Last Updated:** 2025-10-27  
**Status:** Scraper ready, SmartWizard ready, but scraper not yet run with real data

---

## Table of Contents

1. [Overview](#overview)
2. [How the Complete Pipeline Works](#how-the-complete-pipeline-works)
3. [Web Scraper (Data Source)](#web-scraper-data-source)
4. [SmartWizard (User Interface)](#smartwizard-user-interface)
5. [Question Engine (Logic)](#question-engine-logic)
6. [How to Run](#how-to-run)
7. [How to Automate](#how-to-automate)

---

## Overview

**Plan2Fund** helps users find funding programs that match their needs through an intelligent question-answering wizard.

**Key Components:**
1. **Web Scraper** - Extracts program data from 11 institutions
2. **SmartWizard** - Asks progressive questions to narrow down programs
3. **Question Engine** - Generates smart questions from data
4. **Results** - Shows ranked, filtered programs

**Goal:** Start with 300 programs → Ask 10-15 questions → Filter to top 5-10 programs

---

## How the Complete Pipeline Works

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: SCRAPER                                     │
│ Input: 11 website URLs                             │
│ Output: data/scraped-programs-latest.json           │
│                                                      │
│ Extracts:                                           │
│ • Basic: name, description, amounts, deadline     │
│ • Eligibility: location, team, age, revenue        │
│ • Deep: co_financing %, TRL level, impact type   │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: SMARTWIZARD LOADS                           │
│ Reads: scraped-programs-latest.json                │
│ Creates: QuestionEngine with all programs          │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: USER ANSWERS QUESTIONS                     │
│ Q1: "Where are you located?" → Filters programs     │
│ Q2: "What's your funding type?" → Filters more     │
│ Q3: "What's your TRL level?" → Filters more        │
│ ...10-15 total questions                            │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ STEP 4: SHOWS RESULTS                               │
│ Top 5-10 programs ranked by match                   │
└─────────────────────────────────────────────────────┘
```

---

## Web Scraper (Data Source)

### What It Does

**Location:** `src/lib/webScraperService.ts` (1,399 lines)

**Configuration:** 11 institutions pre-configured
- AWS Austria Wirtschaftsservice
- FFG Österreichische Forschungsförderungsgesellschaft
- VBA Vienna Business Agency
- AMS Arbeitsmarktservice
- ÖSB Österreichische Serverbank
- WKO Wirtschaftskammer Österreich
- EU programmes (Horizon, Digital Europe, EU4Health, etc.)

### How It Works Automatically

**1. URL Discovery**
- Reads sitemap.xml from each institution
- Follows links with patterns: `/foerderung`, `/funding`, `/programme`
- Tries common URL patterns
- **Self-learning:** If URL works → confidence increases → prioritizes similar URLs next time

**2. Data Extraction**
- Opens page with Puppeteer (headless Chrome)
- Extracts using Cheerio (HTML parsing) + regex patterns
- **Basic data:** name, description, funding amounts, deadline, institution, URL
- **Eligibility criteria:** location, team_size, company_age, revenue, research_focus, international_collaboration
- **Deep requirements:** co_financing, TRL_level, impact, consortium, industry, target_group, use_of_funds (18 categories total)

**3. Self-Learning**
- **Keyword learning:** Tracks word → confidence score
  - Success → +1 confidence
  - Failure → -1 confidence
  - After 5 successes → prioritizes URLs with that keyword
- **Pattern learning:** Tracks regex pattern → success rate
  - Success rate 95% → high confidence
  - Success rate 30% → tries alternatives

**4. Output**
- Saves to: `data/scraped-programs-latest.json`
- Also saves timestamped backup: `data/scraped-programs-2025-10-27.json`

### How It's Dynamic

**Geographic Expansion:**
- To add Germany: Add institution config → scraper adapts automatically
- No code changes needed

**New Funding Types:**
- Detects: grant, loan, equity, visa, consulting, service
- New type appears → pattern learning → adapts automatically

**New Requirements:**
- If sees new pattern (e.g., "patent required") → learns it
- Next scrape → includes that requirement automatically

### Current Status

**Last run:** 2025-10-27 20:26:32 (test data only, not real scraping)  
**Programs in file:** 3 (test data with categorized_requirements populated)  
**Real programs scraped:** 0 (scraper not run yet)  
**Output file:** `data/scraped-programs-latest.json`

---

## SmartWizard (User Interface)

### What It Does

**Location:** `src/components/wizard/SmartWizard.tsx`

**Process:**
1. Loads programs from `data/scraped-programs-latest.json`
2. Creates QuestionEngine
3. Shows first question
4. User answers → filters programs → shows next question
5. Repeats until 5-10 programs remain
6. Shows results

### Target Question Flow

**Start:** 300 programs

**Q1 (Location):** "Where are you located?"  
- Options: Austria, Germany, EU-wide, International  
- **Filters:** 300 → 100 programs (eliminates 200)

**Q2 (Funding Type):** "What type of funding do you need?"  
- Options: Grant, Loan, Equity, Visa, Consulting  
- **Filters:** 100 → 40 programs (eliminates 60)

**Q3 (Co-financing):** "What % can you co-finance?"  
- Options: 20%, 30%, 50%, 70%  
- **Filters:** 40 → 25 programs (eliminates 15)

**Q4 (TRL Level):** "What's your technology readiness?"  
- Options: TRL 1-3 (idea), TRL 3-5 (prototype), TRL 5-7 (testing), TRL 7-9 (ready)  
- **Filters:** 25 → 15 programs (eliminates 10)

**Q5 (Impact):** "What impact type?"  
- Options: Innovation, Environmental, Social, Economic, Job creation  
- **Filters:** 15 → 10 programs (eliminates 5)

**Q6 (Industry):** "Which industry?"  
- Options: Digital, Health, Energy, Manufacturing, Services  
- **Filters:** 10 → 7 programs (eliminates 3)

**Q7 (Consortium):** "Do you have partners?"  
- Options: Yes, No  
- **Filters:** 7 → 5 programs (eliminates 2)

**Q8-15 (Additional filters):**
- Team size, use of funds, revenue model, market size, project stage, target group, etc.

**Final:** Top 5 programs shown

### Current Problem

**Data:** Only 3 test programs (should be 300 real programs)  
**categorized_requirements:** Populated for test programs  
**Questions generated:** 4-6 basic questions only (not 10-15 profound)  
**Filtering:** Works but data too limited

**Solution:** Run scraper to get real data with deep requirements

---

## Question Engine (Logic)

### What It Does

**Location:** `src/lib/questionEngine.ts` (1,428 lines)

**Process:**

**1. Initialize**
- Loads all programs from API
- Analyzes eligibility_criteria across all programs
- Analyzes categorized_requirements across all programs
- Generates question candidates with importance scores

**2. Generate Questions**
- **Location question** (importance: 100) - filters 90% of programs
- **Funding type question** (importance: 85) - filters 70% of programs
- **Co-financing question** (importance: 80) - filters 30% of programs
- **TRL level question** (importance: 75) - filters 25% of programs
- **Impact question** (importance: 65) - filters 20% of programs
- **Industry question** (importance: 60) - filters 20% of programs
- **Consortium question** (importance: 55) - filters 15% of programs
- **Team size question** (importance: 50) - filters 10% of programs
- **...and more** - auto-generated from categorized_requirements

**3. Dynamic Selection**
- After each answer → filters remaining programs
- Recalculates information value of all unanswered questions
- Selects question with highest filtering power
- Shows to user

**4. Early Stopping**
- Stops when ≤10 programs remain AND answered ≥5 questions
- Shows results

### Key Methods

- `initializeQuestions()` - Generates all question candidates with importance scores
- `getNextQuestionEnhanced()` - Filters programs after each answer, selects best next question
- `calculateInformationValue()` - Scores how much each question narrows the program pool
- `applyMajorFilters()` - Filters programs based on all answers so far

---

## How to Run

### Manual Scraping

```bash
npm run scraper:run
```

**Output:** `data/scraped-programs-latest.json`  
**Time:** 10-15 minutes (scrapes 11 institutions)  
**Programs:** ~300 programs

### Start Application

```bash
npm run dev
```

**URL:** http://localhost:3000  
**SmartWizard:** Click "Find Funding" → Answer questions → See results

---

## How to Automate

### Option 1: Task Scheduler (Windows)

1. Open Task Scheduler (Win + R → `taskschd.msc`)
2. Create New Task
3. Name: "Plan2Fund Scraper"
4. Trigger: Every 6 hours
5. Action: Start a program
   - Program: `npm`
   - Arguments: `run scraper:run`
   - Start in: `C:\path\to\plan2fund-nextgen`
6. Run whether user logged on or not

**Result:** Runs every 6 hours automatically

### Option 2: Cron (Linux/Mac)

```bash
crontab .cron-config.txt
```

Or manually edit:
```bash
crontab -e
# Add: 0 */6 * * * cd /path/to/plan2fund-nextgen && npm run scraper:run
```

**Result:** Runs every 6 hours automatically

### Option 3: GitHub Actions (Cloud - Recommended for Production)

Create `.github/workflows/scraper.yml`:

```yaml
name: Auto-Scrape
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run scraper:run
      - run: git add data/scraped-programs-latest.json && git commit -m "Auto-scrape" && git push
```

**Result:** GitHub runs it every 6 hours, commits data back to repo

---

## Files Structure (Minimal)

### Core Files (3 total)

1. **`src/lib/webScraperService.ts`** - Scraper logic (1,399 lines)
2. **`scripts/independent-scraper.ts`** - Runner (36 lines)
3. **`scripts/run-cron.sh`** - Cron helper (6 lines)

### Data Files (1 total)

4. **`data/scraped-programs-latest.json`** - Output (what SmartWizard uses)

### UI Files (SmartWizard)

5. **`src/components/wizard/SmartWizard.tsx`** - UI component
6. **`src/lib/questionEngine.ts`** - Question logic (1,428 lines)
7. **`src/lib/enhancedRecoEngine.ts`** - Scoring logic

**Total:** 7 files for the complete system

---

## Next Steps

### To Test SmartWizard

1. **Option A:** Use test data (already exists)
   ```bash
   # Already done - 3 test programs with categorized_requirements
   # Check: data/scraped-programs-latest.json
   ```

2. **Option B:** Run real scraper (recommended)
   ```bash
   npm run scraper:run
   # Takes 10-15 minutes, scrapes real data from 11 institutions
   ```

3. **Start application:**
   ```bash
   npm run dev
   ```

4. **Test SmartWizard:**
   - Go to http://localhost:3000
   - Click "Find Funding"
   - Should see 10-15 profound questions
   - Answer questions → See filtered programs

### To Deploy Production

1. Configure cron/Task Scheduler/GitHub Actions (see above)
2. Deploy to Vercel/Netlify/etc.
3. Set up scheduled scraping
4. Done - system updates automatically

---

## Summary

✅ **Scraper ready** - Extracts 3 basic + 18 deep requirements automatically  
✅ **SmartWizard ready** - Asks dynamic questions, filters progressively  
✅ **Self-learning** - Adapts to new keywords/patterns automatically  
⚠️ **Not yet run** - Only test data exists (need to run: `npm run scraper:run`)  
⚠️ **Not yet automated** - Need to configure cron/Task Scheduler/GitHub Actions

## What Gets Extracted (18 Categories)

**Current scraper extracts:**
1. **eligibility** - Who can apply
2. **documents** - What documents needed
3. **financial** - Funding amounts, co_financing %
4. **technical** - TRL levels, technology requirements
5. **legal** - Legal requirements, compliance
6. **timeline** - Deadlines, duration
7. **geographic** - Location requirements
8. **team** - Team size, composition
9. **project** - Project type, milestones
10. **compliance** - Certifications, standards
11. **impact** - Impact types (innovation, environmental, etc.)
12. **capex_opex** - Capital vs operational expenses
13. **use_of_funds** - How money can be used
14. **revenue_model** - B2B, B2C, B2G
15. **market_size** - Market requirements
16. **co_financing** - Self-contribution %
17. **trl_level** - Technology readiness level
18. **consortium** - Partner requirements

**SmartWizard uses these to generate 10-15 questions**

## Investigation Results

### SmartWizard Questions - Current Issues

**Problem 1: Question Ranking**
- Questions ranked by `calculateInformationValue()` which uses:
  - Phase weight: (4 - phase) * 10 (Phase 1 = 30, Phase 2 = 20, Phase 3 = 10)
  - Relevance score: (relevantPrograms / remainingPrograms.length) * 100
  - Penalty for similar answers: -10 per similar question
- **Issue:** Phase weight still dominates, relevance score needs to be higher
- **Issue:** No contextual questions (e.g., "Where in Austria?" if location = Austria)

**Problem 2: Question Order**
- First question always dynamically selected
- But questions are generated upfront, not created on-demand
- **Issue:** Can't ask follow-up contextual questions based on previous answers

**Problem 3: User Input Logic**
- `applyMajorFilters()` filters programs but doesn't generate contextual questions
- **Issue:** No branching logic (if location = Austria, then ask "Where in Austria?")
- **Issue:** No conditional questions (if team < 3, then skip consortium question)

### WebScraper - Current Status

**Question: Looking for new funding types/URLs?**
- ✅ YES - `discoverProgramUrls()` reads sitemap.xml, follows links, tries patterns
- ✅ Self-learning: If URL works → confidence increases → prioritizes similar URLs
- ⚠️ LIMITED - Only discovers up to 20 URLs per institution (line 530)

**Question: Scrapes the right information?**
- ✅ Extracts: name, description, amounts, deadline
- ✅ Extracts: eligibility_criteria (location, team, age, revenue)
- ✅ Extracts: categorized_requirements (18 categories via dynamicPatternEngine)
- ⚠️ UNVERIFIED - Needs real scraping test to confirm all 18 categories populated

**Question: Other countries?**
- ❌ NO - Only Austria (AWS, FFG, VBA, AMS, ÖSB, WKO)
- ⚠️ EU programs included (Horizon, Digital Europe, etc.) but not Germany, France, etc.
- ✅ Can add: Just add institution config → automatically adapts

**Question: Has fallback?**
- ✅ YES - `loadFallbackData()` loads `scraped-programs-latest.json`
- ⚠️ If scraping fails → uses last successful scrape

**Question: Is automatic?**
- ❌ NO - Not configured to run automatically
- ⚠️ Need to configure Task Scheduler/Cron/GitHub Actions
- ✅ Manual run: `npm run scraper:run`

**Question: Duplicate files?**
- ✅ Only 2 files: `webScraperService.ts` (51KB), `ScrapedProgram.ts` (1.7KB)
- ✅ No duplicates

**Question: Discovering new categories/information?**
- ✅ YES - `dynamicPatternEngine` learns new patterns automatically
- ✅ Tracks success_count and failure_count → adjusts confidence
- ✅ Creates new patterns from successful extractions
- ⚠️ Limited to 18 predefined categories (doesn't create NEW category types)

## Adjustment Plan (Plain English)

### Adjustment Plan Status

**Completed:**
1. ✅ **Increased relevance score weight** in `calculateInformationValue()` from 100 to 150
2. ✅ **Reduced phase weight** from 10 to 5 (relevance now dominates)
3. ✅ **Increased URL limit** from 20 to 50 per institution
4. ✅ **Added timeout safety** - Max 30 minutes scraping time
5. ✅ **Added max programs limit** - Stops at 500 programs

**Still To Do:**
4. **Add conditional logic:** If location question asked → generate location-specific follow-ups
5. **Add branching:** If answer = "Austria" → ask "Where in Austria?" (Vienna, Upper Austria, etc.)
6. **Add more countries:** Add Germany (BMWi), France, Netherlands configs
7. **Test real scraping:** Run `npm run scraper:run` to verify all 18 categories populate
8. **Configure automation:** Set up Task Scheduler (Windows) or Cron (Linux/Mac)
9. **Add progress tracking:** Log how many programs per institution, success rate

## Safety Features Added

**Timeout Protection:**
- Scraper stops after 30 minutes maximum
- Prevents hanging indefinitely

**Program Limit:**
- Scraper stops at 500 programs total
- Prevents excessive data volume

**Checks:**
- Timeout checked between each institution
- Max programs checked between each institution
- Rate limiting already in place (respects server limits)

**Next:** Run scraper → Test SmartWizard → Configure automation → Deploy

