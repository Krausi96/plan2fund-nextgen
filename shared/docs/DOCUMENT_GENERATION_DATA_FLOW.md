# Document Generation Data Flow & Structure

## 📊 **DATA SOURCES & FLOW**

### **1. Where Data Comes From**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
└─────────────────────────────────────────────────────────────┘

1. USER INPUT (RichTextEditor)
   └─> plan.sections[].content (HTML/rich text)
   └─> plan.sections[].tables (financial tables)
   └─> plan.sections[].figures (charts/graphs)
   └─> plan.sections[].sources (references)

2. WIZARD ANSWERS (localStorage)
   └─> pf_userAnswers → mapped to prefill format
   └─> Used to generate initial section content
   └─> Stored in: shared/lib/planStore.ts

3. PROGRAM DATA (Database/API)
   └─> /api/programmes/${id}/requirements
   └─> Program requirements, eligibility, documents
   └─> Stored in: plan.programId

4. FORMATTING SETTINGS (DocumentCustomizationPanel)
   └─> plan.settings.titlePage (title, subtitle, author, date)
   └─> plan.settings.includeTitlePage
   └─> plan.settings.includePageNumbers
   └─> plan.settings.citations
   └─> plan.tone, plan.language
   └─> Font/fontSize/lineSpacing (UI only, not fully in export yet)
```

---

## 🏗️ **PLAN DATA STRUCTURE**

### **PlanDocument Type**

```typescript
type PlanDocument = {
  // Identity
  id: string;
  ownerId: string;
  product: 'strategy' | 'review' | 'submission';
  route: 'grant' | 'loan' | 'equity' | 'visa';
  programId?: string;  // ← Links to program
  
  // Content & Style
  language: 'de' | 'en';
  tone: 'neutral' | 'formal' | 'concise';
  targetLength: 'short' | 'standard' | 'extended';
  
  // FORMATTING SETTINGS (from DocumentCustomizationPanel)
  settings: {
    includeTitlePage: boolean;      // ← From customization panel
    includePageNumbers: boolean;     // ← From customization panel
    citations: 'none' | 'simple';
    captions: boolean;
    graphs: { 
      revenueCosts?: boolean; 
      cashflow?: boolean; 
      useOfFunds?: boolean 
    },
    titlePage?: {                    // ← From customization panel
      title?: string;                // ← User input
      subtitle?: string;             // ← User input
      author?: string;               // ← User input
      date?: string;                 // ← User input or auto
    }
  },
  
  // SECTIONS (from RichTextEditor + AI + Prefill)
  sections: PlanSection[];           // ← Main content
  // Each section has:
  // - content: string (HTML/rich text)
  // - tables: { revenue, costs, cashflow, useOfFunds }
  // - figures: FigureRef[]
  // - sources: Array<{ title, url }>
  
  // Additional data
  unitEconomics?: { ... };
  milestones?: Array<...>;
  readiness?: { ... };
};
```

---

## 🔄 **HOW GENERATION WORKS**

### **Step 1: Data Collection**

**User Input:**
```typescript
// User types in RichTextEditor
RichTextEditor onChange → plan.sections[].content = "User's HTML content"
```

**Formatting Settings:**
```typescript
// User changes settings in DocumentCustomizationPanel
DocumentCustomizationPanel onConfigChange → plan.settings = {
  includeTitlePage: true,
  includePageNumbers: true,
  titlePage: {
    title: "My Business Plan",
    subtitle: "2025 Edition",
    author: "John Doe",
    date: "2025-01-03"
  }
}
```

**Wizard Answers:**
```typescript
// From localStorage
loadUserAnswers() → {
  location: 'austria',
  company_age: '0_2_years',
  team_size: '1_2_people',
  ...
}
// → Mapped to prefill format
// → Used to generate initial section content
```

---

### **Step 2: Template Selection**

**For Business Plan:**
- Uses `plan.sections` directly (no template file)
- Structure comes from `MASTER_SECTIONS[fundingType]`
- Sections are already in `plan.sections[]`

**For Additional Documents:**
```typescript
// Get template from master or program-specific
const template = await getDocument(fundingType, productType, docId, programId);
// Returns: DocumentTemplate with template string
```

---

### **Step 3: Data Extraction & Mapping**

**From Plan to Export:**

```typescript
// Export function receives:
exportPlan(plan: PlanDocument, options: ExportOptions)

// Extracts data:
const title = plan.settings.titlePage?.title || 'Business Plan';
const subtitle = plan.settings.titlePage?.subtitle || '';
const author = plan.settings.titlePage?.author || '';
const sections = plan.sections;  // Already formatted content
const wordCount = plan.sections.reduce((sum, s) => 
  sum + (s.content || '').split(/\s+/).filter(w => w.length > 0).length, 0
);
```

**For Additional Documents (Template Filling):**

**Current Implementation (Basic):**
```typescript
// In pages/export.tsx (lines 444-453)
let populatedTemplate = template.template;

// Simple placeholder replacement
sections.forEach(section => {
  const content = section.content || '';
  populatedTemplate = populatedTemplate.replace(
    `[${section.title}]`,  // e.g., "[Executive Summary]"
    content.slice(0, 200)  // First 200 chars
  );
});
```

**Problem:** This is very basic - only replaces section titles with content snippets.

**What's Needed:**
- Extract structured data (tables, figures, financials)
- Map to template placeholders intelligently
- Handle complex structures (work plans, budgets, etc.)

---

### **Step 4: HTML/Formatting Generation**

**Business Plan HTML:**

```typescript
// In features/export/engine/export.ts (generateHTML method)
private generateHTML(plan: PlanDocument, options: ExportOptions): string {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          /* ... more styles ... */
        </style>
      </head>
      <body>
        <!-- Title Page (if enabled) -->
        ${plan.settings.includeTitlePage ? `
          <div class="header">
            <div class="title">${plan.settings.titlePage?.title || 'Business Plan'}</div>
            <div class="subtitle">${plan.settings.titlePage?.subtitle || ''}</div>
          </div>
        ` : ''}
        
        <!-- Sections -->
        ${plan.sections.map(section => `
          <div class="section">
            <div class="section-title">${section.title}</div>
            <div class="section-content">${this.formatContent(section.content)}</div>
          </div>
        `).join('')}
      </body>
    </html>
  `;
}
```

**Formatting Applied:**
- ✅ Title page (from `plan.settings.includeTitlePage`)
- ✅ Title, subtitle, author, date (from `plan.settings.titlePage`)
- ✅ Section titles and content
- ✅ Basic HTML formatting (from `formatContent()`)
- ⚠️ Font family (hardcoded, not from customization)
- ⚠️ Font size (hardcoded, not from customization)
- ⚠️ Line spacing (hardcoded, not from customization)
- ⚠️ Margins (hardcoded, not from customization)
- ❌ Page numbers (not implemented in HTML generation)

---

### **Step 5: PDF/DOCX Generation**

**PDF Generation:**
```typescript
// Uses html2pdf.js (client-side)
const htmlContent = this.generateHTML(plan, options);
const element = document.createElement('div');
element.innerHTML = htmlContent;

const opt = {
  margin: 1,  // ← Hardcoded, not from plan.settings
  filename: `${title}.pdf`,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
};

await html2pdf().set(opt).from(element).save();
```

**DOCX Generation:**
```typescript
// Uses docx library
const doc = new Document({
  sections: [
    // Title page
    { children: [new Paragraph({ text: plan.settings.titlePage?.title })],
    // Sections
    plan.sections.map(section => 
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ text: section.content })
    )
  ]
});
```

---

## 🔍 **CURRENT ISSUES & GAPS**

### **1. Formatting Data Not Fully Used**

**Problem:**
- `DocumentCustomizationPanel` saves formatting to `plan.settings`
- But `export.ts` uses **hardcoded** CSS styles
- Font family, size, line spacing, margins not applied

**Current Code:**
```typescript
// export.ts - HARDCODED
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;  // ← Should use plan.settings
  line-height: 1.6;  // ← Should use plan.settings
  padding: 40px 20px;  // ← Should use plan.settings.margins
}
```

**What's Saved:**
```typescript
// Phase4Integration.tsx - Saves to plan
plan.settings = {
  includeTitlePage: config.titlePage?.enabled,
  includePageNumbers: config.pageNumbers,
  titlePage: {
    title: config.titlePage?.title,
    subtitle: config.titlePage?.subtitle,
    author: config.titlePage?.author,
    date: config.titlePage?.date
  }
  // ❌ fontFamily, fontSize, lineSpacing, margins NOT saved to plan.settings
}
```

**Fix Needed:**
1. Save formatting to `plan.settings.formatting` (or enhance existing structure)
2. Use formatting in `generateHTML()` CSS
3. Apply to PDF/DOCX generation

---

### **2. Template Filling is Basic**

**Current Implementation:**
```typescript
// Only replaces [Section Title] with section content
populatedTemplate.replace(`[${section.title}]`, content.slice(0, 200));
```

**What's Needed:**
```typescript
// Intelligent placeholder replacement
const placeholders = {
  '[BUSINESS_NAME]': extractBusinessName(plan),
  '[PROJECT_TITLE]': plan.settings.titlePage?.title,
  '[FUNDING_AMOUNT]': extractFundingAmount(plan),
  '[TEAM_SIZE]': extractTeamSize(plan),
  '[TIMELINE]': extractTimeline(plan),
  '[REVENUE_YEAR_1]': extractTableValue(plan, 'revenue', 'Year 1'),
  '[COSTS_TOTAL]': calculateTotalCosts(plan),
  // ... etc
};

Object.entries(placeholders).forEach(([placeholder, value]) => {
  populatedTemplate = populatedTemplate.replace(
    new RegExp(placeholder, 'g'),
    value || '[Not specified]'
  );
});
```

---

### **3. Structured Data Not Extracted**

**Problem:**
- Tables exist in `plan.sections[].tables`
- But export doesn't use them for additional documents
- Financial templates need structured data, not just text

**Example:**
```typescript
// Financial Plan template needs:
- Revenue projections (from tables.revenue)
- Cost breakdown (from tables.costs)
- Cash flow (from tables.cashflow)
- Use of funds (from tables.useOfFunds)

// Currently: Only gets section.content (text)
// Needed: Extract structured data from tables
```

---

## 💡 **HOW IT SHOULD WORK**

### **Complete Data Flow:**

```
1. USER INPUT
   ├─> RichTextEditor → plan.sections[].content (HTML)
   ├─> Tables Editor → plan.sections[].tables
   ├─> Figures → plan.sections[].figures
   └─> DocumentCustomizationPanel → plan.settings

2. DATA AGGREGATION
   ├─> Extract structured data from sections
   ├─> Extract financials from tables
   ├─> Extract metadata from plan.settings
   └─> Combine with program data (if available)

3. TEMPLATE FILLING
   ├─> Load template (master or program-specific)
   ├─> Replace placeholders with aggregated data
   ├─> Format tables/charts from structured data
   └─> Apply formatting (font, size, spacing, margins)

4. DOCUMENT GENERATION
   ├─> HTML generation (with proper CSS from settings)
   ├─> PDF generation (with formatting applied)
   ├─> DOCX generation (with proper formatting)
   └─> XLSX generation (for spreadsheets)
```

---

## 🛠️ **RECOMMENDED IMPLEMENTATION**

### **1. Enhanced Plan Settings**

```typescript
// Add to PlanDocument type
settings: {
  // ... existing ...
  formatting?: {  // NEW
    fontFamily: string;
    fontSize: number;
    lineSpacing: number;
    margins: { top: number; bottom: number; left: number; right: number };
  };
}
```

### **2. Data Extraction Service**

```typescript
// features/export/engine/dataExtractor.ts
export class DataExtractor {
  extractBusinessInfo(plan: PlanDocument): BusinessInfo {
    // Extract from sections, wizard answers, etc.
    return {
      businessName: extractBusinessName(plan),
      businessDescription: extractBusinessDescription(plan),
      fundingAmount: extractFundingAmount(plan),
      teamSize: extractTeamSize(plan),
      timeline: extractTimeline(plan),
      // ...
    };
  }
  
  extractFinancials(plan: PlanDocument): FinancialData {
    // Extract from tables
    const financialSection = plan.sections.find(s => 
      s.key.includes('financial') || s.tables
    );
    
    return {
      revenue: financialSection?.tables?.revenue,
      costs: financialSection?.tables?.costs,
      cashflow: financialSection?.tables?.cashflow,
      useOfFunds: financialSection?.tables?.useOfFunds,
    };
  }
  
  extractProjectData(plan: PlanDocument): ProjectData {
    // Extract from sections
    return {
      projectTitle: plan.settings.titlePage?.title,
      projectDescription: extractSectionContent(plan, 'project_description'),
      innovation: extractSectionContent(plan, 'innovation_plan'),
      impact: extractSectionContent(plan, 'impact_assessment'),
      // ...
    };
  }
}
```

### **3. Template Filler**

```typescript
// features/export/engine/templateFiller.ts
export class TemplateFiller {
  fillTemplate(
    template: string,
    plan: PlanDocument,
    program?: ProgramProfile
  ): string {
    const extractor = new DataExtractor();
    const businessInfo = extractor.extractBusinessInfo(plan);
    const financials = extractor.extractFinancials(plan);
    const projectData = extractor.extractProjectData(plan);
    
    // Replace placeholders
    let filled = template;
    
    // Business info
    filled = filled.replace(/\[BUSINESS_NAME\]/g, businessInfo.businessName || '[Not specified]');
    filled = filled.replace(/\[FUNDING_AMOUNT\]/g, businessInfo.fundingAmount || '[Not specified]');
    // ... etc
    
    // Financials (structured)
    if (financials.revenue) {
      const revenueTable = this.formatTable(financials.revenue);
      filled = filled.replace(/\[REVENUE_TABLE\]/g, revenueTable);
    }
    
    // Project data
    filled = filled.replace(/\[PROJECT_TITLE\]/g, projectData.projectTitle || '[Not specified]');
    // ... etc
    
    return filled;
  }
  
  formatTable(table: Table): string {
    // Convert Table structure to markdown/HTML
    return `
| ${table.columns.join(' | ')} |
| ${table.columns.map(() => '---').join(' | ')} |
${table.rows.map(row => `| ${row.label} | ${row.values.join(' | ')} |`).join('\n')}
    `;
  }
}
```

### **4. Enhanced Export with Formatting**

```typescript
// features/export/engine/export.ts
private generateHTML(plan: PlanDocument, options: ExportOptions): string {
  // Get formatting from plan.settings (if available)
  const formatting = plan.settings.formatting || {
    fontFamily: 'Arial',
    fontSize: 12,
    lineSpacing: 1.6,
    margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 }
  };
  
  return `
    <html>
      <head>
        <style>
          body {
            font-family: ${formatting.fontFamily};
            font-size: ${formatting.fontSize}pt;
            line-height: ${formatting.lineSpacing};
            margin: ${formatting.margins.top}cm ${formatting.margins.right}cm 
                    ${formatting.margins.bottom}cm ${formatting.margins.left}cm;
          }
          /* ... rest of styles ... */
        </style>
      </head>
      <body>
        ${this.generateTitlePage(plan)}
        ${this.generateTableOfContents(plan)}
        ${this.generateSections(plan)}
        ${this.generatePageNumbers(plan)}  // If enabled
      </body>
    </html>
  `;
}
```

---

## 📋 **SUMMARY**

### **Current State:**

**✅ Working:**
- User input → plan.sections[].content
- Formatting settings → plan.settings (titlePage, includeTitlePage, includePageNumbers)
- Basic export → HTML/PDF/DOCX generation
- Template loading → Master + program-specific merge

**❌ Not Working / Missing:**
- Formatting (font, size, spacing, margins) not applied to export
- Template filling is basic (only section title replacement)
- Structured data (tables, figures) not extracted for additional documents
- Page numbers not implemented in HTML generation
- Data extraction service missing

### **What's Needed:**

1. **Save formatting to plan.settings.formatting**
2. **Create DataExtractor service** to extract structured data
3. **Create TemplateFiller service** for intelligent placeholder replacement
4. **Enhance export.ts** to use formatting from plan.settings
5. **Extract tables/figures** for additional document generation

### **Data Flow (Complete):**

```
User Input → plan.sections[].content
Formatting → plan.settings (titlePage, formatting, etc.)
Wizard Answers → localStorage → prefilled content
Program Data → plan.programId → used for templates

Export:
  plan → extract data → fill templates → apply formatting → generate PDF/DOCX
```

