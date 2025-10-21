# Plan2Fund - Repository Architecture

## 🏗️ **FUNCTION-DRIVEN REPO STRUCTURE**

This document outlines the clean, feature-driven architecture for the Plan2Fund application. The structure is organized by business functions rather than technical layers, making it easy to navigate and maintain.

## 📁 **Directory Structure**

```
src/
├── app/                          # Main application structure
│   ├── landing/                  # Homepage & marketing pages
│   │   ├── components/
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── WhoItsFor.tsx
│   │   │   ├── PlanTypes.tsx
│   │   │   ├── WhyPlan2Fund.tsx
│   │   │   ├── WhyAustria.tsx
│   │   │   └── CTAStrip.tsx
│   │   ├── pages/
│   │   │   ├── index.tsx
│   │   │   ├── about.tsx
│   │   │   ├── contact.tsx
│   │   │   ├── faq.tsx
│   │   │   ├── legal.tsx
│   │   │   ├── privacy.tsx
│   │   │   └── terms.tsx
│   │   └── lib/
│   │       ├── targetGroupDetection.ts
│   │       └── seo.ts
│   │
│   ├── recommendation/           # Recommendation system (includes intake)
│   │   ├── components/
│   │   │   ├── UnifiedRecommendationWizard.tsx
│   │   │   ├── DynamicWizard.tsx
│   │   │   ├── ExplorationModal.tsx
│   │   │   ├── IntakeForm.tsx
│   │   │   ├── OffTopicGate.tsx
│   │   │   └── OverlayQuestions.tsx
│   │   ├── pages/
│   │   │   ├── reco.tsx
│   │   │   ├── advanced-search.tsx
│   │   │   ├── results.tsx
│   │   │   └── for.tsx
│   │   ├── lib/
│   │   │   ├── enhancedRecoEngine.ts
│   │   │   ├── programProfiles.ts
│   │   │   ├── conditionalQuestionEngine.ts
│   │   │   ├── dynamicQuestionEngine.ts
│   │   │   └── intakeParser.ts
│   │   └── api/
│   │       ├── recommend.ts
│   │       ├── intake/parse.ts
│   │       └── intake/plan.ts
│   │
│   ├── editor/                   # Editor system
│   │   ├── components/
│   │   │   ├── UnifiedEditor.tsx
│   │   │   ├── EditorEngine.ts
│   │   │   ├── EditorDataProvider.ts
│   │   │   ├── EditorNormalization.ts
│   │   │   ├── EditorValidation.ts
│   │   │   ├── Figures.tsx
│   │   │   ├── FinancialTables.tsx
│   │   │   └── Phase4Integration.tsx
│   │   ├── pages/
│   │   │   ├── editor.tsx
│   │   │   ├── preview.tsx
│   │   │   └── export.tsx
│   │   ├── lib/
│   │   │   ├── editorTemplates.ts
│   │   │   ├── standardSectionTemplates.ts
│   │   │   ├── productSectionTemplates.ts
│   │   │   ├── additionalDocuments.ts
│   │   │   ├── chapters.ts
│   │   │   └── examples/
│   │   └── api/
│   │       └── plan/save.ts
│   │
│   ├── library/                  # Program library
│   │   ├── components/
│   │   │   ├── ProgramDetails.tsx
│   │   │   └── ZeroMatchFallback.tsx
│   │   ├── pages/
│   │   │   ├── library.tsx
│   │   │   └── program/[id].tsx
│   │   ├── lib/
│   │   │   ├── libraryExtractor.ts
│   │   │   └── targetGroupDetection.ts
│   │   └── api/
│   │       ├── programs.ts
│   │       ├── programs-ai.ts
│   │       └── programmes/[id]/requirements.ts
│   │
│   ├── data-collection/          # All data collection functions
│   │   ├── web-scraping/         # Web scraping system
│   │   │   ├── lib/
│   │   │   │   ├── webScraperService.ts
│   │   │   │   ├── enhancedWebScraperService.ts
│   │   │   │   ├── dynamicPatternEngine.ts
│   │   │   │   ├── sourceRegister.ts
│   │   │   │   └── ScrapedProgram.ts
│   │   │   └── api/
│   │   │       ├── enhanced-scraper-test.ts
│   │   │       └── enhanced-scraper-test-quick.ts
│   │   ├── data-processing/      # Data processing & pipelines
│   │   │   ├── lib/
│   │   │   │   ├── enhancedDataPipeline.ts
│   │   │   │   ├── dataSource.ts
│   │   │   │   └── requirementsExtractor.ts
│   │   │   └── api/
│   │   │       ├── data/programs.ts
│   │   │       ├── data/questions.ts
│   │   │       └── requirements.ts
│   │   └── analytics/            # Analytics & tracking
│   │       ├── lib/
│   │       │   └── analytics.ts
│   │       └── api/
│   │           └── analytics/track.ts
│   │
│   ├── payments/                 # Payment system
│   │   ├── pages/
│   │   │   ├── pricing.tsx
│   │   │   ├── checkout.tsx
│   │   │   ├── confirm.tsx
│   │   │   └── thank-you.tsx
│   │   ├── lib/
│   │   │   ├── payments.ts
│   │   │   └── pricing.ts
│   │   └── api/
│   │       ├── payments/create-session.ts
│   │       ├── payments/success.ts
│   │       └── stripe/webhook.ts
│   │
│   ├── user-management/          # User & dashboard functions
│   │   ├── pages/
│   │   │   ├── dashboard.tsx
│   │   │   └── privacy-settings.tsx
│   │   ├── lib/
│   │   │   ├── multiUserDataManager.ts
│   │   │   └── planStore.ts
│   │   └── api/
│   │       ├── user/profile.ts
│   │       └── gdpr/delete-data.ts
│   │
│   ├── ai/                       # AI system (Phase 3)
│   │   ├── lib/
│   │   │   ├── aiHelper.ts
│   │   │   ├── advancedSearchDoctor.ts
│   │   │   └── doctorDiagnostic.ts
│   │   └── api/
│   │       ├── ai/generate.ts
│   │       ├── ai/openai.ts
│   │       ├── ai-assistant.ts
│   │       ├── ai-assistant-simple.ts
│   │       └── intelligent-readiness.ts
│   │
│   ├── shared/                   # Shared across features
│   │   ├── components/
│   │   │   ├── ui/               # UI components
│   │   │   ├── layout/           # Layout components
│   │   │   ├── addons/           # Addon components
│   │   │   ├── fallback/         # Fallback components
│   │   │   ├── gdpr/             # GDPR components
│   │   │   ├── onboarding/       # Onboarding components
│   │   │   └── plan/             # Plan components
│   │   ├── contexts/
│   │   │   ├── I18nContext.tsx
│   │   │   ├── RecommendationContext.tsx
│   │   │   └── UserContext.tsx
│   │   ├── hooks/
│   │   │   ├── useOptimizedEditorData.ts
│   │   │   └── useRealTimeRecommendations.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── theme.ts
│   │   │   ├── routeExtras.ts
│   │   │   ├── translationValidator.ts
│   │   │   ├── email.ts
│   │   │   ├── database.ts
│   │   │   ├── featureFlags.ts
│   │   │   └── schemas/
│   │   ├── types/
│   │   │   ├── editor.ts
│   │   │   ├── plan.ts
│   │   │   ├── readiness.ts
│   │   │   ├── reco.ts
│   │   │   ├── requirements.ts
│   │   │   └── types.ts
│   │   └── data/
│   │       ├── basisPack.ts
│   │       ├── documentBundles.ts
│   │       ├── documentDescriptions.ts
│   │       ├── industryVariations.ts
│   │       ├── officialTemplates.ts
│   │       ├── pricingData.ts
│   │       └── questions.ts
│   │
│   └── system/                   # System-level functions
│       ├── api/
│       │   ├── health.ts
│       │   ├── feature-flags.ts
│       │   ├── decision-tree.ts
│       │   └── program-templates.ts
│       └── lib/
│           ├── validation/
│           ├── export/
│           └── templates/
```

## 🎯 **Function Mapping**

| Function | Purpose | Key Features |
|----------|---------|--------------|
| **Landing** | Marketing & homepage | Hero, HowItWorks, WhoItsFor, PlanTypes, WhyPlan2Fund, WhyAustria |
| **Recommendation** | Reco wizard + intake + advanced search | UnifiedRecommendationWizard, IntakeForm, DynamicWizard, advanced-search |
| **Editor** | Document creation & editing | UnifiedEditor, EditorEngine, Figures, FinancialTables, Phase4Integration |
| **Library** | Program browsing & details | ProgramDetails, ZeroMatchFallback, program/[id] |
| **Data Collection** | Web scraping + data processing + analytics | WebScraperService, enhancedDataPipeline, analytics tracking |
| **Payments** | Pricing + checkout + billing | Pricing, checkout, confirm, thank-you, Stripe integration |
| **User Management** | Dashboard + user data + privacy | Dashboard, privacy-settings, user profile, GDPR |
| **AI** | AI assistants + intelligent features | AI helpers, advanced search doctor, intelligent readiness |
| **Shared** | Common components & utilities | UI components, contexts, hooks, types, static data |
| **System** | System-level features | Health checks, feature flags, validation, export |

## 🚀 **Key Benefits**

### ✅ **Feature-Driven Organization**
- Each folder represents a complete business function
- Easy to understand what belongs to what feature
- Clear ownership and responsibility

### ✅ **Self-Contained Modules**
- Each feature has its own components, pages, lib, and API
- Minimal dependencies between features
- Easy to test and maintain independently

### ✅ **Scalable Architecture**
- Add new features without affecting existing ones
- Team members can work on different features independently
- Clear boundaries prevent code conflicts

### ✅ **Developer-Friendly**
- Intuitive navigation - find files by purpose, not alphabetically
- Related files grouped together
- Easy to onboard new developers

### ✅ **Maintainable Codebase**
- Clear separation of concerns
- Reduced cognitive load
- Easier to refactor and optimize

## 🔧 **Migration Strategy**

### Phase 1: Create New Structure
1. Create new directory structure
2. Copy files to appropriate feature folders
3. Update imports gradually by feature
4. Test each feature independently

### Phase 2: Update Imports Systematically
1. Start with leaf files (no dependencies)
2. Update imports in batches
3. Test after each batch
4. Remove old files only after all imports updated

### Phase 3: Clean Up
1. Remove old files
2. Update any remaining references
3. Verify everything works
4. Update documentation

## 📋 **Current Status**

- **Structure Defined**: ✅ Complete
- **Migration Started**: ❌ Not started
- **Imports Updated**: ❌ Not started
- **Testing**: ❌ Not started
- **Cleanup**: ❌ Not started

## 🎯 **Next Steps**

1. **Start Migration**: Begin with one feature (e.g., recommendation system)
2. **Update Imports**: Systematically update import paths
3. **Test Features**: Ensure each feature works independently
4. **Complete Migration**: Move all features to new structure
5. **Clean Up**: Remove old files and update references

---

*This architecture provides a clean, maintainable, and scalable foundation for the Plan2Fund application.*
