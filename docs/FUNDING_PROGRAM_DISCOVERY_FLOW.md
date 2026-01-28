# Funding Program Discovery End-to-End Flow

## Complete Data Flow: Questionnaire to Program Selection

### 1. Questionnaire Phase (questions.ts)
**File**: `features/reco/data/questions.ts`
**Purpose**: Define all questionnaire questions and options

**Core Fields Collected**:
- `organisation_type`: Startup, SME, Individual, Other
- `company_stage`: Idea, MVP, Revenue, Growth
- `revenue_status`: Numeric slider (0-10M EUR)
- `location`: Austria, Germany, EU, International
- `industry_focus`: Multi-select (Digital, Sustainability, Health, etc.)
- `funding_amount`: Range slider (0-1M EUR)
- `co_financing`: Yes/No/Flexible
- `use_of_funds`: Multi-select (Product dev, Hiring, Equipment, etc.)
- `impact_focus`: Multi-select (Environmental, Social, etc.)

**Advanced Fields**:
- `deadline_urgency`: Timeline requirements
- `legal_form`: Derived based on organisation type

### 2. Collection & Processing (ProgramFinder.tsx)
**File**: `features/reco/components/ProgramFinder.tsx`
**Purpose**: Interactive wizard collecting answers

**Key Logic**:
```typescript
// Conditional question hiding
const isNotRegisteredYet = answers.organisation_type === 'individual' && 
                          answers.organisation_type_sub === 'no_company';

// Auto-setting derived fields
if (isNotRegisteredYet) {
  newAnswers.legal_form = 'not_registered_yet';
  newAnswers.revenue_status = 0; // Pre-Revenue
}

// Revenue categorization
const revenueValue = newAnswers.revenue_status;
if (revenueValue === 0) {
  newAnswers.revenue_status_category = 'pre_revenue';
} else if (revenueValue <= 250000) {
  newAnswers.revenue_status_category = 'low_revenue';
}
```

**Data Structure Sent to API**:
```typescript
const answersForApi = {
  organisation_type: "startup",
  company_stage: "idea", 
  revenue_status: 0,
  revenue_status_category: "pre_revenue",
  location: "austria",
  industry_focus: ["digital", "innovation"],
  funding_amount: 50000,
  co_financing: "co_yes",
  co_financing_percentage: "30%",
  legal_form: "gmbh",
  deadline_urgency: "3_6_months",
  use_of_funds: ["product_development"],
  impact_focus: ["environmental"]
};
```

### 3. Program Matching (recommend.ts API)
**File**: `pages/api/programs/recommend.ts`
**Purpose**: Validate, process, and send to LLM for program matching

**Validation**:
```typescript
const REQUIRED_FIELDS = [
  'location', 
  'organisation_type', 
  'funding_amount', 
  'company_stage'
];

// Additional processing in profile building
const profile = [
  `Location: ${answers.location}`,
  `Organisation type: ${answers.organisation_type}`,
  `Company stage: ${answers.company_stage}`,
  `Funding need: €${answers.funding_amount}`,
  `Co-financing: ${answers.co_financing === 'co_no' ? 'ONLY grants/subsidies' : 'can accept loans/equity'}`,
  `Co-financing %: ${answers.co_financing_percentage}`,
  `Legal form: ${answers.legal_form}`,
  `Timeline: ${answers.deadline_urgency}`
].filter(Boolean).join('\n');
```

**LLM Integration**:
- Sends structured profile to LLM
- Requests up to 20 matching programs
- Applies matching rules (location, stage, amount tolerance)
- Returns programs with basic information

### 4. Program Transformation & Storage
**In recommend.ts lines 389-424**:
```typescript
return {
  id: program.id || `llm_${index}`,
  name: program.name,
  url: program.website || program.url || null,
  description: program.description || null,
  location: program.location || null,
  region: program.region || program.location || null,
  organisation_type: program.organisation_type || program.company_type || null,
  company_stage: program.company_stage || null,
  // Additional questionnaire fields preserved
  legal_form: program.legal_form || null,
  co_financing_percentage: program.co_financing_percentage || null,
  deadline_urgency: program.deadline_urgency || null,
  application_requirements: program.application_requirements || null,
  source: 'llm_generated'
};
```

### 5. Two-Stage Enhancement Flow

#### Stage 1: Program Recommendation (Completed Above)
**Endpoint**: `/api/programs/recommend`
**Output**: Basic program information with matching scores

#### Stage 2: Detailed Requirements Generation
**Endpoint**: `/api/programs/blueprint` (NEW)
**Trigger**: When user selects a program

**Process**:
1. User clicks "Select" on a recommended program
2. ProgramFinder calls blueprint API with:
   ```typescript
   const response = await fetch('/api/programs/blueprint', {
     method: 'POST',
     body: JSON.stringify({
       fundingProgram: selectedProgram,
       userContext: questionnaireAnswers
     })
   });
   ```
3. blueprint.ts calls blueprintGenerator.ts to:
   - Convert questionnaire to ProgramProfile format
   - Generate detailed application requirements
   - Create enhanced blueprint structure

### 6. Data Distribution & Storage

#### Client-Side Storage:
**Location**: `ProgramOption.tsx` component
**Storage Mechanism**: React state management
```typescript
const handleProgramSelect = async (selectedProgram) => {
  // 1. Save basic program info
  setProgramProfile(selectedProgram);
  
  // 2. Generate enhanced blueprint
  const response = await fetch('/api/programs/blueprint', {
    method: 'POST',
    body: JSON.stringify({
      fundingProgram: selectedProgram,
      userContext: userQuestionnaireAnswers
    })
  });
  const { blueprint } = await response.json();
  
  // 3. Save detailed requirements
  setDocumentStructure(blueprint);
  
  // 4. Navigate to editor
  router.push('/editor');
};
```

#### Component Display Flow:
1. **ProgramFinder.tsx**: Shows questionnaire wizard
2. **Program Results Modal**: Displays matching programs
3. **ProgramOption.tsx**: Handles selection and triggers blueprint generation
4. **Editor.tsx**: Receives program data and displays:
   - ProgramSummaryPanel: Basic program info
   - DocumentStructure: Detailed requirements
   - SectionEditor: AI-assisted section writing

### 7. Testing Instructions

#### Manual Testing Steps:

1. **Start the Application**:
   ```bash
   npm run dev
   ```

2. **Navigate to Program Finder**:
   - Visit `http://localhost:3000/reco`
   - Complete the questionnaire step by step

3. **Test Questionnaire Logic**:
   - Try different organisation types (Startup vs Individual)
   - Observe conditional questions (legal_form appears/disappears)
   - Test revenue slider behavior (auto-sets to 0 for Idea stage)

4. **Generate Programs**:
   - Complete minimum required questions
   - Click "Generate Programs"
   - Verify programs appear in modal

5. **Test Program Selection**:
   - Click "Select" on any program
   - Check browser console for API calls
   - Verify navigation to editor

6. **Verify Data Flow**:
   ```bash
   # Check localStorage after selection
   localStorage.getItem('selectedProgram')
   
   # Check Redux/dev tools for state
   # Program profile should contain all questionnaire fields
   ```

#### Automated Testing Commands:

```bash
# Type check
npm run type-check

# Build test
npm run build

# Run development server
npm run dev

# Test specific endpoints
curl -X POST http://localhost:3000/api/programs/recommend \
  -H "Content-Type: application/json" \
  -d '{"answers":{"location":"austria","organisation_type":"startup","company_stage":"idea","funding_amount":50000},"max_results":5}'
```

#### Debug Logging:

Add temporary console logs for verification:
```typescript
// In ProgramFinder.tsx
console.log('Questionnaire Answers:', answers);
console.log('Answers sent to API:', answersForApi);

// In recommend.ts
console.log('LLM Profile:', profile);
console.log('Generated Programs:', programs);

// In ProgramOption.tsx  
console.log('Selected Program:', selectedProgram);
console.log('Blueprint Response:', blueprint);
```

### 8. Expected Data Structure at Each Stage

#### After Questionnaire Completion:
```json
{
  "organisation_type": "startup",
  "company_stage": "idea",
  "revenue_status": 0,
  "revenue_status_category": "pre_revenue",
  "location": "austria",
  "industry_focus": ["digital"],
  "funding_amount": 50000,
  "co_financing": "co_yes",
  "co_financing_percentage": "30%"
}
```

#### After Program Recommendation:
```json
{
  "id": "llm_0",
  "name": "AWS Seedfinancing",
  "description": "Early-stage funding for innovative startups...",
  "location": "Austria",
  "region": "Austria", 
  "organisation_type": "startup",
  "company_stage": "idea",
  "legal_form": "gmbh",
  "co_financing_percentage": "30%",
  "application_requirements": {
    "documents": [...],
    "sections": [...]
  }
}
```

#### After Blueprint Generation:
```json
{
  "documents": [...],
  "sections": [...],
  "structuredRequirements": [...],
  "financial": {...},
  "market": {...},
  "team": {...}
}
```

### 9. Troubleshooting Checklist

**If programs don't generate**:
- [ ] Check browser console for API errors
- [ ] Verify all required fields are completed
- [ ] Check network tab for successful API calls

**If blueprint generation fails**:
- [ ] Verify blueprint.ts endpoint exists
- [ ] Check blueprintGenerator.ts import paths
- [ ] Confirm questionnaire data is passed correctly

**If data is missing in editor**:
- [ ] Check localStorage for selectedProgram
- [ ] Verify setProgramProfile is called
- [ ] Confirm setDocumentStructure receives blueprint data

This complete flow ensures seamless data progression from initial questionnaire through program selection to detailed application requirements generation.