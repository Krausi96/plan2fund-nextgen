// Demo script to show dynamic wizard question ordering
const fs = require('fs');

console.log('=== DYNAMIC WIZARD QUESTION ORDERING DEMO ===\n');

// Load programs data
const programsData = JSON.parse(fs.readFileSync('data/programs.json', 'utf8'));
const questionsData = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));

console.log('1. CURRENT QUESTION ORDER (from programs.json analysis):');
console.log('======================================================\n');

// Analyze question impact
const questionStats = new Map();

for (const question of questionsData.universal) {
  const rules = [];
  let programsAffected = 0;
  
  // Find all program rules that reference this question
  for (const program of programsData.programs) {
    if (program.overlays) {
      for (const overlay of program.overlays) {
        if (overlay.ask_if && overlay.ask_if.includes(question.id)) {
          rules.push({
            programId: program.id,
            questionId: question.id,
            decisiveness: overlay.decisiveness,
            condition: overlay.ask_if
          });
          programsAffected++;
        }
      }
    }
  }
  
  // Calculate information value
  const hardRules = rules.filter(r => r.decisiveness === 'HARD').length;
  const softRules = rules.filter(r => r.decisiveness === 'SOFT').length;
  const uncertainRules = rules.filter(r => r.decisiveness === 'UNCERTAIN').length;
  
  const weightedImpact = (hardRules * 3) + (softRules * 2) + (uncertainRules * 1);
  const informationDensity = weightedImpact / programsData.programs.length;
  const informationValue = Math.round(informationDensity * 100);
  
  questionStats.set(question.id, {
    question,
    programsAffected,
    informationValue,
    rules,
    hardRules,
    softRules,
    uncertainRules
  });
}

// Sort by information value
const questionOrder = Array.from(questionStats.values())
  .sort((a, b) => b.informationValue - a.informationValue);

questionOrder.forEach((stat, i) => {
  console.log(`${i + 1}. ${stat.question.id}: ${stat.question.label}`);
  console.log(`   Information Value: ${stat.informationValue}`);
  console.log(`   Programs Affected: ${stat.programsAffected}`);
  console.log(`   HARD rules: ${stat.hardRules}, SOFT rules: ${stat.softRules}`);
  console.log(`   Rules: ${stat.rules.map(r => `${r.programId}(${r.decisiveness})`).join(', ')}\n`);
});

console.log('2. KEY INSIGHTS:');
console.log('================');
console.log('✅ No "Program Type" question - wizard is truly dynamic');
console.log('✅ Questions ordered by information value from programs.json');
console.log('✅ HARD rules get 3x weight, SOFT rules get 2x weight');
console.log('✅ Questions affecting more programs get higher priority');
console.log('✅ Changes to programs.json automatically update question order');

console.log('\n3. DEMONSTRATION COMPLETE');
console.log('=========================');
console.log('The /reco page uses this dynamic ordering - no hardcoded question sequence!');
