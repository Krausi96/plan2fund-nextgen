# Plan2Fund Web Scraper Architecture

## Overview
Based on the strategic document, we need to scrape Austrian/EU funding programs to build:
1. **Program Database** - Structured program information
2. **Requirements Intelligence** - What each program requires
3. **Decision Tree Data** - Questions to ask users
4. **Editor Templates** - Program-specific business plan sections
5. **Readiness Criteria** - How to check completeness

## Target Programs & Sources

### Primary Sources (Austria)
1. **aws (Austria Wirtschaftsservice)**
   - aws.at/en/aws-preseed-innovative-solutions/
   - aws.at/en/aws-preseed-seedfinancing-deep-tech/
   - aws.at/en/aws-guarantee/
   - aws.at/en/aws-export-guarantee/

2. **FFG (Austrian Research Promotion Agency)**
   - ffg.at/en/programmes
   - ffg.at/en/basic-research-programme
   - ffg.at/en/innovation-programmes

3. **Wirtschaftsagentur Wien**
   - wirtschaftsagentur.at/en/funding/
   - wirtschaftsagentur.at/en/innovation-scheque/

4. **Banks (Loan Programs)**
   - raiffeisen.at/en/business/loans
   - sparkasse.at/en/business/loans
   - uniqa.at/en/business/insurance

5. **Equity/Investment**
   - speedinvest.com/portfolio
   - aws.at/en/aws-equity-investment/
   - aws.at/en/aws-venture-capital/

### EU Sources
1. **Horizon Europe**
   - ec.europa.eu/info/research-and-innovation/funding/funding-opportunities
   - ec.europa.eu/info/funding-tenders/opportunities/portal

2. **EIC (European Innovation Council)**
   - eic.ec.europa.eu/eic-funding-opportunities

3. **Erasmus+**
   - ec.europa.eu/programmes/erasmus-plus/

## Data Structure to Extract

### 1. Basic Program Information
```json
{
  "programId": "aws_preseed_innovative_solutions",
  "programName": "aws Preseed – Innovative Solutions",
  "programType": "grant",
  "jurisdiction": "AT",
  "sourceUrl": "https://www.aws.at/en/aws-preseed-innovative-solutions/",
  "fundingAmount": {
    "min": 10000,
    "max": 100000,
    "currency": "EUR"
  },
  "projectDuration": {
    "min": 6,
    "max": 12,
    "unit": "months"
  },
  "deadlines": {
    "submission": "ongoing",
    "nextDeadline": "2025-03-31"
  },
  "targetPersonas": ["solo", "sme"],
  "tags": ["innovation", "startup", "non-dilutive"]
}
```

### 2. Eligibility Requirements
```json
{
  "eligibility": [
    {
      "id": "elig_1",
      "category": "company_stage",
      "type": "boolean",
      "title": "Natural person or company ≤6 months after registration",
      "description": "Applicant must be a natural person (team) or a company registered no more than 6 months ago",
      "isRequired": true,
      "priority": "critical",
      "validationRules": [
        {
          "type": "required",
          "message": "This is a critical eligibility requirement"
        }
      ],
      "examples": ["GmbH registered 3 months ago", "Einzelunternehmen", "Team of individuals"],
      "guidance": "Check company registration date or team formation date"
    }
  ]
}
```

### 3. Document Requirements
```json
{
  "documents": [
    {
      "id": "doc_1",
      "category": "business_plan",
      "type": "document",
      "title": "Business Plan",
      "description": "Comprehensive business plan following program guidelines",
      "isRequired": true,
      "priority": "critical",
      "format": "PDF",
      "length": "15-25 pages",
      "sections": ["executive_summary", "project_description", "financial_projections"],
      "guidance": "Use program-specific template and guidelines"
    }
  ]
}
```

### 4. Financial Requirements
```json
{
  "financial": [
    {
      "id": "fin_1",
      "category": "funding_amount",
      "type": "numeric",
      "title": "Funding Amount",
      "description": "Requested funding amount (max €100,000)",
      "isRequired": true,
      "priority": "critical",
      "validationRules": [
        {
          "type": "max",
          "value": 100000,
          "message": "Maximum funding amount is €100,000"
        }
      ],
      "coFinancing": {
        "required": true,
        "percentage": 20,
        "description": "20% co-financing required"
      }
    }
  ]
}
```

### 5. Decision Tree Questions
```json
{
  "decisionTreeQuestions": [
    {
      "id": "q_company_stage",
      "requirementId": "elig_1",
      "question": "What is your company stage?",
      "type": "single",
      "options": [
        { "value": "PRE_COMPANY", "label": "Just an idea or team forming" },
        { "value": "INC_LT_6M", "label": "Recently started (less than 6 months)" }
      ],
      "validation": [
        {
          "type": "required",
          "message": "Company stage is required"
        }
      ],
      "followUpQuestions": [],
      "skipConditions": []
    }
  ]
}
```

### 6. Editor Sections
```json
{
  "editorSections": [
    {
      "id": "executive_summary",
      "title": "Executive Summary",
      "required": true,
      "template": "Our business, [PROJECT_NAME], is seeking [FUNDING_AMOUNT] in funding to [PROJECT_GOAL].",
      "guidance": "Keep concise but compelling. Highlight innovation and impact.",
      "requirements": ["elig_1", "elig_2", "fin_1"],
      "prefillData": {
        "PROJECT_NAME": "answers.business_name",
        "FUNDING_AMOUNT": "answers.funding_amount",
        "PROJECT_GOAL": "answers.project_goal"
      }
    }
  ]
}
```

## Scraping Strategy

### 1. Multi-Source Scraping
- **Primary Sources**: Official program websites
- **Secondary Sources**: News articles, press releases
- **Tertiary Sources**: Social media, forums (for updates)

### 2. Data Extraction Methods
- **Structured Data**: JSON-LD, microdata, schema.org
- **Semi-Structured**: HTML tables, lists, forms
- **Unstructured**: Text parsing with NLP
- **PDFs**: Document parsing for guidelines

### 3. Content Types to Extract
- **Program Descriptions**: What the program does
- **Eligibility Criteria**: Who can apply
- **Application Requirements**: What documents are needed
- **Financial Information**: Amounts, rates, terms
- **Timeline Information**: Deadlines, duration
- **Contact Information**: How to apply
- **Success Stories**: Examples of funded projects

### 4. Update Strategy
- **Daily Checks**: For deadline changes
- **Weekly Scans**: For new programs
- **Monthly Reviews**: For major updates
- **Manual Verification**: Quarterly quality checks

## Technical Implementation

### 1. Scraping Stack
- **Puppeteer**: For JavaScript-heavy sites
- **Cheerio**: For HTML parsing
- **Playwright**: For complex interactions
- **PDF-parse**: For document extraction
- **Natural**: For text processing

### 2. Data Processing
- **LLM Integration**: For content understanding
- **NLP Processing**: For requirement extraction
- **Validation**: For data quality
- **Deduplication**: For duplicate programs

### 3. Storage
- **PostgreSQL**: For structured data
- **MongoDB**: For flexible documents
- **Redis**: For caching
- **S3**: For file storage

### 4. Monitoring
- **Change Detection**: When programs update
- **Error Tracking**: Failed scrapes
- **Performance**: Scraping speed
- **Quality Metrics**: Data completeness

## Next Steps

1. **Start with aws programs** - Most important for your users
2. **Build basic scraper** - Extract structured data
3. **Add LLM processing** - Understand requirements
4. **Manual verification** - Cross-check with official sources
5. **Build decision tree** - Generate questions from requirements
6. **Create editor templates** - Program-specific sections
7. **Implement readiness check** - Completeness validation

This approach gives you:
- ✅ **Comprehensive data** - All Austrian/EU programs
- ✅ **Structured requirements** - Machine-readable format
- ✅ **Dynamic decision tree** - Questions generated from data
- ✅ **Smart editor** - Program-specific templates
- ✅ **Automated updates** - Always current information
