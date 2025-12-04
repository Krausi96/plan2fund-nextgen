# Handover: InlineSectionEditor - Phase 2 Complete, Ready for Phase 3

**Date:** 2024  
**Status:** ✅ **PHASE 2 COMPLETE - READY FOR PHASE 3**  
**Priority:** 🟢 **READY FOR NEXT PHASE**  
**Assigned To:** [Colleague Name]

---

## 💬 CHAT MESSAGE (Copy This)

```
Hey! Phase 2 is complete. You need to implement Phases 3-5.

📖 READ: docs/HANDOVER-INLINE-EDITOR-POSITIONING-UNIFIED-EDITING.md
   - Line 9: "READ THIS FIRST" section
   - Line 2160: "ACTION PLAN: What To Do Next" - exact steps
   - Line 1968: Phase 3 implementation guide
   - Line 2014: Phase 4 implementation guide  
   - Line 2051: Phase 5 implementation guide

📝 MAIN FILE: features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx
   - Lines 1258-1396: Phase 3 (unify input)
   - Lines 1223-1255: Phase 4 (recommendations)
   - Lines 1186-1205: Phase 5 (actions)

All details, line numbers, and step-by-step instructions are in the handover doc. No new MDs needed.
```

---

## ⚡ READ THIS FIRST

**You need to implement Phases 3, 4, and 5. Here's exactly what to do:**

1. **READ:** Scroll to "ACTION PLAN: What To Do Next" (line 2160) - tells you exactly what to do
2. **READ:** `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` lines 819-1396
3. **READ:** `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` lines 496-565 (design vision)
4. **DO:** Start with Phase 3 (unify input) - see line 2169 for exact steps
5. **THEN:** Phase 4 (recommendations) - see line 2175
6. **FINALLY:** Phase 5 (collapsible actions) - see line 2180

**All code locations and line numbers are in this document. No need to create new MD files.**

---

## 📋 Executive Summary

**Phase 2 Status:** ✅ **COMPLETE** (including all overflow fixes)

**What's Done:**
- ✅ Panel visible and functional (480×420px, center-bottom)
- ✅ Draggable panel with position persistence (localStorage)
- ✅ Simplified UI (removed extra buttons)
- ✅ Fixed visibility issues (React Portal to escape CSS containment)
- ✅ Fixed overflow issues in parent container (Editor.tsx line 781)
- ✅ Fixed grid layout overflow (row 1 capped at 200px, row 2 gets remaining space)
- ✅ Increased editor container height (`calc(100vh - 60px)`) for better space allocation
- ✅ Fixed CurrentSelection scrollable overflow

**What's Left (Phases 3-5):**
- ⏳ **Phase 3:** Unified Editing Interface (remove dual input modes, add markdown) - **See lines 1968-2011**
- ⏳ **Phase 4:** Recommendations Display (actionable cards, better interaction) - **See lines 2014-2048**
- ⏳ **Phase 5:** Action Buttons (collapsible, smart display) - **See lines 2051-2078**

**Quick Reference:**
- All implementation guides are in this document (no separate MD files needed)
- Code locations are specified with line numbers
- See "What's Left: Phases 3-5 Summary" section at the end for detailed breakdown

**Key Files:**
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` (main component, 1532 lines)
- `features/editor/components/Editor.tsx` (parent component, renders InlineSectionEditor)

**👉 START HERE:** See "ACTION PLAN: What To Do Next" section below (line 2160)

---

## Current Status

- ✅ **Phase 2 Complete:** Panel visible, positioned, and draggable
- ✅ Panel size: 480px × 420px (compact, center-bottom)
- ✅ Center-bottom positioning with draggable support
- ✅ Simplified UI (removed extra buttons)
- ✅ Position persistence via localStorage
- ⏳ **Next:** Phase 3 - Unified Editing Interface

### Phase 2 Implementation Summary

**Completed:**
1. **Panel Size & Positioning**
   - Panel size: 480px × 420px (reduced from 600×800 for better balance)
   - Position: Center-bottom of viewport by default
   - Code: `position: fixed`, `zIndex: 9999`, rendered via React Portal
   - Draggable: Header is draggable, position saved to localStorage

2. **Visibility Fixes (RESOLVED)**
   - Fixed conflicting visibility effects
   - Component always visible when plan exists (except ANCILLARY section)
   - Welcome state shows when no section selected
   - Rendered via React Portal to escape CSS containment

3. **UI Simplification**
   - Simplified footer (compact layout)
   - Only essential buttons: Close, Complete, Skip
   - Progress indicator inline with buttons
   - Removed unused code

**Key Files Modified:**
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`
  - Size constants: `EDITOR_WIDTH = 480`, `EDITOR_MAX_HEIGHT = 420`
  - Center-bottom positioning in `calculatePosition()`
  - Draggable functionality with `handlePanelMouseDown()`
  - Portal rendering to `document.body`
- `features/editor/components/Editor.tsx`
  - Removed CSS containment that blocked fixed positioning
  - Fixed overflow issues (line 781: parent container overflow)
  - Fixed grid layout (line 811: row constraints, flex-1 for proper space distribution)
  - Increased container height (line 781: `calc(100vh - 60px)`)
- `features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`
  - Made scrollable when content exceeds max height
  - Added proper height constraints

---

## Issues to Fix

### 1. Positioning — needs to be closer to the page

**Current:** Editor positioned on right side of viewport/container  

**Problem:** Too far from preview content, feels disconnected

**What should happen:**
- Editor should be positioned closer to the preview content
- Should feel connected to the section being edited
- Should follow/scroll with content (or stay fixed relative to preview area)

**Questions to answer:** See **Decision 1** in "Questions to Resolve" section below.

**Reference:** See `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` lines 566-585 for positioning options

---

### 2. What should the user see?

**Current:** Editor shows full panel with all features  

**Question:** See **Decision 2** in "Questions to Resolve" section below.

**Reference:** See `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` lines 24-28 for current positioning problems

---

### 3. How should the panel move?

**Current:** Static position on right side  

**Options:** See **Decision 1** in "Questions to Resolve" section below for detailed options.

**Reference:** See `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` lines 566-585

---

## Critical: Unified Content Editing Design

### Current Problem

The editor currently shows two separate areas that are essentially the same:

1. **Answer Input Area** (when no answer): Textarea + "Submit Answer" button
2. **AI Chat Area** (when answer exists): Input + "Send" button

This is confusing — they're the same thing, just in different modes.

---

### What the template shows

Looking at template examples:

- Questions are very detailed (200-550 chars, 5-7 sub-questions)
- Example: "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor?..." (350+ chars, 7 questions)
- User sees simplified: "Describe your product or service" (33 chars, 1 question)

**Reference:** See `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md` lines 39-178 for prompt simplification examples

---

### What the panel should show when editing content

**Recommended unified design** (from docs):

```
┌─────────────────────────────────┐
│ Section Title            [✕]    │
├─────────────────────────────────┤
│ [Question Navigation]            │
│ (1) (2) (3) ...                 │
├─────────────────────────────────┤
│ ❓ Question:                     │
│ "Describe your product..."       │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ [Editable Answer Area]      │ │
│ │ Rich text editor            │ │
│ │ - Can type directly         │ │
│ │ - AI suggestions inline     │ │
│ │ - Action buttons appear     │ │
│ │   when AI suggests them     │ │
│ │                             │ │
│ │ 💡 AI Suggestions:          │ │
│ │ • Current development stage │ │
│ │ • First customers           │ │
│ │ • Sustainability features   │ │
│ │                             │ │
│ │ [⚡ Create Table] [📊 KPI]  │ │
│ │ (only when AI suggests)     │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Ask AI to improve...] [Send]   │
│ (single unified input)           │
├─────────────────────────────────┤
│ [✓ Complete] [Skip]             │
└─────────────────────────────────┘
```

**Key changes needed:**

1. **Unified editing area** — answer editing and AI assistance in one place
2. **Rich text editor** — not just textarea, proper editing capabilities
3. **Inline AI suggestions** — appear within the answer area, not separate
4. **Contextual actions** — action buttons appear when relevant, not always visible
5. **Single input** — one input that handles both answer editing and AI questions

**Reference:** See `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` lines 496-565 for recommended layout

---

### Current vs. Recommended

**Current (separated):**
- Answer textarea (when no answer)
- Separate AI chat (when answer exists)
- Two different UIs for the same task

**Recommended (unified):**
- Single editable answer area
- AI assistance integrated inline
- Suggestions appear contextually
- Actions appear when AI suggests them

**Reference:** See `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md` lines 182-332 for design recommendations

---

## Implementation Recommendations

### 1. Positioning fix

- Position editor closer to preview content
- Consider sticky positioning relative to preview container
- Ensure it doesn't overlap content on smaller screens

**Code location:** `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` lines 189-247 (`calculatePosition`)

**Current implementation:**
- Uses `position: absolute` relative to `preview-container`
- Positioned with `right: 24px` on desktop
- No scroll tracking (static position)

**Options to consider:**
- Sticky positioning that follows scroll
- Dynamic positioning next to active question
- Collapsible panel that doesn't overlap

---

### 2. Unified content editing

- Replace separate textarea + chat with unified rich text editor
- Integrate AI suggestions inline within the editor
- Show action buttons contextually (when AI suggests them)
- Single input that handles both editing and AI questions

**Code location:** 
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` lines 1095-1120 (answer input)
- Lines 1275-1300 (AI chat)

**Current implementation:**
- Separate answer textarea when no answer exists (lines 1090-1120)
- Separate AI chat input when answer exists (lines 1270-1300)
- Two different interaction modes

**Recommended approach:**
- Use rich text editor (TipTap, Slate, or similar)
- Single editable area for both answer and AI interaction
- Inline suggestions within editor
- Contextual action buttons

---

### 3. What to show

Based on template complexity:

- Show simplified question prompt (user-facing)
- Show full template context to AI (hidden from user)
- Show editable answer area with rich text capabilities
- Show AI suggestions inline within answer area
- Show action buttons only when AI suggests them

**Reference:** See `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md` lines 39-178 for prompt simplification examples

---

## Recommendations Based on Business Constraints

### Content Protection Strategy

**Problem:** Risk of users copying content and leaving without paying.

**Recommended Approach:**
1. **Free Tier:** Show preview with prominent watermark ("DRAFT" or "FREE VERSION")
   - Watermark should be large, semi-transparent, and cover content
   - Disable copy/export features (already implemented)
   - Show preview to demonstrate value, but make it clear it's not final

2. **Payment Trigger Points:**
   - **Option A (Recommended):** Pay to remove watermark + enable export
     - Free users can create and edit, but preview always shows watermark
     - Premium required for clean PDF export and copy features
     - This creates value demonstration (they see their work) but requires payment for use
   
   - **Option B:** Pay after X sections completed
     - Free users can complete 2-3 sections, then must pay to continue
     - Preview shows watermark until payment
     - Less ideal - may lose users before they see value

3. **Editor Panel Strategy:**
   - Editor panel should be **the primary workspace** for free users
   - Preview is secondary (shows progress but with watermark)
   - This makes editor more valuable and reduces copy risk (content is in editor, not just preview)

### Editor Panel Content & Recommendations

**What should be shown:**
1. **Active Question** (simplified prompt) - ✅ Already shown
2. **AI Proactive Suggestions** - ✅ Already shown, but can be improved
3. **Context-Aware Recommendations:**
   - Show suggestions based on:
     - Current question context
     - User's previous answers
     - Template requirements
     - Best practices for that section type
   - Display as **actionable cards** (not just bullet points)
   - Each suggestion should have "Add to answer" button

4. **Question Navigation** - ✅ Already shown
5. **Section Guidance** - ✅ Already shown (expandable)

**How Recommendations Work:**
- When user opens editor for a question, AI analyzes:
  - The question prompt (full template context)
  - User's current answer (if any)
  - Related sections already completed
  - Best practices for that question type
- Generate 3-5 specific, actionable suggestions
- Display as cards with "Add" buttons, not just text

### Panel Size Increase

**Current:** 450px width × 600px max height - **TOO SMALL**

**Recommended:**
- **Width:** 550-600px (increase from 450px)
  - More space for recommendations
  - Better readability
  - Can show more content without scrolling
  
- **Height:** 700-800px max (increase from 600px)
  - More content visible at once
  - Better for showing recommendations + editing area
  - Still fits on most screens (viewport height ~900-1000px)

- **Responsive:**
  - Desktop: 550-600px width, 700-800px max height
  - Tablet: 500px width, 600px max height
  - Mobile: Full width, 70vh height

---

## Final Decisions

### ✅ Decision 1: Editor Positioning Strategy

**Chosen: Draggable/Moveable Panel**

**Rationale:**
- User can position panel where they want it (right, left, or next to active question)
- More flexible than fixed positioning
- Can be positioned next to preview area without covering content
- User has control over their workspace
- Better for different screen sizes and preferences

**Implementation:**
- Draggable panel with drag handle in header
- Positioned next to preview area (not overlapping)
- Can be moved anywhere within workspace
- Snap to edges (right, left) for convenience
- Remembers position per user
- Default: Right side, 24px from edge

**Key Features:**
- Drag handle: Header bar (entire header is draggable)
- Boundaries: Cannot drag outside preview container area
- Snap zones: Auto-snap to right/left edges when close
- Position memory: Save position in localStorage

---

### ✅ Decision 2: Content Visibility & Layout

**Chosen: Draggable Overlay (Positioned Next to Preview)**

**Rationale:**
1. **Content Visibility:** Panel positioned next to preview, not covering it
   - Preview content fully visible
   - Panel can be moved to avoid covering important content
   - User controls what they see

2. **Flexibility:**
   - User can position panel where it's most useful
   - Can move it next to active question/section
   - Can move it out of the way when reading preview

3. **Content Protection:**
   - Preview shows watermark (free tier)
   - Panel doesn't block watermark visibility
   - User can see their work while editing

**Implementation:**
- Panel positioned next to preview area (not inside it)
- Draggable to any position
- Preview content always visible (panel doesn't cover it)
- Panel has backdrop blur to distinguish from preview
- On mobile: Panel takes full screen (preview hidden)

---

## Visual Layout Design: Draggable Panel (REVISED)

### New Approach: Draggable Panel Next to Preview

### Current State (Editor Overlays Preview)
```
┌─────────────────────────────────────────────────────────────┐
│                    Workspace Container                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Preview Container (full width)                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │                                                 │  │  │
│  │  │  Preview Content (scrollable)                  │  │  │
│  │  │  [WATERMARK: DRAFT]                             │  │  │
│  │  │                                                 │  │  │
│  │  │  Section 1: Executive Summary                    │  │  │
│  │  │  Section 2: Problem Statement                    │  │  │
│  │  │  Section 3: Solution                            │  │  │
│  │  │  ...                                             │  │  │
│  │  │                                                 │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐                                       │
│  │  Editor (450px)  │  ← Overlays preview (absolute)       │
│  │  ┌──────────────┐│                                       │
│  │  │ Section Title││                                       │
│  │  │ Questions... ││                                       │
│  │  │ Answer...    ││                                       │
│  │  └──────────────┘│                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```
**Problem:** Editor covers preview content, feels disconnected

---

### Proposed State: Draggable Panel (Decision 1.E + 2.B)

#### Desktop View - Panel on Right (Default Position)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Workspace Container                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Preview Container (full width, scrollable)                             │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Preview Header                                                   │ │ │
│  │  │  [Watermark] [Zoom]                                               │ │ │
│  │  ├──────────────────────────────────────────────────────────────────┤ │ │
│  │  │                                                                  │ │ │
│  │  │  Preview Content (fully visible, not covered)                  │ │ │
│  │  │  ┌────────────────────────────────────────────────────────────┐ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  Section 1: Executive Summary                              │ │ │ │
│  │  │  │  [WATERMARK: DRAFT]                                        │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  Section 2: Problem Statement                                │ │ │ │
│  │  │  │  [WATERMARK: DRAFT]                                        │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  Section 3: Solution ⭐ ACTIVE                              │ │ │ │
│  │  │  │  [WATERMARK: DRAFT]                                        │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  Question 1: Describe your product...                      │ │ │ │
│  │  │  │  [Highlighted - being edited]                              │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  Section 4: Market Analysis                                 │ │ │ │
│  │  │  │  [WATERMARK: DRAFT]                                        │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  │  ...                                                       │ │ │ │
│  │  │  │                                                            │ │ │ │
│  │  │  └────────────────────────────────────────────────────────────┘ │ │ │
│  │  │                                                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                    ┌──────────────────────────────┐                         │
│                    │  Editor Panel (600px)        │  ← Draggable            │
│                    │  [≡] Section: Solution [✕]  │  (drag handle in header) │
│                    ├──────────────────────────────┤                         │
│                    │  Q1 Q2 Q3 Q4 Q5             │                         │
│                    ├──────────────────────────────┤                         │
│                    │  💡 Suggestions:             │                         │
│                    │  • Development stage details  │  ← Click to add          │
│                    │  • Customer testimonials     │  (no buttons!)          │
│                    │  • Sustainability features   │                         │
│                    ├──────────────────────────────┤                         │
│                    │  ❓ Describe your product... │                         │
│                    │                              │                         │
│                    │  ┌────────────────────────┐ │                         │
│                    │  │ [Answer Editor]        │ │                         │
│                    │  │ Type your answer...     │ │                         │
│                    │  └────────────────────────┘ │                         │
│                    │  [✓ Complete] [Skip]        │                         │
│                    └──────────────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ✅ Preview: Full width, fully visible, not covered
- ✅ Panel: Draggable, positioned next to preview (not inside)
- ✅ Content: User can see all preview content
- ✅ Simple: No extra buttons, click suggestions to use

**Key Features:**
- ✅ Preview: ~60% width (flexible, min 400px)
- ✅ Editor: 600px fixed width on right
- ✅ Both scroll independently
- ✅ Editor sticky: stays visible while preview scrolls
- ✅ No overlap: preview content fully visible
- ✅ Watermark visible in preview (free tier)

#### Panel Positioned Next to Active Question (User Dragged It)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Workspace Container                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │  Preview Container (full width)                                       │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                                │ │ │
│  │  │  Section 1: Executive Summary                                  │ │ │
│  │  │  [WATERMARK: DRAFT]                                            │ │ │
│  │  │                                                                │ │ │
│  │  │  Section 2: Problem Statement                                  │ │ │
│  │  │  [WATERMARK: DRAFT]                                            │ │ │
│  │  │                                                                │ │ │
│  │  │  Section 3: Solution ⭐ ACTIVE                                  │ │ │
│  │  │  [WATERMARK: DRAFT]                                            │ │ │
│  │  │                                                                │ │ │
│  │  │  ┌──────────────────────┐                                     │ │ │
│  │  │  │  Editor Panel        │  ← User dragged it here            │ │ │
│  │  │  │  [≡] Solution [✕]    │     (next to active question)      │ │ │
│  │  │  │  Q1 Q2 Q3 Q4 Q5       │                                     │ │ │
│  │  │  │  💡 Suggestions:      │                                     │ │ │
│  │  │  │  • Development stage  │                                     │ │ │
│  │  │  │  • Customer testimonials│                                   │ │ │
│  │  │  │  ❓ Describe your...   │                                     │ │ │
│  │  │  │  [Answer Editor]      │                                     │ │ │
│  │  │  │  [✓ Complete] [Skip]  │                                     │ │ │
│  │  │  └──────────────────────┘                                     │ │ │
│  │  │                                                                │ │ │
│  │  │  Question 1: Describe your product...                          │ │ │
│  │  │  [Highlighted - being edited]                                  │ │ │
│  │  │                                                                │ │ │
│  │  │  Section 4: Market Analysis                                     │ │ │
│  │  │  [WATERMARK: DRAFT]                                            │ │ │
│  │  │                                                                │ │ │
│  │  │  ...                                                           │ │ │
│  │  │                                                                │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**User can drag panel anywhere:**
- ✅ Next to active question (as shown above)
- ✅ Right side (default)
- ✅ Left side
- ✅ Anywhere they prefer

#### Simplified UI - What Users Actually See
```
┌──────────────────────────────────────────────┐
│  Editor Panel (SIMPLIFIED - No Extra Buttons)│
│  ┌──────────────────────────────────────────┐ │
│  │ [≡] Solution                    [✕]     │ │  ← Drag handle
│  ├──────────────────────────────────────────┤ │
│  │  Q1 Q2 Q3 Q4 Q5                         │ │  ← Question nav
│  ├──────────────────────────────────────────┤ │
│  │  💡 Suggestions:                         │ │
│  │  • Development stage details            │ │  ← Click to add
│  │  • Customer testimonials                │ │     (no buttons!)
│  │  • Sustainability features               │ │
│  ├──────────────────────────────────────────┤ │
│  │  ❓ Describe your product...             │ │
│  │                                          │ │
│  │  ┌────────────────────────────────────┐ │ │
│  │  │ Type your answer...                 │ │ │  ← Single input
│  │  │                                      │ │ │     (no mode toggle)
│  │  │                                      │ │ │
│  │  └────────────────────────────────────┘ │ │
│  │  [✓ Complete] [Skip]                      │ │  ← Only 2 buttons
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Simplified Design:**
- ✅ No "Add to answer" buttons - just click suggestion
- ✅ No mode toggle - single input works for both
- ✅ No "Quick Actions" section - hidden by default
- ✅ No instructions text - interface is self-explanatory
- ✅ Only 2 buttons: Complete and Skip

#### Content Visibility - Will Users See Their Content?
```
┌─────────────────────────────────────────────────────────────┐
│                    Workspace Container                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Preview Container (full width, scrollable)          │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │                                                 │ │  │
│  │  │  ✅ ALL CONTENT VISIBLE                         │ │  │
│  │  │                                                 │ │  │
│  │  │  Section 1: Executive Summary                   │ │  │
│  │  │  [WATERMARK: DRAFT]                             │ │  │
│  │  │  ✅ Fully visible, not covered                   │ │  │
│  │  │                                                 │ │  │
│  │  │  Section 2: Problem Statement                    │ │  │
│  │  │  [WATERMARK: DRAFT]                             │ │  │
│  │  │  ✅ Fully visible, not covered                   │ │  │
│  │  │                                                 │ │  │
│  │  │  Section 3: Solution                             │ │  │
│  │  │  [WATERMARK: DRAFT]                             │ │  │
│  │  │  ✅ Fully visible, not covered                   │ │  │
│  │  │                                                 │ │  │
│  │  │  ...                                           │ │  │
│  │  │  ✅ All sections visible                         │ │  │
│  │  │                                                 │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│                    ┌──────────────────┐                     │
│                    │  Editor Panel    │  ← Positioned NEXT   │
│                    │  (600px)         │     TO preview,      │
│                    │  [Draggable]     │     NOT covering it  │
│                    └──────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Content Visibility:**
- ✅ **YES - Users see ALL their content**
- ✅ Panel positioned NEXT TO preview (not inside/over it)
- ✅ Preview scrolls independently
- ✅ Panel can be moved out of the way
- ✅ No content is hidden or covered
- ✅ Watermark always visible in preview

---

### Layout Implementation Details

#### CSS Structure (Draggable Panel)
```css
.workspace-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.preview-container {
  width: 100%;
  height: 100vh;
  overflow-y: auto;      /* Independent scrolling */
  position: relative;
}

.editor-panel {
  width: 600px;
  max-height: 800px;
  position: absolute;     /* Absolute for dragging */
  top: 24px;
  right: 24px;            /* Default position */
  z-index: 1000;
  cursor: move;           /* Show draggable cursor */
  user-select: none;     /* Prevent text selection while dragging */
}

.editor-panel-header {
  cursor: grab;           /* Grab cursor on header */
  user-select: none;
}

.editor-panel-header:active {
  cursor: grabbing;       /* Grabbing cursor while dragging */
}

/* Snap zones */
.editor-panel.snap-right {
  right: 24px;
  left: auto;
}

.editor-panel.snap-left {
  left: 24px;
  right: auto;
}

/* Boundaries - prevent dragging outside */
.editor-panel {
  /* Constrain to preview container bounds */
  max-left: 0;
  max-right: calc(100% - 600px);
  max-top: 0;
  max-bottom: calc(100% - 800px);
}

@media (max-width: 768px) {
  .editor-panel {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }
  
  .preview-container {
    display: none;        /* Hide preview on mobile */
  }
}
```

#### Drag Implementation
```typescript
// Drag handler
const handleDragStart = (e: MouseEvent) => {
  // Only drag from header
  if (e.target !== headerRef.current) return;
  
  setIsDragging(true);
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = panelRef.current.offsetLeft;
  const startTop = panelRef.current.offsetTop;
  
  const handleDrag = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Update position
    setPosition({
      left: startLeft + deltaX,
      top: startTop + deltaY
    });
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    // Check snap zones
    checkSnapZones();
    // Save position to localStorage
    savePosition();
  };
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', handleDragEnd);
};
```

#### Key Behaviors

1. **Draggable Positioning:**
   - Panel uses `position: absolute` for dragging
   - User can drag panel anywhere within workspace
   - Default position: Right side, 24px from edge
   - Snap zones: Auto-snap to right/left edges when close
   - Position saved to localStorage

2. **Content Visibility:**
   - Preview: Full width, fully visible, not covered
   - Panel: Positioned NEXT TO preview (not inside/over it)
   - User can move panel to avoid covering important content
   - All preview content always visible

3. **Independent Scrolling:**
   - Preview scrolls: user reads through document
   - Panel scrolls: user navigates through questions/recommendations
   - Both scroll independently
   - Panel position doesn't change when preview scrolls

4. **Responsive Behavior:**
   - Desktop: Draggable panel next to preview
   - Tablet: Panel can still be dragged, but smaller
   - Mobile: Panel full screen, preview hidden

---

### How It Looks: Visual Comparison

**Before (Current - Editor Overlays):**
- Preview: Full width, but editor covers right side
- Editor: 450px, positioned absolutely, covers content
- Problem: Can't see full preview, feels disconnected

**After (Proposed - Side-by-Side):**
- Preview: ~60% width, fully visible, scrollable
- Editor: 600px, fixed right, sticky, scrollable
- Benefit: Both fully visible, no overlap, better context

---

### Content Protection Strategy

**Free Tier:**
```
Preview Container:
┌────────────────────────────────────┐
│  [Large "DRAFT" watermark overlay] │
│                                     │
│  Section 1: Executive Summary      │
│  [Content visible but watermarked]  │
│                                     │
│  Section 2: Problem Statement      │
│  [Content visible but watermarked] │
│                                     │
└────────────────────────────────────┘
```

**Premium Tier:**
```
Preview Container:
┌────────────────────────────────────┐
│  [No watermark]                    │
│                                     │
│  Section 1: Executive Summary      │
│  [Clean content, export enabled]    │
│                                     │
│  Section 2: Problem Statement      │
│  [Clean content, export enabled]   │
│                                     │
└────────────────────────────────────┘
```

**Payment Trigger:**
- Free: Preview always shows watermark
- Premium: Watermark removed + export/copy enabled
- Editor works the same for both tiers

---

### Decision 3: Unified Editing Implementation

**Question:** How should answer editing and AI assistance be unified?

**Sub-question 3a: Rich Text Editor**
- **A. Use Rich Text Editor (TipTap/Slate/Quill)**
  - Full rich text editing capabilities
  - Formatting, lists, tables, etc.
  - ✅ Pros: Professional editing experience, supports complex content
  - ❌ Cons: More complex implementation, larger bundle size

- **B. Enhanced Textarea with Markdown**
  - Keep textarea but add markdown support
  - Preview markdown as formatted text
  - ✅ Pros: Simpler, lighter weight
  - ❌ Cons: Less intuitive, requires markdown knowledge

- **C. Keep Simple Textarea (for now)**
  - Current textarea, improve integration only
  - Add rich text later if needed
  - ✅ Pros: Fastest to implement
  - ❌ Cons: Limited editing capabilities

**Decision needed:** Choose one option (A, B, or C)

---

### ✅ RECOMMENDATION: Decision 3a

**Chosen Option: B - Enhanced Textarea with Markdown**

**Rationale:**
1. **Balance:** Rich text editor (Option A) is overkill for business plan content
   - Most content is paragraphs, lists, maybe tables
   - Full WYSIWYG editor adds complexity and bundle size
   - Markdown covers 90% of use cases

2. **Implementation Speed:** 
   - Can implement faster than full rich text editor
   - Can upgrade to rich text later if needed
   - Markdown is familiar to many users

3. **AI Integration:**
   - Markdown is easier for AI to generate
   - Can show markdown preview side-by-side
   - Simpler to integrate AI suggestions

**Implementation:**
- Enhanced textarea with markdown syntax highlighting
- Live preview of formatted text (toggle view)
- Support: **bold**, *italic*, lists, links, tables
- Can upgrade to TipTap later if needed

**AI Suggestions Display: Inline Next to Question**

---

### ✅ REVISED RECOMMENDATION: Decision 3b - SIMPLIFIED UI

**Chosen Option: B - Side Panel/Section (SIMPLIFIED)**

**Rationale:**
1. **Reduce Complexity:** Too many buttons/instructions confuse users
   - Current: Multiple buttons, instructions, modes
   - Simplified: Clean, minimal interface
   - Focus on content, not controls

2. **Simplified Recommendations:**
   - Show as **simple text suggestions** (not cards with buttons)
   - Click anywhere on suggestion to add it
   - No "Add to answer" buttons - just click to use
   - Auto-dismiss after use

3. **Less is More:**
   - Remove unnecessary buttons
   - Remove mode toggles
   - Remove instructions text
   - Let the interface be self-explanatory

**Implementation:**
- Recommendations shown as simple list items
- Click suggestion = adds to answer (no button needed)
- Hover shows subtle highlight
- Auto-dismiss after adding
- Max 3-4 recommendations (not 5)
- No "Add" buttons, no "Dismiss" buttons - just click

---

## Inline Suggestions Integration - Next to Question

### Current Problem: Suggestions Separate from Question

**Current Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Solution                  [✕]   │
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │
├─────────────────────────────────────┤
│  ❓ Describe your product...         │  ← Question here
├─────────────────────────────────────┤
│  💡 Suggestions:                    │  ← Suggestions separate
│  • Development stage details        │
│  • Customer testimonials            │
│  • Sustainability features          │
├─────────────────────────────────────┤
│  [Answer Editor]                    │
└─────────────────────────────────────┘
```

**Problem:** Question and suggestions are disconnected

---

### Proposed: Inline Suggestions Next to Question

**New Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Solution                  [✕]   │
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │
├─────────────────────────────────────┤
│  ❓ Describe your product...         │
│                                      │
│  💡 Suggestions:                    │  ← Suggestions right here
│  • Development stage details        │     (next to question)
│  • Customer testimonials            │
│  • Sustainability features          │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [Answer Editor]               │ │  ← Answer below
│  └───────────────────────────────┘ │
│  [✓ Complete] [Skip]                │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Suggestions contextually placed next to question
- ✅ User sees question → suggestions → answer (logical flow)
- ✅ More integrated feel

---

### Enhanced: Show Full Question Option

**What's Missing:** User might want to see the full detailed question (not just simplified)

**Solution: Expandable Question View**

```
┌─────────────────────────────────────┐
│ [≡] Solution                  [✕]   │
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │
├─────────────────────────────────────┤
│  ❓ Describe your product...         │  ← Simplified (default)
│  [Show full question ▼]            │  ← Expand button
│                                      │
│  💡 Suggestions:                    │
│  • Development stage details        │
│  • Customer testimonials            │
│  • Sustainability features          │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [Answer Editor]               │ │
│  └───────────────────────────────┘ │
│  [✓ Complete] [Skip]                │
└─────────────────────────────────────┘
```

**When Expanded:**
```
┌─────────────────────────────────────┐
│  ❓ Describe your product...         │
│  [Hide full question ▲]             │  ← Collapse button
│                                      │
│  Full question:                     │
│  "Beschreiben Sie detailliert Ihr   │
│   Produkt- / Dienstleistungsangebot.│
│   Wie ist der aktuelle              │
│   Entwicklungsstand? Liegt bereits  │
│   ein Prototyp oder Proof of        │
│   Concept vor?..."                  │  ← Full template question
│                                      │
│  💡 Suggestions:                    │
│  • Development stage details        │
│  • Customer testimonials            │
│  • Sustainability features          │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [Answer Editor]               │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Implementation:**
- Default: Show simplified question
- Button: "Show full question" / "Hide full question"
- When expanded: Show full template question text
- User can answer themselves with full context

---

## Simplified UI Design - What Users Actually See

### Current Problem: Too Many Buttons/Instructions

**Current UI (Confusing):**
```
┌─────────────────────────────────────┐
│ Section: Solution            [✕]    │
├─────────────────────────────────────┤
│ Q1 Q2 Q3 Q4 Q5                      │
├─────────────────────────────────────┤
│ 💡 Recommendations:                 │
│ ┌─────────────────────────────────┐ │
│ │ Add: Development stage details  │ │
│ │ [Add to answer] [Dismiss]      │ │  ← Too many buttons!
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Add: Customer testimonials     │ │
│ │ [Add to answer] [Dismiss]      │ │  ← Too many buttons!
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ❓ Question: "Describe your..."     │
│                                      │
│ [Answer Editor]                      │
│                                      │
│ [Edit Mode] [AI Mode]                │  ← Mode toggle confusing
│ [Submit Answer] [Ask AI]             │  ← Too many buttons!
├─────────────────────────────────────┤
│ [▼ Quick Actions]                   │  ← Extra section
│ [Create Table] [Create KPI] [Image]│  ← Too many buttons!
├─────────────────────────────────────┤
│ [✓ Complete] [Skip] [Mark Unknown]  │  ← Too many buttons!
└─────────────────────────────────────┘
```

**Problems:**
- ❌ Too many buttons (Add, Dismiss, Edit, AI, Submit, Ask, Create, etc.)
- ❌ Mode toggles (Edit Mode vs AI Mode)
- ❌ Instructions text ("Press Ctrl+Enter to submit")
- ❌ Multiple sections (Recommendations, Quick Actions, etc.)
- ❌ Confusing - user doesn't know what to click

---

### Simplified UI (Clean & Clear)

**Simplified UI (Recommended):**
```
┌─────────────────────────────────────┐
│ [≡] Solution                  [✕]   │  ← Drag handle, close button
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │  ← Question navigation
├─────────────────────────────────────┤
│  💡 Suggestions:                    │
│  • Development stage details        │  ← Click to add (no button!)
│  • Customer testimonials            │  ← Click to add (no button!)
│  • Sustainability features          │  ← Click to add (no button!)
├─────────────────────────────────────┤
│  ❓ Describe your product...         │  ← Simplified question
│  [Show full question ▼]            │  ← Expand for full question
│                                     │
│  💡 Suggestions:                    │  ← Inline (next to question)
│  • Development stage details        │     Click to add
│  • Customer testimonials            │
│  • Sustainability features          │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Type your answer...            │ │  ← Single input
│  │ or ask AI to improve...        │ │     (works for both)
│  │                                │ │
│  └───────────────────────────────┘ │
│                                     │
│  [✓ Complete] [Skip]                │  ← Only 2 buttons
└─────────────────────────────────────┘
```

**Improvements:**
- ✅ **Suggestions inline** - next to question (not separate section)
- ✅ **Full question view** - expandable to see full template question
- ✅ **No "Add" buttons** - just click suggestion
- ✅ **No mode toggle** - single input works for both editing and AI
- ✅ **No instructions** - interface is self-explanatory
- ✅ **No "Quick Actions"** - hidden by default (only show when AI suggests)
- ✅ **Only 2 buttons** - Complete and Skip
- ✅ **Clean and simple** - focus on content, not controls

---

### Simplified Recommendations Display

**Before (Cards with Buttons):**
```
┌─────────────────────────────────┐
│ 💡 Recommendations:             │
│ ┌─────────────────────────────┐ │
│ │ Add: Development stage     │ │
│ │ [Add to answer] [Dismiss] │ │  ← 2 buttons per card
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Add: Customer testimonials  │ │
│ │ [Add to answer] [Dismiss] │ │  ← 2 buttons per card
│ └─────────────────────────────┘ │
```

**After (Simple List - Click to Use):**
```
💡 Suggestions:
• Development stage details        ← Click anywhere = adds to answer
• Customer testimonials            ← Click anywhere = adds to answer
• Sustainability features         ← Click anywhere = adds to answer
```

**Implementation:**
```tsx
// Simple list item - click to add
<div 
  className="suggestion-item"
  onClick={() => addToAnswer(suggestion)}
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  • {suggestion.text}
</div>

// No buttons needed!
```

---

### Simplified Input (No Mode Toggle)

**Before (Confusing):**
```
[Edit Mode] [AI Mode]              ← Mode toggle
┌─────────────────────────────┐
│ Type your answer...          │
└─────────────────────────────┘
[Submit Answer] [Ask AI]         ← Two buttons
```

**After (Simple):**
```
┌─────────────────────────────┐
│ Type your answer...          │  ← Single input
│ or ask AI to improve...      │     (works for both)
└─────────────────────────────┘
[Send]                          ← Single button
```

**Implementation:**
- Single textarea/input
- Auto-detect intent: if starts with "?", "how", "help" = AI question
- Or: Single button that says "Send" (works for both)
- No mode toggle needed

---

### What to Remove

**Remove These:**
- ❌ "Add to answer" buttons on suggestions
- ❌ "Dismiss" buttons on suggestions
- ❌ Mode toggle (Edit Mode / AI Mode)
- ❌ "Submit Answer" vs "Ask AI" buttons
- ❌ "Quick Actions" section (unless AI suggests)
- ❌ Instructions text ("Press Ctrl+Enter...")
- ❌ "Mark Unknown" button (use Skip instead)
- ❌ Multiple action buttons

**Keep Only:**
- ✅ Question navigation (Q1 Q2 Q3...)
- ✅ Simple suggestion list (click to use)
- ✅ Single input field
- ✅ Single "Send" button
- ✅ Complete and Skip buttons

---

### Final Simplified Panel Structure

```
┌─────────────────────────────────────┐
│ [≡] Section Title            [✕]   │  ← Header (draggable)
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │  ← Navigation
├─────────────────────────────────────┤
│  💡 Suggestions:                    │
│  • Suggestion 1                     │  ← Click to add
│  • Suggestion 2                     │  ← Click to add
│  • Suggestion 3                     │  ← Click to add
├─────────────────────────────────────┤
│  ❓ Question text...                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Answer input]                │ │  ← Single input
│  └───────────────────────────────┘ │
│                                     │
│  [✓ Complete] [Skip]                │  ← Only 2 buttons
└─────────────────────────────────────┘
```

**Total Buttons:** 3 (Close, Complete, Skip)  
**Total Instructions:** 0  
**Total Modes:** 0  
**Result:** Clean, simple, self-explanatory

**Input Unification: Single Unified Input**

---

### ✅ RECOMMENDATION: Decision 3c

**Chosen Option: A - Truly Unified (Single Input)**

**Rationale:**
1. **User Confusion:** Current dual-mode (textarea vs chat) is confusing
   - Same task, different UIs
   - Users don't understand when to use which
   - Unified input solves this

2. **Better UX:**
   - Single input that handles both:
     - Direct editing (type answer)
     - AI questions (ask for help)
   - Mode indicator: "Type your answer" vs "Ask AI to improve..."
   - Toggle button or automatic detection

3. **Implementation:**
   - Single textarea/input
   - Button changes based on context:
     - "Submit Answer" when typing answer
     - "Ask AI" when asking question
   - Can detect intent: if starts with "?", "how", "help", etc. = AI question
   - Or explicit toggle: "Edit" vs "Ask AI" mode

**Implementation:**
- Single input area (enhanced textarea with markdown)
- Mode toggle: "Edit Answer" / "Ask AI" (or auto-detect)
- Button text changes based on mode
- Clear visual indicator of current mode

---

### ✅ Decision 4: Action Buttons Visibility

**Chosen: Simplified - Remove Most Buttons**

---

### ✅ RECOMMENDATION: Decision 4

**Chosen Option: C - Toggle/Expandable Section**

**Rationale:**
1. **Balance:** Best of both worlds
   - Always accessible (not hidden)
   - Doesn't clutter interface (collapsed by default)
   - User can expand when needed

2. **Context-Aware:**
   - Can auto-expand when AI suggests an action
   - Collapsed by default keeps interface clean
   - User control: expand when they want to use actions

3. **Discoverability:**
   - Visible button/section = users know it exists
   - Not always in the way = clean interface
   - Better than hidden (Option A) or always visible (Option B)

**Implementation:**
- Collapsible section: "Create Content" or "Quick Actions"
- Default: Collapsed
- Auto-expand: When AI suggests an action
- Contains: Create Table, Create KPI, Upload Image, etc.
- Icon indicator when collapsed: Shows count of available actions

---

## Reference Documentation

**Main Documentation:**
- `docs/INLINE-EDITOR-DEEP-ANALYSIS.md` — Deep analysis and recommendations
- `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md` — Design recommendations

**Obsolete Files (deleted or no longer relevant):**
- ~~`docs/HANDOVER-VISIBILITY-DEBUG.md`~~ — Deleted (visibility issue resolved)
- ~~`docs/HANDOVER-PHASE-1-2-REVIEW.md`~~ — Obsolete (Phase 2 complete, see this document)

---

## Complete Panel Design: All Section Types

### Section Types Overview

The editor panel adapts to different section types:

1. **Title Page (METADATA_SECTION_ID)** - Form-based editing
2. **Table of Contents (ANCILLARY_SECTION_ID)** - Lists management  
3. **Content Sections** - Questions with answers
4. **References (REFERENCES_SECTION_ID)** - Reference list
5. **Appendices (APPENDICES_SECTION_ID)** - Appendix items

---

### 1. Title Page Section

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Title Page                [✕]   │  ← Draggable header
├─────────────────────────────────────┤
│  📋 Form Fields:                     │
│                                      │
│  Plan Title:                         │
│  ┌───────────────────────────────┐ │
│  │ [Text input]                   │ │
│  └───────────────────────────────┘ │
│                                      │
│  Company Name:                       │
│  ┌───────────────────────────────┐ │
│  │ [Text input]                  │ │
│  └───────────────────────────────┘ │
│                                      │
│  Logo:                               │
│  [📎 Drop logo here or click]        │  ← Drag & drop
│                                      │
│  Contact Info:                       │
│  Email: [input]                      │
│  Phone: [input]                      │
│  Website: [input]                    │
│                                      │
│  💡 Suggestions:                    │  ← Context-aware
│  • Add confidentiality statement    │     (title page design)
│  • Include legal form                │
│  • Format title page professionally │
│                                      │
│  [✓ Complete]                        │
└─────────────────────────────────────┘
```

**Key Features:**
- Form-based (not questions)
- Drag & drop for logo
- Context-aware suggestions for design
- No question navigation

---

### 2. Table of Contents Section

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Table of Contents         [✕]   │
├─────────────────────────────────────┤
│  📋 Lists Management:               │
│                                      │
│  Table of Contents:                  │
│  ┌───────────────────────────────┐ │
│  │ ✅ Section 1 (page 1)        │ │
│  │ ✅ Section 2 (page 3)        │ │
│  │ ⚠️ Section 3 (needs update)   │ │
│  │ ✅ Section 4 (page 5)        │ │
│  └───────────────────────────────┘ │
│  [Update page numbers]               │
│                                      │
│  List of Tables:                     │
│  ┌───────────────────────────────┐ │
│  │ Table 1: Revenue (page 5)    │ │
│  │ Table 2: Costs (page 6)       │ │
│  └───────────────────────────────┘ │
│                                      │
│  List of Figures:                    │
│  ┌───────────────────────────────┐ │
│  │ Figure 1: Chart (page 7)      │ │
│  └───────────────────────────────┘ │
│                                      │
│  💡 Suggestions:                    │
│  • Update page numbers              │
│  • Add missing sections             │
│  • Improve TOC structure            │
│                                      │
│  [✓ Complete]                        │
└─────────────────────────────────────┘
```

**Key Features:**
- Auto-generated lists (TOC, tables, figures)
- Manual editing available
- Suggestions for structure
- No question navigation

---

### 3. Content Sections (Regular Questions)

**Panel Layout (SIMPLIFIED):**
```
┌─────────────────────────────────────┐
│ [≡] Solution                  [✕]   │
├─────────────────────────────────────┤
│  Q1 Q2 Q3 Q4 Q5                     │  ← Question navigation
├─────────────────────────────────────┤
│  ❓ Describe your product...         │  ← Simplified (default)
│  [Show full question ▼]            │  ← Expand for full question
│                                      │
│  💡 Suggestions:                    │  ← INLINE (next to question)
│  • Development stage details        │     Click to add
│  • Customer testimonials            │
│  • Sustainability features          │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ Type your answer...            │ │  ← Single input
│  │ or ask AI to improve...        │ │     (works for both)
│  │                                │ │
│  └───────────────────────────────┘ │
│                                      │
│  [✓ Complete] [Skip]                │  ← Only 2 buttons
└─────────────────────────────────────┘
```

**When "Show full question" is clicked:**
```
┌─────────────────────────────────────┐
│  ❓ Describe your product...         │
│  [Hide full question ▲]             │  ← Collapse
│                                      │
│  Full question:                     │
│  "Beschreiben Sie detailliert Ihr   │
│   Produkt- / Dienstleistungsangebot.│
│   Wie ist der aktuelle              │
│   Entwicklungsstand? Liegt bereits  │
│   ein Prototyp oder Proof of        │
│   Concept vor? Welche ersten        │
│   Kunden haben Sie bereits?..."      │  ← Full template question
│                                      │
│  💡 Suggestions:                    │
│  • Development stage details        │
│  • Customer testimonials            │
│  • Sustainability features          │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [Answer Editor]               │ │  ← User can answer
│  │                                │ │     themselves
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Key Features:**
- Question navigation (Q1 Q2 Q3...)
- Simplified question (default)
- **Expandable full question** - user can see full template question
- **Suggestions inline** - next to question (not separate)
- Single input (works for editing and AI)
- User can answer themselves with full context

---

### 4. References Section

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ [≡] References                [✕]   │
├─────────────────────────────────────┤
│  📚 Reference List:                  │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [1] Source Title              │ │
│  │     URL: https://example.com  │ │
│  │     [Edit] [Delete]           │ │
│  └───────────────────────────────┘ │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ [2] Another Source            │ │
│  │     URL: https://example.com  │ │
│  │     [Edit] [Delete]           │ │
│  └───────────────────────────────┘ │
│                                      │
│  [+ Add Reference]                   │
│                                      │
│  💡 Suggestions:                    │
│  • Add citation format             │
│  • Include publication date         │
│  • Use consistent citation style    │
│                                      │
│  [✓ Complete]                       │
└─────────────────────────────────────┘
```

**Key Features:**
- List of references
- Add/Edit/Delete references
- Suggestions for citation format
- No question navigation

---

### 5. Appendices Section

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ [≡] Appendices                [✕]   │
├─────────────────────────────────────┤
│  📎 Appendix Items:                 │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ Appendix A: Financial Data   │ │
│  │     [Table/Chart/File]       │ │
│  │     [Edit] [Delete]          │ │
│  └───────────────────────────────┘ │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ Appendix B: Market Research   │ │
│  │     [Table/Chart/File]        │ │
│  │     [Edit] [Delete]           │ │
│  └───────────────────────────────┘ │
│                                      │
│  [+ Add Appendix]                    │
│                                      │
│  💡 Suggestions:                    │
│  • Add supporting data tables       │
│  • Include detailed charts          │
│  • Attach relevant documents         │
│                                      │
│  [✓ Complete]                       │
└─────────────────────────────────────┘
```

**Key Features:**
- List of appendix items
- Add/Edit/Delete appendices
- Support for tables, charts, files
- Suggestions for content

---

## Payment Trigger & Content Visibility

### When Do Users Have to Pay?

**Recommended: Pay to Export**

**Free Tier:**
- ✅ Create unlimited plans
- ✅ Edit all content
- ✅ See preview (with prominent watermark)
- ✅ Use AI assistant
- ✅ See ALL content (no restrictions)
- ❌ Export PDF (requires premium)
- ❌ Copy content (requires premium)
- ❌ Remove watermark (requires premium)

**Payment Trigger:**
- User clicks "Export PDF" → Payment required
- User clicks "Copy" → Payment required
- User wants to remove watermark → Payment required

**Content Visibility:**
- ✅ Users see ALL their content (with watermark)
- ✅ No content hidden or restricted
- ✅ Full access to create and edit
- ✅ Watermark is prominent but doesn't block content

**Why This Works:**
- User sees full value (all content visible)
- Low barrier to entry (can use everything)
- Clear value proposition (pay to export/share)
- No frustration (content not hidden)

---

## How InlineSectionEditor Works & Behaves

### Component Lifecycle & Behavior

#### 1. Initialization & Rendering

**When Editor Appears:**
```
Sidebar Click → handleSectionSelect → setActiveSection → 
activeSectionId changes → useEffect → setEditingSectionId → 
effectiveEditingSectionId updates → InlineSectionEditor renders
```

**Render Condition:**
- Editor renders when `effectiveEditingSectionId` is truthy
- `effectiveEditingSectionId` = `editingSectionId` OR `activeSectionId` (fallback)
- Always shows for active section (universal panel for all sections)

**Code Location:** `Editor.tsx` lines 893-943

---

#### 2. Section Type Detection

**Special Sections:**
- `METADATA_SECTION_ID` = Title Page (form-based)
- `ANCILLARY_SECTION_ID` = Table of Contents (lists management)
- `REFERENCES_SECTION_ID` = References (reference list)
- `APPENDICES_SECTION_ID` = Appendices (appendix items)
- Regular sections = Content sections (questions with answers)

**Behavior:**
- Different UI for each section type
- Form-based for Title Page
- Lists management for TOC
- Questions for content sections

**Code Location:** `InlineSectionEditor.tsx` lines 179-183

---

#### 3. Position Calculation

**Current Implementation:**
- Uses `position: absolute` relative to `preview-container`
- Default: Right side, 24px from edge
- Width: 450px (to be increased to 600px)
- Max height: 600px (to be increased to 800px)

**Position Updates:**
- On mount
- On section change
- On window resize
- NOT on scroll (static position)

**Code Location:** `InlineSectionEditor.tsx` lines 188-228

---

#### 4. Question Navigation

**For Regular Sections:**
- Shows question navigation (Q1 Q2 Q3...)
- User can click to switch questions
- Active question highlighted
- First question auto-selected if none selected

**For Special Sections:**
- No question navigation (form-based or list-based)

**Code Location:** `InlineSectionEditor.tsx` lines 1062-1086

---

#### 5. AI Integration

**Proactive Suggestions:**
- Loaded automatically when section opens
- Only for regular sections (not special sections)
- Shown as simple list items
- Click to add to answer

**AI Chat:**
- Single input for both editing and AI questions
- Auto-detects intent (answer vs AI question)
- Conversation history maintained
- Context-aware responses

**Code Location:** `InlineSectionEditor.tsx` lines 156-164, 713-980

---

### Behavior When Product Type Changes

**Current Behavior:**
- When product type changes (strategy/review/submission):
  1. Plan is rehydrated with new product type
  2. Sections may change (different templates)
  3. `activeSectionId` may reset
  4. Editor closes if section no longer exists
  5. Editor reopens for new active section

**What Should Happen:**
- Editor should smoothly transition to new section
- If current section exists in new product, keep it active
- If not, switch to first available section
- Preserve user's position/scroll state if possible

**Code Location:** `Editor.tsx` lines 392-424 (useEffect for section changes)

---

### Behavior When Additional Documents Added

**Current Behavior:**
- Additional documents are separate from main plan
- Editor only handles main plan sections
- Additional documents have their own editing interface (if any)

**What Should Happen:**
- Editor should remain open for main plan
- Additional documents editing should not affect main editor
- If user switches to additional document editing, main editor may close
- When returning to main plan, editor should reopen for active section

**Code Location:** Additional documents handled separately, not in InlineSectionEditor

---

### Sidebar Integration Flow

**Complete Flow (from SIDEBAR-SECTION-CHANGE-FLOW.md):**

```
1. User clicks section in Sidebar
   ↓
2. Sidebar.handleClick(sectionId) [Sidebar.tsx:363]
   ↓
3. onSelectSection(sectionId) [Sidebar.tsx:367]
   ↓
4. Editor.handleSectionSelect(sectionId, 'user') [Editor.tsx:819]
   ↓
5. setActiveSection(sectionId) [Editor.tsx:389]
   ↓
6. activeSectionId changes [useEditorStore]
   ↓
7. useEffect triggers [Editor.tsx:393]
   ↓
8. setEditingSectionId(activeSectionId) [Editor.tsx:414]
   ↓
9. effectiveEditingSectionId updates [Editor.tsx:335]
   ↓
10. InlineSectionEditor renders [Editor.tsx:893]
    ↓
11. InlineSectionEditor.calculatePosition() [InlineSectionEditor.tsx:189]
    ↓
12. Editor appears on right side
```

**Key Points:**
- Sidebar click → Editor automatically opens
- Editor always shows for active section
- Position recalculated on section change
- Question navigation updates for new section

---

### State Management

**Editor State:**
- `sectionId`: Current section being edited
- `activeQuestionId`: Current question (for regular sections)
- `position`: Editor position (top, left, visible)
- `aiMessages`: Conversation history
- `proactiveSuggestions`: AI suggestions
- `isAiLoading`: Loading state

**Store State:**
- `activeSectionId`: Currently active section (from sidebar)
- `editingSectionId`: Section being edited (may differ from active)
- `activeQuestionId`: Currently active question
- `plan`: Full plan data

**Synchronization:**
- Editor receives `sectionId` from `effectiveEditingSectionId`
- Editor receives `activeQuestionId` from store
- Editor updates store via callbacks (`onAnswerChange`, etc.)

---

### Event Handlers

**User Interactions:**
- `onClose()`: Closes editor (sets `editingSectionId` to null)
- `onSelectQuestion()`: Switches active question
- `onAnswerChange()`: Updates answer in store
- `onMarkComplete()`: Marks question as complete
- `onToggleUnknown()`: Marks question as unknown

**Special Section Handlers:**
- `onTitlePageChange()`: Updates title page
- `onAncillaryChange()`: Updates TOC/lists
- `onReferenceAdd/Update/Delete()`: Manages references
- `onAppendixAdd/Update/Delete()`: Manages appendices

**Code Location:** `InlineSectionEditor.tsx` lines 21-49 (props)

---

## Next Steps

✅ **Decisions Made** - All decisions finalized and documented above.

**Implementation Priority:**

1. **Phase 1: Panel Size & Positioning** (High Priority)
   - Increase panel width to 550-600px
   - Increase max height to 700-800px
   - Implement sticky positioning relative to preview container
   - Test responsive behavior (tablet/mobile)

2. **Phase 2: Layout & Content Protection** (High Priority)
   - Implement side-by-side layout (preview + editor)
   - Ensure watermark shows for free users in preview
   - Independent scrolling for preview and editor
   - Test content protection strategy

3. **Phase 3: Unified Editing Interface** (Medium Priority)
   - Replace dual inputs with single unified input
   - Add mode toggle ("Edit Answer" / "Ask AI")
   - Implement enhanced textarea with markdown support
   - Add markdown syntax highlighting

4. **Phase 4: Recommendations Display** (Medium Priority)
   - Convert proactive suggestions to actionable cards
   - Add "Add to answer" buttons to recommendations
   - Improve recommendation generation (context-aware)
   - Auto-update recommendations when question/answer changes

5. **Phase 5: Action Buttons** (Low Priority)
   - Implement collapsible "Quick Actions" section
   - Add auto-expand when AI suggests action
   - Test discoverability and usability

6. **Testing:**
   - Test with template questions (complex prompts)
   - Test content protection (watermark visibility)
   - Test responsive design (mobile/tablet)
   - Test user flow (free tier → premium upgrade)

---

## Summary

The current separated design (textarea + chat) doesn't match the recommended unified approach. The panel should feel like a single, integrated editing experience, not two separate tools.

**Current state:**
- ✅ Editor visible and functional
- ⚠️ Positioning feels disconnected from content
- ⚠️ Dual-mode input (textarea vs chat) is confusing
- ⚠️ Missing unified editing experience

**Target state:**
- ✅ Editor positioned close to content
- ✅ Single unified editing interface
- ✅ Rich text capabilities
- ✅ Inline AI assistance
- ✅ Contextual action buttons

---

**Handover Completed:** ✅  
**Status:** 🟢 **READY FOR PHASE 3**  
**Ready for Implementation:** ✅ **YES - ALL BLOCKERS RESOLVED**

---

## ✅ Recent Fixes (Overflow Issues Resolved)

**Fixed in latest session:**
- ✅ Parent container overflow (Editor.tsx line 781) - changed from `overflow-hidden` to `overflowX: 'hidden', overflowY: 'visible'`
- ✅ Grid height calculation - unified to use flexbox with proper constraints
- ✅ Row 1 height constraint - capped at 200px max to prevent collision with row 2
- ✅ Editor container height - increased from `calc(100vh - 120px)` to `calc(100vh - 60px)` for better space allocation
- ✅ CurrentSelection component - made scrollable when content exceeds max height

**Result:** Both "Aktuelle Auswahl"/"Deine Dokumente" (top) and Sidebar/Preview (bottom) are now visible without overflow or collision.

---

## Quick Decision Checklist

✅ **DECISIONS MADE** (see recommendations above):

- [x] **Decision 1:** Editor positioning strategy → **E - Draggable/Moveable Panel** (REVISED)
- [x] **Decision 2:** Content visibility & layout → **B - Draggable Overlay (Next to Preview)** (REVISED)
- [x] **Decision 3a:** Rich text editor approach → **B - Enhanced Textarea with Markdown**
- [x] **Decision 3b:** AI suggestions display → **B - Side Panel/Section (SIMPLIFIED)** (REVISED)
- [x] **Decision 3c:** Input unification → **A - Truly Unified (Single Input)**
- [x] **Decision 4:** Action buttons visibility → **SIMPLIFIED - Remove most buttons** (REVISED)

## Implementation Summary (REVISED)

Based on the revised decisions above, here's what needs to be implemented:

### 1. Draggable Panel ✅ **COMPLETE**
- **Width:** 480px (optimized for center-bottom)
- **Max Height:** 420px (compact, balanced)
- **Positioning:** Fixed, draggable anywhere
- **Default:** Center-bottom of viewport
- **Drag handle:** Entire header is draggable ✅
- **Position memory:** Save to localStorage ✅
- **Portal rendering:** Rendered to `document.body` to escape containment ✅

### 2. Content Visibility
- **Preview:** Full width, fully visible, not covered
- **Panel:** Positioned NEXT TO preview (not inside/over it)
- **Watermark:** Always visible in preview (free tier)
- **Independent scrolling:** Preview and panel scroll separately

### 3. Simplified UI
- **Recommendations:** Simple list items (no buttons)
  - Click anywhere on suggestion = adds to answer
  - Hover shows highlight
  - Auto-dismiss after use
  - Max 3-4 recommendations
  
- **Input:** Single textarea (no mode toggle)
  - Works for both editing and AI questions
  - Auto-detect intent or single "Send" button
  - No "Edit Mode" / "AI Mode" toggle
  
- **Buttons:** Only 3 buttons total
  - Close (in header)
  - Complete
  - Skip
  
- **Remove:**
  - ❌ "Add to answer" buttons
  - ❌ "Dismiss" buttons
  - ❌ Mode toggles
  - ❌ "Quick Actions" section (unless AI suggests)
  - ❌ Instructions text
  - ❌ Multiple action buttons

### 4. Recommendations Display (Simplified)
- **Format:** Simple bullet list (not cards)
- **Interaction:** Click to add (no button needed)
- **Count:** 3-4 max (not 5)
- **Update:** Auto-update when question/answer changes

---

## Phase 3 Implementation Guide

### Current Dual-Input Problem

**Location:** `InlineSectionEditor.tsx` lines 1258-1396

**Current Behavior:**
- When no answer exists: Shows textarea for answer input
- When answer exists: Shows separate AI chat input
- Two different UIs for essentially the same task
- Confusing for users - "Where do I type?"

**Target Behavior:**
- Single unified input always visible
- Works for both editing answer and asking AI
- Auto-detects intent or uses single "Send" button
- No mode switching needed

### Implementation Steps

1. **Remove Dual-Mode Logic**
   - Remove `hasExistingAnswer` check that switches UI
   - Keep single textarea always visible
   - Update `handleChatSend` to handle both cases

2. **Enhanced Textarea**
   - Add markdown support (consider TipTap or similar)
   - Syntax highlighting for markdown
   - Better text editing capabilities

3. **Auto-Detect Intent**
   - If input looks like a question → treat as AI chat
   - If input looks like content → treat as answer
   - Or: Single "Send" button that works for both

### Code Changes Needed

**File:** `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`

**Lines to modify:**
- 1258-1396: Chat input area - unify the input
- 740-1030: `handleChatSend` function - simplify logic
- Remove conditional rendering based on `hasExistingAnswer`

---

## Phase 4 Implementation Guide

### Current Recommendations Display

**Location:** `InlineSectionEditor.tsx` lines 1223-1255

**Current Format:**
- Simple bullet list
- No interaction (just display)
- Max 5 recommendations

**Target Format:**
- Actionable cards (not just list)
- "Add to answer" buttons
- Click to add functionality
- Max 3-4 recommendations
- Auto-update when question/answer changes

### Implementation Steps

1. **Convert to Cards**
   - Change from `<ul>` to card components
   - Add hover effects
   - Better visual design

2. **Add Interaction**
   - "Add to answer" button on each card
   - Click card to add to answer
   - Auto-dismiss after use

3. **Improve Generation**
   - Context-aware suggestions
   - Based on current question, previous answers, template
   - Better quality recommendations

---

## Phase 5 Implementation Guide

### Current Action Buttons

**Location:** `InlineSectionEditor.tsx` lines 1186-1205

**Current Behavior:**
- Action buttons appear in AI messages when AI suggests them
- Always visible when AI suggests action

**Target Behavior:**
- Collapsible "Quick Actions" section
- Hidden by default
- Auto-expand when AI suggests action
- Better discoverability

### Implementation Steps

1. **Collapsible Section**
   - Add collapsible UI component
   - Hidden by default
   - Auto-expand when actions available

2. **Smart Display**
   - Only show when AI suggests actions
   - Better visual hierarchy
   - Test discoverability

---

## Testing Checklist

### Phase 2 Testing ✅
- [x] Panel visible and functional
- [x] Center-bottom positioning works
- [x] Draggable functionality works
- [x] Position persists in localStorage
- [x] Simplified UI displays correctly

### Phase 3 Testing ⏳
- [ ] Single unified input works for both editing and AI
- [ ] Auto-detect intent works correctly
- [ ] Markdown support functional
- [ ] No mode switching confusion
- [ ] User can edit answer and ask AI seamlessly

### Phase 4 Testing ⏳
- [ ] Recommendations display as cards
- [ ] "Add to answer" buttons work
- [ ] Recommendations auto-update
- [ ] Max 3-4 recommendations shown
- [ ] Context-aware suggestions work

### Phase 5 Testing ⏳
- [ ] Collapsible actions section works
- [ ] Auto-expand when AI suggests action
- [ ] Discoverability is good
- [ ] Actions are easy to find and use

---

## Files Reference

### Main Component
- **`features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`**
  - Lines 59-61: Size constants (480×420)
  - Lines 191-236: Position calculation (center-bottom)
  - Lines 324-380: Draggable functionality
  - Lines 1258-1396: Chat input area (Phase 3 target)
  - Lines 1223-1255: Recommendations display (Phase 4 target)
  - Lines 1186-1205: Action buttons (Phase 5 target)

### Parent Component
- **`features/editor/components/Editor.tsx`**
  - Lines 781: Parent container overflow fix (`overflowX: 'hidden', overflowY: 'visible'`)
  - Lines 811: Grid layout with row constraints (`grid-rows-[minmax(0,200px)_1fr]`)
  - Lines 813, 860: Row 1 cells with maxHeight constraints
  - Lines 925-980: InlineSectionEditor rendering

### Related Components
- **`features/editor/components/layout/Workspace/Navigation/CurrentSelection.tsx`**
  - Made scrollable when content exceeds max height
  - Height constraints to prevent overflow

### Related Documentation
- **`docs/INLINE-EDITOR-DEEP-ANALYSIS.md`**: Deep technical analysis and positioning options
- **`docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md`**: Design recommendations and prompt simplification

---

## 🚀 ACTION PLAN: What To Do Next

### Step 1: Read These Files First
**READ THIS:** `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`
- Lines 819-1082: `handleChatSend` function - understand current dual-mode logic
- Lines 1258-1396: Chat input area - this is what you need to unify
- Lines 1223-1255: Recommendations display - Phase 4 target
- Lines 1186-1205: Action buttons - Phase 5 target

**READ THIS:** `docs/INLINE-EDITOR-DEEP-ANALYSIS.md`
- Lines 496-565: Recommended unified layout design
- Understand the design vision before coding

**READ THIS:** `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md`
- Lines 39-178: Prompt simplification examples
- Lines 182-332: Design recommendations

### Step 2: Start Phase 3 - Unified Editing Interface

**WHAT TO DO:**
1. Open `InlineSectionEditor.tsx` line 1258-1396
2. Find the conditional that checks `hasExistingAnswer` - **DELETE IT**
3. Keep ONLY the single textarea/input (the one that's always visible)
4. Update `handleChatSend` (line 819) to handle both:
   - When user types answer → save as answer
   - When user asks question → treat as AI chat
5. Add markdown syntax highlighting (use a library or simple regex)
6. Test: Type answer, then ask AI question - both should work in same input

**CODE TO CHANGE:**
- `InlineSectionEditor.tsx` lines 1258-1396: Remove conditional, keep single input
- `InlineSectionEditor.tsx` lines 819-1082: Update `handleChatSend` logic
- See detailed guide: **Lines 1968-2011 in this document**

### Step 3: Then Phase 4 - Recommendations Display

**WHAT TO DO:**
1. Open `InlineSectionEditor.tsx` line 1223-1255
2. Change from simple `<ul>` list to clickable cards
3. Add `onClick` handler to each suggestion that adds it to answer
4. Limit to 3-4 suggestions max (currently 5)
5. Make suggestions auto-update when question/answer changes

**CODE TO CHANGE:**
- `InlineSectionEditor.tsx` lines 1223-1255: Convert list to cards with onClick
- `InlineSectionEditor.tsx` lines 549-610: `requestProactiveSuggestions` - limit to 3-4
- See detailed guide: **Lines 2014-2048 in this document**

### Step 4: Finally Phase 5 - Collapsible Actions

**WHAT TO DO:**
1. Open `InlineSectionEditor.tsx` line 1186-1205
2. Wrap action buttons in collapsible section (use `<details>` or custom component)
3. Hidden by default
4. Auto-expand when AI suggests actions (check `msg.metadata?.actions`)

**CODE TO CHANGE:**
- `InlineSectionEditor.tsx` lines 1186-1205: Add collapsible wrapper
- `InlineSectionEditor.tsx` lines 1294-1313: Auto-expand when actions exist
- See detailed guide: **Lines 2051-2078 in this document**

### Step 5: Test Everything

**TEST CHECKLIST:**
- [ ] Single input works for both answer and AI questions
- [ ] Markdown syntax highlighting works
- [ ] Recommendations are clickable and add to answer
- [ ] Action buttons are collapsible and auto-expand
- [ ] No console errors
- [ ] Panel still draggable and position persists

---

**Last Updated:** 2024  
**Phase 2 Status:** ✅ **COMPLETE** (including overflow fixes)  
**Next Phase:** ⏳ **Phase 3 - Unified Editing Interface**

---

## 📝 What's Left: Phases 3-5 Summary

### Phase 3: Unified Editing Interface ⏳ **PENDING**
**Goal:** Remove dual input modes, add markdown support

**What needs to be done:**
- Remove `hasExistingAnswer` check that switches between textarea and chat input
- Keep single textarea always visible (lines 1258-1396 in InlineSectionEditor.tsx)
- Update `handleChatSend` to handle both answer editing and AI questions
- Add markdown support (enhanced textarea with syntax highlighting)
- Auto-detect intent or use single "Send" button

**Reference:** See "Phase 3 Implementation Guide" section below (lines 1968-2011)

### Phase 4: Recommendations Display ⏳ **PENDING**
**Goal:** Improve recommendations with better interaction

**What needs to be done:**
- Convert simple bullet list to actionable cards (lines 1223-1255)
- Add click-to-add functionality (no buttons needed)
- Limit to 3-4 recommendations max
- Auto-update when question/answer changes
- Context-aware suggestions based on current question

**Reference:** See "Phase 4 Implementation Guide" section below (lines 2014-2048)

### Phase 5: Action Buttons ⏳ **PENDING**
**Goal:** Collapsible action buttons, smart display

**What needs to be done:**
- Implement collapsible "Quick Actions" section (lines 1186-1205)
- Hidden by default, auto-expand when AI suggests action
- Better discoverability and visual hierarchy

**Reference:** See "Phase 5 Implementation Guide" section below (lines 2051-2078)


