# 🎯 Repository Structure - By Function

## Clear Organization

**KEY RULES:**
1. **Pages stay in `pages/`** - Next.js requirement (DO NOT MOVE)
2. **Components by usage**: Feature-specific → `features/*/components/`, Shared → `shared/components/`
3. **One file = one location** - No duplicates

```
plan2fund-nextgen/
├── features/                           # Functional Features (self-contained)
│   ├── reco/                          # RECOMMENDATION FEATURE
│   │   ├── engine/                    # Reco logic only
│   │   │   ├── enhancedRecoEngine.ts
│   │   │   ├── doctorDiagnostic.ts
│   │   │   └── questionEngine.ts
│   │   ├── components/                # Reco-specific components ONLY
│   │   │   └── ProgramDetailsModal.tsx
│   │   └── api/                       # Reco API (moved from pages/api/recommend.ts)
│   │       └── recommend.ts
│   │
│   ├── editor/                        # EDITOR FEATURE
│   │   ├── engine/                    # Editor logic only
│   │   │   ├── EditorEngine.ts
│   │   │   ├── EditorDataProvider.ts
│   │   │   ├── EditorNormalization.ts
│   │   │   └── EditorValidation.ts
│   │   ├── components/                # Editor-specific components
│   │   │   ├── UnifiedEditor.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── DocumentCustomizationPanel.tsx
│   │   │   ├── EnhancedAIChat.tsx
│   │   │   ├── EntryPointsManager.tsx
│   │   │   ├── ExportSettings.tsx
│   │   │   ├── Phase4Integration.tsx
│   │   │   ├── ProgramSelector.tsx
│   │   │   └── RequirementsChecker.tsx
│   │   └── templates/                 # Editor templates
│   │       ├── productSectionTemplates.ts
│   │       ├── chapters.ts
│   │       └── additionalDocuments.ts
│   │
│   ├── intake/                         # INTAKE FEATURE
│   │   ├── engine/                    # Intake logic
│   │   │   └── intakeEngine.ts
│   │   └── api/                       # Intake API (pages/api/intake/*)
│   │       ├── parse.ts
│   │       └── plan.ts
│   │
│   └── library/                        # LIBRARY FEATURE
│       ├── components/                # Library components
│       │   └── ProgramDetails.tsx
│       └── extractor/                 # Library logic
│           └── libraryExtractor.ts
│
├── shared/                              # SHARED CODE (used by 2+ features)
│   ├── components/
│   │   ├── ui/                        # Base UI primitives (used everywhere)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   └── switch.tsx
│   │   │
│   │   ├── layout/                    # Layout (used by all pages)
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── AppShell.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   ├── SiteBreadcrumbs.tsx
│   │   │   ├── InPageBreadcrumbs.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   │
│   │   ├── common/                    # Common components (multiple features)
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── PlanTypes.tsx
│   │   │   ├── WhoItsFor.tsx
│   │   │   ├── WhyAustria.tsx
│   │   │   ├── WhyPlan2Fund.tsx
│   │   │   ├── TargetGroupBanner.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   ├── CTAStrip.tsx
│   │   │   ├── InfoDrawer.tsx
│   │   │   ├── SEOHead.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   └── HealthFooter.tsx
│   │   │
│   │   ├── pricing/                   # Pricing (used by editor, library)
│   │   │   ├── RequirementsDisplay.tsx
│   │   │   ├── DocumentModal.tsx
│   │   │   ├── DocumentSpecModal.tsx
│   │   │   ├── FilterTabContent.tsx
│   │   │   ├── FilterTabs.tsx
│   │   │   ├── ProofSection.tsx
│   │   │   └── AddonsSection.tsx
│   │   │
│   │   ├── plan/                      # Plan components (used by editor, intake)
│   │   │   ├── PlanIntake.tsx
│   │   │   ├── TableOfContents.tsx
│   │   │   └── TitlePage.tsx
│   │   │
│   │   ├── results/                   # Results (used by reco, library)
│   │   │   └── StructuredRequirementsDisplay.tsx
│   │   │
│   │   ├── success/                   # Success (used by editor)
│   │   │   └── SuccessHub.tsx
│   │   │
│   │   ├── wizard/                    # Wizard (used by reco, intake)
│   │   │   └── SmartWizard.tsx
│   │   │
│   │   ├── gdpr/                      # GDPR (used everywhere)
│   │   │   └── ConsentBanner.tsx
│   │   │
│   │   └── addons/                    # Addons (used by editor, pricing)
│   │       └── AddOnChips.tsx
│   │
│   ├── lib/                            # Shared libraries
│   │   ├── dataSource.ts              # Data source abstraction
│   │   └── utils.ts                   # Shared utilities
│   │
│   ├── types/                          # Shared TypeScript types
│   │   ├── requirements.ts
│   │   ├── plan.ts
│   │   ├── reco.ts
│   │   ├── editor.ts
│   │   └── readiness.ts
│   │
│   ├── contexts/                       # React Contexts
│   │   ├── RecommendationContext.tsx
│   │   ├── UserContext.tsx
│   │   └── I18nContext.tsx
│   │
│   ├── data/                           # Shared data
│   │   ├── documentBundles.ts
│   │   ├── documentDescriptions.ts
│   │   ├── pricingData.ts
│   │   ├── basisPack.ts
│   │   ├── industryVariations.ts
│   │   └── officialTemplates.ts
│   │
│   └── hooks/                          # Shared React Hooks
│
├── pages/                              # Next.js Pages (STAYS HERE - Next.js requirement)
│   ├── api/
│   │   ├── programs.ts                # Main programs API (stays)
│   │   └── ...                        # Other APIs (stays)
│   ├── reco.tsx                        # STAYS HERE - imports from features/reco/components
│   ├── editor.tsx                     # STAYS HERE - imports from features/editor/components
│   ├── library.tsx                     # STAYS HERE - imports from features/library/components
│   └── ...
│
├── apps/
│   └── scraper/                        # SCRAPER APPLICATION (backend)
│       ├── src/
│       │   ├── extract.ts
│       │   ├── scraper.ts
│       │   ├── config.ts
│       │   └── utils.ts
│       ├── scripts/
│       ├── data/
│       └── docs/
│
├── database/                           # DATABASE LAYER
│   ├── client/
│   │   └── neon-client.ts
│   ├── repositories/
│   │   ├── page-repository.ts
│   │   └── job-repository.ts
│   └── schema.sql
│
└── legacy/                             # Legacy code (reference only)
```

## Import Paths

```typescript
// Features (by function)
import { RecoEngine } from '@/features/reco/engine/enhancedRecoEngine';
import { EditorEngine } from '@/features/editor/engine/EditorEngine';
import { ProgramDetailsModal } from '@/features/reco/components/ProgramDetailsModal';

// Shared components (by category)
import { Button } from '@/shared/components/ui/button';
import { Header } from '@/shared/components/layout/Header';
import { RequirementsDisplay } from '@/shared/components/pricing/RequirementsDisplay';

// Shared libraries
import { dataSource } from '@/shared/lib/dataSource';

// Database
import { savePage } from '@/database/repositories/page-repository';

// Scraper
import { scrape } from '@/scraper/src/scraper';
```

## Component Categorization Rules

### Feature-Specific (`features/*/components/`)
- **Used ONLY by that feature**
- Examples: `UnifiedEditor` (editor), `ProgramDetailsModal` (reco)

### Shared (`shared/components/`) - Organized by Usage

**Base Primitives (`ui/`)** - Used everywhere
- `button.tsx`, `input.tsx`, `dialog.tsx`, `badge.tsx`, etc.

**Layout (`layout/`)** - Used on all pages
- `Header.tsx`, `Footer.tsx`, `AppShell.tsx`, `Breadcrumbs.tsx`

**Common (`common/`)** - Used on multiple pages/features
- `Hero.tsx`, `HowItWorks.tsx`, `CTAStrip.tsx`, `SEOHead.tsx`

**Pricing (`pricing/`)** - Used by editor + library features
- `RequirementsDisplay.tsx`, `DocumentModal.tsx`, `FilterTabs.tsx`

**Plan (`plan/`)** - Used by editor + intake features
- `PlanIntake.tsx`, `TableOfContents.tsx`, `TitlePage.tsx`

**Results (`results/`)** - Used by reco + library
- `StructuredRequirementsDisplay.tsx`

**Wizard (`wizard/`)** - Used by reco + intake
- `SmartWizard.tsx`

**Other (`gdpr/`, `addons/`, `success/`)** - Categorized by purpose

## Migration Rules

1. ✅ **Pages stay in `pages/`** - Next.js requirement (NEVER MOVE `pages/*.tsx`)
2. ✅ **API routes move** - `pages/api/recommend.ts` → `features/reco/api/recommend.ts`
3. ✅ **Feature logic** - `src/lib/enhancedRecoEngine.ts` → `features/reco/engine/`
4. ✅ **Feature components** - `src/components/reco/` → `features/reco/components/`
5. ✅ **Shared components** - `src/components/ui/` → `shared/components/ui/` (used everywhere)
6. ✅ **One file = one location** - No duplicates ever

## What Stays Where

**NEVER MOVE:**
- `pages/*.tsx` - Next.js requires pages here
- `pages/api/programs.ts` - Main API (may stay or be reviewed later)

**MUST MOVE:**
- Feature APIs → `features/*/api/`
- Feature logic → `features/*/engine/`
- Feature components → `features/*/components/`
- Shared components → `shared/components/[category]/`

