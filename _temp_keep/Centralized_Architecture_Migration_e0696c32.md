# A) FINAL FOLDER STRUCTURE

```
/
├── core/
│   ├── context/
│   │   ├── ProjectContext.tsx    # NEW: Unified Zustand store (user + project + program)
│   │   └── hooks/
│   │       ├── useProject.ts     # NEW: useProject() hook
│   │       └── useUser.ts        # NEW: useUser() hook (backward compatible)
│   ├── types/
│   │   ├── index.ts              # NEW: Central type exports
│   │   ├── user.ts               # NEW: UserProfile, UserContextValue
│   │   ├── project.ts            # NEW: ProjectProfile, BusinessPlan
│   │   ├── program.ts            # NEW: Program, FundingProgram, DocumentStructure
│   │   └── blueprint.ts         # NEW: Blueprint, BlueprintRequest
│   └── validation/
│       ├── index.ts              # NEW: Central Zod schema exports
│       ├── userSchemas.ts        # NEW: UserProfile, Session validation
│       ├── programSchemas.ts     # NEW: Program, FundingProgram, UserAnswers
│       └── documentSchemas.ts    # NEW: DocumentStructure, Section, TitlePage
│
├── ai/
│   ├── orchestrator.ts           # NEW: Single LLM entry point
│   ├── llmClient.ts              # NEW: Unified LLM client (customLLM + OpenAI)
│   ├── prompts/
│   │   ├── recommendation.ts     # NEW: Program recommendation prompts
│   │   ├── blueprint.ts          # NEW: Blueprint generation prompts
│   │   └── section.ts           # NEW: Section writing prompts
│   └── parsers/
│       ├── index.ts              # NEW: Central parser exports
│       ├── responseParsers.ts     # NEW: Unified LLM response parsing
│       └── sanitizers.ts         # NEW: LLM output sanitization
│
├── analysis/
│   ├── businessAnalyzer.ts       # NEW: Business analysis logic
│   ├── programAnalyzer.ts        # NEW: Program matching analysis
│   └── documentParser.ts         # NEW: Document parsing logic
│
├── generation/
│   ├── blueprintGenerator.ts     # MOVED: From features/ai/services
│   ├── sectionWriter.ts          # NEW: Section content generation
│   └── structureBuilder.ts       # NEW: Document structure builder
│
├── reco/
│   ├── components/
│   │   ├── ProgramFinder.tsx
│   │   └── QuestionRenderer.tsx
│   ├── data/
│   │   └── questions.ts
│   └── hooks/
│       └── useQuestionLogic.ts
│
├── templates/
│   └── index.ts                  # Existing, keep as-is
│
├── store/
│   └── useProjectStore.ts        # NEW: Zustand store (ProjectContext implementation)
│
└── api/
    ├── utils/
    │   └── rateLimit.ts          # MOVED: From shared/lib/rateLimit.ts
    ├── auth/
    │   ├── [...auth].ts          # NEW: Consolidated auth handler
    │   ├── login.ts
    │   ├── logout.ts
    │   ├── register.ts
    │   └── session.ts
    ├── programs/
    │   ├── recommend.ts          # UPDATED: Calls ai/orchestrator
    │   └── blueprint.ts          # UPDATED: Calls ai/orchestrator
    └── ai/
        └── assistant.ts          # UPDATED: Calls ai/orchestrator
```

---

# B) FILES TO MOVE (from → to)

## Step 1: Types Consolidation
| FROM | TO |
|------|-----|
| `shared/user/schemas/userProfile.ts` | `core/types/user.ts` |
| `features/editor/lib/types/program/program-types.ts` | `core/types/program.ts` |
| `features/reco/types.ts` | `core/types/program.ts` (merge) |
| `features/editor/lib/types/documents/document-types.ts` | `core/types/project.ts` |
| `features/editor/lib/types/core/template-types.ts` | `core/types/project.ts` |
| `features/editor/lib/types/workflow/setup-types.ts` | `core/types/project.ts` |
| `features/editor/lib/types/ai/ai-types.ts` | `core/types/blueprint.ts` |
| `features/editor/lib/types/ai/diagnostics-types.ts` | `core/types/blueprint.ts` |
| `features/ai/services/blueprintGenerator.ts` | `generation/blueprintGenerator.ts` |

## Step 2: Schema Consolidation
| FROM | TO |
|------|-----|
| `shared/user/schemas/userProfile.ts` (validation fns) | `core/validation/userSchemas.ts` |
| `features/reco/lib/programPersistence.ts` (schema) | `core/validation/programSchemas.ts` |
| `pages/api/programs/recommend.ts` (UserAnswersSchema) | `core/validation/programSchemas.ts` |
| `pages/api/programs/blueprint.ts` (BlueprintRequestSchema) | `core/validation/documentSchemas.ts` |

## Step 3: AI Layer Consolidation
| FROM | TO |
|------|-----|
| `features/ai/clients/customLLM.ts` | `ai/llmClient.ts` |
| `features/ai/lib/llmUtils.ts` | `ai/parsers/responseParsers.ts` |
| `features/ai/lib/blueprintUtils.ts` | `ai/parsers/sanitizers.ts` |

## Step 4: Rate Limiting
| FROM | TO |
|------|-----|
| `shared/lib/rateLimit.ts` | `api/utils/rateLimit.ts` |

---

# C) FILES TO DELETE

1. `shared/user/context/UserContext.tsx` (replaced by ProjectContext)
2. `features/editor/lib/store/editorStore.ts` (replaced by useProjectStore)
3. `features/editor/lib/store/domains/*.ts` (5 files, replaced by ProjectContext)
4. `features/reco/lib/programPersistence.ts` (logic moved to ProjectContext)
5. `features/ai/clients/customLLM.ts` (merged into ai/llmClient.ts)
6. `features/ai/lib/llmUtils.ts` (merged into ai/parsers)
7. `features/ai/lib/blueprintUtils.ts` (merged into ai/parsers)
8. `features/ai/services/blueprintGenerator.ts` (moved to generation/)
9. `shared/lib/rateLimit.ts` (moved to api/utils/)
10. `shared/user/schemas/userProfile.ts` (moved to core/)
11. `features/editor/lib/types/types.ts` (barrel, replaced by core/types/index.ts)
12. `features/reco/types.ts` (merged into core/types/program.ts)
13. `features/editor/lib/types/` (entire folder, replaced by core/types/)
14. `features/ai/README.md` (documentation, if not needed)

---

# D) NEW FILES TO CREATE

## Core Layer
1. `core/context/ProjectContext.tsx` - Unified Zustand store
2. `core/context/hooks/useProject.ts` - useProject() hook
3. `core/context/hooks/useUser.ts` - backward-compatible useUser hook
4. `core/types/index.ts` - Barrel export
5. `core/types/user.ts` - UserProfile + UserContextValue
6. `core/types/project.ts` - ProjectProfile, BusinessPlan, DocumentStructure
7. `core/types/program.ts` - Program, FundingProgram, ProgramSummary
8. `core/types/blueprint.ts` - Blueprint, BlueprintRequest, RequirementItem
9. `core/validation/index.ts` - Barrel export
10. `core/validation/userSchemas.ts` - User validation
11. `core/validation/programSchemas.ts` - Program validation
12. `core/validation/documentSchemas.ts` - Document validation

## AI Layer
13. `ai/orchestrator.ts` - Single LLM entry point
14. `ai/llmClient.ts` - Unified client (custom + OpenAI)
15. `ai/prompts/recommendation.ts` - Program recommendation prompts
16. `ai/prompts/blueprint.ts` - Blueprint generation prompts
17. `ai/prompts/section.ts` - Section writing prompts
18. `ai/parsers/index.ts` - Barrel export
19. `ai/parsers/responseParsers.ts` - Unified parsing
20. `ai/parsers/sanitizers.ts` - Output sanitization

## Analysis Layer
21. `analysis/businessAnalyzer.ts` - Business analysis
22. `analysis/programAnalyzer.ts` - Program matching
23. `analysis/documentParser.ts` - Document parsing

## Generation Layer
24. `generation/sectionWriter.ts` - Section content generation
25. `generation/structureBuilder.ts` - Structure building

## Store Layer
26. `store/useProjectStore.ts` - Zustand implementation

---

# E) ORDER OF MIGRATION (Step-by-Step)

## Phase 1: Core Types & Validation (Days 1-2)
1. Create `core/types/` directory and all type files
2. Create `core/validation/` directory and all schema files
3. Verify all types compile without errors
4. Test schemas with existing data

## Phase 2: AI Orchestrator (Days 3-4)
5. Create `ai/` directory structure
6. Create `ai/orchestrator.ts` - single LLM entry point
7. Create `ai/llmClient.ts` - unified client
8. Move prompts and parsers to `ai/prompts/` and `ai/parsers/`
9. Test AI orchestrator with existing endpoints

## Phase 3: ProjectContext (Days 5-6)
10. Create `core/context/ProjectContext.tsx` with Zustand
11. Create `store/useProjectStore.ts`
12. Create hooks `useProject.ts` and `useUser.ts`
13. Migrate all state from UserContext, editorStore, programPersistence
14. Test context initialization and persistence

## Phase 4: Analysis & Generation (Days 7-8)

**CRITICAL: This phase consolidates TWO PARALLEL FLOWS into unified core layers**

**Understanding the Dual-Flow Architecture:**

The system processes documents from two independent sources:
- **Program-Flows (2-program-flows):** Normalizes funding program data → DocumentStructure
- **Document-Flows (1-document-flows):** Extracts uploaded documents → DocumentStructure

Both flows must converge on the SAME DocumentStructure type to eliminate duplicate responsibilities.

**DUPLICATE RESPONSIBILITY RESOLUTION:**

Three critical conflicts must be resolved during this phase:

1. **Section-to-Document Mapping Conflict**
   - program-flows uses keyword matching (financial → financial document)
   - document-flows uses template hint matching
   - **Resolution:** Consolidate into structureBuilder.ts with ONE unified semantic strategy

2. **Special Section Detection Conflict**
   - program-flows has no explicit special section detection
   - document-flows explicitly detects title pages, TOC, references, appendices
   - **Resolution:** Move ALL detection to documentParser.ts, apply BEFORE structureBuilder regardless of source

3. **Section Ordering Conflict**
   - program-flows adds placeholder sections in arbitrary order
   - document-flows applies memory-aware ordering (e.g., "Introduction to Application Form" must be last)
   - **Resolution:** Enforce unified memory-aware ordering in structureBuilder.ts for both sources

**15. Create `analysis/` directory with dual-source analyzers**
   - `core/analysis/documentParser.ts` - Consolidates 1-document-flows extraction & detection
     - Moves: documentProcessor.ts, documentStructureDetector.ts, file extractors (docx/pdf/txt)
     - Responsibilities: Extract file content, detect structural elements, orchestrate extraction → detection pipeline
     - Unified function: `parseDocumentStructure(source, input, options)` → DetectionMap + initial DocumentStructure
   
   - `core/analysis/programAnalyzer.ts` - Consolidates 2-program-flows normalization
     - Moves: programNormalizer.ts (normalizeFundingProgram, normalizeProgramSetup)
     - Responsibilities: Normalize raw program data, analyze requirements, track setup diagnostics
     - Unified function: `analyzeFundingProgram(rawData)` → FundingProgram with analysis metadata

**16. Create `generation/` directory with unified builders**
   - `core/generation/structureBuilder.ts` (NEW) - THE CONVERGENCE POINT
     - Consolidates core logic from 2-program-flows/structureGenerator.ts (MOVED, not duplicate)
     - Unified responsibility: Build DocumentStructure from EITHER source (program OR document)
     - Input: Normalized FundingProgram OR ParsedDocumentData + optional DetectionMap
     - Output: Complete DocumentStructure with:
       - documents[] (with id, name, purpose, required)
       - sections[] (with documentId, title, type, required, programCritical)
       - requirements[] (financial, market, team, risk, formatting, evidence)
       - validationRules[] (presence, completeness, numeric, attachment)
       - aiGuidance[] (per-section prompts and checklists)
       - renderingRules{} (titlePage, tableOfContents, references, appendices)
     - Unified function: `buildDocumentStructure(source, detectionResults, options)` → Complete DocumentStructure
   
   - `core/generation/sectionWriter.ts` (NEW)
     - Consolidates: mergeUploadedContentWithSpecialSections() from normalizeDocumentStructure.ts
     - Responsibilities: Merge uploaded content with template special sections, generate section content

**17. Move `blueprintGenerator.ts` to `generation/`**
   - Update to consume DocumentStructure as input
   - Creates Blueprint objects from normalized DocumentStructure

## Phase 5: API Updates & Flow Integration (Days 9-10)

**NOW: Integrate analysis and generation layers into API endpoints**

**DATA FLOW INTEGRATION:**

```
PROGRAM PATH                          DOCUMENT PATH
         |                                    |
         v                                    v
FundingProgram (raw)          File (DOCX/PDF/TXT)
         |                                    |
         +---> programAnalyzer.ts            |
         |                                    |
         |                          +---> documentParser.ts
         |                          |       [extraction + detection]
         |                          |
         +------> structureBuilder.ts <-------+
                       |
                       v
          DocumentStructure (unified)
        - documents[]
        - sections[] (with documentId)
        - requirements[]
        - validationRules[]
        - aiGuidance[]
        - renderingRules{}
```

**User-Facing Flows That Produce DocumentStructure:**

1. **Program Selection Path** (from features/reco):
   - User selects ProgramSummary → programAnalyzer.normalizeFundingProgram() → structureBuilder.buildDocumentStructure() → DocumentStructure

2. **Document Upload Path** (from features/editor):
   - User uploads File → documentParser.parseDocumentStructure() → structureBuilder.buildDocumentStructure() → DocumentStructure

3. **Template Selection Path** (from features/editor):
   - User selects DocumentTemplate → documentParser.parseDocumentStructure('template', data) → structureBuilder.buildDocumentStructure() → DocumentStructure

**18. Update `pages/api/programs/recommend.ts`**
   - Input: User answers from features/reco
   - Call: programAnalyzer.analyzeFundingProgram() → structured program requirements
   - Output: List of recommended ProgramSummary options
   - Path: Calls ai/orchestrator for recommendation ranking

**19. Update `pages/api/programs/blueprint.ts`**
   - Input: Selected program + user data
   - Process:
     - Call: programAnalyzer.analyzeFundingProgram(selected_program)
     - Call: structureBuilder.buildDocumentStructure(normalized_program)
     - Call: blueprintGenerator.generateBlueprint(document_structure)
   - Output: Blueprint with AI guidance and requirements
   - Path: Uses ai/orchestrator for content generation

**20. Update `pages/api/ai/assistant.ts`**
   - Input: User context + current document state
   - Process: Uses DocumentStructure context from either program or document sources
   - Output: AI-assisted recommendations
   - Path: Calls ai/orchestrator with full context

**21. Move rate limiting to `api/utils/rateLimit.ts`**

## Phase 6: Cleanup (Days 11-12)
22. Delete old duplicated files (in order):
    - Delete UserContext.tsx
    - Delete editorStore.ts and domains/
    - Delete programPersistence.ts
    - Delete customLLM.ts
    - Delete llmUtils.ts
    - Delete blueprintUtils.ts
    - Delete old type folders
    - Delete rateLimit.ts from shared/lib/
23. Update all imports across codebase (automated refactor)
24. Run full test suite
25. Fix any remaining import errors

---

# F) DEPENDENCY ORDER (Critical Path)

```
1. core/types/*                    (no dependencies)
   - Must define: DocumentStructure, FundingProgram, ProgramSummary

2. core/validation/*               (depends on types)
   - Must validate: DocumentStructure, FundingProgram shapes

3. ai/orchestrator                 (depends on types)

4. ai/llmClient                    (depends on orchestrator)

5. ai/prompts/*                    (no dependencies)

6. ai/parsers/*                    (depends on prompts)

7. core/analysis/documentParser.ts (depends on types)
   - Extracts file content
   - Detects structural elements
   - Returns: DetectionMap + initial DocumentStructure

8. core/analysis/programAnalyzer.ts (depends on types)
   - Normalizes raw program data
   - Returns: FundingProgram with analysis metadata

9. core/generation/structureBuilder.ts (depends on types + analysis output)
   - CRITICAL CONVERGENCE POINT
   - Consumes: FundingProgram OR ParsedDocumentData + DetectionMap
   - Produces: Complete DocumentStructure
   - Applies:
     * Unified section-to-document mapping (ONE strategy)
     * Unified special section detection (from documentParser)
     * Unified memory-aware section ordering

10. core/generation/blueprintGenerator.ts (depends on structureBuilder output)
    - Consumes: DocumentStructure
    - Produces: Blueprint

11. core/generation/sectionWriter.ts (depends on types)

12. core/context/*                 (depends on types + validation)

13. store/*                        (depends on context)

14. api/*                          (depends on all above)
    - Orchestrates: programAnalyzer → structureBuilder → blueprintGenerator

15. Delete old files               (last step)
    - 2-program-flows directory (moved to core/analysis + core/generation)
    - 1-document-flows directory (moved to core/analysis)
```

**CRITICAL SEQUENCING NOTE:**

DocumentStructure is the SINGLE SOURCE OF TRUTH. All three user-facing paths (program selection, document upload, template selection) must produce the SAME DocumentStructure type via:
1. **Phase 1-3:** Core types, validation, AI layers (prerequisites)
2. **Phase 4a:** Parallel analyzers (documentParser + programAnalyzer)
3. **Phase 4b:** Unified convergence point (structureBuilder)
4. **Phase 5:** API integration using structureBuilder output
5. **Phase 6:** Delete old duplicated flow directories

---

---

# H) FLOW INTEGRATION ARCHITECTURE (From FLOW_INTEGRATION_ANALYSIS.md)

## Overview: Dual-Flow Convergence Design

The system handles document structure generation from TWO parallel, independent sources that must be unified:

| Source | Flow | Entry Point | Processing | Output |
|--------|------|-------------|-----------|--------|
| **Program Data** | 2-program-flows | FundingProgram (raw) | programAnalyzer → structureBuilder | DocumentStructure |
| **Uploaded File** | 1-document-flows | File (DOCX/PDF/TXT) | documentParser → structureBuilder | DocumentStructure |
| **Template Data** | 1-document-flows | DocumentTemplate | documentParser → structureBuilder | DocumentStructure |

**Single Unified Output:** All three paths produce the SAME `DocumentStructure` type, eliminating inconsistencies.

---

## Block 1: Input Normalization (Analysis Layer)

### Block 1A: Program Analyzer (`core/analysis/programAnalyzer.ts`)

**Source Files to Consolidate:**
- FROM: `features/editor/lib/utils/2-program-flows/program-flows/programNormalizer.ts`
- FROM: `features/editor/lib/utils/2-program-flows/program-flows/structureGenerator.ts` (logic REFERENCE only)

**Input:** Raw FundingProgram data (from features/reco selection)

**Processing Chain:**
```
Raw Program Data
  ↓
normalizeFundingProgram(rawData)
  - Extract funding types, amount ranges, deadline
  - Parse applicationRequirements
    * documents[] requirements
    * sections[] requirements
    * financialRequirements
  - Create preliminary FundingProgram structure
  ↓
Return: FundingProgram + analysis metadata
  - id, name, provider
  - fundingTypes, amountRange, deadline
  - applicationRequirements { documents[], sections[], financialRequirements }
  - blueprint (optional enhanced requirements)
  - analysis { sections[], documents[], confidence }
```

**Output Type: FundingProgram**
```typescript
interface FundingProgram {
  id: string
  name: string
  provider: string
  fundingTypes: FundingType[]
  amountRange: { min: number; max: number }
  deadline: string
  applicationRequirements: {
    documents: DocumentRequirement[]
    sections: SectionRequirement[]
    financialRequirements: FinancialRequirement[]
  }
  blueprint?: BlueprintData
  analysis?: AnalysisMetadata
}
```

---

### Block 1B: Document Parser (`core/analysis/documentParser.ts`)

**Source Files to Consolidate:**
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/documentProcessor.ts` (orchestration)
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/documentStructureDetector.ts` (detection functions)
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/extractFileContent.ts`
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/extractors/docxExtractor.ts`
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/extractors/pdfExtractor.ts`
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/extractors/txtExtractor.ts`
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/rawTextToSections.ts` (private)
- FROM: `features/editor/lib/utils/1-document-flows/document-flows/normalizeDocumentStructure.ts` (private)

**Input:** File or DocumentTemplate data

**Processing Chain:**
```
Uploaded File (DOCX/PDF/TXT) OR Template
  ↓
extractFileContent(file)
  - Detect file type
  - Route to appropriate extractor
  - Return raw text + metadata
  ↓
detectDocumentStructure(rawText)
  - Detect headings, structure hints
  - Detect special sections: title page, TOC, references, appendices
  - Detect template hints (business_plan, strategy, etc.)
  - Return DetectionMap with confidence scores
  ↓
rawTextToSections(rawText)
  - Convert flat text to hierarchical sections
  - Apply detected structure
  ↓
normalizeDocumentStructure(sections, detectionResults)
  - Canonicalize special section IDs
  - Apply memory-aware section ordering
  - Merge with template special sections
  - Deduplicate sections
  - Return initial DocumentStructure
  ↓
Return: DocumentStructure + DetectionMap
```

**Output Type: ParsedDocumentData**
```typescript
interface ParsedDocumentData {
  structure: DocumentStructure  // initial/normalized
  detection: DetectionMap       // structural element confidence
  specialSections: SpecialSection[]
  confidence: number
  metadata: {
    source: 'upload' | 'template'
    fileName?: string
    fileType?: string
  }
}

interface DetectionMap {
  titlePageConfidence: number
  tocConfidence: number
  referencesConfidence: number
  appendicesConfidence: number
  templateType?: 'business_plan' | 'strategy' | 'financial' | string
  detectedSections: SectionDetection[]
}
```

---

## Block 2: Unified Structure Building (Generation Layer - CONVERGENCE POINT)

### Block 2A: Structure Builder (`core/generation/structureBuilder.ts`)

**THE CRITICAL CONVERGENCE POINT WHERE BOTH FLOWS MERGE**

**Source Files Reference:**
- FROM: `features/editor/lib/utils/2-program-flows/program-flows/structureGenerator.ts` (CORE LOGIC, moved not duplicated)

**Input:** Either normalized FundingProgram OR ParsedDocumentData

**Processing Chain:**
```
FundingProgram OR ParsedDocumentData
  ↓
Build DocumentStructure with:
  1. Unified section-to-document mapping
     - STRATEGY: Semantic analysis of section names against document purposes
     - CONFLICT RESOLUTION: One algorithm for both sources (previously: keyword matching vs template matching)
     - REQUIREMENT: Map program sections to document containers intelligently
  ↓
  2. Apply unified special section detection
     - INPUT: DetectionMap from documentParser (or placeholder for program path)
     - CONFLICT RESOLUTION: All special section detection always via documentParser
     - OUTPUT: Canonical section IDs (METADATA_SECTION_ID, ANCILLARY_SECTION_ID, etc.)
  ↓
  3. Apply unified memory-aware section ordering
     - MEMORY CONSTRAINT: "Document section ordering: 'Introduction to Application Form' must be last"
     - CONFLICT RESOLUTION: One ordering policy for both sources
     - REQUIREMENT: Apply sortSectionsForSingleDocument() logic to all sources
  ↓
  4. Generate derived requirements
     - Extract validation rules from program requirements
     - Generate AI guidance from program critical sections
     - Create rendering rules (title page, TOC, references, appendices)
  ↓
Return: Complete DocumentStructure
```

**Key Unified Function:**
```typescript
export function buildDocumentStructure(
  source: FundingProgram | ParsedDocumentData,
  detectionResults?: DetectionMap,
  options?: {
    includeSpecialSections?: boolean
    applyOrdering?: boolean
  }
): DocumentStructure
```

**Output Type: DocumentStructure (UNIFIED)**
```typescript
interface DocumentStructure {
  // Document containers
  documents: Document[] // with id, name, purpose, required
  
  // Content sections mapped to documents
  sections: Section[]   // with documentId, title, type, required, programCritical, aiGuidance
  
  // Validation & compliance rules
  requirements: Requirement[]        // financial, market, team, risk, formatting, evidence
  validationRules: ValidationRule[]  // presence, completeness, numeric, attachment
  
  // AI-assisted content generation
  aiGuidance: AIGuidance[]           // per-section prompts and checklists
  
  // Special sections and rendering
  renderingRules: RenderingRules     // titlePage, tableOfContents, references, appendices
  
  // Quality & diagnostic metadata
  conflicts: ConflictItem[]
  warnings: WarningItem[]
  confidenceScore: number
  metadata: {
    source: 'program' | 'document' | 'template'
    generatedAt: string
    version: string
  }
}
```

**CONFLICT RESOLUTION EMBEDDED IN structureBuilder:**

1. **Section-to-Document Mapping** (lines X-Y in structureBuilder.ts)
   - Single unified semantic algorithm
   - Analyzes program section titles against document purposes
   - Creates mappings that respect both sources identically

2. **Special Section Detection** (lines X-Y in structureBuilder.ts)
   - Always consumes DetectionMap from documentParser
   - For program path: synthesize DetectionMap from program structure
   - Canonicalizes IDs consistently (METADATA_SECTION_ID, ANCILLARY_SECTION_ID)

3. **Section Ordering** (lines X-Y in structureBuilder.ts)
   - Memory-aware constraints always applied
   - "Introduction to Application Form" always positioned last
   - Consistent across program and document sources

---

### Block 2B: Blueprint Generator (`core/generation/blueprintGenerator.ts`)

**Input:** DocumentStructure (from structureBuilder)

**Processing:**
- Create enhanced Blueprint with AI guidance
- Generates prompts and requirements for AI section writing
- Creates checklist items for validation

**Output:** Blueprint

---

### Block 2C: Section Writer (`core/generation/sectionWriter.ts`)

**Input:** DocumentStructure + selected sections

**Processing:**
- Merges uploaded content with template special sections
- Generates placeholder content for empty sections
- Applies formatting rules

**Output:** Enhanced DocumentStructure with content

---

## Block 3: User-Facing Paths (How Flows Reach Structure)

### Path 1: Program Selection (from features/reco)
```
User selects ProgramSummary
  ↓
API: pages/api/programs/recommend.ts
  ↓
programAnalyzer.analyzeFundingProgram(selected_program)
  ↓
structureBuilder.buildDocumentStructure(program)
  ↓
Return: DocumentStructure to features/editor
  ↓
Display document setup UI
```

### Path 2: Document Upload (from features/editor)
```
User uploads DOCX/PDF/TXT
  ↓
API: pages/api/programs/blueprint.ts (with file)
  ↓
documentParser.parseDocumentStructure('upload', file)
  ↓
structureBuilder.buildDocumentStructure(parsed_data, detection)
  ↓
Return: DocumentStructure to features/editor
  ↓
Display document setup UI (optionally merge with program)
```

### Path 3: Template Selection (from features/editor)
```
User selects DocumentTemplate
  ↓
API: pages/api/programs/blueprint.ts (with template_id)
  ↓
documentParser.parseDocumentStructure('template', template_data)
  ↓
structureBuilder.buildDocumentStructure(parsed_data, detection)
  ↓
Return: DocumentStructure to features/editor
  ↓
Display document setup UI
```

---

## Files to Migrate: Complete Mapping

### From 2-program-flows (Consolidate into analysis + generation)
| Source File | Function | Destination | Block |
|---|---|---|---|
| programNormalizer.ts | normalizeFundingProgram() | core/analysis/programAnalyzer.ts | Block 1A |
| programNormalizer.ts | normalizeProgramSetup() | core/analysis/programAnalyzer.ts | Block 1A |
| structureGenerator.ts | generateDocumentStructureFromProfile() | core/generation/structureBuilder.ts | Block 2A |
| programConverter.ts | generateProgramBlueprint() | core/ai/parsers/ | (backward compat) |

### From 1-document-flows (Consolidate into analysis + generation)
| Source File | Function | Destination | Block |
|---|---|---|---|
| documentProcessor.ts | processDocumentSecurely() | core/analysis/documentParser.ts | Block 1B |
| documentProcessor.ts | extractContentFromFiles() | core/analysis/documentParser.ts | Block 1B |
| extractFileContent.ts | extractFileContent() | core/analysis/documentParser.ts | Block 1B |
| docxExtractor.ts | docxExtractor() | core/analysis/documentParser.ts | Block 1B |
| pdfExtractor.ts | pdfExtractor() | core/analysis/documentParser.ts | Block 1B |
| txtExtractor.ts | txtExtractor() | core/analysis/documentParser.ts | Block 1B |
| documentStructureDetector.ts | detectDocumentStructure() | core/analysis/documentParser.ts | Block 1B |
| documentStructureDetector.ts | applyDetectionResults() | core/analysis/documentParser.ts | Block 1B |
| rawTextToSections.ts | rawTextToSections() | core/analysis/documentParser.ts (private) | Block 1B |
| normalizeDocumentStructure.ts | normalizeDocumentStructure() | core/analysis/documentParser.ts (private) | Block 1B |
| normalizeDocumentStructure.ts | mergeUploadedContentWithSpecialSections() | core/generation/sectionWriter.ts | Block 2C |
| documentProcessingUtils.ts | helper functions | core/analysis/utils/documentProcessingUtils.ts | (utility) |

### Special Handling
- DELETE ENTIRE: `features/editor/lib/utils/2-program-flows/` (all files consolidated)
- DELETE ENTIRE: `features/editor/lib/utils/1-document-flows/` (all files consolidated)
- KEEP REFERENCE: Type definitions may be in features/editor/lib/utils/1-document-flows/document-flows/sections/types.ts (merge into core/types/)

---

# G) BACKWARD COMPATIBILITY NOTES

- `useUser()` hook must remain available (export from core/context/hooks/useUser.ts)
- All existing API endpoints must continue to work
- localStorage format changes require migration script
- Types in `core/types/*` must export existing interfaces