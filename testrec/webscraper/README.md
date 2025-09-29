# Plan2Fund Web Scraper

## Overview
This web scraper extracts structured data from Austrian/EU funding programs to build the intelligence base for Plan2Fund's recommendation engine and editor.

## What It Scrapes

### Target Programs
- **aws (Austria Wirtschaftsservice)** - Preseed, Guarantees, Equity
- **FFG (Austrian Research Promotion Agency)** - Research programs
- **Wirtschaftsagentur Wien** - Innovation programs
- **Banks** - Loan programs
- **EU Programs** - Horizon Europe, EIC, Erasmus+

### Data Extracted
1. **Basic Program Info** - Name, type, funding amount, duration
2. **Eligibility Requirements** - Who can apply, what criteria must be met
3. **Document Requirements** - What documents are needed
4. **Financial Requirements** - Funding limits, co-financing, terms
5. **Technical Requirements** - TRL levels, innovation criteria
6. **Decision Tree Questions** - Questions to ask users
7. **Editor Sections** - Business plan templates
8. **Readiness Criteria** - How to check completeness

## Setup

### 1. Install Dependencies
```bash
cd testrec/webscraper
npm install
```

### 2. Run the Scraper
```bash
# Scrape all programs
npm run scrape

# Scrape specific source
npm run scrape:aws
npm run scrape:ffg

# Scrape with options
node program-scraper.js --source=aws --output=aws_programs.json
```

### 3. Check Results
```bash
# View scraped data
cat scraped-data/scraped_programs.json | jq '.[0]'

# Check scraping stats
cat scraped-data/scraping_report.json
```

## How It Works

### 1. Multi-Source Scraping
- **Puppeteer** for JavaScript-heavy sites
- **Cheerio** for HTML parsing
- **Natural** for text processing
- **PDF-parse** for document extraction

### 2. Data Extraction
- **Structured Data** - JSON-LD, microdata, schema.org
- **Semi-Structured** - HTML tables, lists, forms
- **Unstructured** - Text parsing with NLP
- **PDFs** - Document parsing for guidelines

### 3. Intelligence Processing
- **LLM Integration** - For content understanding
- **NLP Processing** - For requirement extraction
- **Validation** - For data quality
- **Deduplication** - For duplicate programs

## Output Structure

### Scraped Program Data
```json
{
  "programId": "aws_preseed_innovative_solutions",
  "programName": "aws Preseed – Innovative Solutions",
  "programType": "grant",
  "jurisdiction": "AT",
  "sourceUrl": "https://www.aws.at/en/aws-preseed-innovative-solutions/",
  "fundingAmount": {
    "min": 0,
    "max": 100000,
    "currency": "EUR"
  },
  "projectDuration": {
    "min": 6,
    "max": 12,
    "unit": "months"
  },
  "eligibility": [...],
  "documents": [...],
  "financial": [...],
  "technical": [...],
  "decisionTreeQuestions": [...],
  "editorSections": [...],
  "readinessCriteria": [...]
}
```

## Integration with Plan2Fund

### 1. Decision Tree Generation
The scraper generates questions based on program requirements:
```javascript
// Generated questions
{
  "id": "q_company_stage",
  "question": "What is your company stage?",
  "type": "single",
  "options": [
    { "value": "PRE_COMPANY", "label": "Just an idea or team forming" },
    { "value": "INC_LT_6M", "label": "Recently started (less than 6 months)" }
  ]
}
```

### 2. Editor Template Generation
The scraper creates program-specific business plan sections:
```javascript
// Generated editor sections
{
  "id": "executive_summary",
  "title": "Executive Summary",
  "template": "Our business, [PROJECT_NAME], is seeking [FUNDING_AMOUNT] in grant funding...",
  "prefillData": {
    "PROJECT_NAME": "answers.business_name",
    "FUNDING_AMOUNT": "answers.funding_amount"
  }
}
```

### 3. Readiness Check Generation
The scraper creates completeness criteria:
```javascript
// Generated readiness criteria
{
  "id": "criterion_1",
  "title": "Company Stage Eligibility",
  "description": "Verify company is within 6 months of registration",
  "checkType": "validation",
  "weight": 1.0
}
```

## Manual Verification Process

### 1. Review Scraped Data
- Check accuracy of extracted information
- Verify funding amounts and deadlines
- Validate eligibility criteria
- Confirm document requirements

### 2. Cross-Check with Official Sources
- Visit official program websites
- Compare with application forms
- Verify contact information
- Check for recent updates

### 3. Quality Control
- Flag incomplete programs
- Note extraction errors
- Update missing information
- Validate data structure

### 4. Integration Testing
- Test decision tree questions
- Verify editor templates
- Check readiness criteria
- Validate prefill data

## Next Steps

### Phase 1: Basic Scraping (Week 1)
1. **Setup scraper** - Install dependencies and test
2. **Scrape aws programs** - Start with most important source
3. **Manual verification** - Cross-check with official sources
4. **Fix extraction issues** - Improve parsing accuracy

### Phase 2: Enhanced Scraping (Week 2)
1. **Add more sources** - FFG, Wirtschaftsagentur, banks
2. **Improve extraction** - Better NLP and pattern matching
3. **Add LLM processing** - For better content understanding
4. **Validate data quality** - Comprehensive testing

### Phase 3: Integration (Week 3)
1. **Build decision tree** - Generate questions from requirements
2. **Create editor templates** - Program-specific sections
3. **Implement readiness check** - Completeness validation
4. **Test with real users** - Validate the entire flow

## Troubleshooting

### Common Issues
1. **Site changes** - Update selectors and parsing logic
2. **Rate limiting** - Add delays and retry logic
3. **JavaScript errors** - Use different browser settings
4. **Data quality** - Improve extraction patterns

### Debugging
```bash
# Run with debug output
DEBUG=* node program-scraper.js

# Test specific program
node program-scraper.js --url="https://www.aws.at/en/aws-preseed-innovative-solutions/"

# Check extraction quality
node test-scraper.js --program="aws_preseed_innovative_solutions"
```

## Files Structure
```
testrec/webscraper/
├── package.json              # Dependencies and scripts
├── program-scraper.js        # Main scraper implementation
├── test-scraper.js          # Testing and validation
├── scraped-data/            # Output directory
│   ├── scraped_programs.json
│   └── scraping_report.json
└── README.md                # This file
```

This scraper provides the foundation for building an intelligent, data-driven recommendation system that can adapt to new programs and requirements automatically.
