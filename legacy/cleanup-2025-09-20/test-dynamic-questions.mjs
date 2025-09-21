import { dynamicQuestionEngine } from './src/lib/dynamicQuestionEngine.ts';

console.log('=== DYNAMIC QUESTION ENGINE TEST ===\n');

// Test core questions
const coreQuestions = dynamicQuestionEngine.getCoreQuestions();
console.log(`Core Questions: ${coreQuestions.length}`);
coreQuestions.forEach((q, i) => {
  console.log(`  ${i + 1}. ${q.id} (UX: ${q.uxWeight}, Info: ${q.informationValue}%, Programs: ${q.programsAffected})`);
});

// Test overlay questions
const overlayQuestions = dynamicQuestionEngine.getOverlayQuestions();
console.log(`\nOverlay Questions: ${overlayQuestions.length}`);
overlayQuestions.forEach((q, i) => {
  console.log(`  ${i + 1}. ${q.id} (UX: ${q.uxWeight}, Info: ${q.informationValue}%, Programs: ${q.programsAffected})`);
});

// Test question ordering
console.log('\nQuestion Order:');
const allQuestions = dynamicQuestionEngine.getQuestionOrder();
allQuestions.forEach((q, i) => {
  const type = q.isCoreQuestion ? 'CORE' : 'OVERLAY';
  console.log(`  ${i + 1}. ${q.id} (${type}, UX: ${q.uxWeight}, Info: ${q.informationValue}%)`);
});

console.log('\n✅ Dynamic Question Engine Test Complete');
