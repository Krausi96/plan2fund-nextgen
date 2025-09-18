// CI script for schema validation and freshness checks
const fs = require('fs');
const path = require('path');

// Configuration
const PROGRAMS_DIR = path.join(process.cwd(), 'data', 'programs');
const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');
const MAX_AGE_DAYS = 90;
const REQUIRED_FIELDS = [
  'id',
  'name',
  'type',
  'amount_min',
  'amount_max',
  'last_updated',
  'source_url'
];

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  SCHEMA_ERROR: 1,
  FRESHNESS_ERROR: 2,
  MISSING_FILES: 3
};

let hasErrors = false;
let errorCount = 0;

// Logging functions
function logError(message) {
  console.error(`❌ ERROR: ${message}`);
  hasErrors = true;
  errorCount++;
}

function logWarning(message) {
  console.warn(`⚠️  WARNING: ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Validate date format and age
function validateDate(dateStr, fieldName) {
  if (!dateStr) {
    logError(`Missing ${fieldName}`);
    return false;
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    logError(`Invalid date format for ${fieldName}: ${dateStr}`);
    return false;
  }
  
  const now = new Date();
  const ageInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (ageInDays > MAX_AGE_DAYS) {
    logError(`${fieldName} is ${ageInDays} days old (max: ${MAX_AGE_DAYS} days): ${dateStr}`);
    return false;
  }
  
  if (ageInDays > MAX_AGE_DAYS * 0.8) {
    logWarning(`${fieldName} is ${ageInDays} days old (approaching ${MAX_AGE_DAYS} day limit): ${dateStr}`);
  }
  
  return true;
}

// Validate amount fields
function validateAmount(amount, fieldName) {
  if (amount === undefined || amount === null) {
    logError(`Missing ${fieldName}`);
    return false;
  }
  
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    logError(`Invalid ${fieldName}: ${amount} (must be a number)`);
    return false;
  }
  
  if (numAmount < 0) {
    logError(`${fieldName} cannot be negative: ${amount}`);
    return false;
  }
  
  return true;
}

// Validate URL format
function validateURL(url, fieldName) {
  if (!url) {
    logError(`Missing ${fieldName}`);
    return false;
  }
  
  try {
    new URL(url);
    return true;
  } catch (error) {
    logError(`Invalid ${fieldName}: ${url}`);
    return false;
  }
}

// Validate program schema
function validateProgramSchema(program, filePath) {
  let isValid = true;
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in program)) {
      logError(`Missing required field '${field}' in ${filePath}`);
      isValid = false;
    }
  }
  
  if (!isValid) {
    return false;
  }
  
  // Validate specific field types and formats
  if (!validateDate(program.last_updated, 'last_updated')) {
    isValid = false;
  }
  
  if (!validateAmount(program.amount_min, 'amount_min')) {
    isValid = false;
  }
  
  if (!validateAmount(program.amount_max, 'amount_max')) {
    isValid = false;
  }
  
  if (!validateURL(program.source_url, 'source_url')) {
    isValid = false;
  }
  
  // Validate amount relationship
  if (program.amount_min && program.amount_max) {
    const min = Number(program.amount_min);
    const max = Number(program.amount_max);
    if (min > max) {
      logError(`amount_min (${min}) cannot be greater than amount_max (${max}) in ${filePath}`);
      isValid = false;
    }
  }
  
  // Validate type field
  const validTypes = ['grant', 'loan', 'equity', 'visa', 'incubator', 'mixed', 'grant_equity', 'grant_support'];
  if (program.type && !validTypes.includes(program.type)) {
    logError(`Invalid type '${program.type}' in ${filePath}. Must be one of: ${validTypes.join(', ')}`);
    isValid = false;
  }
  
  return isValid;
}

// Parse YAML front-matter
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
        
        // Parse numbers
        if (!isNaN(value) && value !== '') {
          value = Number(value);
        }
        
        metadata[key] = value;
      }
    }
  }
  
  return metadata;
}

// Validate program files
function validateProgramFiles() {
  logInfo('Validating program files...');
  
  if (!fs.existsSync(PROGRAMS_DIR)) {
    logError(`Programs directory not found: ${PROGRAMS_DIR}`);
    return false;
  }
  
  const files = fs.readdirSync(PROGRAMS_DIR).filter(file => file.endsWith('.md'));
  
  if (files.length === 0) {
    logError('No program files found');
    return false;
  }
  
  let validCount = 0;
  let totalCount = 0;
  const programIds = new Set();
  const duplicateIds = new Set();
  
  for (const file of files) {
    totalCount++;
    const filePath = path.join(PROGRAMS_DIR, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse YAML front-matter
      const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!yamlMatch) {
        logError(`No YAML front-matter found in ${filePath}`);
        continue;
      }
      
      const yamlContent = yamlMatch[1];
      const program = parseYAML(yamlContent);
      
      // Check for duplicate IDs
      if (program.id) {
        if (programIds.has(program.id)) {
          logError(`Duplicate ID '${program.id}' found in ${filePath}`);
          duplicateIds.add(program.id);
        } else {
          programIds.add(program.id);
        }
      }
      
      if (validateProgramSchema(program, filePath)) {
        validCount++;
        logSuccess(`Valid program: ${file}`);
      }
      
    } catch (error) {
      logError(`Error reading ${filePath}: ${error.message}`);
    }
  }
  
  // Report duplicate IDs
  if (duplicateIds.size > 0) {
    logError(`Found ${duplicateIds.size} duplicate IDs: ${Array.from(duplicateIds).join(', ')}`);
  }
  
  logInfo(`Program validation complete: ${validCount}/${totalCount} files valid`);
  logInfo(`ID de-duplication: ${programIds.size} unique IDs, ${duplicateIds.size} duplicates`);
  
  return validCount === totalCount && duplicateIds.size === 0;
}

// Validate questions files
function validateQuestionsFiles() {
  logInfo('Validating questions files...');
  
  if (!fs.existsSync(QUESTIONS_DIR)) {
    logError(`Questions directory not found: ${QUESTIONS_DIR}`);
    return false;
  }
  
  const files = fs.readdirSync(QUESTIONS_DIR).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    logError('No questions files found');
    return false;
  }
  
  let validCount = 0;
  let totalCount = 0;
  
  for (const file of files) {
    totalCount++;
    const filePath = path.join(QUESTIONS_DIR, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const questions = JSON.parse(content);
      
      if (typeof questions !== 'object' || questions === null) {
        logError(`Questions file ${file} must contain an object`);
        continue;
      }
      
      // Check if it's an array of questions
      if (Array.isArray(questions)) {
        if (questions.length === 0) {
          logError(`Questions file ${file} is empty`);
          continue;
        }
        
        // Validate question structure
        let questionsValid = true;
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          if (!question.key || !question.question) {
            logError(`Question ${i + 1} in ${file} missing key or question field`);
            questionsValid = false;
          }
        }
        
        if (questionsValid) {
          validCount++;
          logSuccess(`Valid questions file: ${file} (${questions.length} questions)`);
        }
      } else {
        // It's an object, validate it has required structure
        if (Object.keys(questions).length === 0) {
          logError(`Questions file ${file} is empty`);
          continue;
        }
        
        // Basic validation for object format
        validCount++;
        logSuccess(`Valid questions file: ${file} (object format)`);
      }
      
    } catch (error) {
      logError(`Error reading ${filePath}: ${error.message}`);
    }
  }
  
  logInfo(`Questions validation complete: ${validCount}/${totalCount} files valid`);
  return validCount === totalCount;
}

// Check data freshness
function checkDataFreshness() {
  logInfo('Checking data freshness...');
  
  const programs = [];
  const files = fs.readdirSync(PROGRAMS_DIR).filter(file => file.endsWith('.md'));
  
  for (const file of files) {
    try {
      const filePath = path.join(PROGRAMS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];
        const program = parseYAML(yamlContent);
        
        if (program.last_updated) {
          programs.push({
            id: program.id || file,
            name: program.name || 'Unknown',
            last_updated: program.last_updated,
            file: file
          });
        }
      }
    } catch (error) {
      logError(`Error processing ${file}: ${error.message}`);
    }
  }
  
  let staleCount = 0;
  const now = new Date();
  
  for (const program of programs) {
    const lastUpdated = new Date(program.last_updated);
    const ageInDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
    
    if (ageInDays > MAX_AGE_DAYS) {
      logError(`Program ${program.name} (${program.file}) is ${ageInDays} days old (max: ${MAX_AGE_DAYS} days)`);
      staleCount++;
    } else if (ageInDays > MAX_AGE_DAYS * 0.8) {
      logWarning(`Program ${program.name} (${program.file}) is ${ageInDays} days old (approaching limit)`);
    }
  }
  
  logInfo(`Freshness check complete: ${staleCount} stale programs found`);
  return staleCount === 0;
}

// Main validation function
function runValidation() {
  console.log('🚀 Starting CI schema and freshness validation...\n');
  
  const startTime = Date.now();
  
  // Run all validations
  const programsValid = validateProgramFiles();
  const questionsValid = validateQuestionsFiles();
  const freshnessValid = checkDataFreshness();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n📊 Validation Summary:`);
  console.log(`   Programs: ${programsValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Questions: ${questionsValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Freshness: ${freshnessValid ? '✅ Fresh' : '❌ Stale'}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Errors: ${errorCount}`);
  
  if (hasErrors) {
    console.log(`\n❌ CI validation failed with ${errorCount} errors`);
    process.exit(EXIT_CODES.SCHEMA_ERROR);
  } else {
    console.log(`\n✅ CI validation passed`);
    process.exit(EXIT_CODES.SUCCESS);
  }
}

// Run if called directly
if (require.main === module) {
  runValidation();
}

module.exports = { 
  runValidation, 
  validateProgramSchema, 
  validateQuestionsFiles, 
  checkDataFreshness,
  EXIT_CODES 
};
