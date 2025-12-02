# InlineSectionEditor Redesign Proposal

**Date:** 2024  
**Status:** DRAFT - For Review  
**Issues to Address:**
1. Last section cut off in sidebar
2. Confusing AI/Data/Context tabs - need merging
3. Sidebar editing only changes description (useless)
4. Editor cut off on full page
5. Freemium content visibility
6. Simplify overall structure

---

## 🔍 Current State Analysis

### **What Sidebar Editing Actually Does:**
- Edits `SectionTemplate.title` and `SectionTemplate.description`
- Creates custom section copy when saving
- `Section.description` flows to InlineSectionEditor as "Section Guidance"
- **Problem:** Only affects description shown in editor, doesn't change questions or structure

### **Template Structure (from template file):**
```
Section: "2. Produkt / Dienstleistung"
  ├── Question 2.1: "Produkt / Dienstleistungsbeschreibung & Entwicklungsstand"
  ├── Question 2.2: "Kundennutzen"
  ├── Question 2.3: "USP, Stärken & Schwächen"
  ├── Question 2.4: "Innovationsgrad"
  ├── Question 2.5: "Markenschutz und Patente"
  └── Question 2.6: "Leistungserstellung"
```

### **Current InlineSectionEditor Structure:**
- Header: Section title + expandable description
- Question navigation pills
- Question prompt (simplified)
- Textarea for answer
- **Tabs:** AI | Data | Context (confusing separation)

---

## 💡 Proposed Solutions

### **1. Fix Sidebar Last Section Cut-Off**

**Root Cause:** Padding wrapper has `minHeight: '100%'` which doesn't account for scroll container height.

**Fix:**
```typescript
// Remove minHeight from wrapper, rely on content height
<div style={{ paddingBottom: '80px' }}> // Increased padding
  <SectionNavigationTree ... />
</div>
```

**Also check:** Ensure scrollable container doesn't have height constraints cutting off content.

---

### **2. Merge AI/Data/Context into Unified Assistant Panel**

**Current Problem:**
- Three separate tabs create confusion
- Users don't understand when to use which
- Data and Context are rarely used

**Proposed Solution: Single "Assistant" Panel**

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
│ [Ask AI...] [Send]                  │
└─────────────────────────────────────┘
```

**Benefits:**
- Single place for all help
- AI can suggest data/context when relevant
- Less cognitive load
- More space for content

**Implementation:**
- Remove tabs
- Single scrollable panel
- AI suggestions include data/context recommendations
- Data creation buttons inline when AI suggests them

---

### **3. Sidebar Editing - What Should Be Editable?**

**Current:** Only title and description (useless)

**Proposed Options:**

#### **Option A: Remove Sidebar Editing Entirely**
- Sidebar = navigation only
- All editing happens in InlineSectionEditor
- **Pros:** Simpler, less confusion
- **Cons:** Can't customize section names

#### **Option B: Make Sidebar Editing Useful**
**Editable in Sidebar:**
- ✅ Section Title (affects preview heading)
- ✅ Section Description (affects "Section Guidance" in editor)
- ✅ **Question Order** (reorder questions within section)
- ✅ **Question Visibility** (show/hide specific questions)
- ✅ **Custom Question Prompts** (override template prompts)

**Editable in InlineSectionEditor:**
- ✅ Question Answers
- ✅ Question Status
- ✅ Data Attachments

**Pros:** More control, useful customization
**Cons:** More complex, might confuse users

#### **Option C: Hybrid Approach (RECOMMENDED)**
**Sidebar:**
- ✅ Section Title (quick rename)
- ✅ Section Enabled/Disabled
- ❌ Remove description editing (not useful)

**InlineSectionEditor:**
- ✅ All question editing
- ✅ Section description shown but not editable (from template)
- ✅ Question management (add/remove/reorder) via context menu

**Reasoning:**
- Section title is useful to customize
- Description comes from template (expert guidance)
- Question management belongs with questions

---

### **4. Editor Width & Freemium Content**

**Current:** 320px width, cut off on full page

**Proposed:**
- **Width:** Increase to `380px` (better for content)
- **Max Height:** Keep `360px` but ensure tabs visible
- **Freemium Content Visibility:**

```
┌─────────────────────────────────────┐
│ Question Prompt                      │
│                                     │
│ [Textarea - First 3 lines visible]    │
│ ...                                 │
│ [🔒 Continue reading with Pro]      │ ← Freemium gate
│                                     │
│ [Tabs: AI | Data | Context]         │
└─────────────────────────────────────┘
```

**Implementation:**
- Show first ~150 characters of answer
- Show "🔒 Unlock full editor" button
- On click: Show upgrade modal or unlock if paid
- Full editor only for paid users

**Alternative:** Show full editor but limit AI/data features for free users.

---

### **5. Simplified Structure Proposal**

**New InlineSectionEditor Layout:**

```
┌─────────────────────────────────────┐
│ 2. Produkt / Dienstleistung    [✕] │
│ [📋 Section Guidance ▼]             │
├─────────────────────────────────────┤
│ Questions: [1] [2] [3] [4] [5] [6]  │
│            └─ Active ─┘               │
├─────────────────────────────────────┤
│ "Describe your product or service"  │
│                                     │
│ [Status Badges]                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Textarea - Answer]                │ │
│ │ (First 3 lines for free users)   │ │
│ │ [🔒 Unlock full editor]          │ │
│ └─────────────────────────────────┘ │
│ [150 words] [Auto-saved 2s ago]     │
├─────────────────────────────────────┤
│ 💬 Assistant                         │
│ [✨ Draft] [📈 Improve]              │
│                                     │
│ 💡 AI Suggestions:                  │
│ "Consider mentioning..."            │
│                                     │
│ 📊 Suggested: Table, KPI            │
│                                     │
│ [Ask AI...] [Send]                  │
├─────────────────────────────────────┤
│ [✓ Complete] [Skip] [Next →]        │
└─────────────────────────────────────┘
```

**Key Changes:**
1. ✅ Removed separate tabs - single Assistant panel
2. ✅ AI, data suggestions, and context all in one place
3. ✅ Freemium gate on textarea (first 3 lines visible)
4. ✅ Wider editor (380px)
5. ✅ Clearer question focus

---

## 📋 Implementation Plan

### **Phase 1: Fix Critical Issues**
1. ✅ Fix sidebar last section padding (increase to 80px, remove minHeight)
2. ✅ Increase editor width to 380px
3. ✅ Ensure editor doesn't get cut off (check parent containers)

### **Phase 2: Simplify Tabs**
1. ✅ Remove AI/Data/Context tabs
2. ✅ Create unified "Assistant" panel
3. ✅ Merge AI suggestions, data recommendations, context info
4. ✅ Update AI to suggest data/context when relevant

### **Phase 3: Sidebar Editing Cleanup**
1. ✅ Remove description editing from sidebar (keep title only)
2. ✅ Or: Remove sidebar editing entirely if not useful
3. ✅ Document what's editable where

### **Phase 4: Freemium Content**
1. ✅ Add content visibility check (free vs paid)
2. ✅ Show partial answer for free users
3. ✅ Add unlock/upgrade button
4. ✅ Full editor for paid users

---

## 🎯 Recommended Approach

### **Sidebar Editing:**
**Recommendation:** **Option C (Hybrid)**
- Keep section title editing (useful)
- Remove description editing (not useful, comes from template)
- Keep enable/disable toggle
- Question management stays in editor

### **Tabs:**
**Recommendation:** **Merge into single Assistant panel**
- Less confusion
- Better UX
- AI can suggest everything in one place

### **Editor Width:**
**Recommendation:** **380px**
- Better for content
- Still compact
- Check parent container constraints

### **Freemium:**
**Recommendation:** **Show partial content + unlock button**
- First 3 lines visible
- "🔒 Continue with Pro" button
- Full editor unlocks on payment

---

## ❓ Questions to Answer

1. **Sidebar editing:** Keep title only, or remove entirely?
2. **Freemium gate:** On textarea only, or entire editor?
3. **Assistant panel:** How to organize AI suggestions vs data suggestions?
4. **Question management:** Should users be able to add/remove questions?
5. **Template questions:** Should sidebar editing allow customizing question prompts?

---

## 📝 Next Steps

1. Review this proposal
2. Decide on sidebar editing approach
3. Confirm freemium strategy
4. Approve unified Assistant panel design
5. Implement Phase 1 (critical fixes) first
6. Then Phase 2-4 based on decisions

---

**This is a draft proposal - awaiting feedback before implementation.**

