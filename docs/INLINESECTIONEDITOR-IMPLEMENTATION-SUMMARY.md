# InlineSectionEditor Implementation Summary

**Date:** 2024  
**Status:** Implementation Plan  
**Focus Areas:**
1. Unified Assistant Panel (Phase 2)
2. Sidebar Editing & Question Management (Phase 3)
3. Freemium Content Visibility (Phase 4)

---

## 1. Unified Assistant Panel (Phase 2)

### Current Problem
- Three separate tabs (AI | Data | Context) create confusion
- Users don't understand when to use which tab
- Data and Context tabs are rarely used
- Cognitive load from switching between tabs

### Proposed Solution: Single "Assistant" Panel

#### Visual Design
```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft] [📈 Improve]              │ ← Quick actions
│                                     │
│ 💡 AI Suggestions:                  │
│ "Consider adding..."                │
│                                     │
│ 📊 Suggested Data:                  │
│ • Table: Financial projections      │
│ • KPI: Monthly revenue              │
│                                     │
│ 📋 Context:                         │
│ Template guidance shown here        │
│                                     │
│ [Ask AI...] [Send]                  │
└─────────────────────────────────────┘
```

### Real-World Example

**Section:** 2. Produkt / Dienstleistung  
**Question:** 2.1 Produkt / Dienstleistungsbeschreibung & Entwicklungsstand

**Template Prompt (from template file):**
> "Beschreiben Sie detailliert Ihr Produkt- / Dienstleistungsangebot. Wie ist der aktuelle Entwicklungsstand? Liegt bereits ein Prototyp oder Proof of Concept vor? Muss dieser erst entwickelt werden? Oder haben Sie bereits die erste Kleinserie produziert? Gibt es erste Kunden? Beschreiben Sie auch, wie Ihre Produkte oder Dienstleistungen zukunftsfit gestaltet sind und welche nachhaltigen Materialien und Prozesse verwendet werden."

**Unified Assistant Panel Content:**

```
┌─────────────────────────────────────┐
│ 💬 Assistant                        │
├─────────────────────────────────────┤
│ [✨ Draft Answer] [📈 Improve]      │
│                                     │
│ 💡 AI Suggestions:                  │
│ "Consider mentioning:               │
│  • Current development stage        │
│    (prototype, proof of concept,   │
│     first production run)            │
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

### How It Works

1. **AI Analysis**
   - AI analyzes the question prompt from template
   - Generates contextual suggestions based on question content
   - Suggests relevant data types (tables, KPIs, media) when appropriate

2. **Data Suggestions**
   - AI identifies when data would be helpful
   - Shows inline "Create" buttons for suggested data types
   - User can create data directly from suggestions

3. **Context Display**
   - Template guidance shown automatically (read-only)
   - Helps users understand what's expected
   - No need to switch tabs to see guidance

4. **Single Scrollable Panel**
   - All help in one place
   - No tab switching required
   - Better use of vertical space

### Implementation Details

**Remove:**
- Tab headers (AI | Data | Context)
- Tab state management
- Separate tab content sections

**Add:**
- Single scrollable panel
- AI suggestions section with data recommendations
- Inline data creation buttons
- Context section showing template guidance
- Unified input for AI questions

**AI Integration:**
- Update AI to analyze question prompts
- Generate suggestions that include data/context recommendations
- Show data creation options when AI suggests them

---

## 2. Sidebar Editing & Question Management (Phase 3)

### Current State
- Sidebar editing only changes `SectionTemplate.title` and `SectionTemplate.description`
- Creates custom section copy when saving
- **Problem:** Only affects description shown in editor, doesn't change questions or structure
- No way to customize question prompts
- No way to manage questions (add/remove/reorder)

### Proposed Solution: Enhanced Sidebar Editing

#### What Should Be Editable in Sidebar

**✅ Keep:**
- Section Title (useful for customization)
- Section Enable/Disable toggle (already exists)

**✅ Add:**
- Question Prompt Customization (override template prompts)
- Question Visibility Toggle (show/hide specific questions)
- Question Reordering (drag-and-drop)

**❌ Remove:**
- Section Description editing (not useful, comes from template as expert guidance)

#### Implementation Approach

**Option A: Keywords/Tags Approach**
- Sidebar shows question keywords extracted from template
- User can edit keywords to customize prompts
- AI uses keywords to generate contextual suggestions
- **Pros:** Simple, flexible
- **Cons:** Less structured, harder to understand

**Option B: Real Template Prompts (RECOMMENDED)**
- Sidebar shows actual question prompts from template
- User can edit prompts directly
- Changes override template defaults
- Store custom prompts in plan metadata
- **Pros:** Full control, clear what's being edited, matches user expectations
- **Cons:** More complex implementation

### Recommended: Real Template Prompts (Option B)

#### Visual Design

**Sidebar Edit Form:**
```
┌─────────────────────────────────────┐
│ ✏️ Edit Section: Produkt /           │
│    Dienstleistung                    │
├─────────────────────────────────────┤
│ Section Title:                       │
│ [Produkt / Dienstleistung      ]    │
│                                     │
│ Questions:                           │
│ ┌─────────────────────────────────┐ │
│ │ ☰ 2.1 Produkt / Dienstleistungs-│ │
│ │    beschreibung & Entwicklungs- │ │
│ │    stand                         │ │
│ │ [Edit prompt...] [👁️] [↑↓]      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ☰ 2.2 Kundennutzen              │ │
│ │ [Edit prompt...] [👁️] [↑↓]      │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
│                                     │
│ [Save] [Cancel]                     │
└─────────────────────────────────────┘
```

#### Data Structure

```typescript
interface SectionCustomization {
  sectionId: string;
  customTitle?: string; // Override template title
  questions: {
    questionId: string;
    customPrompt?: string; // Override template prompt
    visible: boolean; // Show/hide question
    order: number; // Reorder questions
  }[];
}
```

#### Implementation Flow

1. **User clicks ✏️ on section in sidebar**
   - Opens edit form
   - Loads template questions
   - Loads any existing customizations from plan metadata

2. **Edit Form Shows:**
   - Section title (editable text input)
   - List of questions with:
     - **Prompt text** (editable textarea - shows template default, can override)
     - **Visibility toggle** (👁️ button - show/hide question)
     - **Drag handle** (☰ icon - reorder questions)

3. **User Makes Changes:**
   - Edits section title
   - Edits question prompts (optional - overrides template)
   - Toggles question visibility
   - Reorders questions via drag-and-drop

4. **Save Changes:**
   - Stores customizations in plan metadata
   - Updates section display in sidebar
   - Updates InlineSectionEditor to use custom prompts

5. **InlineSectionEditor Uses:**
   - Custom prompts if set, otherwise template defaults
   - Only shows visible questions
   - Questions appear in custom order

#### Question Management Features

**Question Prompt Editing:**
- Show template prompt as default
- Allow user to edit/override
- Store custom prompt in plan metadata
- Use custom prompt in InlineSectionEditor if available

**Question Visibility:**
- Toggle to show/hide questions
- Hidden questions don't appear in InlineSectionEditor
- Still stored in plan, just not displayed
- Useful for customizing template to specific needs

**Question Reordering:**
- Drag-and-drop interface
- Store order in plan metadata
- Questions appear in custom order in InlineSectionEditor
- Maintains question IDs, just changes display order

#### Example Use Case

**Template has 6 questions:**
1. Produkt / Dienstleistungsbeschreibung & Entwicklungsstand
2. Kundennutzen
3. USP, Stärken & Schwächen
4. Innovationsgrad
5. Markenschutz und Patente
6. Leistungserstellung

**User customizes:**
- Edits question 1 prompt to be more specific to their product
- Hides question 5 (no patents for this product)
- Reorders: 1, 3, 2, 4, 6 (moves USP before Kundennutzen)

**Result:**
- InlineSectionEditor shows 5 questions (question 5 hidden)
- Questions appear in custom order
- Question 1 uses custom prompt
- Other questions use template defaults

---

## 3. Freemium Content Visibility (Phase 4)

### Goal
Limit editor access for free users while showing enough content to demonstrate value. Encourage upgrade to Pro for full functionality.

### Implementation Strategy

#### Content Visibility Check

**User Type Detection:**
```typescript
interface UserSubscription {
  isPaid: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  features: {
    fullEditor: boolean;
    aiAssistance: boolean;
    dataCreation: boolean;
    export: boolean;
  };
}
```

**Check on Editor Load:**
- Detect user subscription status
- Show appropriate UI based on tier
- Store subscription status in context/store

#### Partial Content Display

**For Free Users:**

**Textarea Display:**
```
┌─────────────────────────────────────┐
│ Question Prompt                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [First 3 lines of answer visible]│ │
│ │ Lorem ipsum dolor sit amet,     │ │
│ │ consectetur adipiscing elit...   │ │
│ │ ...                              │ │
│ │ [🔒 Continue reading with Pro]   │ │ ← Freemium gate
│ └─────────────────────────────────┘ │
│                                     │
│ [150 words] [Auto-saved 2s ago]     │
└─────────────────────────────────────┘
```

**Implementation:**
- Show first ~150 characters (approximately 3 lines)
- Calculate character count or line count
- Show "..." or fade effect after limit
- Display unlock button prominently

**Character Limit:**
- First 150 characters visible
- Rest hidden behind gate
- Count includes whitespace for accurate display

#### Unlock Functionality

**Unlock Button:**
- Text: "🔒 Continue reading with Pro" or "🔒 Unlock full editor"
- Prominent styling (blue/primary color)
- Positioned after visible content

**On Click:**
1. **If Free User:**
   - Show upgrade modal
   - Highlight Pro features
   - Direct to subscription/checkout page
   - Track conversion event

2. **If Paid User:**
   - Unlock editor immediately
   - Show full content
   - No modal needed (edge case - user upgraded mid-session)

**Upgrade Modal Content:**
```
┌─────────────────────────────────────┐
│ 🔒 Unlock Full Editor                │
├─────────────────────────────────────┤
│ Upgrade to Pro to:                  │
│                                     │
│ ✅ Edit full answers                │
│ ✅ AI assistance                    │
│ ✅ Create data tables & KPIs        │
│ ✅ Export business plan             │
│ ✅ Unlimited questions              │
│                                     │
│ [Upgrade to Pro] [Maybe Later]      │
└─────────────────────────────────────┘
```

#### Full Editor Access for Paid Users

**For Pro Users:**
- Full textarea visible (no character limit)
- All features enabled
- No unlock buttons
- Full AI assistance
- All data creation features

#### Implementation Details

**Component Structure:**
```typescript
interface FreemiumGateProps {
  content: string;
  isPaid: boolean;
  onUpgrade: () => void;
  maxVisibleChars?: number; // Default: 150
}

function FreemiumTextarea({ content, isPaid, onUpgrade, maxVisibleChars = 150 }) {
  if (isPaid) {
    return <FullTextarea content={content} />;
  }
  
  const visibleContent = content.substring(0, maxVisibleChars);
  const isTruncated = content.length > maxVisibleChars;
  
  return (
    <div>
      <Textarea value={visibleContent} readOnly />
      {isTruncated && (
        <UnlockButton onClick={onUpgrade} />
      )}
    </div>
  );
}
```

**Feature Gating:**
- Textarea: Partial content for free
- AI Assistance: Limited or disabled for free
- Data Creation: Disabled for free
- Export: Disabled for free

**User Experience:**
- Free users can see enough to understand value
- Clear upgrade path
- No frustration from completely blocked content
- Smooth upgrade flow

#### Alternative Approaches Considered

**Option A: Show Full Editor, Limit Features**
- Show full textarea
- Disable AI/data features
- **Pros:** Less frustrating
- **Cons:** Less incentive to upgrade

**Option B: Partial Content + Unlock (RECOMMENDED)**
- Show first 3 lines
- Unlock button for full access
- **Pros:** Clear value proposition, encourages upgrade
- **Cons:** Slightly more restrictive

**Option C: Time-Based Trial**
- Full access for X days
- Then require upgrade
- **Pros:** Users can try everything
- **Cons:** Complex to implement, may reduce urgency

### Recommended: Option B (Partial Content + Unlock)

This approach provides the best balance between:
- Showing enough value to engage users
- Creating clear upgrade incentive
- Maintaining good user experience
- Simple implementation

---

## Implementation Priority

### Phase 2: Unified Assistant Panel
**Priority:** High  
**Effort:** Medium  
**Impact:** High UX improvement

### Phase 3: Sidebar Editing & Question Management
**Priority:** Medium  
**Effort:** High  
**Impact:** High customization capability

### Phase 4: Freemium Content Visibility
**Priority:** High  
**Effort:** Medium  
**Impact:** Critical for monetization

---

## Next Steps

1. **Review and approve this implementation plan**
2. **Phase 2:** Implement unified Assistant panel
3. **Phase 3:** Implement enhanced sidebar editing
4. **Phase 4:** Implement freemium content gating
5. **Testing:** User testing for each phase
6. **Iteration:** Refine based on feedback

---

**This document serves as the implementation guide for the InlineSectionEditor redesign phases 2, 3, and 4.**

