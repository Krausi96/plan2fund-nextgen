# Complete File Responsibility Documentation

> **See companion documents**:
> - [`FUNDING_PROGRAM_DISCOVERY_FLOW.md`](./FUNDING_PROGRAM_DISCOVERY_FLOW.md) for step-by-step user flow
> - [`DETAILED_FLOW_AND_SCHEMA_RESPONSIBILITY.md`](./DETAILED_FLOW_AND_SCHEMA_RESPONSIBILITY.md) for exact technical implementation details

## Funding Program Discovery System - File Architecture

### 1. QUESTIONNAIRE DEFINITION LAYER

#### `features/reco/data/questions.ts`
**Responsibility**: Define all questionnaire questions and options
**Exact Function**: 
- Exports `CORE_QUESTIONS` and `ADVANCED_QUESTIONS` arrays
- Defines question structure: id, label, type, options, validation rules
- Specifies conditional logic and dependencies between questions
- Provides field definitions for all collected data

**Key Data Structures**:
```typescript
{
  id: 'organisation_type',
  label: 'What type of organisation are you?',
  type: 'single-select',
  options: [
    { value: 'individual', label: 'Individual' },
    { value: 'startup', label: 'Startup / Company' },
    // ... other options
  ],
  required: true,
  priority: 2
}
```

---

### 2. USER INTERFACE LAYER

#### `features/reco/components/ProgramFinder.tsx`
**Responsibility**: Interactive questionnaire wizard and program display
**Exact Function**:
- Renders step-by-step questionnaire using QuestionRenderer
- Manages user answers state and navigation
- Applies conditional logic to show/hide questions
- Processes derived fields (legal_form, revenue_status_category)
- Calls recommend API and displays results
- Handles program selection and navigation

**Key Operations**:
```typescript
// Conditional question filtering
getFilteredQuestions(allQuestions, currentAnswers)

// Derived field calculation
if (isNotRegisteredYet) {
  newAnswers.legal_form = 'not_registered_yet';
  newAnswers.revenue_status = 0;
}

// API communication
fetch('/api/programs/recommend', {
  method: 'POST',
  body: JSON.stringify({ answers: answersForApi })
})
```

#### `features/reco/components/QuestionRenderer.tsx`
**Responsibility**: Render individual question types with proper UI
**Exact Function**:
- Dynamically renders single-select, multi-select, and range questions
- Handles special input types (region, percentage, "other" text fields)
- Manages sub-options and conditional fields
- Provides consistent styling and user experience

---

### 3. API ENDPOINT LAYER

#### `pages/api/programs/recommend.ts`
**Responsibility**: Validate, process, and match programs using LLM
**Exact Function**:
- Validates required questionnaire fields
- Builds structured profile for LLM consumption
- Integrates with customLLM or OpenAI for program matching
- Transforms LLM response into GeneratedProgram format
- Implements retry logic and error handling

**Key Components**:
```typescript
// Interface Definition
interface GeneratedProgram {
  id: string;
  name: string;
  organisation_type?: string | null;
  company_stage?: string | null;
  legal_form?: string | null;
  // ... other fields
}

// Profile Building
const profile = [
  `Location: ${answers.location}`,
  `Organisation type: ${answers.organisation_type}`,
  // ... other fields
].filter(Boolean).join('\n');

// Program Transformation
return {
  id: program.id || `llm_${index}`,
  name: program.name,
  organisation_type: program.organisation_type || program.company_type || null,
  // ... field mapping
};
```

#### `pages/api/programs/blueprint.ts`
**Responsibility**: Generate detailed application requirements for selected programs
**Exact Function**:
- Receives selected program and user context
- Calls blueprintGenerator service for detailed processing
- Returns enhanced blueprint with structured requirements
- Handles error cases and fallback scenarios

---

### 4. SERVICE LAYER

#### `features/ai/services/blueprintGenerator.ts`
**Responsibility**: Core business logic for questionnaire-to-program transformation
**Exact Function**:
- Converts questionnaire answers to standardized ProgramProfile
- Maps organisation types, company stages, and revenue categories
- Generates detailed application requirements structure
- Creates fallback blueprints when needed
- Provides shared interfaces and utility functions

**Key Functions**:
```typescript
// Questionnaire to Program Profile Conversion
export function convertQuestionnaireToProgramProfile(
  answers: QuestionnaireAnswers
): any {
  return {
    organisationType: mapOrganisationType(answers.organisation_type),
    companyStage: mapCompanyStage(answers.company_stage),
    fundingAmount: {
      min: answers.funding_amount,
      max: calculateFundingRange(answers.funding_amount, answers.company_stage),
      currency: 'EUR'
    },
    // ... other mappings
  };
}

// Shared Interfaces
export interface ApplicationRequirements { /* ... */ }
export interface EnhancedBlueprint { /* ... */ }
```

#### `features/ai/clients/customLLM.ts`
**Responsibility**: Abstract LLM provider integration
**Exact Function**:
- Provides unified interface for different LLM providers
- Handles authentication and configuration
- Manages request/response formatting
- Implements fallback mechanisms

---

### 5. COMPONENT INTEGRATION LAYER

#### `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/ProgramOption.tsx`
**Responsibility**: Handle program selection and data persistence
**Exact Function**:
- Receives program selection from ProgramFinder
- Stores program profile in application state
- Triggers blueprint generation API call
- Persists data to localStorage
- Navigates to editor with complete program data

**Key Logic**:
```typescript
const handleProgramSelect = async (selectedProgram) => {
  // 1. Save program to store
  setProgramProfile(selectedProgram);
  
  // 2. Generate enhanced blueprint
  const response = await fetch('/api/programs/blueprint', {
    method: 'POST',
    body: JSON.stringify({
      fundingProgram: selectedProgram,
      userContext: userQuestionnaireAnswers
    })
  });
  
  // 3. Save blueprint to store
  setDocumentStructure(blueprint);
  
  // 4. Display in connected components
};
```

---

### 6. TYPE DEFINITION LAYER

#### `features/editor/lib/types/Program-Types.ts`
**Responsibility**: Define core funding program data structures
**Exact Function**:
- Defines `FundingProgram` interface with embedded blueprint structure
- Specifies application requirements format
- Provides blueprint enhancement capabilities
- Maintains backward compatibility with existing code

#### `features/editor/lib/types/types.ts`
**Responsibility**: Shared type definitions across the application
**Exact Function**:
- Defines common interfaces used throughout the system
- Provides type safety for data exchange
- Eliminates duplicate type definitions

---

### 7. DATA FLOW PATHWAY

#### Complete Execution Flow:

1. **User Interaction**:
   - User visits `/reco` route
   - ProgramFinder renders questionnaire wizard

2. **Data Collection**:
   - QuestionRenderer displays questions step by step
   - ProgramFinder manages state and applies logic
   - Answers are collected and processed in real-time

3. **API Processing**:
   - User clicks "Generate Programs"
   - ProgramFinder validates and sends data to `/api/programs/recommend`
   - recommend.ts validates fields and builds LLM profile
   - LLM processes and returns matching programs

4. **Program Selection**:
   - User selects a program from results
   - ProgramOption handles selection
   - Calls `/api/programs/blueprint` for detailed requirements
   - Data is persisted to state and localStorage

5. **Editor Integration**:
   - User navigates to `/editor`
   - Program data is loaded from storage
   - Components display program info and requirements
   - AI assistance becomes available for document writing

---

### 8. ERROR HANDLING & FALLBACKS

#### Built-in Safeguards:
- **Field Validation**: Required fields checked before API calls
- **LLM Fallback**: OpenAI used when custom LLM fails
- **Blueprint Fallback**: Default structure when detailed parsing fails
- **State Recovery**: localStorage backup for data persistence
- **Graceful Degradation**: System works even with partial data

#### Monitoring Points:
- Console logs for debugging (`NODE_ENV !== 'production'`)
- Error boundaries in React components
- API response validation and sanitization
- Type checking with TypeScript

---

### 9. PERFORMANCE OPTIMIZATIONS

#### Current Optimizations:
- **Memoization**: `useMemo` for expensive calculations
- **Lazy Loading**: Dynamic imports for heavy modules
- **Conditional Rendering**: Only show relevant questions
- **Batch Processing**: Multiple programs generated in single LLM call
- **Caching**: localStorage for program data persistence

#### Future Opportunities:
- Query caching for repeated program lookups
- Progressive loading of program details
- Background pre-fetching of common programs
- Client-side filtering for faster results

---

### 10. TESTING ACCESS POINTS

#### Manual Testing Endpoints:
- `/reco` - Questionnaire interface
- `/api/programs/recommend` - Program matching API
- `/api/programs/blueprint` - Requirements generation API
- `/editor` - Program display and document creation

#### Debug Information:
```bash
# Check current state
localStorage.getItem('selectedProgram')

# Monitor API calls
Network tab in browser dev tools

# View component state
React Dev Tools extension

# Check type safety
npm run type-check
```

This documentation provides complete visibility into every file's exact responsibility and how they interact to create the seamless funding program discovery experience.