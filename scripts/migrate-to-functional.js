#!/usr/bin/env node
/**
 * Migrate to Functional Structure
 * Moves files to new structure and updates imports
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🚀 MIGRATION TO FUNCTIONAL STRUCTURE');
console.log('═══════════════════════════════════════════════════════════\n');

// File mappings: from → to
const migrations = [
  // Reco Feature
  { from: 'src/lib/enhancedRecoEngine.ts', to: 'features/reco/engine/enhancedRecoEngine.ts' },
  { from: 'src/lib/doctorDiagnostic.ts', to: 'features/reco/engine/doctorDiagnostic.ts' },
  { from: 'src/lib/questionEngine.ts', to: 'features/reco/engine/questionEngine.ts' },
  { from: 'src/components/reco/ProgramDetailsModal.tsx', to: 'features/reco/components/ProgramDetailsModal.tsx' },
  { from: 'pages/api/recommend.ts', to: 'features/reco/api/recommend.ts' },
  
  // Editor Feature
  { from: 'src/lib/editor/EditorEngine.ts', to: 'features/editor/engine/EditorEngine.ts' },
  { from: 'src/lib/editor/EditorDataProvider.ts', to: 'features/editor/engine/EditorDataProvider.ts' },
  { from: 'src/lib/editor/EditorNormalization.ts', to: 'features/editor/engine/EditorNormalization.ts' },
  { from: 'src/lib/editor/EditorValidation.ts', to: 'features/editor/engine/EditorValidation.ts' },
  { from: 'src/components/editor/UnifiedEditor.tsx', to: 'features/editor/components/UnifiedEditor.tsx' },
  { from: 'src/components/editor/RichTextEditor.tsx', to: 'features/editor/components/RichTextEditor.tsx' },
  { from: 'src/components/editor/DocumentCustomizationPanel.tsx', to: 'features/editor/components/DocumentCustomizationPanel.tsx' },
  { from: 'src/components/editor/EnhancedAIChat.tsx', to: 'features/editor/components/EnhancedAIChat.tsx' },
  { from: 'src/components/editor/EntryPointsManager.tsx', to: 'features/editor/components/EntryPointsManager.tsx' },
  { from: 'src/components/editor/ExportSettings.tsx', to: 'features/editor/components/ExportSettings.tsx' },
  { from: 'src/components/editor/Phase4Integration.tsx', to: 'features/editor/components/Phase4Integration.tsx' },
  { from: 'src/components/editor/ProgramSelector.tsx', to: 'features/editor/components/ProgramSelector.tsx' },
  { from: 'src/components/editor/RequirementsChecker.tsx', to: 'features/editor/components/RequirementsChecker.tsx' },
  { from: 'src/lib/templates/productSectionTemplates.ts', to: 'features/editor/templates/productSectionTemplates.ts' },
  { from: 'src/lib/templates/chapters.ts', to: 'features/editor/templates/chapters.ts' },
  { from: 'src/lib/templates/additionalDocuments.ts', to: 'features/editor/templates/additionalDocuments.ts' },
  
  // Intake Feature
  { from: 'src/lib/intakeEngine.ts', to: 'features/intake/engine/intakeEngine.ts' },
  { from: 'pages/api/intake/parse.ts', to: 'features/intake/api/parse.ts' },
  { from: 'pages/api/intake/plan.ts', to: 'features/intake/api/plan.ts' },
  
  // Library Feature
  { from: 'src/components/library/ProgramDetails.tsx', to: 'features/library/components/ProgramDetails.tsx' },
  { from: 'src/lib/libraryExtractor.ts', to: 'features/library/extractor/libraryExtractor.ts' },
  
  // Shared Components - UI
  { from: 'src/components/ui/button.tsx', to: 'shared/components/ui/button.tsx' },
  { from: 'src/components/ui/dialog.tsx', to: 'shared/components/ui/dialog.tsx' },
  { from: 'src/components/ui/input.tsx', to: 'shared/components/ui/input.tsx' },
  { from: 'src/components/ui/label.tsx', to: 'shared/components/ui/label.tsx' },
  { from: 'src/components/ui/textarea.tsx', to: 'shared/components/ui/textarea.tsx' },
  { from: 'src/components/ui/badge.tsx', to: 'shared/components/ui/badge.tsx' },
  { from: 'src/components/ui/card.tsx', to: 'shared/components/ui/card.tsx' },
  { from: 'src/components/ui/progress.tsx', to: 'shared/components/ui/progress.tsx' },
  { from: 'src/components/ui/switch.tsx', to: 'shared/components/ui/switch.tsx' },
  
  // Shared Components - Layout
  { from: 'src/components/layout/Header.tsx', to: 'shared/components/layout/Header.tsx' },
  { from: 'src/components/layout/Footer.tsx', to: 'shared/components/layout/Footer.tsx' },
  { from: 'src/components/layout/AppShell.tsx', to: 'shared/components/layout/AppShell.tsx' },
  { from: 'src/components/layout/Breadcrumbs.tsx', to: 'shared/components/layout/Breadcrumbs.tsx' },
  { from: 'src/components/layout/SiteBreadcrumbs.tsx', to: 'shared/components/layout/SiteBreadcrumbs.tsx' },
  { from: 'src/components/layout/InPageBreadcrumbs.tsx', to: 'shared/components/layout/InPageBreadcrumbs.tsx' },
  { from: 'src/components/layout/LanguageSwitcher.tsx', to: 'shared/components/layout/LanguageSwitcher.tsx' },
  
  // Shared Components - Common
  { from: 'src/components/common/Hero.tsx', to: 'shared/components/common/Hero.tsx' },
  { from: 'src/components/common/HowItWorks.tsx', to: 'shared/components/common/HowItWorks.tsx' },
  { from: 'src/components/common/PlanTypes.tsx', to: 'shared/components/common/PlanTypes.tsx' },
  { from: 'src/components/common/WhoItsFor.tsx', to: 'shared/components/common/WhoItsFor.tsx' },
  { from: 'src/components/common/WhyAustria.tsx', to: 'shared/components/common/WhyAustria.tsx' },
  { from: 'src/components/common/WhyPlan2Fund.tsx', to: 'shared/components/common/WhyPlan2Fund.tsx' },
  { from: 'src/components/common/TargetGroupBanner.tsx', to: 'shared/components/common/TargetGroupBanner.tsx' },
  { from: 'src/components/common/CartSummary.tsx', to: 'shared/components/common/CartSummary.tsx' },
  { from: 'src/components/common/CTAStrip.tsx', to: 'shared/components/common/CTAStrip.tsx' },
  { from: 'src/components/common/InfoDrawer.tsx', to: 'shared/components/common/InfoDrawer.tsx' },
  { from: 'src/components/common/SEOHead.tsx', to: 'shared/components/common/SEOHead.tsx' },
  { from: 'src/components/common/Tooltip.tsx', to: 'shared/components/common/Tooltip.tsx' },
  { from: 'src/components/common/HealthFooter.tsx', to: 'shared/components/common/HealthFooter.tsx' },
  
  // Shared Components - Pricing
  { from: 'src/components/pricing/RequirementsDisplay.tsx', to: 'shared/components/pricing/RequirementsDisplay.tsx' },
  { from: 'src/components/pricing/DocumentModal.tsx', to: 'shared/components/pricing/DocumentModal.tsx' },
  { from: 'src/components/pricing/DocumentSpecModal.tsx', to: 'shared/components/pricing/DocumentSpecModal.tsx' },
  { from: 'src/components/pricing/FilterTabContent.tsx', to: 'shared/components/pricing/FilterTabContent.tsx' },
  { from: 'src/components/pricing/FilterTabs.tsx', to: 'shared/components/pricing/FilterTabs.tsx' },
  { from: 'src/components/pricing/ProofSection.tsx', to: 'shared/components/pricing/ProofSection.tsx' },
  { from: 'src/components/pricing/AddonsSection.tsx', to: 'shared/components/pricing/AddonsSection.tsx' },
  
  // Shared Components - Others
  { from: 'src/components/plan/PlanIntake.tsx', to: 'shared/components/plan/PlanIntake.tsx' },
  { from: 'src/components/plan/TableOfContents.tsx', to: 'shared/components/plan/TableOfContents.tsx' },
  { from: 'src/components/plan/TitlePage.tsx', to: 'shared/components/plan/TitlePage.tsx' },
  { from: 'src/components/results/StructuredRequirementsDisplay.tsx', to: 'shared/components/results/StructuredRequirementsDisplay.tsx' },
  { from: 'src/components/success/SuccessHub.tsx', to: 'shared/components/success/SuccessHub.tsx' },
  { from: 'src/components/wizard/SmartWizard.tsx', to: 'shared/components/wizard/SmartWizard.tsx' },
  { from: 'src/components/gdpr/ConsentBanner.tsx', to: 'shared/components/gdpr/ConsentBanner.tsx' },
  { from: 'src/components/addons/AddOnChips.tsx', to: 'shared/components/addons/AddOnChips.tsx' },
  
  // Shared Lib
  { from: 'src/lib/dataSource.ts', to: 'shared/lib/dataSource.ts' },
  { from: 'src/lib/utils.ts', to: 'shared/lib/utils.ts' },
  
  // Shared Types
  { from: 'src/types/requirements.ts', to: 'shared/types/requirements.ts' },
  { from: 'src/types/plan.ts', to: 'shared/types/plan.ts' },
  { from: 'src/types/reco.ts', to: 'shared/types/reco.ts' },
  { from: 'src/types/editor.ts', to: 'shared/types/editor.ts' },
  { from: 'src/types/readiness.ts', to: 'shared/types/readiness.ts' },
  
  // Shared Contexts
  { from: 'src/contexts/RecommendationContext.tsx', to: 'shared/contexts/RecommendationContext.tsx' },
  { from: 'src/contexts/UserContext.tsx', to: 'shared/contexts/UserContext.tsx' },
  { from: 'src/contexts/I18nContext.tsx', to: 'shared/contexts/I18nContext.tsx' },
  
  // Shared Data
  { from: 'src/data/documentBundles.ts', to: 'shared/data/documentBundles.ts' },
  { from: 'src/data/documentDescriptions.ts', to: 'shared/data/documentDescriptions.ts' },
  { from: 'src/data/pricingData.ts', to: 'shared/data/pricingData.ts' },
  { from: 'src/data/basisPack.ts', to: 'shared/data/basisPack.ts' },
  { from: 'src/data/industryVariations.ts', to: 'shared/data/industryVariations.ts' },
  { from: 'src/data/officialTemplates.ts', to: 'shared/data/officialTemplates.ts' },
  
  // Database
  { from: 'scraper-lite/src/db/neon-client.ts', to: 'database/client/neon-client.ts' },
  { from: 'scraper-lite/src/db/page-repository.ts', to: 'database/repositories/page-repository.ts' },
  { from: 'scraper-lite/src/db/job-repository.ts', to: 'database/repositories/job-repository.ts' },
  { from: 'scraper-lite/src/db/neon-schema.sql', to: 'database/schema.sql' },
];

function moveFile(from, to) {
  const fromPath = path.join(process.cwd(), from);
  const toPath = path.join(process.cwd(), to);
  
  if (!fs.existsSync(fromPath)) {
    return { success: false, error: 'Source not found' };
  }
  
  // Create directory if needed
  const toDir = path.dirname(toPath);
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }
  
  // Move file
  fs.copyFileSync(fromPath, toPath);
  return { success: true };
}

console.log('📋 Migration Plan:');
console.log(`   Total files: ${migrations.length}\n`);

// DRY RUN - Show what would be moved
console.log('⚠️  DRY RUN MODE - No files moved yet\n');
migrations.forEach((m, idx) => {
  const fromPath = path.join(process.cwd(), m.from);
  const exists = fs.existsSync(fromPath);
  console.log(`${exists ? '✅' : '❌'} ${idx + 1}. ${m.from}`);
  console.log(`   → ${m.to}`);
});

console.log('\n💡 To execute migration:');
console.log('   1. Review STRUCTURE.md');
console.log('   2. Uncomment file moves in this script');
console.log('   3. Run: node scripts/migrate-to-functional.js\n');

