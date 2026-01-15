# Setup Wizard Handover Documentation

## Overview
Implementation of 3-step Setup Wizard for project initialization with proper editor store integration.

## Current Status
✅ **Completed:**
- Wizard framework with 3 steps
- Modal width matching collapsed header
- Progress visualization
- Navigation between steps
- Editor store integration

⏳ **Pending:**
- Step 1: Project Basics form integration
- Step 2: Target Selection (funding type cards)
- Step 3: Document Type selection
- Complete wizard flow validation

## Key Files

### 1. Main Wizard Component
**File:** `features/editor/components/Navigation/CurrentSelection/index.tsx`

**Responsibilities:**
- Manages wizard state (`currentStep`)
- Handles step navigation
- Renders appropriate step content
- Integrates with editor store

**Store Actions Used:**
```typescript
const actions = useEditorActions((a) => ({
  setIsConfiguratorOpen: a.setIsConfiguratorOpen,
  setSetupWizardStep: a.setSetupWizardStep,
  completeSetupWizard: a.completeSetupWizard,
}));
```

### 2. Editor Store Integration
**File:** `features/editor/lib/store/editorStore.ts`

**Added Wizard State:**
```typescript
// In EditorState interface:
setupWizard: SetupWizardState;

// SetupWizardState structure:
interface SetupWizardState {
  currentStep: 1 | 2 | 3;
  projectProfile: ProjectProfile | null;
  programProfile: ProgramProfile | null;
  documentTemplateId: DocumentTemplateId | null;
  isComplete: boolean;
}
```

**Available Actions:**
- `setSetupWizardStep(step: 1 | 2 | 3)`
- `setProjectProfile(profile: ProjectProfile | null)`
- `setProgramProfile(profile: ProgramProfile | null)`
- `setDocumentTemplateId(templateId: DocumentTemplateId | null)`
- `completeSetupWizard()`
- `resetSetupWizard()`

### 3. Type Definitions
**File:** `features/editor/lib/types/types.ts`

**Key Interfaces:**
```typescript
interface ProjectProfile {
  projectName: string;
  author: string;
  confidentiality: 'public' | 'confidential' | 'private';
  oneLiner: string;
  stage: 'idea' | 'MVP' | 'revenue';
  country: string;
  industryTags: string[]; // max 3
  financialBaseline: {
    fundingNeeded: number;
    currency: string;
    startDate: string;
    planningHorizon: 12 | 24 | 36;
  };
}

interface ProgramProfile {
  fundingType: 'bank' | 'grant' | 'investor' | 'custom';
  programId?: string;
  programName?: string;
  requiredSections: string[];
  requiredAnnexes: string[];
  scoringChecks: string[];
}

type DocumentTemplateId = 'business-plan' | 'pitch-deck' | 'executive-summary' | 'custom';
```

## Integration Points for Colleague

### Step 1: Project Basics Form
**Location:** Replace placeholder in index.tsx line ~255
```typescript
{currentStep === 1 && (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-white mb-2">Step 1: Project Basics</h3>
    <p className="text-white/80 text-sm mb-4">
      Collect information that affects your document and title page
    </p>
    {/* ADD FORM COMPONENT HERE */}
    {/* Should call: actions.setProjectProfile(formData) on submit */}
  </div>
)}
```

### Step 2: Target Selection
**Modify:** ProgramSelection component to show funding type cards
- Bank / Grant / Investor / Custom options
- Show "What this affects" information
- Call: `actions.setProgramProfile(selection)`

### Step 3: Document Type
**Modify:** ProductSelection component to show templates based on funding type
- Show typical length, required financials, annexes
- Call: `actions.setDocumentTemplateId(selection)`

## Wizard Completion Flow
When user completes Step 3:
1. Call `actions.completeSetupWizard()`
2. Call `actions.setIsConfiguratorOpen(false)`
3. Initialize editor with selected configuration
4. Set readiness to 0%

## Testing Checklist
- [ ] Modal opens with correct width
- [ ] Progress bar shows current step
- [ ] Navigation buttons work correctly
- [ ] Step 1 form validates required fields
- [ ] Data persists between steps
- [ ] Wizard completion initializes editor properly
- [ ] Store state updates correctly

## Notes
- All existing store functionality preserved
- No breaking changes to current editor behavior
- Wizard only activates when `isConfiguratorOpen` is true
- Width calculation uses ref to match collapsed header exactly