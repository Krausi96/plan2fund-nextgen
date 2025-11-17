# Editor Interactivity & Integration Improvements

**Current State Analysis:**
- Sections are saved to localStorage individually
- Sections don't interact with each other
- Charts/tables are separate from text content
- Section navigation is basic

---

## ✅ IMPLEMENTED IMPROVEMENTS

### 1. Enhanced Section Navigation Bar
**Status: ✅ COMPLETE**

- **More Visible Design:**
  - Larger, more prominent section tabs with better spacing
  - Gradient background (white to gray-50) with blue border
  - Color-coded tabs based on completion status:
    - 🟢 Green (✓) = Complete (100%)
    - 🟡 Yellow (⚠) = In Progress (1-99%)
    - ⚪ Gray (○) = Not Started (0%)
  - Active section highlighted with blue background and scale transform
  - Progress percentage shown on in-progress sections

- **Improved Progress Bar:**
  - Larger height (h-4 instead of h-2)
  - Gradient fill (blue → purple → pink)
  - Percentage displayed inside bar when > 10%
  - Section breakdown badges showing:
    - ✓ Complete count
    - ⚠ In Progress count
    - ○ Not Started count

### 2. Cross-Section References
**Status: ✅ COMPLETE**

- Automatically detects when other sections mention the current section
- Shows a purple info box with clickable links to referencing sections
- Displays mention count for each reference
- Click to jump directly to the referencing section

### 3. Better Tables & Charts Integration
**Status: ✅ COMPLETE**

- Tables/charts now appear in a prominent, integrated section
- Clear visual hierarchy with blue borders and shadows
- "Add Another Table" button when tables exist
- Better messaging about how tables and charts connect
- More prominent "Add Table" button with icons

---

## 🔄 Section Interactions

### Current: Sections are Isolated
- Each section saves independently
- No cross-section references
- AI generation uses other sections for context, but doesn't create links

### ✅ Implemented: Cross-Section References
- **Auto-detection:** Finds sections that mention the current section title
- **Visual indicators:** Purple info box shows references
- **Quick navigation:** Click to jump to referencing section
- **Mention count:** Shows how many times each section is referenced

#### 2. Data Flow Between Sections
- Financial data from "Financial Plan" → auto-populate "Use of Funds"
- Team members from "Team" → appear in "Consortium Partners"
- Market data → used in "Market Opportunity"

#### 3. Smart Suggestions
- "You mentioned X in Executive Summary, expand in Market Analysis"
- "Financial Plan has revenue data, use it in Use of Funds"
- "Team section has 5 members, mention them in Consortium"

---

## 💾 Storage Architecture

### Current: localStorage Only ✅
```
localStorage:
  - planSections: Array of sections (with tables, charts, figures)
  - selectedProgram: Program data
  - userAnswers: Wizard answers
  - plan_conversations: AI conversation history per section
```

**How Sections are Saved:**
- Each section saves independently via `savePlanSections()` (debounced 300ms)
- Sections include: `id`, `title`, `content`, `tables`, `figures`, `chartTypes`, `sources`, `fields`
- Auto-saves on any content/table/chart change
- Session-based storage keys (prevents conflicts between users)

### Proposed: Enhanced Storage (Future)
```
localStorage:
  - planSections: Array with cross-references
  - planMetadata: Plan-level data (title, program, etc.)
  - sectionRelations: Map of section dependencies
  - planVersion: Version history
```

---

## 📊 Charts & Tables Integration

### ✅ Current Implementation
- Tables/charts appear in a dedicated, prominent section below text
- Clear visual separation with blue borders and shadows
- Charts auto-generate from table data
- Integrated UI with "Add Table" and "Add Another Table" buttons
- Helpful messages explain how tables → charts work

### How It Works:
1. **Create Table:** Click "Add Table" → Choose table type → Fill data
2. **Auto-Chart:** Chart automatically generates from table data
3. **Edit:** Change table → Chart updates automatically
4. **Chart Types:** Can change chart type (bar, line, pie) per table

### Proposed: Inline Integration (Future)

#### 1. Inline Table Insertion
- Insert tables directly in text (like images in Word)
- Tables appear where you place them
- Charts appear next to tables

#### 2. Smart Placement
- AI suggests where to add tables
- "Add revenue table here" prompts
- Drag-and-drop table positioning

#### 3. Data-Driven Content
- Text references table data: "As shown in Table 1, revenue grows..."
- Auto-update text when table changes
- Smart formatting based on data

---

## 🎨 Section Navigation Improvements

### ✅ IMPLEMENTED

#### 1. More Visible Section Bar ✅
- ✅ Larger, more prominent design with gradient background
- ✅ Better spacing and padding
- ✅ Color-coded by completion (green/yellow/gray)
- ✅ Hover effects with shadow transitions
- ✅ Active section highlighted with scale transform
- ✅ Progress percentage shown on in-progress tabs

#### 2. Better Progress Indicator ✅
- ✅ Larger progress bar (h-4 with gradient fill)
- ✅ Section-by-section breakdown badges
- ✅ Visual completion indicators (✓/⚠/○)
- ✅ Percentage displayed inside progress bar

#### 3. Quick Navigation (Future)
- Section search/jump
- Keyboard shortcuts
- Recent sections
- Bookmarked sections

---

## 🚀 Implementation Status

### ✅ Phase 1: Quick Wins - COMPLETE
1. ✅ Make section bar more visible
2. ✅ Improve progress bar
3. ✅ Better chart/table integration UI
4. ✅ Cross-section linking (basic detection)

### 🔄 Phase 2: Interactivity - IN PROGRESS
1. ⏳ Data flow between sections (e.g., Financial → Use of Funds)
2. ⏳ Smart suggestions (AI-powered cross-section hints)
3. ⏳ Inline table insertion (drag-and-drop positioning)
4. ⏳ Section dependencies (explicit linking)

### ⏳ Phase 3: Advanced - PLANNED
1. Version history
2. Collaboration
3. Advanced analytics
4. Export improvements

---

## 📝 Technical Details

### Cross-Section Reference Detection
```typescript
// Automatically finds sections that mention the current section
const getCrossSectionReferences = useCallback(() => {
  const currentSection = sections[activeSection];
  // Searches for current section title in other sections' content
  // Returns array of { section, index, mentions }
}, [sections, activeSection]);
```

### Section Storage
- **Location:** `shared/user/storage/planStore.ts`
- **Function:** `savePlanSections(sections: PlanSection[])`
- **Debounce:** 300ms (auto-saves after user stops typing)
- **Format:** `{ v: 1, sections: [...] }` with session-based keys

### Progress Calculation
- Uses `calculateSectionProgress()` utility
- Based on requirements met, not just word count
- Overall progress = average of all section progress percentages

