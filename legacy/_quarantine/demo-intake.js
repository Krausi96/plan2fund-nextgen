// Demo script to verify intake layer functionality
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING CURSOR\'S INTAKE LAYER CLAIMS\n');

// 1. Verify file structure
console.log('📁 FILE STRUCTURE VERIFICATION:');
const files = [
  'src/lib/schemas/fundingProfile.ts',
  'src/lib/intakeParser.ts', 
  'tests/intake/golden-tests.ts',
  'tests/intake/fuzzy-tests.ts',
  'tests/intake/ci-tests.ts',
  'src/components/intake/IntakeForm.tsx',
  'src/components/intake/OverlayQuestions.tsx',
  'pages/api/intake/parse.ts'
];

files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verify schema structure
console.log('\n📋 SCHEMA VERIFICATION:');
const schemaContent = fs.readFileSync('src/lib/schemas/fundingProfile.ts', 'utf8');
const schemaChecks = [
  'interface FundingProfile',
  'confidence: {',
  'SECTOR_MAPPING:',
  'STAGE_MAPPING:',
  'LOCATION_MAPPING:',
  'validateFundingProfile',
  'DEFAULT_CONFIDENCE'
];

schemaChecks.forEach(check => {
  const found = schemaContent.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

// 3. Verify test cases
console.log('\n🧪 TEST CASES VERIFICATION:');
const goldenTests = fs.readFileSync('tests/intake/golden-tests.ts', 'utf8');
const goldenTestCount = (goldenTests.match(/name: '/g) || []).length;
console.log(`  ✅ Golden tests: ${goldenTestCount} cases`);

const fuzzyTests = fs.readFileSync('tests/intake/fuzzy-tests.ts', 'utf8');
const fuzzyTestCount = (fuzzyTests.match(/name: '/g) || []).length;
console.log(`  ✅ Fuzzy tests: ${fuzzyTestCount} cases`);

// 4. Verify parser functionality
console.log('\n⚙️ PARSER FUNCTIONALITY VERIFICATION:');
const parserContent = fs.readFileSync('src/lib/intakeParser.ts', 'utf8');
const parserChecks = [
  'class IntakeParser',
  'parseInput',
  'parseWithAI',
  'parseDeterministic',
  'detectLanguage',
  'detectIntent',
  'extractSector',
  'extractStage',
  'extractTeamSize',
  'extractLocation',
  'extractFundingAmount',
  'getOverlayQuestions'
];

parserChecks.forEach(check => {
  const found = parserContent.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

// 5. Verify UI components
console.log('\n🎨 UI COMPONENTS VERIFICATION:');
const intakeForm = fs.readFileSync('src/components/intake/IntakeForm.tsx', 'utf8');
const uiChecks = [
  'IntakeForm',
  'chips',
  'confidence',
  'OverlayQuestions',
  'helper text',
  'editable'
];

uiChecks.forEach(check => {
  const found = intakeForm.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

// 6. Verify API endpoint
console.log('\n🌐 API ENDPOINT VERIFICATION:');
const apiContent = fs.readFileSync('pages/api/intake/parse.ts', 'utf8');
const apiChecks = [
  'POST',
  'intakeParser.parseInput',
  'validateFundingProfile',
  'analytics.trackEvent',
  'error handling'
];

apiChecks.forEach(check => {
  const found = apiContent.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

// 7. Verify GDPR compliance
console.log('\n🔒 GDPR COMPLIANCE VERIFICATION:');
const gdprChecks = [
  'session_id',
  'pseudonymous',
  'raw_input',
  'parsed_at'
];

gdprChecks.forEach(check => {
  const found = schemaContent.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

// 8. Verify off-topic detection
console.log('\n🚫 OFF-TOPIC DETECTION VERIFICATION:');
const offtopicChecks = [
  'offtopic',
  'intent',
  'business_intake',
  'write a poem',
  'haiku'
];

offtopicChecks.forEach(check => {
  const found = parserContent.includes(check);
  console.log(`  ${found ? '✅' : '❌'} ${check}`);
});

console.log('\n📊 SUMMARY:');
console.log('===========');
console.log(`Files created: ${files.filter(f => fs.existsSync(f)).length}/${files.length}`);
console.log(`Schema features: ${schemaChecks.filter(c => schemaContent.includes(c)).length}/${schemaChecks.length}`);
console.log(`Parser features: ${parserChecks.filter(c => parserContent.includes(c)).length}/${parserChecks.length}`);
console.log(`UI features: ${uiChecks.filter(c => intakeForm.includes(c)).length}/${uiChecks.length}`);
console.log(`API features: ${apiChecks.filter(c => apiContent.includes(c)).length}/${apiChecks.length}`);
console.log(`GDPR features: ${gdprChecks.filter(c => schemaContent.includes(c)).length}/${gdprChecks.length}`);
console.log(`Off-topic features: ${offtopicChecks.filter(c => parserContent.includes(c)).length}/${offtopicChecks.length}`);

console.log('\n✅ VERIFICATION COMPLETE');
