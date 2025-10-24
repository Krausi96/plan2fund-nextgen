const fs = require('fs');

// Load the program data
const programData = JSON.parse(fs.readFileSync('data/scraped-programs-latest.json', 'utf8'));
const programs = programData.programs || [];

console.log('=== QUESTION FLOW DEBUG ===');
console.log(`📊 Total programs: ${programs.length}`);

// Simulate the question generation logic
const questions = [];
let questionNumber = 1;

// Question 1: Location
questions.push({
  id: 'location',
  questionNumber: questionNumber++,
  symptom: 'Where is your organization located?'
});

// Question 2: Organization Type  
questions.push({
  id: 'organization_type',
  questionNumber: questionNumber++,
  symptom: 'What type of organization are you?'
});

// Question 3: Funding Amount
questions.push({
  id: 'funding_amount', 
  questionNumber: questionNumber++,
  symptom: 'How much funding do you need?'
});

// Question 4: Business Stage
questions.push({
  id: 'business_stage',
  questionNumber: questionNumber++,
  symptom: 'What is your business development stage?'
});

// Question 5: Main Goal
questions.push({
  id: 'main_goal',
  questionNumber: questionNumber++,
  symptom: 'What is your main goal?'
});

console.log('\n=== GENERATED QUESTIONS ===');
questions.forEach((q, index) => {
  console.log(`${index + 1}. ${q.id} (Question ${q.questionNumber}): ${q.symptom}`);
});

console.log('\n=== TESTING QUESTION FLOW ===');
const answers = {};

// Simulate answering questions
for (let i = 0; i < 6; i++) {
  const currentQuestion = questions[i];
  if (!currentQuestion) {
    console.log(`❌ No question ${i + 1} available`);
    break;
  }
  
  console.log(`\n🔍 Question ${i + 1}: ${currentQuestion.symptom}`);
  console.log(`   ID: ${currentQuestion.id}`);
  console.log(`   Question Number: ${currentQuestion.questionNumber}`);
  
  // Simulate answer
  answers[currentQuestion.id] = `answer_${i + 1}`;
  console.log(`   ✅ Answered: ${answers[currentQuestion.id]}`);
  
  // Check if we should stop
  if (Object.keys(answers).length >= 5) {
    console.log(`   🛑 Should stop after ${Object.keys(answers).length} answers`);
    break;
  }
}

console.log('\n=== FINAL ANSWERS ===');
console.log(answers);
