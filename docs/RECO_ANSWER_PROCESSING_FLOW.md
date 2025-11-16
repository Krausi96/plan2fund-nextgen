# Reco Answer Processing Flow

## Overview
This document explains how user answers from the Q&A system are processed, normalized, matched, and scored to generate program recommendations.

## File Structure

### Core Files

1. **`features/reco/components/ProgramFinder.tsx`**
   - **Purpose**: UI component that collects user answers
   - **Key Functions**:
     - Collects answers from Q&A form
     - Sends answers to `/api/programs/recommend`
     - Displays results to user
   - **Answer Collection**: 
     - Single-select, multi-select, range inputs
     - Handles "other" text inputs
     - Stores answers in `answers` state object

2. **`pages/api/programs/recommend.ts`**
   - **Purpose**: API endpoint that processes answers and generates programs
   - **Key Functions**:
     - Receives user answers from frontend
     - Generates programs using LLM (`generateProgramsWithLLM`)
     - Filters programs using `matchesAnswers()` function
     - Returns programs with categorized requirements
   - **Processing Steps**:
     1. Receives `UserAnswers` object
     2. Calls `generateProgramsWithLLM()` to create programs
     3. For each program, extracts requirements using `extractWithLLM()`
     4. Filters programs using `matchesAnswers()` (normalized matching)
     5. Returns programs array

3. **`features/reco/engine/normalization.ts`**
   - **Purpose**: Normalizes user answers and extracted requirements to common format
   - **Key Functions**:
     - `normalizeLocationAnswer()` - Converts location strings to normalized format
     - `normalizeCompanyTypeAnswer()` - Normalizes company types
     - `normalizeCompanyStageAnswer()` - Handles company stage (string or months)
     - `normalizeFundingAmountAnswer()` - Normalizes funding amounts
     - `normalizeIndustryAnswer()` - Normalizes industry focus
     - `normalizeCoFinancingAnswer()` - Normalizes co-financing requirements
     - Matching functions: `matchLocations()`, `matchCompanyTypes()`, etc.
   - **Why Normalization?**
     - User answers: "Austria", "Österreich", "AT" → all become `{countries: ['austria'], scope: 'national'}`
     - Extracted requirements: "Must be based in Austria" → same normalized format
     - Enables reliable matching between user answers and program requirements

4. **`features/reco/engine/enhancedRecoEngine.ts`**
   - **Purpose**: Scores and ranks programs based on user answers
   - **Key Functions**:
     - `scoreProgramsEnhanced()` - Main scoring function
     - Calculates match scores (0-100) for each program
     - Generates explanations: `eligibility`, `confidence`, `reason`, `matchedCriteria`, `gaps`
   - **Scoring Process**:
     1. Normalizes user answers
     2. For each program, checks each requirement category
     3. Calculates weighted score based on `QUESTION_WEIGHTS`
     4. Generates detailed explanations for why program matches/doesn't match
     5. Returns `EnhancedProgramResult[]` with scores and explanations

5. **`features/reco/engine/llmExtract.ts`**
   - **Purpose**: Extracts structured requirements from program text using LLM
   - **Key Functions**:
     - `extractWithLLM()` - Extracts 15 categories of requirements from HTML/text
     - Converts unstructured program descriptions into `categorized_requirements`
   - **Extraction Categories**:
     - Geographic (location requirements)
     - Eligibility (company type, stage, size)
     - Financial (funding amounts, co-financing)
     - Project (industry focus, use of funds)
     - Timeline (deadlines, duration)
     - Impact (environmental, social, economic)
     - And 9 more categories...

## Answer Processing Flow

### Step 1: Answer Collection (ProgramFinder.tsx)
```typescript
// User answers questions
answers = {
  location: "austria",
  company_type: "startup",
  company_stage: 12, // months
  company_stage_classified: "launch_stage",
  funding_amount: 500000,
  industry_focus: ["digital", "sustainability"],
  // ... more answers
}
```

### Step 2: API Request (ProgramFinder.tsx → recommend.ts)
```typescript
POST /api/programs/recommend
Body: {
  answers: answers,
  max_results: 20
}
```

### Step 3: Program Generation (recommend.ts)
```typescript
// Generate programs using LLM
programs = await generateProgramsWithLLM(answers, maxPrograms);

// For each program, extract detailed requirements
for (program of programs) {
  extracted = await extractWithLLM({
    text: programDescription,
    url: program.url
  });
  program.categorized_requirements = extracted.categorized_requirements;
}
```

### Step 4: Normalization (normalization.ts)
```typescript
// Normalize user answers
userLocation = normalizeLocationAnswer("austria");
// Returns: {countries: ['austria'], scope: 'national'}

userCompanyType = normalizeCompanyTypeAnswer("startup");
// Returns: {primary: 'startup', aliases: ['new company', 'tech startup']}

// Normalize extracted requirements
extractedLocation = normalizeLocationExtraction("Must be based in Austria");
// Returns: {countries: ['austria'], scope: 'national'}

// Match normalized values
if (matchLocations(userLocation, extractedLocation)) {
  // Match found!
}
```

### Step 5: Filtering (recommend.ts → matchesAnswers())
```typescript
// Check if program matches user answers
function matchesAnswers(extracted, answers) {
  // Location match (normalized)
  userLocation = normalizeLocationAnswer(answers.location);
  extractedLocation = normalizeLocationExtraction(extracted.geographic);
  if (!matchLocations(userLocation, extractedLocation)) {
    return false; // Critical: location must match
  }
  
  // Company type match (normalized)
  userType = normalizeCompanyTypeAnswer(answers.company_type);
  extractedType = normalizeCompanyTypeExtraction(extracted.eligibility);
  if (!matchCompanyTypes(userType, extractedType)) {
    return false; // Critical: company type must match
  }
  
  // ... more checks
  
  // Return true if 30%+ of checks pass and all critical checks pass
  return allCriticalPass && matchRatio >= 0.3;
}
```

### Step 6: Scoring (enhancedRecoEngine.ts)
```typescript
// Score each program
scoredPrograms = await scoreProgramsEnhanced(answers, 'strict', programs);

// For each program:
// 1. Check each requirement category
// 2. Calculate weighted score based on QUESTION_WEIGHTS
// 3. Generate explanations:
//    - eligibility: "Eligible" | "Not Eligible"
//    - confidence: "High" | "Medium" | "Low"
//    - reason: "Matches 8 out of 10 criteria..."
//    - matchedCriteria: [{key: 'location', status: 'passed', reason: '...'}]
//    - gaps: [{key: 'co_financing', description: '...', action: '...'}]
```

### Step 7: Display Results (ProgramFinder.tsx)
```typescript
// Sort by score and take top 5
top5 = scoredPrograms.sort((a, b) => b.score - a.score).slice(0, 5);

// Display with:
// - Program name
// - Match score (0-100%)
// - Description
// - Funding amount
// - Select button
```

## Answer Explanation System

### How Explanations Are Generated

1. **During Scoring** (`enhancedRecoEngine.ts`):
   - For each requirement category, checks if user answer matches program requirement
   - Records match status: `'passed'`, `'warning'`, or `'failed'`
   - Generates human-readable reason for each match/mismatch

2. **Explanation Fields**:
   ```typescript
   {
     eligibility: "Eligible", // Overall eligibility status
     confidence: "High",      // How confident we are in the match
     reason: "Matches 8 out of 10 criteria. Strong match on location, company type, and funding amount.",
     matchedCriteria: [
       {
         key: 'location',
         value: 'austria',
         reason: 'Program accepts Austrian companies',
         status: 'passed'
       },
       {
         key: 'co_financing',
         value: 'required',
         reason: 'Program requires 20% co-financing, but user can provide 30%',
         status: 'warning'
       }
     ],
     gaps: [
       {
         key: 'team_size',
         description: 'Program requires minimum 5 team members',
         action: 'Consider expanding your team',
         priority: 'medium'
       }
     ]
   }
   ```

3. **Score Calculation**:
   - Each question has a weight (see `QUESTION_WEIGHTS`)
   - Location: 22%, Company Type: 20%, Funding Amount: 18%, etc.
   - Score = (sum of matched weights) / (sum of all weights) * 100
   - Critical checks (location, company_type) must pass or program is filtered out

## Key Data Structures

### UserAnswers Interface
```typescript
interface UserAnswers {
  location?: string;
  company_type?: string;
  company_stage?: string | number; // Can be months (new) or string (old)
  company_stage_classified?: string; // Auto-classified from months
  legal_type?: string;
  funding_amount?: string | number;
  industry_focus?: string | string[];
  use_of_funds?: string | string[];
  impact?: string | string[];
  co_financing?: string;
  team_size?: string | number;
  revenue_status?: string;
  project_duration?: string | number;
  deadline_urgency?: string | number;
  [key: string]: any; // For "other" text inputs
}
```

### Categorized Requirements
```typescript
categorized_requirements: {
  geographic: [{type: 'location', value: 'Austria', confidence: 0.9}],
  eligibility: [
    {type: 'company_type', value: 'startup', confidence: 0.8},
    {type: 'company_stage', value: 'early_stage', confidence: 0.7}
  ],
  financial: [
    {type: 'funding_amount_min', value: 50000, confidence: 0.9},
    {type: 'co_financing', value: '20%', confidence: 0.8}
  ],
  project: [
    {type: 'industry_focus', value: 'digital', confidence: 0.7}
  ],
  // ... 11 more categories
}
```

## Question Weights

Weights determine how much each question contributes to the final score:

- **Tier 1 (Essential)**: Location (22%), Company Type (20%), Funding Amount (18%)
- **Tier 2 (Important)**: Industry Focus (15%), Impact (8%), Company Stage (6%)
- **Tier 3 (Optional)**: Co-financing (5%), Use of Funds (4%), Revenue Status (2%), Team Size (2%), Project Duration (1%)
- **Tier 4 (Not Scored)**: Deadline Urgency (0%) - user preference, not program requirement

## Debugging

### Console Logs
The system includes extensive logging:
- `🚀 Starting program generation...` - When generation starts
- `📋 Answers being sent:` - Shows answers object
- `📡 API Response status:` - HTTP response status
- `📦 API Response data:` - Programs received
- `📊 Scoring X programs...` - Scoring process
- `📈 Score distribution:` - Final scores
- `✅ Set X results in state` - Results displayed

### Common Issues

1. **No programs returned**:
   - Check LLM configuration (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT)
   - Check server logs for LLM errors
   - Verify answers are being sent correctly

2. **Programs don't match**:
   - Check normalization: Are answers being normalized correctly?
   - Check matching logic: Are critical checks passing?
   - Review `matchesAnswers()` function

3. **Low scores**:
   - Check which criteria are failing
   - Review `matchedCriteria` and `gaps` in results
   - Verify question weights are appropriate

## Summary

1. **Collection**: ProgramFinder.tsx collects answers
2. **Generation**: recommend.ts generates programs with LLM
3. **Extraction**: llmExtract.ts extracts structured requirements
4. **Normalization**: normalization.ts normalizes answers and requirements
5. **Matching**: recommend.ts filters programs using normalized matching
6. **Scoring**: enhancedRecoEngine.ts scores and explains matches
7. **Display**: ProgramFinder.tsx shows results with explanations

All answers flow through normalization to ensure reliable matching between user answers and program requirements.

