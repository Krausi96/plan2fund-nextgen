# 🎯 PLAN2FUND EDITOR ARCHITECTURE - DETAILED

**Last Updated**: 2024-12-19  
**Status**: 📋 **DESIGNED** - Ready for implementation  
**Purpose**: Comprehensive documentation of the unified editor architecture

---

## 📋 **OVERVIEW**

The Plan2Fund editor is designed as a **product-specific, template-driven system** that adapts its interface and functionality based on:

1. **Product Type** (Strategy/Review/Submission)
2. **Funding Type** (Grants/Loans/Equity/Visa)
3. **Specific Program** (EU Horizon Europe, BMBF, etc.)

---

## 🎯 **PRODUCT-SPECIFIC EDITOR LAYOUTS**

### **STRATEGY (€99) - Basic Planning Documents**

**Target Users**: Early-stage founders who need basic planning documents  
**Complexity**: Low - Simple forms and guided questions  
**Output**: 3 basic documents (5-7 pages total)

#### **Interface Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Strategy Product - €99                             │
├─────────────┬─────────────────────────────┬─────────────────┤
│ LEFT SIDEBAR│ MAIN EDITOR AREA            │ RIGHT SIDEBAR   │
│             │                             │                 │
│ Document    │ Business Model Canvas       │ AI Assistant    │
│ Selector:   │ ┌─────────────────────────┐ │ (Basic Help)    │
│ • Canvas    │ │ Value Props    │ Cust.  │ │                 │
│ • Go-to-Mkt │ │ Segments       │        │ │ Quick Tips:     │
│ • Funding   │ ├─────────────────────────┤ │ • Focus on      │
│   Match     │ │ Channels       │ Rel.   │ │   value prop    │
│             │ │ Revenue        │        │ │ • Keep it       │
│             │ │ Streams        │        │ │   simple        │
│             │ └─────────────────────────┘ │                 │
│             │                             │                 │
│             │ Go-to-Market Strategy       │                 │
│             │ ┌─────────────────────────┐ │                 │
│             │ │ Target Market: [____]   │ │                 │
│             │ │ Positioning: [____]     │ │                 │
│             │ │ Channels: [____]        │ │                 │
│             │ └─────────────────────────┘ │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

**Key Features**:
- **Simple Forms**: No complex rich text editing
- **Guided Questions**: Step-by-step prompts
- **Visual Canvas**: Drag-and-drop business model canvas
- **Basic AI Help**: Simple suggestions and tips

---

### **REVIEW (€149) - Fix Existing Plans**

**Target Users**: Founders with existing business plans that need improvement  
**Complexity**: Medium - Upload + analysis + improvement suggestions  
**Output**: Improved plan + compliance notes

#### **Interface Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Review Product - €149                              │
├─────────────┬─────────────────────────────┬─────────────────┤
│ LEFT SIDEBAR│ MAIN EDITOR AREA            │ RIGHT SIDEBAR   │
│             │                             │                 │
│ Upload &    │ Rich Text Editor with       │ Compliance      │
│ Sections:   │ Overlaid Suggestions        │ Checker +       │
│ • Upload    │ ┌─────────────────────────┐ │ AI Assistant    │
│   Document  │ │ Executive Summary       │ │                 │
│ • Sections  │ │ [Your content here]     │ │ Issues Found:   │
│   List      │ │ [AI suggestion box]     │ │ • Missing      │
│ • Issues    │ │ [Compliance note]       │ │   problem      │
│   Found     │ └─────────────────────────┘ │   statement     │
│             │                             │ • Need 3-year   │
│             │ Market Analysis             │   projections   │
│             │ ┌─────────────────────────┐ │ • Add team      │
│             │ │ [Your content here]     │ │   bios          │
│             │ │ [Improvement hint]      │ │                 │
│             │ └─────────────────────────┘ │                 │
└─────────────┴─────────────────────────────┴─────────────────┘
```

**Key Features**:
- **Document Upload**: Import existing business plans
- **Overlaid Suggestions**: AI suggestions appear as colored boxes
- **Compliance Focus**: Red boxes for critical issues, yellow for improvements
- **Side-by-Side Comparison**: Original vs improved content

---

### **SUBMISSION (€199) - Complete Professional Plans**

**Target Users**: Founders ready to submit professional funding applications  
**Complexity**: High - Full business plan editor with professional features  
**Output**: Complete, submission-ready business plan (20-30 pages)

#### **Interface Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Submission Product - €199                          │
├─────────────┬─────────────────────────────┬─────────────────┤
│ LEFT SIDEBAR│ MAIN EDITOR AREA            │ RIGHT SIDEBAR   │
│             │                             │                 │
│ Full        │ Professional Rich Text      │ AI Assistant +  │
│ Business    │ Editor                      │ Readiness Check │
│ Plan        │ ┌─────────────────────────┐ │ + Export        │
│ Sections:   │ │ Executive Summary       │ │                 │
│ • Executive │ │ [WYSIWYG Editor]        │ │ AI Help:        │
│   Summary   │ │ [Formatting toolbar]    │ │ • Writing       │
│ • Company   │ │ [Word count: 500/800]   │ │   assistance    │
│   Desc.     │ └─────────────────────────┘ │ • Structure     │
│ • Market    │                             │   guidance      │
│   Analysis  │ Company Description         │                 │
│ • Financial │ ┌─────────────────────────┐ │ Readiness:      │
│   Proj.     │ │ [WYSIWYG Editor]        │ │ • 85% Complete  │
│ • Team      │ │ [Professional styling]  │ │ • 3 issues      │
│ • Appendix  │ └─────────────────────────┘ │   remaining     │
│             │                             │                 │
│             │ [Continue for all sections]│ Export:         │
│             │                             │ • PDF           │
│             │                             │ • DOCX          │
│             │                             │ • HTML          │
└─────────────┴─────────────────────────────┴─────────────────┘
```

**Key Features**:
- **Professional Editor**: Full WYSIWYG with formatting toolbar
- **Real-time Validation**: Word counts, section completion
- **Comprehensive Tools**: AI Assistant + Readiness Check + Export
- **Professional Styling**: Consistent formatting and layout

---

## 📄 **TEMPLATE SYSTEM ARCHITECTURE**

### **Two-Level Template System**

#### **Level 1: Standardized by Funding Type**

**Purpose**: Common structure and sections for each funding type  
**Source**: `src/data/basisPack.ts` (our template system)

```
GRANTS:
├── EU Horizon Europe
│   ├── Standard Sections: [Excellence, Impact, Implementation, Budget]
│   ├── Format: Calibri 11pt, 1.15 line spacing
│   └── Language: English
├── BMBF German
│   ├── Standard Sections: [Project Description, Methodology, Timeline, Budget, Team]
│   ├── Format: Arial 12pt, 1.5 line spacing
│   └── Language: German
└── Austrian FFG
    ├── Standard Sections: [Project Description, Innovation, Market, Team, Budget]
    ├── Format: Arial 12pt, 1.5 line spacing
    └── Language: German/English

BANK LOANS:
├── SBA Standard
│   ├── Standard Sections: [Business Description, Market Analysis, Financial Projections, Management]
│   ├── Format: Times New Roman 12pt, 1.5 line spacing
│   └── Language: English
└── Austrian Bank
    ├── Standard Sections: [Financial Stability, Repayment Capacity, Collateral, Risk Assessment]
    ├── Format: Arial 12pt, 1.5 line spacing
    └── Language: German

EQUITY:
├── VC Pitch Deck
│   ├── Standard Sections: [Problem, Solution, Market, Business Model, Traction, Team, Financials, Ask]
│   ├── Format: Presentation slides
│   └── Language: English
└── Angel Investor
    ├── Standard Sections: [Problem, Solution, Market Size, Product, Traction, Team, Financials]
    ├── Format: Presentation slides
    └── Language: English
```

#### **Level 2: Program-Specific Requirements**

**Purpose**: Specific requirements for each funding program  
**Source**: Database `categorized_requirements` (from web scraping)

```
EU Horizon Europe:
├── Standard sections (from Level 1)
└── Program-specific requirements:
    ├── Innovation focus: "Describe breakthrough innovation"
    ├── Impact metrics: "Quantify expected impact"
    ├── Consortium requirements: "Minimum 3 partners from 3 countries"
    └── Budget limits: "Max €2M for 3 years"

BMBF German:
├── Standard sections (from Level 1)
└── Program-specific requirements:
    ├── German language: "Must be in German"
    ├── Research focus: "Basic research component required"
    ├── Industry collaboration: "Industry partner required"
    └── Budget limits: "Max €500K for 2 years"
```

### **Template Data Flow**

```
1. User selects FUNDING TYPE (Grants/Loans/Equity)
   ↓
2. System loads STANDARDIZED TEMPLATE from basisPack.ts
   ↓
3. User selects SPECIFIC PROGRAM (EU Horizon Europe, BMBF, etc.)
   ↓
4. System loads PROGRAM-SPECIFIC REQUIREMENTS from database
   ↓
5. Editor shows SECTIONS = Standard Template + Program Requirements
   ↓
6. Each section includes:
   ├── Standard content structure
   ├── Program-specific prompts
   ├── Word count limits
   ├── Required fields
   └── Formatting rules
```

---

## 🤖 **AI ASSISTANT vs READINESS CHECKER**

### **AI ASSISTANT - Creative Writing Help**

**Purpose**: Help users write better content using AI  
**Technology**: LLM (GPT/Claude) + context-aware prompts  
**Integration**: Uses existing `EnhancedAIChat.tsx`

#### **How it works**:
```
User types: "Help me write a compelling executive summary"

AI Assistant:
├── Analyzes current section (Executive Summary)
├── Loads section-specific prompts
├── Considers program requirements
├── Uses LLM to generate suggestions
└── Provides:
    ├── Writing suggestions
    ├── Structure guidance
    ├── Content examples
    └── Tone adjustments
```

#### **Data Sources**:
- **LLM**: GPT/Claude for creative writing
- **Current Content**: What user has written so far
- **Section Context**: Which section they're editing
- **Program Requirements**: Specific requirements for their program
- **Best Practices**: Database of writing tips and examples

#### **Example Prompts**:
```
Executive Summary:
- "Write a compelling problem statement"
- "Make this solution description more convincing"
- "Add market opportunity data"

Financial Projections:
- "Improve this revenue forecast"
- "Add sensitivity analysis"
- "Make assumptions more realistic"
```

### **READINESS CHECKER - Compliance Verification**

**Purpose**: Verify document meets program requirements  
**Technology**: Rule-based validation + program requirements  
**Integration**: Uses existing `RequirementsChecker.tsx`

#### **How it works**:
```
User clicks "Check Readiness"

Readiness Checker:
├── Loads program requirements from database
├── Analyzes current document content
├── Compares content against requirements
├── Identifies missing elements
└── Provides:
    ├── Compliance score (0-100%)
    ├── Missing requirements
    ├── Improvement suggestions
    └── Critical issues
```

#### **Data Sources**:
- **Program Requirements**: From database `categorized_requirements`
- **Validation Rules**: Hardcoded compliance logic
- **Document Content**: Current state of all sections
- **Best Practices**: Industry standards and guidelines

#### **Example Checks**:
```
Executive Summary:
- ✅ Problem statement present
- ❌ Missing solution description
- ❌ No market size mentioned
- ✅ Team credentials included

Financial Projections:
- ✅ 3-year forecast provided
- ✅ Revenue assumptions documented
- ❌ Missing sensitivity analysis
- ✅ Break-even analysis included
```

---

## 🔗 **COMPLETE DATA FLOW ARCHITECTURE**

```
1. USER SELECTS PRODUCT
   ├── Strategy (€99) → Simple forms + basic AI
   ├── Review (€149) → Upload + analysis + suggestions
   └── Submission (€199) → Full editor + all tools

2. USER SELECTS FUNDING TYPE
   ├── Grants → EU/Austrian/German templates
   ├── Bank Loans → SBA/Austrian bank templates
   ├── Equity → VC/Angel/Crowdfunding templates
   └── Visa → Entrepreneur visa templates

3. USER SELECTS SPECIFIC PROGRAM
   ├── EU Horizon Europe → Innovation focus + impact metrics
   ├── BMBF German → Research focus + industry collaboration
   ├── Austrian FFG → Austrian innovation + market focus
   └── [Other programs from database]

4. SYSTEM LOADS TEMPLATE + REQUIREMENTS
   ├── Standard sections from basisPack.ts
   ├── Program requirements from database
   ├── Formatting rules and word limits
   └── Required fields and validation rules

5. EDITOR RENDERS PRODUCT-SPECIFIC INTERFACE
   ├── Strategy → Simple forms + document selector
   ├── Review → Upload area + suggestion overlays
   └── Submission → Full WYSIWYG + professional tools

6. USER EDITS WITH AI ASSISTANCE
   ├── AI Assistant provides writing help
   ├── Section-aware suggestions
   ├── Program-specific guidance
   └── Real-time content improvement

7. READINESS CHECKER VALIDATES COMPLIANCE
   ├── Checks against program requirements
   ├── Identifies missing elements
   ├── Provides improvement suggestions
   └── Calculates completion score

8. EXPORT FINAL DOCUMENT
   ├── PDF with professional formatting
   ├── DOCX for further editing
   ├── HTML for web viewing
   └── Program-specific styling applied
```

---

## 📁 **IMPLEMENTATION FILES**

### **New Components** (Phase 2):
- `src/components/editor/ProductSelector.tsx` - Product selection interface
- `src/components/editor/TemplateSelector.tsx` - Template selection by funding type
- `src/components/editor/AIAssistant.tsx` - Section-aware AI help wrapper
- `src/components/editor/ReadinessChecker.tsx` - Compliance verification wrapper

### **Modified Components** (Phase 2):
- `src/components/editor/UnifiedEditor.tsx` - Main orchestrator with product-specific layouts
- `src/components/editor/EditorState.tsx` - Enhanced state management for products/templates

### **Existing Components** (Integration):
- `src/components/editor/EnhancedAIChat.tsx` - AI Assistant backend
- `src/components/editor/RequirementsChecker.tsx` - Readiness Checker backend
- `src/data/basisPack.ts` - Template system
- Database `categorized_requirements` - Program requirements

### **Data Flow Files**:
- `src/lib/aiHelper.ts` - AI Assistant prompts and logic
- `src/lib/requirementsExtractor.ts` - Readiness Checker validation rules
- `src/lib/categoryConverters.ts` - Template + requirements integration

---

## 🎯 **SUCCESS METRICS**

### **User Experience**:
- **Strategy**: Users can create basic documents in <30 minutes
- **Review**: Users can upload and improve existing plans in <1 hour
- **Submission**: Users can create professional plans in <3 hours

### **Technical Performance**:
- **AI Response Time**: <3 seconds for suggestions
- **Readiness Check**: <5 seconds for full document analysis
- **Template Loading**: <1 second for template + requirements
- **Export Generation**: <10 seconds for PDF/DOCX

### **Business Impact**:
- **Conversion Rate**: Higher conversion from free to paid products
- **User Satisfaction**: Improved user experience and outcomes
- **Support Reduction**: Fewer support tickets due to better guidance
- **Quality Improvement**: Higher quality submissions and approvals

---

## 🚀 **NEXT STEPS**

1. **Implement Product-Specific Layouts** (2-3 hours)
2. **Integrate Template System** (1-2 hours)
3. **Connect AI Assistant** (1 hour)
4. **Connect Readiness Checker** (1 hour)
5. **Test Complete Flow** (1 hour)

**Total Estimated Time**: 6-8 hours
