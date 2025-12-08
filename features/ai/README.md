# AI/LLM Feature Organization

## Overview

This directory contains shared AI/LLM infrastructure used across features.

## Structure

```
features/ai/
├── clients/          # LLM client implementations
├── utils/            # Shared AI utilities (if needed)
└── README.md         # This file
```

## Files

### Clients
- **`clients/customLLM.ts`** - Core LLM client wrapper
  - Supports custom endpoints (OpenRouter, Gemini, HuggingFace)
  - OpenAI fallback
  - Used by all features that need LLM

## Feature-Specific AI

Each feature maintains its own AI logic:

- **Editor**: `features/editor/lib/engine/sectionAiClient.ts`
- **Reco**: `features/reco/engine/llmExtract.ts` + `features/reco/prompts/recommendPrompt.ts`
- **API Endpoints**: `pages/api/ai/openai.ts`, `pages/api/programs/recommend.ts`

## Rationale

- **Shared infrastructure** in `features/ai/` (truly reusable)
- **Feature-specific AI** stays with features (easier to maintain)
- Clear separation of concerns
- Easy to find and understand

