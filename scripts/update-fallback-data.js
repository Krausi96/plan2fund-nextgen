#!/usr/bin/env node

/**
 * Update Fallback Data Script
 * 
 * This script allows updating the fallback programs data without code changes.
 * It validates the data structure and ensures all required fields are present.
 */

const fs = require('fs');
const path = require('path');

const FALLBACK_DATA_PATH = path.join(__dirname, '..', 'data', 'fallback-programs.json');

// Required fields for a valid program
const REQUIRED_FIELDS = [
  'id', 'name', 'description', 'type', 'program_type', 'funding_amount_min', 
  'funding_amount_max', 'currency', 'institution', 'program_category',
  'eligibility_criteria', 'requirements', 'contact_info', 'source_url',
  'confidence_score', 'tags', 'target_personas', 'decision_tree_questions',
  'editor_sections', 'readiness_criteria', 'ai_guidance'
];

// Valid program types
const VALID_TYPES = ['grant', 'loan', 'equity', 'visa', 'consulting', 'service', 'other'];

/**
 * Validate a single program
 */
function validateProgram(program, index) {
  const errors = [];
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in program)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate type
  if (program.type && !VALID_TYPES.includes(program.type)) {
    errors.push(`Invalid type: ${program.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  // Validate funding amounts
  if (program.funding_amount_min && program.funding_amount_max) {
    if (program.funding_amount_min > program.funding_amount_max) {
      errors.push('funding_amount_min cannot be greater than funding_amount_max');
    }
  }
  
  // Validate confidence score
  if (program.confidence_score && (program.confidence_score < 0 || program.confidence_score > 1)) {
    errors.push('confidence_score must be between 0 and 1');
  }
  
  if (errors.length > 0) {
    console.error(`❌ Program ${index + 1} (${program.name || 'Unknown'}):`);
    errors.forEach(error => console.error(`   - ${error}`));
    return false;
  }
  
  return true;
}

/**
 * Load and validate fallback data
 */
function loadAndValidateData() {
  try {
    if (!fs.existsSync(FALLBACK_DATA_PATH)) {
      console.error(`❌ Fallback data file not found: ${FALLBACK_DATA_PATH}`);
      return null;
    }
    
    const data = fs.readFileSync(FALLBACK_DATA_PATH, 'utf8');
    const jsonData = JSON.parse(data);
    
    if (!jsonData.programs || !Array.isArray(jsonData.programs)) {
      console.error('❌ Invalid data structure: programs array not found');
      return null;
    }
    
    console.log(`📊 Loaded ${jsonData.programs.length} programs from fallback data`);
    
    // Validate each program
    let validCount = 0;
    for (let i = 0; i < jsonData.programs.length; i++) {
      if (validateProgram(jsonData.programs[i], i)) {
        validCount++;
      }
    }
    
    console.log(`✅ ${validCount}/${jsonData.programs.length} programs are valid`);
    
    if (validCount === jsonData.programs.length) {
      console.log('🎉 All programs are valid!');
      return jsonData;
    } else {
      console.error('❌ Some programs have validation errors');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error loading fallback data:', error.message);
    return null;
  }
}

/**
 * Update program data
 */
function updateProgram(programId, updates) {
  const data = loadAndValidateData();
  if (!data) return false;
  
  const programIndex = data.programs.findIndex(p => p.id === programId);
  if (programIndex === -1) {
    console.error(`❌ Program not found: ${programId}`);
    return false;
  }
  
  // Update the program
  data.programs[programIndex] = { ...data.programs[programIndex], ...updates };
  data.lastUpdated = new Date().toISOString();
  
  // Validate the updated program
  if (!validateProgram(data.programs[programIndex], programIndex)) {
    console.error('❌ Updated program failed validation');
    return false;
  }
  
  // Save the updated data
  try {
    fs.writeFileSync(FALLBACK_DATA_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ Program ${programId} updated successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error saving updated data:', error.message);
    return false;
  }
}

/**
 * Add new program
 */
function addProgram(program) {
  const data = loadAndValidateData();
  if (!data) return false;
  
  // Generate ID if not provided
  if (!program.id) {
    program.id = `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Add to programs array
  data.programs.push(program);
  data.lastUpdated = new Date().toISOString();
  
  // Validate the new program
  const programIndex = data.programs.length - 1;
  if (!validateProgram(data.programs[programIndex], programIndex)) {
    console.error('❌ New program failed validation');
    return false;
  }
  
  // Save the updated data
  try {
    fs.writeFileSync(FALLBACK_DATA_PATH, JSON.stringify(data, null, 2));
    console.log(`✅ New program added: ${program.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving new program:', error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'validate':
      console.log('🔍 Validating fallback data...');
      const data = loadAndValidateData();
      if (data) {
        console.log('✅ Validation completed successfully');
        process.exit(0);
      } else {
        console.log('❌ Validation failed');
        process.exit(1);
      }
      break;
      
    case 'update':
      const programId = process.argv[3];
      const updatesJson = process.argv[4];
      
      if (!programId || !updatesJson) {
        console.error('Usage: node update-fallback-data.js update <programId> <updatesJson>');
        process.exit(1);
      }
      
      try {
        const updates = JSON.parse(updatesJson);
        if (updateProgram(programId, updates)) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Invalid JSON in updates:', error.message);
        process.exit(1);
      }
      break;
      
    case 'add':
      const programJson = process.argv[3];
      
      if (!programJson) {
        console.error('Usage: node update-fallback-data.js add <programJson>');
        process.exit(1);
      }
      
      try {
        const program = JSON.parse(programJson);
        if (addProgram(program)) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Invalid JSON in program:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node update-fallback-data.js validate');
      console.log('  node update-fallback-data.js update <programId> <updatesJson>');
      console.log('  node update-fallback-data.js add <programJson>');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadAndValidateData,
  updateProgram,
  addProgram,
  validateProgram
};
