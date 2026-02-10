# Complete File Map & Proposed Centralized Architecture

## SECTION 1: CURRENT FILE MAP

### 1. PROJECT / PROFILE DATA

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `shared/user/context/UserContext.tsx` | User profile context provider with localStorage persistence | React, validateUserProfile, fetchProfileFromApi | UserProfile schema, API endpoints |
| `shared/user/schemas/userProfile.ts` | UserProfile interface + validation (segment, programType, industry, language, payerType, experience) | Zod validation | None (root schema) |
| `features/editor/lib/store/editorStore.ts` | Zustand store with 5 domains: Plan, Template, SetupWizard, UI, Program | zustand, domain creators | All domain files |
| `features/editor/lib/store/domains/planDomain.ts` | Plan state/actions (plan, sections, metadata) | MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT | Template domain |
| `features/editor/lib/store/domains/templateDomain.ts` | Template state/actions (selectedProduct, allSections, allDocuments) | MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT | Template catalog |
| `features/editor/lib/store/domains/setupWizardDomain.ts` | Setup wizard state (projectProfile, programProfile, documentStructure) | SetupWizardState interface | Program domain |
| `features/editor/lib/store/domains/programDomain.ts` | Program state (programSummary, loading, error) | ProgramSummary interface | Program types |
| `features/editor/lib/store/domains/uiDomain.ts` | UI state (show/hide, editing, expansion) | None | None |
| `features/reco/lib/programPersistence.ts` | localStorage save/load selectedProgram with Zod validation + DOMPurify sanitization | Zod, isomorphic-domorify | Program types |
| `features/reco/types.ts` | Program interface, QuestionDefinition (single/multi-select, range) | None | None |
| `features/editor/lib/types/types.ts` | Core types export barrel | All type files | All type files |

### 2. AI / LLM LOGIC

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `features/ai/clients/customLLM.ts` | Unified LLM client for multiple providers (OpenAI, Gemini, Groq, OpenRouter, HuggingFace) with token tracking | Environment config, fetch | None |
| `features/ai/services/blueprintGenerator.ts` | Generates Blueprint from program + context using LLM | callCustomLLM, parseBlueprintResponse, createFallbackBlueprint | customLLM, llmUtils |
| `features/ai/lib/llmUtils.ts` | LLM response sanitization + parsing (parseLLMResponse, parseProgramResponse, parseBlueprintResponse) | sanitizeLLMResponse | None |
| `features/ai/lib/blueprintUtils.ts` | createFallbackBlueprint for error recovery | Blueprint type | blueprintGenerator |
| `pages/api/ai/assistant.ts` | Editor AI endpoint (generate/improve/compliance/suggest actions) | OpenAI, callCustomLLM, createSystemPrompt, parseAIResponse | customLLM |
| `features/editor/components/Editor/sectionAiClient.ts` | Client-side AI request builder for editor sections | /api/ai/assistant endpoint | assistant.ts API |

### 3. DOCUMENT HANDLING

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `features/editor/lib/document-flow/processUploadedDocument.ts` | Process uploaded DOCX/PDF as template or upgrade | processDocumentSecurely, findWeaknesses, findMissingSections | Document structure types |
| `features/editor/lib/types/documents/document-types.ts` | TitlePage, PlanSection, PlanDocument, BusinessPlan types | SectionTemplate, DocumentTemplate | template-types |
| `features/editor/lib/types/core/template-types.ts` | DocumentTemplate, SectionTemplate interfaces | None | None |
| `features/editor/lib/types/program/program-types.ts` | FundingProgram, DocumentStructure, ProgramSummary, SetupDiagnostics | None | None |
| `features/editor/lib/renderers.ts` | Preview rendering utilities | React, document types | None |
| `features/editor/components/Preview/PreviewWorkspace.tsx` | Live document preview with zoom | SectionRenderer | All renderer components |

### 4. FUNDING / PROGRAM LOGIC

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `pages/api/programs/recommend.ts` | Program recommendation endpoint with LLM + Zod validation + caching | UserAnswersSchema, generateProgramsWithLLM, checkRecommendRateLimit | customLLM, rateLimit |
| `pages/api/programs/blueprint.ts` | Blueprint generation endpoint | BlueprintRequestSchema, generateBlueprint, checkBlueprintRateLimit | blueprintGenerator, rateLimit |
| `features/reco/hooks/useQuestionLogic.ts` | Question filtering, translation, answer handling, program generation hooks | ALL_QUESTIONS, useI18n | questions.ts |
| `features/reco/data/questions.ts` | ALL_QUESTIONS array (funding_intent, organisation_type, company_stage, revenue_status, etc.) | QuestionDefinition type | None |
| `features/reco/components/ProgramFinder.tsx` | Main reco wizard component | QuestionRenderer, useQuestionLogic | All question types |
| `features/editor/components/Navigation/CurrentSelection/ProgramSelection/ProgramSelection.tsx` | Program selection configurator (MyProject + Program + Template + Free) | useEditorStore, setDocumentStructure | All option components |
| `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/ProgramOption.tsx` | Manual program connection with sanitization | DOMPurify, /api/programs/blueprint | blueprint.ts API |
| `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/DocumentUploadOption.tsx` | Template upload (template/upgrade modes) | useEditorStore, processUploadedDocument | processUploadedDocument |

### 5. API ROUTES

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `pages/api/auth/login.ts` | Login with session creation | findUserByEmail, verifyPassword, createSession | database/repository |
| `pages/api/auth/register.ts` | Registration with persona mapping | createUser, createSession | database/repository |
| `pages/api/auth/session.ts` | Get current session | findSession, findUserById | database/repository |
| `pages/api/auth/logout.ts` | Session cleanup | - | database/repository |
| `pages/api/user/profile.ts` | User profile endpoint | findUserById, updateLastActive | database/repository |
| `pages/api/ai/assistant.ts` | Editor AI assistant | OpenAI, callCustomLLM | customLLM |
| `pages/api/programs/recommend.ts` | Program recommendations | customLLM, rate limiting | customLLM |
| `pages/api/programs/blueprint.ts` | Blueprint generation | blueprintGenerator, rate limiting | blueprintGenerator |
| `pages/api/payments/create-session.ts` | Stripe checkout | stripe | - |
| `pages/api/payments/webhook.ts` | Stripe webhook | stripe | - |
| `pages/api/ml-training/plans.ts` | ML training data | - | - |
| `pages/api/admin/setup.ts` | Admin setup | - | - |

### 6. SECURITY / MIDDLEWARE

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `shared/lib/rateLimit.ts` | In-memory rate limiting (LLM, RECOMMEND, BLUEPRINT, GENERAL) | NextApiRequest | None |
| `shared/user/auth/withAuth.tsx` | HOC for protected routes | useUser, useRouter | UserContext |
| `features/reco/lib/programPersistence.ts` | XSS sanitization with DOMPurify | isomorphic-domorify | Zod |
| `features/editor/lib/utils/1-document-flows/document-flows/processing/security/contentSecurityValidator.ts` | Content validation | - | - |

### 7. UTILITIES

| File | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `shared/lib/utils.ts` | cn() className combiner | None | None |
| `shared/lib/database.ts` | PostgreSQL pool, page metadata normalization | pg | None |
| `shared/user/database/repository.ts` | User/session repository stubs | UserRecord, SessionRecord | None |
| `features/editor/lib/constants.ts` | MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT, section IDs | None | None |
| `features/editor/lib/templates/index.ts` | Template catalog export | All templates | None |
| `features/ai/README.md` | AI feature documentation | None | None |

### 8. EDITOR TYPES (features/editor/lib/types)

| File/Directory | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `types/ai/ai-types.ts` | AI section types | None | None |
| `types/ai/diagnostics-types.ts` | Setup diagnostics types | None | None |
| `types/core/product-types.ts` | ProductType enum/interface | None | None |
| `types/core/template-types.ts` | DocumentTemplate, SectionTemplate | None | None |
| `types/documents/document-types.ts` | TitlePage, PlanSection, PlanDocument, BusinessPlan | SectionTemplate | template-types |
| `types/program/program-types.ts` | FundingProgram, DocumentStructure, ProgramSummary, SetupDiagnostics | None | None |
| `types/ui/navigation-types.ts` | Navigation UI types | None | None |
| `types/ui/ui-components.ts` | UI component props/types | None | None |
| `types/workflow/setup-types.ts` | Setup wizard workflow types | None | None |
| `types/types.ts` | Core types export barrel | All type files | All type files |

### 9. EDITOR TEMPLATES (features/editor/lib/templates)

| File/Directory | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `templates/actions/addCustomDocument.ts` | Add custom document action | None | None |
| `templates/actions/addCustomSection.ts` | Add custom section action | None | None |
| `templates/actions/addCustomSubsection.ts` | Add custom subsection action | None | None |
| `templates/catalog/products/business_plan.ts` | Business plan product template | SectionTemplate | None |
| `templates/catalog/products/strategy.ts` | Strategy product template | SectionTemplate | None |
| `templates/catalog/products/upgrade.ts` | Upgrade product template | SectionTemplate | None |
| `templates/catalog/programs/individual/aws-seedfinancing.ts` | AWS Seedfinancing program template | None | None |
| `templates/catalog/programs/individual/eic-accelerator.ts` | EIC Accelerator template | None | None |
| `templates/catalog/programs/individual/ffg-basisprogramm.ts` | FFG Basisprogramm template | None | None |
| `templates/catalog/programs/individual/individual-grant.ts` | Individual grant template | None | None |
| `templates/catalog/programs/programManager.ts` | Program template manager | Individual program files | None |
| `templates/general/templateConstants.ts` | Template constants | None | None |
| `templates/index.ts` | Template catalog export barrel | All templates | None |

### 10. EDITOR UTILS (features/editor/lib/utils)

| File/Directory | Purpose | Dependencies | Depends On |
|------|---------|--------------|------------|
| `utils/1-document-flows/document-flows/common/documentProcessingUtils.ts` | Shared document processing utilities | None | None |
| `utils/1-document-flows/document-flows/normalization/normalizeDocumentStructure.ts` | Document structure normalization | Document types | None |
| `utils/1-document-flows/document-flows/processing/detection/documentStructureDetector.ts` | Structure detection from content | None | None |
| `utils/1-document-flows/document-flows/processing/extractors/docxExtractor.ts` | DOCX text extraction | None | None |
| `utils/1-document-flows/document-flows/processing/extractors/extractFileContent.ts` | Unified file content extraction | DOCX/PDF/TXT extractors | None |
| `utils/1-document-flows/document-flows/processing/extractors/pdfExtractor.ts` | PDF text extraction | None | None |
| `utils/1-document-flows/document-flows/processing/extractors/txtExtractor.ts` | TXT text extraction | None | None |
| `utils/1-document-flows/document-flows/processing/security/contentSecurityValidator.ts` | Content XSS sanitization | DOMPurify | None |
| `utils/1-document-flows/document-flows/processing/security/validateStructure.ts` | Structure validation | None | None |
| `utils/1-document-flows/document-flows/processing/semantic/llmEnhancer.ts` | AI semantic enhancement | customLLM | None |
| `utils/1-document-flows/document-flows/processing/semantic/ruleBasedSemanticMapper.ts` | Rule-based semantic mapping | None | None |
| `utils/1-document-flows/document-flows/processing/structure/rawTextToSections.ts` | Convert raw text to sections | DocumentStructure type | None |
| `utils/1-document-flows/document-flows/processing/structure/splitDocument.ts` | Split document into sections | None | None |
| `utils/1-document-flows/document-flows/processing/documentProcessor.ts` | Main document processor pipeline | All extractors, detectors | None |
| `utils/1-document-flows/document-flows/sections/enhancement/sectionEnhancement.ts` | Section enhancement logic | None | None |
| `utils/1-document-flows/document-flows/sections/types.ts` | Section flow types | None | None |
| `utils/1-document-flows/document-flows/utils/editorUtils.ts` | Editor utility functions | None | None |
| `utils/1-document-flows/document-flows/organizeForUiRendering.ts` | Organize structure for UI | None | None |
| `utils/2-program-flows/program-flows/conversion/programConverter.ts` | Program data conversion | Program types | None |
| `utils/2-program-flows/program-flows/data-processing/programNormalizer.ts` | Program data normalization | Program types | None |
| `utils/2-program-flows/program-flows/structure-generation/structureGenerator.ts` | Generate structure from program | Blueprint types | None |
| `utils/4-blueprint-flows/blueprint-flows/document-instantiation/instantiateFromBlueprint.ts` | Create document from blueprint | Blueprint, DocumentStructure | None |

## SECTION 2: DUPLICATION ANALYSIS

### Current Issues:

1. **Two Contexts**: `UserContext` (user profile) + `useEditorStore` (project/program data) - no unified ProjectContext
2. **LLM Clients**: `customLLM.ts` (features/ai) + OpenAI client in `assistant.ts` - dual paths
3. **Program Persistence**: `programPersistence.ts` (features/reco) + localStorage in `ProgramSelection.tsx` - scattered storage
4. **Validation**: `UserProfile` validation + `UserAnswersSchema` + `BlueprintRequestSchema` + `PersistedProgramSchema` - inconsistent schemas
5. **Response Parsing**: `llmUtils.ts` + inline parsing in `recommend.ts` + inline parsing in `assistant.ts` - duplicated logic
6. **Rate Limiting**: `shared/lib/rateLimit.ts` + inline checks in endpoints

---

## SECTION 3: PROPOSED CENTRALIZED ARCHITECTURE

```
/core                           # Centralized core modules
  /context
    ProjectContext.tsx         # SINGLE source of truth: user + project + program
    hooks/
      useProject.ts           # useProject() hook
      useUser.ts               # useUser() hook (unified)
  /types
    index.ts                   # Central type exports
    user.ts                   # UserProfile, UserContextValue
    project.ts                # ProjectProfile, BusinessPlan
    program.ts                # Program, FundingProgram, DocumentStructure
    blueprint.ts              # Blueprint, BlueprintRequest
  /validation
    index.ts                   # Centralized Zod schemas
    userSchemas.ts            # UserProfile, Session validation
    programSchemas.ts         # Program, FundingProgram, UserAnswers
    documentSchemas.ts        # DocumentStructure, Section, TitlePage

/ai                            # Centralized AI orchestration
  /clients
    llmClient.ts              # SINGLE LLM client (customLLM + OpenAI unified)
    tokenTracker.ts           # Token usage tracking
  /services
    orchestrator.ts           # AI request routing (recommend vs blueprint vs assistant)
    prompts/
      recommendation.ts       # Program recommendation prompts
      blueprint.ts            # Blueprint generation prompts
      section.ts              # Section writing prompts
  /parsers
    responseParsers.ts        # Unified LLM response parsing
    sanitizers.ts             # LLM output sanitization

/reco                          # Recommendation engine (kept as feature)
  /components
    ProgramFinder.tsx         # Main reco wizard
    QuestionRenderer.tsx      # Question display
  /data
    questions.ts              # Question definitions
  /hooks
    useQuestionLogic.ts       # Shared question logic
  /types.ts                    # Program, QuestionDefinition (moved to /core/types)

/templates                     # Template management
  index.ts                     # MASTER_SECTIONS, MASTER_DOCUMENTS_BY_PRODUCT
  sectionTemplates.ts          # Section template definitions
  documentTemplates.ts        # Document template definitions

/store                         # State management
  useProjectStore.ts           # Zustand store (unified ProjectContext)
  domains/
    planDomain.ts            # Plan structure (merged with template)
    setupWizardDomain.ts      # Setup flow (simplified)
    uiDomain.ts               # UI state only

/api                          # API layer (consolidated)
  /auth
    [...auth].ts             # NextAuth-style handler
  /programs
    recommend.ts             # Program recommendations
    blueprint.ts             # Blueprint generation
  /ai
    assistant.ts             # Editor AI (calls /ai/orchestrator)
  /utils
    rateLimit.ts             # Rate limiting (shared)

/lib                          # Shared utilities
  database.ts                 # Database connection
  utils.ts                    # cn() and helpers
  sanitization.ts             # XSS sanitization (shared)

/export                       # Export engine
  pricing.ts                  # Pricing/export logic
```

---

## SECTION 11: KEY CHANGES

### 11.1 Single ProjectContext
- Merge `UserContext` + `useEditorStore` into `ProjectContext`
- Store: `userProfile`, `projectProfile`, `selectedProgram`, `documentStructure`, `businessPlan`
- Actions: `setProject`, `selectProgram`, `updatePlan`, `clearAll`

### 11.2 Single AI Orchestrator
- Create `/ai/orchestrator.ts` that routes all LLM requests
- Unified `callAI(request: AIRequest): Promise<AIResponse>`
- Eliminates dual OpenAI/customLLM paths

### 11.3 Centralized Validation
- All schemas in `/core/validation`
- Reuse Zod schemas across frontend (persistence) and backend (API validation)

### 11.4 Centralized Storage
- `selectedProgram` persistence in single location (`programPersistence.ts`)
- All components use same save/load/clear functions

### 11.5 Removed Duplication
- Merge `blueprintUtils.ts` into `/ai/parsers`
- Merge `llmUtils.ts` into `/ai/parsers`
- Consolidate rate limit configs into single `RATE_LIMITS` constant

---

## SECTION 12: MIGRATION PRIORITY

1. **Phase 1**: Create `/core/types` and consolidate all type definitions
2. **Phase 2**: Create `/core/validation` and move Zod schemas
3. **Phase 3**: Create `/ai/orchestrator.ts` as single LLM entry point
4. **Phase 4**: Create `ProjectContext.tsx` merging UserContext + EditorStore
5. **Phase 5**: Update all components to use new central modules
6. **Phase 6**: Remove duplicated files and clean up old structure