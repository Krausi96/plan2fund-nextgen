# IMPORT DEPENDENCY TABLE - CORE RECOMMENDATION SYSTEM

## ✅ CORE FILES (KEPT LIVE)

| File | Imports From | Exported To | Runtime Used | Status |
|------|-------------|-------------|--------------|--------|
| **`pages/reco.tsx`** | `@/components/reco/Wizard` | - | ✅ Yes | **KEEP** |
| **`pages/results.tsx`** | `@/lib/enhancedRecoEngine` | - | ✅ Yes | **KEEP** |
| **`pages/api/recommend.ts`** | `@/lib/enhancedRecoEngine`, `@/lib/analytics` | - | ✅ Yes | **KEEP** |
| **`src/components/reco/Wizard.tsx`** | `@/lib/enhancedRecoEngine`, `@/lib/dynamicWizard` | `pages/reco.tsx` | ✅ Yes | **KEEP** |
| **`src/lib/enhancedRecoEngine.ts`** | `@/data/programs` | `pages/results.tsx`, `pages/api/recommend.ts`, `src/components/reco/Wizard.tsx` | ✅ Yes | **KEEP** |
| **`src/lib/dynamicWizard.ts`** | `@/data/programs`, `@/data/questions` | `src/components/reco/Wizard.tsx` | ✅ Yes | **KEEP** |
| **`data/programs.json`** | - | `src/lib/enhancedRecoEngine.ts`, `src/lib/dynamicWizard.ts` | ✅ Yes | **KEEP** |
| **`data/questions.json`** | - | `src/lib/dynamicWizard.ts` | ✅ Yes | **KEEP** |

## 🚫 QUARANTINED FILES (MOVED TO legacy/_quarantine/reco_editor_files/)

| File | Reason for Quarantine | Dependencies Removed |
|------|----------------------|---------------------|
| `src/lib/recoEngine.ts` | Superseded by enhancedRecoEngine.ts | ✅ Removed from pages/api/recommend.ts |
| `src/lib/decisionTree.ts` | Hardcoded, replaced by dynamicWizard.ts | ✅ Removed from pages/api/recommend.ts |
| `src/lib/scoring.ts` | Legacy scoring, replaced by enhancedRecoEngine.ts | ✅ Removed from pages/api/recommend.ts |
| `pages/api/recommend/decision-tree.ts` | Hardcoded decision tree API | ✅ Quarantined |
| `pages/api/recommend/free-text.ts` | Used legacy recoEngine.ts | ✅ Quarantined |
| `src/components/reco/EduPanel.tsx` | Side panel, not core functionality | ✅ Removed from pages/reco.tsx |
| `src/components/reco/ProgramDetailsModal.tsx` | Modal component, not core functionality | ✅ Quarantined |
| `src/components/reco/ExplorationModal.tsx` | Modal component, not core functionality | ✅ Quarantined |
| `src/components/editor/ProgramAwareEditor.tsx` | Editor component, not core reco system | ✅ Quarantined |

## 📊 DEPENDENCY FLOW

```
data/programs.json ──┐
                     ├── src/lib/dynamicWizard.ts ──┐
data/questions.json ─┘                              │
                                                    ├── src/components/reco/Wizard.tsx ──┐
src/lib/enhancedRecoEngine.ts ──────────────────────┘                                    │
                                                                                         ├── pages/reco.tsx
                                                                                         │
src/lib/enhancedRecoEngine.ts ──────────────────────────────────────────────────────────┘
                                                                                         │
src/lib/enhancedRecoEngine.ts ──────────────────────────────────────────────────────────┼── pages/results.tsx
                                                                                         │
src/lib/enhancedRecoEngine.ts ──────────────────────────────────────────────────────────┼── pages/api/recommend.ts
                                                                                         │
src/lib/analytics.ts ──────────────────────────────────────────────────────────────────┘
```

## ✅ VERIFICATION

1. **No Circular Dependencies**: All imports flow in one direction
2. **Minimal Core**: Only 8 files needed for full recommendation system
3. **Clean Separation**: Quarantined files don't affect core functionality
4. **Dynamic Wizard**: Questions ordered by programs.json overlays, no hardcoded "Program Type"
5. **Enhanced Engine**: Single scoring engine with detailed explanations

## 🎯 CORE SYSTEM CAPABILITIES

- **Dynamic Question Ordering**: Based on program rule analysis
- **Enhanced Scoring**: Detailed explanations with matched criteria and gaps
- **No-Match Fallback**: Nearest 3 programs + proceed anyway option
- **Simple Results Cards**: Program + % + bullets + risks
- **Real-time Adaptation**: Changes to programs.json automatically update question order
