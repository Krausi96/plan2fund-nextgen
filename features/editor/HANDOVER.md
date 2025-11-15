# Editor Handover - Brief Context

## Key Documents (Read These First)

1. **`docs/SYSTEM_ARCHITECTURE_SOURCE_OF_TRUTH.md`** - Complete system architecture, how everything interacts
2. **`docs/UNIFIED_BUSINESS_EXPERT_SYSTEM.md`** - Unified system design (prompts, AI, checker work together)
3. **`docs/BUSINESS_EXPERT_IMPLEMENTATION.md`** - How to implement deep business expertise
4. **`features/editor/EDITOR_INTERFACE.md`** - Current editor UI layout
5. **`features/editor/README.md`** - How editor works

## Your Task

**Revise and analyze the editor system using the German template example** (`c:\Users\kevin\OneDrive\Documents\template_public_support_general_austria_de_i2b.txt`)

**For each step, explain how all components react/behave.**

## Current System

### Files Structure
```
features/editor/
  components/
    Editor.tsx              # Main editor (822 lines)
    RequirementsModal.tsx   # Requirements checker
    SimpleTextEditor.tsx    # Text editor
    SectionContentRenderer.tsx  # Tables, charts
    ProgramSelector.tsx     # Program selection
  engine/
    aiHelper.ts            # AI Business Expert
    categoryConverters.ts  # Converts requirements
  hooks/
    useSectionProgress.ts  # Progress calculation
  utils/
    tableInitializer.ts    # Table initialization
  types/
    editor.ts              # Type definitions
```

### Key Flow

1. **User opens editor** → `Editor.tsx` loads sections from master templates
2. **User sees prompts** → Master prompts from `shared/templates/sections.ts`
3. **User writes** → Auto-saves to localStorage
4. **Requirements checker** → Validates word count, required fields, format
5. **AI generates** → Uses prompts + template knowledge + program requirements
6. **Enhanced version** → Program requirements shown in RequirementsModal

## German Template Integration

**Your template is a reference template (not master).**

**How it should work:**
1. Extract guidance from German template → `shared/templates/templateKnowledge.ts` (NEW)
2. AI Business Expert uses template knowledge for deep guidance
3. Master templates stay simple (for prompts)
4. Template knowledge provides deep expertise (for AI)

## What Needs to Be Done

1. **Create `shared/templates/templateKnowledge.ts`** - Extract from German template
2. **Update `aiHelper.ts`** - Use template knowledge for deep expertise
3. **Update `RequirementsModal.tsx`** - Semantic validation (not keyword matching)
4. **Unify components** - Prompts, AI, checker work together
5. **Simplify editor folder** - Consolidate/remove redundant MDs

## Example: Market Analysis Section

**German Template says:**
```
"Beschreiben Sie die Branche... Nützliches Modell: Branchenstrukturanalyse nach Porter (Five Forces)."
```

**How components react:**
1. **Master prompt** (simple): "Who are your target customers?"
2. **Template knowledge** (deep): Porter Five Forces framework, industry structure analysis
3. **AI Business Expert** (uses both): Generates content using Porter framework
4. **Requirements Checker** (validates): Checks if Porter Five Forces is used properly

## Next Steps

1. Read `docs/SYSTEM_ARCHITECTURE_SOURCE_OF_TRUTH.md` for complete context
2. Review German template for each section
3. Extract template knowledge
4. Update AI Business Expert to use template knowledge
5. Update Requirements Checker for semantic validation
6. Test with one section (e.g., Market Analysis)

