# Editor Layout v3 - Final Specification

## Overview

The editor uses a **horizontal two-column layout**:
- **Left Column (~60% width):** Primary editor workspace with section header, sections navigation bar, and all prompt blocks. Scrolls vertically as content grows.
- **Right Column (~360px width, sticky):** Contextual panel with three tabs (Assistant, Data, Preview) providing AI help, data management, and preview/requirements. Scrolls independently from the main editor.

All prompts within a section are shown in a single scrollable workspace in the left column, with quick navigation via section chips.

---

## Header & Navigation

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER (gradient, sticky)                                                 │
│ Business Plan Editor                              Program Selector         │
│                                                      🎯 Product | 📋 Program│
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ SECTION NAVIGATION BAR                                                     │
│ [←] [01 Executive ✓] [02 Market ⚠] [03 Project ○] … [→]                   │
└────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Header:** Title + Program Selector (Product + Program dropdowns only; Route removed)
- **No Breadcrumbs:** Breadcrumbs removed from editor page
- **Section Navigation:** Horizontal scrollable tabs showing all sections with status indicators (✓ complete, ⚠ partial, ○ empty)
  - **Last item:** "Front & back matter" - Opens AncillaryWorkspace for title page, TOC, citations, etc.

---

## Main Workspace Layout

### Structure (Two-Column Horizontal Layout)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PRIMARY EDITOR COLUMN (left, ~60% width)              │  RIGHT PANEL (right, ~360px width, sticky)      │
│                                                        │                                                  │
│ ┌──────────────────────────────────────────────────┐  │  ┌──────────────────────────────────────────┐  │
│ │ SECTION HEADER                                   │  │  │ [Assistant] [Data] [Preview]             │  │
│ │ • Category tag  • Title  • Description           │  │  └──────────────────────────────────────────┘  │
│ ├──────────────────────────────────────────────────┤  │                                                  │
│ │ PROMPT NAVIGATION BAR                            │  │  [Active tab content scrolls here]            │
│ │ [Q01] [Q02] [Q03] … (active highlighted)        │  │  • Assistant: AI help, suggestions           │
│ │ (click chip to switch prompts in same block)     │  │  • Data: Tables, KPIs, media management      │
│ ├──────────────────────────────────────────────────┤  │  • Preview: Section preview + requirements   │
│ │ SINGLE PROMPT BLOCK (shows active prompt only)   │  │                                                  │
│ │ ┌────────────────────────────────────────────┐  │  │                                                  │
│ │ │ Prompt Title (with "Required" badge)        │  │  │                                                  │
│ │ │                                              │  │  │                                                  │
│ │ │ ┌────── Rich Text Editor ────────────────┐  │  │  │                                                  │
│ │ │ │ (SimpleTextEditor - auto-saves)         │  │  │  │                                                  │
│ │ │ │ [User types answer here...]             │  │  │  │                                                  │
│ │ │ └─────────────────────────────────────────┘  │  │  │                                                  │
│ │ │                                              │  │  │                                                  │
│ │ │ Actions: [✨ Generate] [⏭ Skip]              │  │  │                                                  │
│ │ └────────────────────────────────────────────┘  │  │                                                  │
│ │ (Block updates when user clicks different chip)  │  │                                                  │
│ │                                                  │  │                                                  │
│ └──────────────────────────────────────────────────┘  │                                                  │
│                                                        │                                                  │
└────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

**Layout Description:**
- **Left Column (Primary Editor):** Contains the section header, prompt navigation bar, and a single prompt block that updates when user switches prompts. Takes up approximately 60% of the available width. The prompt block shows one prompt at a time.
- **Right Column (Contextual Panel):** Fixed width of ~360px, sticky positioned. Contains three tabs (Assistant, Data, Preview) that provide contextual help and tools. Scrolls independently from the main editor. Updates automatically when user switches prompts.
- **Responsive Behavior:** On smaller screens, the right panel can collapse or move below the editor column.

### Key Features

1. **Section Header:** Always visible at top, shows category, title, and description
2. **Prompt Navigation Bar:** Horizontal scrollable chips (Q01, Q02, Q03...) for switching between prompts within the section
3. **Single Prompt Block:** Only ONE prompt is visible at a time. The same block updates when user clicks a different navigation chip.
4. **Prompt Block Contains:**
   - Prompt title (with "Required" badge if applicable)
   - Rich text editor (full answer area, auto-saves on change)
   - Action buttons **directly below** the editor: `[✨ Generate for this prompt]` and `[⏭ Skip]`
5. **Auto-save:** Answers are automatically saved as the user types

---

## Complete User Workflows

### Workflow 1: Basic Writing (No AI, No Data)

**Step-by-Step:**
1. User opens section → Sees section header + prompt navigation chips
2. First prompt (Q01) appears in prompt block
3. User types answer in editor → Auto-saves as they type
4. User clicks Q02 chip → Prompt block updates to show Q02
5. User types answer for Q02 → Auto-saves
6. User continues for all prompts
7. **Done** - User never uses AI or data features

**Key Point:** User can complete entire plan without ever opening right panel tabs.

---

### Workflow 2: Writing with AI Assistance

**Step-by-Step:**
1. User opens section → Sees Q01 prompt
2. User starts typing answer → Gets stuck after 2 sentences
3. User clicks `[✨ Generate for this prompt]` button
4. **AI generates in background** (user can continue typing if they want)
5. User opens **Right Panel → Assistant tab** (optional, to see result)
6. AI suggestion appears in Assistant tab
7. User clicks "Insert" → Suggestion added to editor
8. User edits/refines the combined text
9. User continues to next prompt

**Key Point:** AI only appears when user clicks button, never interrupts writing.

---

### Workflow 3: Adding Financial Tables

**Step-by-Step:**
1. User is in Financial section, working on Q01
2. User opens **Right Panel → Data tab**
3. User clicks `[📊 Add Table]` → Modal opens
4. User creates "Revenue Projections" table:
   - Enters name
   - Selects structure (financial table)
   - Defines columns (Year 1, Year 2, Year 3)
   - Adds rows (Product A, Product B, Total)
5. User customizes table:
   - Clicks `[Edit]` → Opens table editor
   - Changes header colors
   - Formats numbers as currency
   - Adds calculations (auto-sum)
6. Table appears in Data tab → Datasets list
7. User clicks `[Attach]` next to table → Attaches to Q01
8. User continues writing Q01 answer: "As shown in the table below..."
9. **In final plan:** Table appears after Q01's text answer

**Key Point:** Tables are created, customized, then attached to prompts. They appear automatically in final document.

---

### Workflow 4: Adding Multiple Charts with Customization

**Step-by-Step:**
1. User creates "Revenue Growth Chart" from table data
2. User clicks `[Edit]` on chart → Opens chart editor
3. User customizes:
   - **X-axis:** Label = "Year", Scale = 0-3, Format = Integer
   - **Y-axis:** Label = "Revenue (€)", Scale = 0-1.5M, Format = Currency
   - **Colors:** Series 1 = Blue, Series 2 = Green, Background = White
   - **Chart type:** Changes from Bar to Line chart
   - **Labels:** Adds title, customizes legend position
4. User saves → Chart appears in Data tab
5. User creates second chart "Expense Trend" → Customizes differently
6. User attaches both charts to different prompts
7. **In final plan:** Each chart appears with its custom styling

**Key Point:** Each chart/table is independently customizable. Colors, axes, labels all per-item.

---

### Workflow 5: Checking Requirements (Optional)

**Step-by-Step:**
1. User completes section (all prompts answered)
2. User opens **Right Panel → Preview tab** (optional)
3. User clicks `[Run requirements check]` button
4. Check runs → Results appear below preview
5. User sees: "2 mandatory fields missing"
6. User reviews issues → Fixes by editing answers
7. User clicks "Run check" again → Status updates
8. **OR** user ignores issues and continues to next section

**Key Point:** Requirements check only runs when user clicks button. Never runs automatically.

---

## User Flow & AI-Assisted Writing

### What the User Sees When They Enter

**Initial State:**
1. User opens a section (e.g., "Executive Summary")
2. **Section Header** appears at top with category, title, and description
3. **Prompt Navigation Bar** shows chips for all prompts in this section (e.g., [Q01] [Q02] [Q03])
4. **Single Prompt Block** displays the first prompt (Q01) by default:
   - Prompt title with "Required" badge (if applicable)
   - Empty text editor with placeholder
   - Two action buttons: `[✨ Generate for this prompt]` and `[⏭ Skip]`
5. **Right Panel** shows Assistant tab with:
   - "Ask the assistant" button (disabled until prompt is selected)
   - Context area showing current prompt text

### How AI-Assisted Writing Works

**Option 1: User Writes Manually First**
1. User starts typing in the editor → Content auto-saves as they type
2. User can click `[✨ Generate for this prompt]` at any time
3. AI reads:
   - Current prompt text
   - What user has already written (context)
   - Previous sections' content (cross-section awareness)
   - Program requirements
4. AI generates a complete answer for this specific prompt
5. Generated content appears in the **Assistant tab** (right panel)
6. User can:
   - Click "Insert" to add AI suggestion to editor
   - Edit the AI suggestion in Assistant tab
   - Continue writing manually

**Option 2: User Generates First**
1. User clicks `[✨ Generate for this prompt]` on empty editor
2. AI generates complete answer based on:
   - Prompt requirements
   - Previous sections (if any)
   - Program context
3. Generated content appears in **Assistant tab**
4. User clicks "Insert" → Content fills the editor
5. User can then edit, refine, or regenerate

**Option 3: Iterative Refinement**
1. User writes partial answer (e.g., 2 sentences)
2. User clicks `[✨ Generate for this prompt]` again
3. AI uses existing text as context and generates a more complete answer
4. User can insert, edit, or continue writing

### Navigation Between Prompts

**How It Works:**
1. **Prompt Navigation Bar** shows all prompts in the current section as chips: `[Q01] [Q02] [Q03] ...`
2. **Active prompt** is highlighted (blue background)
3. User clicks a different chip (e.g., clicks Q02)
4. **Single Prompt Block** updates instantly:
   - Prompt title changes to Q02's title
   - Editor shows Q02's saved answer (if any) or is empty
   - Action buttons remain the same
5. **Right Panel** automatically updates:
   - **Assistant tab** shows Q02's prompt text and answer preview
   - **Data tab** shows attachments available for Q02
   - **Preview tab** updates to show Q02's content in context
6. All answers are auto-saved per prompt when switching

**Visual Feedback:**
- Active chip is highlighted in blue
- Prompt block smoothly transitions to new prompt
- Right panel content updates without page reload

### Right Panel Integration

**Assistant Tab:**
- Shows currently active prompt's text
- Displays answer preview (first 200 chars) if user has written something
- Shows latest AI response with "Copy" / "Insert" buttons
- Updates automatically when user switches prompts

**Data Tab:**
- Shows datasets/KPIs/media available for current section
- User can attach items to the currently active prompt
- Attachments appear in the prompt block (if implemented)

**Preview Tab:**
- Shows formatted preview of current section
- Includes all prompts' answers
- Updates in real-time as user writes

---

## Detailed Workflows

### How Free Text and Prompts Interact

**The Relationship:**
- **Prompt** = The question/instruction (e.g., "Summarise your project in two to three sentences")
- **Free Text Editor** = Where user writes their answer to that prompt
- **Auto-save** = Answer is saved to that specific prompt automatically

**How They Work Together:**
1. **Prompt defines the context:** Each prompt asks for specific information
2. **User writes free text:** In the editor, user can write anything - no restrictions
3. **Answer is tied to prompt:** The text is saved as the answer to that specific prompt
4. **Switching prompts:** When user clicks a different chip, editor shows that prompt's saved answer
5. **Multiple prompts = Multiple answers:** Each prompt has its own independent answer

**Example Flow:**
- Q01: "Summarise your project" → User writes: "Our project aims to..."
- Q02: "Describe the market" → User writes: "The target market consists of..."
- When switching between Q01 and Q02, each shows its own saved answer

**No Cross-Contamination:**
- Answers are completely separate per prompt
- User can reference other prompts' answers manually (copy/paste)
- AI can see all prompts' answers when generating (cross-section awareness)

---

### How AI Assistant and Requirement Checker Work (Zero Interference)

**AI Assistant - Completely Optional:**

**Design Principle: Zero Interference**
- AI Assistant is **completely hidden** until user actively opens it
- **No automatic suggestions**
- **No banners or notifications**
- **No pop-ups or interruptions**

**How It Works:**
1. User writes freely in editor → No AI involvement
2. User **chooses** to use AI by:
   - Clicking `[✨ Generate for this prompt]` in prompt block
   - OR opening **Right Panel → Assistant tab** and clicking "Ask the assistant"
3. AI generates → Result appears **only in Assistant tab**
4. User can:
   - Click "Insert" to add suggestion to editor (user's choice)
   - Click "Copy" to copy
   - Ignore completely and continue writing
5. **User's text is NEVER touched** unless user explicitly clicks "Insert"

**Key Points:**
- AI never appears automatically
- AI never modifies user's text automatically
- AI suggestions are hidden in right panel (user must look there)
- User can write entire plan without ever using AI

**Requirement Checker - Completely Optional:**

**Design Principle: Zero Interference**
- Requirement checker is **completely hidden** until user actively opens it
- **No automatic checks**
- **No banners or warnings**
- **No notifications or pop-ups**

**How It Works:**
1. User writes freely → No requirement checking happens
2. User **chooses** to check requirements by:
   - Opening **Right Panel → Preview tab**
   - Clicking `[Run requirements check]` button
3. Check runs → Results appear **only in Preview tab**
4. User can:
   - Review issues (if any)
   - Fix them by editing answers
   - Ignore completely and continue writing
5. **No automatic re-checking** - only runs when user clicks button

**Key Points:**
- Requirements never check automatically
- Requirements never show warnings/banners automatically
- Requirements are completely hidden unless user opens Preview tab
- User can write entire plan without ever checking requirements

**Summary:**
- **AI Assistant:** Hidden in right panel, only appears when user clicks button, never interferes
- **Requirement Checker:** Hidden in Preview tab, only runs when user clicks button, never interferes
- **User has complete control:** Can write entire plan without AI or requirements ever appearing

---

### What Preview Shows (Essential Information Only)

**Preview Tab Content - Minimal & Focused:**

**Section Preview (Top - Condensed):**
- Shows **only the most important elements:**
  - Section title
  - **All prompts' answers** in sequence (condensed view)
  - **Key data items** (tables/charts) shown as thumbnails or references
- **Does NOT show:**
  - Full formatting details
  - Complete table data (shows table name/link only)
  - Full images (shows thumbnail only)
  - Section description (already visible in header)

**What It Looks Like:**
```
Executive Summary

Q01: [First 100 chars of answer...]
Q02: [First 100 chars of answer...]
📊 Revenue Table (attached)
Q03: [First 100 chars of answer...]
```

**Purpose:**
- Quick verification that content exists
- See structure and flow
- Spot missing prompts at a glance
- **NOT a full document preview** (use "Open full preview" for that)

**Actions:**
- `[Open full preview]` - Opens complete formatted preview in new page (/preview route)
- `[Export draft]` - Exports current section

**Requirements Summary (Below - Only When Checked):**
- **Hidden by default** - only appears after user clicks "Run requirements check"
- Shows:
  - Overall completion: "65% complete"
  - Critical issues only: "2 mandatory fields missing"
- **No automatic checking** - user must click button to see status

---

### How Users Add Data/Images/Financial Tables (Multiple Items Per Section)

**Yes, users can add multiple data items per section!**

**Complete Workflow:**

**Step 1: Create Multiple Data Items**
1. User opens **Right Panel → Data tab**
2. User clicks `[📊 Add Table]` → Creates "Revenue Projections" table
3. User clicks `[📊 Add Table]` again → Creates "Cost Breakdown" table
4. User clicks `[📈 Add KPI]` → Creates "Revenue Growth %" KPI
5. User clicks `[📷 Add Media]` → Uploads "Market Analysis Chart" image
6. **All items appear in Data tab lists** (organized by type: Datasets, KPIs, Media)

**Step 2: Customize Each Item**

**For Tables:**
- Edit structure: Add/remove columns and rows
- Format cells: Number formatting, currency, percentages
- Styling: Header colors, cell borders, alternating row colors
- Calculations: Auto-sum, formulas, KPIs within table

**For Charts/Graphs:**
- **Axis customization:**
  - X-axis: Label, scale, intervals, format
  - Y-axis: Label, scale, intervals, format
  - Dual axes (if needed)
- **Color customization:**
  - Data series colors (each line/bar can have different color)
  - Background color
  - Grid line colors
  - Legend colors
- **Chart type:** Bar, Line, Area, Pie, Scatter, etc.
- **Labels:** Title, axis labels, data labels, legend position

**For Images:**
- Crop/resize
- Add captions
- Alt text for accessibility
- Positioning options

**Step 3: Attach Items to Prompts**
1. User works on Q01 → Clicks "Attach" next to "Revenue Projections" table
2. Table is attached to Q01
3. User switches to Q02 → Clicks "Attach" next to "Cost Breakdown" table
4. Table is attached to Q02
5. **Same item can be attached to multiple prompts** if needed

**Step 4: Items Are Inserted Correctly in Business Plan**

**How Insertion Works:**
1. When item is attached to a prompt, it gets an **insertion point** in that prompt's answer
2. In the **final business plan document**, items appear:
   - **After the prompt's text answer** (if attached to prompt)
   - **In the order they were attached** (if multiple items attached to same prompt)
   - **With proper formatting** (tables formatted, charts rendered, images sized)

**Example Business Plan Structure:**
```
Section: Financial Overview

Q01: Revenue Projections
[User's text answer about revenue]
[Revenue Projections Table - inserted here automatically]
[Revenue Growth Chart - inserted here if also attached]

Q02: Cost Analysis  
[User's text answer about costs]
[Cost Breakdown Table - inserted here automatically]
```

**Step 5: Reference in Text (Optional)**
- User can reference items in their text: "As shown in Table 1..."
- References are automatically linked to the inserted item
- Items appear both in text (as reference) and after text (as full item)

**Managing Multiple Items:**
- Each item has unique name (user can rename)
- Items are listed in Data tab with creation date
- "Attached to: Q01" badge shows which prompt it's linked to
- User can detach and re-attach to different prompts
- User can delete items (with confirmation)

---

### Multiple Graphs/Tables Per Section - Navigation & Organization

**Yes, users can have unlimited data items per section!**

**Data Tab Organization:**

**Sub-Navigation (Horizontal Pills):**
- `[Datasets]` - Shows all tables/charts
- `[KPIs]` - Shows all KPI metrics
- `[Media]` - Shows all images/media
- Click pill to filter list by type

**List View (Scrollable):**
Each item shown as a card:
```
┌─────────────────────────────────────────┐
│ 📊 Revenue Projections 2024            │
│ Created: Jan 15, 2025                   │
│ Attached to: Q01                        │
│ [Attach] [Edit] [Delete] [View]        │
└─────────────────────────────────────────┘
```

**Item Actions:**
- `[Attach]` - Attaches to currently active prompt (shown in main editor)
- `[Edit]` - Opens full editor with customization options (axis, colors, etc.)
- `[Delete]` - Removes item (with confirmation)
- `[View]` - Shows preview/visualization in modal

**Navigation:**
- **Scroll vertically** through list
- **Search/filter** available for sections with many items
- **Attached items highlighted** (blue border)
- **Collapsible cards** - click to expand full details

**Complete Example: Financial Section with 5 Tables + 2 Charts**

**User Creates:**
1. Revenue Projections Table
2. Cost Breakdown Table  
3. Cash Flow Forecast Table
4. Revenue Growth Chart
5. Expense Trend Chart
6. Profit Margin Table
7. Break-even Analysis Table

**Data Tab Shows:**
```
[Datasets] [KPIs] [Media]

📊 Revenue Projections 2024 [Attached to Q01] [Edit] [Delete]
📊 Cost Breakdown [Attached to Q02] [Edit] [Delete]
📊 Cash Flow Forecast [Attached to Q03] [Edit] [Delete]
📈 Revenue Growth Chart [Not attached] [Attach] [Edit] [Delete]
📈 Expense Trend Chart [Not attached] [Attach] [Edit] [Delete]
📊 Profit Margin Table [Not attached] [Attach] [Edit] [Delete]
📊 Break-even Analysis [Not attached] [Attach] [Edit] [Delete]
```

**Final Business Plan Structure:**
```
Financial Overview

Q01: Revenue Projections
[User's text about revenue]
[Revenue Projections Table - inserted here]
[Revenue Growth Chart - inserted here if attached]

Q02: Cost Analysis
[User's text about costs]
[Cost Breakdown Table - inserted here]
[Expense Trend Chart - inserted here if attached]

Q03: Cash Flow
[User's text about cash flow]
[Cash Flow Forecast Table - inserted here]
```

**Customization Per Item:**
- Each table/chart can be fully customized independently
- Colors, axes, labels all customizable per item
- Changes saved per item
- Preview shows customized versions

---

## Right Panel (Tabs)

### Tab Structure

```
┌────────────────────────────────────┐
│ RIGHT PANEL (~360px width, sticky) │
│ ┌────────────────────────────────┐ │
│ │ [Assistant] [Data] [Preview]   │ │ ← Tab bar (sticky)
│ └────────────────────────────────┘ │
│                                     │
│ [Active tab content scrolls here]   │
│                                     │
└─────────────────────────────────────┘
```

### Tab 1: Assistant

**Purpose:** AI assistance (completely optional, zero interference)

**Content:**
- **Primary CTA:** `[Ask the assistant]` button (prominent, full width)
- **Current Context:**
  - Shows currently focused prompt text
  - Displays answer snippet (first 200 chars) if user has written something
  - Shows answer length / word count
- **Latest Response (only if user clicked Generate):**
  - Last assistant response with "Copy" / "Insert" buttons
  - Collapsible history section below ("View full conversation" link)
- **Quick Actions (optional):**
  - Chips: "Tone", "Translate", "Summarize", "Expand"

**Interaction:**
- **No automatic behavior** - tab is completely passive
- User must click "Ask the assistant" to trigger AI
- AI result appears in this tab (never in editor automatically)
- User decides if/when to use suggestion (click "Insert")
- Context updates when user switches prompts (but no AI runs automatically)
- **No banners, no notifications, no interference**

---

### Tab 2: Data

**Purpose:** Manage datasets, KPIs, and media attachments for the current section

**Content Structure:**
- **Info Banner (if applicable):** 
  - "This section typically includes: Revenue table" (for financial/risk/project categories)
  - Provides guidance on what data is expected
- **Action Buttons (always visible):**
  - `[📊 Add Table]` - Creates new dataset/table
  - `[📈 Add KPI]` - Creates new KPI metric
  - `[📷 Add Media]` - Uploads image or adds media URL
- **Sub-navigation (horizontal pills):**
  - `[Datasets]` `[KPIs]` `[Media]` - Switches between data type lists
- **List View (scrollable):**
  - Each item shown as a card with:
    - Icon (📊 📈 📷) indicating type
    - Name and creation date
    - "Attached to: Q01" badge (if attached)
    - Actions: `[Attach]` `[Edit]` `[Delete]` `[View]`
  - Items are collapsible (click to expand full details)
  - Attached items are highlighted

**Complete Workflow:**
1. User clicks Data tab → Sees all data items for current section
2. User clicks "Add Table" → Modal opens → User creates table
3. Table appears in Datasets list
4. User clicks "Attach" next to table → Attaches to currently active prompt
5. Table is now linked to that prompt and appears in preview

**Navigation for Multiple Items:**
- Scroll vertically through list
- Use sub-navigation pills to filter by type
- Search/filter available for sections with many items
- Preview tab shows all items in context

**Interaction:**
- Switching prompts updates "Attach" button context (attaches to new active prompt)
- Creating items opens modal (doesn't leave Data tab)
- Attaching is instant (no page reload)
- Items are section-level but can be attached to specific prompts

---

### Tab 3: Preview

**Purpose:** Essential preview of current section + optional requirements check (zero interference)

---

## Preview Section (Top - Condensed View)

### What It Shows

**Section Header:**
- Section title (e.g., "Executive Summary")
- **No section description** (already visible in main editor header)

**Prompt Answers (In Order):**
- Each prompt shown as: `Q01: [First 100 characters of answer...]`
- If answer is empty: `Q01: [No answer yet]` (shown in gray/italic)
- If answer exists: Shows first 100 chars with ellipsis (`...`) if longer
- Prompts appear in numerical order (Q01, Q02, Q03...)

**Data Items (Attached Items):**
- Shown as **references only**, not full content:
  - `📊 Revenue Table (attached to Q01)`
  - `📈 Growth Chart (attached to Q02)`
  - `📷 Market Analysis Image (attached to Q01)`
- Appears **immediately after** the prompt it's attached to
- If multiple items attached to same prompt, listed in order:
  ```
  Q01: [Answer text...]
  📊 Revenue Table (attached)
  📈 Growth Chart (attached)
  Q02: [Answer text...]
  ```

### Visual Layout

```
┌─────────────────────────────────────────┐
│ Preview                                 │
├─────────────────────────────────────────┤
│ [Open full preview] [Export draft]     │
├─────────────────────────────────────────┤
│ Executive Summary                       │
│                                         │
│ Q01: Our company aims to revolutionize │
│      the market by providing...        │
│ 📊 Revenue Projections Table (attached) │
│                                         │
│ Q02: The target market consists of...   │
│                                         │
│ Q03: [No answer yet]                   │
│                                         │
│ Q04: Our competitive advantage lies...  │
│ 📈 Market Share Chart (attached)       │
│ 📷 Competitor Analysis (attached)      │
└─────────────────────────────────────────┘
```

### Key Characteristics

**Condensed Format:**
- **NOT a full document preview** - shows structure and content existence
- **NOT formatted** like final document - plain text, no styling
- **Quick scan** - user can see at a glance what's complete and what's missing

**Real-Time Updates:**
- Updates **automatically** as user types (no refresh needed)
- Changes appear immediately when:
  - User types in editor
  - User switches prompts
  - User attaches/detaches data items
  - User navigates between sections

**Purpose:**
- **Quick verification:** See what content exists
- **Spot missing prompts:** Easily identify unanswered questions
- **Check data attachments:** See which prompts have tables/charts/images
- **Verify structure:** Confirm prompts are in correct order

**Limitations:**
- Does NOT show full answer text (only first 100 chars)
- Does NOT show full table data (only table name)
- Does NOT show full chart/image (only reference)
- Does NOT show formatting (headings, spacing, typography)
- **For full preview:** User must click "Open full preview" button

---

## Actions (Above Preview)

**`[Open full preview]` Button:**
- Opens complete formatted preview in new page (`/preview` route)
- Shows entire document with:
  - Full answer text (not truncated)
  - Full table data (rendered tables)
  - Full charts/images (rendered visuals)
  - Proper document formatting
  - All sections (not just current one)

**`[Export draft]` Button:**
- Exports current section as:
  - PDF document
  - Word document (.docx)
- Includes all prompts, answers, and attached data items
- Uses proper formatting for export

---

## Requirements Summary (Below Preview - Hidden by Default)

**Visibility:**
- **Completely hidden** by default
- **Only appears** after user clicks "Run requirements check" button
- **No automatic checking** - never runs without user action

**When Shown:**
- Displays after user clicks `[Run requirements check]` button
- Shows:
  - **Overall completion:** "65% complete" (percentage)
  - **Issue count:** "2 mandatory fields missing" (summary)
  - **Per-section breakdown:** Accordion list showing each section's status
  - **Specific issues:** Lists what's missing (e.g., "Missing: Market size")

**User Options:**
- Review issues and fix them by editing answers
- Click "Run check" again to update status
- **OR ignore completely** and continue writing (no blocking)

**Design:**
- Non-intrusive card below preview
- Does not block or interrupt user's workflow
- User can collapse/expand accordion sections
- No banners, no pop-ups, no notifications

---

## Interaction Behavior

**Preview Updates:**
- **Automatic:** Updates in real-time as user types
- **No manual refresh needed**
- **Instant:** Changes appear immediately

**Requirements Check:**
- **Manual only:** User must click "Run requirements check" button
- **On-demand:** Only runs when user requests it
- **No automatic re-checking:** Status doesn't update automatically after user edits
- **User controls:** User decides when to check, when to re-check, when to ignore

**Zero Interference:**
- Preview never interrupts user's writing
- Requirements never check automatically
- No banners, notifications, or pop-ups
- User has complete control over when to view preview or check requirements

---

## Component Interactions

### Focus Management

1. **User clicks question chip** → Main workspace scrolls to that prompt → Right panel updates context
2. **User focuses prompt editor** → Assistant tab shows that prompt's context → Data tab shows available attachments
3. **User clicks "Ask assistant"** → AI generates for focused prompt → Response appears in Assistant tab + suggestion chip in prompt block

### Data Flow

1. **Creating attachments:**
   - User clicks "Add Table" in Data tab → Modal opens → Creates dataset → Appears in Data tab list
   - User clicks "Attach" → Adds to currently focused prompt → Appears in prompt's attachment block

2. **AI suggestions:**
   - User clicks "Ask assistant" → AI generates → Response in Assistant tab + suggestion chip in prompt block
   - User clicks "Insert" → Content inserted into editor

3. **Requirements:**
   - User clicks "Run check" (Preview tab or Assistant banner) → Check runs → Status updates → Issues appear in Preview tab summary

---

## Responsive Behavior

- **Desktop (>1024px):** Two-column layout (editor + right panel)
- **Tablet (768-1024px):** Right panel becomes collapsible drawer
- **Mobile (<768px):** Right panel becomes bottom sheet modal

---

## Implementation Notes

### Key Components

1. **Editor.tsx:** Main container with header, section nav, and two-column layout
2. **SectionWorkspace.tsx:** Primary editor column with prompt blocks
3. **QuestionCard.tsx:** Individual prompt block component
4. **RightPanel.tsx:** Tabbed right panel container
5. **AssistantTab.tsx:** AI assistance content
6. **DataTab.tsx:** Data management content
7. **PreviewTab.tsx:** Preview + requirements content

### State Management

- Use Zustand store for editor state (existing pattern)
- Track `activeQuestionId` for focus management
- Right panel tabs are local state (not persisted)
- AI conversation history persisted per section

### Styling

- Use Tailwind CSS (existing pattern)
- Consistent spacing: `space-y-6` for major sections, `space-y-4` for cards
- Border radius: `rounded-2xl` for cards, `rounded-xl` for buttons
- Colors: Blue-600 for primary actions, slate for text, red for warnings

---

## Migration Checklist

- [ ] Remove left rail navigation
- [ ] Remove section footer navigation
- [ ] Remove progress bar from section nav
- [ ] Remove Route dropdown from Program Selector
- [ ] Move Requirements/AI/Preview buttons from header to right panel tabs
- [ ] Implement question navigation bar (chips)
- [ ] Consolidate prompt blocks into single scrollable workspace
- [ ] Move action buttons below editor (not above)
- [ ] Implement three right panel tabs (Assistant, Data, Preview)
- [ ] Add context blocks (attachments, AI suggestions, warnings) below actions
- [ ] Implement focus management between main workspace and right panel
- [ ] Add responsive breakpoints for mobile/tablet

---

## User Flow Example

1. User opens "Financial Overview" section
2. Section header shows at top, question nav bar shows [Q01 Revenue] [Q02 Costs] [Q03 Cash Flow]
3. User clicks Q01 → Workspace scrolls to first prompt
4. User types in editor → Content auto-saves
5. User clicks "Ask assistant" in right panel → AI generates → Response appears in Assistant tab
6. User clicks "Insert" on suggestion → Content inserted into editor
7. User clicks Data tab → Sees "This section expects: Revenue table" banner
8. User clicks "Add Table" → Creates Revenue dataset
9. User clicks "Attach" → Table attached to Q01 prompt → Appears in attachment block
10. User clicks Preview tab → Sees formatted section output
11. User clicks "Run requirements check" → Status updates → Issues shown in summary

---

## Business Plan Components & Ancillary Content

### Overview

A complete business plan consists of:
1. **Title Page** - Cover page with company info, logo, contact details
2. **Table of Contents** - Navigation structure for all sections
3. **Main Sections** - The core content (Executive Summary, Market Analysis, etc.)
4. **List of Illustrations** - Index of all charts, graphs, and images
5. **List of Tables** - Index of all data tables
6. **References/Citations** - Bibliography and source citations
7. **Appendices** - Supporting documents and attachments

### How to Create/Edit Title Page, Citations, TOC, etc.

**Access Point:** "Front & back matter" section in the Section Navigation Bar

**Location:** The last item in the section navigation bar is labeled "Front & back matter" (or "Ancillary"). Clicking it opens the `AncillaryWorkspace`.

**What You Can Edit:**

1. **Title Page:**
   - Plan title
   - Company name
   - Value proposition
   - Date
   - Contact information (email, phone, website, address)
   - Logo URL (with upload button)
   - Confidentiality statement

2. **Table of Contents:**
   - Add/remove entries
   - Edit entry titles
   - Set page numbers
   - Hide/show entries

3. **List of Illustrations:**
   - Add charts, graphs, images
   - Set labels and page numbers
   - Organize by type (image, chart, table)

4. **List of Tables:**
   - Register all data tables
   - Set labels and page numbers
   - Link to actual table data

5. **References/Citations:**
   - Add citations (APA/MLA/Chicago format)
   - Include URLs and access dates
   - Edit and delete references
   - Citation style selection (APA, MLA, Chicago, custom)

6. **Appendices:**
   - Add supporting documents
   - Upload files or link URLs
   - Add descriptions

**Component Name:** `AncillaryEditorPanel` (in `RequirementsModal.tsx`)

**Data Structure:** Stored in `BusinessPlan.ancillary` and `BusinessPlan.titlePage`

---

## Template System Architecture

### How Templates Are Wired

**Import Path:** `@templates` → `features/editor/templates/index.ts`

**Data Flow:**
```
Data Files (sections.ts, documents.ts, templateKnowledge.ts)
  ↓
data.ts (barrel export)
  ↓
index.ts (API + logic)
  ↓
Your Code (Editor.tsx, etc.)
```

**Key Functions:**
- `getSections(fundingType, productType)` - Get section templates
- `getDocuments(fundingType, productType, programId?)` - Get document templates
- `getTemplateKnowledge(sectionId)` - Get AI guidance for sections

**Template Hierarchy:**
1. **Program-specific templates** (highest priority) - From database
2. **Master templates** (fallback) - From `sections.ts` and `documents.ts`
3. **Default templates** (lowest priority) - Grants master template

**Template Types:**
- **Section Templates** - Define prompts, word counts, validation rules
- **Document Templates** - Define additional documents (Work Plan, Budget, CVs, etc.)
- **Template Knowledge** - AI guidance, frameworks, best practices

### Can We Create Business Plans?

**Yes!** Business plans can be fully created:

1. **Section-by-Section Editing:**
   - Each section has prompts (questions)
   - User answers prompts with rich text
   - Auto-saves as user types
   - Progress tracked per section

2. **Data Integration:**
   - Add tables, charts, KPIs, images
   - Attach to specific prompts
   - Customize appearance

3. **Ancillary Content:**
   - Title page, TOC, citations all editable
   - References and appendices manageable

4. **Export:**
   - Export to PDF or DOCX
   - Includes all sections, data, and ancillary content

### What About Other Documents?

**Yes!** Additional documents are supported:

**Document Templates Available:**
- Work Plan & Gantt Chart
- Budget Breakdown & Financial Model
- Team CVs
- Market Research Report
- Cap Table
- Investor Teaser One-Pager
- Bank Summary Page
- And more...

**How It Works:**
1. Document templates loaded per funding type
2. Program-specific documents can override master templates
3. Documents stored in `plan.attachments[]`
4. Each document has template, instructions, examples

**Current Status:**
- ✅ Document templates exist in `documents.ts`
- ✅ System can load program-specific documents
- ⚠️ **UI for uploading/managing documents** - Not yet implemented in editor
- ✅ Export system can include documents

**Future Enhancement:**
- Add document upload/management UI in editor
- Link documents to specific sections
- Preview documents before export

---

## Current Component State

### Business Plan Structure (`BusinessPlan` type)

```typescript
{
  id: string
  productType: 'submission' | 'review' | 'strategy'
  fundingProgram: 'grant' | 'loan' | 'equity' | 'visa'
  titlePage: TitlePage          // ✅ Fully implemented
  sections: Section[]           // ✅ Fully implemented
  references: Reference[]       // ✅ Fully implemented
  appendices: AppendixItem[]    // ✅ Fully implemented
  ancillary: AncillaryContent   // ✅ Fully implemented
  programSummary?: ProgramSummary
  metadata: {...}
}
```

### Ancillary Content Structure (`AncillaryContent` type)

```typescript
{
  tableOfContents: TableOfContentsEntry[]     // ✅ Implemented
  listOfIllustrations: FigureListItem[]        // ✅ Implemented
  listOfTables: FigureListItem[]              // ✅ Implemented
  citationStyle: 'apa' | 'mla' | 'chicago' | 'custom'  // ✅ Implemented
  footnotes: Footnote[]                        // ✅ Structure exists
  lastGenerated?: string
}
```

### Title Page Structure (`TitlePage` type)

```typescript
{
  companyName: string           // ✅ Implemented
  logoUrl?: string              // ✅ Implemented
  valueProp?: string            // ✅ Implemented
  planTitle: string             // ✅ Implemented
  date: string                  // ✅ Implemented
  contactInfo: {                // ✅ Implemented
    name: string
    email: string
    phone?: string
    website?: string
    address?: string
  }
  confidentialityStatement?: string  // ✅ Implemented
}
```

---

## Web Scraping & Competitor Analysis

### Can I Parse a Website with Login?

**Short Answer:** Yes, but with limitations and considerations.

**Technical Capabilities:**
- ✅ Can parse public websites and extract content
- ✅ Can handle JavaScript-rendered content (with browser automation)
- ✅ Can extract structured data (tables, lists, text)
- ⚠️ **Login-protected content** - Requires authentication handling
- ⚠️ **Terms of Service** - Must comply with website's ToS and robots.txt
- ⚠️ **Rate Limiting** - Must respect website's rate limits

**Approach for Competitor Analysis:**

1. **Public Content (No Login):**
   - Direct HTTP requests
   - HTML parsing
   - Content extraction

2. **Login-Protected Content:**
   - Browser automation (Puppeteer/Playwright)
   - Session management
   - Cookie handling
   - **Important:** Only if you have permission or own the account

3. **Best Practices:**
   - Check robots.txt
   - Respect rate limits
   - Use proper user agents
   - Store credentials securely
   - Comply with ToS

**Implementation Options:**
- Server-side scraping (Next.js API routes)
- Browser automation tools (Puppeteer, Playwright)
- Headless browser for JavaScript-heavy sites
- API integration (if competitor provides API)

**Recommendation:**
- Start with public content analysis
- For login-protected content, ensure you have permission
- Consider using official APIs if available
- Implement proper error handling and rate limiting

---

*Last updated: 2025-01-17*

