#!/usr/bin/env node
/**
 * COMPLETE File Analysis - Read ALL files to understand what belongs where
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const pagesDir = path.join(process.cwd(), 'pages');

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function analyzeFile(filePath, relativePath) {
  const content = readFileSafe(filePath);
  if (!content) return null;
  
  // Get imports
  const imports = [];
  const importRegex = /from\s+['"]([@\.][^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Get exports
  const exports = [];
  const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Determine feature/component type
  let category = 'UNKNOWN';
  let suggestedPath = null;
  
  // Feature detection
  if (relativePath.includes('reco') || content.includes('recommend') || content.includes('ProgramDetailsModal')) {
    category = 'RECO';
    suggestedPath = 'features/reco/';
  } else if (relativePath.includes('editor') || content.includes('EditorEngine') || content.includes('UnifiedEditor')) {
    category = 'EDITOR';
    suggestedPath = 'features/editor/';
  } else if (relativePath.includes('intake') || content.includes('IntakeEngine')) {
    category = 'INTAKE';
    suggestedPath = 'features/intake/';
  } else if (relativePath.includes('export') || content.includes('exportManager') || content.includes('ExportRenderer')) {
    category = 'EXPORT';
    suggestedPath = 'features/export/';
  } else if (relativePath.includes('library') || content.includes('LibraryExtractor')) {
    category = 'LIBRARY';
    suggestedPath = 'features/library/';
  } else if (relativePath.includes('components/ui/') || content.includes('shadcn')) {
    category = 'SHARED_UI';
    suggestedPath = 'shared/components/ui/';
  } else if (relativePath.includes('components/')) {
    // Check if it's feature-specific component
    if (content.includes('features/') || content.includes('@/features/')) {
      category = 'FEATURE_COMPONENT';
      suggestedPath = 'features/[feature]/components/';
    } else {
      category = 'SHARED_COMPONENT';
      suggestedPath = 'shared/components/';
    }
  } else if (relativePath.includes('lib/')) {
    // Check what it does
    if (content.includes('reco') || content.includes('recommend')) {
      category = 'RECO_LIB';
      suggestedPath = 'features/reco/engine/';
    } else if (content.includes('editor') || content.includes('Editor')) {
      category = 'EDITOR_LIB';
      suggestedPath = 'features/editor/engine/';
    } else if (content.includes('intake')) {
      category = 'INTAKE_LIB';
      suggestedPath = 'features/intake/engine/';
    } else if (content.includes('export')) {
      category = 'EXPORT_LIB';
      suggestedPath = 'features/export/engine/';
    } else if (content.includes('library')) {
      category = 'LIBRARY_LIB';
      suggestedPath = 'features/library/extractor/';
    } else {
      category = 'SHARED_LIB';
      suggestedPath = 'shared/lib/';
    }
  } else if (relativePath.includes('types/')) {
    category = 'SHARED_TYPE';
    suggestedPath = 'shared/types/';
  } else if (relativePath.includes('data/')) {
    category = 'SHARED_DATA';
    suggestedPath = 'shared/data/';
  } else if (relativePath.includes('contexts/')) {
    category = 'SHARED_CONTEXT';
    suggestedPath = 'shared/contexts/';
  }
  
  return {
    path: relativePath,
    category,
    suggestedPath,
    imports: imports.slice(0, 10), // First 10 imports
    exports: exports.slice(0, 10), // First 10 exports
    lines: content.split('\n').length
  };
}

function walkDirectory(dir, basePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir);
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(basePath, entry).replace(/\\/g, '/');
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
        items.push(...walkDirectory(fullPath, relativePath));
      }
    } else if (/\.(ts|tsx)$/.test(entry)) {
      items.push(analyzeFile(fullPath, relativePath));
    }
  });
  
  return items.filter(Boolean);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 COMPLETE FILE ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

const allFiles = walkDirectory(srcDir);
console.log(`Analyzed ${allFiles.length} files from src/\n`);

// Group by category
const byCategory = {};
allFiles.forEach(file => {
  if (!byCategory[file.category]) {
    byCategory[file.category] = [];
  }
  byCategory[file.category].push(file);
});

// Report
console.log('📊 Files by Category:\n');
Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).forEach(([category, files]) => {
  console.log(`${category}: ${files.length} files`);
  files.slice(0, 5).forEach(f => {
    console.log(`  - ${f.path} → ${f.suggestedPath || 'MISSING'}`);
  });
  if (files.length > 5) {
    console.log(`  ... and ${files.length - 5} more`);
  }
  console.log('');
});

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total files analyzed: ${allFiles.length}`);
console.log(`Categories: ${Object.keys(byCategory).length}`);
console.log('═══════════════════════════════════════════════════════════\n');

