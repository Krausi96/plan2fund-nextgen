# Editor - Current UI Layout & Functions

## ✅ Current State

### Editor Component
- **File:** `features/editor/components/Editor.tsx`
- **Status:** ✅ Using `SimpleTextEditor` (Google Docs-style)
- **Removed:** ❌ `RichTextEditor.tsx` (ReactQuill) - DELETED
- **Removed:** ❌ `SimpleMarkdownEditor.tsx` - DELETED

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
│  Business Plan                    [⚙️] [👁️ Preview]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Section Navigation (Horizontal Tabs)                   │
│  [01 ✓ Exec] [02 ⚠ Market] [03 ○ Financial] [04 ○ ...]│
│  Status: ✓ = Complete, ⚠ = In Progress, ○ = Empty     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                          │
│  Market Opportunity                                      │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Question 1 of 4                    [✨ Generate Answer] │
│  Progress: ●○○○ (dots show answered questions)          │
│                                                          │
│  💡 Who is the target market?                            │
│                                                          │
│  ┌────────────────────────────────────────────┐          │
│  │                                            │          │
│  │  [Google Docs-style editor box]           │          │
│  │  Clean white box, no heavy toolbar        │          │
│  │  Your answer here...                       │          │
│  │                                            │          │
│  └────────────────────────────────────────────┘          │
│  45 words                                                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [← Previous Question] [Next Question →]                │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [If financial section: Tables appear here]              │
│  ┌──────────┬──────────┬──────────┐                    │
│  │ Year 1   │ Year 2   │ Year 3   │                    │
│  ├──────────┼──────────┼──────────┤                    │
│  │ Revenue │ [____]   │ [____]   │                    │
│  │ Costs   │ [____]   │ [____]   │                    │
│  └──────────┴──────────┴──────────┘                    │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  250 / 500 words  •  Progress: 60%                      │
│                                                          │
│  [← Previous Section] [Next Section →]                │
│                                                          │
└─────────────────────────────────────────────────────────┘

[Floating Action Button - Bottom Right]
┌──────┐
│  💬  │  AI Assistant (opens modal)
│  ✓   │  Requirements (opens modal)
│  ⚙️   │  Settings (opens modal)
└──────┘
```

## Functions & Features

### ✅ Implemented

1. **Section Navigation**
   - Horizontal tabs at top
   - Status indicators (✓ ⚠ ○)
   - Click to switch sections
   - Shows section number and title

2. **Question-Based Editing**
   - One question at a time
   - Progress dots (● = current, ● = answered, ○ = not answered)
   - Question counter (e.g., "Question 1 of 4")
   - Previous/Next question navigation
   - Answers stored in `section.fields.answers[questionIndex]`
   - Auto-combines answers into `section.content`

3. **SimpleTextEditor (Google Docs-Style)**
   - Clean white box
   - No heavy toolbar
   - Simple textarea with focus styling
   - Smooth typing experience
   - Note: Word count shown in progress section, not in editor itself

4. **Financial Tables**
   - Inline editing (if section has tables)
   - Direct cell editing
   - Auto-saves on change

5. **Auto-Save**
   - Debounced (400ms delay)
   - Saves to `planStore`
   - Shows "Saving..." indicator

6. **AI Generation** ✅ Enhanced with Conversation Memory
   - "✨ Generate Answer" button per question
   - Uses `aiHelper.ts` to generate content
   - Context-aware (current question, section, program)
   - **Conversation History** - Remembers previous AI interactions per section
   - **Cross-Section Awareness** - References content from other sections
   - **Persistent Memory** - Conversations saved to localStorage per section

7. **Progress Tracking**
   - Word count displayed in progress section (not in editor)
   - Overall section progress
   - Requirements met/total
   - Completion percentage

8. **Floating Action Button (FAB)**
   - 3 buttons: AI, Requirements, Settings
   - Opens modals
   - Bottom right corner

9. **Modals**
   - AI Assistant (info modal - conversation memory integrated into Generate button)
   - Requirements Checker (basic progress)
   - Settings (placeholder)

### ❌ Missing / Incomplete

1. **AI Assistant Modal** ✅ Conversation Memory Integrated
   - Currently: Info modal explaining conversation memory is integrated
   - ✅ **Conversation History** - Implemented in Generate Answer button
   - ✅ **Cross-Section Awareness** - Implemented in Generate Answer button
   - ✅ **Context-Aware** - Uses previous answers, other sections, user data, program requirements
   - Note: Conversation memory works seamlessly in existing flow (no separate chat UI needed)

2. **Settings Modal** ⚠️ IMPORTANT
   - Currently: Placeholder text
   - Needed: Title page settings, document formatting, export options

3. **Requirements Modal** ⚠️ IMPORTANT
   - Currently: Basic progress display
   - Needed: All sections overview, missing requirements list, generate missing items

4. **Chart Generator**
   - Not implemented
   - Needed: Create charts from financial tables (Bar, Line, Pie)

5. **Documents Panel**
   - Not implemented
   - Needed: Upload/manage additional documents, link to sections

6. **Citations Manager**
   - Not implemented
   - Needed: Add/edit sources per section, auto-citation format

## Context Memory & Anti-Hallucination

### How Context is Remembered

**Current Context Includes:**
1. ✅ **Current Question/Content** - What's being answered
2. ✅ **Previous Answers** - All previous question answers in section
3. ✅ **User Answers** - From program selection (company info, funding needs)
4. ✅ **Program Context** - Program ID, type, requirements
5. ✅ **Section Template** - Description, prompts, guidance
6. ✅ **Structured Requirements** - Program-specific requirements from API

**Example Context:**
```
Question: "How large is the market?"
Previous Answer (Q1): "Our target market is B2B SaaS companies..."
User Answers: { companyName: "TechCorp", fundingAmount: "€500k" }
Program: { id: "ffg-basis", type: "grant", name: "FFG Basisprogramm" }
Section Template: { description: "Market analysis...", prompts: [...] }
Structured Requirements: { editor: [...], library: [...] }
```

**Why This Reduces Hallucinations:**
- ✅ Uses **real user data** (not made up)
- ✅ Uses **actual program requirements** (not generic)
- ✅ Uses **previous answers** (maintains consistency)
- ✅ Uses **structured requirements** (program-specific guidance)

**What's Implemented:**
- ✅ **Conversation History** - Each generation remembers previous AI interactions per section
- ✅ **Cross-Section Memory** - AI can reference content from other sections (200 char snippets)
- ✅ **Persistent Storage** - Conversations saved to localStorage per section

**What's Missing (Could Improve):**
- ❌ **No Validation** - Doesn't verify against requirements automatically
- ❌ **No Conversation UI** - History is stored but not visible to user (can be added later if needed)

## Next Steps (Priority Order)

### Step 1: AI Assistant Modal ⚠️ MOST IMPORTANT
**Why:** This is where context memory matters most
**Features:**
- Chat interface with conversation history
- Show context being used (transparent)
- Reference program requirements
- Remember conversation within session
- Per-question help

### Step 2: Settings Modal
**Why:** Users need to customize document
**Features:**
- Title page settings
- Formatting options
- Export settings

### Step 3: Requirements Modal Enhancement
**Why:** Help users complete all requirements
**Features:**
- All sections overview
- Missing items list
- Generate missing items

### Step 4: Chart Generator
**Why:** Visualize financial data
**Features:**
- Create charts from tables
- Multiple chart types

### Step 5: Documents Panel
**Why:** Manage additional documents
**Features:**
- Upload documents
- Link to sections

### Step 6: Citations Manager
**Why:** Add sources and citations
**Features:**
- Add/edit sources
- Auto-citation format

## File Structure

### ✅ Active Files

```
features/editor/
├── components/
│   ├── Editor.tsx                    ✅ Main editor (uses SimpleTextEditor)
│   ├── SimpleTextEditor.tsx           ✅ Google Docs-style editor
│   ├── ProgramSelector.tsx            ✅ Program selection
│   └── ImageUpload.tsx                ✅ Image upload
├── engine/
│   ├── aiHelper.ts                    ✅ AI content generation
│   └── dataSource.ts                  ✅ Data fetching
└── hooks/
    └── useSectionProgress.ts           ✅ Progress calculation
```

### ❌ Deleted Files

- `RichTextEditor.tsx` - Replaced by SimpleTextEditor
- `SimpleMarkdownEditor.tsx` - Not used
- All old markdown documentation files

## Data Flow

### Question Answer Flow

```
User selects section
  ↓
Load section template (has prompts/questions)
  ↓
Show Question 1
  ↓
User types answer in SimpleTextEditor
  ↓
Auto-save to section.fields.answers[0]
  ↓
Combine all answers → section.content
  ↓
User clicks "Next Question"
  ↓
Show Question 2
  ↓
... repeat
```

### AI Generation Flow (Enhanced with Conversation Memory)

```
User clicks "✨ Generate Answer"
  ↓
Load conversation history for this section
  ↓
Get current question
  ↓
Build context:
  - Current question
  - Previous answers (this section)
  - Other sections (cross-section awareness)
  - User answers (from wizard)
  - Program context & requirements
  ↓
Create user message for conversation history
  ↓
Call aiHelper.generateSectionContent(context, conversationHistory)
  ↓
Get AI-generated answer
  ↓
Save assistant response to conversation history
  ↓
Update section.fields.answers[currentQuestionIndex]
  ↓
Auto-save
```

## Component Details

### SimpleTextEditor
- **Type:** Plain textarea (no rich text)
- **Styling:** Google Docs-style (clean white box)
- **Features:** Word count, focus styling
- **No toolbar:** Just clean text editing

### Editor.tsx
- **State:**
  - `sections` - All plan sections
  - `activeSection` - Currently editing section index
  - `currentQuestionIndex` - Current question (0-based)
  - `sectionTemplates` - Original templates (for prompts)
  - `plan` - Full plan document

- **Key Functions:**
  - `handleSectionChange()` - Update section content
  - `handleAnswerChange()` - Update question answer
  - `handleAIGenerate()` - Generate AI content with conversation memory
    - Loads conversation history per section
    - Builds context with cross-section awareness
    - Saves conversation history after generation
  - `loadSections()` - Load sections from templates

## What's Next

### Priority 1: BLOCKERS (Must Have to Complete Plan) ⚠️ CRITICAL

**Based on analysis of successful business plans (e.g., Runtastic 2009):**

1. **Financial Tables & Charts Generator** ⚠️ CRITICAL
   - **Why:** Successful plans require extensive financial sections with:
     - Multi-year revenue/cost projections (tables)
     - Break-even analysis (charts)
     - Cash flow projections (charts)
     - Multiple scenarios (base/worst/best case)
   - **User Input:** User enters data in tables → Charts auto-generate → Appears in preview/export
   - **Current State:** Basic table editing exists, but no chart generation
   - **Needed:**
     - Enhanced table editor (improve existing)
     - Chart generation from table data (Bar, Line charts)
     - Scenario management (base/worst/best case)
     - Export charts to PDF

2. **Requirements Modal Enhancement** ⚠️ CRITICAL
   - **Why:** Users need to see all sections, missing requirements, and generate missing content
   - **User Input:** Shows what's missing → Can generate missing content directly
   - **Current State:** Basic progress display exists
   - **Needed:**
     - All sections overview
     - Missing requirements per section
     - Program-specific requirements checklist
     - Generate missing content from modal

3. **Export/Preview Enhancement** ⚠️ CRITICAL
   - **Why:** Users need professional PDF export with all charts/tables
   - **User Input:** User clicks "Export" → Gets complete PDF with charts/tables
   - **Current State:** Preview exists, export needs enhancement
   - **Needed:**
     - PDF export with charts/tables included
     - Professional formatting
     - Title page customization
     - Page numbering

### Priority 2: ENHANCERS (Improve Quality)

4. **Settings Modal - Document Formatting**
   - Title page customization
   - Font/formatting options
   - Page numbering
   - Cover page design

5. **Validation System**
   - Auto-check against program requirements
   - Highlight missing elements
   - Suggest improvements

6. **Basic Chart Generator**
   - Generate charts from financial tables
   - Bar charts (revenue/costs)
   - Line charts (growth projections)
   - Export charts to PDF

### Priority 3: NICE-TO-HAVE (Can Wait)

7. **Citations Manager** - Can be done manually, not critical
8. **Documents Panel** - Can attach separately, not blocking
9. **Advanced Chart Types** - Basic charts are sufficient for now

## Summary

**Current:** ✅ Working editor with:
- Question-based flow
- Google Docs-style editor
- Auto-save
- AI generation with **conversation memory** ✅
- **Cross-section awareness** ✅
- Progress tracking (word count in progress section)
- Requirements checker (basic)

**Missing (Critical):** 
- ⚠️ **Financial Charts Generator** - Generate charts from table data (CRITICAL for financial sections)
- ⚠️ **Requirements Modal Enhancement** - All sections overview, missing items, generate missing content
- ⚠️ **Export Enhancement** - PDF export with charts/tables, professional formatting

**Missing (Enhancers):**
- Settings modal (complete implementation)
- Validation system (auto-check against requirements)
- Basic chart generator (Bar/Line charts)

**Missing (Nice-to-Have):**
- Documents panel
- Citations manager
- Advanced chart types

