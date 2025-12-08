# AI/LLM Feature Organization

## Overview

This directory contains shared AI/LLM infrastructure used across features.

## Structure

```
features/ai/
├── clients/          # LLM client implementations
│   └── customLLM.ts  # Core LLM client wrapper
└── README.md         # This file
```

## Files

### Clients
- **`clients/customLLM.ts`** - Core LLM client wrapper
  - Supports custom endpoints (OpenRouter, Gemini, HuggingFace)
  - OpenAI fallback
  - Used by all features that need LLM
  - Exports: `isCustomLLMEnabled()`, `callCustomLLM()`, `CustomLLMError`

## Feature-Specific AI

Each feature maintains its own AI logic:

- **Editor**: `features/editor/lib/engine/sectionAiClient.ts`
  - Uses: `/api/ai/assistant` endpoint (which uses customLLM)
  
- **Reco**: 
  - `features/reco/engine/extraction.ts` - HTML/text extraction (for scraper tools)
  - `features/reco/engine/scoring.ts` - Program matching & scoring (for web app)
  - `features/reco/prompts/programRecommendation.ts` - Prompt builder
  - Uses: `pages/api/programs/recommend.ts` (which uses customLLM)

- **API Endpoints**: 
  - `pages/api/ai/assistant.ts` - Editor AI Assistant endpoint
  - `pages/api/programs/recommend.ts` - Recommendation endpoint

## Usage

```typescript
import { isCustomLLMEnabled, callCustomLLM } from '@/features/ai/clients/customLLM';

if (isCustomLLMEnabled()) {
  const response = await callCustomLLM({
    messages: [{ role: 'user', content: 'Hello' }],
    temperature: 0.7,
    maxTokens: 1000,
    responseFormat: 'json'
  });
}
```

## Rationale

- **Shared infrastructure** in `features/ai/` (truly reusable)
- **Feature-specific AI** stays with features (easier to maintain)
- Clear separation of concerns
- Easy to find and understand
