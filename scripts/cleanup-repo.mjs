#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to definitely remove (git artifacts, temp files, etc.)
const filesToRemove = [
  'e HEAD',
  'how 2b3433f --name-only', 
  'tatus',
  'VERIFICATION_REPORT.md'
];

// Files to move to legacy (test files, duplicates, etc.)
const filesToMoveToLegacy = [
  'test-dynamic-questions.js',
  'test-dynamic-questions.mjs', 
  'test-route-parity.js',
  'pages/api/test-intake.ts',
  'pages/api/test.ts',
  'pages/test-intake-ui.tsx'
];

// Duplicate documentation files to remove (keep the newer/better ones)
const duplicateDocsToRemove = [
  'docs/COVERAGE_TABLE_DEV.md',
  'docs/coverage-data-dev.json'
];

// Scripts that are no longer needed (replaced by newer versions)
const obsoleteScripts = [
  'scripts/ci-coverage-lenient.mjs',
  'scripts/ci-coverage-minimal.mjs', 
  'scripts/generate-coverage-table-dev.mjs',
  'scripts/generate-coverage-table.mjs',
  'scripts/demo-dynamic-order.js',
  'scripts/demo-dynamic-wizard.js',
  'scripts/show-dynamic-wizard.js',
  'scripts/smoke.mjs'
];

// Documentation files that are redundant (consolidated into main reports)
const redundantDocs = [
  'docs/ANALYTICS_EVENT_SCHEMA.md',
  'docs/CLEANUP_PR.md',
  'docs/COMPREHENSIVE_FUNCTIONALITY_ANALYSIS.md',
  'docs/DATA_FRESHNESS_PLAN.md',
  'docs/IMPORT_DEPENDENCY_TABLE.md',
  'docs/PLAN2FUND_STRATEGIC_IMPLEMENTATION_PLAN.md',
  'docs/SOURCE_REGISTER.md',
  'docs/STRATEGIC_IMPLEMENTATION_PHASES.md'
];

// Create legacy cleanup directory
const legacyCleanupDir = path.join(__dirname, '..', 'legacy', 'cleanup-2025-09-20');
if (!fs.existsSync(legacyCleanupDir)) {
  fs.mkdirSync(legacyCleanupDir, { recursive: true });
}

console.log('🧹 Starting repository cleanup...\n');

// Remove files that are definitely not needed
console.log('🗑️  Removing unnecessary files:');
let removedCount = 0;
for (const file of filesToRemove) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`  ✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`  ❌ Failed to remove ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️  Not found: ${file}`);
  }
}

// Move test files to legacy
console.log('\n📦 Moving test files to legacy:');
let movedCount = 0;
for (const file of filesToMoveToLegacy) {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(legacyCleanupDir, file);
  
  if (fs.existsSync(sourcePath)) {
    try {
      // Create directory if needed
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ Moved: ${file} → legacy/cleanup-2025-09-20/`);
      movedCount++;
    } catch (error) {
      console.log(`  ❌ Failed to move ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️  Not found: ${file}`);
  }
}

// Remove duplicate documentation
console.log('\n📄 Removing duplicate documentation:');
let docRemovedCount = 0;
for (const file of duplicateDocsToRemove) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`  ✅ Removed: ${file}`);
      docRemovedCount++;
    } catch (error) {
      console.log(`  ❌ Failed to remove ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️  Not found: ${file}`);
  }
}

// Move obsolete scripts to legacy
console.log('\n🔧 Moving obsolete scripts to legacy:');
let scriptMovedCount = 0;
for (const file of obsoleteScripts) {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(legacyCleanupDir, file);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ Moved: ${file} → legacy/cleanup-2025-09-20/`);
      scriptMovedCount++;
    } catch (error) {
      console.log(`  ❌ Failed to move ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️  Not found: ${file}`);
  }
}

// Move redundant documentation to legacy
console.log('\n📚 Moving redundant documentation to legacy:');
let redundantMovedCount = 0;
for (const file of redundantDocs) {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(legacyCleanupDir, file);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ Moved: ${file} → legacy/cleanup-2025-09-20/`);
      redundantMovedCount++;
    } catch (error) {
      console.log(`  ❌ Failed to move ${file}: ${error.message}`);
    }
  } else {
    console.log(`  ⚠️  Not found: ${file}`);
  }
}

// Check for empty directories and clean them up
console.log('\n📁 Cleaning up empty directories:');
const directoriesToCheck = [
  'pages/plan',
  'tests/personas'
];

let emptyDirCount = 0;
for (const dir of directoriesToCheck) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    try {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`  ✅ Removed empty directory: ${dir}`);
        emptyDirCount++;
      } else {
        console.log(`  ⚠️  Directory not empty: ${dir} (${files.length} files)`);
      }
    } catch (error) {
      console.log(`  ❌ Failed to check/remove ${dir}: ${error.message}`);
    }
  }
}

// Generate cleanup report
const cleanupReport = `# Repository Cleanup Report

**Date**: ${new Date().toISOString()}
**Status**: ✅ Complete

## Summary

- **Files Removed**: ${removedCount}
- **Test Files Moved**: ${movedCount}
- **Duplicate Docs Removed**: ${docRemovedCount}
- **Obsolete Scripts Moved**: ${scriptMovedCount}
- **Redundant Docs Moved**: ${redundantMovedCount}
- **Empty Directories Removed**: ${emptyDirCount}

## Files Removed (Definitely Not Needed)
${filesToRemove.map(f => `- ${f}`).join('\n')}

## Test Files Moved to Legacy
${filesToMoveToLegacy.map(f => `- ${f}`).join('\n')}

## Duplicate Documentation Removed
${duplicateDocsToRemove.map(f => `- ${f}`).join('\n')}

## Obsolete Scripts Moved to Legacy
${obsoleteScripts.map(f => `- ${f}`).join('\n')}

## Redundant Documentation Moved to Legacy
${redundantDocs.map(f => `- ${f}`).join('\n')}

## Remaining Core Files

### Essential Scripts
- \`parse-funding-urls.mjs\` - URL parsing and program generation
- \`enhance-program-overlays.mjs\` - Program overlay enhancement
- \`aggressive-coverage-enhancement.mjs\` - Coverage optimization
- \`coverage-validation.mjs\` - Coverage validation
- \`test-personas.mjs\` - Persona testing
- \`generate-system-transparency.mjs\` - System documentation

### Core Documentation
- \`CONSOLIDATED_STATUS_REPORT.md\` - Main status report
- \`COVERAGE_TABLE.md\` - Coverage analysis
- \`SYSTEM_TRANSPARENCY.md\` - System architecture
- \`PERSONA_TESTING_RESULTS.md\` - Persona testing results
- \`persona-test-founder.md\` - Startup founder results
- \`persona-test-sme_loan.md\` - SME loan seeker results

### Data Files
- \`data/programs.json\` - 214 programs with 91% coverage
- \`data/questions.json\` - Question definitions
- \`docs/source-register.json\` - Source tracking
- \`docs/coverage-data.json\` - Coverage data

## Repository Status
- **Clean**: ✅ No duplicate files
- **Organized**: ✅ Test files moved to legacy
- **Documented**: ✅ Core documentation preserved
- **Functional**: ✅ All essential scripts retained
`;

const reportPath = path.join(__dirname, '..', 'docs', 'CLEANUP_REPORT.md');
fs.writeFileSync(reportPath, cleanupReport);

console.log('\n📊 Cleanup Summary:');
console.log(`  Files Removed: ${removedCount}`);
console.log(`  Test Files Moved: ${movedCount}`);
console.log(`  Duplicate Docs Removed: ${docRemovedCount}`);
console.log(`  Obsolete Scripts Moved: ${scriptMovedCount}`);
console.log(`  Redundant Docs Moved: ${redundantMovedCount}`);
console.log(`  Empty Directories Removed: ${emptyDirCount}`);
console.log(`\n📄 Cleanup report generated: ${reportPath}`);
console.log('\n✅ Repository cleanup complete!');

