# Handover: Chat-Based InlineSectionEditor Redesign

Hi [Colleague Name],

Handover for the InlineSectionEditor redesign to a **chat-based interface**. This is a significant simplification that removes the traditional form-based editor in favor of a conversational experience.

---

## 🎯 Required Reading (in order)

1. **`docs/CHAT-BASED-EDITOR-DESIGN.md`** (this document)
   - Complete chat-based design
   - AI context handling (design, references, content)
   - Message types and flows

2. **`docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md`**
   - What's NOT editable (sidebar vs editor)
   - Prompt simplification rules (200-550 chars → 20-36 chars)
   - Real template examples from Austrian template

3. **`docs/INLINESECTIONEDITOR-IMPLEMENTATION-GUIDE.md`**
   - Current vs desired behavior
   - Skip behavior with reason dialog
   - Sticky positioning
   - Component structure

4. **`docs/UNIFIED-ASSISTANT-PANEL-DESIGN.md`**
   - Unified assistant panel design
   - Context switching
   - Integration with business plans

---

## 🔄 Key Design Changes

### What's Removed
- ❌ **Main textarea** - No traditional form input
- ❌ **Status badges** - Status managed through chat flow
- ❌ **Quick action buttons** (Draft, Improve) - Actions appear in chat
- ❌ **Tabs** (AI | Data | Context) - Everything in chat + unified panel

### What's Added
- ✅ **Chat window** - Questions and answers in conversation format
- ✅ **Simplified prompts** - 20-36 characters (down from 200-550)
- ✅ **AI context detection** - Automatically handles design, references, content
- ✅ **Proactive suggestions** - AI suggests improvements before user asks
- ✅ **Unified assistant panel** - Context-aware information display

---

## 📝 Prompt Simplification (Critical)

**Template prompts are 200-550 characters with 5-7 sub-questions.**

**Simplified prompts are 20-36 characters, single question.**

### Examples from Austrian Template:

| Template (Original) | Simplified (Shown) | Reduction |
|---------------------|-------------------|-----------|
| "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor?..." (350 chars, 7 questions) | "Describe your product or service" (33 chars) | **~90% shorter** |
| "Beschreiben Sie den Mehrwert, den Sie für Ihre KundInnen generieren. Nehmen Sie Ihren KundInnen Arbeit ab?..." (200 chars, 5 questions) | "What value do you provide to customers?" (36 chars) | **~82% shorter** |
| "Welche Personen sind Teil des Gründungsteams..." (450 chars, 7 questions) | "Tell us about your management team" (32 chars) | **~93% shorter** |

**Rules:**
1. Extract first sentence (main question)
2. Remove sub-questions
3. Make conversational ("Sie" → "you")
4. Keep short (max 80 characters)
5. Use active voice

**Important:** Full template text is still used by AI for context (not shown to user).

---

## 💬 Chat-Based Interface

### Message Flow

```
🤖 AI: "Describe your product or service"
     [📋 Show full guidance]

👤 You: "Our product is a SaaS platform..."

🤖 AI: "Great! Consider adding:
        • Current development stage
        • First customers
        
        Would you like me to:
        [📊 Create Table] [📈 Add KPI] [🖼️ Add Image]"

👤 You: "Create a features table"

🤖 AI: "I've created a Features Comparison table.
        [Preview] [Attach to question]"
```

### Message Types

1. **Question Messages** - AI asks simplified question
2. **Answer Messages** - User provides answer (editable)
3. **Suggestion Messages** - AI suggests improvements
4. **Data Creation Messages** - Shows created tables/KPIs/images

---

## 🤖 AI Assistant Context Handling

The AI automatically detects context and handles:

### 1. Content Context (Default)
- Analyzes answers
- Suggests improvements
- Recommends data to add
- Creates tables/KPIs/images on request
- Moves to next question automatically

### 2. Design Context
**Triggers:** "page numbers", "title page", "formatting", "design"

**Capabilities:**
- Updates formatting settings
- Designs title page
- Adds page numbers (top/bottom, left/center/right)
- Configures separation lines (solid/dashed/decorative)
- Generates table of contents
- Creates lists (tables, illustrations)

**Example:**
```
👤 You: "Add page numbers to my document"

🤖 AI: "I'll add page numbers to the top right of each page.
        Settings updated:
        • Page numbers: ✓ Top right
        • Separation lines: ✓ Enabled
        
        [Preview changes] [Customize more]"
```

### 3. References Context
**Triggers:** "citation", "reference", "attach", "link"

**Capabilities:**
- Detects citation needs in answers
- Adds citations automatically
- Links attachments to questions
- Generates reference lists
- Updates list of tables/illustrations
- Manages citation styles (APA, MLA, Chicago)

**Example:**
```
👤 You: "I mentioned Market Study 2024 in my answer"

🤖 AI: "I'll add a citation for Market Study 2024.
        
        Citation added: [1] Market Study 2024
        
        Would you like to:
        [Add URL] [Set citation style] [View all citations]"
```

### 4. Question Management Context
**Triggers:** "hide", "show", "reorder", "customize question"

**Capabilities:**
- Hides/shows questions
- Customizes question prompts
- Reorders questions
- Explains question relevance

**Example:**
```
👤 You: "Hide the patent question, it's not relevant"

🤖 AI: "I've hidden question 2.5 (Markenschutz und Patente).
        It won't appear in your editor anymore.
        
        [Show it again] [Customize other questions]"
```

---

## ❌ What Is NOT Editable

### In Sidebar (Section Management)

**❌ NOT Editable:**
- Question Answers - Edited in chat, not sidebar
- Question Status - Managed in chat flow
- Template Source - Original template text is read-only
- Section Description (from template) - Read-only expert guidance

**✅ Editable (Current):**
- Section Title
- Section Enable/Disable

**✅ Editable (Phase 3):**
- Question Prompts (override template)
- Question Visibility (show/hide)
- Question Order (reorder)

### In Chat-Based Editor

**❌ NOT Editable (Read-only Display):**
- Section Title - Shown from sidebar, can't edit here
- Section Description - Shown as "Section Guidance" (expandable), read-only
- Question Prompt - Shown simplified, read-only (Phase 3 allows customization in sidebar)
- Template Source Text - Used by AI for context, never shown to user

**✅ Editable:**
- Question Answer (in chat)
- Question Status (Complete/Skip buttons)
- Data Attachments (created and managed in chat)

---

## 📊 Unified Assistant Panel

The panel shows **context-aware information** based on current chat state:

### Content Context (Default)
```
💬 Assistant

📝 Question: 2.1
[Edit prompt...] [👁️] [↑↓]

────────────────────────────────────

Create: [Table] [KPI] [Image]

Attached:
• Table: Financial Projections [Detach]

[Show full template guidance →]

Progress: 3/6 questions answered
```

### Design Context
```
💬 Assistant

🎨 Design Settings

Title Page:
• Company name
• Logo
• Contact info

Formatting:
• Page numbers: ✓ Top right
• Separation lines: ✓ Enabled

Structure:
• Table of contents: ✓ Auto
• List of tables: ✓ Auto
```

### References Context
```
💬 Assistant

📚 References

Citations:
• [1] Market Study 2024
• [2] Industry Report
[+ Add citation]

Attachments:
• Table: Financial Projections
• KPI: Monthly Revenue
[+ Attach data]

Lists:
• List of Tables: 3 items
• List of Illustrations: 2 items
[Auto-generate lists]
```

---

## 🎯 Implementation Priority

### Phase 1: Core Chat Interface (High Priority)
- Chat window with message types
- Question/answer flow
- Simplified prompt display
- Basic AI responses

### Phase 2: AI Context Detection (High Priority)
- Content context (default)
- Design context detection
- References context detection
- Question management context

### Phase 3: Advanced Features (Medium Priority)
- Proactive suggestions
- Inline data creation
- Reference management
- Design assistance

### Phase 4: Question Management (Medium Priority)
- Edit prompts in sidebar
- Visibility toggle
- Question reordering

---

## 🔧 Technical Implementation

### Chat State Management

```typescript
interface ChatMessage {
  id: string;
  type: 'question' | 'answer' | 'suggestion' | 'data' | 'system';
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    questionId?: string;
    dataId?: string;
    actions?: ChatAction[];
  };
}
```

### Context Detection

```typescript
function detectAIContext(
  lastMessage: string,
  currentQuestion: Question | null,
  plan: BusinessPlan
): 'content' | 'design' | 'references' | 'questions' {
  // Design keywords
  if (lastMessage.match(/page numbers|title page|formatting|design/i)) {
    return 'design';
  }
  
  // References keywords
  if (lastMessage.match(/citation|reference|attach|link/i)) {
    return 'references';
  }
  
  // Question management keywords
  if (lastMessage.match(/hide|show|reorder|customize question/i)) {
    return 'questions';
  }
  
  // Default: content
  return 'content';
}
```

---

## ⚠️ Important Notes

1. **Prompt Simplification is Critical**
   - Template: 200-550 chars, 5-7 questions
   - Simplified: 20-36 chars, 1 question
   - Full template text used by AI (not shown to user)

2. **German Language Support**
   - All prompts are in German
   - Ensure AI and UI support German throughout
   - Simplification works for any language

3. **Template Source**
   - Validated against Austrian template (`template_public_support_general_austria_de_i2b.txt`)
   - Examples use real prompts from this template

4. **What's NOT Editable**
   - Sidebar: Question prompts (until Phase 3), answers, status
   - Editor: Section title, description, question prompt (read-only)
   - Template source text: Never shown, used by AI only

5. **Context Switching**
   - Panel automatically adapts based on chat context
   - AI detects context from user messages
   - Smooth transitions between contexts

---

## 📋 Questions for Discussion

1. Should we implement all phases sequentially, or can some be done in parallel?

2. How should we handle very long template prompts (400-500+ characters) in chat?

3. What's the UX for question reordering? Drag-and-drop or up/down arrows?

4. How do we handle edge cases? (e.g., Section 1 has no sub-questions, very short/long answers)

5. Should we A/B test the chat-based design vs current form-based editor?

6. How should we handle freemium content visibility in chat? (First 150 characters visible)

---

## 🚀 Next Steps

1. **Read the 4 documents listed above**
2. **Review the template examples** (especially `EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md`)
3. **Schedule a discussion** to align on decisions
4. **Start with Phase 1** (Core Chat Interface) as it has the highest UX impact

---

## 📚 Reference Documents

- `docs/CHAT-BASED-EDITOR-DESIGN.md` - Complete design specification
- `docs/EDITABILITY-AND-SIMPLIFICATION-EXAMPLES.md` - What's editable, prompt examples
- `docs/INLINESECTIONEDITOR-IMPLEMENTATION-GUIDE.md` - Implementation details
- `docs/UNIFIED-ASSISTANT-PANEL-DESIGN.md` - Assistant panel design
- `docs/SIMPLIFIED-INLINE-EDITOR-CARD.md` - Previous simplified design (for reference)

---

Let me know if anything is unclear or if you need more context on any section.

Best,  
[Your Name]

---

**P.S.** The template file used for examples: `c:\Users\kevin\OneDrive\Documents\template_public_support_general_austria_de_i2b.txt` (if you need to reference it)

