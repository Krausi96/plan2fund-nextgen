# Dead Imports Analysis

## Summary
- **Total Dead Imports**: 45
- **Confidence Level**: HIGH
- **Categories**: 4 main types

## Categories Breakdown

### 1. Unused React Imports (25 files)
**Issue**: `import React from 'react';` is unused in modern React with JSX Transform

**Files Affected**:
- `src/components/editor/CollaborationManager.tsx:5`
- `src/components/editor/FormHelpModal.tsx:4`
- `src/components/editor/TemplatesFormattingManager.tsx:5`
- `src/components/intake/OffTopicGate.tsx:2`
- `src/components/plan/TableOfContents.tsx:1`
- `src/components/pricing/DocumentModal.tsx:1`
- `src/components/pricing/DocumentSpecModal.tsx:4`
- `src/components/pricing/FilterTabContent.tsx:1`
- `src/components/pricing/FilterTabs.tsx:1`
- `src/components/pricing/HowItWorksSection.tsx:4`
- `src/components/pricing/ProofSection.tsx:4`
- `src/components/reco/UnifiedRecommendationWizard.tsx:2`
- `src/components/ui/switch.tsx:6`
- `src/editor/addons/AddonPack.tsx:4`
- `src/editor/figures/index.tsx:4`
- `src/editor/settings/FormattingPanel.tsx:4`
- `src/export/renderer.tsx:4`
- `pages/editor.tsx:4`

**Action**: Remove all `import React from 'react';` statements
**Risk**: LOW - Modern React doesn't require React import for JSX

### 2. Unused Type Imports (12 files)
**Issue**: TypeScript type imports that are not used in the code

**Files Affected**:
- `src/components/pricing/AddonsSection.tsx:6` - `type FundingType`
- `src/components/pricing/FilterTabContent.tsx:3` - `type Product`, `type FundingType`, `type TargetGroup`
- `src/components/pricing/RequirementsDisplay.tsx:3` - `type TargetGroup`, `type FundingType`, `type Product`
- `src/components/pricing/RequirementsMatrix.tsx:6` - `type TargetGroup`, `type FundingType`, `type Product`
- `src/data/documentBundles.ts:6` - `type Product`, `type FundingType`, `type TargetGroup`
- `src/data/pricingData.ts:4` - `type Product`
- `src/data/pricingData.ts:5` - `type FundingType`
- `src/data/pricingData.ts:6` - `type TargetGroup`
- `pages/pricing.tsx:19` - `type Product`, `type FundingType`, `type TargetGroup`
- `pages/export.tsx:4` - `type PlanSection`
- `pages/preview.tsx:4` - `type PlanSection`

**Action**: Remove unused type imports
**Risk**: LOW - Type imports don't affect runtime

### 3. Commented-Out Imports (6 files)
**Issue**: Import statements that are commented out but still detected

**Files Affected**:
- `src/components/editor/StructuredEditor.tsx:3` - `// import { Card } from '@/components/ui/card'; // Unused`
- `src/components/editor/TemplatesFormattingManager.tsx:8` - `// import TemplateSelector from './TemplateSelector'; // Removed - using inline component`
- `src/components/results/StructuredRequirementsDisplay.tsx:3` - `// import { Badge } from '@/components/ui/badge'; // Unused`
- `src/components/success/SuccessHub.tsx:5` - `// import featureFlags from '@/lib/featureFlags';`
- `src/editor/addons/AddonPack.tsx:5` - `// import { Button } from '@/components/ui/button';`
- `src/lib/readiness.ts:8` - `// import { DecisionTreeResult } from './dynamicDecisionTree'; // Temporarily disabled`
- `src/lib/readiness.ts:10` - `// import { TemplateSection } from './programTemplates'; // Temporarily disabled`
- `pages/advanced-search.tsx:8` - `// import { advancedSearchDoctor } from '@/lib/advancedSearchDoctor';`
- `pages/api/ai-assistant.ts:6` - `// import { createEnhancedAIHelper } from '@/lib/aiHelper';`
- `pages/api/intelligent-readiness.ts:6` - `// import { ReadinessValidator, getProgramRequirements } from '@/lib/readiness';`
- `pages/api/intelligent-readiness.ts:7` - `// import { ProgramTemplate, TemplateSection } from '@/lib/programTemplates';`
- `pages/api/intelligent-readiness.ts:8` - `// import { DecisionTreeResult } from '@/lib/dynamicDecisionTree';`
- `pages/api/programs.ts:62` - `// import { dataSource } from '../../src/lib/dataSource';`

**Action**: Remove commented-out import lines
**Risk**: LOW - These are already commented out

### 4. Unused Type Definitions (2 files)
**Issue**: TypeScript type definitions that are imported but not used

**Files Affected**:
- `src/components/ui/button.tsx:3` - `type VariantProps` from class-variance-authority
- `src/lib/utils.ts:1` - `type ClassValue` from clsx
- `src/lib/motion.ts:2` - `motion as motionTokens` from theme

**Action**: Remove unused type imports
**Risk**: LOW - Type imports don't affect runtime

## Removal Strategy

### Phase 1: Safe Removals (HIGH Priority)
1. **Commented-out imports** - Remove entire lines
2. **Unused React imports** - Remove `import React from 'react';`
3. **Unused type imports** - Remove specific type imports

### Phase 2: Verification
1. Run TypeScript check after each category
2. Test build to ensure no regressions
3. Verify functionality still works

## Expected Impact
- **Bundle Size**: Minimal reduction (mostly type imports)
- **Code Cleanliness**: Significant improvement
- **Maintainability**: Better - cleaner imports
- **Build Time**: Slightly faster (fewer imports to process)

## Risk Assessment
- **Overall Risk**: LOW
- **Breaking Changes**: None expected
- **Testing Required**: Basic TypeScript compilation check
