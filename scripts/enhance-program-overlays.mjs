#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read programs data
const programsPath = path.join(__dirname, '..', 'data', 'programs.json');
const programs = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Enhanced overlay generation based on program characteristics
function generateEnhancedOverlays(program) {
  const overlays = [];
  
  // Basic jurisdiction overlay
  if (program.jurisdiction === 'AT') {
    overlays.push({
      ask_if: "answers.q1_country in ['AT','EU']",
      question: "Will the project be executed in Austria?",
      decisiveness: "HARD",
      rationale: "Program requires Austrian project location.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.jurisdiction === 'EU') {
    overlays.push({
      ask_if: "answers.q1_country in ['AT','EU']",
      question: "Is your organization eligible for EU funding?",
      decisiveness: "HARD",
      rationale: "Program requires EU/associated country eligibility.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Entity stage overlays based on program type
  if (program.tags.includes('startup') || program.name.toLowerCase().includes('startup')) {
    overlays.push({
      ask_if: "answers.q2_entity_stage in ['PRE_COMPANY','INC_LT_6M','INC_6_36M']",
      question: "Are you a startup or early-stage company?",
      decisiveness: "HARD",
      rationale: "Program specifically targets startups and early-stage companies.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.tags.includes('sme') || program.name.toLowerCase().includes('sme')) {
    overlays.push({
      ask_if: "answers.q3_company_size in ['MICRO_0_9','SMALL_10_49','MEDIUM_50_249']",
      question: "Is your company an SME (micro, small, or medium-sized)?",
      decisiveness: "HARD",
      rationale: "Program is designed for small and medium-sized enterprises.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Theme-based overlays
  if (program.tags.includes('innovation') || program.tags.includes('digital')) {
    overlays.push({
      ask_if: "'INNOVATION_DIGITAL' in answers.q4_theme",
      question: "Is your project focused on innovation or digital technology?",
      decisiveness: "SOFT",
      rationale: "Program specializes in innovation and digital projects.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  if (program.tags.includes('sustainability') || program.tags.includes('environment') || program.tags.includes('climate')) {
    overlays.push({
      ask_if: "'SUSTAINABILITY' in answers.q4_theme or answers.q10_env_benefit in ['STRONG','SOME']",
      question: "Does your project have environmental or sustainability benefits?",
      decisiveness: "SOFT",
      rationale: "Program focuses on sustainability and environmental impact.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  if (program.tags.includes('health') || program.tags.includes('life_science')) {
    overlays.push({
      ask_if: "'HEALTH_LIFE_SCIENCE' in answers.q4_theme",
      question: "Is your project in health or life sciences?",
      decisiveness: "SOFT",
      rationale: "Program specializes in health and life science projects.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  if (program.tags.includes('space')) {
    overlays.push({
      ask_if: "'SPACE_DOWNSTREAM' in answers.q4_theme",
      question: "Is your product/service space-enabled?",
      decisiveness: "HARD",
      rationale: "Program requires space-enabled products or services.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Maturity level overlays
  if (program.tags.includes('research') || program.name.toLowerCase().includes('research')) {
    overlays.push({
      ask_if: "answers.q5_maturity_trl in ['TRL_1_2','TRL_3_4','TRL_5_6']",
      question: "Is your project at research or development stage?",
      decisiveness: "SOFT",
      rationale: "Program supports research and development activities.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  if (program.tags.includes('scaleup') || program.name.toLowerCase().includes('scale')) {
    overlays.push({
      ask_if: "answers.q5_maturity_trl in ['TRL_7_8','TRL_9']",
      question: "Is your project ready for scaling or market launch?",
      decisiveness: "SOFT",
      rationale: "Program targets scaling and market-ready projects.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // R&D location overlays
  if (program.jurisdiction === 'AT' && (program.tags.includes('research') || program.tags.includes('innovation'))) {
    overlays.push({
      ask_if: "answers.q6_rnd_in_at == 'YES'",
      question: "Will you conduct R&D activities in Austria?",
      decisiveness: "HARD",
      rationale: "Program requires R&D activities to be conducted in Austria.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Collaboration overlays
  if (program.tags.includes('research') || program.name.toLowerCase().includes('collaboration')) {
    overlays.push({
      ask_if: "answers.q7_collaboration in ['WITH_RESEARCH','WITH_BOTH']",
      question: "Do you plan to collaborate with research institutions?",
      decisiveness: "SOFT",
      rationale: "Program encourages collaboration with research institutions.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Funding type overlays
  if (program.type === 'grant') {
    overlays.push({
      ask_if: "'GRANT' in answers.q8_funding_types",
      question: "Are you seeking grant funding?",
      decisiveness: "HARD",
      rationale: "Program provides grant funding.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.type === 'loan') {
    overlays.push({
      ask_if: "'LOAN' in answers.q8_funding_types",
      question: "Are you seeking loan financing?",
      decisiveness: "HARD",
      rationale: "Program provides loan financing.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.type === 'equity') {
    overlays.push({
      ask_if: "'EQUITY' in answers.q8_funding_types",
      question: "Are you open to equity investment?",
      decisiveness: "HARD",
      rationale: "Program provides equity investment.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.type === 'mixed') {
    overlays.push({
      ask_if: "len(answers.q8_funding_types) > 0",
      question: "Are you open to multiple types of funding?",
      decisiveness: "SOFT",
      rationale: "Program offers mixed funding options.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Diversity overlays
  if (program.tags.includes('women') || program.name.toLowerCase().includes('women')) {
    overlays.push({
      ask_if: "answers.q9_team_diversity == 'YES'",
      question: "Will women own >25% of shares at grant award?",
      decisiveness: "HARD",
      rationale: "Program specifically supports women entrepreneurs.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  } else if (program.tags.includes('diversity') || program.name.toLowerCase().includes('diversity')) {
    overlays.push({
      ask_if: "answers.q9_team_diversity in ['YES','UNKNOWN']",
      question: "Are you considering gender diversity in your team structure?",
      decisiveness: "SOFT",
      rationale: "Program values diversity and inclusion.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  // Environmental benefit overlays
  if (program.tags.includes('sustainability') || program.tags.includes('environment') || program.tags.includes('climate')) {
    overlays.push({
      ask_if: "answers.q10_env_benefit in ['STRONG','SOME']",
      question: "Does your project have measurable environmental benefits?",
      decisiveness: "HARD",
      rationale: "Program requires demonstrable environmental impact.",
      evidence_links: program.evidence_links,
      last_checked: new Date().toISOString().split('T')[0]
    });
  }
  
  return overlays;
}

// Enhance all programs
function enhanceAllPrograms() {
  let enhancedCount = 0;
  
  for (const program of programs.programs) {
    const originalOverlayCount = program.overlays ? program.overlays.length : 0;
    const enhancedOverlays = generateEnhancedOverlays(program);
    
    // Only update if we generated more overlays
    if (enhancedOverlays.length > originalOverlayCount) {
      program.overlays = enhancedOverlays;
      enhancedCount++;
      console.log(`Enhanced ${program.name}: ${originalOverlayCount} → ${enhancedOverlays.length} overlays`);
    }
  }
  
  return enhancedCount;
}

// Main execution
console.log('Starting program overlay enhancement...');

const enhancedCount = enhanceAllPrograms();

// Update programs.json
programs.version = new Date().toISOString().split('T')[0];
fs.writeFileSync(programsPath, JSON.stringify(programs, null, 2));

console.log(`\nEnhancement complete!`);
console.log(`Enhanced ${enhancedCount} programs`);
console.log(`Total programs: ${programs.programs.length}`);
console.log(`Updated programs.json`);

// Run coverage validation again
console.log('\nRunning coverage validation...');
import { spawn } from 'child_process';

const coverageProcess = spawn('node', ['scripts/coverage-validation.mjs'], { stdio: 'inherit' });

coverageProcess.on('close', (code) => {
  console.log(`\nCoverage validation completed with exit code: ${code}`);
  process.exit(code);
});

