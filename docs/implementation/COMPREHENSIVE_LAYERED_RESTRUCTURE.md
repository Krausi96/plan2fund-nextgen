# 🏗️ COMPREHENSIVE LAYERED RESTRUCTURE PLAN
**Layer-Based Architecture with Complete Function Mapping**

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  User Interfaces, Pages, Components, API Routes           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                    │
│  Core Business Functions, Processing, Templates           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                      │
│  Database, Storage, External APIs, Data Sources           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                   │
│  Configuration, Build Tools, Development, Documentation   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 COMPREHENSIVE LAYERED STRUCTURE

```
plan2fund-nextgen/
├── presentation-layer/                   # LAYER 1: User-facing interfaces
│   ├── web-pages/                       # Next.js pages (25 files)
│   │   ├── public-marketing/           # Public-facing marketing pages
│   │   │   ├── index.tsx               # Landing page
│   │   │   ├── about.tsx               # About us
│   │   │   ├── contact.tsx             # Contact page
│   │   │   ├── faq.tsx                 # FAQ page
│   │   │   ├── legal.tsx               # Legal information
│   │   │   ├── privacy.tsx             # Privacy policy
│   │   │   ├── terms.tsx               # Terms of service
│   │   │   └── for.tsx                 # Target audience page
│   │   ├── product-application/        # Core product pages
│   │   │   ├── editor.tsx              # Business plan editor
│   │   │   ├── library.tsx             # Program library
│   │   │   ├── pricing.tsx             # Pricing & plans
│   │   │   ├── reco.tsx                # Recommendation wizard
│   │   │   ├── results.tsx             # Search results
│   │   │   ├── preview.tsx             # Document preview
│   │   │   └── export.tsx              # Export page
│   │   ├── user-dashboard/             # User-specific pages
│   │   │   ├── dashboard.tsx           # User dashboard
│   │   │   ├── checkout.tsx            # Payment checkout
│   │   │   ├── privacy-settings.tsx    # User settings
│   │   │   └── program/[id].tsx        # Program details
│   │   ├── utility-pages/              # Utility & admin pages
│   │   │   ├── advanced-search.tsx     # Advanced search
│   │   │   ├── confirm.tsx             # Confirmation pages
│   │   │   ├── thank-you.tsx           # Thank you pages
│   │   │   └── optimized-editor.tsx    # Legacy editor (to remove)
│   │   └── _app.tsx                    # Next.js app wrapper
│   │
│   ├── ui-components/                   # React components (123 files)
│   │   ├── business-plan-editor/       # Editor functionality
│   │   │   ├── core-editor/           # Main editor components
│   │   │   │   ├── UnifiedEditor.tsx  # Main orchestrator
│   │   │   │   ├── EditorState.tsx    # State management
│   │   │   │   ├── StructuredEditor.tsx # Structured editing
│   │   │   │   └── SectionEditor.tsx  # Section editing
│   │   │   ├── ai-assistant/          # AI-powered assistance
│   │   │   │   ├── EnhancedAIChat.tsx # AI chat interface
│   │   │   │   └── RequirementsChecker.tsx # Requirements validation
│   │   │   ├── financial-tools/       # Financial data management
│   │   │   │   ├── FinancialTables.tsx # Financial data tables
│   │   │   │   └── Figures.tsx        # Charts and graphs
│   │   │   ├── export-system/         # Document export
│   │   │   │   ├── ExportSettings.tsx # Export configuration
│   │   │   │   └── FormattingExportManager.tsx # Format management
│   │   │   ├── collaboration/         # Team collaboration
│   │   │   │   ├── CollaborationManager.tsx # Collaboration tools
│   │   │   │   ├── TeamManager.tsx    # Team management
│   │   │   │   └── VersionControl.tsx # Version control
│   │   │   ├── template-system/       # Template management
│   │   │   │   ├── TemplatesFormattingManager.tsx # Template formatting
│   │   │   │   └── ProgramTemplateEditor.tsx # Program templates
│   │   │   ├── text-editing/          # Text editing tools
│   │   │   │   ├── RichTextEditor.tsx # Rich text editor
│   │   │   │   └── FormHelpModal.tsx  # Help modal
│   │   │   └── navigation/            # Editor navigation
│   │   │       ├── EnhancedNavigation.tsx # Navigation component
│   │   │       ├── EntryPointsManager.tsx # Entry point management
│   │   │       ├── RouteExtrasPanel.tsx # Route extras
│   │   │       └── Phase4Integration.tsx # Phase 4 integration
│   │   │
│   │   ├── recommendation-system/      # Recommendation functionality
│   │   │   ├── decision-wizard/       # Decision tree wizard
│   │   │   │   ├── DynamicWizard.tsx  # Dynamic wizard
│   │   │   │   ├── Wizard.tsx         # Basic wizard
│   │   │   │   ├── EnhancedWizard.tsx # Enhanced wizard
│   │   │   │   └── UnifiedRecommendationWizard.tsx # Unified wizard
│   │   │   ├── search-interface/      # Search functionality
│   │   │   │   ├── SmartRecommendationFlow.tsx # Smart search flow
│   │   │   │   └── ExplorationModal.tsx # Exploration modal
│   │   │   ├── results-display/       # Results presentation
│   │   │   │   ├── StructuredRequirementsDisplay.tsx # Requirements display
│   │   │   │   └── ProgramDetailsModal.tsx # Program details modal
│   │   │   └── program-details/       # Program information
│   │   │       └── ProgramDetails.tsx # Program details component
│   │   │
│   │   ├── pricing-checkout/          # Pricing & payment system
│   │   │   ├── pricing-display/       # Pricing presentation
│   │   │   │   ├── PricingDetails.tsx # Pricing details
│   │   │   │   ├── AddonsSection.tsx  # Add-ons section
│   │   │   │   ├── RequirementsDisplay.tsx # Requirements display
│   │   │   │   ├── RequirementsMatrix.tsx # Requirements matrix
│   │   │   │   ├── FilterTabs.tsx     # Filter tabs
│   │   │   │   ├── FilterTabContent.tsx # Filter content
│   │   │   │   ├── HowItWorksSection.tsx # How it works
│   │   │   │   ├── ProofSection.tsx   # Proof section
│   │   │   │   ├── DocumentModal.tsx  # Document modal
│   │   │   │   └── DocumentSpecModal.tsx # Document spec modal
│   │   │   └── checkout-flow/         # Checkout process
│   │   │       └── CartSummary.tsx    # Cart summary
│   │   │
│   │   ├── shared-ui/                 # Shared UI components
│   │   │   ├── layout-components/     # Layout & navigation
│   │   │   │   ├── AppShell.tsx       # App shell
│   │   │   │   ├── Header.tsx         # Site header
│   │   │   │   ├── Footer.tsx         # Site footer
│   │   │   │   ├── Breadcrumbs.tsx    # Breadcrumb navigation
│   │   │   │   ├── InPageBreadcrumbs.tsx # In-page breadcrumbs
│   │   │   │   ├── SiteBreadcrumbs.tsx # Site breadcrumbs
│   │   │   │   └── LanguageSwitcher.tsx # Language switcher
│   │   │   ├── ui-primitives/         # Basic UI components
│   │   │   │   ├── button.tsx         # Button component
│   │   │   │   ├── input.tsx          # Input component
│   │   │   │   ├── textarea.tsx       # Textarea component
│   │   │   │   ├── card.tsx           # Card component
│   │   │   │   ├── dialog.tsx         # Dialog component
│   │   │   │   ├── badge.tsx          # Badge component
│   │   │   │   ├── label.tsx          # Label component
│   │   │   │   ├── progress.tsx       # Progress component
│   │   │   │   └── switch.tsx         # Switch component
│   │   │   ├── business-components/   # Business-specific components
│   │   │   │   ├── hero-sections/     # Hero sections
│   │   │   │   │   ├── Hero.tsx       # Main hero
│   │   │   │   │   └── HeroLite.tsx   # Light hero
│   │   │   │   ├── content-sections/  # Content sections
│   │   │   │   │   ├── HowItWorks.tsx # How it works
│   │   │   │   │   ├── WhoItsFor.tsx  # Target audience
│   │   │   │   │   ├── WhyPlan2Fund.tsx # Why choose us
│   │   │   │   │   └── WhyAustria.tsx # Why Austria
│   │   │   │   ├── feature-displays/  # Feature displays
│   │   │   │   │   ├── TargetGroupBanner.tsx # Target group banner
│   │   │   │   │   ├── FundingTypes.tsx # Funding types
│   │   │   │   │   ├── PlanTypes.tsx  # Plan types
│   │   │   │   │   └── Included.tsx   # What's included
│   │   │   │   ├── interactive-elements/ # Interactive elements
│   │   │   │   │   ├── EligibilityCard.tsx # Eligibility card
│   │   │   │   │   ├── EvidenceCards.tsx # Evidence cards
│   │   │   │   │   ├── CTAStrip.tsx   # Call-to-action strip
│   │   │   │   │   ├── Counter.tsx    # Counter component
│   │   │   │   │   ├── Tooltip.tsx    # Tooltip component
│   │   │   │   │   └── InfoDrawer.tsx # Info drawer
│   │   │   │   └── utility-components/ # Utility components
│   │   │   │       ├── DocsUpload.tsx # Document upload
│   │   │   │       ├── HealthFooter.tsx # Health footer
│   │   │   │       └── SEOHead.tsx    # SEO head
│   │   │   └── specialized-components/ # Specialized components
│   │   │       ├── intake-forms/      # Intake forms
│   │   │       │   ├── IntakeForm.tsx # Main intake form
│   │   │       │   ├── OffTopicGate.tsx # Off-topic gate
│   │   │       │   └── OverlayQuestions.tsx # Overlay questions
│   │   │       ├── plan-components/   # Plan-related components
│   │   │       │   ├── PlanIntake.tsx # Plan intake
│   │   │       │   ├── TableOfContents.tsx # Table of contents
│   │   │       │   ├── TitlePage.tsx  # Title page
│   │   │       │   ├── ChartWidget.tsx # Chart widget
│   │   │       │   ├── FinancialsQuickSheet.tsx # Financials sheet
│   │   │       │   └── StyleTokens.tsx # Style tokens
│   │   │       ├── addons/            # Add-ons
│   │   │       │   └── AddOnChips.tsx # Add-on chips
│   │   │       ├── fallback/          # Fallback components
│   │   │       │   └── ZeroMatchFallback.tsx # Zero match fallback
│   │   │       ├── gdpr/              # GDPR components
│   │   │       │   └── ConsentBanner.tsx # Consent banner
│   │   │       ├── onboarding/       # Onboarding
│   │   │       │   └── SegmentedOnboarding.tsx # Segmented onboarding
│   │   │       └── success/           # Success components
│   │   │           └── SuccessHub.tsx # Success hub
│   │   │
│   │   └── admin-interface/           # Admin interface (empty - to be populated)
│   │
│   └── api-endpoints/                 # API endpoints (20 files)
│       ├── data-management/           # Data management APIs
│       │   ├── programs.ts            # Programs API
│       │   ├── programs-ai.ts         # AI programs API
│       │   ├── data/programs.ts       # Data programs API
│       │   ├── data/questions.ts      # Questions API
│       │   └── programmes/[id]/requirements.ts # Program requirements
│       ├── data-collection/           # Data collection APIs
│       │   ├── scraper/run.ts         # Scraper run API
│       │   ├── scraper/status.ts      # Scraper status API
│       │   └── cron/scraper.ts        # Cron scraper API
│       ├── ai-services/               # AI service APIs
│       │   ├── ai/generate.ts         # AI generation API
│       │   ├── ai/openai.ts           # OpenAI API
│       │   ├── ai-assistant.ts        # AI assistant API
│       │   ├── ai-assistant-simple.ts # Simple AI assistant API
│       │   └── intelligent-readiness.ts # Intelligent readiness API
│       ├── recommendation/            # Recommendation APIs
│       │   ├── recommend.ts           # Recommendation API
│       │   ├── decision-tree.ts       # Decision tree API
│       │   └── requirements.ts        # Requirements API
│       ├── payments/                  # Payment APIs
│       │   ├── payments/create-session.ts # Create payment session
│       │   ├── payments/success.ts    # Payment success
│       │   └── stripe/webhook.ts      # Stripe webhook
│       ├── user-management/           # User management APIs
│       │   ├── user/profile.ts        # User profile API
│       │   ├── gdpr/delete-data.ts    # GDPR delete data API
│       │   └── plan/save.ts           # Plan save API
│       ├── templates/                 # Template APIs
│       │   ├── program-templates.ts   # Program templates API
│       │   └── intake/parse.ts        # Intake parse API
│       ├── intake/plan.ts             # Intake plan API
│       ├── analytics/track.ts         # Analytics tracking API
│       ├── feature-flags.ts           # Feature flags API
│       ├── health.ts                  # Health check API
│       ├── test-db.ts                 # Test database API
│       └── test-simple.ts             # Simple test API
│
├── business-logic-layer/              # LAYER 2: Core business functions
│   ├── data-collection/               # Data collection & scraping
│   │   ├── web-scrapers/              # Web scraping services
│   │   │   ├── webScraperService.ts   # Main web scraper
│   │   │   └── enhancedDataPipeline.ts # Enhanced data pipeline
│   │   ├── data-parsers/              # Data parsing & extraction
│   │   │   ├── intakeParser.ts        # Intake data parser
│   │   │   ├── decisionTreeParser.ts  # Decision tree parser
│   │   │   └── requirementsExtractor.ts # Requirements extractor
│   │   ├── data-sources/              # Data source management
│   │   │   ├── dataSource.ts          # Data source manager
│   │   │   └── libraryExtractor.ts    # Library data extractor
│   │   └── pattern-learning/          # Pattern learning & adaptation
│   │       └── dynamicPatternEngine.ts # Dynamic pattern learning
│   │
│   ├── data-processing/               # Data processing & analysis
│   │   ├── categorization/            # Data categorization
│   │   │   └── categoryConverters.ts  # Category conversion logic
│   │   ├── recommendation-engine/     # Recommendation system
│   │   │   ├── enhancedRecoEngine.ts  # Enhanced recommendation engine
│   │   │   ├── dynamicDecisionTree.ts # Dynamic decision tree
│   │   │   └── dynamicQuestionEngine.ts # Dynamic question engine
│   │   ├── validation/                # Data validation
│   │   │   ├── validationRules.ts     # Validation rules
│   │   │   └── conditionalLogic.ts    # Conditional logic
│   │   └── analysis/                  # Data analysis
│   │       ├── advancedSearchDoctor.ts # Advanced search analysis
│   │       └── doctorDiagnostic.ts    # Diagnostic analysis
│   │
│   ├── template-system/               # Template & content management
│   │   ├── section-templates/         # Section templates
│   │   │   ├── standardSectionTemplates.ts # Standard sections
│   │   │   └── productSectionTemplates.ts # Product-specific sections
│   │   ├── document-templates/        # Document templates
│   │   │   ├── additionalDocuments.ts # Additional documents
│   │   │   └── documentBundles.ts     # Document bundles
│   │   ├── industry-variations/       # Industry-specific variations
│   │   │   └── industryVariations.ts  # Industry variations
│   │   ├── program-templates/         # Program-specific templates
│   │   │   ├── programTemplates.ts    # Program templates
│   │   │   └── chapters.ts            # Chapter templates
│   │   └── template-management/       # Template management
│   │       ├── editorTemplates.ts     # Editor templates
│   │       └── loader.ts              # Template loader
│   │
│   ├── financial-calculations/        # Financial calculations & pricing
│   │   ├── financialCalculator.ts     # Financial calculator
│   │   ├── pricing.ts                 # Pricing logic
│   │   └── payments.ts                # Payment processing
│   │
│   ├── ai-services/                   # AI & machine learning services
│   │   ├── aiHelper.ts                # AI helper functions
│   │   ├── aiHelperGuardrails.ts      # AI guardrails
│   │   └── aiChipParser.ts            # AI chip parser
│   │
│   └── business-utilities/            # Business utility functions
│       ├── requirementsMapper.ts      # Requirements mapping
│       ├── routeExtras.ts             # Route extras
│       ├── submissionPack.ts          # Submission pack
│       ├── targetGroupDetection.ts    # Target group detection
│       ├── teamManagement.ts          # Team management
│       ├── multiUserDataManager.ts    # Multi-user data management
│       ├── prefill.ts                 # Prefill logic
│       ├── sourceRegister.ts          # Source register
│       └── translationValidator.ts    # Translation validator
│
├── data-access-layer/                 # LAYER 3: Data management & storage
│   ├── database/                      # Database management
│   │   ├── database.ts                # Database connection
│   │   ├── migrations/                # Database migrations
│   │   │   ├── setup-database.sql     # Database setup
│   │   │   ├── migrate-database.sql   # Database migration
│   │   │   ├── migrate-enhanced-requirements.sql # Enhanced requirements migration
│   │   │   ├── fix-json-data.sql      # JSON data fix
│   │   │   ├── migrate.js             # Migration script
│   │   │   └── add-categorized-requirements.js # Add categorized requirements
│   │   └── schemas/                   # Database schemas
│   │       ├── index.ts               # Schema index
│   │       ├── fundingProfile.ts      # Funding profile schema
│   │       └── userProfile.ts         # User profile schema
│   ├── storage/                       # Data storage
│   │   ├── planStore.ts               # Plan storage
│   │   └── multiUserDataManager.ts    # Multi-user data management
│   ├── static-data/                   # Static data files
│   │   ├── data/fallback-programs.json # Fallback programs data
│   │   ├── data/migrated-programs.json # Migrated programs data
│   │   ├── pricingData.ts             # Pricing data
│   │   ├── questions.ts               # Questions data
│   │   ├── documentBundles.ts         # Document bundles data
│   │   ├── documentDescriptions.ts    # Document descriptions data
│   │   └── officialTemplates.ts       # Official templates data
│   └── external-apis/                 # External API integrations
│       ├── airtable.ts                # Airtable integration
│       └── export.ts                  # Export functionality
│
├── system-core/                       # LAYER 4: Core system functionality
│   ├── state-management/              # State management
│   │   ├── contexts/                  # React contexts
│   │   │   ├── I18nContext.tsx        # Internationalization context
│   │   │   ├── RecommendationContext.tsx # Recommendation context
│   │   │   └── UserContext.tsx        # User context
│   │   └── hooks/                     # Custom hooks
│   │       ├── useOptimizedEditorData.ts # Optimized editor data hook
│   │       └── useRealTimeRecommendations.ts # Real-time recommendations hook
│   ├── type-definitions/              # Type definitions
│   │   ├── types.ts                   # Main types
│   │   ├── plan.ts                    # Plan types
│   │   ├── editor.ts                  # Editor types
│   │   ├── reco.ts                    # Recommendation types
│   │   ├── readiness.ts               # Readiness types
│   │   └── requirements.ts            # Requirements types
│   ├── utilities/                     # Utility functions
│   │   ├── utils.ts                   # General utilities
│   │   ├── analytics.ts               # Analytics utilities
│   │   ├── email.ts                   # Email utilities
│   │   ├── seo.ts                     # SEO utilities
│   │   ├── theme.ts                   # Theme utilities
│   │   ├── motion.ts                  # Motion utilities
│   │   ├── featureFlags.ts            # Feature flags
│   │   └── payload.ts                 # Payload utilities
│   ├── integrations/                  # External integrations
│   │   ├── comprehensiveExport.ts     # Comprehensive export
│   │   └── renderer.tsx               # Export renderer
│   └── i18n/                          # Internationalization
│       ├── settings.ts                # i18n settings
│       ├── de.json                    # German translations
│       └── en.json                    # English translations
│
├── infrastructure-layer/              # LAYER 5: Infrastructure & tooling
│   ├── configuration/                 # Configuration files
│   │   ├── package.json               # Package configuration
│   │   ├── package-lock.json          # Package lock file
│   │   ├── tsconfig.json              # TypeScript configuration
│   │   ├── tsconfig.tsbuildinfo       # TypeScript build info
│   │   ├── next.config.js             # Next.js configuration
│   │   ├── next-env.d.ts              # Next.js environment types
│   │   ├── tailwind.config.js         # Tailwind CSS configuration
│   │   ├── postcss.config.js          # PostCSS configuration
│   │   ├── eslint.config.js           # ESLint configuration
│   │   ├── .eslintrc.json             # ESLint configuration (legacy)
│   │   ├── .env.example               # Environment variables example
│   │   └── .env.local                 # Local environment variables
│   ├── build-tools/                   # Build & development tools
│   │   ├── scripts/                   # Build scripts
│   │   │   ├── ci-coverage.mjs        # CI coverage script
│   │   │   ├── generate-source-register.mjs # Source register generation
│   │   │   ├── migrate-to-json.js     # Migration to JSON script
│   │   │   ├── run-tests.mjs          # Test runner script
│   │   │   ├── update-fallback-data.js # Update fallback data script
│   │   │   └── README.md              # Scripts README
│   │   └── analysis-tools/            # Analysis tools
│   │       ├── import_analyzer.py     # Import analyzer
│   │       ├── improved_master_analyzer.py # Improved master analyzer
│   │       ├── master_analyzer.py     # Master analyzer
│   │       ├── system_flow_analyzer.py # System flow analyzer
│   │       └── system_requirements_checker.py # System requirements checker
│   ├── deployment/                    # Deployment configuration
│   │   ├── .vercel/project.json       # Vercel project configuration
│   │   └── .vercel/README.txt         # Vercel README
│   └── documentation/                 # Documentation
│       ├── docs/                      # Documentation files
│       │   ├── README.md              # Main README
│       │   ├── architecture/ARCHITECTURE.md # Architecture documentation
│       │   └── implementation/        # Implementation documentation
│       │       ├── IMPLEMENTATION_PLAN.md # Implementation plan
│       │       ├── GPT_REQUIREMENTS_AGENT_PROMPT.md # GPT requirements prompt
│       │       ├── REPO_CLEANUP_PLAN.md # Repo cleanup plan
│       │       ├── COMPLETE_REPO_RESTRUCTURE_PLAN.md # Complete restructure plan
│       │       └── COMPLETE_FILE_MAPPING_AND_RESTRUCTURE.md # File mapping
│       └── README.md                  # Root README
│
├── assets/                            # LAYER 6: Static assets
│   ├── public/                        # Public assets
│   │   ├── og-image.jpg               # Open Graph image
│   │   ├── og-image.svg               # Open Graph SVG
│   │   ├── robots.txt                 # Robots.txt
│   │   └── sitemap.xml                # Sitemap
│   ├── styles/                        # Stylesheets
│   │   └── globals.css                # Global CSS
│   └── temporary/                     # Temporary files
│       └── tatus                      # Temporary status file
│
└── legacy/                            # Files to be removed/consolidated
    ├── src/editor/ (7 files - to be merged into presentation-layer/ui-components/business-plan-editor/)
    ├── src/lib/editor/ (2 files - to be moved to business-logic-layer/)
    ├── src/lib/examples/ (1 file - to be moved to business-logic-layer/)
    ├── src/lib/templates/ (5 files - to be moved to business-logic-layer/template-system/)
    ├── src/lib/validation/ (2 files - to be moved to business-logic-layer/data-processing/validation/)
    ├── src/lib/types/ (empty - to be removed)
    └── src/reco/ (1 file - to be moved to business-logic-layer/recommendation-engine/)
```

---

## 📊 LAYER BREAKDOWN & RESPONSIBILITIES

### **LAYER 1: PRESENTATION LAYER (168 files)**
**Purpose**: User-facing interfaces and interactions
- **Web Pages (25 files)**: Next.js pages organized by function
- **UI Components (123 files)**: React components organized by business function
- **API Endpoints (20 files)**: REST API endpoints for data access

### **LAYER 2: BUSINESS LOGIC LAYER (47 files)**
**Purpose**: Core business functions and processing
- **Data Collection (6 files)**: Web scraping, parsing, data sources
- **Data Processing (8 files)**: Categorization, recommendation engine, validation
- **Template System (8 files)**: Templates, documents, industry variations
- **Financial Calculations (3 files)**: Financial logic, pricing, payments
- **AI Services (3 files)**: AI helpers, guardrails, parsing
- **Business Utilities (19 files)**: Business-specific utility functions

### **LAYER 3: DATA ACCESS LAYER (15 files)**
**Purpose**: Data management and storage
- **Database (8 files)**: Database connection, migrations, schemas
- **Storage (2 files)**: Data storage and management
- **Static Data (7 files)**: Static data files and configurations
- **External APIs (2 files)**: External service integrations

### **LAYER 4: SYSTEM CORE (25 files)**
**Purpose**: Core system functionality
- **State Management (5 files)**: React contexts and custom hooks
- **Type Definitions (8 files)**: TypeScript type definitions
- **Utilities (7 files)**: General utility functions
- **Integrations (2 files)**: System integrations
- **i18n (3 files)**: Internationalization

### **LAYER 5: INFRASTRUCTURE LAYER (28 files)**
**Purpose**: Infrastructure, tooling, and configuration
- **Configuration (12 files)**: Build and runtime configuration
- **Build Tools (15 files)**: Build scripts and analysis tools
- **Deployment (2 files)**: Deployment configuration
- **Documentation (1 file)**: System documentation

### **LAYER 6: ASSETS (6 files)**
**Purpose**: Static assets and resources
- **Public Assets (4 files)**: Publicly accessible assets
- **Styles (1 file)**: Stylesheets
- **Temporary (1 file)**: Temporary files

---

## 🎯 KEY IMPROVEMENTS

1. **CLEAR LAYER SEPARATION** - Each layer has a specific purpose and responsibility
2. **COMPREHENSIVE MAPPING** - Every single file (283) is mapped to its appropriate layer
3. **FUNCTION-BASED ORGANIZATION** - Components grouped by business function, not technical type
4. **SCALABLE ARCHITECTURE** - Easy to add new functionality within the appropriate layer
5. **NO DUPLICATES** - Eliminates the editor duplication issue
6. **MAINTAINABLE STRUCTURE** - Clear hierarchy makes maintenance easier

---

## 🚀 MIGRATION STRATEGY

### **PHASE 1: Create Layer Structure (30 min)**
- Create all layer directories
- Set up barrel exports for clean imports

### **PHASE 2: Move Business Logic (1.5 hours)**
- Move all lib files to appropriate business-logic-layer folders
- Update imports and references

### **PHASE 3: Move UI Components (2 hours)**
- Move all components to presentation-layer/ui-components
- Consolidate editor files
- Update imports

### **PHASE 4: Move Pages & APIs (1 hour)**
- Organize pages by function
- Move API routes to presentation-layer/api-endpoints
- Update imports

### **PHASE 5: Move Data & Core (1 hour)**
- Move data files to data-access-layer
- Move system core files to system-core
- Update imports

### **PHASE 6: Move Infrastructure (30 min)**
- Move configuration and build tools to infrastructure-layer
- Update imports

### **PHASE 7: Cleanup & Test (1 hour)**
- Remove legacy folders
- Test all functionality
- Fix any remaining imports

**TOTAL TIME: 7-8 hours**

---

## 📋 SUCCESS CRITERIA

- [ ] All 283 files properly mapped to layers
- [ ] Clear separation of concerns
- [ ] No duplicate functionality
- [ ] All imports working correctly
- [ ] System builds without errors
- [ ] All functionality working
- [ ] Easy to navigate and maintain
