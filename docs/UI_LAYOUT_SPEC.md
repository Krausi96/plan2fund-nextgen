# UI Layout Specification - Editor

## Full Page Layout - Modern & Creative Design

**Design Improvements:**
- Sticky header with gradient background (blue-600 → purple-600)
- Program Selector in card with icons (🎯 🛣️ 📋)
- Sticky section navigation with animated progress bar
- Centered editor area (max-width 1200px) with generous padding
- Card-based design with subtle shadows and gradient borders
- Modern action buttons with icons and hover effects
- Collapsible panels with smooth animations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                       │
│ Business Plan Editor  [📋 Requirements] [💬 AI Assistant]  [👁️ Preview]    │
│                                                                              │
│ ┌─ Program Selector ─────────────────────────────────────────────────────┐ │
│ │ Product: [Strategy ▼]  Route: [Grant ▼]  Program: [FFG Basisprogramm ▼]│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION NAVIGATION                                                           │
│ [←] [01 ✓ Executive] [02 ⚠ Market] [03 ○ Project] ... [→]                 │
│                                                                              │
│ Overall Progress: ████████░░░░░░░░░░ 45% Complete (3 of 9 sections)       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ MAIN EDITOR AREA                                                             │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─ Section Header ───────────────────────────────────────────────────┐ │ │
│ │ │                                                                     │ │ │
│ │ │ Market Opportunity                                                  │ │ │
│ │ │ Describe the market size, trends, and customer segments.           │ │ │
│ │ │                                                                     │ │ │

│ │ ┌─ Text Editor ────────────────────────────────────────────────────┐ │ │
│ │ │                                                                   │ │ │
│ │ │ [Rich text editor with formatting toolbar]                       │ │ │
│ │ │                                                                   │ │ │
│ │ │ Start writing...                                                 │ │ │
│ │ │                                                                   │ │ │
│ │ └───────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ [✨ Generate with AI]  [💡 Smart Hints]  [⏭️ Skip]                    │ │
│ │                                                                         │ │
│ │ ┌─ 💡 Smart Hints (Collapsible) ──────────────────────────────────┐ │ │
│ │ │ 💡 Question 1                                                     │ │ │
│ │ │ 💡 Question 2                                                     │ │ │
│ │ │ [Use as Guide]                                                   │ │ │
│ │ └───────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │ ┌─ 📊 Tables & Charts (If Needed) ─────────────────────────────────┐ │ │
│ │ │                                                                   │ │ │
│ │ │ Navigation: [← Previous]  [Table 1 of 3]  [Next →]               │ │ │
│ │ │                                                                   │ │ │
│ │ │ ┌─ Revenue Table ─────────────────────────────────────────────┐ │ │ │
│ │ │ │ [Table content - editable]                                   │ │ │ │
│ │ │ │ Connected to text: "Our revenue projections show..."        │ │ │ │
│ │ │ │ [✨ Fill with AI from Text] [Edit] [Delete]                 │ │ │ │
│ │ │ └───────────────────────────────────────────────────────────────┘ │ │ │
│ │ │                                                                   │ │ │
│ │ │ All Tables: [Revenue] [Costs] [Cash Flow]  ← Click to jump      │ │ │
│ │ │                                                                   │ │ │
│ │ │ [📊 Add Table] [📈 Add Chart] [📷 Add Image]                    │ │ │
│ │ └───────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                         │ │
│ │                                                                         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Main Editor Area - Detailed

### 1. Section Header (Improved Visual Design)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ Market Opportunity                                                      │ │
│ │ Describe the market size, trends, and customer segments.              │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Visual Design:**
- **Card-style container** with subtle border and shadow
- **Section title** - Large, bold, prominent (text-2xl, font-bold)
- **Section description** - Gray text, readable (text-gray-600)
- **Spacing** - Generous padding, clean separation
- **Background** - Slight background color (bg-gray-50 or bg-white with border)

**Components:**
- Section title (h1, large, bold, text-gray-900)
- Section description (paragraph, gray text, text-gray-600)
- Card container with border and subtle shadow

**Note:** Section navigation is handled by the top navigation bar (section tabs). No need for duplicate navigation here.

---

## Questions & Prompts: How They Work

### Where Do Questions Come From?

**Source:** Questions come from `sectionTemplate.prompts` in `shared/templates/sections.ts`

**Example:**
```typescript
{
  id: 'market_opportunity',
  title: 'Market Opportunity',
  description: 'Describe the market size, trends, and customer segments.',
  prompts: [
    'Who is the target market?',
    'How large is the market?',
    'What trends support your opportunity?',
    'What unmet needs exist?'
  ]
}
```

**How They're Used:**
- Questions are **OPTIONAL guidance**, not required
- Shown in **💡 Smart Hints panel** (collapsible)
- User can use them as inspiration or ignore them
- AI uses ALL prompts as context when generating content

### What If User Skips Questions?

**Questions are OPTIONAL - User can skip them entirely!**

**Flow:**
1. User opens section → Questions appear in Smart Hints panel (if section has prompts)
2. User can:
   - **Option A:** Use questions as guide → Write text manually
   - **Option B:** Ignore questions → Write text freely
   - **Option C:** Click "✨ Generate with AI" → AI uses ALL prompts as context

**What "Generate with AI" Does:**
- **If user skips questions:** AI generates content for the **entire section** using:
  - All prompts from `sectionTemplate.prompts` (as context)
  - Section description
  - Previous sections' content (cross-section awareness)
  - Conversation history
  - Program requirements
  
- **If user uses questions:** Same behavior - AI still uses ALL prompts as context, not just one question

**Key Point:** Questions are **guidance**, not a required mode. AI always generates for the whole section, using all prompts as context.

---

## AI Generation: How It Works

### What Happens When User Clicks "✨ Generate with AI"

**Step 1: AI Gathers Context**
```
AI collects:
1. Section title and description
2. ALL prompts from sectionTemplate.prompts (even if user skipped them)
3. Previous sections' content (cross-section awareness)
4. Conversation history for this section
5. Program-specific requirements
6. Template knowledge (best practices, frameworks)
```

**Step 2: AI Generates Content**
```
AI generates:
- Complete section content (not just one question answer)
- Uses all prompts as context to create comprehensive content
- Follows section description and requirements
- Maintains consistency with previous sections
```

**Step 3: Content Appears in Editor**
```
Generated content appears in text editor
  ↓
User can edit, refine, or regenerate
  ↓
If section needs tables → Tables section appears below
```

**Example Flow:**
```
User opens "Market Opportunity" section
  ↓
Smart Hints shows: "Who is target market?", "How large is market?", etc.
  ↓
User clicks "✨ Generate with AI" (without using questions)
  ↓
AI uses ALL prompts as context:
  - "Who is the target market?" → AI includes target market info
  - "How large is the market?" → AI includes market size
  - "What trends support your opportunity?" → AI includes trends
  - "What unmet needs exist?" → AI includes unmet needs
  ↓
AI generates complete section covering all aspects
  ↓
Content appears in editor
```

---

## Contextual Memory: How Sections Connect

### Cross-Section Awareness

**AI has memory across sections:**

1. **Previous Sections' Content**
   - AI reads snippets from all completed sections
   - Uses this to maintain consistency
   - Example: If Executive Summary mentions "€500K funding", Financial section will reference it

2. **Conversation History**
   - Each section has its own conversation history
   - AI remembers previous generations and edits
   - Allows iterative refinement

3. **Program Requirements**
   - AI knows the selected program (FFG, AWS, etc.)
   - Uses program-specific guidance and requirements
   - Adapts content to program expectations

### Suggested Section Order

**Sections have an `order` field in templates. Recommended flow:**

```
1. Executive Summary (order: 1)
   → High-level overview, sets context
   
2. Market Opportunity (order: 2)
   → Market analysis, customer segments
   → May need: Competitor table (optional)
   
3. Business Model (order: 3)
   → Revenue streams, value proposition
   
4. Competitive Landscape (order: 4)
   → Competitors, differentiation
   
5. Project Description (order: 5)
   → Project goals, milestones
   → ALWAYS needs: Milestone table → Gantt chart
   
6. Financial Overview (order: 6)
   → Revenue, costs, funding needs
   → ALWAYS needs: Revenue table, Costs table, Cash Flow table
   
7. Risk Assessment (order: 7)
   → Risks, mitigation strategies
   → ALWAYS needs: Risk matrix
   
8. Team & Qualifications (order: 8)
   → Team members, hiring plan
   → May need: Hiring timeline (optional)
```

**Why This Order?**
- Each section builds on previous ones
- Market → Business Model → Financial (logical flow)
- Executive Summary first (overview)
- Financial and Risk last (detailed planning)

**AI Uses This Order:**
- When generating content, AI references previous sections
- Maintains consistency across the plan
- Builds a coherent narrative

---

## Section-Specific Data Needs: Unified Flow

### How Different Sections Handle Data

**Based on `section.category`:**

| Category | Always Needs Tables? | Typical Tables | Chart Type | Example Section |
|----------|---------------------|----------------|------------|-----------------|
| `financial` | **YES** | Revenue, Costs, Cash Flow | Bar/Line Chart | Preliminary Financial Overview |
| `risk` | **YES** | Risk Matrix | Matrix/Heatmap | Risk Assessment |
| `project` | **YES** | Milestones, Timeline | Gantt Chart | Project Description |
| `market` | **MAYBE** | Competitor Analysis (optional) | Pie Chart | Market Opportunity |
| `team` | **MAYBE** | Hiring Timeline (optional) | Line Chart | Team & Qualifications |
| `general` | **NO** | None | None | Executive Summary |

### Unified Flow for All Sections - Detailed Step-by-Step

**Universal Pattern with User Experience:**

#### STEP 1: USER OPENS SECTION

**What User Sees:**
```
┌─────────────────────────────────────────────────────────────┐
│ Section Header (Card)                                        │
│ Market Opportunity                                           │
│ Describe the market size, trends, and customer segments.    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Text Editor (Empty)                                         │
│ [Rich text editor with toolbar]                             │
│ Start writing...                                             │
└─────────────────────────────────────────────────────────────┘

[✨ Generate with AI]  [💡 Smart Hints]  [⏭️ Skip]

┌─────────────────────────────────────────────────────────────┐
│ 💡 Smart Hints (Collapsed by default)                       │
│ [Expand ▼]                                                  │
└─────────────────────────────────────────────────────────────┘
```

**What Happens:**
- Section loads with title and description
- Text editor is empty (or shows existing content if previously edited)
- Smart Hints panel is collapsed (user can expand to see questions)
- **Tables & Charts section is NOT visible yet** (waiting for Step 3 check)

---

#### STEP 2: USER WRITES TEXT OR GENERATES WITH AI

**Option A: User Writes Manually**
```
User types in text editor:
"Our target market consists of small businesses in Austria..."
  ↓
Text saved to: section.content (auto-saves as user types)
```

**Option B: User Clicks "✨ Generate with AI"**
```
User clicks "✨ Generate with AI"
  ↓
Loading indicator appears: "Generating content..."
  ↓
AI gathers context:
  - All prompts from sectionTemplate.prompts
  - Previous sections' content
  - Program requirements
  - Template knowledge
  ↓
AI generates complete section content
  ↓
Content appears in editor (user can edit)
  ↓
Text saved to: section.content
```

**What User Sees After Generation:**
```
┌─────────────────────────────────────────────────────────────┐
│ Text Editor (Filled)                                        │
│ Our target market consists of small businesses in Austria.  │
│ The market size is estimated at €50 million...              │
│ [User can edit this content]                                │
└─────────────────────────────────────────────────────────────┘
```

---

#### STEP 3: CHECK IF SECTION NEEDS TABLES

**What Happens (Behind the Scenes):**
```
System checks: section.category

If category = 'financial':
  → Show Tables & Charts section (always)
  → Show helpful message: "This section typically includes financial tables"

If category = 'risk':
  → Show Tables & Charts section (always)
  → Show helpful message: "This section typically includes a risk matrix"

If category = 'project':
  → Show Tables & Charts section (always)
  → Show helpful message: "This section typically includes milestone timelines"

If category = 'market':
  → Show Tables & Charts section (optional)
  → Show helpful message: "You can optionally add competitor analysis tables"

If category = 'team':
  → Show Tables & Charts section (optional)
  → Show helpful message: "You can optionally add hiring timeline tables"

If category = 'general':
  → Do NOT show Tables & Charts section
  → Section is text-only
```

---

#### STEP 4: TABLES & CHARTS SECTION APPEARS

**What User Sees (If Section Needs Tables):**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                           │
│                                                             │
│ 💡 This section typically includes financial tables.        │
│    Create tables to visualize your data.                   │
│                                                             │
│ [📊 Add Table] [📈 Add Chart] [📷 Add Image]                 │
│                                                             │
│ (No tables created yet)                                    │
└─────────────────────────────────────────────────────────────┘
```

**What User Sees (If Section is Optional for Tables):**

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts (Optional)                               │
│                                                             │
│ 💡 You can optionally add competitor analysis tables.       │
│    Tables help visualize market data.                      │
│                                                             │
│ [📊 Add Table] [📈 Add Chart] [📷 Add Image]                 │
│                                                             │
│ (No tables created yet - optional)                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Section appears **immediately** when section loads (if category requires it)
- OR appears **after user writes text** (for optional categories)
- Shows helpful description explaining why tables might be useful
- User can ignore this section if they don't want tables

---

#### STEP 5: USER CREATES TABLE

**What Happens When User Clicks "📊 Add Table":**

```
User clicks "📊 Add Table"
  ↓
Table Creation Dialog Opens:
┌─────────────────────────────────────────────────────────────┐
│ Create New Table                                             │
│                                                             │
│ Table Name: [Revenue Projections        ]                   │
│                                                             │
│ Table Type: [Financial Data ▼]                             │
│   Options: Financial Data, Risk Matrix, Milestones,        │
│            Competitor Analysis, Custom                      │
│                                                             │
│ Time Period: [Years ▼]                                      │
│   Options: Years, Quarters, Months                          │
│                                                             │
│ Number of Periods: [3]                                     │
│                                                             │
│ Structure:                                                  │
│   ☑ Include KPIs (for financial tables)                    │
│   ☑ Include Totals                                          │
│                                                             │
│ [Create Table] [Cancel]                                     │
└─────────────────────────────────────────────────────────────┘
  ↓
User fills in details and clicks "Create Table"
  ↓
Empty table structure appears:
┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                           │
│                                                             │
│ ┌─ Revenue Projections ──────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─────────────┬─────────┬─────────┬─────────┐        │ │
│ │ │ Item        │ Year 1  │ Year 2  │ Year 3  │        │ │
│ │ ├─────────────┼─────────┼─────────┼─────────┤        │ │
│ │ │ [Product A] │ [    ]  │ [    ]  │ [    ]  │        │ │
│ │ │ [Product B] │ [    ]  │ [    ]  │ [    ]  │        │ │
│ │ │ [Total]     │ [    ]  │ [    ]  │ [    ]  │        │ │
│ │ └─────────────┴─────────┴─────────┴─────────┘        │ │
│ │                                                         │ │
│ │ [✨ Fill with AI from Text] [Edit Structure] [Delete] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**About KPIs:**
- For **Financial tables**: User can check "Include KPIs" option
- KPIs are calculated automatically (e.g., Revenue Growth %, Profit Margin %)
- KPIs appear as additional rows or columns in the table
- Example: If Revenue table has KPIs, it shows:
  ```
  Revenue Growth %: [Year 1: N/A] [Year 2: 60%] [Year 3: 50%]
  ```

---

#### STEP 6: AI FILLS TABLE FROM TEXT (Safe & Clear Process)

**What Happens When User Clicks "✨ Fill with AI from Text":**

```
User clicks "✨ Fill with AI from Text" on table
  ↓
Confirmation Dialog Appears (SAFETY):
┌─────────────────────────────────────────────────────────────┐
│ Fill Table with AI                                          │
│                                                             │
│ AI will read your text and extract relevant data to fill    │
│ this table.                                                │
│                                                             │
│ Text to analyze:                                            │
│ "Our revenue projections show strong growth over the next   │
│ 3 years. We expect to reach €500,000 in Year 1, growing   │
│ to €1.2 million by Year 3..."                              │
│                                                             │
│ ⚠️ Note: This will overwrite any existing data in the table. │
│                                                             │
│ [Fill Table] [Cancel]                                      │
└─────────────────────────────────────────────────────────────┘
  ↓
User clicks "Fill Table"
  ↓
Loading indicator: "AI is analyzing your text and extracting data..."
  ↓
AI Process:
  1. Reads section.content
  2. Identifies relevant data (numbers, dates, categories)
  3. Matches data to table structure
  4. Fills table cells
  5. Calculates KPIs (if enabled)
  ↓
Table Updates:
┌─────────────────────────────────────────────────────────────┐
│ ┌─ Revenue Projections ──────────────────────────────────┐ │
│ │                                                         │ │
│ │ ┌─────────────┬─────────┬─────────┬─────────┐        │ │
│ │ │ Item        │ Year 1  │ Year 2  │ Year 3  │        │ │
│ │ ├─────────────┼─────────┼─────────┼─────────┤        │ │
│ │ │ Product A   │ 300,000 │ 600,000 │ 900,000 │        │ │
│ │ │ Product B   │ 200,000 │ 400,000 │ 300,000 │        │ │
│ │ │ Total       │ 500,000 │ 800,000 │ 1,200,000│       │ │
│ │ └─────────────┴─────────┴─────────┴─────────┘        │ │
│ │                                                         │ │
│ │ KPIs:                                                   │
│ │ Revenue Growth %: [N/A] [60%] [50%]                   │ │
│ │                                                         │ │
│ │ [✨ Regenerate from Text] [Edit] [Delete]              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Safety Features:**
- Confirmation dialog before overwriting
- Shows preview of text being analyzed
- User can cancel if not sure
- User can manually edit table after AI fills it
- User can regenerate if text changes

---

#### STEP 7: CHART AUTO-GENERATES (With Full Editing)

**What Happens Automatically:**

```
Table has data → Chart automatically appears below table
  ↓
Chart generates based on table type:
  - Financial tables → Bar/Line charts
  - Risk matrix → Matrix/Heatmap visualization
  - Milestones → Gantt chart
  - Competitor data → Pie/Bar charts
```

**What User Sees:**

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─ Revenue Projections Chart ────────────────────────────┐ │
│ │                                                         │ │
│ │ [Bar Chart Visualization]                              │ │
│ │                                                         │ │
│ │     │                                                    │ │
│ │ 1.2M│     ████                                          │ │
│ │     │     ████                                          │ │
│ │ 800K│     ████                                          │ │
│ │     │     ████                                          │ │
│ │ 500K│     ████                                          │ │
│ │     └─────────────────────────────────────────────      │ │
│ │        Year 1    Year 2    Year 3                      │ │
│ │                                                         │ │
│ │ [Chart Type ▼] [Edit Colors] [Edit Labels] [Add Desc] │ │
│ │ [Hide Chart] [Delete]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**User Can Edit Chart:**

1. **Change Chart Type:**
   ```
   Click "Chart Type ▼"
   Options: Bar Chart, Line Chart, Area Chart, Pie Chart
   ```

2. **Edit Colors:**
   ```
   Click "Edit Colors"
   Color Picker opens:
   - Year 1: [Blue] [Change]
   - Year 2: [Green] [Change]
   - Year 3: [Orange] [Change]
   - Background: [White] [Change]
   ```

3. **Edit Labels:**
   ```
   Click "Edit Labels"
   Dialog opens:
   - Chart Title: [Revenue Projections        ]
   - X-Axis Label: [Time Period]
   - Y-Axis Label: [Revenue (€)]
   - Legend Position: [Bottom ▼]
   ```

4. **Add Description:**
   ```
   Click "Add Desc"
   Description field appears:
   ┌─────────────────────────────────────────────────────────┐
   │ Chart Description:                                       │
   │ [This chart shows our revenue growth over 3 years...]   │
   │                                                          │
   │ [Save] [Cancel]                                         │
   └─────────────────────────────────────────────────────────┘
   ```

5. **Hide/Show Chart:**
   - Click "Hide Chart" → Chart collapses (data preserved)
   - Click "Show Chart" → Chart expands again

---

#### STEP 8: USER CAN CUSTOMIZE EVERYTHING

**Full Customization Options:**

```
User can:

1. Edit Table Values:
   - Click any cell → Edit directly
   - Changes save automatically
   - KPIs recalculate automatically

2. Edit Table Structure:
   - Click "Edit Structure"
   - Add/remove rows/columns
   - Change time periods
   - Rename table

3. Add More Tables:
   - Click "📊 Add Table" again
   - Create multiple tables (e.g., Revenue, Costs, Cash Flow)
   - Navigate between tables using tabs

4. Navigate Between Tables:
   - Previous/Next buttons
   - Table tabs: [Revenue] [Costs] [Cash Flow]
   - Keyboard shortcuts (Arrow keys)

5. Edit Chart:
   - Change chart type
   - Edit colors
   - Edit labels
   - Add description
   - Hide/show

6. Regenerate:
   - Click "✨ Regenerate from Text"
   - AI re-reads updated text
   - Updates table (with confirmation)

7. Delete:
   - Delete table (removes chart too)
   - Delete chart only (keeps table)
```

---

### Complete Example: Switching from Market to Financial Section

**Scenario: User is in Market section (text-only or optional tables), then switches to Financial section (always needs tables)**

```
STEP 1: User is in "Market Opportunity" section
┌─────────────────────────────────────────────────────────────┐
│ Market Opportunity                                          │
│ Describe the market size, trends, and customer segments.  │
└─────────────────────────────────────────────────────────────┘

Text Editor: "Our target market consists of..."
[User has written text, no tables created]

📊 Tables & Charts section is visible (optional):
  [📊 Add Table] [📈 Add Chart] [📷 Add Image]
  (User can skip this - it's optional)
```

```
STEP 2: User clicks "06 Preliminary Financial Overview" tab
  ↓
Current section (Market) auto-saves
  ↓
New section (Financial) loads
```

```
STEP 3: Financial Section Loads
┌─────────────────────────────────────────────────────────────┐
│ Preliminary Financial Overview                             │
│ Provide high-level financial assumptions including costs,  │
│ revenue potential, and funding needed.                      │
└─────────────────────────────────────────────────────────────┘

Text Editor: (Empty or existing content)

[✨ Generate with AI]  [💡 Smart Hints]  [⏭️ Skip]

┌─────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                           │
│                                                             │
│ 💡 This section typically includes financial tables.       │
│    Create tables to visualize your revenue, costs, and     │
│    cash flow projections.                                   │
│                                                             │
│ [📊 Add Table] [📈 Add Chart] [📷 Add Image]                 │
│                                                             │
│ (No tables created yet)                                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Difference:**
- **Market section:** Tables section is optional (user can skip)
- **Financial section:** Tables section appears immediately with helpful message explaining why tables are recommended

**User Flow:**
1. User writes text OR generates with AI
2. User sees Tables section with helpful description
3. User creates tables (Revenue, Costs, Cash Flow)
4. User fills tables with AI from text
5. Charts auto-generate
6. User customizes everything

### Section-Specific Examples

#### Financial Section (category: `financial`)

**Flow:**
```
1. User writes text: "Revenue: €500K Year 1, €1.2M Year 3. Costs: €200K Year 1..."
2. Tables section appears (always, because category = 'financial')
3. User creates: Revenue Table, Costs Table, Cash Flow Table
4. User clicks "✨ Fill with AI from Text" on each table
5. AI extracts data and fills tables
6. Charts auto-generate: Revenue Bar Chart, Costs Bar Chart, Cash Flow Line Chart
7. User navigates between tables using tabs: [Revenue] [Costs] [Cash Flow]
```

#### Risk Section (category: `risk`)

**Flow:**
```
1. User writes text: "High risk: Market competition. Medium risk: Technology delays..."
2. Tables section appears (always, because category = 'risk')
3. User creates: Risk Matrix table
4. User clicks "✨ Fill with AI from Text"
5. AI extracts risks, categorizes by impact/probability, fills matrix
6. Risk Matrix visualization auto-generates (heatmap)
7. User can edit risk ratings, add/remove risks
```

#### Market Section (category: `market`)

**Flow:**
```
1. User writes text: "Competitors: Company A (30% market share), Company B (25%)..."
2. Tables section appears (optional, user decides)
3. User can skip tables OR create Competitor Analysis table
4. If created: User clicks "✨ Fill with AI from Text"
5. AI extracts competitor data, fills table
6. Pie chart auto-generates showing market share
```

#### Project Section (category: `project`)

**Flow:**
```
1. User writes text: "Milestone 1: Q1 2024 - MVP launch. Milestone 2: Q2 2024 - Beta..."
2. Tables section appears (always, because category = 'project')
3. User creates: Milestone Timeline table
4. User clicks "✨ Fill with AI from Text"
5. AI extracts milestones, dates, dependencies, fills table
6. Gantt chart auto-generates showing project timeline
```

---

## Editing Flow: How Different Sections Work

### Flow Between Sections

**How it works:**
1. User clicks section tab at top → Section loads
2. User edits content in text editor (or generates with AI)
3. If section needs tables → Tables section appears
4. User creates and fills tables (with AI or manually)
5. User clicks another section tab → Current section auto-saves, new section loads
6. All sections saved automatically

**Example:**
```
User clicks "02 Market Opportunity" tab
  ↓
Section loads: Title, Description, Editor, Smart Hints (with questions)
  ↓
User clicks "✨ Generate with AI"
  ↓
AI generates complete section using all prompts + previous sections
  ↓
Content appears in editor
  ↓
User sees: "📊 Tables & Charts" section (optional for market sections)
  ↓
User can create competitor table (optional) or skip
  ↓
User clicks "03 Project Description" tab
  ↓
Current section auto-saves
  ↓
New section loads: Title, Description, Editor
  ↓
Tables section appears (always, because category = 'project')
```

---

## Tables & Charts Flow: Connection to Text Editor

### The Connection Flow

**Step 1: User Writes Text**
```
Text Editor:
"Our revenue projections show strong growth over the next 3 years. 
We expect to reach €500,000 in Year 1, growing to €1.2 million 
by Year 3. Our main cost drivers include personnel, marketing, 
and technology infrastructure..."
```

**Step 2: Tables Appear (If Section Needs Them)**
```
📊 Tables & Charts Section appears below editor
```

**Step 3: User Creates Table**
```
User clicks "📊 Add Table"
  ↓
Table editor opens
  ↓
User creates: "Revenue Projections" table
  ↓
Table structure created (empty)
```

**Step 4: AI Fills Table from Text**
```
User clicks "✨ Fill with AI from Text"
  ↓
AI reads text editor content
  ↓
AI extracts data: "€500,000 in Year 1, €1.2M by Year 3"
  ↓
AI fills table:
  Year 1: €500,000
  Year 2: €800,000
  Year 3: €1,200,000
```

**Step 5: Chart Auto-Generates**
```
Table filled
  ↓
Chart automatically generates from table data
  ↓
Bar chart shows revenue growth
```

**Step 6: User Can Edit**
```
User can:
- Edit table values manually
- Edit text editor (changes don't auto-update table)
- Click "✨ Fill with AI from Text" again to regenerate
- Add more tables
- Navigate between tables
```

---

## Tables & Charts Navigation

### If Section Has Multiple Tables/Charts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                                           │
│                                                                             │
│ Navigation: [← Previous]  [Table 1 of 3]  [Next →]                          │
│                                                                             │
│ ┌─ Revenue Table (Current) ────────────────────────────────────────────┐ │
│ │ [Table content]                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ All Tables: [Revenue] [Costs] [Cash Flow]  ← Click to jump                 │
│                                                                             │
│ [📊 Add Table] [📈 Add Chart]                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Navigation Options:**
1. **Previous/Next buttons** - Navigate sequentially
2. **Table tabs** - Click to jump to specific table
3. **Keyboard shortcuts** - Arrow keys to navigate

**Features:**
- Shows current table number (e.g., "Table 1 of 3")
- Quick jump to any table via tabs
- Smooth transitions between tables

---

## Customization: How Tables Connect to Text

### Connection Modes

**Mode 1: AI Auto-Fill (Recommended)**
```
Text Editor: "Revenue: €500K Year 1, €1.2M Year 3"
  ↓
User clicks "✨ Fill with AI from Text"
  ↓
AI extracts and fills table
  ↓
Table and text stay in sync (user can edit either)
```

**Mode 2: Manual Entry**
```
User creates table
  ↓
User fills table manually
  ↓
Text editor and table are independent
  ↓
User can reference table in text: "See Revenue Table below"
```

**Mode 3: Two-Way Sync (Advanced)**
```
User edits text → AI suggests table updates
User edits table → AI suggests text updates
  ↓
Both stay connected (optional feature)
```

### Current Implementation

**Recommended:** Mode 1 (AI Auto-Fill)
- User writes text first
- AI fills tables from text when requested
- User can edit either independently
- Simple, clear, flexible

---

### 2. Text Editor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Toolbar: [B] [I] [U] [• List] [1. List] [Link] [Image]                      │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                         │ │
│ │ [Rich text editor - Google Docs style]                                 │ │
│ │                                                                         │ │
│ │ Start writing your market opportunity...                               │ │
│ │                                                                         │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Rich text formatting toolbar
- Bold, italic, underline
- Bulleted list, numbered list
- Links, images
- Clean, minimal design

---

### 3. Action Buttons

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [✨ Generate with AI]  [💡 Smart Hints]  [⏭️ Skip Section]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Buttons:**
- **Generate with AI** - Blue, primary button
- **Smart Hints** - Secondary button, toggles panel
- **Skip Section** - Tertiary button, marks as optional

---

### 4. 💡 Smart Hints Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💡 Smart Hints                                                              │
│                                                                             │
│ [Collapse ▲]                                                                │
│                                                                             │
│ 💡 Who is the target market?                                               │
│ 💡 How large is the market?                                                 │
│ 💡 What trends support your opportunity?                                   │
│                                                                             │
│ [Use Questions as Guide]  [Insert All into Editor]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Collapsible panel** - Hidden by default, user can expand
- **Shows section prompts as questions** - From `sectionTemplate.prompts`
- **OPTIONAL guidance** - Questions are suggestions, not required
- **"Use Questions as Guide"** - Shows questions above editor as reference
- **"Insert All"** - Inserts all questions into editor as a starting template

**Important:**
- Questions are **NOT the default mode** - User always sees free text editor
- Questions are **optional hints** - User can ignore them completely
- AI uses ALL prompts as context when generating, even if user skips questions
- Smart Hints panel is **collapsed by default** - User can expand if they want guidance

---

### 5. 📊 Tables & Charts Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Tables & Charts                                                           │
│                                                                             │
│ Navigation: [← Previous Table]  [Table 1 of 3]  [Next Table →]             │
│                                                                             │
│ ┌─ Revenue Table ────────────────────────────────────────────────────────┐ │
│ │ ┌─────────────┬─────────┬─────────┐                                  │ │
│ │ │ Item        │ Year 1  │ Year 2  │                                  │ │
│ │ ├─────────────┼─────────┼─────────┤                                  │ │
│ │ │ Product A   │ [1000]  │ [1500]  │                                  │ │
│ │ └─────────────┴─────────┴─────────┘                                  │ │
│ │                                                                         │ │
│ │ Connected to text: "Our revenue projections show..."                  │ │
│ │ [✨ Fill with AI from Text] [Edit] [Delete]                           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─ Revenue Chart ────────────────────────────────────────────────────────┐ │
│ │ [Bar chart visualization - auto-generated from Revenue Table]           │ │
│ │ [Chart Type ▼] [Edit] [Hide]                                           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ [📊 Add Table] [📈 Add Chart] [📷 Add Image]                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Only shows if section needs tables/charts
- Each table in a card
- Charts auto-generated from tables
- **Navigation between tables** (if multiple tables)
- **Connection to text editor** - AI can fill tables from text content
- Add buttons at bottom

**Flow:**
1. User writes text in editor
2. Tables/charts appear below (if section needs them)
3. User can navigate between tables using Previous/Next
4. AI can fill tables from text content
5. Charts auto-generate from table data

---

## Alternative: Sidebar Layout (Optional)

If you prefer Requirements and AI Assistant on the side instead of header:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Main Editor          │ Sidebar                                              │
│                     │ ┌─────────────────────────────────────────────────┐   │
│ [Editor content]    │ │ 📋 Requirements                                  │   │
│                     │ │ 3 issues • 65% complete                         │   │
│                     │ │ [View Details →]                                │   │
│                     │ │                                                  │   │
│                     │ │ 💬 AI Assistant                                 │   │
│                     │ │ [Start Chat →]                                  │   │
│                     │ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Recommendation:** Header placement - Always visible, doesn't take editor space, cleaner design

---

## Header (With Requirements & AI Assistant)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Business Plan Editor  [📋 Requirements] [💬 AI Assistant]  [👁️ Preview]    │
│                                                                              │
│ ┌─ Program Selector ─────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Product: [Strategy ▼]  Route: [Grant ▼]  Program: [FFG Basisprogramm ▼]│ │
│ │                                                                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Title: "Business Plan Editor" (left aligned, large, bold)
- **Requirements button** (shows badge with issue count if any)
- **AI Assistant button** (always visible)
- Preview button (right aligned, icon only, clean design)
- **Program Selector** (below title, beautiful dropdown design)

**Button Design:**
- Requirements: `[📋 Requirements]` or `[📋 Requirements (3)]` if issues exist
- AI Assistant: `[💬 AI Assistant]`
- Both buttons: Clean, icon + text, hover effects
- Badge on Requirements button shows issue count

**Program Selector Design:**
- **Three dropdowns in a row:**
  - Product: Strategy / Review / Submission
  - Route: Grant / Loan / Equity / Visa
  - Program: FFG Basisprogramm / AWS Preseed / etc.
- **Visual Style:**
  - Clean dropdowns with icons
  - Hover effects
  - Selected state clearly visible
  - Responsive layout (stacks on mobile)
- **Styling:**
  - `bg-white border border-gray-300 rounded-lg px-4 py-2`
  - `hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200`
  - Dropdown arrow icon
  - Selected value highlighted

---

## Section Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [←] [01 ✓ Executive] [02 ⚠ Market] [03 ○ Project] ... [→]                 │
│                                                                             │
│ Overall: ████████░░░░░░░░░░ 45% Complete (3 of 9 sections)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- Scroll arrows (if many sections)
- Section tabs with status icons (✓ ⚠ ○)
- Active section highlighted (blue background, white text)
- Inactive sections (gray background, gray text)
- Progress bar below sections (blue fill, gray background)
- Section count (right side)
- **Color scheme:**
  - Active tab: `bg-blue-600 text-white`
  - Inactive tab: `bg-gray-100 text-gray-700 hover:bg-gray-200`
  - Progress bar: `bg-blue-500` (filled), `bg-gray-200` (background)

---

## Implementation Checklist

### Phase 1: Core Layout

- [ ] Header component (with preview button)
- [ ] Program selector (Product, Route, Program dropdowns)
- [ ] Section navigation bar (with progress)
- [ ] Main editor container
- [ ] Section header (title + description only)
- [ ] Text editor area
- [ ] Action buttons row

### Phase 2: Features

- [ ] 💡 Smart Hints panel (collapsible)
- [ ] 📊 Tables & Charts section
- [ ] (Section navigation already handled by top navigation bar)

### Phase 3: Polish

- [ ] Rich text toolbar
- [ ] Formatting options
- [ ] Better table UI
- [ ] Chart visualizations
- [ ] Animations/transitions

---

## Component Structure

```
Editor.tsx
├── Header.tsx
│   ├── ProgramSelector.tsx (Product, Route, Program dropdowns)
│   ├── RequirementsButton.tsx (with badge for issues)
│   ├── AIAssistantButton.tsx
│   └── PreviewButton.tsx
├── SectionNavigation.tsx
│   └── ProgressBar.tsx
└── MainEditorArea.tsx
    ├── SectionHeader.tsx
    │   ├── SectionTitle.tsx
    │   └── SectionDescription.tsx
    ├── TextEditor.tsx
    ├── ActionButtons.tsx
    ├── SmartHintsPanel.tsx
    └── TablesChartsSection.tsx
```

---

## Key Design Principles

1. **Clean & Minimal** - No clutter, focus on writing
2. **Always Visible** - Section title, description, editor always shown
3. **Optional Features** - Smart Hints, Tables collapsible/conditional
4. **Clear Actions** - Big, obvious buttons
5. **Header Integration** - Requirements and AI Assistant in header, always visible
6. **One Editor Mode** - No confusing toggles, just one editor
7. **Visual Hierarchy** - Emojis for quick recognition (💡 Smart Hints, 📊 Tables)
8. **Beautiful Selectors** - Program selector with clean dropdowns
9. **Top Navigation** - Section tabs at top handle all navigation
10. **Card-Based Design** - Section header in card for visual separation

## Section Navigation - Already at Top!

**You're right!** Section navigation already exists at the top in the section navigation bar:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [←] [01 ✓ Executive] [02 ⚠ Market] [03 ○ Project] ... [→]                 │
│                                                                              │
│ Overall Progress: ████████░░░░░░░░░░ 45% Complete (3 of 9 sections)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**This handles:**
- Click any section tab to jump to it
- Scroll arrows (← →) if many sections
- Shows current section (highlighted)
- Shows progress for all sections

**No need for duplicate navigation in section header!** The top navigation bar is sufficient.

**Note:** We removed question-by-question mode. User always sees regular editor. Questions are shown as optional hints in Smart Hints panel.

---

## Summary: Complete Flow & Behavior

### Key Principles

1. **Questions are Optional**
   - Questions come from `sectionTemplate.prompts`
   - Shown in Smart Hints panel (collapsed by default)
   - User can skip them entirely
   - AI uses ALL prompts as context when generating (even if user skips)

2. **AI Generation is Comprehensive**
   - Always generates for the **entire section**, not just one question
   - Uses all prompts + previous sections + program requirements
   - Maintains consistency across sections
   - Has memory via conversation history

3. **Section Order Matters**
   - Sections have `order` field in templates
   - Recommended: Executive → Market → Business Model → Financial → Risk
   - AI references previous sections when generating new content

4. **Tables/Charts Based on Category**
   - `financial` → Always needs tables (Revenue, Costs, Cash Flow)
   - `risk` → Always needs tables (Risk Matrix)
   - `project` → Always needs tables (Milestones)
   - `market` → Maybe needs tables (Competitor Analysis, optional)
   - `team` → Maybe needs tables (Hiring Timeline, optional)
   - `general` → No tables (Executive Summary)

5. **Unified Flow Pattern**
   - User writes text OR generates with AI
   - If section needs tables → Tables section appears
   - User creates table structure
   - AI fills table from text (when requested)
   - Chart auto-generates from table
   - User can customize everything

### Complete User Journey Example

```
1. User opens "Market Opportunity" section
   → Smart Hints shows questions (collapsed by default)
   → User can expand to see questions OR ignore them

2. User clicks "✨ Generate with AI"
   → AI uses ALL prompts as context (even if user didn't read them)
   → AI also uses: Executive Summary content, Program requirements
   → AI generates complete section

3. Content appears in editor
   → User can edit, refine, or regenerate

4. Tables section appears (optional for market sections)
   → User can create Competitor Analysis table (optional)
   → OR skip tables entirely

5. User clicks "03 Project Description" tab
   → Current section auto-saves
   → New section loads
   → Tables section appears (always, because category = 'project')

6. User writes text about milestones
   → User creates Milestone Timeline table
   → User clicks "✨ Fill with AI from Text"
   → AI extracts milestones, dates, fills table
   → Gantt chart auto-generates

7. User navigates to Financial section
   → AI references previous sections (Market, Project)
   → User generates content with AI
   → AI maintains consistency (e.g., uses same funding amount from Executive Summary)
   → Tables section appears (always)
   → User creates multiple tables (Revenue, Costs, Cash Flow)
   → AI fills each table from text
   → Charts auto-generate
```

---

---

## Quick Reference: Step-by-Step Flow Summary

### When User Switches Sections

**From Text-Only Section → Section That Needs Tables:**
1. User clicks section tab → Section loads
2. **Tables & Charts section appears immediately** (if category requires it)
3. User sees helpful message: "This section typically includes [table type]"
4. User can start writing text OR create tables first

**From Optional Tables Section → Always-Needs-Tables Section:**
1. User was in Market section (optional tables, user skipped)
2. User clicks Financial section tab
3. **Tables section appears immediately** with different message
4. Message explains: "This section typically includes financial tables"
5. User understands tables are recommended (not optional)

### KPIs Explained

**What are KPIs?**
- Key Performance Indicators (calculated metrics)
- Examples: Revenue Growth %, Profit Margin %, Customer Acquisition Cost
- Only available for Financial tables
- User checks "Include KPIs" when creating table
- KPIs calculate automatically when table is filled

**Where do KPIs appear?**
- As additional rows in the table
- Or as separate KPI section below table
- Update automatically when table values change

### Step 4 Transition - What User Sees

**When Tables Section Appears:**
- **For Financial/Risk/Project sections:** Appears immediately when section loads
- **For Market/Team sections:** Appears after user writes text (optional)
- **For General sections:** Never appears

**What Description User Gets:**
- Financial: "This section typically includes financial tables. Create tables to visualize your revenue, costs, and cash flow projections."
- Risk: "This section typically includes a risk matrix. Create a matrix to visualize risk impact and probability."
- Project: "This section typically includes milestone timelines. Create a timeline to visualize your project schedule."
- Market: "You can optionally add competitor analysis tables. Tables help visualize market data."
- Team: "You can optionally add hiring timeline tables. Tables help visualize team growth."

### Step 6 Safety Features

**Why Step 6 is Safe:**
1. **Confirmation Dialog** - User must confirm before AI fills table
2. **Preview** - Shows text that will be analyzed
3. **Warning** - Clear message that existing data will be overwritten
4. **Cancel Option** - User can cancel at any time
5. **Manual Edit** - User can edit table after AI fills it
6. **Regenerate** - User can regenerate if text changes

### Step 7 Chart Editing - Full Capabilities

**User Can:**
- ✅ Change chart type (Bar, Line, Area, Pie, Gantt, Matrix)
- ✅ Edit colors (each data series, background)
- ✅ Edit labels (title, axis labels, legend)
- ✅ Add description (text below chart explaining the data)
- ✅ Hide/show chart (without deleting)
- ✅ Delete chart (keeps table)

**Chart Description:**
- User can add explanatory text below chart
- Helps explain what the chart shows
- Useful for reviewers/readers
- Saved with chart data

---

---

## Simplified Directory Structure - Everything Integrated

### Current Files Analysis (9 files)

```
features/editor/components/
├── Editor.tsx (847 lines - main component) ⚠️ NEEDS REFACTORING
├── ProgramSelector.tsx (FULL PAGE wizard - NOT suitable for header) ⚠️ NEED SIMPLE VERSION
├── SimpleTextEditor.tsx ✅ CAN USE AS-IS (simple textarea editor)
├── RequirementsModal.tsx ✅ CAN USE AS-IS (modal component)
├── SectionContentRenderer.tsx ✅ CAN REUSE LOGIC (tables/charts rendering)
├── DataChart.tsx ✅ CAN REUSE (chart component)
├── FinancialAnalysis.tsx ✅ CAN REUSE (financial tables)
├── ImageUpload.tsx ✅ CAN REUSE (image upload)
└── StructuredFields.tsx ✅ CAN REUSE (structured fields)
```

### What We Can Integrate vs What We Need to Create

**✅ CAN INTEGRATE (Use As-Is):**
1. **SimpleTextEditor.tsx** - Perfect simple textarea editor
2. **RequirementsModal.tsx** - Already works, just needs to be called
3. **SectionContentRenderer.tsx** - Can extract table/chart rendering logic
4. **DataChart.tsx** - Chart component
5. **FinancialAnalysis.tsx** - Financial tables
6. **ImageUpload.tsx** - Image upload
7. **StructuredFields.tsx** - Structured fields

**⚠️ NEEDS SIMPLE VERSION:**
1. **ProgramSelector.tsx** - Current is FULL PAGE wizard, need SIMPLE dropdown version for header

**🔄 SIMPLIFY & INTEGRATE:**
1. **Editor.tsx** - Keep header/navigation/content inline (organized sections)
2. **ProgramSelector.tsx** - Simplify to dropdowns only
3. **SectionContentRenderer.tsx** - Integrate DataChart, FinancialAnalysis, ImageUpload, StructuredFields

### Simplified Structure - No New Files, Just Reorganize

**Goal:** Keep everything in Editor.tsx, simplify ProgramSelector, integrate components.

```
features/editor/
├── components/
│   ├── Editor.tsx                    # Main component (header/nav/content all inline, organized)
│   ├── ProgramSelector.tsx           # 🔄 SIMPLIFIED: Just dropdowns (Product/Route/Program)
│   ├── SimpleTextEditor.tsx          # ✅ USE AS-IS
│   ├── RequirementsModal.tsx         # ✅ USE AS-IS
│   └── SectionContentRenderer.tsx    # 🔄 INTEGRATED: Includes DataChart, FinancialAnalysis, ImageUpload, StructuredFields
│
├── engine/
│   ├── aiHelper.ts
│   ├── categoryConverters.ts
│   ├── dataSource.ts
│   └── doctorDiagnostic.ts
│
├── hooks/
│   └── useSectionProgress.ts
│
├── utils/
│   └── tableInitializer.ts
│
├── types/
│   └── editor.ts
│
└── prompts/
    └── sectionPrompts.ts
```

**Total: 5 component files (simplified from 9)**

**Key Changes:**
- **Editor.tsx** - Contains header, navigation, and content sections (organized with comments)
- **ProgramSelector.tsx** - Simplified to just 3 dropdowns (Product/Route/Program)
- **SectionContentRenderer.tsx** - Integrated all chart/table/image/field components
- **No new files** - Everything integrated into existing structure

### Implementation Plan

**Step 1: Simplify ProgramSelector.tsx**
- Remove full page wizard code
- Keep only 3 dropdowns (Product/Route/Program)
- Simple, clean component

**Step 2: Integrate Components into SectionContentRenderer.tsx**
- Move DataChart logic inline
- Move FinancialAnalysis logic inline
- Move ImageUpload logic inline
- Move StructuredFields logic inline
- Delete DataChart.tsx, FinancialAnalysis.tsx, ImageUpload.tsx, StructuredFields.tsx

**Step 3: Organize Editor.tsx**
- Add clear section comments: `// ========= HEADER =========`, `// ========= NAVIGATION =========`, `// ========= CONTENT =========`
- Keep all code inline but well-organized
- Use existing structure, just add organization

**Step 4: Test & Clean**
- Test all functionality
- Remove unused imports
- Clean up any dead code

### Final Structure

```
features/editor/
├── components/
│   ├── Editor.tsx                    # All inline (header/nav/content organized)
│   ├── ProgramSelector.tsx           # Simple dropdowns only
│   ├── SimpleTextEditor.tsx          # Text editor
│   ├── RequirementsModal.tsx        # Requirements checker
│   └── SectionContentRenderer.tsx    # Integrated: Charts + Tables + Images + Fields
│
├── engine/                           # AI & data processing
├── hooks/                            # React hooks
├── utils/                            # Utilities
├── types/                            # TypeScript types
└── prompts/                          # AI prompts
```

**Total: 5 component files (down from 9)**

### Templates Organization

**Current:** `shared/templates/` (mixed: sections + documents)

**Recommended:** Split templates
- **Editor templates** → `features/editor/templates/` (sections, templateKnowledge)
- **Shared templates** → `shared/templates/` (documents only)

**What Editor Needs:**
- `sections.ts` - Master section templates (67KB)
- `templateKnowledge.ts` - Template knowledge (26KB)
- `types.ts` - SectionTemplate type (1.6KB)
- `index.ts` - getSections(), getTemplateKnowledge() (3KB)

**Total: ~97KB (mostly data, can't be reduced)**

See `docs/TEMPLATES_MIGRATION_PLAN.md` for full migration plan.

---

### Editor.tsx Structure (All Inline, Organized)

**Editor.tsx will contain everything inline with clear section comments:**

```tsx
// features/editor/components/Editor.tsx
export default function Editor({ programId, product = 'submission', route = 'grant' }: EditorProps) {
  // ========= STATE =========
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSmartHints, setShowSmartHints] = useState(false);
  
  // ========= EFFECTS =========
  useEffect(() => { loadSections(); }, [programId, product, route]);
  
  // ========= HANDLERS =========
  const handleContentChange = (content: string) => { /* ... */ };
  const handleGenerateAI = () => { /* ... */ };
  
  if (isLoading) return <LoadingSpinner />;
  
  const currentSection = sections[activeSection];
  const progress = calculateSectionProgress(sections);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ========= HEADER ========= */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-white">Business Plan Editor</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowRequirements(true)}>
                📋 Requirements {requirementsCount ? `(${requirementsCount})` : ''}
              </button>
              <button onClick={() => setShowAIAssistant(true)}>💬 AI Assistant</button>
              <button onClick={() => router.push('/preview')}>👁️ Preview</button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <ProgramSelector 
              product={product}
              route={route}
              programId={programId}
              onProductChange={handleProductChange}
              onRouteChange={handleRouteChange}
              onProgramChange={handleProgramChange}
            />
          </div>
        </div>
      </header>
      
      {/* ========= SECTION NAVIGATION ========= */}
      <nav className="sticky top-[120px] z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {sections.map((section, index) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(index)}
                className={`px-4 py-2 rounded-lg ${
                  index === activeSection ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                {String(index + 1).padStart(2, '0')} {section.title}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <ProgressBar progress={progress} />
            <div className="text-sm text-gray-600 mt-1">
              {progress.percentage}% Complete ({progress.completed} of {progress.total})
            </div>
          </div>
        </div>
      </nav>
      
      {/* ========= MAIN EDITOR AREA ========= */}
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {currentSection && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-blue-500 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentSection.title}</h2>
              <p className="text-gray-600">{template.description}</p>
            </div>
            
            {/* Text Editor */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <SimpleTextEditor 
                content={currentSection.content}
                onChange={(content) => handleContentChange(currentSection.key, content)}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={handleGenerateAI}>✨ Generate with AI</button>
              <button onClick={() => setShowSmartHints(!showSmartHints)}>💡 Smart Hints</button>
              <button onClick={handleSkip}>⏭️ Skip Section</button>
            </div>
            
            {/* Smart Hints Panel */}
            {showSmartHints && prompts && (
              <SmartHintsPanel prompts={prompts} />
            )}
            
            {/* Tables & Charts */}
            <SectionContentRenderer
              section={currentSection}
              template={template}
              onTableChange={handleTableChange}
              onChartTypeChange={handleChartTypeChange}
            />
          </div>
        )}
      </main>
      
      {/* ========= MODALS ========= */}
      <RequirementsModal 
        isOpen={showRequirements}
        onClose={() => setShowRequirements(false)}
      />
    </div>
  );
}
```

### ProgramSelector.tsx (Simplified)

**Update existing ProgramSelector.tsx to just dropdowns:**

```tsx
// features/editor/components/ProgramSelector.tsx
interface ProgramSelectorProps {
  product: string;
  route: string;
  programId?: string;
  onProductChange: (product: string) => void;
  onRouteChange: (route: string) => void;
  onProgramChange: (programId: string) => void;
  availablePrograms?: Array<{ id: string; name: string }>;
}

export default function ProgramSelector({
  product,
  route,
  programId,
  onProductChange,
  onRouteChange,
  onProgramChange,
  availablePrograms = []
}: ProgramSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">🎯 Product:</span>
        <select value={product} onChange={(e) => onProductChange(e.target.value)}>
          <option value="strategy">Strategy</option>
          <option value="review">Review</option>
          <option value="submission">Submission</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">🛣️ Route:</span>
        <select value={route} onChange={(e) => onRouteChange(e.target.value)}>
          <option value="grant">Grant</option>
          <option value="loan">Loan</option>
          <option value="equity">Equity</option>
          <option value="visa">Visa</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">📋 Program:</span>
        <select value={programId || ''} onChange={(e) => onProgramChange(e.target.value)}>
          <option value="">Select Program</option>
          {availablePrograms.map(program => (
            <option key={program.id} value={program.id}>{program.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

### SectionContentRenderer.tsx (Integrated)

**Integrate DataChart, FinancialAnalysis, ImageUpload, StructuredFields into SectionContentRenderer.tsx:**
- Move all chart rendering logic inline
- Move financial analysis calculations inline
- Move image upload UI inline
- Move structured fields UI inline
- Delete separate component files after integration

---

**Status:** Ready for Implementation - Minimal Structure, Layout First

