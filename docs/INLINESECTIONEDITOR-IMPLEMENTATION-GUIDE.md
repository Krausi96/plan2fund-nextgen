# InlineSectionEditor - Complete Implementation Guide

**Single source of truth for all InlineSectionEditor changes**  
**Last Updated:** 2024  
**Status:** DESIRED BEHAVIOR - Not Yet Implemented

**⚠️ IMPORTANT:** This document describes the **desired future state**, not the current implementation. The current InlineSectionEditor has different behavior (centered positioning, complex collapsible sections, no prompt simplification, basic skip behavior).

---

## 🔄 Current vs Desired Behavior

### **Current Implementation:**
- ❌ Editor is **centered in viewport** (not sticky to question)
- ❌ Uses **collapsible sections** (AI, Data, Context) instead of tabs
- ❌ Shows **full template prompts** (long, complex, formal)
- ❌ Skip button **doesn't move to next question**
- ❌ No skip reason dialog
- ❌ Helper text shown in question card (we removed this requirement)

### **Desired Behavior (This Guide):**
- ✅ Editor is **sticky to question** in preview (right side on desktop)
- ✅ Uses **tabs** (AI, Data, Context) instead of collapsible sections
- ✅ Shows **simplified prompts** (short, conversational)
- ✅ Skip button **moves to next question** with reason dialog
- ✅ Skip reason captured and shown in sidebar
- ✅ Helper text NOT shown (used by AI for context only)

### **Standard View:**
This guide applies to the **standard editing view** where:
- User clicks section in sidebar → Editor opens
- Editor shows one question at a time
- User edits answer, uses AI help, attaches data
- Editor is sticky to question in preview

**Note:** This does NOT apply to special views like:
- Metadata section editing (inline in preview)
- Ancillary section editing (separate UI)
- References/Appendices (separate UI)

---

## 📋 Table of Contents

1. [Core Purpose & Structure](#core-purpose--structure)
2. [What Can Be Edited Where](#what-can-be-edited-where)
3. [Prompt Simplification](#prompt-simplification)
4. [Skip Behavior](#skip-behavior)
5. [Sticky Positioning](#sticky-positioning)
6. [Template Integration](#template-integration)
7. [Component Structure](#component-structure)
8. [Implementation Checklist](#implementation-checklist)

---

## 🎯 Core Purpose & Structure

### **What InlineSectionEditor Does:**
1. Shows ONE question at a time
2. Provides answer input (textarea)
3. Offers AI help (conversational)
4. Manages data attachments (tables, KPIs, media)
5. Shows context (requirements, progress)

### **What It Does NOT Do:**
- Section management (that's in sidebar)
- Complex navigation (that's in sidebar)
- Multi-panel interface

### **Simplified Structure:**

```
┌─────────────────────────────────────────┐
│ 2. Produkt / Dienstleistung    [✕]    │ ← Section Title
│ [📋 Section Guidance ▼]                │ ← Expandable section.description
├─────────────────────────────────────────┤
│ Questions: [1] [2] [3] [4] [5] [6]     │ ← Navigation pills
│            └─ Active ─┘                 │
├─────────────────────────────────────────┤
│ "Describe your product or service"     │ ← Simplified prompt
│                                         │
│ [Status Badges]                         │
│   ✅ Complete | ⚠️ Missing Data        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Textarea - Answer]                  │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ [150 words] [Auto-saved 2s ago]        │
├─────────────────────────────────────────┤
│ Tabs: [💬 AI] [📊 Data] [📋 Context]   │
│                                         │
│ AI Tab: [✨ Draft] [📈 Improve]         │
│ Data Tab: [📊 Table] [📈 KPI] [🖼️ Media]│
│ Context Tab: Requirements, Progress    │
├─────────────────────────────────────────┤
│ [✓ Complete] [Skip] [Next →]          │
└─────────────────────────────────────────┘
```

---

## 🔍 What Can Be Edited Where

### **SIDEBAR (Section Management)**

**Editable:**
- ✅ Section Title (`section.title`) - via ✏️ button
- ✅ Section Description (`section.description`) - via ✏️ button
- ✅ Section Order - drag-and-drop
- ✅ Section Enabled/Disabled - checkbox toggle
- ✅ Custom Section Badge - read-only indicator

**NOT Editable:**
- ❌ Question prompts (shown in editor, from template)
- ❌ Question answers (edited in InlineSectionEditor)
- ❌ Question status (managed in editor)

### **INLINE EDITOR (Question Editing)**

**Editable:**
- ✅ Question Answer - textarea
- ✅ Question Status - Complete/Skip actions
- ✅ Data Attachments - via Data tab

**Shown (Read-only):**
- Section Title (from sidebar)
- Section Description (expandable "Section Guidance")
- Question Prompt (simplified, from template)
- Status Badges (auto-computed)

---

## 💬 Prompt Simplification

### **Problem:**
Template prompts are too long, complex, and formal:
```
"Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor?"
```

### **Solution:**
Transform to simple, conversational prompts:

**Transformation Rules:**
1. Extract main question (first sentence)
2. Remove multiple sub-questions
3. Make conversational ("you" instead of "Sie")
4. Keep it short (max 80 characters)

**Examples:**

| Template | Simplified |
|----------|------------|
| "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot..." | "Describe your product or service" |
| "Welche Personen sind Teil des Gründungsteams..." | "Tell us about your team" |
| "Neben den Gründungskosten wie z.B. Anwalts- und Steuerkosten..." | "What are your startup costs and investments?" |

**Implementation:**
```typescript
function simplifyPrompt(templatePrompt: string): string {
  // Extract first sentence
  const firstSentence = templatePrompt.split('.')[0].trim();
  
  // Make conversational
  const conversational = firstSentence
    .replace(/Sie/g, 'you')
    .replace(/Ihr/g, 'your')
    .replace(/Beschreiben Sie/g, 'Describe')
    .replace(/Welche/g, 'What');
  
  // Limit length
  return conversational.length > 80 
    ? conversational.substring(0, 80) + '...'
    : conversational;
}
```

**Note:** Full template text is still used by AI for context (not shown to user).

---

## ⏭️ Skip Behavior

### **Current Problems:**
- Skip doesn't move to next question
- No feedback on why skipping
- Confusing "Clear Skip" button

### **Proposed: Skip with Reason**

**Flow:**
1. User clicks "Skip"
2. Dialog appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Skip this question?                     │
   │                                         │
   │ Why are you skipping?                  │
   │ ○ Not applicable to my business        │
   │ ○ I'll come back to this later         │
   │ ○ I don't understand the question      │
   │ ○ Other reason...                      │
   │                                         │
   │ Optional note:                         │
   │ [___________________________]          │
   │                                         │
   │ [Cancel] [Skip Question]               │
   └─────────────────────────────────────────┘
   ```
3. Mark as 'unknown' with reason
4. **Auto-advance to next question**
5. Show skipped questions in sidebar with ❓ badge

**Implementation:**
```typescript
const handleSkip = async () => {
  const reason = await showSkipReasonDialog();
  onToggleUnknown(activeQuestion.id, reason);
  
  // Auto-advance to next question
  const nextQuestion = getNextQuestion();
  if (nextQuestion) {
    onSelectQuestion(nextQuestion.id);
  } else {
    onClose(); // Last question
  }
};
```

**Skip Reasons:**
- `not_applicable` - Question doesn't apply to business
- `later` - Will answer later
- `unclear` - Don't understand (triggers AI help)
- `other` - Custom reason with note

---

## 📍 Sticky Positioning

### **Current:**
- Editor is centered in viewport
- Doesn't feel connected to question

### **Proposed:**
- Position relative to question element in preview
- Desktop: Right side of question
- Tablet: Below question
- Mobile: Full width overlay

**Implementation:**
```typescript
const calculateStickyPosition = () => {
  const questionElement = document.querySelector(
    `h4.section-subchapter[data-question-id="${activeQuestionId}"]`
  ) as HTMLElement;
  
  if (!questionElement) return;
  
  const questionRect = questionElement.getBoundingClientRect();
  const scrollContainer = document.getElementById('preview-scroll-container');
  const containerRect = scrollContainer?.getBoundingClientRect();
  
  // Position to right of question (or below on mobile)
  const placement = window.innerWidth > 768 ? 'right' : 'below';
  const gap = 20;
  
  if (placement === 'right') {
    left = questionRect.right + gap;
    top = questionRect.top + scrollContainer.scrollTop;
  } else {
    left = questionRect.left;
    top = questionRect.bottom + gap;
  }
  
  setPosition({ top, left, placement, visible: true });
};
```

---

## 📋 Template Integration

### **Template → UI Mapping:**

**Template Structure:**
```
Section:
  - title: "2. Produkt / Dienstleistung"
  - description: "Template guidance text..."
  
Question:
  - prompt: "Beschreiben Sie detailliert..."
  - helperText: "Wie ist der aktuelle Entwicklungsstand?..."
```

**UI Display:**
```
Sidebar:
  - Section Title → Card title
  - Section Description → (Editable via ✏️)
  
Editor:
  - Section Title → Header
  - Section Description → "Section Guidance" (expandable)
  - Question Prompt → Simplified prompt (shown)
  - Question Helper Text → AI context (not shown)
```

### **Example: Section 2.1**

**Template:**
```
Section: "2. Produkt / Dienstleistung"
Question: "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand?..."
```

**UI:**
```
┌─────────────────────────────────────────┐
│ 2. Produkt / Dienstleistung    [✕]    │
│ [📋 Section Guidance ▼]                │
├─────────────────────────────────────────┤
│ "Describe your product or service"     │ ← Simplified
│                                         │
│ [Textarea]                              │
│                                         │
│ 💡 AI can help you include:            │ ← AI uses full template
│   - Current development status          │
│   - Prototype details                   │
│   - First customers                      │
└─────────────────────────────────────────┘
```

---

## 🎨 Component Structure

### **Component Hierarchy:**

```
InlineSectionEditor (320px width, sticky)
├── Header
│   ├── Section Title (from sidebar)
│   ├── Close Button
│   └── Section Guidance (expandable, from sidebar)
├── Question Navigation
│   └── Pills: [1] [2] [3] [4] (read-only)
├── Question Card
│   ├── Question Prompt (simplified, from template)
│   ├── Status Badges (auto-computed)
│   ├── Textarea (user edits here)
│   └── Word Count / Auto-save (auto-computed)
├── Tabs
│   ├── AI Tab
│   │   ├── Quick Actions: [✨ Draft] [📈 Improve]
│   │   ├── Chat Messages (conversational)
│   │   └── Input: [Ask AI...] [Send]
│   ├── Data Tab
│   │   ├── Quick Add: [📊 Table] [📈 KPI] [🖼️ Media]
│   │   ├── AI Suggestions
│   │   └── Library (filtered by section)
│   └── Context Tab
│       ├── Requirements (validation status)
│       ├── Progress (section completion)
│       └── Related Sections
└── Actions
    ├── Complete (marks question complete, moves to next)
    ├── Skip (shows reason dialog, moves to next)
    └── Next Question (manual navigation)
```

### **Props (Simplified):**

```typescript
type InlineSectionEditorProps = {
  // Core
  sectionId: string | null;
  section: Section | null;
  activeQuestionId: string | null;
  plan: BusinessPlan;
  
  // Actions
  onClose: () => void;
  onSelectQuestion: (questionId: string) => void;
  onAnswerChange: (questionId: string, content: string) => void;
  onMarkComplete: (questionId: string) => void;
  onToggleUnknown: (questionId: string, reason?: string) => void;
  
  // Data
  onDatasetCreate?: (dataset: Dataset) => void;
  onKpiCreate?: (kpi: KPI) => void;
  onMediaCreate?: (asset: MediaAsset) => void;
  onAttachDataset?: (dataset: Dataset) => void;
  onAttachKpi?: (kpi: KPI) => void;
  onAttachMedia?: (asset: MediaAsset) => void;
};
```

---

## ✅ Implementation Checklist

### **Phase 1: Simplify Structure**
- [ ] Remove collapsible sections, use tabs instead
- [ ] Simplify header (remove duplicate info)
- [ ] Focus question card on prompt + answer
- [ ] Make section guidance expandable

### **Phase 2: Prompt Simplification**
- [ ] Create `simplifyPrompt()` function
- [ ] Transform all template prompts on load
- [ ] Store simplified prompts in question object
- [ ] Keep original template text for AI context

### **Phase 3: Skip Behavior**
- [ ] Add skip reason dialog component
- [ ] Update `toggleQuestionUnknown` to accept reason
- [ ] Auto-advance to next question after skip
- [ ] Show skip reason in sidebar/question navigation
- [ ] Add "Clear Skip" functionality

### **Phase 4: Sticky Positioning**
- [ ] Modify `calculatePosition()` to position relative to question
- [ ] Handle responsive (right/below/full-width)
- [ ] Add visual connection (optional)
- [ ] Test scroll behavior

### **Phase 5: Template Integration**
- [ ] Show section.description in expandable header
- [ ] Ensure AI uses full template text for context
- [ ] Update question card to show simplified prompt
- [ ] Test with full template flow

### **Phase 6: Sidebar Integration**
- [ ] Clarify what's editable in sidebar
- [ ] Ensure section edits flow to editor
- [ ] Keep question editing in editor only
- [ ] Test section title/description updates

---

## 🎯 Success Criteria

1. ✅ **User can focus on one question** without distraction
2. ✅ **Prompts are simple and clear** (max 80 chars, conversational)
3. ✅ **Skip is helpful** (captures reason, moves to next question)
4. ✅ **Editor feels connected** to question in preview (sticky)
5. ✅ **AI provides context** (uses full template text, not simplified)
6. ✅ **Sidebar and editor have clear roles** (no overlap)

---

## 📝 Key Changes Summary

### **Removed:**
- ❌ Collapsible sections (use tabs instead)
- ❌ "Why we ask?" expandable (helper text not shown)
- ❌ Duplicate information
- ❌ Complex navigation
- ❌ Centered floating position

### **Added:**
- ✅ Simplified, conversational prompts
- ✅ Skip with reason dialog
- ✅ Auto-advance after skip/complete
- ✅ Sticky positioning relative to question
- ✅ Clear separation: Sidebar = sections, Editor = questions

### **Changed:**
- ✅ Prompts: Long → Short, Formal → Conversational
- ✅ Skip: Static → With reason, No advance → Auto-advance
- ✅ Position: Centered → Sticky to question
- ✅ Structure: Collapsible → Tabs

---

**This is the single source of truth for InlineSectionEditor implementation.**

