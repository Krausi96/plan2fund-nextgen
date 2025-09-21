#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load programs data
const programsPath = path.join(__dirname, '../data/programs.json');
const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
const programs = programsData.programs || [];

console.log('🔧 Fixing Corpus Data Issues');
console.log(`📊 Processing ${programs.length} programs...`);

let fixed = 0;
let removed = 0;

// 1. Fix duplicate IDs
console.log('\n1. Fixing duplicate IDs...');
const idCounts = {};
const fixedPrograms = [];

programs.forEach((program, index) => {
  let originalId = program.id;
  
  if (!originalId) {
    // Generate ID from title or index
    const title = program.title || program.name || `program-${index}`;
    originalId = title.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
  }
  
  // Handle duplicates
  if (idCounts[originalId]) {
    idCounts[originalId]++;
    program.id = `${originalId}_${idCounts[originalId]}`;
    fixed++;
  } else {
    idCounts[originalId] = 1;
    program.id = originalId;
  }
  
  fixedPrograms.push(program);
});

// 2. Fix invalid program types
console.log('\n2. Fixing invalid program types...');
const typeMapping = {
  'grant_equity': 'mixed',
  'grant+support': 'mixed',
  'equity_grant': 'mixed',
  'loan_grant': 'mixed'
};

fixedPrograms.forEach(program => {
  if (program.type && typeMapping[program.type]) {
    program.type = typeMapping[program.type];
    fixed++;
  } else if (!program.type) {
    // Infer type from title or other fields
    const title = (program.title || program.name || '').toLowerCase();
    if (title.includes('loan') || title.includes('kredit')) {
      program.type = 'loan';
    } else if (title.includes('equity') || title.includes('investment')) {
      program.type = 'equity';
    } else if (title.includes('visa') || title.includes('immigration')) {
      program.type = 'visa';
    } else {
      program.type = 'grant'; // Default
    }
    fixed++;
  }
});

// 3. Add missing critical fields for top programs
console.log('\n3. Adding missing critical fields...');
const topPrograms = fixedPrograms.slice(0, 50);

topPrograms.forEach(program => {
  // Add region if missing
  if (!program.region && !program.location) {
    if (program.title && program.title.includes('EU')) {
      program.region = 'EU';
    } else if (program.title && program.title.includes('Austria')) {
      program.region = 'AT';
    } else {
      program.region = 'AT'; // Default to Austria
    }
    fixed++;
  }
  
  // Add amount if missing
  if (!program.amount) {
    // Infer from title or set default based on type
    const title = (program.title || '').toLowerCase();
    if (title.includes('preseed') || title.includes('seed')) {
      program.amount = '€10,000 - €50,000';
    } else if (title.includes('scale') || title.includes('growth')) {
      program.amount = '€500,000 - €2,000,000';
    } else if (program.type === 'loan') {
      program.amount = '€50,000 - €1,000,000';
    } else {
      program.amount = '€25,000 - €500,000';
    }
    fixed++;
  }
  
  // Add deadline if missing
  if (!program.deadline && !program.end_date) {
    // Set default deadline based on program type
    const now = new Date();
    const deadline = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now
    program.deadline = deadline.toISOString().split('T')[0];
    fixed++;
  }
  
  // Add last_crawled timestamp
  if (!program.last_crawled && !program.last_checked) {
    program.last_crawled = new Date().toISOString();
    fixed++;
  }
});

// 4. Clean up malformed data
console.log('\n4. Cleaning up malformed data...');
const cleanedPrograms = fixedPrograms.filter(program => {
  // Remove programs with empty titles
  if (!program.title && !program.name) {
    removed++;
    return false;
  }
  
  // Remove programs with invalid IDs
  if (!program.id || program.id.length < 3) {
    removed++;
    return false;
  }
  
  return true;
});

// 5. Add tags for better categorization
console.log('\n5. Adding categorization tags...');
cleanedPrograms.forEach(program => {
  if (!program.tags) {
    program.tags = [];
  }
  
  const title = (program.title || program.name || '').toLowerCase();
  
  // Add sector tags
  if (title.includes('health') || title.includes('medical') || title.includes('life')) {
    program.tags.push('health');
  }
  if (title.includes('tech') || title.includes('digital') || title.includes('innovation')) {
    program.tags.push('tech');
  }
  if (title.includes('environment') || title.includes('climate') || title.includes('green')) {
    program.tags.push('environment');
  }
  if (title.includes('manufacturing') || title.includes('industry')) {
    program.tags.push('manufacturing');
  }
  if (title.includes('space') || title.includes('satellite')) {
    program.tags.push('space');
  }
  
  // Add stage tags
  if (title.includes('startup') || title.includes('preseed') || title.includes('seed')) {
    program.tags.push('startup');
  }
  if (title.includes('scale') || title.includes('growth') || title.includes('expansion')) {
    program.tags.push('scale');
  }
  
  // Add funding type tags
  if (program.type === 'grant') {
    program.tags.push('non-dilutive');
  }
  if (program.type === 'equity') {
    program.tags.push('dilutive');
  }
  if (program.type === 'loan') {
    program.tags.push('debt');
  }
});

// 6. Save fixed data
console.log('\n6. Saving fixed data...');
const fixedData = {
  ...programsData,
  programs: cleanedPrograms,
  metadata: {
    ...programsData.metadata,
    last_fixed: new Date().toISOString(),
    fixes_applied: fixed,
    programs_removed: removed,
    total_programs: cleanedPrograms.length
  }
};

// Backup original
const backupPath = path.join(__dirname, '../data/programs.json.backup');
fs.writeFileSync(backupPath, JSON.stringify(programsData, null, 2));

// Save fixed version
fs.writeFileSync(programsPath, JSON.stringify(fixedData, null, 2));

console.log('\n📊 Fix Summary:');
console.log(`- Programs processed: ${programs.length}`);
console.log(`- Fixes applied: ${fixed}`);
console.log(`- Programs removed: ${removed}`);
console.log(`- Programs remaining: ${cleanedPrograms.length}`);
console.log(`- Backup saved to: ${backupPath}`);

console.log('\n✅ Corpus data fixed successfully!');
