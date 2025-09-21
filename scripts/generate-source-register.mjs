#!/usr/bin/env node

// Generate Source Register for top-20 programs
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load programs data
const programsData = JSON.parse(readFileSync(join(__dirname, '../data/programs.json'), 'utf8'));

console.log('📋 GENERATING SOURCE REGISTER FOR TOP-20 PROGRAMS\n');

const programs = programsData.programs;

// Sort programs by priority (more overlays = higher priority)
const sortedPrograms = programs
  .map(program => ({
    ...program,
    overlayCount: program.overlays ? program.overlays.length : 0,
    lastChecked: getLatestLastChecked(program)
  }))
  .sort((a, b) => b.overlayCount - a.overlayCount)
  .slice(0, 20); // Top 20

console.log(`📊 Selected top ${sortedPrograms.length} programs by overlay count\n`);

// Generate source register
const sourceRegister = {
  generated: new Date().toISOString(),
  version: '1.0',
  description: 'Source Register for top-20 funding programs',
  programs: sortedPrograms.map((program, index) => ({
    rank: index + 1,
    id: program.id,
    name: program.name,
    type: program.type,
    jurisdiction: program.jurisdiction,
    url: program.evidence_links?.[0] || 'No URL available',
    excerpt: generateExcerpt(program),
    lastChecked: program.lastChecked,
    reviewer: 'System Generated',
    overlayCount: program.overlayCount,
    priority: getPriority(program.overlayCount),
    status: 'Active',
    notes: generateNotes(program)
  }))
};

// Generate markdown report
const generateMarkdownReport = () => {
  let markdown = '# Source Register - Top 20 Programs\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  markdown += '## Summary\n\n';
  markdown += `- **Total Programs Tracked**: ${sortedPrograms.length}\n`;
  markdown += `- **Average Overlays per Program**: ${Math.round(sortedPrograms.reduce((sum, p) => sum + p.overlayCount, 0) / sortedPrograms.length)}\n`;
  markdown += `- **Total Overlays**: ${sortedPrograms.reduce((sum, p) => sum + p.overlayCount, 0)}\n`;
  markdown += `- **Programs Needing Review**: ${sortedPrograms.filter(p => isStale(p.lastChecked)).length}\n\n`;

  // Priority distribution
  const priorityCounts = {};
  sortedPrograms.forEach(p => {
    const priority = getPriority(p.overlayCount);
    priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
  });

  markdown += '## Priority Distribution\n\n';
  markdown += '| Priority | Count | Description |\n';
  markdown += '|----------|-------|-------------|\n';
  markdown += `| High | ${priorityCounts.High || 0} | 5+ overlays |\n`;
  markdown += `| Medium | ${priorityCounts.Medium || 0} | 2-4 overlays |\n`;
  markdown += `| Low | ${priorityCounts.Low || 0} | 1 overlay |\n\n`;

  // Programs table
  markdown += '## Programs Register\n\n';
  markdown += '| Rank | Program | Type | Overlays | Last Checked | Status | URL |\n';
  markdown += '|------|---------|------|----------|--------------|--------|-----|\n';

  sortedPrograms.forEach(program => {
    const status = isStale(program.lastChecked) ? '⚠️ Stale' : '✅ Fresh';
    const url = program.evidence_links?.[0] ? `[Link](${program.evidence_links[0]})` : 'No URL';
    markdown += `| ${program.rank} | ${program.name} | ${program.type} | ${program.overlayCount} | ${program.lastChecked} | ${status} | ${url} |\n`;
  });

  // Stale programs
  const stalePrograms = sortedPrograms.filter(p => isStale(p.lastChecked));
  if (stalePrograms.length > 0) {
    markdown += '\n## Programs Needing Review\n\n';
    markdown += 'These programs have not been checked recently and may need updates:\n\n';
    stalePrograms.forEach(program => {
      markdown += `### ${program.rank}. ${program.name}\n`;
      markdown += `- **Type**: ${program.type}\n`;
      markdown += `- **Last Checked**: ${program.lastChecked}\n`;
      markdown += `- **Overlays**: ${program.overlayCount}\n`;
      markdown += `- **URL**: ${program.evidence_links?.[0] || 'No URL available'}\n`;
      markdown += `- **Excerpt**: ${generateExcerpt(program)}\n\n`;
    });
  }

  // Review schedule
  markdown += '## Review Schedule\n\n';
  markdown += '| Priority | Review Frequency | Next Review |\n';
  markdown += '|----------|------------------|-------------|\n';
  markdown += '| High | Monthly | ' + getNextReviewDate(30) + ' |\n';
  markdown += '| Medium | Quarterly | ' + getNextReviewDate(90) + ' |\n';
  markdown += '| Low | Semi-annually | ' + getNextReviewDate(180) + ' |\n\n';

  markdown += '## Review Checklist\n\n';
  markdown += 'For each program review:\n';
  markdown += '- [ ] Verify eligibility criteria are current\n';
  markdown += '- [ ] Check funding amounts and deadlines\n';
  markdown += '- [ ] Update overlays if rules have changed\n';
  markdown += '- [ ] Test question ordering with updated rules\n';
  markdown += '- [ ] Update last_checked date\n';
  markdown += '- [ ] Document any changes made\n\n';

  return markdown;
};

// Helper functions
function getLatestLastChecked(program) {
  if (!program.overlays) return 'Never';
  
  const dates = program.overlays
    .map(overlay => overlay.last_checked)
    .filter(date => date && date !== 'Unknown')
    .sort()
    .reverse();
  
  return dates[0] || 'Unknown';
}

function isStale(lastChecked) {
  if (!lastChecked || lastChecked === 'Never' || lastChecked === 'Unknown') return true;
  
  const checkDate = new Date(lastChecked);
  const now = new Date();
  const daysSinceCheck = (now - checkDate) / (1000 * 60 * 60 * 24);
  
  return daysSinceCheck > 90; // Stale if not checked in 90 days
}

function getPriority(overlayCount) {
  if (overlayCount >= 5) return 'High';
  if (overlayCount >= 2) return 'Medium';
  return 'Low';
}

function generateExcerpt(program) {
  const eligibility = program.eligibility?.[0] || 'No eligibility criteria available';
  return eligibility.substring(0, 100) + (eligibility.length > 100 ? '...' : '');
}

function generateNotes(program) {
  const notes = [];
  
  if (program.overlayCount === 0) {
    notes.push('No overlays - needs rule definition');
  }
  
  if (isStale(program.lastChecked)) {
    notes.push('Stale data - needs review');
  }
  
  if (!program.evidence_links || program.evidence_links.length === 0) {
    notes.push('No source URL available');
  }
  
  if (program.overlayCount >= 5) {
    notes.push('High complexity - multiple rules');
  }
  
  return notes.join('; ') || 'No issues';
}

function getNextReviewDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Generate and save reports
const markdownReport = generateMarkdownReport();
const markdownPath = join(__dirname, '../docs/SOURCE_REGISTER.md');
writeFileSync(markdownPath, markdownReport);

const jsonPath = join(__dirname, '../docs/source-register.json');
writeFileSync(jsonPath, JSON.stringify(sourceRegister, null, 2));

console.log('✅ Source register generated successfully!');
console.log(`📄 Markdown report: ${markdownPath}`);
console.log(`📄 JSON data: ${jsonPath}`);
console.log(`📊 Programs tracked: ${sortedPrograms.length}`);
console.log(`⚠️  Programs needing review: ${sortedPrograms.filter(p => isStale(p.lastChecked)).length}`);

// CI Status
const staleCount = sortedPrograms.filter(p => isStale(p.lastChecked)).length;
if (staleCount === 0) {
  console.log('✅ All programs are fresh - CI will pass');
  process.exit(0);
} else {
  console.log(`❌ ${staleCount} programs are stale - CI will fail`);
  process.exit(1);
}
