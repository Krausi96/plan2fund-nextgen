// Demo script to show dynamic wizard behavior before and after rule changes
const fs = require('fs');
const path = require('path');

// Load the dynamic wizard
const { dynamicWizard } = require('../src/lib/dynamicWizard.ts');

console.log('=== DYNAMIC WIZARD DEMONSTRATION ===\n');

// Show current question order
console.log('1. CURRENT QUESTION ORDER:');
const currentOrder = dynamicWizard.getQuestionOrderSummary();
currentOrder.forEach((q, i) => {
  console.log(`   ${i + 1}. ${q.id}: ${q.label}`);
  console.log(`      Information Value: ${q.informationValue}, Programs Affected: ${q.programsAffected}`);
  console.log(`      Reason: ${q.reason}\n`);
});

// Simulate changing a HARD rule for AWS Preseed program
console.log('2. SIMULATING HARD RULE CHANGE:');
console.log('   Adding new HARD rule for q9_team_diversity to AWS Preseed program...\n');

const newOverlay = {
  "ask_if": "answers.q9_team_diversity == 'YES'",
  "question": "Will women own >25% of shares at grant award?",
  "decisiveness": "HARD",
  "rationale": "Gender diversity requirement for eligibility",
  "evidence_links": ["https://www.aws.at/en/aws-preseed-innovative-solutions/"],
  "last_checked": "2025-01-15"
};

const newOrder = dynamicWizard.simulateRuleChange('aws_preseed_innovative_solutions', newOverlay);

console.log('3. NEW QUESTION ORDER AFTER RULE CHANGE:');
newOrder.forEach((q, i) => {
  console.log(`   ${i + 1}. ${q.id}: ${q.label}`);
  console.log(`      Information Value: ${q.informationValue}, Programs Affected: ${q.programsAffected}\n`);
});

// Show the difference
console.log('4. CHANGES DETECTED:');
const changes = [];
for (let i = 0; i < Math.max(currentOrder.length, newOrder.length); i++) {
  const current = currentOrder[i];
  const updated = newOrder[i];
  
  if (!current || !updated || current.id !== updated.id) {
    changes.push({
      position: i + 1,
      before: current?.id || 'N/A',
      after: updated?.id || 'N/A',
      change: current?.id !== updated?.id ? 'MOVED' : 'UNCHANGED'
    });
  }
}

changes.forEach(change => {
  if (change.change === 'MOVED') {
    console.log(`   Position ${change.position}: ${change.before} → ${change.after}`);
  }
});

console.log('\n=== DEMONSTRATION COMPLETE ===');
