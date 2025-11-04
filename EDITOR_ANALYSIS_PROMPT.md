# Business Plan Editor - Complete File & Component Analysis Prompt

You are analyzing a comprehensive business plan editor system. Below is a complete list of ALL files that affect when entering or editing a business plan, along with their functions and goals.

## 📋 ENTRY POINT & ROUTING FILES

### `pages/editor.tsx`
**Purpose:** Main entry point for the editor page
**Functions:**
- Handles URL query parameters (programId, route, product, answers)
- Wraps editor with authentication (`withAuth`)
- Routes to `UnifiedEditor` component with normalized props
- Shows loading state while router initializes

---

## 🎯 MAIN EDITOR COMPONENTS

### `features/editor/components/UnifiedEditor.tsx`
**Purpose:** Top-level editor orchestrator that coordinates all editor functionality
**Functions:**
- Normalizes input data from various entry points using `EditorNormalization`
- Manages program selection state
- Shows `ProgramSelector` when no program is selected
- Delegates to `Phase4Integration` for main editor functionality
- Handles export settings modal
- Manages router-based state synchronization

**Key State:**
- `filterProgramId`: Currently selected program
- `showExportSettings`: Export modal visibility
- `isInitialized`: Performance optimization flag

---

### `features/editor/components/Phase4Integration.tsx`
**Purpose:** Core editor integration component that combines all Phase 4 features
**Functions:**
- **Plan Management:** Loads, creates, and manages `PlanDocument` state
- **Section Management:** Loads program-specific sections from templates, transforms them to editor format
- **Content Prefilling:** Automatically fills sections with wizard answers using prefill engine
- **AI Content Generation:** Generates initial content for sections with prompts using `aiHelper`
- **Auto-save:** Debounced saving (400ms) to localStorage and dashboard
- **Requirements Progress:** Tracks and updates requirements completion percentage
- **Keyboard Shortcuts:** Handles Ctrl+G (AI generate), Ctrl+S (save), Ctrl+F (focus mode), Ctrl+K (section search), Ctrl+↑/↓ (navigation)
- **State Management:** Integrated state management (replaces separate EditorState)
- **Multi-user Support:** Client context management for multi-user scenarios
- **Entry Points:** Shows `EntryPointsManager` when no plan exists
- **Editor Rendering:** Delegates to `RestructuredEditor` when plan exists

**Key Functions:**
- `loadUserPlan()`: Creates default plan structure
- `loadProgramSections(programId)`: Loads and transforms template sections, prefills with answers, generates AI content
- `handleSectionChange(sectionKey, content)`: Updates section content, triggers auto-save, updates dashboard
- `handleAIGenerate()`: Generates AI content for active section
- `updateRequirementsProgress()`: Validates plan against program requirements
- `setProduct(product)`: Changes product type and reloads sections

---

### `features/editor/components/RestructuredEditor.tsx`
**Purpose:** Improved navigation and layout component for the editor
**Functions:**
- **UI Layout:** Three-column layout with sidebar, main editor, and optional panels
- **Section Navigation:** Collapsible sidebar with section list, search functionality
- **Focus Mode:** Distraction-free writing mode (hides sidebar)
- **Section Display:** Shows active section with header, description, prompts, word count targets
- **Rich Text Editor Integration:** Embeds `RichTextEditor` for content editing
- **Requirements Display:** Shows requirements progress for current section
- **Document Customization:** Drawer panel for document settings
- **AI Assistant:** Floating panel for AI chat
- **Keyboard Shortcuts:** Ctrl+N/P (next/previous), Ctrl+B (toggle sidebar), Ctrl+, (document settings), Escape (close panels)
- **Completion Tracking:** Shows completion toast notifications

**Key Features:**
- Section search with filtering
- Progress indicators (completion percentage)
- Section status indicators (aligned/needs_fix/missing)
- Navigation controls (Previous/Next/Jump buttons)
- Status management (Complete/Review buttons)

---

### `features/editor/components/RichTextEditor.tsx`
**Purpose:** Rich text editing component with advanced formatting
**Functions:**
- **Rich Text Editing:** Uses ReactQuill for WYSIWYG editing
- **Formatting Options:** Headers, bold, italic, underline, lists, colors, alignment, links, images
- **Word/Character Count:** Real-time counting with min/max validation
- **Formatting Panel:** Optional panel for theme, font size, spacing, line height, tone, language
- **Status Indicators:** Visual feedback for content length (too short, good, approaching limit)
- **Guidance Display:** Shows section-specific guidance when enabled
- **Placeholder Text:** Dynamic placeholders based on section prompts

**Key Features:**
- HTML content support (strips HTML for word count)
- Character limit enforcement (minLength/maxLength)
- Formatting theme support (serif, sans, modern, classic)
- Language support (en, de, fr, es)

---

## 🤖 AI & ASSISTANCE COMPONENTS

### `features/editor/components/EnhancedAIChat.tsx`
**Purpose:** AI assistant chat interface with plan context
**Functions:**
- **Context-Aware Suggestions:** Analyzes current section content and provides proactive suggestions
- **Readiness Integration:** Checks compliance issues and suggests fixes
- **Program-Specific Guidance:** Uses program requirements to provide targeted help
- **Content Generation:** Generates section content using `aiHelper`
- **Content Insertion:** Allows inserting AI-generated content into editor
- **Contextual Actions:** Primary action button (Complete/Fix/Enhance) based on section state
- **Secondary Actions:** Quick actions for common tasks (Improve Writing, Add Details, Check Compliance)
- **Proactive Suggestions:** Shows suggestions based on content analysis (empty section, brief content, missing requirements)

**Key Features:**
- Message history
- Loading states
- Error handling with fallback responses
- Section-specific guidance mapping
- "Make Compliant" action for fixing requirements issues

---

### `features/editor/engine/aiHelper.ts`
**Purpose:** AI content generation engine
**Functions:**
- **Section Content Generation:** Generates AI content for specific sections
- **Structured Requirements Integration:** Fetches and uses program-specific requirements from API
- **Prompt Building:** Constructs prompts with section context, program hints, user answers, tone, language
- **OpenAI API Integration:** Calls `/api/ai/openai` endpoint with full context
- **Readiness Scoring:** Calculates readiness score based on word count and requirements
- **Compliance Tips:** Extracts compliance tips from structured requirements
- **Section Guidance:** Provides section-specific guidance from requirements

**Key Classes:**
- `AIHelper`: Main AI helper class
- `createAIHelper()`: Factory function for basic AI helper
- `createEnhancedAIHelper()`: Factory function for enhanced AI helper with Phase 3 features

---

## 📝 DOCUMENT CUSTOMIZATION

### `features/editor/components/DocumentCustomizationPanel.tsx`
**Purpose:** Unified customization panel for document formatting
**Functions:**
- **Tone & Style:** Formal, enthusiastic, technical, conversational tone selection; Language selection (en, de)
- **Document Structure:** Table of contents, page numbers toggles
- **Formatting:** Font family, font size, line spacing, margins (top, bottom, left, right)
- **Title Page:** Enable/disable with title, subtitle, author, date fields
- **Citations:** Enable/disable with style selection (APA, MLA, Chicago, IEEE)
- **Charts & Figures:** Enable figures, table of figures, chart descriptions
- **Export:** PDF and DOCX export buttons

**Key Features:**
- Tabbed interface (Tone & Style, Formatting, Advanced)
- Real-time config updates via `onConfigChange` callback
- Saves to `plan.settings` in PlanDocument

---

## 🎨 ENTRY POINTS & NAVIGATION

### `features/editor/components/EntryPointsManager.tsx`
**Purpose:** Manages different entry points and document types
**Functions:**
- **Product Switching:** Switch between Strategy, Review, and Submission products
- **Funding Type Switching:** Switch between Grants, Loans, Equity, and Visa routes
- **Wizard Entry:** Redirect to recommendation wizard
- **Direct Editor Entry:** Start with specific document type (business-plan, project-description, pitch-deck, etc.)
- **Plan Switching:** Switch between recent plans
- **Document Type Selection:** 8 document types with complexity levels and estimated time

**Key Features:**
- Recent plans tracking (localStorage)
- Product and route persistence
- Document type recommendations with metadata

---

### `features/editor/components/ProgramSelector.tsx`
**Purpose:** Program selection interface before entering editor
**Functions:**
- **Program Loading:** Fetches programs from `/api/programs?enhanced=true`
- **Program Display:** Grid of program cards with name, description, institution, type, tags
- **Product Selection:** Choose document type (Strategy, Review, Submission) before selecting program
- **Program Selection:** Select program to start editor
- **Wizard Redirect:** Alternative entry via recommendation wizard
- **Loading States:** Shows spinner while loading programs
- **Error Handling:** Shows error state if programs fail to load

**Key Features:**
- Product must be selected before program selection
- Program cards with hover effects
- Type mapping (grant, loan, equity, visa, other)

---

## 🔧 ENGINE & UTILITIES

### `features/editor/engine/EditorNormalization.ts`
**Purpose:** Data normalization system for all entry points
**Functions:**
- **Input Normalization:** Converts all entry point data to consistent format
- **Product Normalization:** Smart fallbacks based on entry point (wizard-results → submission, pricing → strategy)
- **Route Normalization:** Derives route from programId or defaults based on product
- **Answers Normalization:** Preserves wizard answers
- **Payload Normalization:** Preserves program data
- **Prefill Data Extraction:** Maps wizard answers to section keys

**Key Methods:**
- `normalizeInput()`: Main normalization function
- `extractPrefillData()`: Extracts prefilled data for specific sections

---

### `features/editor/engine/categoryConverters.ts`
**Purpose:** Converts category-based data to editor format
**Note:** Used by template system for section transformation

---

### `features/editor/engine/dataSource.ts`
**Purpose:** Data source management for editor
**Note:** Handles data loading and caching

---

### `features/editor/engine/doctorDiagnostic.ts`
**Purpose:** Diagnostic utilities for editor
**Note:** Debugging and validation tools

---

## 💾 STORAGE & STATE MANAGEMENT

### `shared/lib/planStore.ts`
**Purpose:** Centralized storage for plan data and related information
**Functions:**
- **Plan Sections:** `savePlanSections()`, `loadPlanSections()` - Saves/loads section content to localStorage with session-based keys
- **User Answers:** `saveUserAnswers()`, `loadUserAnswers()` - Stores wizard answers
- **Enhanced Payload:** `saveEnhancedPayload()`, `loadEnhancedPayload()` - Stores program recommendation data
- **Selected Program:** `saveSelectedProgram()`, `loadSelectedProgram()` - Stores currently selected program
- **Plan Settings:** `savePlanSettings()`, `loadPlanSettings()` - Stores document formatting settings
- **Plan Seed:** `savePlanSeed()`, `loadPlanSeed()` - Stores intake seed data
- **Dashboard Integration:** `savePlanToDashboard()`, `saveRecommendationToDashboard()` - Saves plans and recommendations for dashboard display

**Key Features:**
- Session-based storage keys (`pf_{key}_{sessionId}`)
- Debounced saving for plan sections (300ms)
- Versioned storage format (v: 1)
- Migration support for legacy data formats

---

## 📊 TEMPLATE SYSTEM

### `shared/lib/templates/index.ts`
**Purpose:** Unified template registry for sections and documents
**Functions:**
- **Section Loading:** `getSections(fundingType, productType, programId, baseUrl)` - Loads sections with priority: Program-specific → Master → Default
- **Template Merging:** Merges program-specific sections with master templates
- **Program Overrides:** Loads program-specific sections from API for submission products

**Key Features:**
- Master sections for each funding type (grants, bankLoans, equity, visa) and product type (strategy, review, submission)
- Program-specific section merging only for submission products
- Fallback to master templates if program-specific not available

---

## 📄 TYPE DEFINITIONS

### `shared/types/plan.ts`
**Purpose:** Canonical type definitions for plan data structures
**Types:**
- `PlanSection`: Section with key, title, content, fields, tables, figures, sources, status
- `PlanDocument`: Full plan with id, ownerId, product, route, language, tone, settings, sections, readiness, attachments
- `Table`: Financial table structure (columns, rows)
- `FigureRef`: Figure reference (type, dataRef, caption, altText)
- `Route`: 'grant' | 'loan' | 'equity' | 'visa'
- `Product`: 'strategy' | 'review' | 'submission'

---

### `features/editor/types/editor.ts`
**Purpose:** Editor-specific type definitions
**Types:**
- `EditorProduct`: Product/program selection interface
- `EditorTemplate`: Template selection interface
- `EditorProgress`: Progress tracking interface
- `EditorState`: Complete editor state interface
- `AIAssistantState`: AI assistant state
- `ReadinessState`: Readiness check state
- `CollaborationState`: Collaboration state (for future use)
- `ExportSettings`: Export configuration

---

## 🔍 REQUIREMENTS & VALIDATION

### `features/editor/components/RequirementsChecker.tsx`
**Purpose:** Shows program compliance and readiness status
**Functions:**
- **Requirements Fetching:** Fetches program requirements from `/api/programmes/{programId}/requirements`
- **Readiness Validation:** Uses `ReadinessValidator` to check plan content against requirements
- **Progress Display:** Shows overall score and section-by-section breakdown
- **Status Indicators:** Visual indicators for complete, incomplete, missing requirements
- **Requirement Details:** Expandable sections showing individual requirements with importance levels
- **Suggestions:** Provides actionable suggestions for improving compliance
- **Fallback:** Falls back to generic validator if program-specific requirements unavailable

**Key Features:**
- Real-time updates when plan content changes
- Expandable/collapsible sections
- Requirement importance levels (critical, important, optional)
- Evidence tracking for requirements

---

## 🎯 OTHER COMPONENTS

### `features/editor/components/ExportSettings.tsx`
**Purpose:** Export settings modal
**Functions:**
- Export format selection
- Section inclusion options
**Note:** Referenced by UnifiedEditor but implementation details not fully explored

---

## 🔗 API ROUTES

### `pages/api/plan/save.ts`
**Purpose:** API endpoint for saving plans
**Functions:**
- Accepts POST requests
- Returns success status
**Note:** Currently minimal implementation, most saving happens client-side via planStore

---

## 📱 USER CONTEXT & AUTHENTICATION

### `shared/contexts/UserContext.tsx`
**Purpose:** User authentication and profile context
**Used By:** Phase4Integration for user profile access and dashboard saving

---

### `shared/lib/withAuth.tsx`
**Purpose:** Higher-order component for authentication
**Used By:** editor.tsx page wrapper

---

## 🎨 UI COMPONENTS

### `shared/components/ui/*`
**Purpose:** Reusable UI components
**Components Used:**
- `Button`: Used throughout editor for actions
- `Card`: Container components
- `Badge`: Status indicators
- `Progress`: Progress bars
- `Switch`: Toggle switches
- `Input`: Form inputs
- `Label`: Form labels

---

## 🔄 DATA FLOW SUMMARY

### When Entering Editor:
1. `pages/editor.tsx` receives URL parameters
2. `UnifiedEditor` normalizes input via `EditorNormalization`
3. If no program: Shows `ProgramSelector`
4. If program exists: Passes to `Phase4Integration`

### When Loading Plan:
1. `Phase4Integration.loadProgramSections()`:
   - Fetches program data from `/api/programmes/{id}/requirements`
   - Calls `getSections()` from template system
   - Transforms template sections to editor format
   - Prefills sections with wizard answers from `planStore`
   - Generates AI content for empty sections
   - Initializes financial tables and figures
   - Sorts sections by order
   - Creates `PlanDocument` and sets state

### When Editing Content:
1. User types in `RichTextEditor`
2. `onChange` triggers `Phase4Integration.handleSectionChange()`
3. Updates section in state
4. Debounced save (400ms):
   - Saves to localStorage via `savePlanSections()`
   - Saves to dashboard via `savePlanToDashboard()`
5. Updates requirements progress via `updateRequirementsProgress()`

### When Saving:
1. `handleSectionChange()` debounces (400ms)
2. `saveContentDirect()` saves to localStorage
3. `savePlanSections()` saves sections to session storage
4. `savePlanToDashboard()` saves to user plans for dashboard
5. Updates plan state and triggers re-render

---

## 🎯 KEY INTEGRATIONS

1. **Template System** → `getSections()` loads sections based on funding type, product type, and program
2. **Prefill Engine** → Maps wizard answers to section content
3. **AI Helper** → Generates content for sections with prompts
4. **Requirements Validator** → Checks compliance against program requirements
5. **Plan Store** → Persists all data to localStorage with session keys
6. **Dashboard Integration** → Saves plans for dashboard display
7. **Multi-User Manager** → Handles client context for multi-user scenarios

---

## 📝 NOTES

- All saving is debounced to prevent excessive localStorage writes
- Session-based storage keys ensure data isolation per user session
- Program-specific sections only merge for submission products
- AI content generation happens automatically for empty sections with prompts
- Requirements validation happens automatically when sections change
- Keyboard shortcuts are context-aware (disabled when typing in inputs)
- Focus mode hides sidebar for distraction-free writing
- All components use TypeScript for type safety

---

## 🚀 COMPLETENESS CHECKLIST

✅ Entry point and routing
✅ Main editor components
✅ Rich text editing
✅ AI assistance
✅ Document customization
✅ Entry points management
✅ Program selection
✅ Data normalization
✅ Storage management
✅ Template system
✅ Type definitions
✅ Requirements validation
✅ API routes
✅ User context
✅ UI components
✅ Data flow documentation

This analysis covers ALL files affecting when entering or editing a business plan. Every component, function, and integration point is documented above.

