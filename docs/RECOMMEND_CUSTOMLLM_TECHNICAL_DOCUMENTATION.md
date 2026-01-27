# Recommend.ts and CustomLLM Technical Documentation

## Overview
This document provides comprehensive technical details about the recommendation system implementation, including how `recommend.ts` works, the role of `customLLM.ts`, current parsing logic, and exact requirements processing.

## System Architecture

### High-Level Flow
```
User Answers → recommend.ts API → LLM Processing → Program Generation → Response Formatting
     ↓              ↓                   ↓                ↓                   ↓
Questionnaire    Validation        CustomLLM/OpenAI   JSON Parsing       Client Consumption
```

## recommend.ts Detailed Analysis

### Core Functionality
The `recommend.ts` file serves as the main API endpoint for program recommendations, handling:
- User answer validation
- LLM orchestration (custom/fallback)
- Response parsing and sanitization
- Program data structuring
- Error handling and retries

### Required Fields Validation
```typescript
const REQUIRED_FIELDS = ['location', 'company_type', 'funding_amount', 'company_stage'];
```

**Validation Logic:**
- Checks for presence of all required fields
- Rejects requests with missing/null/empty values
- Returns 400 error with list of missing fields

### Current Answer Parsing

#### Profile Construction
The system builds a user profile from these answer fields:

```typescript
const profile = [
  answers.location && `Location: ${answers.location}`,
  answers.company_type && `Company type: ${answers.company_type}`,
  answers.company_stage && `Company stage: ${answers.company_stage}`,
  answers.funding_amount && `Funding need: €${answers.funding_amount}`,
  answers.industry_focus && `Industry: ${Array.isArray(answers.industry_focus) ? answers.industry_focus.join(', ') : answers.industry_focus}`,
  answers.co_financing && `Co-financing: ${answers.co_financing === 'co_no' ? 'ONLY grants/subsidies' : 'can accept loans/equity'}`,
].filter(Boolean).join('\n');
```

#### Funding Preference Inference
```typescript
const fundingPreference = {
  allowMix: answers.co_financing !== 'co_no',
};
```

### LLM Prompt Engineering

#### Base Instructions Structure
The system generates dynamic prompts with these components:

1. **User Profile Section**
   - Location specificity
   - Company type and stage
   - Funding amount requirements
   - Industry focus
   - Co-financing capability

2. **Critical Matching Rules**
   ```
   1. Location: Must be available in user's location or EU-wide
   2. Organisation stage: Must accept user's stage (allow adjacent stages)
   3. Funding amount: Accept programs with range €X/3 to €X*3 (±200% tolerance)
   4. Co-financing: If user cannot provide co-financing, ONLY grants/subsidies/support
   5. Revenue status: Pre-revenue → grants/angel/crowdfunding; Early revenue → all except large VC; Established → all types
   ```

3. **Funding Type Classification**
   - **Equity**: angel_investment, venture_capital, crowdfunding, equity
   - **Loans**: bank_loan, leasing, micro_credit, repayable_advance, loan
   - **Grants**: grant
   - **Other**: guarantee, visa_application, subsidy, convertible

4. **Program Requirements**
   - Real program names only (rejects generic names)
   - 2-3 sentence descriptions
   - All fields at root level (not nested)

### JSON Response Structure

#### Expected Output Format
```json
{
  "programs": [{
    "id": "string",
    "name": "string",
    "website": "https://example.com",
    "description": "2-3 sentences",
    "funding_types": ["grant","loan"],
    "funding_amount_min": 5000,
    "funding_amount_max": 20000,
    "currency": "EUR",
    "location": "Austria",
    "region": "Austria",
    "company_type": "startup",
    "company_stage": "inc_lt_6m",
    "program_focus": ["digital","innovation"],
    "co_financing_required": false,
    "co_financing_percentage": null,
    "deadline": "2024-12-31",
    "open_deadline": false,
    "use_of_funds": ["product_development","hiring"],
    "impact_focus": ["environmental","social"],
    "organization": "FFG",
    "typical_timeline": "2-3 months",
    "competitiveness": "medium",
    "categorized_requirements": {
      "documents": [{"value": "Business plan", "description": "...", "format": "pdf", "required": true, "requirements": []}],
      "project": [{"value": "Project description", "description": "...", "required": true, "requirements": "...", "type": "project_details"}],
      "financial": [{"value": "Financial projections", "description": "...", "required": true, "requirements": "...", "type": "repayment_terms"}],
      "technical": [{"value": "Technical specifications", "description": "...", "required": false, "requirements": "...", "type": "trl_level"}]
    }
  }]
}
```

### Response Processing Pipeline

#### 1. Sanitization Process
```typescript
function sanitizeLLMResponse(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json/gi, '```');
  cleaned = cleaned.replace(/```/g, '');
  // Remove explanatory prefixes
  cleaned = cleaned.replace(/^Here is the JSON requested:\s*/i, '');
  cleaned = cleaned.replace(/^Here is .*?JSON:\s*/i, '');
  cleaned = cleaned.replace(/^Response:\s*/i, '');
  // Extract JSON content
  const firstCurly = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  // ... extraction logic
  return cleaned.trim();
}
```

#### 2. Generic Program Filtering
Rejects programs with these characteristics:
- Names containing "general category/program/grant/loan/funding"
- Names starting with "general" and under 30 characters
- Names shorter than 5 characters
- Missing program names

#### 3. Data Structure Validation
Validates and transforms program data:
- Ensures required fields exist
- Maps metadata fields to root level
- Sets default values for missing fields
- Standardizes funding type arrays

## CustomLLM Implementation Details

### Provider Support Matrix

| Provider | Endpoint Pattern | Authentication | Special Handling |
|----------|------------------|----------------|------------------|
| **Google Gemini** | `generativelanguage.googleapis.com` | `x-goog-api-key` | Thoughts token overhead, schema enforcement |
| **OpenRouter** | `openrouter.ai/api/v1/chat/completions` | `Authorization: Bearer` | Requires HTTP-Referer header |
| **Groq** | `api.groq.com/openai/v1/chat/completions` | `Authorization: Bearer` | OpenAI-compatible |
| **HuggingFace** | `api-inference.huggingface.co/models/*` | `Authorization: Bearer` | Deprecated format |

### Configuration Parameters

#### Environment Variables
```bash
CUSTOM_LLM_ENDPOINT=https://api.openrouter.ai/api/v1/chat/completions
CUSTOM_LLM_API_KEY=your-api-key-here
CUSTOM_LLM_MODEL=openrouter/auto
CUSTOM_LLM_TIMEOUT=90000  # 90 seconds
```

#### Timeout Handling
- **Default**: 90 seconds configurable via `CUSTOM_LLM_TIMEOUT`
- **Implementation**: Uses AbortController for request cancellation
- **Fallback**: Automatically switches to OpenAI when custom LLM fails

### Gemini-Specific Implementation

#### Token Management
```typescript
// Gemini uses "thoughts" tokens internally which count against maxOutputTokens
// We need to increase the limit significantly to account for this overhead
geminiMaxTokens = request.maxTokens 
  ? Math.max(request.maxTokens + 10000, 16000) // Add 10k buffer for thoughts
  : 16000; // Default to 16k for Gemini
```

#### Schema Enforcement
Uses response schema to force structured output:
```typescript
responseSchema: {
  type: 'object',
  properties: {
    programs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          website: { type: 'string' },
          // ... other required fields
        },
        required: ['id', 'name', 'funding_types']
      }
    }
  },
  required: ['programs']
}
```

### Error Handling and Fallbacks

#### Retry Logic
```typescript
// Up to 3 attempts with exponential backoff
const maxAttempts = 3;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  // ... attempt logic
  if (attempt < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
  }
}
```

#### Provider Fallback Chain
1. **Primary**: Custom LLM (if configured)
2. **Secondary**: OpenAI (if API key available)
3. **Failure**: Returns error after all attempts exhausted

## Current Requirements Processing

### Exact Field Requirements

#### Mandatory Fields (4 required)
1. **location**: User's geographical location/region
2. **company_type**: Organization type (startup, sme, research, etc.)
3. **funding_amount**: Required funding amount in EUR
4. **company_stage**: Business development stage

#### Optional Fields (Enhance Matching)
1. **industry_focus**: Sector specialization
2. **co_financing**: Ability to provide co-financing
3. **organisation_type**: Legal structure
4. **funding_intent**: Purpose of funding

### Requirement Categories Parsing

#### Categorized Requirements Structure
The system expects requirements organized into 4 categories:

1. **Documents**
   ```json
   {
     "value": "Business plan",
     "description": "Detailed business plan document",
     "format": "pdf",
     "required": true,
     "requirements": []
   }
   ```

2. **Project**
   ```json
   {
     "value": "Project description",
     "description": "Technical project specifications",
     "required": true,
     "requirements": "...",
     "type": "project_details"
   }
   ```

3. **Financial**
   ```json
   {
     "value": "Financial projections",
     "description": "3-year financial forecast",
     "required": true,
     "requirements": "...",
     "type": "repayment_terms"
   }
   ```

4. **Technical**
   ```json
   {
     "value": "Technical specifications",
     "description": "TRL level documentation",
     "required": false,
     "requirements": "...",
     "type": "trl_level"
   }
   ```

### Matching Algorithm Logic

#### Location Matching
- Exact location match preferred
- EU-wide programs accepted for any EU location
- Regional programs matched to user's region

#### Amount Tolerance
- **Acceptable Range**: €X/3 to €X*3 (±200% tolerance)
- Allows flexibility for programs with flexible funding ranges
- Prevents rejection of suitable programs due to exact amount mismatches

#### Stage Compatibility
- Direct stage matching
- Adjacent stage acceptance (e.g., early-stage user can apply to seed programs)
- Revenue status consideration (pre-revenue vs established)

## Performance and Monitoring

### Metrics Tracked
- **Latency**: Response time for each provider
- **Token Usage**: Prompt, completion, and total tokens
- **Success Rate**: Percentage of successful generations
- **Retry Count**: Number of attempts needed for success
- **Provider Distribution**: Custom vs OpenAI usage

### Debugging Information
In non-production environments, extensive logging includes:
- LLM raw response previews (first 2000 characters)
- Program parsing counts and validation results
- Error details and retry attempts
- Token usage statistics

## Known Limitations and Future Improvements

### Current Limitations
1. **Generic Program Detection**: Relies on string matching which may miss some generic programs
2. **Amount Tolerance**: Fixed ±200% may not suit all program types
3. **Stage Matching**: Adjacent stage logic could be more sophisticated
4. **Requirement Parsing**: Categorized requirements depend heavily on LLM quality

### Potential Enhancements
1. **Program Catalog Integration**: Combine LLM generation with existing program database
2. **Advanced Matching**: Implement scoring algorithms for better program ranking
3. **Caching Layer**: Cache frequent queries to reduce LLM calls
4. **Multi-language Support**: Extend to non-English program sources
5. **Real-time Updates**: Integrate with live program databases

---
*Last Updated: January 27, 2026*
*Author: Technical Documentation Team*
*Version: 1.0*