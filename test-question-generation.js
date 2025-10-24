const fs = require('fs');
const path = require('path');

// Load the actual program data
const dataPath = path.join(__dirname, 'data', 'scraped-programs-latest.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const programs = rawData.programs;

console.log('🔍 ANALYZING PROGRAM DATA FOR QUESTION GENERATION');
console.log('='.repeat(60));

console.log(`📊 Total programs: ${programs.length}`);

// Analyze program structure
const sampleProgram = programs[0];
console.log('\n🔍 Sample program structure:');
console.log('Fields:', Object.keys(sampleProgram));
console.log('Requirements:', sampleProgram.requirements);
console.log('Eligibility criteria:', sampleProgram.eligibility_criteria);
console.log('Tags:', sampleProgram.tags);
console.log('Target personas:', sampleProgram.target_personas);

// Analyze program types
const programTypes = new Set(programs.map(p => p.type));
console.log('\n📊 Program types found:', Array.from(programTypes));

// Analyze requirements patterns
const allRequirements = programs.map(p => p.requirements).filter(r => r);
const requirementKeys = new Set();
allRequirements.forEach(req => {
  if (req) Object.keys(req).forEach(key => requirementKeys.add(key));
});
console.log('\n📊 Requirements keys found:', Array.from(requirementKeys));

// Analyze eligibility criteria
const allEligibility = programs.map(p => p.eligibility_criteria).filter(e => e);
const eligibilityKeys = new Set();
allEligibility.forEach(elig => {
  if (elig) Object.keys(elig).forEach(key => eligibilityKeys.add(key));
});
console.log('\n📊 Eligibility criteria keys found:', Array.from(eligibilityKeys));

// Analyze tags
const allTags = new Set();
programs.forEach(p => {
  if (p.tags) p.tags.forEach(tag => allTags.add(tag));
});
console.log('\n📊 Tags found:', Array.from(allTags).slice(0, 20));

// Analyze target personas
const allPersonas = new Set();
programs.forEach(p => {
  if (p.target_personas) p.target_personas.forEach(persona => allPersonas.add(persona));
});
console.log('\n📊 Target personas found:', Array.from(allPersonas));

// Count programs with meaningful data
let programsWithRequirements = 0;
let programsWithEligibility = 0;
let programsWithTags = 0;
let programsWithPersonas = 0;

programs.forEach(p => {
  if (p.requirements && Object.keys(p.requirements).length > 0) programsWithRequirements++;
  if (p.eligibility_criteria && Object.keys(p.eligibility_criteria).length > 0) programsWithEligibility++;
  if (p.tags && p.tags.length > 0) programsWithTags++;
  if (p.target_personas && p.target_personas.length > 0) programsWithPersonas++;
});

console.log('\n📊 Programs with meaningful data:');
console.log(`  - Requirements: ${programsWithRequirements}/${programs.length}`);
console.log(`  - Eligibility: ${programsWithEligibility}/${programs.length}`);
console.log(`  - Tags: ${programsWithTags}/${programs.length}`);
console.log(`  - Personas: ${programsWithPersonas}/${programs.length}`);

// Estimate potential questions
console.log('\n🎯 ESTIMATED QUESTION GENERATION POTENTIAL:');
console.log('='.repeat(60));

const coreQuestions = [
  'Funding Type (3 options)',
  'Organization Type (4 options)', 
  'Funding Amount (4 options)',
  'Business Stage (4 options)',
  'Main Goal (4 options)',
  'Location (3 options)',
  'Team Size (4 options)',
  'Innovation Level (3 options)',
  'Timeline (3 options)',
  'Project Type (4 options)'
];

const overlayQuestions = [
  'Co-financing requirements',
  'TRL Level requirements', 
  'Consortium requirements',
  'Impact requirements',
  'Document requirements',
  'Legal requirements'
];

console.log(`📋 Core questions: ${coreQuestions.length}`);
coreQuestions.forEach((q, i) => console.log(`  ${i+1}. ${q}`));

console.log(`\n📋 Overlay questions: ${overlayQuestions.length}`);
overlayQuestions.forEach((q, i) => console.log(`  ${i+1}. ${q}`));

console.log(`\n🎯 TOTAL ESTIMATED QUESTIONS: ${coreQuestions.length + overlayQuestions.length}`);

// Check if we can generate questions from actual data
console.log('\n🔍 QUESTION GENERATION FEASIBILITY:');
console.log('='.repeat(60));

// Check for business stage indicators
const businessStageIndicators = programs.filter(p => 
  p.description?.toLowerCase().includes('startup') ||
  p.description?.toLowerCase().includes('early') ||
  p.description?.toLowerCase().includes('seed') ||
  p.tags?.includes('startup')
);
console.log(`✅ Business stage programs: ${businessStageIndicators.length}`);

// Check for innovation indicators  
const innovationIndicators = programs.filter(p =>
  p.tags?.includes('innovation') ||
  p.description?.toLowerCase().includes('innovation') ||
  p.description?.toLowerCase().includes('technology')
);
console.log(`✅ Innovation programs: ${innovationIndicators.length}`);

// Check for team size indicators
const teamSizeIndicators = programs.filter(p =>
  p.eligibility_criteria?.min_team_size ||
  p.description?.toLowerCase().includes('team') ||
  p.description?.toLowerCase().includes('personnel')
);
console.log(`✅ Team size programs: ${teamSizeIndicators.length}`);

// Check for location indicators
const locationIndicators = programs.filter(p =>
  p.eligibility_criteria?.location ||
  p.description?.toLowerCase().includes('austria') ||
  p.description?.toLowerCase().includes('european')
);
console.log(`✅ Location programs: ${locationIndicators.length}`);

console.log('\n🎯 CONCLUSION:');
console.log('='.repeat(60));
console.log('The data has rich structure for generating 15-20+ questions!');
console.log('The issue is likely in the question generation logic being too restrictive.');
