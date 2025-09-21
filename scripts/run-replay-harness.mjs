#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the enhanced recommendation engine
const { deriveSignals, scoreProgramsEnhanced } = await import('../src/lib/enhancedRecoEngine.js');

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
