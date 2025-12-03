# What's Not Editable, Simplified Prompts, and Panel Design

## 1. ❌ What Is NOT Editable

### In Sidebar (Section Management)

**❌ NOT Editable:**
- **Question Prompts** (from template) - Currently read-only, but Phase 3 will allow customization
- **Question Answers** - Edited in InlineSectionEditor, not sidebar
- **Question Status** - Managed in InlineSectionEditor (Complete/Skip)
- **Template Source** - The original template text is read-only
- **Section Description** (from template) - Read-only expert guidance (Phase 3 removes editing)

**✅ Editable (Current):**
- Section Title
- Section Enable/Disable

**✅ Editable (Phase 3):**
- Question Prompts (override template)
- Question Visibility (show/hide)
- Question Order (reorder)

### In InlineSectionEditor

**❌ NOT Editable (Read-only Display):**
- **Section Title** - Shown from sidebar, but you can't edit it here
- **Section Description** - Shown as "Section Guidance" (expandable), read-only
- **Question Prompt** - Shown simplified, read-only (but Phase 3 allows customization in sidebar)
- **Status Badges** - Auto-computed, read-only
- **Template Source Text** - Used by AI for context, never shown to user

**✅ Editable:**
- Question Answer (textarea)
- Question Status (Complete/Skip buttons)
- Data Attachments (tables, KPIs, media via tabs)

---

## 2. 📝 Prompt Simplification: Template vs Simplified

### Example 1: Section 2.1 - Product Description

**Original Template (Line 55):**
```
Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. 
Wie ist der aktuelle Entwicklungsstand? 
Liegt bereits ein Prototyp oder Proof of Concept vor? 
Muss dieser erst entwickelt werden? 
Oder haben Sie bereits die erste Kleinserie produziert? 
Gibt es erste Kunden? 
Beschreiben Sie auch, wie Ihre Produkte oder Dienstleistungen 
zukunftsfit gestaltet sind und welche nachhaltigen Materialien 
und Prozesse verwendet werden.
```
**Length:** ~350 characters, 7 questions

**Simplified (Shown to User):**
```
Describe your product or service
```
**Length:** 33 characters, 1 clear question

**What AI Uses (Hidden from User):**
- Full template text (all 7 sub-questions)
- Used for generating suggestions and context

---

### Example 2: Section 2.2 - Customer Value

**Original Template (Line 57-58):**
```
Beschreiben Sie den Mehrwert, den Sie für Ihre KundInnen generieren. 
Nehmen Sie Ihren KundInnen Arbeit ab? 
Sparen Sie ihnen Zeit oder Kosten? 
Liefen Sie bessere Qualität? 
Ober überhaupt etwas Neues? 
Betrachten Sie Ihr Produkt / Ihre Dienstleistung aus der Sicht 
der KundInnen.
```
**Length:** ~200 characters, 5 questions

**Simplified (Shown to User):**
```
What value do you provide to customers?
```
**Length:** 36 characters, 1 clear question

---

### Example 3: Section 3.1 - Management Team

**Original Template (Line 73-74):**
```
Welche Personen sind Teil des Gründungsteams und über welche 
Vorerfahrung verfügen diese Personen? 
Welche Rolle haben die Personen im Unternehmen? 
Gibt es „Know How" das Sie nicht im Team haben? 
Wenn ja, wie schließen Sie diese Lücke? 
Durch Vergabe an Externe? 
Durch Aufnahme von Personal oder zusätzlichen Gesellschaftern? 
Zeigen Sie auch, wie das Managementteam Nachhaltigkeit in die 
Unternehmensführung integriert und welche Schulungen und 
Maßnahmen zur Förderung nachhaltiger Praktiken durchgeführt werden.
```
**Length:** ~450 characters, 7 questions

**Simplified (Shown to User):**
```
Tell us about your management team
```
**Length:** 32 characters, 1 clear question

---

### Example 4: Section 3.2 - Company Information

**Original Template (Line 76-77):**
```
Wie ist der Firmenwortlaut und ggf. das Datum der 
Unternehmensgründung? 
Welche Rechtsform planen Sie? 
Firmensitz: Welchen Standort haben Sie vorgesehen und welche 
Vorteile bzw. Herausforderungen ergeben sich daraus? 
Wie sind die geplanten Eigentumsverhältnisse (wer hält welche 
Anteile am Unternehmen)? 
Gibt es schon entsprechende Verträge (Gesellschaftsvertrag etc.)? 
Gibt es externe Kooperationspartner und welche Vor- und Nachteile 
sind diesbezüglich denkbar? 
Status der Unternehmensgründung: Welche wesentlichen Schritte 
der Unternehmensgründung wurden bereits gesetzt 
(Registrierung der Marke, Firmenbucheintrag, Beantragung der 
Gewerbeberechtigung, evtl. Zusagen vorab etc.)?
```
**Length:** ~550 characters, 7 questions

**Simplified (Shown to User):**
```
What are your company details?
```
**Length:** 30 characters, 1 clear question

---

### Example 5: Section 6.2 - Cost Planning

**Original Template (Line 127-128):**
```
Mit welchen Produktionskosten bzw. Wareneinsatz rechnen Sie? 
Mit welchen sonstigen laufenden Kosten rechnen Sie? 
Welchen Personalbedarf und welche Personalkosten erwarten Sie? 
Wie hoch ist Ihr Unternehmerlohn? 
(Kosten innerhalb der nächsten 3-5 Geschäftsjahre.) 
Beachten Sie auch die Sozialversicherungsbeiträge und die 
Abgaben ans Finanzamt.
```
**Length:** ~250 characters, 5 questions

**Simplified (Shown to User):**
```
What are your costs?
```
**Length:** 20 characters, 1 clear question

---

### Simplification Rules Applied

1. **Extract First Sentence** - Take the main question
2. **Remove Sub-questions** - Drop all "Wie...?", "Gibt es...?", etc.
3. **Make Conversational** - "Sie" → "you", "Ihr" → "your"
4. **Keep Short** - Max 80 characters
5. **Use Active Voice** - "Describe" instead of "Beschreiben Sie"

**Result:**
- Template: 200-550 characters, 5-7 questions
- Simplified: 20-36 characters, 1 question
- **Reduction: ~90% shorter, 85% fewer questions**

---

## 3. 🎨 Panel Design: Current vs Simplified

### Current Design (From Implementation Summary)

```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft Answer] [📈 Improve]      │
│                                     │
│ 💡 AI Suggestions:                  │
│ "Consider mentioning:               │
│  • Current development stage        │
│  • First customers or test users    │
│  • Sustainability features          │
│  • Materials and processes used"    │
│                                     │
│ 📊 Suggested Data:                  │
│ • Table: Product features           │
│   [Create Table]                    │
│ • KPI: Development milestones       │
│   [Create KPI]                      │
│ • Media: Product images             │
│   [Upload Image]                    │
│                                     │
│ 📋 Context:                         │
│ Template guidance:                  │
│ "Beschreiben Sie detailliert Ihr   │
│  Produkt- / Dienstleistungsangebot.│
│  Wie ist der aktuelle              │
│  Entwicklungsstand?..."             │
│                                     │
│ [Ask AI about this question...]    │
│ [Send]                              │
└─────────────────────────────────────┘
```

### Simplified Design (Proposed)

**Option A: Collapsible Sections**
```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft] [📈 Improve]             │
│                                     │
│ 💡 Suggestions                      │
│ ▼ Current development stage         │
│   First customers                   │
│   Sustainability features           │
│                                     │
│ 📊 Data                             │
│ ▼ [Create Table] [Create KPI]      │
│                                     │
│ 📋 Full guidance                    │
│ ▼ [Show full template text...]     │
│                                     │
│ [Ask AI...] [Send]                  │
└─────────────────────────────────────┘
```

**Option B: Single Scrollable (RECOMMENDED)**
```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft] [📈 Improve]             │
│                                     │
│ 💡 Consider mentioning:             │
│ • Current development stage          │
│ • First customers                    │
│ • Sustainability features            │
│                                     │
│ 📊 Create: [Table] [KPI] [Image]    │
│                                     │
│ 📋 Full guidance (tap to expand)    │
│                                     │
│ [Ask AI about this question...]    │
│ [Send]                              │
└─────────────────────────────────────┘
```

**Option C: Minimal (Most Simplified)**
```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft] [📈 Improve]             │
│                                     │
│ Consider:                           │
│ • Development stage                  │
│ • First customers                   │
│ • Sustainability                    │
│                                     │
│ [Create Table] [Create KPI]         │
│                                     │
│ [Ask AI...] [Send]                  │
└─────────────────────────────────────┘
```

---

## 🎯 Recommended Simplification

### What to Keep:
- ✅ Quick actions (Draft, Improve)
- ✅ AI suggestions (bullet points)
- ✅ Data creation buttons (inline)
- ✅ AI chat input

### What to Simplify:
- ❌ Remove section headers (💡, 📊, 📋) - use subtle dividers
- ❌ Collapse "Context" by default - show "Show full guidance" link
- ❌ Combine data suggestions into single row
- ❌ Reduce visual weight of icons

### Final Simplified Design:

```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft] [📈 Improve]             │
│                                     │
│ Consider mentioning:                 │
│ • Current development stage          │
│ • First customers                   │
│ • Sustainability features            │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ Create: [Table] [KPI] [Image]        │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ [Show full template guidance →]     │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ [Ask AI about this question...]    │
│ [Send]                              │
└─────────────────────────────────────┘
```

**Key Changes:**
1. **No section headers** - Just content with subtle dividers
2. **Context collapsed** - Link to expand full template text
3. **Inline data buttons** - Single row, no descriptions
4. **Cleaner spacing** - Less visual clutter
5. **Focus on actions** - Draft, Improve, Create, Ask

---

## 📊 Comparison Table

| Element | Current | Simplified | Reduction |
|---------|---------|------------|-----------|
| Section headers | 3 (💡📊📋) | 0 | -100% |
| Visual weight | High (icons, boxes) | Low (text, dividers) | -60% |
| Context display | Always visible | Collapsed (link) | -80% |
| Data suggestions | 3 separate items | 1 row of buttons | -66% |
| Total height | ~400px | ~250px | -37% |

---

## ✅ Summary

### 1. What's NOT Editable:
- **Sidebar:** Question prompts (until Phase 3), answers, status
- **Editor:** Section title, description, question prompt (shown read-only)

### 2. Prompt Simplification:
- **Template:** 200-550 chars, 5-7 questions
- **Simplified:** 20-36 chars, 1 question
- **Reduction:** ~90% shorter

### 3. Panel Simplification:
- **Current:** 3 sections with headers, always-visible context
- **Simplified:** No headers, collapsed context, inline buttons
- **Reduction:** ~37% less height, 60% less visual weight

**The simplified design focuses on actions, not information hierarchy.**

