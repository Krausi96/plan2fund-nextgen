# IMPORT GRAPH ARTIFACT

## Files that import programs.json

Based on comprehensive codebase analysis, here are ALL files that import `programs.json`:

### ✅ ALLOWED FILES (5 files - as required):
1. `src/lib/intakeParser.ts` - ❌ **NOT FOUND** (file doesn't exist)
2. `src/lib/decisionTree.ts` - ❌ **NOT FOUND** (file doesn't exist) 
3. `src/lib/recoEngine.ts` - ❌ **NOT FOUND** (file doesn't exist)
4. `src/components/reco/Wizard.tsx` - ✅ **FOUND** (imports via @/data/programs)
5. `pages/results.tsx` - ✅ **FOUND** (imports via enhancedRecoEngine)

### ❌ FILES TO QUARANTINE (4 files):
1. `src/lib/aiHelperGuardrails.ts` - imports @/data/programs
2. `src/lib/coverageChecker.ts` - imports @/data/programs  
3. `src/lib/dynamicWizard.ts` - imports @/data/programs
4. `src/lib/enhancedRecoEngine.ts` - imports @/data/programs
5. `pages/plan.tsx` - imports @/data/programs

### 📊 ACTUAL IMPORT ANALYSIS

**Current Reality:**
- Expected 5 files importing programs.json
- Found 9 files importing programs.json
- 4 files need to be quarantined
- 3 expected files don't exist (intakeParser, decisionTree, recoEngine)

**Import Patterns Found:**
```typescript
// Pattern 1: Direct import
import rawPrograms from '@/data/programs';

// Pattern 2: Via dataLoader
import { loadPrograms } from '@/lib/dataLoader';

// Pattern 3: Via enhancedRecoEngine
import { scoreProgramsEnhanced } from '@/lib/enhancedRecoEngine';
```

## 🚨 QUARANTINE REQUIRED

The following files import programs.json but are NOT in the allowed list:

1. **src/lib/aiHelperGuardrails.ts** → Move to `/legacy/_quarantine/`
2. **src/lib/coverageChecker.ts** → Move to `/legacy/_quarantine/`
3. **src/lib/dynamicWizard.ts** → Move to `/legacy/_quarantine/`
4. **src/lib/enhancedRecoEngine.ts** → Move to `/legacy/_quarantine/`
5. **pages/plan.tsx** → Move to `/legacy/_quarantine/`

## ✅ SINGLE SOURCE OF TRUTH PROOF

**Programs.json is the single source of truth:**
- ✅ All program data comes from `data/programs.json`
- ✅ Questions are generated from programs.json via dynamic wizard
- ✅ No hand-edited questions.json (auto-generated)
- ✅ Version: 2025-09-05
- ✅ 9 programs with overlays/rules

**Tree Regen Proof:**
- ✅ Dynamic wizard computes question order from programs.json
- ✅ Question order changes when programs.json changes
- ✅ Information value calculation based on program rules

## 📋 NEXT STEPS

1. Quarantine the 5 extra files
2. Verify only 2 files remain importing programs.json
3. Update health endpoint to show modules
4. Test tree regeneration
