#!/usr/bin/env node
/**
 * COMPREHENSIVE FILE MAPPING
 * Maps files based on actual imports and dependencies
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractImports(content) {
  const imports = new Set();
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /import\s+['"]([^'"]+)['"]/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.add(match[1]);
    }
  });
  
  return Array.from(imports);
}

// Feature detection based on imports
function detectFeature(content, imports, filePath) {
  const importStr = imports.join(' ');
  const contentLower = content.toLowerCase();
  
  // RECO features
  if (
    importStr.includes('enhancedRecoEngine') ||
    importStr.includes('questionEngine') ||
    importStr.includes('scorePrograms') ||
    filePath.includes('/reco/') ||
    filePath.includes('/wizard/') ||
    content.includes('RecommendationContext')
  ) {
    return 'reco';
  }
  
  // EDITOR features
  if (
    importStr.includes('EditorEngine') ||
    importStr.includes('UnifiedEditor') ||
    importStr.includes('EditorDataProvider') ||
    filePath.includes('/editor/') ||
    content.includes('EditorNormalization') ||
    content.includes('EditorValidation')
  ) {
    return 'editor';
  }
  
  // INTAKE features
  if (
    importStr.includes('IntakeEngine') ||
    importStr.includes('FundingProfile') ||
    importStr.includes('targetGroupDetection') ||
    filePath.includes('/intake/') ||
    filePath.includes('/plan/PlanIntake')
  ) {
    return 'intake';
  }
  
  // EXPORT features (pricing, payments, checkout)
  if (
    importStr.includes('@/lib/pricing') ||
    importStr.includes('@/lib/payments') ||
    importStr.includes('PaymentManager') ||
    importStr.includes('calculatePricing') ||
    importStr.includes('ExportManager') ||
    filePath.includes('/export/') ||
    filePath.includes('/pricing/') ||
    filePath.includes('/checkout') ||
    content.includes('stripe') ||
    content.includes('Stripe')
  ) {
    return 'export';
  }
  
  // LIBRARY features
  if (
    importStr.includes('LibraryExtractor') ||
    filePath.includes('/library/')
  ) {
    return 'library';
  }
  
  return 'shared';
}

function determineLocation(filePath, feature, imports, content) {
  const relativePath = filePath.replace(/\\/g, '/').replace(srcDir.replace(/\\/g, '/') + '/', '');
  
  // UI components (shadcn)
  if (relativePath.includes('components/ui/')) {
    return 'shared/components/ui';
  }
  
  // Feature-specific components
  if (relativePath.includes('components/')) {
    // Already feature-specific by path
    if (relativePath.includes('/reco/')) {
      return 'features/reco/components';
    }
    if (relativePath.includes('/editor/')) {
      return 'features/editor/components';
    }
    if (relativePath.includes('/library/')) {
      return 'features/library/components';
    }
    if (relativePath.includes('/pricing/')) {
      return 'features/export/components/pricing';
    }
    if (relativePath.includes('/wizard/')) {
      return 'features/reco/components/wizard';
    }
    
    // Check by imports
    if (feature === 'reco') {
      return 'features/reco/components';
    }
    if (feature === 'editor') {
      return 'features/editor/components';
    }
    if (feature === 'export') {
      // CartSummary, AddOnChips use pricing
      if (relativePath.includes('/common/CartSummary') || 
          relativePath.includes('/addons/')) {
        return 'features/export/components';
      }
      return 'features/export/components';
    }
    if (feature === 'intake') {
      return 'features/intake/components';
    }
    
    // Truly shared (layout, common that don't use feature engines)
    if (relativePath.includes('/layout/') || 
        relativePath.includes('/common/') ||
        relativePath.includes('/gdpr/')) {
      // But check if they're actually feature-specific
      const hasFeatureImports = imports.some(i => 
        i.includes('enhancedRecoEngine') ||
        i.includes('EditorEngine') ||
        i.includes('IntakeEngine') ||
        i.includes('PaymentManager')
      );
      
      if (!hasFeatureImports) {
        return 'shared/components';
      }
    }
    
    return 'shared/components';
  }
  
  // Lib files
  if (relativePath.includes('lib/')) {
    // Editor lib
    if (relativePath.includes('lib/editor/')) {
      return 'features/editor/engine';
    }
    
    // RECO engines
    if (relativePath.includes('enhancedRecoEngine') ||
        relativePath.includes('questionEngine') ||
        relativePath.includes('payload')) {
      return 'features/reco/engine';
    }
    
    // EDITOR engines
    if (relativePath.includes('aiHelper') ||
        relativePath.includes('categoryConverters') ||
        relativePath.includes('dataSource') ||
        relativePath.includes('doctorDiagnostic')) {
      return 'features/editor/engine';
    }
    
    // INTAKE engines
    if (relativePath.includes('intakeEngine') ||
        relativePath.includes('targetGroupDetection') ||
        relativePath.includes('prefill')) {
      return 'features/intake/engine';
    }
    
    // EXPORT engines (pricing, payments, export)
    if (relativePath.includes('payments') ||
        relativePath.includes('pricing') ||
        relativePath.includes('export.') ||
        relativePath.includes('addons') ||
        relativePath.includes('email')) {
      return 'features/export/engine';
    }
    
    // LIBRARY extractors
    if (relativePath.includes('libraryExtractor')) {
      return 'features/library/extractor';
    }
    
    // Shared lib utilities (analytics, utils, seo, featureFlags, etc.)
    return 'shared/lib';
  }
  
  // Contexts
  if (relativePath.includes('contexts/')) {
    if (content.includes('Recommendation') || relativePath.includes('RecommendationContext')) {
      return 'features/reco/contexts';
    }
    return 'shared/contexts';
  }
  
  // Types
  if (relativePath.includes('types/')) {
    if (relativePath.includes('reco')) {
      return 'features/reco/types';
    }
    if (relativePath.includes('editor')) {
      return 'features/editor/types';
    }
    return 'shared/types';
  }
  
  // Data
  if (relativePath.includes('data/')) {
    return 'shared/data';
  }
  
  // Export renderer
  if (relativePath.includes('export/')) {
    return 'features/export/renderer';
  }
  
  // I18n
  if (relativePath.includes('i18n/')) {
    return 'shared/i18n';
  }
  
  return 'UNKNOWN';
}

function analyzeFiles() {
  const mapping = [];
  
  function walk(dir, basePath = '') {
    const entries = fs.readdirSync(dir);
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      const relativePath = path.join(basePath, entry).replace(/\\/g, '/');
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
          walk(fullPath, relativePath);
        }
      } else if (/\.(ts|tsx)$/.test(entry)) {
        const content = readFileSafe(fullPath);
        const imports = extractImports(content);
        const feature = detectFeature(content, imports, relativePath);
        const location = determineLocation(fullPath, feature, imports, content);
        
        mapping.push({
          current: relativePath,
          feature,
          location,
          imports: imports.slice(0, 3)
        });
      }
    });
  }
  
  walk(srcDir);
  return mapping;
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🗺️  COMPREHENSIVE FILE MAPPING');
console.log('═══════════════════════════════════════════════════════════\n');

const mapping = analyzeFiles();

// Group by feature
const byFeature = {};
mapping.forEach(m => {
  if (!byFeature[m.feature]) byFeature[m.feature] = [];
  byFeature[m.feature].push(m);
});

// Group by location
const byLocation = {};
mapping.forEach(m => {
  if (!byLocation[m.location]) byLocation[m.location] = [];
  byLocation[m.location].push(m);
});

console.log('📊 BY FEATURE:\n');
Object.entries(byFeature).sort((a, b) => b[1].length - a[1].length).forEach(([feature, files]) => {
  console.log(`${feature.toUpperCase()}: ${files.length} files`);
  files.slice(0, 5).forEach(f => {
    console.log(`  ${f.current} → ${f.location}`);
  });
  if (files.length > 5) console.log(`  ... ${files.length - 5} more`);
  console.log('');
});

console.log('\n📂 BY DESTINATION:\n');
Object.entries(byLocation).sort((a, b) => b[1].length - a[1].length).forEach(([location, files]) => {
  console.log(`${location}: ${files.length} files`);
  if (files.length <= 10) {
    files.forEach(f => console.log(`  - ${f.current}`));
  } else {
    files.slice(0, 10).forEach(f => console.log(`  - ${f.current}`));
    console.log(`  ... ${files.length - 10} more`);
  }
  console.log('');
});

// Save full mapping
fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'comprehensive-mapping.json'),
  JSON.stringify({ mapping, byFeature, byLocation }, null, 2)
);

console.log('✅ Full mapping saved to scripts/comprehensive-mapping.json\n');

