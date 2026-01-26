# Step 2 Implementation Plan: Document Blueprint Setup

## Overview
Transform Step 2 to implement the Document Blueprint concept with 3 distinct pathways that create structured blueprints for document generation.

## Current State Analysis

### Existing Similar Concepts
- **ProgramProfile** interface in `types.ts` (lines 292-300)
- **ProgramSummary** interface for storing connected program data
- Basic UI structure in `ProgramSelection.tsx`
- Partial implementation of the 3-option flow

### Blueprint Concept Mapping
```
Implementation Blueprint ↔ Current ProgramProfile
┌─────────────────────┬──────────────────────────┐
│ Implementation Spec │ Current Implementation   │
├─────────────────────┼──────────────────────────┤
│ source: "program"   │ fundingType: enum        │
│ programId           │ programId?: string       │
│ requiredDocuments[] │ requiredSections: string[]│
│ requiredSections[]  │ requiredAnnexes: string[]│
│ requirementSchemas[]│ scoringChecks: string[]  │
│ validationRules[]   │ (missing)                │
│ formattingRules     │ (missing)                │
└─────────────────────┴──────────────────────────┘
```

## Current Implementation Status

### Option 1: Select Program ✅ Partially Implemented
**Exists**: Program connection UI with manual input and finder
**Missing**:
- Program search functionality (AWS, FFG, EU, Banks, Investors)
- Recommendation wizard integration
- Program summary panel with detailed requirements

### Option 2: Use Own Template ⚠️ Placeholder Only
**Exists**: Basic upload button UI
**Missing Completely**:
- File upload area (DOCX/PDF)
- Structure detection engine
- Tree preview of detected structure
- Mapping confidence indicators

### Option 3: Start Free (Custom) ✅ Basic Implementation Exists
**Currently Implemented**:
- Card selection UI with green styling
- Basic confirmation banner
- Proceed to next section message
- Stores selection state

**Missing Features** (as per Implementation spec):
- Base structure selection (Business Plan, Strategy, Pitch Deck)
- Industry preset options
- Clear indication of neutral standard approach
- Proper blueprint creation with `source: "standard"`

## Detailed Flow Diagram with State Changes

```
                    STEP 2: DOCUMENT BLUEPRINT SETUP
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    SELECT PROGRAM         USE TEMPLATE          START FREE
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Program-Based   │   │ Template-Based  │   │ Standard        │
│ Blueprint       │   │ Blueprint       │   │ Blueprint       │
│                 │   │                 │   │                 │
│ source: "program"│  │ source: "template"│  │ source: "standard"│
│ programId       │   │ templateStructure │  │ standardStructure │
│ requiredDocs[]  │   │ formattingRules   │  │ minimalValidation │
│ requiredSections[]│ │ detectedSections[]│  │ baseStructure     │
│ validationRules[] │ │ noProgramReqYet   │  │ industryPreset    │
└─────────┬───────┘   └─────────┬───────┘   └─────────┬───────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                ▼
                        STORE BLUEPRINT OBJECT
                                │
                                ▼
                        STEP 3: PLAN EXECUTION

CURRENT STATE CHANGES:
┌─────────────────────────────────────────────────────────────┐
│ Option 3 (Start Free) Current Flow:                         │
│                                                             │
│ 1. User clicks "Start Free (Custom)" card                   │
│    → setSelectedOption('free')                             │
│                                                             │
│ 2. Shows confirmation banner:                              │
│    → "Free structure selected"                             │
│    → "Proceed to next section..."                          │
│                                                             │
│ 3. Missing:                                                │
│    ❌ No blueprint object creation                         │
│    ❌ No base structure selection                          │
│    ❌ No industry preset options                           │
│    ❌ No standardized blueprint storage                    │
└─────────────────────────────────────────────────────────────┘
```

## Enhancement Requirements for Option 3

### Current Implementation Analysis
The existing Option 3 implementation is minimal but functional:
- **Visual Feedback**: Green banner with checkmark confirms selection
- **Navigation Hint**: "Proceed to next section" message
- **State Management**: Uses `selectedOption` state properly

### Required Enhancements

1. **Base Structure Selection** (Missing)
   ```jsx
   // Add to Option 3 UI:
   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
     <button className={`structure-option ${selectedBase === 'business-plan' ? 'selected' : ''}`} 
             onClick={() => setSelectedBase('business-plan')}>
       Business Plan
     </button>
     <button className={`structure-option ${selectedBase === 'strategy' ? 'selected' : ''}`} 
             onClick={() => setSelectedBase('strategy')}>
       Strategy Document
     </button>
     <button className={`structure-option ${selectedBase === 'pitch-deck' ? 'selected' : ''}`} 
             onClick={() => setSelectedBase('pitch-deck')}>
       Pitch Deck
     </button>
   </div>
   ```

2. **Industry Preset Selection** (Missing)
   ```jsx
   // Add optional industry selection:
   <div className="mt-4">
     <label>Industry Focus (Optional)</label>
     <select value={selectedIndustry} onChange={e => setSelectedIndustry(e.target.value)}>
       <option value="">Select industry...</option>
       <option value="tech">Technology</option>
       <option value="healthcare">Healthcare</option>
       <option value="finance">Finance</option>
     </select>
   </div>
   ```

3. **Blueprint Object Creation** (Missing)
   ```typescript
   // Create proper blueprint when Option 3 is selected:
   const createStandardBlueprint = () => {
     const blueprint: DocumentBlueprint = {
       source: 'standard',
       standardStructure: selectedBase || 'business-plan',
       industryPreset: selectedIndustry || undefined,
       minimalValidation: true,
       requiredDocuments: ['business-plan'], // Default
       requiredSections: getDefaultSections(selectedBase),
       requirementSchemas: [],
       validationRules: []
     };
     
     // Store in editor state
     storeBlueprint(blueprint);
   };
   ```

## Implementation Priority Matrix

| Component | Complexity | Impact | Current Status | Priority |
|-----------|------------|--------|----------------|----------|
| DocumentBlueprint interface | Low | High | Not Started | ⭐⭐⭐⭐⭐ |
| Base structure selection | Low | High | Missing | ⭐⭐⭐⭐ |
| Industry preset selection | Low | Medium | Missing | ⭐⭐⭐ |
| Blueprint storage mechanism | Medium | High | Missing | ⭐⭐⭐⭐ |
| Program search/recommendation | High | High | Partial | ⭐⭐⭐⭐ |
| Template upload/detection | High | Medium | Placeholder | ⭐⭐⭐ |

## Success Criteria

### Functional Requirements
- [ ] All 3 blueprint creation pathways work
- [ ] Blueprint objects properly stored and passed to Step 3
- [ ] User can switch between options without data loss
- [ ] Proper validation and error handling

### UI/UX Requirements
- [ ] Clear visual distinction between the 3 options
- [ ] Intuitive workflow for each pathway
- [ ] Consistent styling with existing components
- [ ] Responsive design across device sizes

### Technical Requirements
- [ ] Type-safe implementation
- [ ] Proper state management
- [ ] No build errors or warnings
- [ ] Backward compatibility maintained

## Next Steps Discussion Points

Before implementation, let's discuss:

1. **Option 3 Enhancement Priority**:
   - Should we enhance the existing basic implementation?
   - Or replace it entirely with the full specification?

2. **Blueprint Storage Strategy**:
   - Use existing `programSummary` for standard blueprints?
   - Create new `standardBlueprint` property in store?
   - Extend `SetupWizardState` with blueprint tracking?

3. **Backward Compatibility**:
   - How to handle existing users who selected "Start Free"?
   - Migration path for current program connections?

4. **Implementation Approach**:
   - Incremental enhancement vs. complete rebuild?
   - Which option should we tackle first?

---
Option 1: asnwers.
A) Data Structures (extend + keep compatibility)
1) Keep ProgramSummary as-is for legacy

Do not embed blueprint into ProgramSummary

Add these new properties instead:

programProfile (normalized program data for mapping)

blueprint (the generated blueprint)

blueprintVersion

blueprintStatus (none | draft | confirmed | locked)

blueprintSource (program | template | standard)

blueprintDiagnostics (warnings, missing fields, confidence)

2) Define “ProgramProfile” as the mapping input

Fields (minimum viable):

programId, programName, provider, region

fundingTypes[] (grant/bank/equity/subsidy)

amountRange, deadline

useOfFunds[] (categories)

coFinancingRequired (bool + % if known)

focusAreas[] (innovation/market/green/digital/etc.)

deliverables[] (required docs list if known)

requirements[] (structured requirements list if known)

formattingRules (if any: length/page limits, language, attachments)

evidenceRequired[] (CVs, offers, LOIs, financial model, etc.)

raw (store original response for traceability)

3) Define “Blueprint” as output

Fields (minimum viable):

id, version, source

documents[] (each with id,name,purpose,required)

sections[] (each with id,documentId,title,type,required,programCritical)

requirements[] (each with id,scope(section/document/global),category,severity,rule,target,evidenceType)

validationRules[] (computed checks)

aiGuidance[] (per section prompt + checklist)

renderingRules (title page/TOC/references/appendix rules)

conflicts[] + warnings[] + confidenceScore

Backward compatibility rule:

If blueprint missing → treat as blueprintStatus=none and generate default blueprint on demand.

B) Storage Approach (pick #2 hybrid)

Use:

Keep existing programSummary unchanged

Add programProfile + blueprint side-by-side in SetupWizardState

Store blueprint separately from programSummary for compatibility + migration ease

C) Blueprint Generation Logic (Option 1 program-selected)
Pipeline (always same stages)

Normalize ProgramSummary/raw → ProgramProfile

Select Base Structure by fundingTypes

Derive Required Documents from deliverables or defaults

Derive Required Sections from base structure + program focus

Generate Requirements from:

co-financing

use of funds

categorized requirements

formatting rules

evidence required

Create Validation Rules from requirements

Attach AI Guidance per section

Produce Blueprint(draft) with confidenceScore + diagnostics

Mapping rules (direct answers to Qoder questions)
Map use_of_funds → sections

Always map to Financial Plan / Use of Funds section

Also map to:

Hiring → Team Plan + Org/Headcount

Equipment/Capex → Operations + Capex table

R&D → Product/Tech + Milestones

Marketing/Sales → Go-To-Market

Working capital → Cashflow + Runway

If multiple categories → add subsection checklist items, not new top-level sections

Validation rules from program criteria

Generate rule types:

Presence rules (section must exist)

Completeness rules (minimum content items)

Numeric rules (co-financing %, budget totals match)

Attachment rules (evidence required)

Formatting rules (page/word limits, language)

Consistency rules (budget aligns with milestones)

Severity levels:

blocker (cannot export/submit)

major (readiness penalized heavily)

minor (quality improvement)

Program-specific formatting

Store in blueprint.renderingRules and requirements(category=formatting)

Enforce at export + show warnings in preview/readiness

Program-specific section templates?

Yes, but only as overlays:

Default section template stays

Program overlay adds: checklist + prompts + required subitems

Do not fork entire template unless confidence is very high

D) UI/UX (Option 1 screens + what to show)
Step 2 card (“Select Program”)

Show on the card:

Title + short description (already fine)

Add one line: “Creates a compliant blueprint (documents + requirements).”

When user selects:

Program search/wizard

Program detail panel:

Program name, type, region, deadline

Required deliverables count

Compliance level indicator

“Generate Blueprint” action (auto-run after selection)

Blueprint preview (must-have before confirm):

Documents list (required/optional)

Section count (required/optional)

Top 5 key requirements

Confidence + warnings

Button: Confirm Blueprint

Customization:

Allow only:

Toggle optional sections

Add custom sections

Don’t allow removing required items (only “request override” later)

Feedback during generation:

Progress states: Normalizing → Analyzing → Building structure → Creating checks → Ready

Show warnings if missing data

E) Step 3 (Plan) connection to Step 2
Step 3 entry rule

User can’t proceed unless blueprintStatus=draft|confirmed

Step 3 creates PlanInstance from blueprint

Step 3 shows:

Blueprint summary (source + program name)

Documents + sections preview

Controls:

Enable/disable optional sections

Add custom sections

Rename documents

Action:

Complete Setup → locks blueprint (blueprintStatus=locked) and finalizes Plan

F) Readiness (exact fields + steps)
Steps

Build readiness model by comparing PlanInstance vs Blueprint

Compute:

completion

compliance

quality

Show blockers + next actions

Gate export with blockers

Exact fields

Top

overallCompletionPct

programCompliancePct

documentQualityScore

blockersCount

lastEvaluatedAt

Per document

docCompletionPct

docCompliancePct

missingRequiredSections[]

Per section

status (missing/incomplete/complete)

wordCountActual

wordCountTarget

requirementsMetPct

blockers[]

warnings[]

evidenceAttached (yes/no)

programCritical (yes/no)

Requirements summary

grouped by category (Financial/Market/Team/Risk/Formatting/Evidence)

each requirement:

severity

status

whatMissing

fixAction (link to section)

G) Error handling (blueprint generation failures)

If missing program detail:

generate default blueprint for fundingType

set confidenceScore low

add warning “Program data incomplete — using defaults”

If API fails:

allow user to proceed with standard blueprint

keep selected program stored

show “Retry blueprint generation”

H) Migration strategy (legacy programs)

On load:

If programSummary exists and blueprint missing:

auto-create programProfile from existing fields

generate default blueprint lazily when user enters Step 3 or Readiness

Never break existing projects

I) What to implement now (ordered)

Add programProfile + blueprint + status fields to wizard state

Implement Normalizer: ProgramSummary/raw → ProgramProfile

Implement Blueprint Generator: ProgramProfile → Blueprint(draft)

Add Blueprint Preview + Confirm in Step 2 option 1 flow

Instantiate Plan from Blueprint in Step 3

Implement Readiness evaluation Plan vs Blueprint

Add overlay flow: attach program later to template/custom