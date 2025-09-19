// Source-diff fetcher: crawl program URLs and detect changes
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const PROGRAMS_DIR = path.join(process.cwd(), 'data', 'programs');
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'diff-output');
const MAX_CONCURRENT = 3;
const TIMEOUT_MS = 10000;
const RETRY_ATTEMPTS = 3;

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load existing programs
function loadPrograms() {
  const programs = [];
  const files = fs.readdirSync(PROGRAMS_DIR).filter(file => file.endsWith('.md'));
  
  for (const file of files) {
    try {
      const filePath = path.join(PROGRAMS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse YAML front-matter
      const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const metadata = parseYAML(yamlContent);
        
        if (metadata.source_url) {
          programs.push({
            id: metadata.id || path.basename(file, '.md'),
            name: metadata.name || 'Unknown Program',
            file: file,
            filePath: filePath,
            source_url: metadata.source_url,
            last_updated: metadata.last_updated,
            amount_eur_min: metadata.amount_min,
            amount_eur_max: metadata.amount_max,
            call_deadline: metadata.call_deadline,
            eligibility_criteria: metadata.eligibility_criteria || []
          });
        }
      }
    } catch (error) {
      console.error(`Error loading program ${file}:`, error.message);
    }
  }
  
  return programs;
}

// Simple YAML parser for front-matter
function parseYAML(yamlContent) {
  const metadata = {};
  const lines = yamlContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        // Parse arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayContent = value.slice(1, -1);
          value = arrayContent.split(',').map(item => item.trim().replace(/['"]/g, ''));
        }
        
        metadata[key] = value;
      }
    }
  }
  
  return metadata;
}

// Fetch content from URL
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Plan2Fund Source Diff Fetcher/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Extract key information from HTML content
function extractProgramInfo(html, program) {
  const info = {
    amounts: [],
    deadlines: [],
    eligibility: [],
    changes: []
  };
  
  const lowerHtml = html.toLowerCase();
  
  // Extract amounts (look for EUR amounts)
  const amountRegex = /€\s*([0-9,.\s]+)\s*(?:to|-|–|–)\s*€\s*([0-9,.\s]+)/gi;
  let match;
  while ((match = amountRegex.exec(html)) !== null) {
    const min = parseFloat(match[1].replace(/[,\s]/g, ''));
    const max = parseFloat(match[2].replace(/[,\s]/g, ''));
    if (!isNaN(min) && !isNaN(max)) {
      info.amounts.push({ min, max });
    }
  }
  
  // Extract deadlines (look for date patterns)
  const dateRegex = /(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}|\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2})/gi;
  while ((match = dateRegex.exec(html)) !== null) {
    const dateStr = match[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      info.deadlines.push(dateStr);
    }
  }
  
  // Extract eligibility keywords
  const eligibilityKeywords = [
    'eligible', 'eligibility', 'requirements', 'criteria',
    'qualification', 'qualify', 'must have', 'should have',
    'minimum', 'maximum', 'age', 'size', 'stage', 'sector'
  ];
  
  for (const keyword of eligibilityKeywords) {
    if (lowerHtml.includes(keyword)) {
      info.eligibility.push(keyword);
    }
  }
  
  return info;
}

// Compare program data with fetched content
function compareProgramData(program, fetchedInfo) {
  const changes = [];
  
  // Check amount changes
  if (fetchedInfo.amounts.length > 0) {
    const latestAmount = fetchedInfo.amounts[0]; // Take first found amount
    if (program.amount_eur_min && Math.abs(program.amount_eur_min - latestAmount.min) > 1000) {
      changes.push({
        type: 'amount_min',
        old: program.amount_eur_min,
        new: latestAmount.min,
        reason: 'Minimum amount changed on source'
      });
    }
    if (program.amount_eur_max && Math.abs(program.amount_eur_max - latestAmount.max) > 1000) {
      changes.push({
        type: 'amount_max',
        old: program.amount_eur_max,
        new: latestAmount.max,
        reason: 'Maximum amount changed on source'
      });
    }
  }
  
  // Check deadline changes
  if (fetchedInfo.deadlines.length > 0) {
    const latestDeadline = fetchedInfo.deadlines[0]; // Take first found deadline
    if (program.call_deadline && program.call_deadline !== latestDeadline) {
      changes.push({
        type: 'call_deadline',
        old: program.call_deadline,
        new: latestDeadline,
        reason: 'Deadline changed on source'
      });
    }
  }
  
  return changes;
}

// Generate YAML diff
function generateYAMLDiff(program, changes) {
  const updates = {};
  
  for (const change of changes) {
    switch (change.type) {
      case 'amount_min':
        updates.amount_min = change.new;
        break;
      case 'amount_max':
        updates.amount_max = change.new;
        break;
      case 'call_deadline':
        updates.call_deadline = change.new;
        break;
    }
  }
  
  // Add last_updated
  updates.last_updated = new Date().toISOString().split('T')[0];
  
  return updates;
}

// Process a single program
async function processProgram(program) {
  console.log(`🔍 Processing ${program.name} (${program.id})`);
  
  try {
    const response = await fetchURL(program.source_url);
    
    if (response.status !== 200) {
      console.warn(`⚠️  HTTP ${response.status} for ${program.name}`);
      return null;
    }
    
    const fetchedInfo = extractProgramInfo(response.data, program);
    const changes = compareProgramData(program, fetchedInfo);
    
    if (changes.length > 0) {
      console.log(`📝 Found ${changes.length} changes for ${program.name}:`);
      changes.forEach(change => {
        console.log(`   - ${change.type}: ${change.old} → ${change.new}`);
      });
      
      const yamlUpdates = generateYAMLDiff(program, changes);
      
      return {
        program,
        changes,
        yamlUpdates,
        fetchedInfo
      };
    } else {
      console.log(`✅ No changes detected for ${program.name}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${program.name}:`, error.message);
    return null;
  }
}

// Process programs with concurrency control
async function processPrograms(programs) {
  const results = [];
  const chunks = [];
  
  // Split programs into chunks
  for (let i = 0; i < programs.length; i += MAX_CONCURRENT) {
    chunks.push(programs.slice(i, i + MAX_CONCURRENT));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(program => processProgram(program));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults.filter(result => result !== null));
    
    // Add delay between chunks to be respectful
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Generate PR content
function generatePRContent(results) {
  const prTitle = `Update program data from source URLs (${results.length} programs)`;
  const prBody = `## Program Data Updates

This PR contains updates to program data based on source URL crawling.

### Programs Updated:
${results.map(result => `- **${result.program.name}**: ${result.changes.length} changes`).join('\n')}

### Changes Summary:
${results.map(result => 
  result.changes.map(change => 
    `- ${result.program.name}: ${change.type} (${change.old} → ${change.new})`
  ).join('\n')
).join('\n')}

### Files Modified:
${results.map(result => `- \`data/programs/${result.program.file}\``).join('\n')}

---
*Generated by source-diff-fetcher on ${new Date().toISOString()}*
`;

  return { title: prTitle, body: prBody };
}

// Main function
async function main() {
  console.log('🚀 Starting source-diff fetcher...');
  
  const programs = loadPrograms();
  console.log(`📋 Found ${programs.length} programs to check`);
  
  if (programs.length === 0) {
    console.log('❌ No programs found to process');
    return;
  }
  
  const results = await processPrograms(programs);
  
  if (results.length === 0) {
    console.log('✅ No changes detected in any programs');
    return;
  }
  
  console.log(`\n📊 Summary: ${results.length} programs have changes`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(OUTPUT_DIR, `diff-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to ${resultsFile}`);
  
  // Generate PR content
  const prContent = generatePRContent(results);
  const prFile = path.join(OUTPUT_DIR, `pr-content-${timestamp}.md`);
  fs.writeFileSync(prFile, `# ${prContent.title}\n\n${prContent.body}`);
  console.log(`📝 PR content saved to ${prFile}`);
  
  // Generate YAML updates for each program
  for (const result of results) {
    const yamlFile = path.join(OUTPUT_DIR, `yaml-update-${result.program.id}-${timestamp}.yaml`);
    fs.writeFileSync(yamlFile, JSON.stringify(result.yamlUpdates, null, 2));
    console.log(`📄 YAML update for ${result.program.name} saved to ${yamlFile}`);
  }
  
  console.log('\n🎯 Source-diff fetcher completed!');
  console.log(`📁 Check ${OUTPUT_DIR} for all generated files`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, processProgram, extractProgramInfo, compareProgramData };
