# Plan2Fund Enhancement System

This folder contains the enhanced components that will eventually replace the current static system.

## 🗂️ Structure

```
testrec/
├── webscraper/           # Web scraper for program data collection
├── requirements/         # Enhanced requirements schema
└── manual-collection/    # Tools for manual data collection
```

## 🚀 Quick Start

### 1. Test the Web Scraper
```bash
cd testrec/webscraper
npm install
npm run quick-test    # See what data was scraped
npm run scrape        # Run the scraper
```

### 2. Check Requirements Schema
```bash
# Look at the enhanced requirements structure
cat testrec/requirements/sample-requirements.json
```

### 3. Manual Collection (if needed)
```bash
# Open the HTML tool for manual data collection
open testrec/manual-collection/requirements-collector.html
```

## 📊 What This System Does

### Current System (in main codebase):
- ❌ Static JSON data (214 programs)
- ❌ Manual updates required
- ❌ Basic rule-based scoring
- ❌ Fixed question set

### Enhanced System (in testrec/):
- ✅ **Web scraper** collects 500+ programs automatically
- ✅ **LLM-powered extraction** for requirements
- ✅ **Real-time updates** when programs change
- ✅ **Enhanced scoring** (ML + Rules + LLM)
- ✅ **Dynamic questions** based on requirements

## 🎯 Next Steps

1. **Test the scraper** - See what data it collects
2. **Review requirements schema** - Understand the new data structure
3. **Choose integration approach** - Gradual vs. complete replacement
4. **Migrate to main codebase** - Once you're satisfied with the results

## 🔧 Commands

```bash
# Test scraper data
npm run quick-test

# Run full scraper
npm run scrape

# Test specific source
npm run scrape:aws
npm run scrape:ffg
```

This system will transform Plan2Fund from a static platform to a dynamic, AI-powered funding recommendation engine.
