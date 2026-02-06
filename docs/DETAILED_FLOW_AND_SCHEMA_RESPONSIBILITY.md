# Exact Flow Explanation: recommend.ts ↔ customLLM ↔ blueprintGenerator

## Complete Data Flow with Schema Responsibilities

## 🎯 COMPONENT DISPLAY ARCHITECTURE

### EXACT EDITOR COMPONENTS AND THEIR DISPLAYS

#### 1. **ProgramFinder.tsx** (Reco Flow)
- **Location**: `features/reco/components/ProgramFinder.tsx`
- **Display**: Full-screen questionnaire wizard with step-by-step navigation
- **Shows**:
  - Progress bar (X/Y questions complete)
  - Single question per screen with interactive options
  - "Previous" and "Next" navigation buttons
  - "Generate Programs" button when complete
  - Loading spinner during LLM processing
  - Results modal with program cards

#### 2. **EditorProgramFinder.tsx** (Editor Integration)
- **Location**: `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/finder/ProgramFinder/EditorProgramFinder.tsx`
- **Display**: Embedded wizard within editor sidebar
- **Shows**:
  - Same questionnaire interface but styled for dark theme
  - Prefilled answers from existing project profile
  - Compact layout optimized for sidebar width
  - Direct integration with editor store

#### 3. **ProgramOption.tsx** (Selection Handler)
- **Location**: `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/ProgramOption.tsx`
- **Display**: Program selection interface with manual entry option
- **Shows**:
  - "Open ProgramFinder" button (triggers wizard)
  - "Paste Link" button (manual program entry)
  - Manual input modal for program IDs/links
  - Loading states during blueprint generation

#### 4. **ProgramSummaryPanel.tsx** (Selected Program Display)
- **Location**: `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/panels/ProgramSummaryPanel.tsx`
- **Display**: Right sidebar panel showing selected program details
- **Shows**:
  - Program name and organization
  - Required documents tree structure (collapsible)
  - Section hierarchy with icons (📕 Title Page, 📑 TOC, 🧾 Sections)
  - Required indicators (*) for mandatory items
  - Document structure visualization

#### 5. **PreviewWorkspace.tsx** (Live Document Preview)
- **Location**: `features/editor/components/Preview/PreviewWorkspace.tsx`
- **Display**: Center preview pane showing live document rendering
- **Shows**:
  - Real-time rendered document pages
  - Title page with project information
  - Table of Contents (when product selected)
  - Content sections as they're written
  - Special sections: References, Appendices, Lists
  - Zoom controls (50%-125%)
  - Watermark overlay (DRAFT)
  - Bottom tabbed bar: Readiness, Styling, Export
  - Readiness tab: Status badges for selected product and program

#### 6. **SectionEditor.tsx** (AI Writing Assistant)
- **Location**: `features/editor/components/Editor/SectionEditor.tsx`
- **Display**: Right AI assistant panel for section writing
- **Shows**:
  - Conversation-style chat interface
  - Section-specific context and guidance
  - AI-generated suggestions and improvements
  - Real-time content updates in preview
  - Loading indicators during AI processing

#### 7. **TreeNavigator.tsx** (Document Structure)
- **Location**: `features/editor/components/Navigation/TreeNavigator.tsx`
- **Display**: Left sidebar navigation tree
- **Shows**:
  - Document outline with expandable sections
  - Active section highlighting
  - Drag-and-drop reordering capability
  - Section completion status indicators

---

### 1. PROGRAM DISCOVERY FLOW (Initial Recommendation)

#### Input Sources:
- **User**: Completes questionnaire via `ProgramFinder.tsx`
- **Data**: Answers stored in component state
- **Trigger**: "Generate Programs" button click

#### Exact Data Transmission:

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

#### Output/Destination:
- **API Response**: `/api/programs/recommend` returns `GeneratedProgram[]`
- **Display**: Results shown in modal within `ProgramFinder.tsx`
- **Storage**: Programs temporarily stored in component state
- **Selection**: User clicks program card to trigger selection flow

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

#### Input Sources:
- **User**: Clicks program card in results modal
- **Data**: Selected `GeneratedProgram` object + questionnaire answers
- **Trigger**: Program card click handler

#### Exact Integration Mechanism:

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

#### Blueprint Generation Output:
- **API Response**: `/api/programs/blueprint` returns `Blueprint`
- **Structure Contains**:
  - `documents`: Required document list with purposes
  - `sections`: Hierarchical section structure
  - `structuredRequirements`: Detailed requirement categories
  - `financial`: Financial model requirements
  - `market`: Market analysis requirements
  - `team`: Team structure requirements
  - `risk`: Risk assessment requirements
  - `formatting`: Document formatting rules
  - `aiGuidance`: Section-specific writing guidance
  - `diagnostics`: Quality metrics and confidence scores

#### Display in Editor:
- **ProgramSummaryPanel.tsx**: Shows document structure tree
- **PreviewWorkspace.tsx**: Renders live document with program requirements
- **SectionEditor.tsx**: Provides AI assistance tailored to program requirements
- **TreeNavigator.tsx**: Displays section hierarchy for navigation

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

#### Component Integration Flow:
1. **ProgramFinder.tsx** → User completes questionnaire
2. **recommend.ts** → Processes answers and calls LLM
3. **ProgramOption.tsx** → Handles program selection
4. **blueprint.ts** → Generates detailed requirements
5. **Editor Components** → Display structured requirements:
   - `ProgramSummaryPanel.tsx` shows document tree
   - `PreviewWorkspace.tsx` renders live document
   - `SectionEditor.tsx` provides AI assistance
   - `TreeNavigator.tsx` enables navigation

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