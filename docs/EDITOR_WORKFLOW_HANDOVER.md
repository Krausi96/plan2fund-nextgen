# Plan2Fund Editor - Complete Workflow Handover

**Purpose**: This document explains the complete flow of how the business plan editor works, from product/program selection through section completion, including all component interactions.

**Target Audience**: Developer investigating the editor system

**Last Updated**: 2025-01-20

---

## Table of Contents

1. [Product/Program Selector - How Sections Are Determined](#1-productprogram-selector)
2. [Section & Question Structure](#2-section--question-structure)
3. [Right Panel Components](#3-right-panel-components)
4. [Data Management (Tables/KPIs/Media)](#4-data-management)
5. [Preview & Export](#5-preview--export)
6. [Complete Workflow Example](#6-complete-workflow-example)

---

## 1. Product/Program Selector

### How Sections Are Determined

**Location**: `features/editor/components/Editor.tsx` → `PlanConfigurator` component

**Product Type Selection**:
- User selects product type: `strategy`, `review`, or `submission`
- This is stored in `plan.productType` and passed to `hydrate()` function

**Flow**:
```
User selects product type (e.g., "submission")
  ↓
Editor.hydrate(product, context) called
  ↓
getSections('grants', product, programId, baseUrl) called
  ↓
MASTER_SECTIONS[productType] returned
  ↓
buildSectionFromTemplate() creates Section objects
  ↓
Questions built from template.prompts or template.questions
```

**Key Code** (`Editor.tsx:188-226`):
```typescript
hydrate: async (product, context) => {
  // Funding type is IGNORED - only product type matters
  const templates = await getSections('grants', product, context?.programId, baseUrl);
  const sections = templates.map((template) =>
    buildSectionFromTemplate(template, savedSections)
  );
  // Sets activeSectionId to first section, activeQuestionId to first question
}
```

**Important**: 
- **Funding type is ignored** - the system only uses product type (`strategy`/`review`/`submission`)
- Program selection is optional and doesn't change sections (only provides metadata)
- Sections are **hardcoded** in `features/editor/templates/sections.ts`

### Section Counts by Product Type

- **Strategy**: 6 sections (focused, high-level)
- **Review/Submission**: 9 sections (comprehensive, detailed)

### What Happens When Product Type Changes?

**Current Behavior**: 
- If user changes product type, `setProductType()` updates `plan.productType`
- **BUT**: Sections are NOT reloaded automatically
- User would need to refresh/reload the editor to get new sections

**Code Location**: `Editor.tsx:453-456`
```typescript
setProductType: (product) => {
  const { plan } = get();
  set({ plan: { ...plan, productType: product } });
}
```

**Note**: This is a known limitation - product type change doesn't trigger section reload.

---

## 2. Section & Question Structure

### How Questions Are Built from Templates

**Location**: `Editor.tsx:668-705` → `buildQuestionsFromTemplate()`

**Template Structure** (`sections.ts`):
Each section template has:
- `id`: Unique identifier (e.g., `'project_description'`)
- `title`: Section title (e.g., `'Project Description'`)
- `description`: Section description
- `prompts`: Array of prompt strings (e.g., `['Describe the main objectives...']`)
- `questions`: Optional array of detailed question objects with `text`, `hint`, `placeholder`, `required`

**Question Building Priority**:
1. **If `template.questions` exists** → Use these (detailed questions with hints/placeholders)
2. **Else if `template.prompts` exists** → Convert each prompt to a question
3. **Else** → Create single question from `template.title`

**Code**:
```typescript
function buildQuestionsFromTemplate(template: SectionTemplate, savedAnswer: string): Question[] {
  const seeds = template.questions && template.questions.length > 0
    ? template.questions.map((q) => ({
        prompt: q.text,
        helperText: q.hint,
        placeholder: q.placeholder,
        required: q.required
      }))
    : (template.prompts?.length
        ? template.prompts.map((prompt) => ({
            prompt,
            helperText: template.description,
            placeholder: 'Provide details',
            required: true
          }))
        : [{
            prompt: template.title,
            helperText: template.description,
            placeholder: 'Provide details',
            required: true
          }]);

  return seeds.map((seed, index) => ({
    id: `${template.id}_q${index + 1}`,
    prompt: seed.prompt,
    helperText: seed.helperText,
    placeholder: seed.placeholder,
    required: seed.required,
    answer: index === 0 ? savedAnswer : '', // First question gets saved content
    suggestions: [],
    warnings: [],
    requiredAssets: deriveRequiredAssets(template.validationRules?.requiredFields ?? [])
  }));
}
```

**Result**: Each section has 1-N `Question` objects, each with:
- `id`: Unique ID (e.g., `'project_description_q1'`)
- `prompt`: The question text
- `answer`: User's answer (stored in state)
- `suggestions`: AI-generated suggestions
- `attachments`: Linked datasets/KPIs/media
- `status`: Lifecycle flag (`blank`, `draft`, `complete`, `unknown`) that drives progress, badges, and AI guidance

---

## 3. Right Panel Components

The right panel has **3 tabs**: Assistant, Data, Preview

### 3.1 Assistant Tab (AI)

**Location**: `Editor.tsx:1548-1620` → Right Panel → AI tab

**Functionality**:
1. **"Ask the assistant" button** → Calls `requestAISuggestions(sectionId, questionId)`
2. Shows current question prompt
3. Shows answer preview (first 200 chars)
4. Displays latest AI suggestion with Copy/Insert buttons
5. Can view conversation history (if multiple suggestions)

**AI Suggestion Flow**:
```
User clicks "Ask the assistant"
  ↓
requestAISuggestions(sectionId, questionId) called
  ↓
createAIHelper() created with:
  - sectionScope: section.title
  - userAnswers: All previous answers
  - programHints: Program requirements (if connected)
  ↓
aiHelper.generateSectionContent() called
  ↓
OpenAI API called with:
  - Section title & prompts
  - Template knowledge (best practices, frameworks)
  - Previous answers for context
  - Program requirements
  ↓
Response parsed for:
  - content: Main suggestion text
  - suggestedKPIs: Array of suggested KPIs (auto-created)
  ↓
Question.suggestions[] updated
Question.aiContext updated
KPIs auto-created if suggested
```

**Code Location**: `Editor.tsx:477-561`

**Key Features**:
- AI uses **template knowledge** from `templateKnowledge.ts` (best practices, frameworks)
- AI considers **all previous answers** for context
- AI can **suggest KPIs** automatically (stored in `section.kpis[]`)
- User can **Copy** or **Insert** suggestion into answer

### 3.2 Data Tab

**Location**: `Editor.tsx:1622-1702` → Right Panel → Data tab  
**Component**: `InlineTableCreator.tsx` (renamed to `DataPanel`)

**Overview**: The Data tab is the central hub for managing all data visualizations, metrics, and media assets within a section. It provides a tabbed interface to organize and create multiple datasets, KPIs, and media items.

**Structure**:
- **3 Sub-tabs** (pills at top): 📊 Datasets, 📈 KPIs, 📷 Media
- **Tab badges**: Show count of items (e.g., "📊 Datasets (3)")
- **Search bar**: Appears when >3 items exist, filters items by name/description/tags
- **Create form**: Always visible at top of active tab
- **Library section**: Lists all items for current section, expandable cards

**Functionality**:

#### Creating Multiple Items in One Section

**You can create unlimited items per section**:
1. **Datasets**: Multiple tables/charts (e.g., "Revenue Forecast", "Cost Breakdown", "Market Size")
2. **KPIs**: Multiple metrics (e.g., "Customer Acquisition Cost", "Monthly Recurring Revenue", "Churn Rate")
3. **Media**: Multiple images/charts/documents (e.g., "Product Screenshot", "Architecture Diagram", "Competitor Comparison")

**Each item is independent** and can be:
- Attached to different questions
- Tagged for organization
- Expanded/collapsed for quick overview
- Navigated with Prev/Next buttons

#### Tab Navigation & Overview

**Tab Switching**:
- Click tab pill to switch between Datasets/KPIs/Media
- Search query clears when switching tabs
- Each tab maintains its own filtered list

**Item Cards** (Collapsed View):
- **Icon**: 📊 (dataset), 📈 (KPI), 📷 (media)
- **Name**: Item name (truncated if long)
- **Metadata**: Column count, last updated date
- **Context**: Section name, linked question (if attached)
- **Expand button**: ▶ to expand, ▼ when expanded

**Item Cards** (Expanded View):
- **Description**: Full description text
- **Tags**: All tags displayed as pills
- **Columns** (datasets): List of all columns with types
- **Value/Target** (KPIs): Current value and target
- **Navigation**: ← Prev / Next → buttons to browse items
- **Counter**: "X of Y" showing position in filtered list
- **Actions**: Attach, Edit, View, Delete buttons

#### Data Creation Flow

**For Datasets**:
```
User fills form:
  - Name: "Revenue Forecast"
  - Description: "Monthly revenue projections for 2025"
  - Columns: "Month:string, Revenue:number (EUR), Growth:number (%)"
  - Tags: "financial, projections, revenue"
  ↓
User clicks "Create dataset"
  ↓
createDataset() called
  ↓
Dataset added to section.datasets[]
  ↓
Appears in Data tab → Datasets list
Shows: "📊 Revenue Forecast • 3 columns • Section: Products & Services"
```

**For KPIs**:
```
User fills form:
  - Name: "Customer Acquisition Cost"
  - Value: 45
  - Unit: "EUR"
  - Target: 35
  - Description: "Average cost to acquire one customer"
  ↓
User clicks "Track KPI"
  ↓
createKPI() called
  ↓
KPI added to section.kpis[]
  ↓
Appears in Data tab → KPIs list
Shows: "📈 Customer Acquisition Cost • 45 EUR • Section: Products & Services"
```

**For Media**:
```
User fills form:
  - Title: "Product Architecture Diagram"
  - Type: "image"
  - URI: "https://example.com/diagram.png"
  - Caption: "System architecture overview"
  - Alt Text: "Product architecture diagram"
  - Figure Number: "Figure 1"
  - Tags: "architecture, technical"
  ↓
User clicks "Add media"
  ↓
createMediaAsset() called
  ↓
Media added to section.media[]
  ↓
Appears in Data tab → Media list
Shows: "📷 Product Architecture Diagram • Section: Products & Services"
```

#### Attachment Flow

**Attaching to Questions**:
```
1. User selects a question in main editor (e.g., Q02)
2. User goes to Data tab → Datasets
3. User expands "Revenue Forecast" dataset
4. User clicks "Attach" button
  ↓
onAttachDataset(dataset) called
  ↓
attachDatasetToQuestion(sectionId, questionId, dataset) called
  ↓
Dataset added to question.attachments[]
  ↓
Dataset card shows: "• Question: Describe your revenue model..."
Dataset appears in question card (main editor)
Dataset appears in Preview tab
```

**Multiple Attachments**:
- One question can have **multiple attachments** (e.g., 2 datasets + 1 KPI + 1 image)
- One item can be attached to **multiple questions** (same dataset used in Q01 and Q03)
- Attachments are shown in Preview tab with icons (📊 📈 📷)

#### Item Management

**Viewing Items**:
- Click "View" button → Opens modal with full item details
- For datasets: Shows table structure preview
- For KPIs: Shows value, target, description
- For media: Shows preview (if image) or metadata

**Editing Items**:
- Click "Edit" button → Opens edit modal
- For datasets: Can edit name, description, columns (structure editing coming soon)
- For KPIs: Can edit all fields (name, value, unit, target, description)
- For media: Can edit metadata (title, caption, tags)

**Deleting Items**:
- Click "Delete" button → Removes item from section
- **Warning**: If item is attached to questions, attachments are also removed

**Navigation Between Items**:
- Use ← Prev / Next → buttons to browse items in current tab
- Counter shows position: "2 of 5"
- Useful when section has many items

#### Search & Filtering

**Search Functionality**:
- Search bar appears when >3 items in any tab
- Searches: name, description, tags
- Real-time filtering as you type
- Shows "No items match 'query'" if no results

**Example**:
- Section has 8 datasets
- User types "revenue" in search
- Shows only: "Revenue Forecast", "Revenue by Region", "Revenue Growth"
- Other datasets hidden

**Code Locations**:
- Data Panel: `InlineTableCreator.tsx:263-1261`
- Tab management: `InlineTableCreator.tsx:286-437`
- Item creation: `InlineTableCreator.tsx:328-381`
- Attachment: `Editor.tsx:564-585` → `attachAssetToQuestion()`
- Filtering: `InlineTableCreator.tsx:384-414`

**Key Features**:
- **Unlimited items per section**: Create as many datasets/KPIs/media as needed
- **Section-scoped storage**: All items stored in `section.datasets[]`, `section.kpis[]`, `section.media[]`
- **Question-level attachment**: Items can attach to specific questions via `question.attachments[]`
- **Context display**: Items show which section/question they belong to
- **Navigation**: Prev/Next buttons for browsing, clickable question links to jump to questions
- **Search**: Filter items by name/description/tags
- **Expandable cards**: Collapsed view for overview, expanded for details

### 3.3 Preview Tab

**Location**: `Editor.tsx:1704-1722` → Right Panel → Preview tab  
**Component**: `SectionContentRenderer.tsx`

**Functionality**:
1. **Section preview**: Shows current section with all questions/answers
2. **Answer preview**: First 100 chars of each answer
3. **Attachment indicators**: Shows attached datasets/KPIs/media
4. **Export buttons**:
   - "Open full preview" → Navigates to `/preview` page
   - "Export draft" → Exports current section as PDF/DOCX

**Preview Content**:
- Shows all questions in section (Q01, Q02, ...)
- Shows answer preview (100 chars) or `[No answer yet]`
- Shows attachments with icons (📊 table, 📈 chart, 📷 image)
- **Requirements summary** section at bottom (shows progress when "Run check" clicked)

**Code Location**: `SectionContentRenderer.tsx:130-268`

**Export Flow**:
```
User clicks "Export draft"
  ↓
createExportDocument(section, plan) creates PlanDocument
  ↓
convertSectionToPlanSection() converts Section → PlanSection
  ↓
exportManager.exportPlan() called with PDF/DOCX format
  ↓
File downloads automatically
```

---

## 4. Data Management

### 4.1 Datasets (Tables)

**Storage**: `section.datasets: Dataset[]`

**Structure**:
```typescript
{
  id: string;
  name: string;
  description: string;
  columns: Array<{ name: string; type: 'string' | 'number' }>;
  rows: Array<Record<string, string | number>>;
  tags: string[];
  sectionId: string;
  questionId?: string; // If attached to question
}
```

**Creation**: User creates via Data tab → TableEditor component  
**Attachment**: Can attach to questions (appears in question card)  
**Display**: Shown in Preview tab, exported in PDF/DOCX

### 4.2 KPIs

**Storage**: `section.kpis: KPI[]`

**Structure**:
```typescript
{
  id: string;
  name: string;
  value: number;
  unit?: string;
  target?: number;
  description?: string;
  sectionId: string;
  questionId?: string; // If attached to question
}
```

**Creation**: 
- **Manual**: User creates via Data tab → KPIEditor
- **AI**: Auto-created when AI suggests KPIs (`suggestedKPIs` in AI response)

**Attachment**: Can attach to questions  
**Display**: Shown in Preview tab, exported in PDF/DOCX

### 4.3 Media Assets

**Storage**: `section.media: MediaAsset[]`

**Structure**:
```typescript
{
  id: string;
  type: 'image' | 'chart' | 'table' | 'document';
  title: string;
  uri: string;
  caption?: string;
  altText?: string;
  sectionId: string;
  questionId?: string; // If attached to question
}
```

**Creation**: User creates via Data tab → MediaEditor  
**Attachment**: Can attach to questions  
**Display**: Shown in Preview tab, exported in PDF/DOCX

---

## 5. Preview & Export

### 5.1 Preview Tab (Right Panel)

**Shows**: Current section only (condensed view)  
**Content**: Questions + answer previews (100 chars) + attachments  
**Actions**: Open full preview, Export draft

### 5.2 Full Preview Page

**Route**: `/preview`  
**Shows**: Complete business plan (all sections)  
**Format**: Full rendered document with all content

### 5.3 Export

**Formats**: PDF, DOCX  
**Scope**: Can export single section (draft) or full plan  
**Watermark**: Draft exports include watermark  
**Content**: All questions, answers, tables, KPIs, media, attachments

---

## 6. Complete Workflow Example

### Example: "Products and Services" Section (Submission Product)

**Note**: This example uses a hypothetical "Products and Services" section. In the actual system, this might be part of "Business Model & Value Proposition" or "Project Description". The workflow principles apply to any section.

**Assumptions**:
- Product type: `submission`
- Section: `products_and_services` (hypothetical)
- Template has 4 prompts:
  1. "Describe your core products and services in detail."
  2. "What are the key features and benefits of each product/service?"
  3. "How do your products/services solve customer problems?"
  4. "What is your pricing strategy for each product/service?"

---

### Step 1: Editor Initialization

1. User selects product type: `submission`
2. `hydrate('submission', context)` called
3. `getSections('grants', 'submission')` returns `FULL_SECTIONS` (9 sections)
4. `buildSectionFromTemplate()` creates `Section` objects
5. For `products_and_services`:
   - Template has `prompts: ['Describe your core products...', 'What are the key features...', ...]`
   - `buildQuestionsFromTemplate()` creates 4 `Question` objects:
     - `products_and_services_q1`: "Describe your core products and services in detail."
     - `products_and_services_q2`: "What are the key features and benefits of each product/service?"
     - `products_and_services_q3`: "How do your products/services solve customer problems?"
     - `products_and_services_q4`: "What is your pricing strategy for each product/service?"
6. Editor loads with first section (`executive_summary`) active

---

### Step 2: User Navigates to "Products and Services"

1. User clicks "Products and Services" in left sidebar
2. `setActiveSection('products_and_services')` called
3. `setActiveQuestion('products_and_services_q1')` called (first question)
4. Main editor shows:
   - Section header: "Products and Services"
   - Question navigation bar: Q01, Q02, Q03, Q04 buttons
   - Active question card: Q01 with textarea
5. Right panel shows:
   - Assistant tab: "Ask the assistant" button, current question prompt
   - Data tab: Empty (no datasets/KPIs/media yet) - shows 3 tabs: 📊 Datasets (0), 📈 KPIs (0), 📷 Media (0)
   - Preview tab: Shows section with `[No answer yet]` for all questions

---

### Step 3: User Answers Q01

1. User types answer in Q01 textarea
2. `updateAnswer('project_description_q1', content)` called
3. Question’s `answer` and `status` fields updated (remains `draft` until the response has either a bullet or two sentences; becomes `complete` once the minimum threshold is met)
4. Section `progress` recalculates only when a question reaches `complete`; prompts marked as `unknown` remain excluded until answered
5. Preview tab updates to show answer preview (100 chars)
6. User can click **Mark as unknown** to log a deliberate omission with an optional note; the prompt shows a badge and stays out of progress until cleared

---

### Step 4: User Asks AI for Q02

1. User clicks Q02 button (navigates to second question: "What are the key features and benefits...")
2. User clicks "Ask the assistant" in right panel
3. `requestAISuggestions('products_and_services', 'products_and_services_q2')` called
4. AI helper created with:
   - Section: "Products and Services"
   - Template prompts: All 4 prompts
   - Previous answers: Q01 answer (for context)
   - Template knowledge: Best practices for product/service description
5. OpenAI API called
6. Response received:
   ```json
   {
     "content": "Key features include: 1) Real-time analytics dashboard...",
     "suggestedKPIs": [
       { "name": "Customer Satisfaction Score", "value": 4.5, "unit": "out of 5" },
       { "name": "Product Adoption Rate", "value": 65, "unit": "%" }
     ]
   }
   ```
7. Question updated:
   - `question.suggestions[]` = ["Key features include: 1) Real-time analytics dashboard..."]
   - `question.aiContext.lastSuggestion` = response content
8. KPIs auto-created:
   - `section.kpis[]` += `{ name: "Customer Satisfaction Score", value: 4.5, ... }`
   - `section.kpis[]` += `{ name: "Product Adoption Rate", value: 65, ... }`
9. Right panel shows:
   - Latest suggestion with Copy/Insert buttons
   - Data tab → KPIs tab now shows: "📈 KPIs (2)" badge
   - Both KPIs appear in KPIs list

---

### Step 5: User Creates Multiple Datasets

1. User switches to Data tab → Datasets tab (📊 Datasets)
2. User creates first dataset "Product Pricing Table":
   - Name: "Product Pricing Table"
   - Description: "Pricing tiers for our three main products"
   - Columns: "Product:string, Tier:string, Price:number (EUR), Features:string"
   - Tags: "pricing, products, financial"
   - User clicks "Create dataset"
   - `onDatasetCreate(dataset)` called
   - Dataset added to `section.datasets[]`
   - Appears in list: "📊 Product Pricing Table • 4 columns • Section: Products and Services"

3. User creates second dataset "Service Comparison Matrix":
   - Name: "Service Comparison Matrix"
   - Description: "Comparison of our services vs competitors"
   - Columns: "Feature:string, Our Service:boolean, Competitor A:boolean, Competitor B:boolean"
   - Tags: "competitive, services, comparison"
   - User clicks "Create dataset"
   - Second dataset added to `section.datasets[]`
   - Tab badge updates: "📊 Datasets (2)"
   - Both datasets visible in list

4. User creates third dataset "Revenue by Product":
   - Name: "Revenue by Product"
   - Description: "Monthly revenue breakdown by product line"
   - Columns: "Month:string, Product A:number (EUR), Product B:number (EUR), Product C:number (EUR)"
   - Tags: "revenue, financial, products"
   - User clicks "Create dataset"
   - Third dataset added
   - Tab badge: "📊 Datasets (3)"
   - Search bar appears (since >3 items)

---

### Step 6: User Attaches Multiple Items to Questions

1. User navigates to Q03 ("How do your products/services solve customer problems?")
2. User goes to Data tab → Datasets tab
3. User expands "Service Comparison Matrix" dataset (clicks ▶)
4. Expanded view shows:
   - Description: "Comparison of our services vs competitors"
   - Tags: competitive, services, comparison
   - Columns: Feature, Our Service, Competitor A, Competitor B
   - Navigation: "1 of 3" counter
   - Actions: Attach, Edit, View, Delete buttons
5. User clicks "Attach" button
6. `onAttachDataset(dataset)` called
7. `attachDatasetToQuestion('products_and_services', 'products_and_services_q3', dataset)` called
8. Dataset added to `question.attachments[]`
9. Dataset card shows: "• Question: How do your products/services solve customer problems?"
10. Question card in main editor shows attachment indicator (📊)
11. Preview tab shows: "📊 Service Comparison Matrix (attached)"

12. User navigates to Q04 ("What is your pricing strategy...")
13. User goes to Data tab → Datasets tab
14. User expands "Product Pricing Table" dataset
15. User clicks "Attach" button
16. Dataset attached to Q04
17. Q04 now has attachment indicator

18. User switches to KPIs tab (📈 KPIs)
19. User expands "Customer Satisfaction Score" KPI
20. User clicks "Attach" button
21. KPI attached to Q02
22. Q02 now shows: 📊 (dataset) + 📈 (KPI) attachments

---

### Step 7: User Completes All Questions and Adds More Data

1. User answers Q02, Q03, Q04
2. Section progress: 100% (all questions answered)

3. User wants to add a product screenshot:
   - Goes to Data tab → Media tab (📷 Media)
   - Fills form:
     - Title: "Product Dashboard Screenshot"
     - Type: "image"
     - URI: "https://example.com/dashboard.png"
     - Caption: "Main dashboard interface showing key features"
     - Alt Text: "Product dashboard screenshot"
     - Figure Number: "Figure 1"
     - Tags: "product, screenshot, ui"
   - Clicks "Add media"
   - Media added to `section.media[]`
   - Tab badge: "📷 Media (1)"
   - User attaches to Q01

4. User adds another KPI manually:
   - Goes to Data tab → KPIs tab
   - Fills form:
     - Name: "Monthly Recurring Revenue"
     - Value: 125000
     - Unit: "EUR"
     - Target: 150000
     - Description: "Current MRR across all products"
   - Clicks "Track KPI"
   - KPI added
   - Tab badge: "📈 KPIs (3)" (2 from AI + 1 manual)

5. User uses search:
   - Section now has 3 datasets, 3 KPIs, 1 media
   - User types "revenue" in search bar
   - Shows: "Revenue by Product" dataset, "Monthly Recurring Revenue" KPI
   - Other items hidden

6. Preview tab shows:
   - All questions with answer previews (100 chars)
   - All attachments with icons:
     - Q01: 📷 Product Dashboard Screenshot
     - Q02: 📈 Customer Satisfaction Score, 📈 Product Adoption Rate
     - Q03: 📊 Service Comparison Matrix
     - Q04: 📊 Product Pricing Table

---

### Step 8: User Runs Requirements Check

1. User switches to Preview tab
2. User clicks "Run check" button
3. `runRequirementsCheck()` called
4. `convertPlanToLegacySections(plan)` converts all sections
5. Progress calculated for each section
6. Requirements summary shows:
   - Section: Products and Services
   - Progress: 100%
7. Summary displayed in Preview tab

---

### Step 9: User Exports Draft

1. User clicks "Export draft" → Selects "PDF"
2. `handleExportDraft()` called
3. `createExportDocument(section, plan)` creates PlanDocument
4. `convertSectionToPlanSection()` converts Section → PlanSection:
   - Combines all questions/answers into `content` field
   - Converts all 3 datasets to `tables` format:
     - Product Pricing Table
     - Service Comparison Matrix
     - Revenue by Product
   - Includes all 3 KPIs in content
   - Includes media in `figures` array (Product Dashboard Screenshot)
5. `exportManager.exportPlan()` called
6. PDF generated with:
   - Section title: "Products and Services"
   - All questions (Q01-Q04) with full answers
   - All attached tables (3 datasets)
   - All attached KPIs (3 KPIs)
   - Attached image (Product Dashboard Screenshot)
   - Watermark (draft)
7. PDF downloads automatically

---

### Step 10: User Moves to Next Section

1. User clicks next section in left sidebar (e.g., "Market Analysis")
2. `setActiveSection('market_analysis')` called
3. `setActiveQuestion('market_analysis_q1')` called
4. Right panel resets:
   - Assistant tab: Shows new section's first question
   - Data tab: Shows only items for "Market Analysis" section (empty initially)
   - Tab badges reset: "📊 Datasets (0)", "📈 KPIs (0)", "📷 Media (0)"
   - Preview tab: Shows new section preview
5. User can now create new datasets/KPIs/media for this section
6. Items from "Products and Services" section are NOT visible (section-scoped)
7. Process repeats for new section

---

## 7. Full Workflow Summary: Products and Services Section

### Complete Example Walkthrough

**Scenario**: User is creating a "Products and Services" section for a SaaS business plan.

**Initial State**:
- Section: `products_and_services`
- Questions: 4 (Q01-Q04)
- Data: 0 datasets, 0 KPIs, 0 media

**Step-by-Step Actions**:

1. **Answer Q01** → "We offer three main products: Analytics Dashboard, API Platform, and Mobile App"

2. **Ask AI for Q02** → AI suggests features + auto-creates 2 KPIs:
   - Customer Satisfaction Score: 4.5/5
   - Product Adoption Rate: 65%

3. **Create Dataset 1**: "Product Pricing Table"
   - Columns: Product, Tier, Price, Features
   - Tags: pricing, products, financial

4. **Create Dataset 2**: "Service Comparison Matrix"
   - Columns: Feature, Our Service, Competitor A, Competitor B
   - Tags: competitive, services

5. **Create Dataset 3**: "Revenue by Product"
   - Columns: Month, Product A, Product B, Product C
   - Tags: revenue, financial

6. **Attach to Questions**:
   - Q03 ← Service Comparison Matrix (dataset)
   - Q04 ← Product Pricing Table (dataset)
   - Q02 ← Customer Satisfaction Score (KPI)

7. **Add Media**: Product Dashboard Screenshot → Attach to Q01

8. **Add Manual KPI**: Monthly Recurring Revenue: 125,000 EUR

9. **Complete All Questions**: Q02, Q03, Q04 answered

10. **Final State**:
    - Questions: 4/4 answered (100% progress)
    - Datasets: 3 (all attached to questions)
    - KPIs: 3 (2 from AI, 1 manual)
    - Media: 1 (attached to Q01)
    - Total attachments: 5 items across 4 questions

11. **Export**: PDF includes all questions, answers, tables, KPIs, and image

**Key Takeaways from This Example**:
- ✅ Created **multiple datasets** in one section (3 tables)
- ✅ Created **multiple KPIs** (3 metrics)
- ✅ Used **AI suggestions** that auto-created KPIs
- ✅ Attached items to **different questions**
- ✅ Used **search** to filter items
- ✅ **Section-scoped** data (items only visible in this section)
- ✅ All items appear in **Preview** and **Export**

---

## Key Takeaways

1. **Sections are product-type specific** (strategy vs review/submission)
2. **Questions are built from template prompts** (1-N questions per section)
3. **AI suggestions are question-scoped** (uses section context + previous answers)
4. **Data items are section-scoped** but can attach to questions
5. **Preview shows current section only** (condensed view)
6. **Export can be section-level** (draft) or full plan
7. **Requirements check is manual** (on-demand, not automatic)
8. **Product type change doesn't reload sections** (known limitation)

---

## File Reference

- **Main Editor**: `features/editor/components/Editor.tsx`
- **Templates**: `features/editor/templates/sections.ts`
- **Data Panel**: `features/editor/components/InlineTableCreator.tsx`
- **Preview**: `features/editor/components/SectionContentRenderer.tsx`
- **AI Helper**: `features/editor/engine/aiHelper.ts`
- **Types**: `features/editor/types/plan.ts`

---

## Questions for Investigation

1. **Product type switching**: Should changing product type reload sections automatically?
2. **Program-specific sections**: Currently ignored - should program selection affect sections?
3. **Requirements check**: Should this be automatic or remain manual?
4. **AI context**: Should AI consider answers from other sections for better suggestions?
5. **Data sharing**: Can datasets/KPIs be shared across sections or always section-scoped?

---

**End of Handover Document**

