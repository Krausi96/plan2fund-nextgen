# Exact Flow Explanation: recommend.ts ↔ customLLM ↔ blueprintGenerator

## Complete Data Flow with Schema Responsibilities

### 1. PROGRAM DISCOVERY FLOW (Initial Recommendation)

#### Flow Path:
```
ProgramFinder.tsx → recommend.ts API → customLLM.ts → LLM Provider
```

#### Exact Data Transmission:

**From recommend.ts to customLLM:**
```typescript
// In recommend.ts lines 221-226:
const response = await callCustomLLM({
  messages: [
    { role: 'system', content: 'Return funding programs as JSON only.' },
    { role: 'user', content: instructions }  // Built from user profile
  ],
  responseFormat: 'json',           // Triggers schema enforcement
  temperature: 0.2,
  maxTokens: 6000
});
```

**What gets sent to customLLM:**
1. **Messages array** containing:
   - System prompt: "Return funding programs as JSON only."
   - User prompt: Structured profile with all questionnaire answers
   
2. **Configuration parameters**:
   - `responseFormat: 'json'` (triggers schema enforcement)
   - `temperature: 0.2` (controls creativity)
   - `maxTokens: 6000` (response length limit)

#### Schema Usage in Program Discovery:

**Location**: `customLLM.ts` lines 161-186
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
          funding_types: { type: 'array', items: { type: 'string' } },
          funding_amount_min: { type: 'number' },
          funding_amount_max: { type: 'number' },
          currency: { type: 'string' },
          location: { type: 'string' },
          company_type: { type: 'string' },
          company_stage: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['id', 'name', 'funding_types']
      }
    }
  },
  required: ['programs']
}
```

**Purpose**: Enforces consistent JSON structure from LLM for program matching

---

### 2. PROGRAM SELECTION FLOW (Blueprint Generation)

#### Flow Path:
```
ProgramOption.tsx → blueprint.ts API → blueprintGenerator.ts → customLLM.ts → LLM Provider
```

#### Exact Integration Mechanism:

**When user selects a program:**

1. **ProgramOption.tsx triggers the call:**
```typescript
// In ProgramOption.tsx:
const handleProgramSelect = async (selectedProgram) => {
  // 1. Save basic program info to store
  setProgramProfile(selectedProgram);
  
  // 2. Call blueprint API with selected program + user context
  const response = await fetch('/api/programs/blueprint', {
    method: 'POST',
    body: JSON.stringify({
      fundingProgram: selectedProgram,
      userContext: userQuestionnaireAnswers  // From ProgramFinder
    })
  });
  
  // 3. Process blueprint response
  const { blueprint } = await response.json();
  setDocumentStructure(blueprint);
  
  // 4. Navigate to editor
  router.push('/editor');
};
```

2. **blueprint.ts processes the request:**
```typescript
// In pages/api/programs/blueprint.ts:
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fundingProgram, userContext } = req.body;
  
  // Call blueprint generator service
  const blueprint = await generateBlueprint(fundingProgram, userContext);
  
  return res.status(200).json({ blueprint });
}
```

3. **blueprintGenerator.ts does the heavy lifting:**
```typescript
// In features/ai/services/blueprintGenerator.ts:
export async function generateBlueprint(
  fundingProgram: any,
  userContext: any
): Promise<any> {
  // Convert questionnaire to standardized format
  const programProfile = convertQuestionnaireToProgramProfile(userContext);
  
  // Build detailed prompt for requirements generation
  const prompt = buildBlueprintPrompt(fundingProgram, programProfile);
  
  // Call LLM through customLLM (indirectly)
  const response = await callCustomLLM({
    messages: [
      { role: 'system', content: 'Generate detailed application requirements...' },
      { role: 'user', content: prompt }
    ],
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 4000
  });
  
  // Parse and validate response
  return parseBlueprintResponse(response.output);
}
```

#### Schema Usage in Blueprint Generation:

**blueprintGenerator.ts has its own schema for detailed requirements:**
```typescript
// In blueprintGenerator.ts lines 330-400:
const BLUEPRINT_SCHEMA = {
  type: 'object',
  properties: {
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          purpose: { type: 'string' },
          required: { type: 'boolean' }
        }
      }
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          title: { type: 'string' },
          required: { type: 'boolean' },
          programCritical: { type: 'boolean' }
        }
      }
    },
    // ... other detailed requirement fields
  }
};
```

---

### 3. SCHEMA RESPONSIBILITY MATRIX

| Component | Schema Purpose | Used When | Location |
|-----------|---------------|-----------|----------|
| **customLLM.ts** | Enforce basic JSON structure from LLM | Program discovery AND blueprint generation | Lines 161-186 |
| **blueprintGenerator.ts** | Define detailed requirements structure | Blueprint generation only | Lines 330-400 |
| **recommend.ts** | Coordinate flow, no schema | Program discovery orchestration | No schema |
| **blueprint.ts** | API endpoint, no schema | Handle blueprint requests | No schema |

---

### 4. COMPLETE FLOW VISUALIZATION

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  ProgramFinder  │───▶│  recommend.ts│───▶│ customLLM.ts│───▶│ LLM Provider │
│  (Collects Qs)  │    │  (Validates) │    │ (Schema #1) │    │ (Gemini etc) │
└─────────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                              │                     ▲
                              ▼                     │
                       ┌──────────────┐    ┌─────────────┐
                       │   Programs   │    │   JSON      │
                       │   (20 items) │    │ Response    │
                       └──────────────┘    └─────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Program Results │
                       │   Modal/UI      │
                       └─────────────────┘
                              │
                              ▼ (User selects program)
                       ┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
                       │ ProgramOption   │───▶│ blueprint.ts │───▶│ blueprintGen.ts  │
                       │ (Handles click) │    │ (API route)  │    │ (Schema #2)      │
                       └─────────────────┘    └──────────────┘    └──────────────────┘
                                                            │              ▲
                                                            ▼              │
                                                     ┌─────────────┐       │
                                                     │ customLLM.ts│───────┘
                                                     │ (Schema #1) │
                                                     └─────────────┘
```

---

### 5. DUPLICATION ANALYSIS

**✅ NO Schema Duplication Found:**
- **Schema #1** (customLLM.ts): Basic program structure enforcement - USED BY BOTH flows
- **Schema #2** (blueprintGenerator.ts): Detailed requirements structure - USED BY blueprint flow only
- **Different purposes**: Structure vs. Content detail level

**✅ NO Functional Duplication:**
- Each schema serves a distinct purpose
- No overlapping field definitions
- Proper separation of basic structure vs. detailed requirements

---

### 6. KEY INTEGRATION POINTS

1. **recommend.ts → customLLM.ts**: Direct import and function call
2. **blueprint.ts → blueprintGenerator.ts**: Direct import and function call  
3. **blueprintGenerator.ts → customLLM.ts**: Indirect through shared LLM client
4. **ProgramOption.tsx → blueprint.ts**: HTTP POST request with program + context

**No direct coupling** - all communication happens through well-defined interfaces.

---

### 7. TESTING THIS FLOW

**Manual Test Sequence:**
1. Visit `/reco` and complete questionnaire
2. Click "Generate Programs" - verify API call to `/api/programs/recommend`
3. Select a program - verify API call to `/api/programs/blueprint`
4. Check browser console/network tab for request/response details
5. Verify navigation to `/editor` with complete program data

**Debug Points:**
```javascript
// In browser console:
localStorage.getItem('selectedProgram')  // Should contain program data
localStorage.getItem('documentStructure')  // Should contain blueprint
```

This architecture ensures clean separation of concerns with no duplication while maintaining efficient data flow between all components.