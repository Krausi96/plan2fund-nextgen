# 📚 Plan2Fund - Complete Repository Structure Documentation

**Last Updated:** 2025-11-02  
**Status:** ✅ Repository Restructured & Cleaned

---

## 📋 Table of Contents

1. [Repository Overview](#repository-overview)
2. [Directory Structure](#directory-structure)
3. [Feature Modules](#feature-modules)
4. [Shared Components](#shared-components)
5. [Data Flow & Database Integration](#data-flow--database-integration)
6. [Scraper-Lite System](#scraper-lite-system)
7. [API Routes](#api-routes)
8. [Configuration Files](#configuration-files)

---

## 🏗️ Repository Overview

Plan2Fund is a Next.js application with a feature-based architecture. The repository is organized into:

- **`features/`** - Self-contained feature modules
- **`shared/`** - Code shared across features
- **`pages/`** - Next.js pages (cannot be moved)
- **`scraper-lite/`** - Backend data collection system
- **`legacy/`** - Reference code (some still in use)

### Quick Stats

- **Total Files:** ~200+
- **Features:** 5 (reco, editor, intake, export, library)
- **Shared Components:** 35+ (layout, common, ui)
- **API Routes:** 14
- **Pages:** 26
- **Scraper Scripts:** 22

---

## 📁 Directory Structure

```
plan2fund-nextgen/
├── features/                    # Feature modules (self-contained)
│   ├── reco/                   # Recommendation engine
│   │   ├── components/          # React components
│   │   ├── engine/             # Business logic
│   │   ├── contexts/           # React contexts
│   │   └── types/              # TypeScript types
│   ├── editor/                 # Business plan editor
│   │   ├── components/          # Editor UI components
│   │   ├── engine/             # Editor logic
│   │   ├── templates/          # Document templates
│   │   └── types/              # Editor types
│   ├── intake/                 # User onboarding
│   ├── export/                 # Export & payments
│   └── library/                # Program library
│
├── shared/                      # Shared code (used by multiple features)
│   ├── components/              # Shared React components
│   │   ├── layout/            # Header, Footer, Breadcrumbs (7 files)
│   │   ├── common/            # Hero, CTA, SEO (18 files)
│   │   └── ui/                # Base UI primitives (9 files)
│   ├── lib/                    # Shared utilities (15 files)
│   │   ├── analytics.ts
│   │   ├── featureFlags.ts
│   │   ├── planStore.ts
│   │   ├── readiness.ts
│   │   ├── standardSectionTemplates.ts
│   │   └── schemas/           # User profile schemas
│   ├── types/                  # TypeScript types (3 files)
│   ├── contexts/               # React contexts (2 files)
│   ├── data/                   # Static data files (6 files)
│   └── i18n/                   # Internationalization
│
├── pages/                       # Next.js Pages (CANNOT MOVE)
│   ├── api/                     # API routes (14 files)
│   │   ├── programs.ts         # Main programs API
│   │   ├── recommend.ts        # Recommendation API
│   │   ├── programmes/[id]/    # Program detail API
│   │   └── ...
│   └── *.tsx                    # Page components (26 files)
│
├── scraper-lite/                # Backend Data Collection System
│   ├── src/                     # Core scraper code
│   │   ├── scraper.ts          # Main scraping logic
│   │   ├── extract.ts          # HTML extraction
│   │   ├── config.ts           # Institution config loader
│   │   ├── utils.ts            # URL utilities
│   │   └── db/                 # Database layer
│   │       ├── neon-client.ts  # Connection pool
│   │       ├── page-repository.ts  # Pages CRUD
│   │       ├── job-repository.ts   # Jobs CRUD
│   │       └── neon-schema.sql     # Database schema
│   ├── scripts/                 # Utility scripts (22 files)
│   ├── docs/                    # Scraper documentation
│   └── data/                    # Scraped data storage
│       ├── legacy/             # Legacy JSON files
│       └── lite/               # Current scraper data
│
├── legacy/                      # Legacy Code (Reference Only)
│   ├── institutionConfig.ts     # ⚠️ STILL USED - DO NOT DELETE
│   └── webScraperService.ts    # Disabled (documentation only)
│
└── [config files]               # Root configuration
    ├── tsconfig.json
    ├── next.config.js
    ├── package.json
    └── ...
```

---

## 🎯 Feature Modules

### 1. Recommendation Engine (`features/reco/`)

**Purpose:** Matches users with funding programs

**Components:**
- `SmartWizard.tsx` - Multi-step questionnaire wizard
- `ProgramDetailsModal.tsx` - Program detail view

**Engine:**
- `enhancedRecoEngine.ts` - Scoring & filtering logic
- `questionEngine.ts` - Dynamic question generation
- `payload.ts` - User profile generation

**Data Flow:**
- Fetches from `/api/programs?enhanced=true`
- Uses `QuestionEngine` to filter programs during wizard
- Uses `EnhancedRecoEngine` for final scoring

### 2. Editor (`features/editor/`)

**Purpose:** Business plan editor with program-specific requirements

**Components:**
- `UnifiedEditor.tsx` - Main editor component
- `Phase4Integration.tsx` - Phase 4 components integration
- `RequirementsChecker.tsx` - Program compliance checker
- `RichTextEditor.tsx` - Text editing component
- `ProgramSelector.tsx` - Program selection UI
- `DocumentCustomizationPanel.tsx` - Formatting panel
- `EnhancedAIChat.tsx` - AI assistance
- `ExportSettings.tsx` - Export configuration

**Engine:**
- `EditorEngine.ts` - Core editor logic
- `EditorValidation.ts` - Content validation
- `EditorNormalization.ts` - Input normalization
- `categoryConverters.ts` - Requirement category conversion
- `dataSource.ts` - Data fetching & transformation
- `aiHelper.ts` - AI integration
- `doctorDiagnostic.ts` - Diagnostic tools

**Data Flow:**
- Fetches program data from `/api/programmes/[id]/requirements`
- Transforms `categorized_requirements` to editor sections
- Uses `RequirementsChecker` to validate compliance

### 3. Intake (`features/intake/`)

**Purpose:** User onboarding & profile collection

**Components:**
- `PlanIntake.tsx` - Onboarding wizard

**Engine:**
- `intakeEngine.ts` - Intake logic
- `prefill.ts` - Template prefilling
- `targetGroupDetection.ts` - Target group identification

### 4. Export (`features/export/`)

**Purpose:** Document export & payment processing

**Components:**
- `pricing/` - Pricing components (7 files)
- `CartSummary.tsx` - Shopping cart
- `AddOnChips.tsx` - Add-on selection

**Engine:**
- `export.ts` - Export manager
- `pricing.ts` - Pricing logic
- `payments.ts` - Payment processing
- `addons.ts` - Add-on management
- `email.ts` - Email notifications

**Renderer:**
- `renderer.tsx` - Document rendering

### 5. Library (`features/library/`)

**Purpose:** Program browsing & search

**Components:**
- `ProgramDetails.tsx` - Program detail view

**Extractor:**
- `libraryExtractor.ts` - Data extraction for library view

---

## 🔄 Shared Components

### Layout Components (`shared/components/layout/`)

Used on every page:
- `Header.tsx` - Site header
- `Footer.tsx` - Site footer
- `Breadcrumbs.tsx` - Breadcrumb navigation
- `AppShell.tsx` - App wrapper
- `LanguageSwitcher.tsx` - Language selector

### Common Components (`shared/components/common/`)

Used across multiple pages:
- `Hero.tsx`, `HeroLite.tsx` - Hero sections
- `CTAStrip.tsx` - Call-to-action banners
- `SEOHead.tsx` - SEO metadata
- `StructuredRequirementsDisplay.tsx` - Requirements display
- `HowItWorks.tsx` - How it works section
- `PlanTypes.tsx` - Plan type selector
- `WhyPlan2Fund.tsx`, `WhyAustria.tsx` - Marketing sections
- `Tooltip.tsx` - Tooltip component

**Note:** `RequirementsChecker` moved to `features/editor/components/` (editor-specific)

### UI Primitives (`shared/components/ui/`)

Base UI components (shadcn/ui style):
- `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`
- `badge.tsx`, `label.tsx`, `progress.tsx`, `switch.tsx`
- `textarea.tsx`

---

## 💾 Data Flow & Database Integration

### Database Schema (NEON PostgreSQL)

**Tables:**
1. **`pages`** - Core program data
   - URL, title, description
   - Funding amounts, deadlines
   - Contact info, regions
   - Metadata JSONB field

2. **`requirements`** - Normalized requirements
   - Linked to pages via `page_id`
   - 18 categories: eligibility, financial, documents, etc.
   - Type, value, required flag
   - Source tracking

3. **`scraping_jobs`** - Job queue
   - URL, status, depth, seed
   - Error tracking

4. **`seen_urls`** - Discovery tracking
5. **`url_patterns`** - Learned patterns

### Data Flow: Scraper → Database → Components

```
┌─────────────────┐
│  scraper-lite   │
│   (scraper.ts)  │
└────────┬────────┘
         │
         │ savePage()
         │ saveRequirements()
         ▼
┌─────────────────┐
│  NEON Database  │
│   (PostgreSQL)  │
│  - pages        │
│  - requirements │
└────────┬────────┘
         │
         │ SELECT queries
         ▼
┌─────────────────┐
│  API Routes     │
│  /api/programs  │
│  /api/programmes│
└────────┬────────┘
         │
         │ fetch('/api/programs')
         ▼
┌─────────────────┐
│  Components     │
│  - SmartWizard   │
│  - Editor       │
│  - Library      │
└─────────────────┘
```

### Component Data Usage

**SmartWizard & QuestionEngine:**
- Fetches: `/api/programs?enhanced=true`
- Uses: All program data for question generation
- Filters: Programs during wizard flow

**Editor (RequirementsChecker):**
- Fetches: `/api/programmes/[id]/requirements`
- Uses: `categorized_requirements` (18 categories)
- Transforms: To editor sections via `categoryConverters`

**Library:**
- Fetches: `/api/programs`
- Uses: Program metadata for browsing

**AdvancedSearch:**
- Fetches: `/api/programs?enhanced=true`
- Uses: `EnhancedRecoEngine` for filtering/scoring

**Pricing:**
- Uses: Static data from `shared/data/basisPack.ts`
- May use: Program data for requirements display

---

## 🔍 Scraper-Lite System

### Core Files

| File | Purpose |
|------|---------|
| `scraper.ts` | Main scraping logic, discovery + scraping |
| `extract.ts` | Extracts 18 requirement categories from HTML |
| `config.ts` | Loads institution config from `legacy/institutionConfig.ts` |
| `utils.ts` | URL normalization, page classification |

### Database Layer

| File | Purpose |
|------|---------|
| `neon-client.ts` | Connection pool to NEON PostgreSQL |
| `page-repository.ts` | Save/read pages, search functionality |
| `job-repository.ts` | Job queue management |
| `neon-schema.sql` | Database schema definition |

### Scraping Process

1. **Discovery:** Finds program detail pages from seed URLs
2. **Scraping:** Fetches HTML and extracts metadata
3. **Extraction:** Parses 18 requirement categories
4. **Storage:** Saves to database + JSON fallback
5. **Learning:** Updates URL patterns

### Scripts (22 files)

**Manual:**
- `add-new-institution.js` - Add funding source
- `migrate-to-neon.js` - Migrate JSON to database
- `test-neon-connection.js` - Test DB connection
- `reset-state.js` - Clear state

**Analysis:**
- `analyze-cleanup.js` - Cleanup analysis
- `comprehensive-quality-analysis.js` - Quality check
- `analyze-category-usefulness.js` - Category analysis

**Monitoring:**
- `auto-cycle.js` - Automated scraping cycle
- `monitor-improvements.js` - Track improvements
- `monitor-metadata.js` - Metadata monitoring

---

## 🌐 API Routes

### Main Endpoints

**`/api/programs`**
- GET - Returns all programs
- Query: `?enhanced=true` - Returns enriched data
- Source: Database (primary) or JSON (fallback)

**`/api/programmes/[id]/requirements`**
- GET - Returns program requirements
- Transforms: `categorized_requirements` to editor/library format
- Uses: `QuestionEngine` for decision tree generation

**`/api/recommend`**
- POST - Generate recommendations
- Uses: `EnhancedRecoEngine`

**Other APIs:**
- `/api/intake/*` - Intake processing
- `/api/payments/*` - Payment processing
- `/api/analytics/*` - Analytics tracking

---

## ⚙️ Configuration Files

### Root Level

- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS
- `package.json` - Dependencies

### Path Aliases

```json
{
  "paths": {
    "@/features/*": ["./features/*"],
    "@/shared/*": ["./shared/*"],
    "@/scraper/*": ["./scraper-lite/src/*"]
  }
}
```

### Environment Variables

- `DATABASE_URL` - NEON PostgreSQL connection string
- `LITE_SEEDS` - Scraper seed URLs (optional)
- `LITE_MAX_URLS` - Max URLs to scrape

---

## ✅ Verification Checklist

- [x] Repository structure organized
- [x] Components correctly categorized
- [x] Database integration working
- [x] API routes functional
- [x] Imports fixed
- [x] TypeScript compilation passes
- [ ] Database data quality verified
- [ ] Component data usage verified
- [ ] End-to-end data flow tested

---

## 📝 Next Steps

1. **Verify Database Connection**
   - Run `scraper-lite/scripts/test-neon-connection.js`
   - Check data is being saved

2. **Verify Component Data Usage**
   - Test each component's data fetching
   - Verify data quality and completeness

3. **End-to-End Testing**
   - Scrape → Database → API → Component flow
   - Verify all 18 requirement categories are accessible

---

**For questions or issues, refer to:**
- `CLEANUP_REPORT.md` - Progress tracking
- `docs/COLLEAGUE_ONBOARDING_RESTRUCTURE.md` - Detailed onboarding
- `scraper-lite/README.md` - Scraper documentation

