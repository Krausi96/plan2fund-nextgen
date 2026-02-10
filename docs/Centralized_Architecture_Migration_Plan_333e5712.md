# Centralized Architecture Migration Plan

## CRITICAL SAFETY CONSTRAINTS
- **No Runtime Breaking**: Keep old code functional until new code fully replaces it
- **Build First**: Create entire new architecture before deleting anything
- **Gradual Switchover**: One module at a time replaces imports
- **Zero Deletion Until End**: Only delete after verification that new paths work

---

## DEPENDENCY SNAPSHOT (Current State)

### Global State Providers
1. **UserContext** (`shared/user/context/UserContext.tsx`)
   - Used by: LoginForm, LoginModal, withAuth, dashboard, _app provider
   - Stores: userProfile, isLoading, setUserProfile, clearUserProfile
   - Persistence: localStorage STORAGE_KEY='pf_user_profile'

2. **editorStore** (Zustand, `features/editor/lib/store/editorStore.ts`)
   - Used by: Editor, Sidebar, DocumentsBar, SectionEditor, all setup flows
   - 5 Domains: Plan, Template, SetupWizard, UI, Program
   - Stores: plan, selectedProduct, setup state, UI toggles, program summaries

3. **programPersistence** (`features/reco/lib/programPersistence.ts`)
   - Used by: ProgramOption, EditorProgramFinder
   - Stores: selectedProgram with Zod validation + DOMPurify
   - Persistence: localStorage STORAGE_KEY='selectedProgram'

### LLM Paths
1. **customLLM** (`features/ai/clients/customLLM.ts`)
   - Used by: recommend.ts, assistant.ts
   - Handles: Gemini, OpenRouter, Groq, Hugging Face formats
   - Entry point: callCustomLLM()

2. **Direct OpenAI** 
   - Used by: recommend.ts (line 381), assistant.ts (line 11)
   - Pattern: `new OpenAI({ apiKey })` with fallback logic

3. **Response Parsing**
   - llmUtils.ts: parseProgramResponse()
   - assistant.ts: parseAIResponse() (duplicate logic)

---

## PHASE 0: SAFETY SNAPSHOT

### Step 0.1: Create Git Branch
```
git checkout -b refactor/core-centralization
```

### Step 0.2: Document Current Dependency Graph
Create in memory (not committed):
- UserContext usage: 8 direct consumers (LoginForm, LoginModal, withAuth, dashboard, _app, etc.)
- editorStore usage: 40+ consumers (all editor components, setup flows)
- programPersistence usage: 2 consumers (ProgramOption, EditorProgramFinder)
- LLM calls: callCustomLLM (recommend.ts, assistant.ts) + OpenAI (recommend.ts line 381, 423)

---

## PHASE 1: CREATE NEW CORE STRUCTURE (NO DELETIONS)

### Step 1.1: Create Directory Structure
``
/platform
├──`/core
├── context/
│   ├── ProjectContext.tsx      (NEW: Zustand + Provider)
│   ├── hooks/
│   │   ├── useProject.ts       (NEW: Single hook)
│   │   └── useUser.ts          (NEW: Backward compat)
│   └── index.ts
├── types/
│   ├── index.ts
│   ├── user.ts                 (NEW: UserProfile, UserContextValue)
│   ├── project.ts              (NEW: ProjectProfile, BusinessPlan, DocumentStructure)
│   ├── program.ts              (NEW: Program, FundingProgram, ProgramSummary)
│   └── blueprint.ts            (NEW: Blueprint, BlueprintRequest)
├── validation/
│   ├── index.ts
│   ├── userSchemas.ts          (NEW: Zod schemas)
│   ├── programSchemas.ts       (NEW: Zod schemas)
│   └── documentSchemas.ts      (NEW: Zod schemas)
├── store/
│   └── useProjectStore.ts      (NEW: Zustand implementation)
├── ai/
│   ├── orchestrator.ts         (NEW: Single LLM entry point)
│   ├── llmClient.ts            (NEW: Unified LLM client)
│   ├── prompts/
│   │   ├── recommendation.ts
│   │   ├── blueprint.ts
│   │   └── section.ts
│   └── parsers/
│       ├── index.ts
│       ├── responseParsers.ts
│       └── sanitizers.ts
├── analysis/
│   ├── documentParser.ts       (NEW: File extraction + detection)
│   ├── programAnalyzer.ts      (NEW: Program normalization)
│   └── businessAnalyzer.ts
└── generation/
    ├── blueprintGenerator.ts   (MOVED: to new location)
    ├── sectionWriter.ts
    └── structureBuilder.ts

```

### Step 1.2: Verify No Import Cycles
- New types have NO dependencies (root)
- validation depends ONLY on types
- orchestrator depends on types + validation
- Everything else builds up the chain

---

## PHASE 2: CREATE TYPES & VALIDATION LAYER

### Step 2.1: Extract and Consolidate All Types
- From: `shared/user/schemas/userProfile.ts` → `core/types/user.ts`
- From: `features/editor/lib/types/program/program-types.ts` → `core/types/program.ts`
- From: `features/reco/types.ts` → `core/types/program.ts` (merge)
- From: `features/editor/lib/types/documents/document-types.ts` → `core/types/project.ts`
- From: `features/editor/lib/types/workflow/setup-types.ts` → `core/types/project.ts`
- From: `features/editor/lib/types/ai/ai-types.ts` → `core/types/blueprint.ts`

**Output**: 4 consolidated type files with clear interfaces

### Step 2.2: Extract and Consolidate All Validation Schemas
- From: `shared/user/schemas/userProfile.ts` (validation fns) → `core/validation/userSchemas.ts`
- From: `features/reco/lib/programPersistence.ts` (PersistedProgramSchema) → `core/validation/programSchemas.ts`
- From: `pages/api/programs/recommend.ts` (UserAnswersSchema) → `core/validation/programSchemas.ts`
- From: `pages/api/programs/blueprint.ts` (BlueprintRequestSchema) → `core/validation/documentSchemas.ts`

**Output**: 3 consolidated Zod schema files

### Step 2.3: Verify Compilation
- All new types compile without errors
- Backward compatibility: export same interfaces as before
- No circular dependencies

---

## PHASE 3: CREATE CENTRALIZED STORE (useProjectStore)

### Step 3.1: Create Zustand Store (`core/store/useProjectStore.ts`)
Consolidate state from:
- UserContext: userProfile, isLoading
- editorStore: plan, selectedProduct, allSections, allDocuments, setupWizard state
- programPersistence: selectedProgram

**Store shape**:
```typescript
interface ProjectStoreState {
  // User
  userProfile: UserProfile | null
  isLoadingUser: boolean
  
  // Project
  projectProfile: ProjectProfile | null
  fundingProfile: FundingProfile | null  // reco answers
  selectedProgram: PersistedProgram | null
  
  // Document Setup
  plan: Plan | null
  documentStructure: DocumentStructure | null
  selectedProduct: Product | null
  
  // Template
  allSections: Section[]
  allDocuments: Document[]
  disabledSectionIds: string[]
  disabledDocumentIds: string[]
  
  // Setup Wizard
  setupWizardStep: 1 | 2 | 3
  setupStatus: 'none' | 'draft' | 'confirmed' | 'locked'
  
  // UI
  activeSectionId: string | null
  expandedSectionId: string | null
  showAddSection: boolean
  
  // Origin tracking
  origin: 'reco' | 'editor' | null
}
```

**Actions**:
- setUserProfile(profile)
- setProjectProfile(profile)
- setFundingProfile(answers)
- selectProgram(program)
- setTemplate(sections, documents)
- setDocumentStructure(structure)
- setSetupStep(step)
- resetAll()
- persistToLocalStorage()
- restoreFromLocalStorage()

### Step 3.2: Implement localStorage Persistence
- **Only location** that touches localStorage
- Keys: `pf_project_state`, `pf_user_profile`, `pf_selected_program`
- Migration script: convert old keys to new structure
- Validation on load: Zod schemas from core/validation/

### Step 3.3: Create Provider Component (`core/context/ProjectContext.tsx`)
```typescript
export function ProjectProvider({ children }) {
  // Initialize store with localStorage data
  // Provide useProject() and useUser() hooks
}
```

### Step 3.4: Create useProject Hook (`core/context/hooks/useProject.ts`)
Exposes: userProfile, projectProfile, selectedProgram, setProjectProfile(), selectProgram(), etc.

### Step 3.5: Create useUser Hook for Backward Compat (`core/context/hooks/useUser.ts`)
Wraps useProject() to maintain existing API:
```typescript
export function useUser() {
  const { userProfile, setUserProfile, isLoadingUser } = useProject();
  return { userProfile, setUserProfile, isLoading: isLoadingUser };
}
```

---

## PHASE 4: CREATE AI ORCHESTRATOR

### Step 4.1: Create llmClient (`core/ai/llmClient.ts`)
- Unified interface for all LLM providers
- Consolidates: customLLM.ts + OpenAI initialization
- Exports: callLLM(request) with provider auto-detection
- Handles: timeout, retry, error handling, response parsing

### Step 4.2: Create orchestrator (`core/ai/orchestrator.ts`)
```typescript
export async function callAI({
  type: 'recommendPrograms' | 'generateBlueprint' | 'analyzeBusiness' | 'writeSection' | 'improveSection',
  payload: { ... }
}) {
  // Route to appropriate LLM call
  // Use llmClient for all actual calls
  // Apply prompts from /ai/prompts/
  // Parse responses using /ai/parsers/
}
```

### Step 4.3: Create Prompt Templates (`core/ai/prompts/`)
- recommendation.ts: For program discovery
- blueprint.ts: For document structure generation
- section.ts: For section content writing

### Step 4.4: Create Response Parsers (`core/ai/parsers/`)
- responseParsers.ts: Consolidates llmUtils.ts + parseAIResponse logic
- sanitizers.ts: Consolidates blueprintUtils.ts

---

## PHASE 5: CREATE ANALYSIS & GENERATION LAYERS

### Step 5.1: Create documentParser (`core/analysis/documentParser.ts`)
Consolidates from `features/editor/lib/utils/1-document-flows/`:
- documentProcessor.ts: extractContentFromFiles()
- extractFileContent.ts: File routing logic
- docxExtractor.ts, pdfExtractor.ts, txtExtractor.ts: Extractors
- documentStructureDetector.ts: detectDocumentStructure()
- rawTextToSections.ts: Section parsing
- normalizeDocumentStructure.ts: Normalization logic

**Unified function**:
```typescript
export async function parseDocumentStructure(
  source: 'upload' | 'template',
  input: File | TemplateData
): Promise<{ structure: DocumentStructure; detection: DetectionMap }>
```

### Step 5.2: Create programAnalyzer (`core/analysis/programAnalyzer.ts`)
Consolidates from `features/editor/lib/utils/2-program-flows/`:
- programNormalizer.ts: normalizeFundingProgram(), normalizeProgramSetup()

**Unified function**:
```typescript
export function analyzeFundingProgram(
  rawData: any
): FundingProgram
```

### Step 5.3: Create structureBuilder (`core/generation/structureBuilder.ts`)
**THE CONVERGENCE POINT** - resolves 3 conflicts:

1. **Section-to-Document Mapping**: Single semantic algorithm
2. **Special Section Detection**: Always from DetectionMap (from documentParser)
3. **Memory-aware Ordering**: "Introduction to Application Form" always last

**Unified function**:
```typescript
export function buildDocumentStructure(
  source: FundingProgram | ParsedDocumentData,
  detectionResults?: DetectionMap
): DocumentStructure
```

### Step 5.4: Move blueprintGenerator (`core/generation/blueprintGenerator.ts`)
- MOVE (not copy) from `features/ai/services/blueprintGenerator.ts`
- Update to consume DocumentStructure (new output format)
- Keep old location with import redirect for safety

### Step 5.5: Create sectionWriter (`core/generation/sectionWriter.ts`)
- mergeUploadedContentWithSpecialSections() from normalizeDocumentStructure.ts
- Section content generation logic

---

## PHASE 6: UPDATE API ENDPOINTS (SAFE)

### Step 6.1: Update recommend.ts (`pages/api/programs/recommend.ts`)
**Change**: Direct LLM calls → Use orchestrator
```typescript
// OLD
const customResponse = await callCustomLLM(...)
const completion = await openai.chat.completions.create(...)

// NEW
const programs = await callAI({
  type: 'recommendPrograms',
  payload: { answers, maxResults }
})
```

### Step 6.2: Update blueprint.ts (`pages/api/programs/blueprint.ts`)
**Change**: Multi-step process → Use orchestrator + builders
```typescript
// NEW flow
const normalizedProgram = analyzeFundingProgram(selectedProgram)
const structure = buildDocumentStructure(normalizedProgram)
const blueprint = blueprintGenerator.generateBlueprint(structure)
```

### Step 6.3: Update assistant.ts (`pages/api/ai/assistant.ts`)
**Change**: Direct OpenAI calls → Use orchestrator
```typescript
// OLD
const completion = await openai.chat.completions.create(...)

// NEW
const response = await callAI({
  type: 'writeSection',
  payload: { message, context }
})
```

### Step 6.4: Move rateLimit.ts
- Move from `shared/lib/rateLimit.ts` → `core/api/utils/rateLimit.ts`
- Update imports in endpoints

---

## PHASE 7: MIGRATE COMPONENT IMPORTS (GRADUAL)

### Import Switch Pattern
**For each consumer**:
1. Replace: `import { useEditorStore } from '@/features/editor/lib'`
2. With: `import { useProject } from '@/core/context/hooks/useProject'`
3. Replace: `import { useUser } from '@/shared/user/context/UserContext'`
4. With: `import { useUser } from '@/core/context/hooks/useUser'`
5. Test component
6. Mark complete

**Consumers to migrate** (in order):
- All setup wizard components
- All editor components
- Recommendation components
- Dashboard components
- Auth components

### Safety Check After Each Group
- Component still renders
- localStorage still persists (unchanged structure during migration)
- No duplicate state updates

---

## PHASE 8: VERIFY NO EXTERNAL LLM CALLS

### Step 8.1: Search Entire Repo
```
grep -r "new OpenAI(" --include="*.ts" --include="*.tsx"
grep -r "callCustomLLM(" --include="*.ts" --include="*.tsx"
grep -r "fetch.*openai" --include="*.ts" --include="*.tsx"
grep -r "fetch.*llm" --include="*.ts" --include="*.tsx"
```

### Step 8.2: Fix Any External Calls
- Must route through `core/ai/orchestrator.ts`
- No direct LLM calls outside `/core/ai/`

---

## PHASE 9: DELETE OLD CODE (ONLY WHEN SAFE)

**Only execute AFTER Phase 8 verification passes**

### Files to Delete (in order):
1. `shared/user/context/UserContext.tsx` (no usage)
2. `features/editor/lib/store/editorStore.ts` (no usage)
3. `features/editor/lib/store/domains/*.ts` (5 files)
4. `features/reco/lib/programPersistence.ts` (no usage)
5. `features/ai/clients/customLLM.ts` (merged into core/ai/llmClient.ts)
6. `features/ai/lib/llmUtils.ts` (merged into core/ai/parsers)
7. `features/ai/lib/blueprintUtils.ts` (merged into core/ai/parsers)
8. `features/ai/services/blueprintGenerator.ts` (moved to core/generation)
9. `shared/lib/rateLimit.ts` (moved to core/api/utils)
10. `shared/user/schemas/userProfile.ts` (moved to core/types)
11. `features/editor/lib/types/types.ts` (barrel, replaced)
12. `features/editor/lib/types/*` (entire folder)
13. `features/reco/types.ts` (merged)

### After Deletion:
- Run full test suite
- Fix remaining import errors
- Verify no broken references

---

## EXECUTION CHECKLIST

### PHASE 0 ✓
- [ ] Create branch refactor/core-centralization

### PHASE 1 ✓
- [ ] Create /core directory structure (9 subdirs)

### PHASE 2 ✓
- [ ] core/types/index.ts, user.ts, project.ts, program.ts, blueprint.ts
- [ ] core/validation/index.ts, userSchemas.ts, programSchemas.ts, documentSchemas.ts
- [ ] Verify compilation: no errors, no cycles

### PHASE 3 ✓
- [ ] core/store/useProjectStore.ts (Zustand store)
- [ ] core/context/ProjectContext.tsx (Provider + initialization)
- [ ] core/context/hooks/useProject.ts (Main hook)
- [ ] core/context/hooks/useUser.ts (Backward compat hook)
- [ ] Verify localStorage persistence works

### PHASE 4 ✓
- [ ] core/ai/llmClient.ts (Unified client)
- [ ] core/ai/orchestrator.ts (Router)
- [ ] core/ai/prompts/* (3 prompt files)
- [ ] core/ai/parsers/* (3 parser files)

### PHASE 5 ✓
- [ ] core/analysis/documentParser.ts
- [ ] core/analysis/programAnalyzer.ts
- [ ] core/generation/structureBuilder.ts
- [ ] core/generation/blueprintGenerator.ts (moved + updated)
- [ ] core/generation/sectionWriter.ts

### PHASE 6 ✓
- [ ] pages/api/programs/recommend.ts (use orchestrator)
- [ ] pages/api/programs/blueprint.ts (use builders)
- [ ] pages/api/ai/assistant.ts (use orchestrator)
- [ ] Move rateLimit.ts

### PHASE 7 ✓
- [ ] Migrate setup wizard components (10 files)
- [ ] Migrate editor components (20 files)
- [ ] Migrate recommendation components (5 files)
- [ ] Migrate dashboard components (2 files)
- [ ] Migrate auth components (3 files)

### PHASE 8 ✓
- [ ] Search for external LLM calls
- [ ] Fix any found calls

### PHASE 9 ✓
- [ ] Delete old files (in order)
- [ ] Run full test suite
- [ ] Fix import errors

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Breaking existing features | Keep old code + redirect imports until new code verified |
| localStorage schema change | Migration script in ProjectStore initialization |
| Circular dependencies | Build types → validation → store → components hierarchy |
| Import cycles | Separate prompts/parsers as leaf modules |
| LLM call failures | Fallback logic in orchestrator unchanged from current |
| Missing environment variables | Same validation as current (OPENAI_API_KEY, CUSTOM_LLM_*) |

---

## SUCCESS CRITERIA

1. ✅ All new /core files compile without errors
2. ✅ Old files still work (redirect imports)
3. ✅ Components gradually switch to useProject()
4. ✅ No external LLM calls outside /core/ai/
5. ✅ Old files deleted when unused
6. ✅ Full test suite passes
7. ✅ Runtime behavior identical (no feature changes)
8. ✅ localStorage format unchanged during migration
