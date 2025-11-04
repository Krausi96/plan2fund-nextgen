# Business Plan Editor - Complete Analysis & UX Improvement Prompt

You are an expert UX designer and frontend architect analyzing a business plan editor system. Your task is to understand the complete system structure, analyze current UX issues, and propose comprehensive improvements.

---

## 📋 SYSTEM STRUCTURE - ALL FILES AFFECTING BUSINESS PLAN EDITOR

### ENTRY POINT & ROUTING
- **`pages/editor.tsx`**: Main entry point, handles URL params (programId, route, product, answers), wraps with auth, routes to UnifiedEditor

### MAIN EDITOR COMPONENTS

**`features/editor/components/UnifiedEditor.tsx`**
- Top-level orchestrator, normalizes input data, manages program selection, shows ProgramSelector when no program, delegates to Phase4Integration

**`features/editor/components/Phase4Integration.tsx`** (Core - 1981 lines)
- Plan management, section loading from templates, content prefilling from wizard answers, AI content generation, auto-save (400ms debounce), requirements progress tracking, keyboard shortcuts (Ctrl+G, Ctrl+S, Ctrl+F, Ctrl+K, navigation), state management, multi-user support, entry points management

**`features/editor/components/RestructuredEditor.tsx`** (Main UI - 841 lines)
- Three-column layout (sidebar, editor, panels), collapsible section navigation with search, focus mode, section display with header/description/prompts/word count, rich text editor integration, requirements display, document customization drawer, AI assistant floating panel, keyboard shortcuts, completion tracking

**`features/editor/components/RichTextEditor.tsx`**
- ReactQuill WYSIWYG editor, formatting options (headers, bold, italic, lists, colors, alignment, links, images), word/character count with validation, formatting panel (theme, font, spacing, tone, language), status indicators, guidance display

### AI & ASSISTANCE

**`features/editor/components/EnhancedAIChat.tsx`**
- Context-aware suggestions, readiness integration, program-specific guidance, content generation, content insertion, contextual actions (Complete/Fix/Enhance), proactive suggestions based on content analysis

**`features/editor/engine/aiHelper.ts`**
- Section content generation, structured requirements integration, prompt building with context, OpenAI API integration, readiness scoring, compliance tips extraction

### DOCUMENT CUSTOMIZATION

**`features/editor/components/DocumentCustomizationPanel.tsx`**
- Tone & style (formal/enthusiastic/technical/conversational, languages), document structure (TOC, page numbers), formatting (font, size, spacing, margins), title page, citations (APA/MLA/Chicago/IEEE), charts & figures, export (PDF/DOCX)

### ENTRY POINTS & NAVIGATION

**`features/editor/components/EntryPointsManager.tsx`**
- Product switching (Strategy/Review/Submission), funding type switching (Grants/Loans/Equity/Visa), wizard entry, direct editor entry, plan switching, document type selection (8 types)

**`features/editor/components/ProgramSelector.tsx`**
- Program loading from API, program display grid, product selection required before program, program selection, wizard redirect, loading/error states

### ENGINE & UTILITIES

**`features/editor/engine/EditorNormalization.ts`**
- Data normalization for all entry points, product/route normalization with smart fallbacks, answers/payload normalization, prefill data extraction

**`features/editor/engine/categoryConverters.ts`**, **`dataSource.ts`**, **`doctorDiagnostic.ts`**
- Category conversion, data source management, diagnostic utilities

### STORAGE & STATE

**`shared/lib/planStore.ts`**
- `savePlanSections()` / `loadPlanSections()` - session-based localStorage, debounced (300ms)
- `saveUserAnswers()` / `loadUserAnswers()` - wizard answers
- `saveEnhancedPayload()` / `loadEnhancedPayload()` - program recommendations
- `saveSelectedProgram()` / `loadSelectedProgram()` - selected program
- `savePlanSettings()` / `loadPlanSettings()` - formatting settings
- `savePlanToDashboard()` / `saveRecommendationToDashboard()` - dashboard integration
- Session-based keys: `pf_{key}_{sessionId}`

### TEMPLATE SYSTEM

**`shared/lib/templates/index.ts`**
- `getSections(fundingType, productType, programId, baseUrl)` - loads sections with priority: Program-specific → Master → Default
- Template merging, program overrides for submission products

### TYPES

**`shared/types/plan.ts`**
- `PlanSection`, `PlanDocument`, `Table`, `FigureRef`, `Route`, `Product` - canonical type definitions

**`features/editor/types/editor.ts`**
- `EditorProduct`, `EditorTemplate`, `EditorProgress`, `EditorState`, `AIAssistantState`, `ReadinessState`, `ExportSettings`

### REQUIREMENTS & VALIDATION

**`features/editor/components/RequirementsChecker.tsx`**
- Fetches requirements from `/api/programmes/{programId}/requirements`, uses ReadinessValidator, shows progress/score, section breakdown, status indicators, requirement details, suggestions

---

## 🔄 CURRENT DATA FLOW

**Entering Editor:**
1. `editor.tsx` receives URL params → `UnifiedEditor` normalizes → Shows `ProgramSelector` or passes to `Phase4Integration`

**Loading Plan:**
1. `Phase4Integration.loadProgramSections()` → Fetches program data → Calls `getSections()` → Transforms templates → Prefills with wizard answers → Generates AI content → Initializes tables/figures → Creates `PlanDocument`

**Editing Content:**
1. User types in `RichTextEditor` → `onChange` → `Phase4Integration.handleSectionChange()` → Updates state → Debounced save (400ms) → localStorage + dashboard → Updates requirements progress

---

## 🚨 CURRENT PROBLEM

**The editor still looks and feels like a template interface** rather than a user-friendly, guided tool. It has all technical components (AI, requirements checking, templates) but isn't effectively helping users create excellent business plans.

### Issues:
1. **Template-First Design**: Sections shown as generic forms, not guided writing experiences
2. **Lack of Visual Guidance**: No examples, best practices, or visual inspiration while writing
3. **Poor Information Architecture**: Components exist but aren't optimally organized for writing workflow
4. **Missing Visual Customization**: Users can't effectively customize visual appearance
5. **Insufficient Guidance**: Prompts exist but aren't presented to guide users through creating comprehensive plans

---

## 🎨 INSPIRATION: Runtastic Business Plan Quality

**Key Elements to Emulate:**
- Clear visual hierarchy with proper spacing and typography
- Rich content structure with multiple subsections
- Visual elements (charts, graphs, tables, data representations)
- Professional formatting (consistent styling, page numbers, TOC, citations)
- Comprehensive coverage (market analysis, financials, team, strategy, etc.)
- Visual customization (branding, colors, fonts, layout options)

---

## 🎯 YOUR TASK

### Step 1: Analyze Current UX Issues
Identify:
- Information architecture problems (organization, mental model, friction points)
- Visual design issues (current appearance, missing elements, engagement)
- Guidance & onboarding gaps (how users are guided, examples shown, context provided)
- Component organization (placement, workflow logic, missing/redundant elements)
- Visual customization limitations (existing options, missing features, professional document creation)

### Step 2: Propose Comprehensive Improvements

**1. UX/UI Redesign Proposal**
- New information architecture: How should interface be reorganized?
- Visual layout: What should editor look like?
- Component placement: Where should each component be positioned?
- Workflow improvements: How should writing flow be optimized?

**2. Component Enhancements** (for each major component)
- Purpose: What should it do for the user?
- Visual design: How should it look?
- Interactions: How should users interact with it?
- Content: What information/guidance should it provide?

**3. Guidance System**
- Examples: How to show best-practice examples (like Runtastic)?
- Step-by-step guidance: How to guide users through each section?
- Contextual help: How to provide help at the right moment?
- Visual inspiration: How to show what good business plans look like?

**4. Visual Customization System**
- Branding options: Colors, fonts, logos
- Layout options: Different layout styles, templates
- Visual elements: Chart styles, table designs, figure options
- Export customization: How to customize final document appearance

**5. Implementation Plan**
- Priority changes: What should be changed first?
- Component modifications: Specific changes to existing components
- New components needed: What new components should be created?
- File changes: Specific file modifications required

---

## ✅ SUCCESS CRITERIA

The improved editor should:
- ✅ Feel **guided, not template-driven** - users guided through creating professional plans
- ✅ **Show examples continuously** - examples and best practices throughout
- ✅ **Provide rich context** - users understand what, why, and how to write
- ✅ **Be visually customizable** - create visually distinctive, professional-looking plans
- ✅ **Match professional standards** - output matches quality of Runtastic-level plans
- ✅ **Reduce cognitive load** - users never feel lost or overwhelmed
- ✅ **Encourage completion** - motivated and guided to complete all sections

---

## 📝 YOUR OUTPUT FORMAT

### Part 1: Current State Analysis
- Summary of current UX issues
- Specific problems identified
- Component-by-component analysis

### Part 2: Proposed Solution
- New information architecture
- Component redesign proposals
- Visual design improvements
- Guidance system design
- Customization system design

### Part 3: Implementation Recommendations
- Priority order of changes
- Specific file modifications
- New components to create
- Component interaction changes

### Part 4: Visual Mockups/Descriptions
- Describe new interface layout
- Show component placement
- Illustrate user workflows

---

## 🚀 START YOUR ANALYSIS

1. Understand the complete system structure from above
2. Analyze current implementation files
3. Identify specific UX/UI problems
4. Propose comprehensive improvements
5. Provide actionable implementation recommendations

**Focus on transforming this from a template-filling experience into a guided, professional business plan creation tool that helps users create documents as comprehensive and well-structured as professional business plans like Runtastic's.**

**Remember**: The goal is not just to make it prettier, but to make it significantly more helpful and effective at guiding users to create excellent business plans.

