#!/usr/bin/env node
/**
 * COMPREHENSIVE File Reading & Mapping
 * Actually reads files to understand dependencies and purpose
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function analyzeFileImport(importPath) {
  // Determine what the import points to
  if (importPath.startsWith('@/')) {
    return { type: 'alias', path: importPath };
  } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return { type: 'relative', path: importPath };
  } else if (importPath.includes('/')) {
    return { type: 'package', path: importPath };
  } else {
    return { type: 'package', path: importPath };
  }
}

function extractImports(content) {
  const imports = [];
  const patterns = [
    /from\s+['"]([^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /import\s+['"]([^'"]+)['"]/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      imports.push(match[1]);
    }
  });
  
  return [...new Set(imports)]; // Remove duplicates
}

function determineFeature(filePath, content, imports) {
  // Check file path first
  if (filePath.includes('/reco/') || filePath.includes('/wizard/')) {
    return { feature: 'reco', confidence: 'high' };
  }
  if (filePath.includes('/editor/')) {
    return { feature: 'editor', confidence: 'high' };
  }
  if (filePath.includes('/intake/') || filePath.includes('/plan/PlanIntake')) {
    return { feature: 'intake', confidence: 'high' };
  }
  if (filePath.includes('/export/') || filePath.includes('/export.')) {
    return { feature: 'export', confidence: 'high' };
  }
  if (filePath.includes('/library/')) {
    return { feature: 'library', confidence: 'high' };
  }
  if (filePath.includes('/pricing/')) {
    return { feature: 'export', confidence: 'medium' }; // Pricing is part of export/checkout flow
  }
  
  // Check content for feature-specific keywords
  const featureKeywords = {
    reco: ['enhancedRecoEngine', 'scorePrograms', 'QuestionEngine', 'SmartWizard', 'recommend', 'wizard'],
    editor: ['EditorEngine', 'UnifiedEditor', 'EditorDataProvider', 'editor', 'document'],
    intake: ['IntakeEngine', 'intake', 'FundingProfile', 'targetGroupDetection'],
    export: ['ExportManager', 'export', 'payment', 'checkout', 'stripe', 'pricing'],
    library: ['LibraryExtractor', 'library']
  };
  
  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(kw => content.includes(kw) || filePath.includes(kw))) {
      return { feature, confidence: 'medium' };
    }
  }
  
  // Check imports for feature dependencies
  const hasRecoImports = imports.some(i => 
    i.includes('enhancedRecoEngine') || 
    i.includes('questionEngine') || 
    i.includes('reco')
  );
  const hasEditorImports = imports.some(i => 
    i.includes('EditorEngine') || 
    i.includes('editor')
  );
  const hasIntakeImports = imports.some(i => 
    i.includes('IntakeEngine') || 
    i.includes('intake')
  );
  const hasExportImports = imports.some(i => 
    i.includes('export') || 
    i.includes('payment') || 
    i.includes('pricing')
  );
  
  if (hasRecoImports && !hasEditorImports && !hasIntakeImports) {
    return { feature: 'reco', confidence: 'medium' };
  }
  if (hasEditorImports && !hasRecoImports && !hasIntakeImports) {
    return { feature: 'editor', confidence: 'medium' };
  }
  if (hasIntakeImports) {
    return { feature: 'intake', confidence: 'medium' };
  }
  if (hasExportImports && !hasEditorImports && !hasRecoImports) {
    return { feature: 'export', confidence: 'medium' };
  }
  
  return { feature: 'shared', confidence: 'low' };
}

function determineLocation(filePath, content, imports, feature) {
  const relativePath = path.relative(srcDir, filePath).replace(/\\/g, '/');
  
  // UI components from shadcn
  if (filePath.includes('/ui/') && (content.includes('cn(') || content.includes('class-variance-authority'))) {
    return 'shared/components/ui';
  }
  
  // Feature-specific components
  if (filePath.includes('/components/')) {
    if (feature.feature !== 'shared') {
      return `features/${feature.feature}/components`;
    }
    // Check if it's truly shared or feature-specific
    if (relativePath.includes('/common/') || relativePath.includes('/layout/')) {
      return 'shared/components';
    }
    // Check if component uses feature-specific imports
    const hasFeatureImports = imports.some(i => 
      i.includes('enhancedRecoEngine') ||
      i.includes('EditorEngine') ||
      i.includes('IntakeEngine') ||
      i.includes('ExportManager')
    );
    if (hasFeatureImports) {
      // Try to determine which feature
      if (imports.some(i => i.includes('enhancedRecoEngine'))) {
        return 'features/reco/components';
      }
      if (imports.some(i => i.includes('EditorEngine'))) {
        return 'features/editor/components';
      }
      if (imports.some(i => i.includes('IntakeEngine'))) {
        return 'features/intake/components';
      }
      if (imports.some(i => i.includes('ExportManager') || i.includes('payment'))) {
        return 'features/export/components';
      }
    }
    return 'shared/components';
  }
  
  // Lib files
  if (filePath.includes('/lib/')) {
    if (feature.feature !== 'shared') {
      return `features/${feature.feature}/engine`;
    }
    // Check what it exports/does
    if (content.includes('analytics') || content.includes('Analytics')) {
      return 'shared/lib';
    }
    if (content.includes('utils') || content.includes('cn(')) {
      return 'shared/lib';
    }
    if (content.includes('seo') || content.includes('SEO')) {
      return 'shared/lib';
    }
    if (content.includes('featureFlags') || content.includes('feature-flags')) {
      return 'shared/lib';
    }
    // Payments and pricing are export-related
    if (content.includes('payment') || content.includes('Payment') || content.includes('pricing') || content.includes('Pricing')) {
      return 'features/export/engine';
    }
    // Email is likely shared utility
    if (content.includes('email') || content.includes('Email')) {
      return 'shared/lib';
    }
    return 'shared/lib';
  }
  
  // Contexts
  if (filePath.includes('/contexts/')) {
    if (content.includes('Recommendation') || content.includes('recommend')) {
      return 'features/reco/contexts';
    }
    return 'shared/contexts';
  }
  
  // Types
  if (filePath.includes('/types/')) {
    if (content.includes('reco') || content.includes('recommend')) {
      return 'features/reco/types';
    }
    if (content.includes('editor') || content.includes('Editor')) {
      return 'features/editor/types';
    }
    return 'shared/types';
  }
  
  // Data
  if (filePath.includes('/data/')) {
    return 'shared/data';
  }
  
  // Export
  if (filePath.includes('/export/')) {
    return 'features/export/renderer';
  }
  
  return 'UNKNOWN';
}

function walkAndAnalyze(dir, basePath = '') {
  const results = [];
  const entries = fs.readdirSync(dir);
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(basePath, entry).replace(/\\/g, '/');
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
        results.push(...walkAndAnalyze(fullPath, relativePath));
      }
    } else if (/\.(ts|tsx)$/.test(entry)) {
      const content = readFileSafe(fullPath);
      if (!content) return;
      
      const imports = extractImports(content);
      const feature = determineFeature(fullPath, content, imports);
      const location = determineLocation(fullPath, content, imports, feature);
      
      results.push({
        currentPath: relativePath,
        feature: feature.feature,
        confidence: feature.confidence,
        suggestedLocation: location,
        imports: imports.slice(0, 5), // First 5 imports
        lineCount: content.split('\n').length
      });
    }
  });
  
  return results;
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📖 READING & MAPPING ALL FILES');
console.log('═══════════════════════════════════════════════════════════\n');

const allFiles = walkAndAnalyze(srcDir);
console.log(`Analyzed ${allFiles.length} files\n`);

// Group by feature
const byFeature = {};
allFiles.forEach(file => {
  if (!byFeature[file.feature]) {
    byFeature[file.feature] = [];
  }
  byFeature[file.feature].push(file);
});

// Group by suggested location
const byLocation = {};
allFiles.forEach(file => {
  if (!byLocation[file.suggestedLocation]) {
    byLocation[file.suggestedLocation] = [];
  }
  byLocation[file.suggestedLocation].push(file);
});

console.log('📊 BY FEATURE:\n');
Object.entries(byFeature).sort((a, b) => b[1].length - a[1].length).forEach(([feature, files]) => {
  console.log(`${feature.toUpperCase()}: ${files.length} files`);
  files.slice(0, 3).forEach(f => {
    console.log(`  ${f.currentPath}`);
    console.log(`    → ${f.suggestedLocation} (${f.confidence})`);
  });
  if (files.length > 3) {
    console.log(`  ... and ${files.length - 3} more`);
  }
  console.log('');
});

console.log('\n📂 BY DESTINATION:\n');
Object.entries(byLocation).sort((a, b) => b[1].length - a[1].length).forEach(([location, files]) => {
  console.log(`${location}: ${files.length} files`);
  if (files.length > 5) {
    files.slice(0, 5).forEach(f => {
      console.log(`  - ${f.currentPath}`);
    });
    console.log(`  ... and ${files.length - 5} more`);
  } else {
    files.forEach(f => {
      console.log(`  - ${f.currentPath}`);
    });
  }
  console.log('');
});

// Save mapping
const mapping = {
  timestamp: new Date().toISOString(),
  totalFiles: allFiles.length,
  byFeature,
  byLocation,
  detailedMapping: allFiles
};

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'file-mapping.json'),
  JSON.stringify(mapping, null, 2)
);

console.log('✅ Mapping saved to scripts/file-mapping.json\n');

