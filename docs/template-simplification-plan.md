# Template Simplification Plan

## Current Reality

### Data Sources
1. **Product** (`'submission' | 'review' | 'strategy'`)
   - Source: Static `MASTER_SECTIONS[productType]` in `templates.ts`
   - Used by: `getSections()` - ignores `programId` completely
   - No merge needed - just lookup

2. **Program** (`programId` like `"page_123"`)
   - Source: `/api/programs/[id]/requirements` → `categorized_requirements.documents`
   - Used by: `getDocuments()` - converts API format → `DocumentTemplate[]`
   - Only documents, NOT sections

3. **Documents**
   - Master: Static `MASTER_DOCUMENTS[fundingType][productType]`
   - Program: From API `categorized_requirements.documents`
   - Merge: Simple override (program wins if same ID)

## What to Remove

1. **TEMPLATE_KNOWLEDGE** (lines 1346-1794) - 448 lines
   - Check if used: `grep -r "getTemplateKnowledge\|TEMPLATE_KNOWLEDGE"`
   - If unused → DELETE

2. **Complex merge logic for sections** - doesn't exist, but Phase 1 plan assumes it
   - Reality: Sections are static, no merge
   - Phase 1 should focus on: adding metadata fields, not merging

3. **Verbose template data** - reduce to essentials
   - Keep: `id`, `title`, `description`, `required`, `questions`, `prompts`
   - Remove: excessive `source`, `validationRules` if not used

## New Structure

```
features/editor/templates/
├── index.ts              # Public API (getSections, getDocuments, getSection, getDocument)
├── types.ts              # SectionTemplate, DocumentTemplate, SectionQuestion
├── sections.ts           # MASTER_SECTIONS (minimal, product-based)
├── documents.ts          # MASTER_DOCUMENTS (minimal, funding+product based)
└── api.ts                # loadProgramDocuments, convert API → DocumentTemplate
```

## Migration Steps

1. **Extract types** → `types.ts`
2. **Extract sections** → `sections.ts` (keep only 3 product types)
3. **Extract documents** → `documents.ts` (keep only essentials)
4. **Extract API logic** → `api.ts` (loadProgramDocuments, conversion)
5. **Create index.ts** → re-export public API
6. **Delete old templates.ts**
7. **Update imports** across codebase

## Phase 1 Focus (After Simplification)

Since sections don't merge, Phase 1 should:
1. Add metadata fields to `SectionTemplate`/`SectionQuestion` (visibility, severity, origin)
2. Add metadata to existing static sections (mark as "base" origin)
3. When program is selected, mark program-specific questions (future: when we add program sections)
4. Keep it simple - no complex merge logic needed yet

