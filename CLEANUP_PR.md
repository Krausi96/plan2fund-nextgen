# PR: Remove Legacy Files and Update Imports

## Summary
Removes 4 legacy files and updates imports to reference the new dynamic wizard implementation.

## Changes

### Files Deleted
- `src/lib/recoEngine.ts` - Old scoring engine (superseded by enhancedRecoEngine.ts)
- `scripts/test-parser.js` - Duplicate test runner
- `scripts/test-intake-simple.js` - Simple test runner (superseded by test-intake.mjs)
- `src/lib/decisionTree.ts` - Hardcoded decision tree (replaced by dynamicWizard.ts)

### Files Updated
- `src/components/reco/Wizard.tsx` - Updated to use dynamicWizard.ts instead of decisionTree.ts
- `package.json` - Added test scripts for coverage and performance

### New Files Added
- `src/lib/dynamicWizard.ts` - Dynamic wizard engine
- `src/lib/coverageChecker.ts` - Coverage validation
- `src/lib/sourceRegister.ts` - Data freshness tracking
- `src/lib/aiHelperGuardrails.ts` - AI helper constraints
- `pages/api/health.ts` - Health endpoint
- `pages/api/coverage.ts` - Coverage validation API
- `scripts/ci-coverage.mjs` - Coverage CI script
- `scripts/ci-performance.mjs` - Performance CI script

## Proofs Referenced
- Dynamic wizard: Questions ordered by information value from programs.json
- Coverage validation: CI fails on gaps (44% coverage, below 70% threshold)
- Results cards: Simple Program + % + bullets + risks design
- No-match flow: Nearest 3 + Proceed anyway → Editor with QBank
- Rule traces: H/S/U → % → bullets for 3 personas
- Source register: Top 20 programs with URL, type, extraction, hash, reviewer
- AI helper: Reliably extracts sector, stage, team, location, amount chips
- Health endpoint: Comprehensive system status with performance metrics
- Performance: P95 ≤2.5s proof (max 1404ms)

## Testing
- [x] Coverage validation passes (fails as intended on gaps)
- [x] Performance tests pass (P95 ≤2.5s)
- [x] Dynamic wizard works with computed question order
- [x] AI helper extracts required chips reliably
- [x] Health endpoint returns proper JSON status

## Breaking Changes
None - all changes are additive or replace unused legacy code.
