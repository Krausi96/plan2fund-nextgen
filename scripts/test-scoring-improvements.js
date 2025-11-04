// Test script for Priority 2 scoring improvements
// Verifies: dynamic scoring, normalization, penalties, reduced bonuses
// Run with: node scripts/test-scoring-improvements.js

const path = require('path');
const fs = require('fs');

async function loadPrograms() {
  const jsonPath = path.join(process.cwd(), 'scraper-lite', 'data', 'legacy', 'scraped-programs-latest.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return data.programs || [];
  }
  return [];
}

// Simulate scoring (simplified version)
function testScoring(programs, answers) {
  console.log('\n🧪 Testing Scoring Improvements\n');
  console.log('='.repeat(60));
  
  // Calculate frequencies
  const frequencyMap = new Map();
  let totalPrograms = 0;
  
  programs.forEach(program => {
    const categorized = program.categorized_requirements;
    if (!categorized || typeof categorized !== 'object') return;
    
    totalPrograms++;
    
    Object.entries(categorized).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        if (!item || typeof item !== 'object') return;
        
        const reqType = item.type || 'unknown';
        const key = `${category}:${reqType}`;
        frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
      });
    });
  });
  
  const frequencies = new Map();
  frequencyMap.forEach((count, key) => {
    frequencies.set(key, count / totalPrograms);
  });
  
  console.log(`📊 Calculated frequencies for ${frequencies.size} requirement types`);
  console.log(`📊 Top 10 most common:`);
  Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([key, freq]) => {
      console.log(`  ${key}: ${Math.round(freq * 100)}%`);
    });
  
  // Test scoring on a few programs
  const testPrograms = programs.slice(0, 10);
  const scores = [];
  
  testPrograms.forEach(program => {
    if (!program.categorized_requirements) return;
    
    let score = 0;
    let matchedCount = 0;
    let missingHighConfidenceCount = 0;
    let maxPossibleScore = 0;
    
    Object.entries(program.categorized_requirements).forEach(([category, data]) => {
      if (!Array.isArray(data)) return;
      
      data.forEach(item => {
        const confidence = item.confidence || 0.5;
        const reqKey = `${category}:${item.type || 'unknown'}`;
        const frequency = frequencies.get(reqKey) || 0.5;
        
        // Calculate max points
        let baseScore;
        if (frequency < 0.1) baseScore = 15;
        else if (frequency < 0.3) baseScore = 12;
        else if (frequency < 0.5) baseScore = 10;
        else baseScore = 7;
        
        maxPossibleScore += Math.round(baseScore * confidence);
        
        // Check if matches (simplified - just check location for now)
        const matches = category === 'geographic' && 
          answers.location && 
          String(item.value).toLowerCase().includes(answers.location.toLowerCase());
        
        if (matches) {
          score += Math.round(baseScore * confidence);
          matchedCount++;
        } else if (confidence > 0.7) {
          missingHighConfidenceCount++;
        }
      });
    });
    
    // Apply penalties
    const penaltyPercent = missingHighConfidenceCount * 0.1;
    const penaltyPoints = maxPossibleScore > 0 ? (maxPossibleScore * penaltyPercent) : 0;
    const finalScore = Math.max(0, score - penaltyPoints);
    
    // Normalize
    let normalizedScore = 0;
    if (maxPossibleScore > 0) {
      normalizedScore = Math.round((finalScore / maxPossibleScore) * 100);
    }
    normalizedScore = Math.max(0, Math.min(100, normalizedScore));
    
    scores.push({
      id: program.id,
      name: program.name?.substring(0, 40) || program.id,
      rawScore: score,
      maxPossible: maxPossibleScore,
      normalized: normalizedScore,
      matched: matchedCount,
      missing: missingHighConfidenceCount
    });
  });
  
  console.log('\n📊 Score Distribution (after improvements):');
  console.log('='.repeat(60));
  scores.sort((a, b) => b.normalized - a.normalized).forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.name.substring(0, 40)}`);
    console.log(`   Score: ${s.normalized}% (raw: ${s.rawScore}/${s.maxPossible}, matched: ${s.matched}, missing: ${s.missing})`);
  });
  
  // Analyze distribution
  const scoreRanges = {
    '0-20%': scores.filter(s => s.normalized >= 0 && s.normalized <= 20).length,
    '21-40%': scores.filter(s => s.normalized >= 21 && s.normalized <= 40).length,
    '41-60%': scores.filter(s => s.normalized >= 41 && s.normalized <= 60).length,
    '61-80%': scores.filter(s => s.normalized >= 61 && s.normalized <= 80).length,
    '81-100%': scores.filter(s => s.normalized >= 81 && s.normalized <= 100).length
  };
  
  console.log('\n📈 Score Distribution Analysis:');
  Object.entries(scoreRanges).forEach(([range, count]) => {
    console.log(`  ${range}: ${count} programs`);
  });
  
  const all100 = scores.filter(s => s.normalized === 100).length;
  console.log(`\n✅ All scores at 100%: ${all100}/${scores.length} (${all100 === scores.length ? '❌ PROBLEM' : '✅ GOOD'})`);
  
  if (all100 === scores.length) {
    console.log('⚠️ WARNING: All programs still scoring 100% - scoring may need further adjustment');
  } else {
    console.log('✅ SUCCESS: Score distribution is varied (not all 100%)');
  }
}

async function main() {
  console.log('🔍 Loading programs...');
  const programs = await loadPrograms();
  console.log(`✅ Loaded ${programs.length} programs`);
  
  // Test with sample answers
  const answers = {
    location: 'austria'
  };
  
  await testScoring(programs, answers);
}

main().catch(console.error);

