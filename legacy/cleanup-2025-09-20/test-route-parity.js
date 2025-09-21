// Test script for route parity between Wizard and Advanced Search
const { scoreProgramsEnhanced } = require('./src/lib/enhancedRecoEngine.ts');

// Vienna, MVP, team 3, healthtech, €150k profile
const testAnswers = {
  q1_country: 'AT',
  q2_entity_stage: 'INC_LT_6M', 
  q3_company_size: 'MICRO_0_9',
  q4_theme: 'HEALTH_LIFE_SCIENCE',
  q5_maturity_trl: 'TRL_3_4',
  q6_rnd_in_at: 'YES',
  q7_collaboration: 'WITH_RESEARCH',
  q8_funding_types: 'GRANT',
  q9_team_diversity: 'YES',
  q10_env_benefit: 'SOME'
};

console.log('Testing Vienna MVP healthtech profile...');
console.log('Answers:', JSON.stringify(testAnswers, null, 2));

try {
  const results = scoreProgramsEnhanced(testAnswers, 'strict');
  console.log('\nResults count:', results.length);
  console.log('\nTop 3 results:');
  results.slice(0, 3).forEach((r, i) => {
    console.log(`${i+1}. ${r.name} - Score: ${r.score}`);
    if (r.matchedCriteria) {
      console.log(`   Matched criteria: ${r.matchedCriteria.length}`);
    }
  });
} catch (error) {
  console.error('Error:', error.message);
}
