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

console.log('🔍 CI Corpus Validation');
console.log(`📊 Validating ${programs.length} programs...`);

let errors = [];
let warnings = [];

// Check 1: Critical fields for top programs
console.log('\n1. Checking critical fields for top 50 programs...');
const topPrograms = programs.slice(0, 50);

topPrograms.forEach((program, index) => {
  const programId = program.id || `program-${index}`;
  
  // Critical fields
  if (!program.id) {
    errors.push(`Top program ${index}: Missing ID`);
  }
  
  if (!program.title && !program.name) {
    errors.push(`Top program ${programId}: Missing title/name`);
  }
  
  // Amount field
  if (!program.amount) {
    warnings.push(`Top program ${programId}: Missing amount field`);
  } else {
    const amount = program.amount.toString();
    if (!amount.match(/\d+/)) {
      errors.push(`Top program ${programId}: Invalid amount format: ${amount}`);
    }
  }
  
  // Region field
  if (!program.region && !program.location) {
    warnings.push(`Top program ${programId}: Missing region/location field`);
  } else {
    const region = program.region || program.location;
    const validRegions = ['AT', 'EU', 'AT/EU', 'NON_EU'];
    if (!validRegions.includes(region)) {
      warnings.push(`Top program ${programId}: Unknown region: ${region}`);
    }
  }
  
  // Date field
  if (!program.deadline && !program.end_date) {
    warnings.push(`Top program ${programId}: Missing deadline/end_date field`);
  }
});

// Check 2: Recent crawl data
console.log('\n2. Checking crawl freshness...');
const now = new Date();
const maxAgeDays = 30; // Fail if older than 30 days

programs.forEach((program, index) => {
  const programId = program.id || `program-${index}`;
  
  if (program.last_crawled || program.last_checked) {
    try {
      const lastCrawled = new Date(program.last_crawled || program.last_checked);
      const daysDiff = (now.getTime() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > maxAgeDays) {
        errors.push(`Program ${programId}: Last crawled ${Math.round(daysDiff)} days ago (max: ${maxAgeDays})`);
      }
    } catch (e) {
      errors.push(`Program ${programId}: Invalid last_crawled date: ${program.last_crawled || program.last_checked}`);
    }
  } else {
    warnings.push(`Program ${programId}: Missing last_crawled field`);
  }
});

// Check 3: Program type validation
console.log('\n3. Validating program types...');
const validTypes = ['grant', 'loan', 'equity', 'mixed', 'visa', 'incubator'];
const typeCounts = {};

programs.forEach((program, index) => {
  const programId = program.id || `program-${index}`;
  
  if (program.type) {
    if (!validTypes.includes(program.type)) {
      errors.push(`Program ${programId}: Invalid type: ${program.type}`);
    } else {
      typeCounts[program.type] = (typeCounts[program.type] || 0) + 1;
    }
  } else {
    warnings.push(`Program ${programId}: Missing type field`);
  }
});

// Check 4: Data consistency
console.log('\n4. Checking data consistency...');
programs.forEach((program, index) => {
  const programId = program.id || `program-${index}`;
  
  // Check for duplicate IDs
  const duplicateIds = programs.filter(p => p.id === program.id);
  if (duplicateIds.length > 1) {
    errors.push(`Program ${programId}: Duplicate ID found`);
  }
  
  // Check for empty required fields
  if (program.title === '' || program.name === '') {
    errors.push(`Program ${programId}: Empty title/name`);
  }
});

// Check 5: Amount format validation
console.log('\n5. Validating amount formats...');
programs.forEach((program, index) => {
  const programId = program.id || `program-${index}`;
  
  if (program.amount) {
    const amount = program.amount.toString();
    if (amount.length === 0) {
      errors.push(`Program ${programId}: Empty amount field`);
    } else if (!amount.match(/\d/)) {
      errors.push(`Program ${programId}: Amount contains no digits: ${amount}`);
    }
  }
});

// Results
console.log('\n📊 Validation Results:');
console.log(`- Total programs: ${programs.length}`);
console.log(`- Errors: ${errors.length}`);
console.log(`- Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

// Type distribution
console.log('\n📈 Program Type Distribution:');
Object.entries(typeCounts).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count} programs`);
});

// CI Gate: Fail if critical errors
if (errors.length > 0) {
  console.log('\n❌ CI GATE FAILED: Critical errors found');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  CI GATE PASSED with warnings');
  process.exit(0);
} else {
  console.log('\n✅ CI GATE PASSED: All validations successful');
  process.exit(0);
}
