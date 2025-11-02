# 📁 Plan2Fund Repository Structure

**Last Updated:** 2025-11-02  
**Purpose:** Complete, non-ambiguous folder structure for developers and non-technical team members

---

## 🎯 Overview

This repository contains **three main applications**:
1. **Web Application** (Next.js) - Frontend + API
2. **Scraper Application** - Backend data collection system
3. **Database Layer** - PostgreSQL (NEON) for persistent storage

**Total Files:** ~150+ TypeScript/JavaScript files  
**Total Folders:** ~40 directories

---

## 📂 Complete Folder Structure

```
plan2fund-nextgen/
│
├── 📱 FRONTEND & API (Web Application)
│   ├── pages/                          # Next.js Pages (DO NOT MOVE - Framework Requirement)
│   │   ├── index.tsx                   # Homepage
│   │   ├── reco.tsx                    # Recommendation page
│   │   ├── editor.tsx                  # Business plan editor
│   │   ├── library.tsx                 # Program library
│   │   ├── pricing.tsx                 # Pricing page
│   │   └── api/                        # API Endpoints (Next.js requirement)
│   │       ├── programs.ts             # Main programs API
│   │       ├── recommend.ts            # Recommendation API
│   │       ├── intake/                 # Intake APIs
│   │       └── payments/               # Payment APIs
│   │
│   ├── features/                       # FEATURE MODULES (Self-Contained Features)
│   │   ├── reco/                       # RECOMMENDATION FEATURE
│   │   │   ├── engine/                 # Recommendation Logic
│   │   │   │   ├── enhancedRecoEngine.ts      # Main scoring engine
│   │   │   │   ├── questionEngine.ts           # Question wizard logic
│   │   │   │   └── payload.ts                 # Data preparation
│   │   │   ├── components/             # Recommendation Components
│   │   │   │   ├── wizard/             # Wizard subfolder
│   │   │   │   │   └── SmartWizard.tsx         # Main wizard UI
│   │   │   │   └── ProgramDetailsModal.tsx     # Program detail popup
│   │   │   ├── contexts/               # React Context (State Management)
│   │   │   │   └── RecommendationContext.tsx
│   │   │   ├── types/                  # TypeScript Types
│   │   │   │   └── reco.ts
│   │   │   └── api/                    # Feature-Specific APIs
│   │   │       └── recommend.ts        # Moved from pages/api/recommend.ts
│   │   │
│   │   ├── editor/                     # BUSINESS PLAN EDITOR FEATURE
│   │   │   ├── engine/                 # Editor Logic
│   │   │   │   ├── EditorEngine.ts            # Main editor logic
│   │   │   │   ├── EditorDataProvider.ts      # Data management
│   │   │   │   ├── EditorNormalization.ts     # Data cleaning
│   │   │   │   ├── EditorValidation.ts        # Input validation
│   │   │   │   ├── aiHelper.ts                # AI assistance
│   │   │   │   ├── categoryConverters.ts     # Category mapping
│   │   │   │   └── dataSource.ts              # Data fetching
│   │   │   ├── components/             # Editor Components
│   │   │   │   ├── UnifiedEditor.tsx          # Main editor UI
│   │   │   │   ├── RichTextEditor.tsx         # Text editing
│   │   │   │   ├── DocumentCustomizationPanel.tsx
│   │   │   │   ├── EnhancedAIChat.tsx         # AI chat feature
│   │   │   │   ├── EntryPointsManager.tsx
│   │   │   │   ├── ExportSettings.tsx
│   │   │   │   ├── Phase4Integration.tsx
│   │   │   │   ├── ProgramSelector.tsx
│   │   │   │   └── RequirementsChecker.tsx
│   │   │   ├── templates/              # Document Templates
│   │   │   │   ├── productSectionTemplates.ts
│   │   │   │   ├── chapters.ts
│   │   │   │   └── additionalDocuments.ts
│   │   │   └── types/                  # TypeScript Types
│   │   │       └── editor.ts
│   │   │
│   │   ├── intake/                     # INTAKE (User Onboarding) FEATURE
│   │   │   ├── engine/                 # Intake Logic
│   │   │   │   ├── intakeEngine.ts            # Main intake processor
│   │   │   │   ├── targetGroupDetection.ts    # User segmentation
│   │   │   │   └── prefill.ts                  # Auto-fill logic
│   │   │   ├── components/             # Intake Components
│   │   │   │   ├── PlanIntake.tsx              # Intake form
│   │   │   │   ├── Hero.tsx                   # Intake hero section
│   │   │   │   └── TargetGroupBanner.tsx       # User type banner
│   │   │   └── api/                    # Intake APIs
│   │   │       ├── parse.ts                   # Parse user input
│   │   │       └── plan.ts                    # Plan creation
│   │   │
│   │   ├── export/                     # EXPORT & PAYMENT FEATURE
│   │   │   ├── engine/                 # Export Logic
│   │   │   │   ├── export.ts                  # PDF/DOCX generation
│   │   │   │   ├── payments.ts                # Stripe integration
│   │   │   │   ├── pricing.ts                 # Price calculations
│   │   │   │   ├── addons.ts                  # Add-on products
│   │   │   │   └── email.ts                   # Email notifications
│   │   │   ├── components/             # Export Components
│   │   │   │   ├── pricing/            # Pricing subfolder
│   │   │   │   │   ├── RequirementsDisplay.tsx
│   │   │   │   │   ├── DocumentModal.tsx
│   │   │   │   │   ├── DocumentSpecModal.tsx
│   │   │   │   │   ├── FilterTabContent.tsx
│   │   │   │   │   ├── FilterTabs.tsx
│   │   │   │   │   ├── ProofSection.tsx
│   │   │   │   │   └── AddonsSection.tsx
│   │   │   │   ├── CartSummary.tsx            # Shopping cart
│   │   │   │   └── AddOnChips.tsx             # Add-on selector
│   │   │   └── renderer/               # Document Renderer
│   │   │       └── renderer.tsx              # PDF rendering logic
│   │   │
│   │   └── library/                    # PROGRAM LIBRARY FEATURE
│   │       ├── extractor/              # Library Logic
│   │       │   └── libraryExtractor.ts        # Program data extraction
│   │       └── components/             # Library Components
│   │           └── ProgramDetails.tsx          # Program detail view
│   │
│   └── shared/                         # SHARED CODE (Used by Multiple Features)
│       ├── components/                 # Shared Components
│       │   ├── ui/                    # Base UI Components (Used Everywhere)
│       │   │   ├── button.tsx                 # Button component
│       │   │   ├── input.tsx                  # Input field
│       │   │   ├── dialog.tsx                 # Modal dialog
│       │   │   ├── card.tsx                   # Card container
│       │   │   ├── badge.tsx                  # Badge/label
│       │   │   ├── label.tsx                  # Form label
│       │   │   ├── textarea.tsx               # Text area
│       │   │   ├── progress.tsx               # Progress bar
│       │   │   └── switch.tsx                 # Toggle switch
│       │   │
│       │   ├── layout/                # Layout Components (All Pages)
│       │   │   ├── Header.tsx                 # Site header
│       │   │   ├── Footer.tsx                 # Site footer
│       │   │   ├── AppShell.tsx               # Main layout wrapper
│       │   │   ├── Breadcrumbs.tsx            # Navigation breadcrumbs
│       │   │   ├── SiteBreadcrumbs.tsx        # Site-wide breadcrumbs
│       │   │   ├── InPageBreadcrumbs.tsx       # Page-specific breadcrumbs
│       │   │   └── LanguageSwitcher.tsx        # Language selector
│       │   │
│       │   ├── common/                # Common Components (Multiple Pages)
│       │   │   ├── Hero.tsx                   # Hero section
│       │   │   ├── HeroLite.tsx               # Lightweight hero
│       │   │   ├── HowItWorks.tsx             # How it works section
│       │   │   ├── PlanTypes.tsx               # Plan type selector
│       │   │   ├── WhoItsFor.tsx               # Target audience section
│       │   │   ├── WhyAustria.tsx              # Austria-specific content
│       │   │   ├── WhyPlan2Fund.tsx            # Value proposition
│       │   │   ├── CTAStrip.tsx                # Call-to-action banner
│       │   │   ├── InfoDrawer.tsx              # Information drawer
│       │   │   ├── SEOHead.tsx                 # SEO meta tags
│       │   │   ├── Tooltip.tsx                 # Tooltip component
│       │   │   └── HealthFooter.tsx             # Health status footer
│       │   │
│       │   ├── results/               # Results Components
│       │   │   └── StructuredRequirementsDisplay.tsx
│       │   │
│       │   ├── success/               # Success Components
│       │   │   └── SuccessHub.tsx              # Success page
│       │   │
│       │   └── gdpr/                  # GDPR Components
│       │       └── ConsentBanner.tsx           # Cookie consent
│       │
│       ├── lib/                       # Shared Libraries
│       │   ├── analytics.ts                  # Analytics tracking
│       │   ├── utils.ts                      # Utility functions
│       │   ├── seo.ts                        # SEO helpers
│       │   ├── featureFlags.ts               # Feature flags
│       │   ├── planStore.ts                  # Plan storage
│       │   ├── readiness.ts                  # Readiness checks
│       │   ├── questionEngine.ts             # Question logic (legacy)
│       │   ├── schemas/                      # Data Schemas
│       │   │   ├── userProfile.ts            # User profile schema
│       │   │   └── index.ts                   # Schema exports
│       │   └── templates/                   # Shared Templates
│       │       ├── standardSectionTemplates.ts
│       │       └── chapters.ts
│       │
│       ├── types/                     # Shared TypeScript Types
│       │   ├── requirements.ts               # Program requirements types
│       │   ├── plan.ts                       # Plan document types
│       │   └── readiness.ts                  # Readiness types
│       │
│       ├── contexts/                   # React Contexts (State Management)
│       │   ├── I18nContext.tsx                # Internationalization
│       │   └── UserContext.tsx                # User state
│       │
│       ├── data/                       # Static Data Files
│       │   ├── basisPack.ts                  # Base document packages
│       │   ├── documentBundles.ts             # Document bundles
│       │   ├── documentDescriptions.ts        # Document descriptions
│       │   ├── pricingData.ts                 # Pricing data
│       │   ├── industryVariations.ts          # Industry variations
│       │   └── officialTemplates.ts          # Official templates
│       │
│       └── i18n/                       # Internationalization
│           └── settings.ts                   # i18n configuration
│
├── 🔍 SCRAPER APPLICATION (Backend Data Collection)
│   └── scraper-lite/                   # Scraper Module (39 files)
│       ├── src/                        # Scraper Source Code (8 files)
│       │   ├── extract.ts              # Metadata & requirements extraction
│       │   ├── scraper.ts              # Main scraping logic
│       │   ├── config.ts               # Configuration loader
│       │   ├── utils.ts                # Utility functions
│       │   └── db/                     # Database Layer (5 files)
│       │       ├── neon-client.ts       # Database connection (NEON PostgreSQL)
│       │       ├── page-repository.ts  # Page data operations
│       │       ├── job-repository.ts   # Job queue operations
│       │       ├── neon-schema.sql     # Database schema
│       │       └── README.md           # Database setup guide
│       │
│       ├── scripts/                    # Scraper Scripts (22 files)
│       │   ├── auto-cycle.js           # Automated scraping cycles
│       │   ├── migrate-to-neon.js      # JSON → Database migration
│       │   ├── test-neon-connection.js # Database connection test
│       │   ├── evaluate-unseen-urls.js # URL quality evaluation
│       │   ├── learn-patterns-from-scraped.js # Pattern learning
│       │   ├── monitor-improvements.js  # Quality monitoring
│       │   ├── comprehensive-quality-analysis.js
│       │   └── ... (15 more utility scripts)
│       │
│       ├── docs/                       # Scraper Documentation (4 files)
│       │   ├── DATABASE_INTEGRATION.md # Database setup guide
│       │   ├── QUALITY_ANALYSIS_RESULTS.md
│       │   ├── QUALITY_IMPROVEMENTS.md
│       │   └── CATEGORY_IMPROVEMENTS.md
│       │
│       ├── data/                       # Scraper Data Storage
│       │   └── lite/                   # Scraped data
│       │       ├── raw/                # Raw HTML files (1658 files)
│       │       ├── state.json          # Scraping state
│       │       └── ... (6 more JSON files)
│       │
│       ├── run-lite.js                 # Main scraper entry point
│       ├── README.md                   # Scraper documentation
│       ├── README-AUTO.md              # Auto-cycle documentation
│       ├── ENV_SETUP.md                # Environment setup
│       └── CLEANUP_PLAN.md             # Cleanup recommendations
│
├── 💾 DATABASE LAYER (PostgreSQL/NEON)
│   └── database/                      # Database Module (To Be Created)
│       ├── client/                    # Database Connection
│       │   └── neon-client.ts         # Shared from scraper-lite/src/db/
│       ├── repositories/              # Data Access Layer
│       │   ├── page-repository.ts      # Page operations (shared)
│       │   └── job-repository.ts      # Job operations (shared)
│       └── schema.sql                 # Database schema (shared)
│
├── 🗄️ CONFIGURATION & SETUP
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript config
│   ├── next.config.js                 # Next.js config
│   ├── tailwind.config.js             # Tailwind CSS config
│   ├── .env.local                     # Environment variables (DATABASE_URL)
│   └── .gitignore                     # Git ignore rules
│
├── 📚 DOCUMENTATION
│   ├── docs/                          # General Documentation
│   │   ├── ARCHITECTURE_EXPLANATION.md
│   │   ├── COLLEAGUE_ONBOARDING.md
│   │   └── ...
│   ├── STRUCTURE.md                   # Old structure doc
│   ├── REPOSITORY_STRUCTURE.md        # This file
│   └── MIGRATION_PLAN_V2.md           # Migration strategy
│
├── 🗑️ LEGACY (Reference Only)
│   └── legacy/                        # Old code (don't use)
│       ├── institutionConfig.ts       # Institution config (STILL USED by scraper)
│       ├── webScraperService.ts       # Old scraper (replaced)
│       └── README.md                  # Legacy notes
│
└── 📝 ROOT FILES
    ├── README.md                      # Main project readme
    ├── i18n/                          # Translation files
    │   ├── de.json                    # German translations
    │   └── en.json                    # English translations
    └── public/                         # Static assets
        ├── robots.txt
        └── sitemap.xml
```

---

## 🔗 How Features Connect

### Feature Dependencies

**Recommendation Feature:**
- Uses: `shared/lib/analytics`, `shared/components/ui/*`, `shared/contexts/I18nContext`
- Provides: Program matching, wizard UI
- Database: Reads from `database/repositories/page-repository.ts`

**Editor Feature:**
- Uses: `shared/lib/analytics`, `shared/components/ui/*`, `shared/components/layout/*`
- Uses: `features/reco/engine/enhancedRecoEngine` (for program matching)
- Provides: Document editing, AI assistance
- Database: Reads/writes via repositories

**Intake Feature:**
- Uses: `shared/components/ui/*`, `shared/lib/analytics`
- Provides: User onboarding, target group detection
- Database: Writes user profiles

**Export Feature:**
- Uses: `features/editor/engine/EditorEngine` (to get plan data)
- Uses: `shared/lib/analytics` (to track payments)
- Provides: PDF/DOCX export, payment processing
- Database: Updates plan status after payment

**Library Feature:**
- Uses: `shared/components/ui/*`
- Provides: Program browsing
- Database: Reads from `database/repositories/page-repository.ts`

---

## 📊 Database Integration

### Current Status: ✅ Integrated

**Database:** NEON PostgreSQL (Serverless)

**Files Involved:**
- `scraper-lite/src/db/neon-client.ts` - Connection pool
- `scraper-lite/src/db/page-repository.ts` - Page CRUD operations
- `scraper-lite/src/db/job-repository.ts` - Job queue operations
- `scraper-lite/src/db/neon-schema.sql` - Database schema

**How It Works:**
1. **Scraper** writes to database via `page-repository.ts`
2. **API** (`pages/api/programs.ts`) reads from database
3. **Web App** fetches data via API endpoint

**Migration Path:**
- Existing JSON data → Database via `scraper-lite/scripts/migrate-to-neon.js`
- Both systems work in parallel during transition
- Eventually JSON becomes backup only

---

## 🚨 Migration Rules (NO IMPORT ERRORS)

### ✅ Safe to Move

**Feature Logic:**
- `src/lib/enhancedRecoEngine.ts` → `features/reco/engine/`
- `src/lib/intakeEngine.ts` → `features/intake/engine/`
- `src/lib/export.ts` → `features/export/engine/`
- `src/lib/payments.ts` → `features/export/engine/`
- `src/lib/pricing.ts` → `features/export/engine/`

**Feature Components:**
- `src/components/editor/*` → `features/editor/components/`
- `src/components/reco/*` → `features/reco/components/`
- `src/components/wizard/*` → `features/reco/components/wizard/`
- `src/components/pricing/*` → `features/export/components/pricing/`

**Shared Components:**
- `src/components/ui/*` → `shared/components/ui/`
- `src/components/layout/*` → `shared/components/layout/`
- `src/components/common/*` → `shared/components/common/`

### ❌ NEVER Move

**Next.js Required:**
- `pages/*.tsx` - Next.js requires pages here
- `pages/api/*.ts` - API routes must stay in `pages/api/`

**Note:** API logic can move to `features/*/api/`, but routes in `pages/api/` must import from there.

---

## 🔄 Import Path Updates (After Migration)

### Old → New Import Examples

```typescript
// OLD
import { EnhancedRecoEngine } from '@/lib/enhancedRecoEngine';
import { Button } from '@/components/ui/button';
import { EditorEngine } from '@/lib/editor/EditorEngine';

// NEW
import { EnhancedRecoEngine } from '@/features/reco/engine/enhancedRecoEngine';
import { Button } from '@/shared/components/ui/button';
import { EditorEngine } from '@/features/editor/engine/EditorEngine';
```

### Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@/*": ["./src/*"],           // OLD (to be removed)
    "@/features/*": ["./features/*"],
    "@/shared/*": ["./shared/*"],
    "@/database/*": ["./database/*"],
    "@/scraper/*": ["./scraper-lite/src/*"]
  }
}
```

---

## 📈 File Count Summary

| Category | Count | Location |
|----------|-------|----------|
| **Web App Features** | ~110 files | `features/`, `shared/`, `pages/` |
| **Scraper Application** | 39 files | `scraper-lite/` |
| **Database Layer** | 5 files | `scraper-lite/src/db/` |
| **Scripts** | 22 files | `scraper-lite/scripts/` |
| **Documentation** | 15+ files | `docs/`, `*.md` |
| **Configuration** | 10+ files | Root, config files |
| **Total** | **~200 files** | Repository-wide |

---

## 🎯 For Non-Technical Team Members

### What Each Folder Does

**`features/`** - Each folder is a complete feature (like a mini-app):
- `reco/` = Recommendation feature
- `editor/` = Business plan editor
- `intake/` = User onboarding
- `export/` = Payment & document export
- `library/` = Program browsing

**`shared/`** - Code used by multiple features:
- `components/ui/` = Buttons, inputs, dialogs (used everywhere)
- `components/layout/` = Header, footer (on every page)
- `lib/` = Utility functions (analytics, etc.)

**`pages/`** - Website pages (cannot be moved - Next.js requirement)

**`scraper-lite/`** - Backend system that collects program data:
- Scrapes websites
- Extracts funding information
- Saves to database

**`database/`** - Database connection files (to be consolidated)

---

## ✅ Next Steps for Migration

1. ✅ **Analysis Complete** - File mapping created
2. 🔄 **Fix Import Paths** - Update `tsconfig.json` paths
3. 🔄 **Move Files** - Follow migration plan
4. 🔄 **Update Imports** - Automated script for import updates
5. 🔄 **Test** - Verify no import errors
6. 🔄 **Consolidate Database** - Move `scraper-lite/src/db/` → `database/`

---

**Questions?** See `MIGRATION_PLAN_V2.md` for detailed migration strategy.

