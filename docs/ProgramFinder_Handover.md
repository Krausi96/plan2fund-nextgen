# ProgramFinder Integration Handover

## Overview
This document outlines the requirements for integrating the ProgramFinder functionality with Step 2 (Editor Program Finder) and Step 3 (Blueprint Instantiation and Tree Navigation). The goal is to make the flow work with canonical ordering, filtering, icons mapping, and requirements parsing.

## Current State
- **ProgramFinder**: Component that identifies programs and requirements based on user inputs
- **EditorProgramFinder**: Editor-specific implementation for program identification
- **URL Parsing**: External URL parsing functionality for program data extraction
- **Adjusted ProgramTemplate**: Updated program template structure
- **ProgramTemplate Synced with BlueprintInstantiation**: Synchronization between program templates and blueprint instantiation
- **Tree Navigation**: Component for navigating the document structure

## Key Components to Analyze

### 1. ProgramFinder Component
Location: `features/reco/components/ProgramFinder.tsx`
- How programs are identified from user inputs
- Current logic for mapping programs to document structures
- Requirements parsing mechanism
- Output format and where requirements end up

### 2. EditorProgramFinder
Location: `features/editor/components/Navigation/CurrentSelection/ProgramSelection/*`
- How program selection integrates with editor workflow
- Connection to Step 2 (Program Selection)
- Relationship with Step 3 (Blueprint Instantiation)

### 3. URL Parsing
Location: `pages/api/programs/blueprint.ts` or similar API routes
- How external URLs are parsed for program data
- Requirements extraction from external sources
- Mapping of parsed data to document structure

### 4. Program Template Adjustments
Location: `features/editor/lib/templates/`
- Current template structure
- How templates sync with blueprint instantiation
- Canonical ordering of sections

### 5. Blueprint Instantiation & Tree Navigation
Location: `features/editor/components/Navigation/ProductCreation/BlueprintInstantiation/*` and `TreeNavigator/*`
- How blueprints are instantiated from program data
- Tree navigation structure generation
- Integration with document structure

## Requirements Analysis

### 1. Requirements Parsing
- **Where it happens**: Identify the exact location where requirements are parsed
- **How it works**: Understand the parsing mechanism (regex, structured data, etc.)
- **Where it ends up**: Trace where parsed requirements are stored and utilized
- **Output format**: Document the format requirements are transformed into

### 2. Canonical Ordering
- Current canonical order of sections in document structure
- How to ensure consistent ordering across all options (ProgramFinder, TemplateUpload, FreeOption, etc.)
- Integration with existing `sortSectionsByCanonicalOrder` utility

### 3. Filtering Logic
- Identify existing filtering code for empty sections, non-English sections, etc.
- Determine which sections should be filtered out during processing
- Integrate filtering with program finder output

### 4. Icons Mapping
- Current icon mapping system used in other options
- How to map program sections to appropriate icons
- Consistency with existing UI patterns

### 5. Step Integration
- **Step 2 (Program Selection)**: How ProgramFinder connects to program selection workflow
- **Step 3 (Blueprint Instantiation)**: How program data flows to blueprint creation
- Ensure seamless handoff between steps

## Action Items for Analysis

### Phase 1: Current State Analysis
1. Map the complete flow from ProgramFinder input to final document structure
2. Identify where requirements parsing currently happens and where data ends up
3. Document existing canonical ordering logic
4. Locate filtering mechanisms for empty/non-English sections
5. Identify icon mapping system used in other components

### Phase 2: Gap Analysis
1. Identify gaps between current ProgramFinder and Step 2/3 requirements
2. Determine what's missing for proper integration
3. Assess canonical ordering consistency across all options
4. Evaluate filtering needs for program finder output

### Phase 3: Integration Plan
1. Create detailed plan for connecting ProgramFinder to Step 2
2. Define how program data flows to Step 3 (Blueprint Instantiation)
3. Specify canonical ordering implementation
4. Plan filtering integration
5. Design icon mapping for program sections
6. Ensure synchronization between ProgramTemplate and BlueprintInstantiation

## Technical Considerations

### Data Flow
```
User Input → ProgramFinder → Requirements Parsing → Document Structure → 
Step 2 (Program Selection) → Step 3 (Blueprint Instantiation) → Tree Navigation
```

### State Management
- How editor store is updated with program finder results
- Synchronization between different steps
- Handling of intermediate states

### Error Handling
- Validation of program finder output
- Fallback mechanisms for failed parsing
- User feedback for program selection issues

## Success Criteria
- Seamless flow from ProgramFinder to Step 3
- Consistent canonical ordering across all options
- Proper filtering of unwanted sections
- Correct icon mapping for all program sections
- Requirements properly parsed and stored
- Synchronization maintained between all components
- Tree navigation properly reflects program structure

## Key Files to Review
- `features/reco/components/ProgramFinder.tsx`
- `features/editor/components/Navigation/CurrentSelection/ProgramSelection/*`
- `features/editor/components/Navigation/ProductCreation/BlueprintInstantiation/*`
- `features/editor/components/Navigation/TreeNavigator/*`
- `features/editor/lib/utils/sectionDetection/sectionUtilities.ts`
- `features/editor/lib/templates/*`
- `features/editor/lib/store/editorStore.ts`
- `features/editor/lib/utils/Program.utils.ts`

## Questions to Investigate
1. Where exactly are requirements parsed and where do they end up?
2. How does the current canonical ordering work and how to ensure consistency?
3. What filtering mechanisms exist for empty/non-English sections?
4. How are icons currently mapped in other options?
5. What synchronization exists between ProgramTemplate and BlueprintInstantiation?
6. How should Step 2 connect to Step 3 in the program finder flow?