# Requirements Schema Comparison

## Current Codebase (What You Have Now)

### 1. Program Data Structure (`data/programs.json`)
```json
{
  "id": "aws_preseed_innovative_solutions",
  "name": "aws Preseed – Innovative Solutions",
  "type": "grant",
  "eligibility": [
    "Natural persons (teams) or companies ≤6 months after registration",
    "Project location in Austria",
    "High degree of innovation with scalable market potential"
  ],
  "thresholds": {
    "max_grant_eur": 100000,
    "project_duration_months": 12
  }
}
```

**Problems with current structure:**
- ❌ Eligibility is just text strings - hard to validate
- ❌ No way to know what questions to ask users
- ❌ No connection to editor sections
- ❌ No way to check if user meets requirements
- ❌ No guidance for users

### 2. Decision Tree (`src/lib/decisionTree.ts`)
```typescript
// Hardcoded questions
this.nodes.set('q1_country', {
  id: 'q1_country',
  question: 'Where will the project be carried out?',
  type: 'single',
  options: [
    { value: 'AT', label: 'Austria only' },
    { value: 'EU', label: 'EU (incl. Austria)' }
  ]
});
```

**Problems with current decision tree:**
- ❌ Questions are hardcoded
- ❌ No connection to program requirements
- ❌ Can't generate questions dynamically
- ❌ No way to know which questions are relevant for which programs

### 3. Editor Prefill (`src/lib/prefill.ts`)
```typescript
// Basic template replacement
const content = `
# Business Plan
Our business, ${answers.business_name || '[Business Name]'}, is seeking ${answers.funding_amount || '[Funding Amount]'} in ${program.type} funding.
`;
```

**Problems with current prefill:**
- ❌ Generic templates for all programs
- ❌ No program-specific guidance
- ❌ No way to know what sections are required
- ❌ No missing information detection

## New Requirements Schema (What I Propose)

### 1. Enhanced Program Structure
```json
{
  "programId": "aws_preseed_innovative_solutions",
  "programName": "aws Preseed – Innovative Solutions",
  "programType": "grant",
  "targetPersonas": ["solo", "sme"],
  
  "eligibility": [
    {
      "id": "elig_1",
      "title": "Natural person or company ≤6 months after registration",
      "type": "boolean",
      "isRequired": true,
      "priority": "critical",
      "validationRules": [{"type": "required", "message": "This is critical"}],
      "examples": ["GmbH registered 3 months ago"],
      "guidance": "Check company registration date"
    }
  ],
  
  "decisionTreeQuestions": [
    {
      "id": "q_company_stage",
      "question": "What is your company stage?",
      "type": "single",
      "options": [
        {"value": "PRE_COMPANY", "label": "Just an idea or team forming"},
        {"value": "INC_LT_6M", "label": "Recently started (less than 6 months)"}
      ]
    }
  ],
  
  "editorSections": [
    {
      "id": "executive_summary",
      "title": "Executive Summary",
      "required": true,
      "template": "Our business, [PROJECT_NAME], is seeking [FUNDING_AMOUNT] in funding...",
      "prefillData": {
        "PROJECT_NAME": "answers.business_name",
        "FUNDING_AMOUNT": "answers.funding_amount"
      }
    }
  ]
}
```

**Benefits of new structure:**
- ✅ Structured requirements that can be validated
- ✅ Dynamic question generation based on requirements
- ✅ Program-specific editor templates
- ✅ Automated completeness checking
- ✅ Clear guidance for users

## How This Would Work in Your Code

### 1. Enhanced Decision Tree
Instead of hardcoded questions, the decision tree would:
```typescript
// Load requirements for a program
const programRequirements = loadProgramRequirements(programId);

// Generate questions dynamically
const questions = programRequirements.decisionTreeQuestions;

// Check if user meets requirements
const isEligible = checkRequirementMet(requirement, userAnswers);
```

### 2. Enhanced Editor Prefill
Instead of generic templates, the editor would:
```typescript
// Load program-specific sections
const sections = programRequirements.editorSections;

// Generate content with program-specific templates
const content = processTemplate(section.template, userAnswers, section.prefillData);

// Check what's missing
const missingInfo = checkMissingInfo(section, userAnswers);
```

### 3. Readiness Check
New functionality that doesn't exist yet:
```typescript
// Check if all requirements are met
const readiness = checkReadiness(programRequirements, userAnswers);

// Show user what's missing
if (readiness.score < 100) {
  showMissingRequirements(readiness.missingRequirements);
}
```

## Migration Strategy

### Phase 1: Keep Current System Working
- Don't change existing files
- Create new requirements structure alongside current system
- Test with sample data

### Phase 2: Enhance Existing Components
- Modify `src/lib/decisionTree.ts` to use requirements
- Enhance `src/lib/prefill.ts` with requirements data
- Add new readiness check functionality

### Phase 3: Full Integration
- Replace hardcoded questions with dynamic generation
- Use program-specific templates in editor
- Implement automated completeness checking

## Example: How aws Preseed Would Work

### Current System:
1. User answers hardcoded questions
2. System scores programs based on basic rules
3. User gets generic business plan template
4. No way to know if they're ready to apply

### New System:
1. User answers questions generated from program requirements
2. System checks each requirement against user answers
3. User gets aws Preseed-specific business plan template
4. System shows exactly what's missing and how to fix it

## Next Steps

1. **Review the sample requirements** - Look at `testrec/requirements/sample-requirements.json`
2. **Understand the structure** - See how it's organized compared to your current data
3. **Decide what to implement first** - Decision tree, editor prefill, or readiness check
4. **Test with one program** - Start with aws Preseed to see how it works
