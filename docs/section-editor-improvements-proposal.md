# Section Editor Improvements Proposal

## Executive Summary

This document proposes improvements to the Plan2Fund business plan editor's section system, based on analysis of the current implementation and user experience gaps. The focus is on making sections more guided, contextual, and visually integrated.

## Current State Analysis

### How Sections Currently Work

1. **Section Loading & Structure**
   - Sections are loaded from templates via `getSections()` function
   - Each section has: `key`, `title`, `content`, `status`, `wordCount`, `required`, `order`, `description`, `prompts`, `wordCountMin`, `wordCountMax`, `tables`, `figures`, `fields`, `sources`
   - Sections are sorted by `order` property
   - Sections can be pre-filled with AI-generated content or wizard answers

2. **Current Section Display**
   - Sections shown in sidebar with basic status indicators
   - Main editor shows: section title, description, prompts (in blue box), word count target, and rich text editor
   - Guidance is displayed but not interactively integrated
   - Examples are hidden in collapsible panels
   - AI assistant is separate floating panel

3. **Issues Identified**
   - Guidance (prompts, examples) is present but not prominently featured
   - No progressive disclosure of section requirements
   - Limited visual feedback on section completion
   - No drag-and-drop reordering
   - No custom section addition
   - Compliance status not clearly linked to sections

## Proposed Improvements

### 1. Enhanced Section Navigation Panel

#### Current State
- Simple list of sections with status dots
- Shows section number and title
- Basic status indicator (green/yellow/gray)

#### Proposed Enhancements

**A. Visual Progress Indicators**
```typescript
interface EnhancedSectionDisplay {
  key: string;
  title: string;
  status: 'aligned' | 'needs_fix' | 'missing';
  // NEW: Progress metrics
  progress: {
    wordCount: number;
    wordCountMin: number;
    wordCountMax: number;
    completionPercentage: number; // 0-100
    requirementsMet: number;
    requirementsTotal: number;
  };
  // NEW: Visual indicators
  complianceBadges: Array<{
    type: 'word_count' | 'required_field' | 'table' | 'figure';
    status: 'complete' | 'warning' | 'missing';
    message: string;
  }>;
}
```

**B. Expandable Section Cards**
- Each section card shows:
  - Circular progress ring showing word count vs. target
  - Status badge (Complete/Needs Review/Not Started)
  - Mini progress bar for requirements compliance
  - Expandable dropdown showing:
    - Sub-requirements checklist
    - Missing elements (tables, figures, required fields)
    - Quick stats (word count, compliance score)

**C. Drag-and-Drop Reordering**
- Allow users to reorder sections by dragging
- Updates `order` property in real-time
- Visual feedback during drag
- Persists order to plan document

**D. Custom Section Addition**
- "+ Add Custom Section" button at bottom of navigation
- Modal to create custom sections with:
  - Title, description, prompts
  - Optional word count limits
  - Section type (text, table-focused, chart-focused)

### 2. Integrated Section Guidance System

#### Current State
- Prompts shown in blue box above editor
- Description shown but not actionable
- Examples hidden in collapsible panel

#### Proposed Enhancements

**A. Step-by-Step Prompt Checklist**
```typescript
interface SectionPrompt {
  id: string;
  text: string;
  completed: boolean; // Auto-detected based on content
  suggestedContent?: string; // AI-generated suggestion
  example?: string; // Example paragraph
}
```

- Display prompts as interactive checklist items
- Mark prompts as "completed" when content addresses them
- Show AI-generated suggestions for incomplete prompts
- Click prompt to insert example or generate content

**B. Contextual Examples Library**
- Curated examples for each section type
- Show 2-3 example paragraphs per section
- "Use as template" button to insert example structure
- Examples categorized by:
  - Industry (tech, healthcare, manufacturing)
  - Funding type (grant, loan, equity)
  - Program type (innovation, research, startup)

**C. Inline Guidance Cards**
- Replace static blue box with interactive cards
- Each card shows:
  - Objective: What this section should achieve
  - Key points to cover: Expandable checklist
  - Best practices: Tips from successful plans
  - Common mistakes: What to avoid
- Collapsible but visible by default for empty sections

**D. Progressive Disclosure**
- Show guidance prominently when section is empty
- Gradually hide guidance as content is added
- Keep critical requirements visible (e.g., word count, required tables)

### 3. Enhanced Writing Workspace

#### Current State
- Section header with title, description, word count target
- Prompts in blue box
- Rich text editor below

#### Proposed Enhancements

**A. Section Header Redesign**
```typescript
interface SectionHeaderProps {
  section: EnhancedSectionDisplay;
  onGenerateWithAI: () => void;
  onShowExamples: () => void;
  onShowRequirements: () => void;
}
```

- Header shows:
  - Section title with icon
  - Progress ring (word count vs. target)
  - Status badge (with tooltip explaining status)
  - Quick actions: "Generate with AI", "View Examples", "Check Requirements"
  - Compliance score: "X/Y requirements met"

**B. Smart Placeholder System**
- Dynamic placeholders based on section state:
  - Empty: "Start by answering: [First prompt]..."
  - Partial: "Continue with: [Next incomplete prompt]..."
  - Near completion: "Review: Consider adding [missing element]..."
- Show placeholder hints in editor until user starts typing

**C. Inline AI Actions in Toolbar**
- Extend RichTextEditor toolbar with:
  - "Generate Draft" - Full section generation
  - "Improve Clarity" - Enhance existing content
  - "Expand with Examples" - Add example paragraphs
  - "Summarize" - Create executive summary
  - "Fix Compliance" - Address compliance issues
- Actions appear as buttons in toolbar
- Show loading state during generation

**D. Contextual Formatting Presets**
- Section-specific formatting shortcuts:
  - Financial sections: Table templates, chart insertions
  - Team sections: Bulleted lists, role cards
  - Timeline sections: Numbered lists, milestone markers
  - Market analysis: Bullet points, competitor matrices

### 4. Requirements & Compliance Integration

#### Current State
- Requirements progress shown as small bar
- Status calculated but not section-specific
- No clear link between sections and requirements

#### Proposed Enhancements

**A. Section-Level Requirements Display**
```typescript
interface SectionRequirements {
  sectionKey: string;
  requirements: Array<{
    id: string;
    type: 'word_count' | 'content' | 'table' | 'figure' | 'field';
    description: string;
    status: 'met' | 'unmet' | 'partial';
    currentValue?: number;
    targetValue?: number;
    suggestions?: string[];
  }>;
  overallStatus: 'complete' | 'incomplete' | 'needs_review';
}
```

- Show requirements panel for each section
- Display checklist of requirements:
  - ✅ Word count: 250/300 words (Met)
  - ⚠️ Financial table: Missing (Unmet)
  - ✅ Required fields: All complete (Met)
- Link to guidance on how to meet each requirement

**B. Compliance Warnings**
- Show warnings above editor when:
  - Word count below minimum
  - Required tables/figures missing
  - Content doesn't address key prompts
- Warnings link to relevant guidance
- Auto-hide when resolved

**C. Requirements Tab in Context Panel**
- Dedicated tab showing all requirements grouped by section
- Unmet requirements highlighted
- Quick links to jump to relevant sections
- Tooltips explaining each requirement

### 5. Visual Progress & Dashboard

#### Current State
- Small progress bar in header
- Section status dots
- Requirements progress bar

#### Proposed Enhancements

**A. Global Progress Dashboard**
- Top banner showing:
  - Overall completion: "X% Complete"
  - Sections complete: "Y/Z sections"
  - Requirements met: "A/B requirements"
  - Visual progress bar with segments for each section
- Click to expand section breakdown

**B. Section Completion Animation**
- Animate progress rings when section is completed
- Show celebration feedback (subtle) when all sections complete
- Visual milestones (e.g., "50% Complete", "All Required Sections Done")

**C. Readiness Score**
- Calculate and display readiness score (0-100)
- Based on:
  - Section completion (40%)
  - Requirements compliance (40%)
  - Content quality (20%)
- Show score prominently with breakdown

### 6. Component Architecture Changes

#### Proposed New Components

**A. NavigationPanel.tsx** (Enhanced)
```typescript
interface NavigationPanelProps {
  sections: EnhancedSectionDisplay[];
  activeSection: number;
  onSectionSelect: (index: number) => void;
  onSectionReorder: (sections: EnhancedSectionDisplay[]) => void;
  onAddCustomSection: () => void;
}
```

**B. SectionHeader.tsx** (New)
```typescript
interface SectionHeaderProps {
  section: EnhancedSectionDisplay;
  onGenerateWithAI: () => void;
  onShowExamples: () => void;
  onShowRequirements: () => void;
}
```

**C. SectionGuidance.tsx** (New)
```typescript
interface SectionGuidanceProps {
  section: EnhancedSectionDisplay;
  prompts: SectionPrompt[];
  examples: Example[];
  onUseExample: (example: Example) => void;
  onGenerateForPrompt: (promptId: string) => void;
}
```

**D. RequirementsPanel.tsx** (New)
```typescript
interface RequirementsPanelProps {
  section: EnhancedSectionDisplay;
  requirements: SectionRequirements;
  onJumpToSection: (sectionKey: string) => void;
}
```

#### Proposed Hooks

**A. useSectionProgress.ts**
```typescript
function useSectionProgress(section: PlanSection): {
  wordCount: number;
  completionPercentage: number;
  requirementsMet: number;
  requirementsTotal: number;
  complianceBadges: ComplianceBadge[];
}
```

**B. useSectionRequirements.ts**
```typescript
function useSectionRequirements(
  section: PlanSection,
  programProfile: ProgramProfile
): {
  requirements: Requirement[];
  status: 'complete' | 'incomplete' | 'needs_review';
  suggestions: string[];
}
```

**C. useSectionGuidance.ts**
```typescript
function useSectionGuidance(
  sectionKey: string,
  programProfile?: ProgramProfile
): {
  prompts: SectionPrompt[];
  examples: Example[];
  bestPractices: string[];
  commonMistakes: string[];
}
```

### 7. Data Structure Enhancements

#### Enhanced Section Type
```typescript
interface EnhancedPlanSection extends PlanSection {
  // Existing fields...
  
  // NEW: Progress tracking
  progress: {
    wordCount: number;
    completionPercentage: number;
    lastUpdated: Date;
  };
  
  // NEW: Requirements tracking
  requirements: {
    wordCount: { met: boolean; current: number; target: number };
    tables: { required: boolean; provided: boolean; count: number };
    figures: { required: boolean; provided: boolean; count: number };
    fields: { required: string[]; provided: string[] };
    prompts: { total: number; addressed: number };
  };
  
  // NEW: Guidance metadata
  guidance: {
    prompts: SectionPrompt[];
    examples: Example[];
    bestPractices: string[];
    commonMistakes: string[];
  };
  
  // NEW: Customization
  custom: boolean; // Is this a user-added section?
  locked: boolean; // Can this section be deleted?
}
```

## Implementation Priority

### Phase 1: Core Improvements (High Priority)
1. ✅ Enhanced section navigation with progress indicators
2. ✅ Section-level requirements display
3. ✅ Improved section header with quick actions
4. ✅ Inline AI actions in editor toolbar

### Phase 2: Guidance Integration (Medium Priority)
1. ✅ Step-by-step prompt checklist
2. ✅ Contextual examples library
3. ✅ Progressive disclosure of guidance
4. ✅ Section guidance component

### Phase 3: Advanced Features (Lower Priority)
1. ✅ Drag-and-drop section reordering
2. ✅ Custom section addition
3. ✅ Global progress dashboard
4. ✅ Readiness score calculation

## Visual Mockups

### Navigation Panel (Enhanced)
```
┌─────────────────────────────────┐
│ 📋 Sections (12)         [🔍] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 01 Executive Summary    ✓   │ │ ← Progress ring
│ │   250/300 words • 3/3 reqs  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 02 Project Description  ⚠   │ │
│ │   150/200 words • 2/3 reqs  │ │
│ └─────────────────────────────┘ │
│ ...                             │
│ ┌─────────────────────────────┐ │
│ │ + Add Custom Section        │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Section Header (Enhanced)
```
┌─────────────────────────────────────────────────────┐
│ 📊 Market Analysis                          [⚙️]   │
│ ┌─────────┐  Status: ⚠ Needs Review              │
│ │  75%    │  Progress: 250/300 words              │
│ └─────────┘  Requirements: 2/3 met                │
│                                                    │
│ [✨ Generate with AI] [📋 View Examples] [✓ Check] │
└─────────────────────────────────────────────────────┘
```

### Guidance Panel (Enhanced)
```
┌─────────────────────────────────────────────────────┐
│ 💡 What to include in this section:                │
│                                                    │
│ ☑ Summarize your target market (Done)             │
│ ☐ Describe market size and growth (Generate →)   │
│ ☐ Identify key competitors (Generate →)            │
│                                                    │
│ 📋 Examples                                        │
│ [Tech Startup Example] [Healthcare Example]       │
│                                                    │
│ ⚠️ Common Mistakes:                               │
│ • Don't use generic market data                    │
│ • Include specific numbers and sources             │
└─────────────────────────────────────────────────────┘
```

## Success Metrics

- **User Engagement**: Increase in section completion rate
- **Time to Complete**: Reduction in average time to complete a section
- **Quality**: Increase in requirements compliance rate
- **User Satisfaction**: Feedback on guidance usefulness
- **AI Usage**: Increase in AI-generated content usage

## Next Steps

1. Review and approve this proposal
2. Create detailed component specifications
3. Implement Phase 1 improvements
4. User testing and feedback
5. Iterate based on feedback
6. Implement Phase 2 and Phase 3

