# LLM Files Analysis & Organization Recommendation

## Current LLM-Related Files

### 1. **Shared Infrastructure** (Core LLM Client)
- **`shared/lib/ai/customLLM.ts`**
  - **Purpose**: Core LLM client wrapper
  - **Usage**: Used by all features (editor, reco, extraction)
  - **Features**: 
    - Supports custom LLM endpoints (OpenRouter, Gemini, HuggingFace)
    - OpenAI fallback
    - JSON/text response formats
    - Rate limiting & retry logic
  - **Dependencies**: None (base infrastructure)
  - **Used by**: 
    - `pages/api/ai/openai.ts`
    - `pages/api/programs/recommend.ts`
    - `features/reco/engine/llmExtract.ts`

### 2. **Editor Feature** (Content Generation)
- **`features/editor/lib/engine/sectionAiClient.ts`**
  - **Purpose**: Editor-specific AI client for section content generation
  - **Usage**: Generates content for business plan sections
  - **Features**:
    - Section-specific prompts
    - Context detection (content/design/references/questions)
    - Action parsing (tables, KPIs, images, references)
    - Conversation history management
  - **Dependencies**: `shared/lib/ai/customLLM.ts` (via API)
  - **Used by**: 
    - `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`
    - `features/editor/lib/hooks/useEditorStore.ts`

- **`pages/api/ai/openai.ts`**
  - **Purpose**: API endpoint for editor AI assistant
  - **Usage**: Handles AI requests from editor components
  - **Features**:
    - Content generation/improvement
    - Compliance checking
    - Suggestions
    - Mock responses for testing
  - **Dependencies**: `shared/lib/ai/customLLM.ts`
  - **Used by**: `features/editor/lib/engine/sectionAiClient.ts` (via fetch)

### 3. **Reco Feature** (Recommendations & Extraction)
- **`features/reco/engine/llmExtract.ts`**
  - **Purpose**: Extract program data from HTML/text using LLM
  - **Usage**: Used by scraper tools to extract structured data
  - **Features**:
    - HTML/text parsing
    - Requirement extraction (15 categories)
    - Metadata extraction (amounts, deadlines, contacts)
    - Meaningfulness scoring
  - **Dependencies**: `shared/lib/ai/customLLM.ts`
  - **Used by**: Scraper tools (separate service)

- **`features/reco/prompts/recommendPrompt.ts`**
  - **Purpose**: Build prompts for program recommendations
  - **Usage**: Generates prompts for LLM to recommend programs
  - **Features**:
    - Profile summarization
    - Funding preference handling
    - Retry logic
    - Program knowledge base
  - **Dependencies**: None (pure prompt builder)
  - **Used by**: `pages/api/programs/recommend.ts`

- **`pages/api/programs/recommend.ts`** (contains LLM logic)
  - **Purpose**: API endpoint for program recommendations
  - **Usage**: Generates program recommendations using LLM
  - **Features**:
    - LLM program generation
    - Retry logic
    - Response parsing & validation
    - Fallback to deterministic scoring
  - **Dependencies**: 
    - `shared/lib/ai/customLLM.ts`
    - `features/reco/prompts/recommendPrompt.ts`
    - `features/reco/engine/recoEngine.ts`

## Recommended Directory Structure

**⚠️ RECOMMENDED APPROACH: Simpler Structure** (see below)

The simpler structure keeps feature-specific AI logic with features, only centralizing shared infrastructure.

Keep files closer to their features but organize better:

```
features/
├── ai/                           # NEW: Shared AI infrastructure
│   ├── clients/
│   │   └── customLLM.ts          # Move from shared/lib/ai/
│   └── utils/
│       ├── promptBuilder.ts      # Common prompt utilities
│       └── responseParser.ts     # Common parsing utilities
│
├── editor/
│   └── lib/
│       └── ai/                   # Editor-specific AI
│           ├── sectionAiClient.ts # Keep here (editor-specific)
│           └── prompts/          # Editor prompts
│               └── sectionPrompt.ts
│
└── reco/
    └── engine/
        ├── recoEngine.ts         # Scoring/matching (non-AI)
        ├── llmExtract.ts         # Extraction (AI) - keep here
        └── prompts/              # Recommendation prompts
            └── recommendPrompt.ts # Keep here
```

## Recommendation: **Alternative Structure** (Simpler)

**Rationale:**
1. Keep feature-specific AI logic close to features (easier to maintain)
2. Only centralize truly shared infrastructure (`customLLM.ts`)
3. Avoid over-engineering with too many subdirectories
4. Each feature owns its AI logic but uses shared client

**Proposed Changes:**
1. Move `shared/lib/ai/customLLM.ts` → `features/ai/clients/customLLM.ts`
2. Keep editor AI in `features/editor/lib/ai/` (create subdirectory)
3. Keep reco AI in `features/reco/engine/` (already there)
4. Create `features/ai/utils/` for shared utilities if needed

**Benefits:**
- Clear separation: shared infrastructure vs feature-specific
- Easy to find: AI code is in `features/ai/` or feature's `ai/` subdirectory
- Maintainable: Each feature owns its AI logic
- Scalable: Easy to add new features with AI capabilities

