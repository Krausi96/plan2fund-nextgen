/**
 * DEBUG LOGGING CHECKER HANDLER
 * Scans codebase for debug logging patterns
 * Run: node scripts/check-debug-logging.js
 */

const fs = require('fs');
const path = require('path');

const DEBUG_PATTERNS = [
  { name: 'RAW/DEBUG markers', regex: /=== RAW|RAW LLM|DEBUG:/i },
  { name: 'finishReason logging', regex: /finishReason.*parts.*length/ },
  { name: 'Console DEBUG', regex: /console\.(log|warn|error).*\[DEBUG/i },
  { name: 'Comment DEBUG', regex: /\/\/\s*DEBUG/ },
  { name: 'Debugger keyword', regex: /\bdebugger\b/ },
  { name: 'DEBUG_LLM flag', regex: /DEBUG_LLM/ },
];

const SKIP_DIRS = ['node_modules', '.git', '_temp_keep_backup', 'dist', '.next'];

function scanFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  DEBUG_PATTERNS.forEach(pattern => {
    lines.forEach((line, lineNum) => {
      if (pattern.regex.test(line)) {
        issues.push({
          file: filePath,
          line: lineNum + 1,
          pattern: pattern.name,
          content: line.trim().substring(0, 100)
        });
      }
    });
  });

  return issues;
}

function scanDirectory(dir) {
  let allIssues = [];

  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(process.cwd(), fullPath);

    if (SKIP_DIRS.some(skip => relPath.includes(skip))) return;

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      allIssues = allIssues.concat(scanDirectory(fullPath));
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      const fileIssues = scanFile(fullPath);
      if (fileIssues.length > 0) {
        allIssues = allIssues.concat(fileIssues);
      }
    }
  });

  return allIssues;
}

function main() {
  console.log('🔍 Scanning for debug logging patterns...\n');

  const issues = scanDirectory(process.cwd());

  if (issues.length === 0) {
    console.log('✅ No debug logging patterns found!');
    return;
  }

  console.log(`Found ${issues.length} debug patterns:\n`);

  // Group by file
  const byFile = {};
  issues.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });

  // Report by file
  Object.keys(byFile).sort().forEach(file => {
    console.log(`📄 ${file}`);
    byFile[file].forEach(issue => {
      console.log(`   Line ${issue.line}: [${issue.pattern}]`);
      console.log(`   ${issue.content}`);
    });
    console.log('');
  });

  console.log(`\nTotal: ${issues.length} issues in ${Object.keys(byFile).length} files`);
}

main();
