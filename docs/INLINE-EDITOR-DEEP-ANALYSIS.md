# InlineSectionEditor: Deep Analysis & Recommendations

## 🔍 How It Actually Works

### Architecture Overview

The `InlineSectionEditor` is a **floating overlay component** that appears when editing a section in the preview. It serves as a **unified AI assistant + text editor** for document sections.

### Positioning System

**Current Implementation:**
- Uses `position: fixed` relative to viewport
- Calculates position based on target element (question heading or section element)
- Updates position on scroll/resize via event listeners
- Desktop: Positions to right of preview container
- Mobile: Positions below target, centered

**How Positioning Works:**
1. Finds target element via `data-section-id` or `data-question-id` attributes
2. Gets viewport coordinates via `getBoundingClientRect()`
3. Calculates editor position relative to viewport
4. Updates on scroll (throttled to 60fps) and window resize

**Problems:**
- ❌ Fixed positioning means editor scrolls with viewport, not preview content
- ❌ Can overlap preview content on smaller screens
- ❌ Disconnected from preview pages visually
- ❌ Complex positioning logic with multiple fallbacks

### Component Structure

```
InlineSectionEditor
├── Header
│   ├── Section title
│   ├── Close button
│   └── Section guidance (expandable)
├── Question Navigation (for normal sections)
│   └── Numbered buttons with status indicators
├── Content Area (scrollable)
│   ├── Proactive Suggestions (auto-loaded)
│   ├── Data Creation Buttons (Table/KPI/Image)
│   ├── Template Guidance (collapsible)
│   └── Chat Messages
│       ├── Question message (simplified prompt)
│       ├── Answer message (user's text)
│       ├── AI suggestions (with action buttons)
│       └── Loading states
├── Chat Input
│   └── Unified input (handles both answers and AI chat)
└── Actions Footer
    ├── Progress indicator
    ├── Complete button
    └── Skip button (with dialog)
```

### State Management

**Key States:**
- `position`: Editor position (top, left, placement, visible)
- `aiMessages`: Conversation history (question, answer, suggestions)
- `aiInput`: Current input text
- `isAiLoading`: AI request in progress
- `proactiveSuggestions`: Auto-loaded suggestions
- `isSectionGuidanceOpen`: Guidance visibility
- `showSkipDialog`: Skip reason dialog

**Data Flow:**
1. User clicks section in preview → `editingSectionId` set
2. Editor mounts → Finds target element → Calculates position
3. Question loads → Initializes chat with question message
4. User types → First message = answer, subsequent = AI chat
5. Answer submitted → Updates plan → Triggers AI analysis
6. AI responds → Parses actions → Shows suggestions + action buttons

---

## 🎨 UI/UX Issues & Confusion

### Problem 1: Too Many Buttons

**Current Buttons:**
1. **Header:** Close (✕)
2. **Question Navigation:** Numbered pills (1, 2, 3...)
3. **Data Creation:** Table (📊), KPI (📈), Image (🖼️)
4. **Chat Input:** Send button
5. **Footer:** Complete (✓), Skip
6. **Answer Messages:** Edit, Delete
7. **AI Messages:** Action buttons (Create Table, Add KPI, etc.)

**Issues:**
- ❌ Data creation buttons appear even when not needed
- ❌ Action buttons duplicate data creation buttons
- ❌ No clear hierarchy of actions
- ❌ Buttons scattered across multiple areas

### Problem 2: Dual-Mode Input Confusion

The chat input serves **two purposes:**
1. **Answer mode:** First message = direct answer to question
2. **AI chat mode:** Subsequent messages = questions to AI

**User Confusion:**
- ❌ Unclear when typing an answer vs. asking AI
- ❌ No visual distinction between modes
- ❌ Answer gets auto-analyzed by AI (may be unwanted)

### Problem 3: Information Overload

**Too much information at once:**
- Proactive suggestions (auto-loaded)
- Data creation buttons
- Template guidance (collapsible)
- Chat history
- Progress indicator
- Action buttons in AI messages

**Result:** User doesn't know where to focus

---

## 📍 Behavior: Inside vs. Outside Content Area

### Inside Content Area (Normal Sections)

**Behavior:**
- Editor appears when clicking a section/question in preview
- Positions to right of preview container (desktop)
- Highlights active question in preview
- Updates position as user scrolls preview
- Auto-advances to next question on complete/skip

**What It Helps With:**
- ✅ Answering template questions
- ✅ Getting AI suggestions for answers
- ✅ Creating supporting data (tables, KPIs, images)
- ✅ Understanding question requirements

**Limitations:**
- ❌ Fixed positioning can overlap preview
- ❌ Doesn't follow preview scroll smoothly
- ❌ Can go off-screen on small viewports

### Outside Content Area (Special Sections)

**Special Sections:**
- `METADATA_SECTION_ID` (Title Page) - **Title Page Design Mode**
- `REFERENCES_SECTION_ID` (Citations) - **References Management Mode**
- `APPENDICES_SECTION_ID` (Supplementary materials) - **Appendices Organization Mode**
- `ANCILLARY_SECTION_ID` (TOC, List of Tables) - **Editor hidden** (auto-generated)

**Current Behavior:**
- Editor shows welcome message (no question)
- AI chat mode only (no answer mode)
- Different placeholders per section type
- Basic context detection (design, references, content) via `detectAIContext()`
- Limited specialized assistance - context detection exists but not fully utilized

**What It Currently Does:**

**METADATA_SECTION_ID (Title Page):**
- ✅ Shows welcome message: "I can help you with title page design, formatting, and document structure."
- ✅ Auto-sets context to 'design' on mount
- ✅ Basic design keyword detection in `detectAIContext()` (design, format, formatting, page number, logo, header, footer, font, style, layout, appearance, visual)
- ⚠️ Limited: Only basic keyword matching, no specialized design prompts
- ❌ **Missing:** General document design mode (page numbers for full document, extra pages, story separation lines)

**REFERENCES_SECTION_ID (Citations):**
- ✅ Shows welcome message: "I can help you manage citations, references, and attachments."
- ✅ Auto-sets context to 'references' on mount
- ✅ Basic reference keyword detection (reference, references, citation, citations, cite, source, sources, bibliography, attach, attachment, link, url)
- ✅ `parseAIActions()` can suggest "Add Citation" action for references section
- ⚠️ **Current limitation:** References are managed in separate REFERENCES section, but content sections can also need references
- ❌ **Missing:** Clear flow for adding references from content sections (questions can have `referenceIds` but UI flow unclear)

**APPENDICES_SECTION_ID (Supplementary):**
- ✅ Shows welcome message: "I can help you organize appendices and supplementary materials."
- ✅ Auto-sets context to 'content' on mount
- ⚠️ Limited: No specialized appendices prompts, uses generic content mode

**ANCILLARY_SECTION_ID (TOC/List of Tables):**
- ✅ Editor hidden (correctly - auto-generated content)
- ✅ No user editing needed

**How References Work in Content Sections (Current vs. Future):**

**Current Implementation:**
- ✅ Infrastructure exists: Questions can have `referenceIds?: string[]` and `attachments?: Array<AttachmentReference | MediaAsset>`
- ✅ `attachReferenceToQuestion()` function exists in `useEditorStore.ts`
- ✅ `AttachmentReference` type exists with `attachmentId`, `attachmentType`, `linkedAt`
- ⚠️ References are primarily managed in separate REFERENCES section
- ❌ **No clear UI flow** for adding references from content sections
- ❌ **No AI assistance** for suggesting references when user mentions citations in content

**How It Should Work:**
1. User types answer in content section mentioning a source/citation
2. User asks AI: "How do I cite this?" or "Add a reference for this"
3. AI detects references context via `detectAIContext()`
4. AI suggests: "I can help you add a reference. Would you like me to create one in the References section?"
5. AI provides action button: "Add Reference" that:
   - Creates new reference in REFERENCES section
   - Links it to current question via `attachReferenceToQuestion()`
   - Shows citation format suggestions
6. Question now has reference linked via `attachments` array with `AttachmentReference` type
7. Reference appears in REFERENCES section and is linked to the question

**Design Mode: Title Page vs. General Document**

**Current:**
- ✅ Title page design mode exists (METADATA_SECTION_ID)
- ✅ Design context detection works for title page questions
- ❌ **No general document design mode** for page numbers, extra pages, story separation lines

**Future:**
- **Title Page Design Mode:** Specific to title page (logo, title formatting, title page layout)
- **General Document Design Mode:** Accessible from any section for:
  - Page numbering (start number, position, format for entire document)
  - Extra pages (blank pages, section separators)
  - Story separation lines (visual separators between major sections/stories)
  - Document-wide formatting (headers, footers, margins, page breaks)
  - Page layout (page size, orientation)

**What It Should Help With (Future):**

**METADATA_SECTION_ID (Title Page - Title Page Design Mode):**
- ✅ Logo placement and sizing guidance
- ✅ Title page formatting suggestions (fonts, layout, visual hierarchy)
- ✅ Title page-specific design assistance

**General Document Design Mode (NEW - Not Section-Specific):**
- ✅ **Page numbers** - Configure page numbering for entire document (start number, position, format)
- ✅ **Extra pages** - Add blank pages, section separators, story separation lines
- ✅ **Document-wide formatting** - Headers, footers, margins, page breaks
- ✅ **Story separation lines** - Visual separators between major sections
- ✅ **Page layout** - Page size, orientation, margins for entire document
- ⚠️ **Note:** This should be accessible from any section, not just title page

**REFERENCES_SECTION_ID (Citations - References Management Mode):**
- ✅ Citation format help (APA, MLA, Chicago, etc.)
- ✅ Reference organization suggestions
- ✅ Bibliography generation assistance
- ✅ Attachment management (link documents, URLs)
- ✅ Citation consistency checks
- ✅ Source validation guidance

**References in Content Sections (How It Should Work):**
- ✅ When user asks about citations/references in a content section, AI should:
  1. Detect references context via `detectAIContext()`
  2. Suggest creating a reference in REFERENCES section
  3. Provide action button to "Add Reference" that creates reference and links it to current question
  4. Questions can have `referenceIds` array to link to references
  5. Questions can have `attachments` array with `AttachmentReference` type
- ⚠️ **Current state:** Infrastructure exists (`attachReferenceToQuestion`, `referenceIds`, `AttachmentReference`) but UI flow unclear
- ❌ **Missing:** Clear UI for adding references from content sections

**APPENDICES_SECTION_ID (Supplementary - Appendices Organization Mode):**
- ✅ File organization suggestions
- ✅ Appendix naming conventions
- ✅ Content categorization help
- ✅ File upload guidance
- ✅ Appendix ordering recommendations
- ✅ Document linking assistance

---

## 🤖 KI-Engine / Text Generation Architecture

### Current Implementation

**AI Client:** `features/editor/engine/sectionAiClient.ts`  
**API Endpoint:** `pages/api/ai/openai.ts` (despite name, uses **custom LLM**)

**Key Functions:**
1. `generateSectionContent()` - Main AI API call
2. `detectAIContext()` - Detects user intent (content/design/references)
3. `parseAIActions()` - Extracts actionable suggestions from AI response

**Custom LLM Architecture:**
- **Primary:** Custom LLM endpoint (via `callCustomLLM()`)
- **Fallback:** OpenAI API (if custom LLM fails or not configured)
- **Test Mode:** Mock responses (development/testing)

**API Flow:**
```
User Input → generateSectionContent()
  ↓
POST /api/ai/openai
  ↓
1. Try Custom LLM (if enabled)
   - callCustomLLM({ messages, temperature, maxTokens })
   - Returns: { output, latencyMs }
  ↓
2. Fallback to OpenAI (if custom LLM fails)
   - openai.chat.completions.create()
   - Model: GPT-4o-mini (configurable)
  ↓
Payload: {
  message: context,
  context: {
    sectionTitle,
    sectionId,
    currentContent,
    programType,
    programName,
    documentType,
    questionPrompt,
    questionStatus,
    requirementHints,
    attachmentSummary,
    sectionGuidance,  // From template
    hints,            // From validation
    ...
  },
  conversationHistory: [...],
  action: 'generate' | 'improve' | 'compliance' | 'suggest'
}
  ↓
Custom LLM / OpenAI Response
  ↓
Parse response (JSON or plain text) → Extract actions → Return content + suggestions
```

**System Prompt Generation:**
- Built dynamically based on `action` and `context`
- Includes: program type, section title, section guidance, hints
- Action-specific instructions (generate/improve/compliance/suggest)
- Requests JSON response with structured data (content, suggestions, KPIs)

### Sidebar Data Flow to AI Agent

**What Sidebar Provides:**
1. **Section Templates** (`filteredSections`, `allSections`)
   - Section title, description, origin
   - Required/optional status
   - Template prompts (full text, not simplified)

2. **Section Metadata**
   - Section enable/disable state
   - Custom sections (user-created)
   - Section order/organization

3. **Phase 3 Features (Future)**
   - Question prompt customization (overrides template)
   - Question visibility (show/hide)
   - Question reordering

**How Sidebar Data Feeds AI:**
```typescript
// From useEditorStore.ts - requestAISuggestions()
const template = templates.find(t => t.id === sectionId);
const enhancedContext = [
  template?.prompts?.join('\n') ?? section.description ?? '',  // Full template text
  buildAiQuestionContext({
    section,
    question,
    attachments: attachmentSummary,
    requirementHints,
    intent,
    validation
  }),
  buildIntentPrompt(intent)
].filter(Boolean).join('\n\n');
```

**Context Includes:**
- **Full template prompts** (all sub-questions, not simplified)
- **Section description** (expert guidance)
- **Question context** (prompt, status, word count, current answer)
- **Validation hints** (requirement gaps, errors, warnings)
- **Attachment summary** (linked tables, KPIs, media)
- **Program metadata** (type, name, funding type)
- **Document type** (business-plan, proposal, report, application)

**Key Insight:** AI uses **full template text** (200-550 chars, 5-7 questions) while user sees **simplified prompt** (20-36 chars, 1 question). This gives AI rich context while keeping UI simple.

### Problems with Current Architecture

1. **Single Generic Endpoint**
   - ❌ One API for all section types
   - ❌ No specialized prompts per document type
   - ⚠️ Limited context awareness (but has template prompts)

2. **Weak Action Parsing**
   - ❌ Simple keyword matching (`includes('table')`)
   - ⚠️ AI can return structured JSON, but parsing is basic
   - ❌ Fallback actions always shown

3. **Prompt Engineering**
   - ✅ System prompts include program type, section guidance
   - ⚠️ Generic prompts for all sections (not section-specific)
   - ⚠️ No document type specialization in prompts
   - ✅ Template prompts provide rich context

### Recommended Architecture

#### Option A: Specialized AI Engines (Recommended)

```typescript
// Separate engines for different document types
interface AIEngine {
  generateContent(request: SectionAiRequest): Promise<SectionAiResponse>;
  parseActions(content: string): AIAction[];
  getPromptTemplate(section: Section): string;
}

class BusinessPlanEngine implements AIEngine {
  // Specialized for business plans
  // Knows about: market analysis, financials, team, etc.
}

class ProposalEngine implements AIEngine {
  // Specialized for grant proposals
  // Knows about: objectives, impact, budget, etc.
}

class ReportEngine implements AIEngine {
  // Specialized for reports
  // Knows about: findings, recommendations, data visualization
}
```

**Benefits:**
- ✅ Section-specific prompts
- ✅ Document type awareness
- ✅ Better action parsing
- ✅ Easier to maintain

#### Option B: Prompt Template System

```typescript
// Centralized prompt templates
const PROMPT_TEMPLATES = {
  'business-plan': {
    'market-analysis': `You are helping write a market analysis section...`,
    'financial-projections': `You are helping write financial projections...`,
    // ...
  },
  'proposal': {
    'objectives': `You are helping write proposal objectives...`,
    // ...
  }
};

// Use template based on document type + section
function getPrompt(documentType: string, sectionId: string): string {
  return PROMPT_TEMPLATES[documentType]?.[sectionId] || DEFAULT_PROMPT;
}
```

#### Option C: Structured Output (Best for Actions)

```typescript
// Use custom LLM or OpenAI structured output
interface StructuredAIResponse {
  content: string;
  suggestions: string[];
  recommendedActions: {
    type: 'create_table' | 'create_kpi' | 'add_image' | 'add_reference';
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  citations?: Citation[];
  suggestedKPIs?: Array<{
    name: string;
    value: number;
    unit?: string;
    description?: string;
  }>;
}
```

**Implementation:**
```typescript
// For custom LLM - request JSON format in prompt
const systemPrompt = `...Respond in JSON format with: {
  "content": "your response",
  "suggestions": ["suggestion1", "suggestion2"],
  "recommendedActions": [{"type": "create_table", "reason": "...", "priority": "high"}],
  "suggestedKPIs": [{"name": "Revenue", "value": 0, "unit": "€", "description": "..."}]
}`;

// For OpenAI - use structured output
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  response_format: { type: 'json_schema', json_schema: {...} },
  messages: [...]
});
```

**Note:** Current implementation already requests JSON format, but parsing is basic. Can be enhanced to use structured output for custom LLM.

---

## 💡 Recommendations

### 1. Simplify UI Structure

**Proposed Layout:**
```
┌─────────────────────────────────┐
│ Section Title            [✕]    │
├─────────────────────────────────┤
│ [Question Navigation]            │
│ (only for normal sections)      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Answer Input (if no answer) │ │
│ │ (only for normal sections)  │ │
│ └─────────────────────────────┘ │
│ OR                              │
│ ┌─────────────────────────────┐ │
│ │ Answer Preview              │ │
│ │ [Edit] [Delete]              │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 💬 AI Assistant                 │
│ ┌─────────────────────────────┐ │
│ │ Chat Messages (scrollable)  │ │
│ │ - Question/Answer messages  │ │
│ │ - AI suggestions            │ │
│ │ - Proactive suggestions     │ │
│ │   (moved here, not at top)  │ │
│ │ - Action buttons (only when│ │
│ │   AI suggests them)         │ │
│ └─────────────────────────────┘ │
│ [Ask AI...]              [Send] │
│ (single send button only)       │
├─────────────────────────────────┤
│ [✓ Complete] [Skip]             │
│ (only for normal sections)      │
└─────────────────────────────────┘
```

**Special Sections Layout:**
```
┌─────────────────────────────────┐
│ Section Title            [✕]    │
│ (Title Page / References /      │
│  Appendices)                    │
├─────────────────────────────────┤
│ 💬 AI Assistant                 │
│ ┌─────────────────────────────┐ │
│ │ Welcome Message              │ │
│ │ (Design/References/         │ │
│ │  Appendices mode)           │ │
│ ├─────────────────────────────┤ │
│ │ Chat Messages (scrollable)  │ │
│ │ - AI suggestions            │ │
│ │ - Action buttons (only when│ │
│ │   AI suggests them)         │ │
│ └─────────────────────────────┘ │
│ [Ask AI...]              [Send] │
│ (single send button only)       │
└─────────────────────────────────┘
```

**Changes:**
- ✅ Separate answer input from AI chat (normal sections only)
- ✅ **Remove all always-visible data creation buttons** (Table/KPI/Image)
- ✅ **Show data creation options only when AI suggests them** (in AI message actions)
- ✅ **Single send button only** - no other action buttons in input area
- ✅ **Reposition AI suggestions** - move proactive suggestions below chat messages (in conversation flow)
- ✅ Clear visual hierarchy
- ✅ Special sections: AI chat only, no answer input

### 2. Improve Positioning

**Option A: Sticky to Preview Container**
```typescript
// Use absolute positioning relative to preview container
position: 'absolute',
top: scrollContainer.scrollTop + targetRect.top,
left: scrollContainer.scrollLeft + scrollContainer.offsetWidth + GAP
```

**Option B: Sidebar Mode**
- Editor always on right side of preview
- Fixed width, scrolls with preview
- No positioning calculations needed

**Option C: Collapsible Panel**
- Editor slides in from right
- Can be collapsed to icon
- Doesn't overlap preview

### 3. Enhance AI Engine

**Immediate Improvements:**
1. **Leverage Custom LLM Capabilities**
   - Custom LLM already supports structured output (JSON)
   - Enhance parsing to extract structured actions
   - Use custom LLM's specific features (if any)

2. **Improve Context from Sidebar**
   - Include custom question prompts (Phase 3) in AI context
   - Pass section origin (template vs. custom) to AI
   - Include section enable/disable state for context

3. **Section-specific prompts**
   - Different prompts for market analysis vs. financials
   - Use full template text (already included)
   - Better context awareness from sidebar templates

4. **Enhanced Structured Output**
   - Request structured JSON from custom LLM
   - Parse `recommendedActions` array (not just keyword matching)
   - Extract `suggestedKPIs` from AI response
   - No fallback actions needed if AI provides structured output

5. **Conversation memory**
   - Store conversation history per section (already implemented)
   - Remember user preferences
   - Learn from user edits

6. **Sidebar Integration**
   - When user customizes question prompt in sidebar (Phase 3), update AI context
   - When user hides/shows questions, adjust AI suggestions
   - When user reorders questions, maintain context

### 4. Simplify Component

**Split into smaller components:**
```typescript
<InlineSectionEditor>
  <EditorHeader />
  <QuestionNavigation />
  <AnswerEditor />  // Separate from AI chat
  <AIAssistant />   // Separate AI chat
  <EditorFooter />
</InlineSectionEditor>
```

**Benefits:**
- ✅ Easier to maintain
- ✅ Better separation of concerns
- ✅ Can reuse components
- ✅ Clearer code structure

---

## 🎯 What Value Does It Provide?

### Current Value

1. **Contextual Assistance**
   - AI understands current section/question
   - Provides relevant suggestions
   - Helps with requirements

2. **Unified Interface**
   - One place for answering + AI help
   - No need to switch between tools
   - Integrated workflow

3. **Proactive Help**
   - Auto-loads suggestions
   - Suggests data creation
   - Validates answers

### Potential Value (If Improved)

1. **Intelligent Text Generation**
   - Generate full answers from outline
   - Expand bullet points to paragraphs
   - Improve existing text

2. **Smart Data Suggestions**
   - Suggest relevant KPIs based on text
   - Recommend tables for data
   - Propose visualizations

3. **Document Consistency**
   - Check consistency across sections
   - Suggest cross-references
   - Maintain tone/style

4. **Learning System**
   - Learn from user edits
   - Improve suggestions over time
   - Personalize to user's style

---

## 📊 Summary

### Current State
- ✅ Works but confusing UI
- ✅ Custom LLM integration (with OpenAI fallback)
- ✅ Rich context from sidebar templates (full prompts)
- ✅ Positioning issues (fixed positioning, complex calculations)
- ✅ Context detection exists (`detectAIContext()`) but limited usage
- ✅ Special sections have welcome messages and auto-set context
- ✅ Infrastructure for references exists (`attachReferenceToQuestion`, `referenceIds`, `AttachmentReference`)
- ❌ Too many buttons/options (data creation buttons always visible)
- ❌ **Missing:** General document design mode (page numbers, extra pages, story separation lines)
- ❌ **Missing:** Clear UI flow for adding references from content sections
- ⚠️ Basic action parsing (keyword matching, but AI can return JSON)
- ⚠️ Generic system prompts (but template prompts provide context)
- ⚠️ Special sections have basic context detection but not fully specialized prompts

### Recommended Path Forward

1. **Simplify UI** - Separate answer from AI chat, reduce buttons, single send button
2. **Fix Positioning** - Use sidebar or sticky to container
3. **Enhance Special Sections** - Improve design, references, appendices, list of tables modes
4. **Reposition AI Suggestions** - Better placement and visibility
5. **Enhance AI Engine** - Leverage custom LLM structured output, section-specific prompts
6. **Refactor Component** - Split into smaller, focused components
7. **Integrate Sidebar Changes** - Use Phase 3 question customization in AI context
8. **Add Features** - Text generation, smart suggestions, learning

### Priority Order

1. **High Priority:** Simplify UI (single send button), fix positioning, enhance special sections
2. **Medium Priority:** Reposition AI suggestions, enhance AI engine (structured output parsing), integrate sidebar Phase 3 features
3. **Low Priority:** Advanced features (learning, consistency checks)

---

## 🎯 3-Phase Implementation Plan

### **Phase 1: UI Simplification & Special Sections Enhancement** (High Priority) ✅ **COMPLETED**
**Goal:** Simplify interface, enhance special section modes, fix positioning

**Status:** ✅ All tasks completed and tested

**Tasks:**

1. **Single Send Button Only** ✅
   - ✅ Removed all data creation buttons (Table/KPI/Image) from always-visible area
   - ✅ Removed duplicate action buttons and fallback actions
   - ✅ Single send button only in chat input
   - ✅ Data creation options only appear when AI suggests them (via action buttons in AI messages)

2. **Special Sections & Assistant Modes**
   - **METADATA_SECTION_ID (Title Page):** Title page design mode
     - Help with logo placement, title page formatting
     - Title page-specific design suggestions (fonts, layout, visual hierarchy)
     - Title page formatting guidance
   - **General Document Design Mode (NEW - Accessible from any section):**
     - **Page numbers** - Configure page numbering for entire document (start number, position, format)
     - **Extra pages** - Add blank pages, section separators
     - **Story separation lines** - Visual separators between major sections/stories
     - **Document-wide formatting** - Headers, footers, margins, page breaks for entire document
     - **Page layout** - Page size, orientation, margins
     - Accessible via design context detection in any section
   - **REFERENCES_SECTION_ID (Citations):** References management mode
     - Citation format help (APA, MLA, etc.)
     - Reference organization suggestions
     - Attachment management (link documents, URLs)
     - Bibliography generation assistance
   - **References in Content Sections (NEW):**
     - When user asks about citations/references in content section:
       - AI detects references context via `detectAIContext()`
       - AI suggests creating reference in REFERENCES section
       - Action button "Add Reference" creates reference and links to current question
       - Questions can link to references via `referenceIds` array or `attachments` with `AttachmentReference`
     - Clear UI flow for adding references from content sections
   - **APPENDICES_SECTION_ID (Supplementary):** Appendices organization mode
     - File organization suggestions
     - Appendix naming conventions
     - Content categorization help
     - File upload guidance
   - **ANCILLARY_SECTION_ID (TOC/List of Tables):** Auto-generated, no editor (keep hidden)

3. **Enhanced Context Detection** ✅
   - ✅ Improved `detectAIContext()` to better handle all contexts:
     - ✅ **Design mode:** Enhanced with general document design keywords (page numbers, extra pages, story separation lines, document-wide formatting)
     - ✅ **References mode:** Extended to work in content sections (not just references section)
     - ✅ **Appendices mode:** Detects organization/file questions
   - ✅ Auto-set context based on section type on mount (already implemented)
   - ✅ **General design mode:** Now detects document-wide design questions (page numbers, extra pages, story separation lines) from any section

4. **Fix Positioning** ✅
   - ✅ Switched from complex `position: fixed` calculations to sidebar mode
   - ✅ Editor always on right side of preview container (desktop)
   - ✅ Fixed width, no scroll tracking needed
   - ✅ Removed complex positioning calculations and scroll listeners

5. **Reposition AI Suggestions** ✅
   - ✅ Moved proactive suggestions to appear **below** chat messages (integrated into conversation flow)
   - ✅ Shows suggestions as part of AI assistant responses with proper message styling
   - ✅ Removed separate "Consider mentioning" section at top

6. **Separate Answer Input from AI Chat** ✅
   - ✅ Normal sections: Dedicated answer input section (textarea) when no answer exists
   - ✅ After answer submission, switches to AI chat mode
   - ✅ Special sections: AI chat only (no answer input)

7. **References Workflow in Content Sections** ✅
   - ✅ Enhanced `parseAIActions()` to detect references context in any section
   - ✅ Added "Add Reference" action button when AI detects citation/reference mentions
   - ✅ Works in both content sections and references section

---

### **Phase 2: AI Engine Enhancement & Sidebar Integration** (Medium Priority) ✅ **COMPLETED**
**Goal:** Improve AI capabilities, better structured output, integrate sidebar data

**Status:** ✅ All tasks completed and tested

**Tasks:**

1. **Enhanced Structured Output Parsing** ✅
   - ✅ Parse `recommendedActions` array from JSON responses
   - ✅ Extract `suggestedKPIs` from AI response
   - ✅ Prioritize structured output over keyword matching (fallback still available for backward compatibility)
   - ✅ Better error handling for malformed JSON with validation
   - ✅ Support special section actions (design suggestions, reference formats, appendix organization)
   - ✅ Updated `parseAIActions()` to accept full response object, not just content string
   - ✅ API response parsing validates and normalizes `recommendedActions` and `suggestedKPIs`

2. **Section-Specific Prompts for Special Sections** ✅
   - ✅ **Title Page Design Mode Prompts:** Title page design, formatting, visual hierarchy
   - ✅ **General Document Design Mode Prompts:**
     - Page numbering configuration (start number, position, format)
     - Extra pages and section separators
     - Story separation lines
     - Document-wide formatting (headers, footers, margins, page breaks)
     - Page layout settings
   - ✅ **References Mode Prompts:** Citation formats, bibliography, attachment management
   - ✅ **References in Content Sections Prompts:**
     - How to add citations to content
     - Linking references to questions
     - Reference format suggestions based on content
   - ✅ **Appendices Mode Prompts:** File organization, naming conventions, categorization
   - ✅ **Context-Aware Prompts:** Design, references, questions, and default content modes
   - ✅ Created `buildSectionSpecificPrompt()` function for specialized prompt generation
   - ✅ Integrated section-specific prompts into `generateSectionContent()` via `assistantContext` and `sectionType`

3. **Sidebar Phase 3 Integration** ⏳ **PENDING** (Depends on Sidebar Phase 3 Features)
   - ⏳ Pass custom question prompts to AI context (when overridden) - Ready when sidebar supports it
   - ⏳ Filter AI suggestions by question visibility - Ready when sidebar supports it
   - ⏳ Maintain question order in AI context - Ready when sidebar supports it
   - ⏳ Update AI context reactively when sidebar changes - Ready when sidebar supports it
   - ✅ Foundation ready: `assistantContext` state exists and is used, context parameters are passed

4. **Context Improvements** ✅
   - ✅ Include section origin (template vs. custom) in AI context
   - ✅ Pass section enable/disable state (defaults to true)
   - ✅ Enhanced metadata passing from sidebar (sectionType, sectionOrigin, sectionEnabled)
   - ✅ Include special section type in AI context (metadata/references/appendices/normal)
   - ✅ Updated `SectionAiRequest` type with new context fields
   - ✅ All `generateSectionContent()` calls now pass enhanced context

---

### **Phase 3: Advanced Features & Intelligence** (Low Priority)
**Goal:** Add intelligent features and learning capabilities

**Tasks:**

1. **Intelligent Text Generation**
   - Generate full answers from outlines
   - Expand bullet points to paragraphs
   - Improve existing text with AI

2. **Smart Data Suggestions**
   - Suggest relevant KPIs based on text content
   - Recommend tables for data visualization
   - Propose images/visualizations contextually
   - Special section suggestions (design improvements, reference formats, appendix organization)
   - **Design suggestions:** Suggest page breaks, story separation lines, formatting improvements based on content length
   - **Reference suggestions:** Suggest adding references based on content (e.g., "You mentioned market data - consider adding a citation")

3. **Document Consistency**
   - Cross-section consistency checks
   - Suggest cross-references
   - Maintain tone/style across document
   - Check citation consistency across references section

4. **Learning System** (Future)
   - Learn from user edits
   - Remember user preferences per section
   - Personalize suggestions over time
   - Learn design preferences for title page
   - Learn citation format preferences

**Estimated Timeline:**
- Phase 1: ✅ **COMPLETED** (UI/UX critical fixes + special sections)
- Phase 2: ✅ **COMPLETED** (AI improvements + context enhancements) - Sidebar integration pending Phase 3 sidebar features
- Phase 3: 4-6 weeks (Advanced features, iterative) - **NEXT**

**Dependencies:**
- ✅ Phase 2 depends on Phase 1 component refactoring - **COMPLETED**
- ✅ Phase 3 requires Phase 2 AI engine foundation - **COMPLETED**
- ⏳ Sidebar Phase 3 features must be ready before Phase 2 sidebar integration - **PENDING**

### Sidebar → AI Agent Data Flow (Current & Future)

**Current:**
```
Sidebar Templates
  ↓
Section Metadata (title, description, origin, required)
  ↓
Template Prompts (full text, all sub-questions)
  ↓
AI Context Builder
  ↓
Custom LLM / OpenAI
```

**Phase 3 (Future):**
```
Sidebar Templates
  ↓
User Customizations:
  - Custom question prompts (override template)
  - Question visibility (show/hide)
  - Question order
  ↓
Enhanced AI Context:
  - Custom prompts (if overridden)
  - Only visible questions
  - Ordered questions
  ↓
Custom LLM / OpenAI
```

**Key Benefit:** Sidebar changes directly feed AI agent, making suggestions more relevant and personalized.

---

## 📋 Sidebar Integration & Editability

### What Sidebar Manages (Reference: `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md`)

**Current Sidebar Capabilities:**
- ✅ Section Title (editable)
- ✅ Section Enable/Disable (toggle)
- ✅ Section Templates (read-only, but provides data to AI)
- ❌ Question Prompts (read-only until Phase 3)
- ❌ Question Answers (edited in InlineSectionEditor, not sidebar)
- ❌ Question Status (managed in InlineSectionEditor)

**Phase 3 Sidebar Features (Future):**
- ✅ Question Prompts (customizable, override template)
- ✅ Question Visibility (show/hide)
- ✅ Question Order (reorder)

### How Sidebar Data Feeds AI Agent

**Template Data Flow:**
```
Sidebar Section Template
  ├─ Section Title → AI context (sectionTitle)
  ├─ Section Description → AI context (sectionGuidance)
  ├─ Template Prompts (full text) → AI context (template?.prompts)
  └─ Section Origin → AI context (for template-specific guidance)
```

**Question Data Flow:**
```
Sidebar Question Template (Current)
  └─ Template Prompt (full text) → AI context (questionPrompt)
     Note: User sees simplified prompt, AI uses full template

Sidebar Question Customization (Phase 3)
  ├─ Custom Prompt (if overridden) → AI context (questionPrompt)
  ├─ Visibility State → Filters AI suggestions
  └─ Question Order → Affects AI context ordering
```

**Key Insight from Editability Doc:**
- **User sees:** Simplified prompt (20-36 chars, 1 question)
- **AI receives:** Full template text (200-550 chars, 5-7 questions)
- **Result:** AI has rich context while UI stays simple

### Impact of Sidebar Changes on AI

**When User Edits Section Title:**
- ✅ Updates AI context immediately
- ✅ AI suggestions reflect new section name

**When User Toggles Section Enable/Disable:**
- ⚠️ Currently no direct AI impact
- 💡 Future: Could filter AI suggestions for disabled sections

**When User Customizes Question Prompt (Phase 3):**
- ✅ Overrides template prompt in AI context
- ✅ AI suggestions use custom prompt
- ✅ More personalized AI responses

**When User Hides/Shows Questions (Phase 3):**
- ✅ Filters AI suggestions to visible questions only
- ✅ Reduces AI context noise
- ✅ More focused suggestions

**When User Reorders Questions (Phase 3):**
- ⚠️ Maintains AI context order
- 💡 Future: Could affect AI suggestion priority

### Recommendations for Sidebar → AI Integration

1. **Immediate:**
   - ✅ Already passing template prompts to AI (good!)
   - ✅ Already using full template text (not simplified)
   - ⚠️ Could enhance with section origin metadata

2. **Phase 3:**
   - ✅ Pass custom question prompts to AI
   - ✅ Filter AI context by question visibility
   - ✅ Maintain question order in AI context
   - ✅ Update AI context when sidebar changes

3. **Future Enhancements:**
   - 💡 AI learns from user's custom prompts
   - 💡 AI adapts to user's question preferences
   - 💡 AI suggests question reordering based on content

