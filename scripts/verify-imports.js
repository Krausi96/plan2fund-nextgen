#!/usr/bin/env node
/**
 * Verify all imports are valid after restructuring
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 IMPORT VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

// Step 1: TypeScript compilation check
console.log('1️⃣  Running TypeScript compiler...');
try {
  execSync('npm run typecheck', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation: PASSED\n');
} catch (e) {
  console.error('❌ TypeScript compilation: FAILED\n');
  process.exit(1);
}

// Step 2: Check for broken imports
console.log('2️⃣  Checking for broken import paths...');
const brokenImports = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (!importMatch) return;
    
    const importPath = importMatch[1];
    
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('@/') && !importPath.startsWith('@plan2fund/')) {
      return;
    }
    
    // Resolve relative imports
    if (importPath.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), importPath);
      
      // Check if file exists
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      const exists = extensions.some(ext => {
        const testPath = resolvedPath + ext;
        return fs.existsSync(testPath) && fs.statSync(testPath).isFile();
      });
      
      // Check if directory exists (index file)
      const dirExists = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();
      const hasIndex = dirExists && extensions.some(ext => {
        return fs.existsSync(path.join(resolvedPath, 'index' + ext));
      });
      
      if (!exists && !hasIndex) {
        brokenImports.push({
          file: filePath.replace(process.cwd(), '.'),
          line: idx + 1,
          import: importPath
        });
      }
    }
  });
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        walkDir(fullPath);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      checkFile(fullPath);
    }
  });
}

walkDir(process.cwd());

if (brokenImports.length === 0) {
  console.log('✅ No broken imports found\n');
} else {
  console.log(`❌ Found ${brokenImports.length} broken imports:\n`);
  brokenImports.slice(0, 20).forEach(item => {
    console.log(`   ${item.file}:${item.line}`);
    console.log(`      → ${item.import}`);
  });
  if (brokenImports.length > 20) {
    console.log(`   ... and ${brokenImports.length - 20} more`);
  }
  console.log('');
  process.exit(1);
}

console.log('✅ All imports verified successfully!\n');

