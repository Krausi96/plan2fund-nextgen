#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load personas
const personasPath = path.join(__dirname, '../tests/fixtures/personas.json');
const personasData = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
const personas = personasData.personas;

// Ensure artifacts directory exists
const artifactsDir = path.join(__dirname, '../artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

console.log('🚀 Starting Persona Replay Harness...');
console.log(`📊 Testing ${Object.keys(personas).length} personas`);

// Mock the enhanced recommendation engine functions for testing
function deriveSignals(answers) {
  const signals = {
    capexFlag: false,
    equityOk: false,
    collateralOk: false,
    urgencyBucket: "normal",
    companyAgeBucket: "pre",
    sectorBucket: "general",
    rdInAT: undefined,
    amountFit: 0,
    stageFit: 0,
    timelineFit: 0,
    fundingMode: "grant",
    trlBucket: "low",
    revenueBucket: "none",
    ipFlag: false,
    regulatoryFlag: false,
    socialImpactFlag: false,
    esgFlag: false,
    unknowns: [],
    counterfactuals: []
  };

  // Derive CAPEX flag from theme
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    signals.capexFlag = themes.some(theme => 
      ['INNOVATION_DIGITAL', 'MANUFACTURING', 'ENERGY'].includes(theme)
    );
  } else if (answers.q4_theme === undefined || answers.q4_theme === null) {
    signals.unknowns.push("q4_theme");
    signals.counterfactuals.push("Add project theme to unlock theme-specific programs");
  }

  // Derive equity preference from stage and size
  if (answers.q2_entity_stage && answers.q3_company_size) {
    const stage = answers.q2_entity_stage;
    const size = answers.q3_company_size;
    
    signals.equityOk = (
      (stage === 'PRE_COMPANY' || stage === 'INC_LT_6M' || stage === 'INC_6_36M') &&
      (size === 'MICRO_0_9' || size === 'SMALL_10_49')
    );
  } else {
    if (!answers.q2_entity_stage) {
      signals.unknowns.push("q2_entity_stage");
      signals.counterfactuals.push("Add company stage to qualify for stage-specific programs");
    }
    if (!answers.q3_company_size) {
      signals.unknowns.push("q3_company_size");
      signals.counterfactuals.push("Add team size to unlock size-specific programs");
    }
  }

  // Derive collateral capability
  if (answers.q2_entity_stage && answers.q3_company_size) {
    const stage = answers.q2_entity_stage;
    const size = answers.q3_company_size;
    
    signals.collateralOk = (
      (stage === 'INC_GT_36M' || stage === 'RESEARCH_ORG') &&
      (size === 'MEDIUM_50_249' || size === 'LARGE_250_PLUS')
    );
  }

  // Derive urgency
  if (answers.q2_entity_stage && answers.q5_maturity_trl) {
    const stage = answers.q2_entity_stage;
    const trl = answers.q5_maturity_trl;
    
    if (stage === 'PRE_COMPANY' || stage === 'INC_LT_6M') {
      signals.urgencyBucket = "urgent";
    } else if (stage === 'INC_6_36M' && (trl === 'TRL_3_4' || trl === 'TRL_5_6')) {
      signals.urgencyBucket = "soon";
    } else {
      signals.urgencyBucket = "normal";
    }
  }

  // Derive company age bucket
  if (answers.q2_entity_stage) {
    const stage = answers.q2_entity_stage;
    if (stage === 'PRE_COMPANY') {
      signals.companyAgeBucket = "pre";
    } else if (stage === 'INC_LT_6M' || stage === 'INC_6_36M') {
      signals.companyAgeBucket = "0-3y";
    } else {
      signals.companyAgeBucket = "3y+";
    }
  }

  // Derive sector bucket
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    if (themes.includes('HEALTH_LIFE_SCIENCE')) {
      signals.sectorBucket = "health";
    } else if (themes.includes('SUSTAINABILITY') || themes.includes('ENERGY')) {
      signals.sectorBucket = "sustainability";
    } else if (themes.includes('INNOVATION_DIGITAL')) {
      signals.sectorBucket = "tech";
    } else if (themes.includes('MANUFACTURING')) {
      signals.sectorBucket = "manufacturing";
    } else {
      signals.sectorBucket = "general";
    }
  }

  // Derive R&D in Austria flag
  if (answers.q6_rnd_in_at) {
    signals.rdInAT = answers.q6_rnd_in_at === 'YES';
  } else {
    signals.unknowns.push("q6_rnd_in_at");
    signals.counterfactuals.push("Specify R&D location to unlock location-specific programs");
  }

  // Derive TRL bucket
  if (answers.q5_maturity_trl) {
    const trl = answers.q5_maturity_trl;
    if (trl === 'TRL_1_2' || trl === 'TRL_3_4') {
      signals.trlBucket = "low";
    } else if (trl === 'TRL_5_6' || trl === 'TRL_7_8') {
      signals.trlBucket = "mid";
    } else if (trl === 'TRL_9') {
      signals.trlBucket = "high";
    }
  } else {
    signals.unknowns.push("q5_maturity_trl");
    signals.counterfactuals.push("Add technology readiness level to unlock TRL-specific programs");
  }

  // Derive revenue bucket
  if (answers.q2_entity_stage) {
    const stage = answers.q2_entity_stage;
    if (stage === 'PRE_COMPANY') {
      signals.revenueBucket = "none";
    } else if (stage === 'INC_LT_6M' || stage === 'INC_6_36M') {
      signals.revenueBucket = "low";
    } else {
      signals.revenueBucket = "medium";
    }
  }

  // Derive IP flag
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    signals.ipFlag = themes.some(theme => 
      ['INNOVATION_DIGITAL', 'HEALTH_LIFE_SCIENCE', 'MANUFACTURING'].includes(theme)
    );
  }

  // Derive regulatory flag
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    signals.regulatoryFlag = themes.some(theme => 
      ['HEALTH_LIFE_SCIENCE', 'ENERGY'].includes(theme)
    );
  }

  // Derive social impact flag
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    signals.socialImpactFlag = themes.some(theme => 
      ['SUSTAINABILITY', 'HEALTH_LIFE_SCIENCE'].includes(theme)
    );
  }
  if (answers.q10_env_benefit && answers.q10_env_benefit !== 'NONE') {
    signals.socialImpactFlag = true;
  }

  // Derive ESG flag
  if (answers.q4_theme && Array.isArray(answers.q4_theme)) {
    const themes = answers.q4_theme;
    signals.esgFlag = themes.some(theme => 
      ['SUSTAINABILITY', 'ENERGY'].includes(theme)
    );
  }
  if (answers.q10_env_benefit && (answers.q10_env_benefit === 'SOME' || answers.q10_env_benefit === 'HIGH')) {
    signals.esgFlag = true;
  }

  // Derive funding mode
  if (signals.equityOk && signals.companyAgeBucket === "pre") {
    signals.fundingMode = "equity";
  } else if (signals.collateralOk && signals.urgencyBucket === "urgent") {
    signals.fundingMode = "loan";
  } else if (signals.capexFlag && signals.rdInAT) {
    signals.fundingMode = "grant";
  } else if (signals.socialImpactFlag && signals.esgFlag) {
    signals.fundingMode = "grant";
  } else if (signals.regulatoryFlag && signals.trlBucket === "mid") {
    signals.fundingMode = "grant";
  } else {
    signals.fundingMode = "mixed";
  }

  // Calculate fit scores
  signals.amountFit = calculateAmountFit(answers, signals);
  signals.stageFit = calculateStageFit(answers, signals);
  signals.timelineFit = calculateTimelineFit(answers, signals);

  return signals;
}

function calculateAmountFit(answers, signals) {
  const baseScores = {
    "grant": 80,
    "loan": 70,
    "equity": 60,
    "mixed": 75
  };
  
  let score = baseScores[signals.fundingMode] || 50;
  
  if (signals.esgFlag && signals.socialImpactFlag) {
    score += 10;
  }
  
  if (signals.regulatoryFlag) {
    score += 5;
  }
  
  if (signals.unknowns.length > 0) {
    score -= signals.unknowns.length * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateStageFit(answers, signals) {
  let score = 70;
  
  if (signals.companyAgeBucket === "pre" && signals.fundingMode === "equity") score = 90;
  else if (signals.companyAgeBucket === "0-3y" && signals.fundingMode === "grant") score = 85;
  else if (signals.companyAgeBucket === "3y+" && signals.fundingMode === "loan") score = 80;
  
  if (signals.trlBucket === "mid" && signals.fundingMode === "grant") score += 10;
  if (signals.trlBucket === "high" && signals.fundingMode === "loan") score += 10;
  if (signals.ipFlag && signals.fundingMode === "equity") score += 5;
  
  if (signals.unknowns.includes("q2_entity_stage") || signals.unknowns.includes("q3_company_size")) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateTimelineFit(answers, signals) {
  let score = 60;
  
  if (signals.urgencyBucket === "urgent" && signals.fundingMode === "loan") score = 90;
  else if (signals.urgencyBucket === "soon" && signals.fundingMode === "grant") score = 80;
  else if (signals.urgencyBucket === "normal") score = 75;
  
  if (signals.regulatoryFlag && signals.fundingMode === "grant") score += 5;
  if (signals.esgFlag && signals.fundingMode === "grant") score += 5;
  
  if (signals.unknowns.includes("q5_maturity_trl")) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

function scoreProgramsEnhanced(answers, mode = 'explorer') {
  // Mock program scoring - in real implementation this would use actual programs
  const mockPrograms = [
    { id: 'program1', name: 'Austrian Innovation Grant', type: 'grant', score: 85 },
    { id: 'program2', name: 'EU Horizon Program', type: 'grant', score: 78 },
    { id: 'program3', name: 'Startup Equity Fund', type: 'equity', score: 72 },
    { id: 'program4', name: 'SME Loan Program', type: 'loan', score: 68 },
    { id: 'program5', name: 'ESG Impact Grant', type: 'grant', score: 75 }
  ];

  return mockPrograms.map(program => ({
    ...program,
    trace: {
      passed: [`Eligible for ${program.type} funding`],
      failed: [],
      warnings: answers.q4_theme === undefined ? ['⚪ Missing info: q4_theme - Project theme information'] : [],
      counterfactuals: ['Consider additional programs', 'Review eligibility requirements']
    }
  })).sort((a, b) => b.score - a.score);
}

const replayResults = [];

// Run all personas through the engine
for (const [personaId, persona] of Object.entries(personas)) {
  console.log(`\n🔍 Testing persona: ${persona.name}`);
  
  try {
    // Derive signals from persona answers
    const derivedSignals = deriveSignals(persona.answers);
    
    // Score programs with enhanced engine
    const scoredPrograms = scoreProgramsEnhanced(persona.answers, 'explorer');
    
    // Create result entry
    const result = {
      personaId,
      persona: {
        name: persona.name,
        description: persona.description,
        general: persona.general,
        stage: persona.stage,
        funding: persona.funding,
        timeline: persona.timeline,
        special: persona.special,
        completeness: persona.completeness
      },
      answers: persona.answers,
      derivedSignals,
      recommendations: scoredPrograms.slice(0, 5), // Top 5 recommendations
      unknowns: derivedSignals.unknowns,
      counterfactuals: derivedSignals.counterfactuals,
      timestamp: new Date().toISOString()
    };
    
    replayResults.push(result);
    
    console.log(`  ✅ Processed - ${scoredPrograms.length} programs evaluated`);
    console.log(`  📈 Top match: ${scoredPrograms[0]?.name} (${scoredPrograms[0]?.score}%)`);
    console.log(`  ⚪ Unknowns: ${derivedSignals.unknowns.length}`);
    console.log(`  💡 Counterfactuals: ${derivedSignals.counterfactuals.length}`);
    
  } catch (error) {
    console.error(`  ❌ Error processing ${persona.name}:`, error);
    replayResults.push({
      personaId,
      persona: { name: persona.name },
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Save results to artifacts
console.log('\n💾 Saving results to artifacts...');

// Save structured JSON results
const jsonPath = path.join(artifactsDir, 'replay.json');
fs.writeFileSync(jsonPath, JSON.stringify({
  metadata: {
    version: '1.0',
    generated: new Date().toISOString(),
    totalPersonas: replayResults.length,
    personasWithUnknowns: replayResults.filter(r => r.unknowns && r.unknowns.length > 0).length,
    personasWithErrors: replayResults.filter(r => r.error).length
  },
  results: replayResults
}, null, 2));

console.log(`✅ Saved structured results to: ${jsonPath}`);

// Generate human-readable markdown report
const mdPath = path.join(artifactsDir, 'replay.md');
const markdown = generateMarkdownReport(replayResults);
fs.writeFileSync(mdPath, markdown);

console.log(`📄 Saved markdown report to: ${mdPath}`);

// Summary statistics
const personasWithUnknowns = replayResults.filter(r => r.unknowns && r.unknowns.length > 0);
const personasWithErrors = replayResults.filter(r => r.error);
const totalRecommendations = replayResults.reduce((sum, r) => sum + (r.recommendations?.length || 0), 0);

console.log('\n📊 Summary Statistics:');
console.log(`- Total Personas: ${replayResults.length}`);
console.log(`- Personas with Unknowns: ${personasWithUnknowns.length}`);
console.log(`- Personas with Errors: ${personasWithErrors.length}`);
console.log(`- Total Recommendations: ${totalRecommendations}`);

console.log('\n✅ Replay harness completed successfully!');

// Generate human-readable markdown report
function generateMarkdownReport(replayResults) {
  let markdown = `# Persona Replay Results\n\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Total Personas:** ${replayResults.length}\n\n`;
  
  // Summary statistics
  const personasWithUnknowns = replayResults.filter(r => r.unknowns && r.unknowns.length > 0);
  const personasWithErrors = replayResults.filter(r => r.error);
  const totalRecommendations = replayResults.reduce((sum, r) => sum + (r.recommendations?.length || 0), 0);
  
  markdown += `## Summary\n\n`;
  markdown += `- **Personas with Unknowns:** ${personasWithUnknowns.length}\n`;
  markdown += `- **Personas with Errors:** ${personasWithErrors.length}\n`;
  markdown += `- **Total Recommendations:** ${totalRecommendations}\n\n`;
  
  // Per-persona results
  markdown += `## Persona Results\n\n`;
  
  replayResults.forEach((result, index) => {
    markdown += `### ${index + 1}. ${result.persona?.name || result.personaId}\n\n`;
    
    if (result.error) {
      markdown += `❌ **Error:** ${result.error}\n\n`;
      return;
    }
    
    markdown += `**Description:** ${result.persona?.description || 'N/A'}\n\n`;
    
    // Derived signals summary
    if (result.derivedSignals) {
      markdown += `**Derived Signals:**\n`;
      markdown += `- Funding Mode: ${result.derivedSignals.fundingMode}\n`;
      markdown += `- Sector: ${result.derivedSignals.sectorBucket}\n`;
      markdown += `- Urgency: ${result.derivedSignals.urgencyBucket}\n`;
      markdown += `- Company Age: ${result.derivedSignals.companyAgeBucket}\n`;
      markdown += `- TRL: ${result.derivedSignals.trlBucket}\n`;
      markdown += `- Revenue: ${result.derivedSignals.revenueBucket}\n`;
      markdown += `- IP Flag: ${result.derivedSignals.ipFlag ? 'Yes' : 'No'}\n`;
      markdown += `- Regulatory: ${result.derivedSignals.regulatoryFlag ? 'Yes' : 'No'}\n`;
      markdown += `- Social Impact: ${result.derivedSignals.socialImpactFlag ? 'Yes' : 'No'}\n`;
      markdown += `- ESG: ${result.derivedSignals.esgFlag ? 'Yes' : 'No'}\n\n`;
    }
    
    // Unknowns and counterfactuals
    if (result.unknowns && result.unknowns.length > 0) {
      markdown += `**Unknown Variables:**\n`;
      result.unknowns.forEach(unknown => {
        markdown += `- ⚪ ${unknown}\n`;
      });
      markdown += `\n`;
    }
    
    if (result.counterfactuals && result.counterfactuals.length > 0) {
      markdown += `**Counterfactuals:**\n`;
      result.counterfactuals.forEach(counterfactual => {
        markdown += `- 💡 ${counterfactual}\n`;
      });
      markdown += `\n`;
    }
    
    // Top recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      markdown += `**Top Recommendations:**\n`;
      result.recommendations.slice(0, 3).forEach((rec, i) => {
        markdown += `${i + 1}. **${rec.name}** (${rec.score}%)\n`;
        if (rec.trace && rec.trace.warnings && rec.trace.warnings.length > 0) {
          markdown += `   - Warnings: ${rec.trace.warnings.length}\n`;
        }
        if (rec.trace && rec.trace.counterfactuals && rec.trace.counterfactuals.length > 0) {
          markdown += `   - Counterfactuals: ${rec.trace.counterfactuals.length}\n`;
        }
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  return markdown;
}
