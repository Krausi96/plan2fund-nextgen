# RECOMMENDATION ENGINE INVENTORY TABLE

## LIVE FILES (Keep)
| File | Purpose | Status | Notes |
|------|---------|--------|-------|
| `src/lib/enhancedRecoEngine.ts` | Main scoring engine | ✅ LIVE | Primary recommendation engine |
| `src/lib/scoring.ts` | Legacy scoring | ⚠️ KEEP | Backward compatibility |
| `src/lib/decisionTree.ts` | Decision tree logic | ❌ REPLACE | Hardcoded, needs dynamic |
| `src/components/reco/Wizard.tsx` | Wizard component | ⚠️ UPDATE | Needs dynamic ordering |
| `src/components/fallback/ZeroMatchFallback.tsx` | No-match fallback | ✅ LIVE | Good implementation |
| `pages/results.tsx` | Results page | ⚠️ UPDATE | Needs simple cards |
| `data/programs.json` | Program data | ✅ LIVE | Core data source |
| `data/questions.json` | Question definitions | ✅ LIVE | Core data source |
| `pages/api/recommend.ts` | Main API endpoint | ✅ LIVE | Working |
| `pages/api/recommend/decision-tree.ts` | Decision tree API | ❌ REPLACE | Hardcoded |
| `pages/api/recommend/free-text.ts` | Free text API | ✅ LIVE | Working |
| `pages/api/data/programs.ts` | Programs API | ✅ LIVE | Working |
| `pages/api/data/questions.ts` | Questions API | ✅ LIVE | Working |

## LEGACY FILES (Delete)
| File | Purpose | Reason | Action |
|------|---------|--------|--------|
| `src/lib/recoEngine.ts` | Old scoring engine | Superseded by enhancedRecoEngine.ts | DELETE |
| `scripts/test-parser.js` | Duplicate test runner | Duplicate of test-parser-fixed.js | DELETE |
| `scripts/test-intake-simple.js` | Simple test runner | Superseded by test-intake.mjs | DELETE |
| `src/lib/decisionTree.ts` | Hardcoded decision tree | Will be replaced by dynamicWizard.ts | REPLACE |

## NEW FILES (Create)
| File | Purpose | Status |
|------|---------|--------|
| `src/lib/dynamicWizard.ts` | Dynamic wizard engine | ✅ CREATED |
| `src/lib/coverageChecker.ts` | Coverage validation | 🔄 CREATING |
| `src/lib/sourceRegister.ts` | Data freshness tracking | 🔄 CREATING |
| `src/lib/aiHelperGuardrails.ts` | AI helper constraints | 🔄 CREATING |
| `pages/api/health.ts` | Health endpoint | 🔄 CREATING |
| `pages/api/coverage.ts` | Coverage validation API | 🔄 CREATING |
| `scripts/ci-coverage.mjs` | Coverage CI script | 🔄 CREATING |

## ROUTES INVENTORY
| Route | Method | Purpose | Status |
|-------|--------|---------|--------|
| `/reco` | GET | Wizard page | ⚠️ UPDATE |
| `/results` | GET | Results page | ⚠️ UPDATE |
| `/api/recommend` | POST | Main recommendation | ✅ LIVE |
| `/api/recommend/decision-tree` | POST | Decision tree | ❌ REPLACE |
| `/api/recommend/free-text` | POST | Free text analysis | ✅ LIVE |
| `/api/data/programs` | GET | Program data | ✅ LIVE |
| `/api/data/questions` | GET | Question data | ✅ LIVE |
| `/api/health` | GET | Health check | 🔄 CREATING |
| `/api/coverage` | GET | Coverage validation | 🔄 CREATING |
| `/api/ai-helper` | POST | AI helper | 🔄 CREATING |

## DUPLICATES IDENTIFIED
| Files | Issue | Resolution |
|-------|-------|------------|
| `test-intake.js`, `test-intake.mjs`, `test-intake-simple.js` | Multiple test runners | Keep `test-intake.mjs`, delete others |
| `recoEngine.ts` vs `enhancedRecoEngine.ts` | Two scoring engines | Keep `enhancedRecoEngine.ts`, delete `recoEngine.ts` |
| `decisionTree.ts` vs `dynamicWizard.ts` | Hardcoded vs dynamic | Replace `decisionTree.ts` with `dynamicWizard.ts` |
