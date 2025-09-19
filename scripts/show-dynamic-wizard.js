// Simple script to demonstrate dynamic wizard behavior
const fs = require('fs');

// Load programs and questions data
const programsData = JSON.parse(fs.readFileSync('data/programs.json', 'utf8'));
const questionsData = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));

console.log('=== DYNAMIC WIZARD DEMONSTRATION ===\n');

// Simulate the dynamic wizard logic
function calculateQuestionOrder() {
  const questionStats = new Map();
  
  // Analyze each question's impact on programs
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
  return Array.from(questionStats.values())
    .sort((a, b) => b.informationValue - a.informationValue);
}

const questionOrder = calculateQuestionOrder();

console.log('QUESTION ORDER (sorted by information value):');
console.log('============================================\n');

questionOrder.forEach((stat, i) => {
  console.log(`${i + 1}. ${stat.question.id}: ${stat.question.label}`);
  console.log(`   Information Value: ${stat.informationValue}`);
  console.log(`   Programs Affected: ${stat.programsAffected}`);
  console.log(`   HARD rules: ${stat.hardRules}, SOFT rules: ${stat.softRules}, UNCERTAIN rules: ${stat.uncertainRules}`);
  console.log(`   Rules: ${stat.rules.map(r => `${r.programId}(${r.decisiveness})`).join(', ')}\n`);
});

console.log('=== KEY INSIGHTS ===');
console.log('1. Questions with more HARD rules get higher priority');
console.log('2. Questions affecting more programs get higher priority');
console.log('3. The dynamic wizard adapts to program rule changes automatically');
console.log('4. No "Program Type" question - wizard is truly dynamic based on actual rules');
