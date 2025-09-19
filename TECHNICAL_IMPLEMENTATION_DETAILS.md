# Recommendation Engine - Technical Implementation Details

## Current System Architecture Analysis

### File Structure Assessment

```
pages/
├── reco.tsx                     ✅ Main wizard entry point
├── results.tsx                  ⚠️  Basic results, needs enhancement
├── api/recommend.ts             ✅ Core recommendation API

src/
├── components/reco/
│   ├── Wizard.tsx              ⚠️  Has program type logic to remove
│   └── ProgramDetailsModal.tsx  ✅ Existing modal system
├── components/fallback/
│   └── ZeroMatchFallback.tsx   ⚠️  Missing "Proceed anyway" flow
├── components/plan/
│   └── AIChat.tsx              ⚠️  In editor only, need wizard integration
├── lib/
│   ├── recoEngine.ts           ✅ Core scoring logic
│   ├── enhancedRecoEngine.ts   ✅ Enhanced scoring
│   ├── decisionTree.ts         ❌ Starts with program type selection
│   ├── featureFlags.ts         ✅ Complete flag system
│   └── scoring.ts              ✅ Rule evaluation

data/
├── questions.json              ✅ Universal questions structure
├── programs.json               ✅ Program database
└── registry/                   ✅ Program categories
```

## Detailed Gap Analysis & Implementation Requirements

### 1. Decision Tree Refactor (Critical Priority)

**Current Problem**: `decisionTree.ts` lines 36-48 start with program type selection
```typescript
// CURRENT (WRONG) - Line 37-47
this.nodes.set('program_type', {
  id: 'program_type',
  question: 'What type of funding are you looking for?',
  type: 'single',
  options: [
    { value: 'GRANT', label: 'Grant (Non-repayable funding)', nextNodeId: 'grant_eligibility' },
    // ... more program type options
  ]
});
```

**Required Fix**: Program type should be inferred from universal questions
```typescript
// NEW APPROACH - Infer program type from answers
private inferProgramType(answers: Record<string, any>): string[] {
  const types: string[] = [];
  
  // Grant inference logic
  if (answers.q2_entity_stage === 'PRE_COMPANY' || answers.q2_entity_stage === 'INC_LT_6M') {
    types.push('GRANT');
  }
  
  // Loan inference logic  
  if (answers.q2_entity_stage === 'INC_GT_36M' && answers.q3_company_size !== 'MICRO_0_9') {
    types.push('LOAN');
  }
  
  // Visa inference logic
  if (answers.q1_country === 'NON_EU') {
    types.push('VISA');
  }
  
  return types;
}
```

### 2. Inline AI Helper Implementation

**New Component Required**: `src/components/reco/InlineAIHelper.tsx`

```typescript
interface InlineAIHelperProps {
  isOpen: boolean;
  onClose: () => void;
  onChipsGenerated: (chips: AnswerChip[]) => void;
  currentAnswers: Record<string, any>;
}

interface AnswerChip {
  questionId: string;
  value: string;
  confidence: number;
  source: 'ai' | 'user';
}

export default function InlineAIHelper({ 
  isOpen, 
  onClose, 
  onChipsGenerated,
  currentAnswers 
}: InlineAIHelperProps) {
  // Implementation details:
  // 1. Text input for messy user description
  // 2. Extract structured data → chips
  // 3. Map chips to question answers
  // 4. Feed back into wizard state
  // 5. Guardrails: never invent programs, detect off-topic
}
```

**Integration Point**: In `Wizard.tsx`, add AI helper toggle:
```typescript
// Add to Wizard.tsx state
const [showAIHelper, setShowAIHelper] = useState(false);

// Add AI helper button to wizard UI
<Button 
  variant="outline" 
  onClick={() => setShowAIHelper(true)}
  className="mb-4"
>
  🤖 Need help? Describe your situation
</Button>
```

### 3. Enhanced Results Display

**Current Issue**: Results show technical data instead of human explanations

**Required Changes to `pages/results.tsx`**:

```typescript
// NEW: Human-readable result card
interface HumanReadableResult extends ProgramResult {
  inferredCategory: 'Grant' | 'Loan' | 'Visa' | 'Equity';
  whyItFits: string[];        // 3-5 plain language bullets
  risksNextSteps: string[];   // 1-2 bullets
}

// NEW: Explanation generator
const generateHumanExplanations = (program: ProgramResult, answers: Record<string, any>): HumanReadableResult => {
  const whyItFits: string[] = [];
  const risksNextSteps: string[] = [];
  
  // Convert technical rule matches to human language
  if (program.matchedCriteria?.includes('q1_country=AT')) {
    whyItFits.push('✓ Your project location (Austria) matches program requirements');
  }
  
  if (program.matchedCriteria?.includes('q2_entity_stage=PRE_COMPANY')) {
    whyItFits.push('✓ Perfect timing - designed for pre-incorporation stage');
  }
  
  // Risk assessment
  if (program.gaps?.length > 0) {
    risksNextSteps.push(`⚠️ Missing: ${program.gaps.join(', ')}`);
  }
  
  risksNextSteps.push('📋 Next: Review official requirements and prepare application');
  
  return {
    ...program,
    inferredCategory: inferProgramCategory(program),
    whyItFits,
    risksNextSteps
  };
};
```

### 4. Source Register & Freshness System

**New Files Required**:

`src/lib/sourceRegister.ts`:
```typescript
interface ProgramSource {
  programId: string;
  url: string;
  type: 'HTML' | 'PDF' | 'FAQ';
  extractionMethod: 'auto' | 'manual';
  lastChecked: Date;
  contentHash: string;
  reviewer: string;
  status: 'active' | 'manual' | 'failed';
  excerpts: {
    section: string;
    text: string;
    extractedDate: Date;
  }[];
}

export class SourceRegister {
  async checkFreshness(programId: string): Promise<FreshnessStatus> {
    // Implementation for checking if program source has changed
  }
  
  async createDiffPR(changes: ProgramChange[]): Promise<string> {
    // Create PR for program data changes
  }
}
```

`scripts/data-diff-bot.js`:
```javascript
// Automated script to check program sources and create PRs
const checkProgramSources = async () => {
  const register = new SourceRegister();
  const programs = await loadPrograms();
  
  for (const program of programs.slice(0, 20)) { // Top 20 AT programs
    const freshness = await register.checkFreshness(program.id);
    if (freshness.hasChanges) {
      await register.createDiffPR(freshness.changes);
    }
  }
};
```

### 5. Rule Traceability System

**New File**: `src/lib/ruleTracer.ts`
```typescript
interface RuleTrace {
  programId: string;
  userId: string;
  persona: 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA';
  inputs: Record<string, any>;
  normalizedChips: AnswerChip[];
  ruleEvaluations: {
    ruleId: string;
    type: 'HARD' | 'SOFT' | 'UNCERTAIN';
    result: 'pass' | 'fail' | 'unknown';
    impact: number;
  }[];
  finalScore: number;
  explanationBullets: string[];
  timestamp: Date;
}

export class RuleTracer {
  async tracePersonaDecision(
    persona: PersonaType, 
    answers: Record<string, any>
  ): Promise<RuleTrace> {
    // Generate complete decision trace for persona
  }
}
```

### 6. Performance Monitoring Implementation

**New File**: `src/lib/performanceMonitor.ts`
```typescript
interface PerformanceMetrics {
  endpoint: string;
  latency: number;
  timestamp: Date;
  success: boolean;
  userSegment?: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  
  startTiming(label: string): PerformanceTimer {
    return new PerformanceTimer(label);
  }
  
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
  }
  
  getP95Latency(timeRange: TimeRange): number {
    // Calculate 95th percentile latency
  }
}

// Usage in API routes:
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const timer = performanceMonitor.startTiming('recommend_api');
  
  try {
    // ... existing logic
  } finally {
    timer.end();
  }
}
```

### 7. QBank Integration for No-Match Flow

**New Component**: `src/components/plan/QBank.tsx`
```typescript
interface QBankItem {
  questionId: string;
  label: string;
  importance: 'high' | 'medium' | 'low';
  reason: string;
  suggestedAnswer?: any;
}

interface QBankProps {
  missingItems: QBankItem[];
  uncertainItems: QBankItem[];
  onItemCompleted: (questionId: string, answer: any) => void;
}

export default function QBank({ missingItems, uncertainItems, onItemCompleted }: QBankProps) {
  // Render questionnaire bank with:
  // 1. Missing items first (high importance)
  // 2. Uncertain items second
  // 3. Suggested improvements
  // 4. Integration with Editor workflow
}
```

**Integration with ZeroMatchFallback**:
```typescript
// Update ZeroMatchFallback.tsx
const handleProceedAnyway = () => {
  const qbankItems = generateQBankItems(userAnswers, suggestedPrograms);
  
  // Store QBank items in localStorage
  localStorage.setItem('editorQBank', JSON.stringify(qbankItems));
  
  // Redirect to editor with QBank enabled
  router.push('/editor?qbank=true');
};
```

## Critical Implementation Order

### Week 1: Foundation
1. **Decision Tree Refactor** - Remove program type upfront
2. **Enhanced Results Display** - Human-readable explanations
3. **Performance Monitor Setup** - Basic latency tracking

### Week 2-3: AI Integration  
1. **Inline AI Helper Component** - Text to chips conversion
2. **AI Guardrails System** - Program invention prevention
3. **Program Suggestion Tickets** - Unknown program handling

### Week 4-5: Data Systems
1. **Source Register Implementation** - Program freshness tracking
2. **Data Diff Bot** - Automated change detection
3. **Rule Traceability** - Complete decision traces

### Week 6-7: User Experience
1. **QBank Integration** - No-match flow completion
2. **Uncertainty Handling** - Max 3 micro-overlays
3. **Results Page Polish** - Final UI improvements

### Week 8-9: Validation
1. **End-to-End Testing** - All persona journeys
2. **Performance Optimization** - Meet P95 requirement
3. **Documentation** - Route inventory and flag docs

## Technical Dependencies

### External Services
- **Feature Flags**: Already implemented in `featureFlags.ts`
- **Analytics**: Existing `analytics.ts` integration
- **Airtable**: Used for gap tickets in `airtable.ts`
- **Vercel Deployment**: Performance monitoring integration needed

### Data Dependencies
- **Program Database**: Enhance `data/programs.json` with source tracking
- **Question Structure**: Extend `data/questions.json` with uncertainty handling
- **Registry Data**: Maintain `data/registry/` for categorization

## Risk Mitigation Strategies

### High-Risk Items
1. **Decision Tree Logic**: Create comprehensive test suite before refactoring
2. **AI Integration**: Start with simple rule-based system before adding LLM
3. **Performance**: Implement caching and optimization from day one

### Rollback Plans
1. **Feature Flags**: Use flags to enable/disable new components
2. **Database Changes**: Maintain backward compatibility
3. **API Changes**: Version API endpoints for safe deployment

## Success Validation

### Automated Testing
- Unit tests for all new components
- Integration tests for user flows
- Performance tests for latency requirements
- End-to-end tests for persona journeys

### Manual Validation  
- Demo recordings for all user-side proofs
- Rule trace documentation for system-side proofs
- Performance dashboard showing P95 ≤ 2.5s
- Feature flag and route inventory documentation

---

*This technical specification provides the detailed implementation roadmap for each component identified in the audit. Each section includes specific code examples and integration points to ensure successful delivery.*