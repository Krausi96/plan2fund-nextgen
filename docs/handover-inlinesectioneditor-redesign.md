# InlineSectionEditor Redesign - Handover Document

**Target Audience:** Developers working on the InlineSectionEditor component  
**Status:** Current implementation needs clarification and redesign  
**Last Updated:** 2024

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Vision](#architecture-vision)
3. [Template Integration Flow](#template-integration-flow)
4. [UI Layout Design](#ui-layout-design)
5. [Section & Question Structure](#section--question-structure)
6. [Use Cases by Template Section](#use-cases-by-template-section)
7. [Implementation Requirements](#implementation-requirements)

---

## Current State Analysis

### What InlineSectionEditor Currently Does

The `InlineSectionEditor` is a floating, draggable editor that appears when a user clicks on a section in the preview. It currently:

- **Position:** Floats centered in viewport (320px width, 420px max height)
- **Structure:**
  - Header with section title and close button
  - Question navigation pills (1, 2, 3...)
  - Question prompt and helper text
- **Main Editor:** Large textarea for answer input
- **Collapsible Sections:**
  - 💬 AI Assistant (Draft, Improve, Chat)
  - 📊 Data & Attachments (Tables, KPIs, Media)
  - 📋 Context & Info (Requirements, Progress)

### Current Problems

1. **Confusing UX:** Editor floats, doesn't feel "sticky" to the page
2. **Duplicate Information:** Section description shown in header but not actionable
3. **Template Context Missing:** No clear connection to template structure
4. **Sidebar Confusion:** Section descriptions in sidebar don't affect the editor
5. **No Template Guidance:** Template questions don't show up clearly

---

## Architecture Vision

Based on the architecture documents, the vision is:

### **Seamless Layout Vision**

```
┌──────────┬──────────────────────────────────────────┐
│ SIDEBAR  │ PREVIEW (Full Width)                     │
│          │                                          │
│ [+ Add]  │ ┌──────────────────────────────────────┐ │
│ [✓] 01   │ │ 2. Produkt / Dienstleistung          │ │
│ [✏️]     │ │                                      │ │
│ [●]      │ │ 2.1. Produkt / Dienstleistungs-      │ │
│ ...      │ │     beschreibung & Entwicklungsstand  │ │
│          │ │                                      │ │
│          │ │ [InlineEditor appears here]          │ │
│          │ │                                      │ │
│          │ └──────────────────────────────────────┘ │
└──────────┴──────────────────────────────────────────┘
```

### **Key Principles**

1. **Sticky to Page:** Editor should feel attached to the question it's editing
2. **Template-Aware:** Show template guidance clearly
3. **Progressive Disclosure:** Start simple, expand as needed
4. **Conversational AI:** Chat interface, not just one-shot suggestions
5. **Context Flow:** Question → Answer → AI Help → Data → Attach → Continue

---

## Template Integration Flow

### How Templates Work

When a user receives a template (e.g., `template_public_support_general_austria_de_i2b.txt`):

1. **Template Structure:**
   - Sections (1. Executive Summary, 2. Produkt / Dienstleistung, etc.)
   - Sub-sections (2.1, 2.2, 2.3, etc.)
   - Questions (prompts with guidance text)

2. **Template → Plan Conversion:**
   ```
   Template Text → Parsed Structure → Plan Sections → Questions
   ```

3. **Section Properties (from template):**
   - `title`: "2. Produkt / Dienstleistung"
   - `description`: Guidance text from template
   - `questions`: Array of question objects

4. **Question Properties (from template):**
   - `prompt`: "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot..."
   - `helperText`: "Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp..."
   - `placeholder`: Optional placeholder text
   - `required`: Boolean (from template requirements)

---

## UI Layout Design

### **Proposed Card Design**

```
┌─────────────────────────────────────────────────────┐
│ InlineSectionEditor (Sticky to Question)           │
├─────────────────────────────────────────────────────┤
│ Header: [Section Title] [Question Number] [✕]      │
│         "2.1. Produkt / Dienstleistungsbeschreibung│
│          & Entwicklungsstand"                       │
├─────────────────────────────────────────────────────┤
│ Question Navigation: [1] [2] [3] [4] ...            │
│                      └─ Active ─┘                   │
├─────────────────────────────────────────────────────┤
│ Question Card:                                      │
│   ┌─────────────────────────────────────────────┐  │
│   │ Prompt: "Beschreiben Sie detailliert..."    │  │
│   │                                              │  │
│   │ Helper Text: "Wie ist der aktuelle          │  │
│   │ Entwicklungsstand? Liegt bereits ein        │  │
│   │ Prototyp oder Proof of Concept vor?"        │  │
│   │                                              │  │
│   │ [Why we ask? ℹ️]                            │  │
│   └─────────────────────────────────────────────┘  │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │ [Textarea for answer]                       │  │
│   │                                              │  │
│   │                                              │  │
│   └─────────────────────────────────────────────┘  │
│   [150 words] [45% complete] [Auto-saved 2s ago]   │
├─────────────────────────────────────────────────────┤
│ Tabs: [💬 AI] [📊 Data] [📋 Context]               │
│                                                     │
│ AI Tab (Active):                                    │
│   Quick Actions: [✨ Draft] [📈 Improve] [💡 Suggest]│
│   ┌─────────────────────────────────────────────┐  │
│   │ 💬 AI: I see you're describing your        │  │
│   │        product. Based on the template,     │  │
│   │        you should include:                 │  │
│   │        - Entwicklungsstand                 │  │
│   │        - Prototyp or Proof of Concept      │  │
│   │        - First customers                   │  │
│   │        Would you like me to draft an       │  │
│   │        outline?                            │  │
│   ├─────────────────────────────────────────────┤  │
│   │ 👤 You: Yes, create an outline            │  │
│   ├─────────────────────────────────────────────┤  │
│   │ 💬 AI: [Generates outline...]             │  │
│   │        [Insert] [Copy]                     │  │
│   └─────────────────────────────────────────────┘  │
│   [Ask AI...] [Send]                               │
├─────────────────────────────────────────────────────┤
│ Actions: [Complete] [Skip] [Next Question →]      │
└─────────────────────────────────────────────────────┘
```

### **Sticky Positioning**

Instead of floating centered, the editor should:

1. **Position Relative to Question:**
   - Find the question element in the preview
   - Position editor to the right of the question (or below on mobile)
   - Scroll with the page (sticky positioning)

2. **Visual Connection:**
   - Draw a line/arrow from editor to question
   - Highlight the question in preview
   - Keep editor visible when scrolling

3. **Responsive:**
   - Desktop: Right side of preview
   - Tablet: Below question
   - Mobile: Full width overlay

---

## Section & Question Structure

### **What Should Be Editable in Sidebar (Sections)**

When clicking a section in the sidebar, users should be able to edit:

#### **Section-Level Properties:**
- ✅ `title`: "2. Produkt / Dienstleistung" (editable)
- ✅ `description`: Guidance text from template (editable, affects editor)
- ✅ `order`: Position in document (drag-and-drop)
- ✅ `enabled`: Show/hide section (toggle)
- ✅ `custom`: Is this a custom section? (badge)

#### **What Affects the Editor:**
- **Section Description** → Shows in editor header as guidance
- **Section Title** → Shows in editor header
- **Question Order** → Affects navigation pills
- **Question Prompts** → Shows in question card
- **Question Helper Text** → Shows below prompt

### **Question-Level Properties:**

Each question has:
- `id`: Unique identifier
- `prompt`: Main question text (from template)
- `helperText`: Additional guidance (from template)
- `placeholder`: Placeholder text
- `answer`: User's answer (editable in editor)
- `status`: 'blank' | 'draft' | 'complete' | 'unknown'
- `attachments`: Linked datasets, KPIs, media
- `required`: Boolean (from template)

---

## Use Cases by Template Section

### **Template: Public Support General Austria**

Based on `template_public_support_general_austria_de_i2b.txt`:

---

### **Section 1: Executive Summary**

**Template Text:**
> "Wir empfehlen diese Zusammenfassung erst dann zu verfassen, wenn Sie den gesamten Businessplan erstellt haben."

**Editor Behavior:**
- **Question:** "Erstellen Sie eine Executive Summary..."
- **Helper Text:** Shows template guidance
- **AI Context:** "I see you're writing the Executive Summary. This should be written LAST, after all other sections. Would you like me to help you compile key points from your other sections?"
- **Data Suggestions:** None (summary section)
- **Use Case:** User writes summary, AI helps compile from other sections

---

### **Section 2: Produkt / Dienstleistung**

#### **2.1. Produkt / Dienstleistungsbeschreibung & Entwicklungsstand**

**Template Text:**
> "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor? Muss dieser erst entwickelt werden? Oder haben Sie bereits die erste Kleinserie produziert? Gibt es erste Kunden? Beschreiben Sie auch, wie Ihre Produkte oder Dienstleistungen zukunftsfit gestaltet sind und welche nachhaltigen Materialien und Prozesse verwendet werden."

**Editor Behavior:**
- **Question:** "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot"
- **Helper Text:** Full template guidance (shown in expandable "Why we ask?" tooltip)
- **AI Context:** 
  - "Based on the template, you should include:
    - Entwicklungsstand (current development status)
    - Prototyp or Proof of Concept details
    - First customers (if any)
    - Sustainability aspects
  Would you like me to draft an outline?"
- **Data Suggestions:**
  - "Product Development Timeline" dataset
  - "Customer List" dataset
  - "Sustainability Metrics" KPI
- **Use Case Flow:**
  1. User clicks section → Editor opens
  2. User sees question and helper text
  3. User clicks "💬 AI" → AI suggests outline
  4. User clicks "📊 Data" → Creates "Development Timeline" dataset
  5. User fills data: "Q1 2024: Prototyp", "Q2 2024: First customers"
  6. User attaches dataset to question
  7. User writes answer, references the timeline
  8. AI helps structure answer using the data

#### **2.2. Kundennutzen**

**Template Text:**
> "Beschreiben Sie den Mehrwert, den Sie für Ihre KundInnen generieren. Nehmen Sie Ihren KundInnen Arbeit ab? Sparen Sie ihnen Zeit oder Kosten? Liefen Sie bessere Qualität? Ober überhaupt etwas Neues? Betrachten Sie Ihr Produkt / Ihre Dienstleistung aus der Sicht der KundInnen."

**Editor Behavior:**
- **Question:** "Beschreiben Sie den Mehrwert für Ihre KundInnen"
- **Helper Text:** Template guidance about customer perspective
- **AI Context:** "Think from the customer's perspective. What problem do you solve? How do you save time/cost/effort?"
- **Data Suggestions:** "Customer Benefits" table (Problem | Solution | Benefit)
- **Use Case:** User describes benefits, AI helps frame from customer perspective

#### **2.3. USP, Stärken & Schwächen**

**Template Text:**
> "Beschreiben Sie den „Unique Selling Point" (USP) Ihres Produktes / Ihrer Dienstleistung. Welche Stärken und Schwächen haben Ihre Produkte und/oder Dienstleistung im Vergleich zum Mitbewerb? Warum sollten KundInnen bei Ihnen kaufen? Was hebt Sie von der Konkurrenz ab?"

**Editor Behavior:**
- **Question:** "Beschreiben Sie den USP und Stärken/Schwächen"
- **Helper Text:** Template guidance about competition
- **AI Context:** "Compare yourself to competitors. What makes you unique? What are your strengths and weaknesses?"
- **Data Suggestions:** "Competitor Comparison" table
- **Use Case:** User describes USP, AI helps identify strengths/weaknesses vs competitors

---

### **Section 3: Unternehmen & Management**

#### **3.1. Management und (Gründungs)-Team**

**Template Text:**
> "Welche Personen sind Teil des Gründungsteams und über welche Vorerfahrung verfügen diese Personen? Welche Rolle haben die Personen im Unternehmen? Gibt es „Know How" das Sie nicht im Team haben? Wenn ja, wie schließen Sie diese Lücke? Zeigen Sie auch, wie das Managementteam Nachhaltigkeit in die Unternehmensführung integriert..."

**Editor Behavior:**
- **Question:** "Beschreiben Sie das Management und Gründungsteam"
- **Helper Text:** Template guidance about team structure
- **AI Context:** "Describe team members, their experience, roles, and any knowledge gaps. How do you address sustainability?"
- **Data Suggestions:** "Team Structure" table (Name | Role | Experience | Skills)
- **Use Case:** User describes team, AI helps identify gaps and suggest solutions

#### **3.6. Umsetzungsplanung**

**Template Text:**
> "Welche einzelnen Schritte haben Sie innerhalb der nächsten Jahre zur erfolgreichen Etablierung Ihres Unternehmens geplant (Personal, Standort, …)? Welche Meilensteine haben Sie festgelegt? Bis zu welchen Terminen möchten Sie Ihre Planungsmaßnahmen konkret umgesetzt haben (Fertigstellung des Produktes, Finanzierungen abgeschlossen, Gewerbeberechtigung erhalten, …)? Welche Aufgaben und Meilensteine hängen direkt voneinander ab? Welcher ist der kritische Pfad bei der Umsetzung bzw. Start-up Phase?"

**Editor Behavior:**
- **Question:** "Beschreiben Sie die Umsetzungsplanung"
- **Helper Text:** Template guidance about milestones and critical path
- **AI Context:** "Plan implementation steps, milestones, and dependencies. Identify the critical path."
- **Data Suggestions:** 
  - "Implementation Timeline" dataset (Task | Start | End | Dependencies)
  - "Milestones" KPI (Key milestone dates)
- **Use Case:** User plans implementation, AI helps structure timeline and identify critical path

---

### **Section 6: Erfolgs- und Finanzplanung**

#### **6.1. Gründungskosten & Investitionskosten**

**Template Text:**
> "Neben den Gründungskosten wie z.B. Anwalts- und Steuerkosten fallen Investitionen an um Ihr Unternehmen überhaupt in Betrieb zu setzen. Welche Investitionen sind notwendig, um erste Umsätze zu erzielen? Gäbe es auch Alternativen wie z.B. Mietung, geteilte Nutzung? Müssen Sie mittelfristig (innerhalb der nächsten 3-5 Geschäftsjahre) weitere Investitionen tätigen?"

**Editor Behavior:**
- **Question:** "Beschreiben Sie Gründungskosten & Investitionskosten"
- **Helper Text:** Template guidance about costs and alternatives
- **AI Context:** "List all startup costs and investments. Consider alternatives like leasing or shared use."
- **Data Suggestions:**
  - "Gründungskosten" dataset (Item | Amount | Category)
  - "Investitionskosten" dataset (Item | Amount | Timeline)
  - "Total Gründungskosten" KPI
- **Use Case Flow:**
  1. User clicks "📊 Data" first (before writing)
  2. Creates "Gründungskosten" dataset
  3. Fills data: "Anwaltskosten: 2,000 EUR", "Büroausstattung: 5,000 EUR"
  4. AI suggests: "Also consider: Steuerkosten, Markenregistrierung, Initial marketing"
  5. User adds suggested items
  6. AI suggests KPI: "Total Gründungskosten: 12,000 EUR"
  7. User creates KPI, attaches to question
  8. User writes answer, references the data
  9. AI helps structure answer using the data

---

## Implementation Requirements

### **1. Sticky Positioning**

```typescript
// Instead of centering, position relative to question
const calculateStickyPosition = () => {
  const questionElement = document.querySelector(
    `[data-question-id="${activeQuestionId}"]`
  );
  if (!questionElement) return;
  
  const rect = questionElement.getBoundingClientRect();
  const scrollContainer = document.getElementById('preview-scroll-container');
  
  // Position to right of question (or below on mobile)
  setPosition({
    top: rect.top + scrollContainer.scrollTop,
    left: rect.right + 20, // 20px gap
    placement: 'right',
    visible: true
  });
};
```

### **2. Template Integration**

```typescript
// Show template guidance clearly
const renderQuestionCard = () => {
  return (
    <div className="question-card">
      <h3>{activeQuestion.prompt}</h3>
      {activeQuestion.helperText && (
        <details className="helper-text">
          <summary>Why we ask? ℹ️</summary>
          <p>{activeQuestion.helperText}</p>
        </details>
      )}
      {/* Show template section description in header */}
      {section.description && (
        <div className="section-guidance">
          {section.description}
        </div>
      )}
    </div>
  );
};
```

### **3. Conversational AI**

```typescript
// AI should be conversational, not one-shot
const handleAIConversation = async (message: string) => {
  const context = {
    section: section.title,
    question: activeQuestion.prompt,
    currentAnswer: activeQuestion.answer,
    attachedData: activeQuestion.attachments,
    templateGuidance: activeQuestion.helperText,
    previousSections: getPreviousSectionsAnswers()
  };
  
  const response = await generateSectionContent({
    ...context,
    userMessage: message,
    conversationHistory: aiMessages
  });
  
  setAiMessages([...aiMessages, response]);
};
```

### **4. Data Integration**

```typescript
// AI suggests data structures based on question
const suggestDataStructure = () => {
  // Analyze question prompt and helper text
  // Suggest relevant datasets/KPIs
  // Example: "Gründungskosten" question → suggest cost table
};
```

### **5. Section Description in Sidebar**

```typescript
// Sidebar should show section description
// When editing section in sidebar, update description
// Description flows to editor header
const updateSectionDescription = (sectionId: string, description: string) => {
  // Update section.description
  // This shows in editor header as guidance
};
```

---

## Key Questions to Clarify

1. **Sticky vs Floating:** Should editor be sticky to question or floating?
   - **Recommendation:** Sticky to question (feels more connected)

2. **Section Description:** Where should it appear?
   - **Recommendation:** Editor header, below section title

3. **Template Guidance:** How prominent should it be?
   - **Recommendation:** Expandable "Why we ask?" tooltip, full text in helper section

4. **AI Integration:** Conversational or one-shot?
   - **Recommendation:** Conversational (chat interface)

5. **Data Creation:** Before or after writing?
   - **Recommendation:** Either way, AI suggests when relevant

---

## Next Steps

1. **Implement sticky positioning** (position relative to question)
2. **Add template guidance display** (section description in header)
3. **Enhance AI to be conversational** (chat interface with context)
4. **Add data structure suggestions** (AI suggests relevant datasets/KPIs)
5. **Clarify section editing in sidebar** (what affects editor vs what doesn't)
6. **Test with full template flow** (all sections from template)

---

## Files to Review

- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` (main component)
- `features/editor/types/plan.ts` (Section and Question types)
- `features/editor/hooks/useEditorStore.ts` (template loading and validation)
- `features/export/renderer/renderer.tsx` (preview rendering)

---

**End of Handover Document**

