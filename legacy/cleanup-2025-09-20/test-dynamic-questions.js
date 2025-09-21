// Test the dynamic question engine
const fs = require('fs');
const path = require('path');

// Load the programs and questions data
const programsData = JSON.parse(fs.readFileSync('./data/programs.json', 'utf8'));
const questionsData = JSON.parse(fs.readFileSync('./data/questions.json', 'utf8'));

console.log('=== DYNAMIC QUESTION ENGINE TEST ===\n');

// Define UX weights for each question (higher = better UX, should come earlier)
const uxWeights = {
  'q1_country': 10,        // Essential - determines program eligibility
  'q4_theme': 9,           // High impact - determines program focus
  'q8_funding_types': 8,   // Critical - affects program matching
  'q2_entity_stage': 7,    // Important - affects eligibility
  'q3_company_size': 6,    // Important - affects eligibility
  'q5_maturity_trl': 5,    // Moderate - affects program fit
  'q6_rnd_in_at': 4,       // Moderate - affects Austrian programs
  'q7_collaboration': 3,   // Lower - affects some programs
  'q9_team_diversity': 2,  // Lower - affects some programs
  'q10_env_benefit': 1     // Lower - affects environmental programs
};

// Calculate question stats
const questionStats = new Map();

for (const baseQuestion of questionsData.universal) {
  const questionId = baseQuestion.id;
  const rules = [];
  let programsAffected = 0;
  const sourcePrograms = [];

  // Find all program overlays that reference this question
  for (const program of programsData.programs) {
    if (program.overlays && Array.isArray(program.overlays)) {
      for (const overlay of program.overlays) {
        if (overlay.ask_if && overlay.ask_if.includes(questionId)) {
          rules.push({
            programId: program.id,
            questionId: questionId,
            decisiveness: overlay.decisiveness,
            condition: overlay.ask_if,
            question: overlay.question
          });
          programsAffected++;
          sourcePrograms.push(program.id);
        }
      }
    }
  }

  // Calculate information value based on rule impact
  const hardRules = rules.filter(r => r.decisiveness === 'HARD').length;
  const softRules = rules.filter(r => r.decisiveness === 'SOFT').length;
  const uncertainRules = rules.filter(r => r.decisiveness === 'UNCERTAIN').length;
  
  const weightedImpact = (hardRules * 3) + (softRules * 2) + (uncertainRules * 1);
  const informationDensity = programsAffected > 0 ? weightedImpact / programsAffected : 0;
  const informationValue = Math.round(informationDensity * 100);

  // Get UX weight for this question
  const uxWeight = uxWeights[questionId] || 1;

  questionStats.set(questionId, {
    question: baseQuestion,
    programsAffected,
    informationValue,
    hardRules,
    softRules,
    uncertainRules,
    sourcePrograms,
    uxWeight
  });
}

// Sort by information value × UX weight (highest first)
const sortedQuestions = Array.from(questionStats.values())
  .sort((a, b) => {
    const scoreA = a.informationValue * a.uxWeight;
    const scoreB = b.informationValue * b.uxWeight;
    return scoreB - scoreA;
  });

// Limit to 7 core questions for better UX
const coreQuestions = sortedQuestions.slice(0, 7);
const overlayQuestions = sortedQuestions.slice(7);

console.log('Core Questions (≤7):');
coreQuestions.forEach((stat, i) => {
  const score = stat.informationValue * stat.uxWeight;
  console.log(`  ${i + 1}. ${stat.question.id} (score: ${score}, info: ${stat.informationValue}%, UX: ${stat.uxWeight}, programs: ${stat.programsAffected})`);
});

console.log('\nOverlay Questions (≤3):');
overlayQuestions.slice(0, 3).forEach((stat, i) => {
  const score = stat.informationValue * stat.uxWeight;
  console.log(`  ${i + 8}. ${stat.question.id} (score: ${score}, info: ${stat.informationValue}%, UX: ${stat.uxWeight}, programs: ${stat.programsAffected})`);
});

console.log('\n✅ Question UX Weighting Test Complete');
console.log(`Total questions: ${sortedQuestions.length}`);
console.log(`Core questions: ${coreQuestions.length}`);
console.log(`Overlay questions: ${Math.min(overlayQuestions.length, 3)}`);
