#!/usr/bin/env node

/**
 * Test Funding Type Diversity
 * Tests multiple personas to check if we're getting diverse funding types
 * and not biased toward only grants/loans/equity/guarantees
 */

const DEFAULT_BASE_URL = 'http://localhost:3000';
const baseUrl = (process.env.RECO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

// All funding types we should support
const ALL_FUNDING_TYPES = {
  financial: ['grant', 'loan', 'equity', 'guarantee', 'subsidy', 'convertible', 'venture_capital', 'angel_investment', 'crowdfunding'],
  support: ['coaching', 'mentoring', 'networking', 'acceleration_program'],
  specialized: ['export_support', 'innovation_support'],
};

// Test personas that should trigger different funding types
const testPersonas = [
  {
    name: 'Grant Only (co_no)',
    answers: {
      location: 'austria',
      company_type: 'startup',
      company_stage: 'inc_lt_6m',
      funding_amount: 50000,
      industry_focus: ['digital'],
      co_financing: 'co_no',
    },
    expectedTypes: ['grant', 'subsidy'], // Should only see grants/subsidies
  },
  {
    name: 'Full Mix (co_yes, early stage)',
    answers: {
      location: 'germany',
      company_type: 'startup',
      company_stage: 'inc_6_36m',
      funding_amount: 200000,
      industry_focus: ['digital'],
      co_financing: 'co_yes',
    },
    expectedTypes: ['grant', 'loan', 'equity', 'guarantee'], // Should see mix
  },
  {
    name: 'Support Services Needed',
    answers: {
      location: 'germany',
      company_type: 'prefounder',
      company_stage: 'pre_company',
      funding_amount: 30000,
      industry_focus: ['digital'],
      co_financing: 'co_no',
      use_of_funds: ['product_development'],
    },
    expectedTypes: ['grant', 'coaching', 'mentoring', 'networking'], // Should see support types
  },
  {
    name: 'Export Focus',
    answers: {
      location: 'germany',
      company_type: 'sme',
      company_stage: 'inc_gt_36m',
      funding_amount: 150000,
      industry_focus: ['export'],
      co_financing: 'co_yes',
    },
    expectedTypes: ['grant', 'loan', 'export_support'], // Should see export support
  },
  {
    name: 'Innovation Focus',
    answers: {
      location: 'austria',
      company_type: 'startup',
      company_stage: 'inc_6_36m',
      funding_amount: 100000,
      industry_focus: ['digital'],
      co_financing: 'co_yes',
    },
    expectedTypes: ['grant', 'loan', 'innovation_support'], // Should see innovation support
  },
  {
    name: 'Scaleup with Equity',
    answers: {
      location: 'eu',
      company_type: 'startup',
      company_stage: 'inc_gt_36m',
      funding_amount: 750000,
      industry_focus: ['sustainability'],
      co_financing: 'co_yes',
    },
    expectedTypes: ['grant', 'loan', 'equity', 'venture_capital', 'angel_investment'], // Should see equity types
  },
];

async function testPersona(persona) {
  const url = `${baseUrl}/api/programs/recommend`;
  const payload = { answers: persona.answers, max_results: 10 };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    const programs = Array.isArray(data.programs) ? data.programs : [];
    
    // Collect all funding types
    const allTypes = new Set();
    const typeCounts = {};
    
    programs.forEach((p) => {
      const types = p.funding_types || p.metadata?.funding_types || [];
      types.forEach((type) => {
        allTypes.add(type);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
    });
    
    // Categorize types
    const financial = [];
    const support = [];
    const specialized = [];
    const other = [];
    
    allTypes.forEach((type) => {
      if (ALL_FUNDING_TYPES.financial.includes(type)) {
        financial.push(type);
      } else if (ALL_FUNDING_TYPES.support.includes(type)) {
        support.push(type);
      } else if (ALL_FUNDING_TYPES.specialized.includes(type)) {
        specialized.push(type);
      } else {
        other.push(type);
      }
    });
    
    return {
      persona: persona.name,
      programCount: programs.length,
      totalTypes: allTypes.size,
      typeCounts,
      financial,
      support,
      specialized,
      other,
      fallbackUsed: data.debug?.fallbackUsed || false,
      expectedTypes: persona.expectedTypes,
    };
  } catch (error) {
    return {
      persona: persona.name,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🧪 Testing Funding Type Diversity\n');
  console.log('='.repeat(80));
  
  const results = [];
  for (const persona of testPersonas) {
    console.log(`\n📋 Testing: ${persona.name}`);
    const result = await testPersona(persona);
    results.push(result);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
      continue;
    }
    
    console.log(`   Programs: ${result.programCount}`);
    console.log(`   Total funding types: ${result.totalTypes}`);
    console.log(`   Financial types: ${result.financial.length > 0 ? result.financial.join(', ') : 'None'}`);
    console.log(`   Support types: ${result.support.length > 0 ? result.support.join(', ') : 'None'}`);
    console.log(`   Specialized types: ${result.specialized.length > 0 ? result.specialized.join(', ') : 'None'}`);
    console.log(`   Other types: ${result.other.length > 0 ? result.other.join(', ') : 'None'}`);
    console.log(`   Type distribution:`, result.typeCounts);
    console.log(`   Fallback used: ${result.fallbackUsed ? 'Yes' : 'No'}`);
    
    // Check if expected types are present
    const missingExpected = persona.expectedTypes.filter(et => !result.financial.includes(et) && !result.support.includes(et) && !result.specialized.includes(et));
    if (missingExpected.length > 0) {
      console.log(`   ⚠️  Missing expected types: ${missingExpected.join(', ')}`);
    }
  }
  
  // Summary analysis
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIVERSITY ANALYSIS');
  console.log('='.repeat(80));
  
  const allTypesSeen = new Set();
  const typeFrequency = {};
  
  results.forEach((r) => {
    if (r.error) return;
    Object.keys(r.typeCounts).forEach((type) => {
      allTypesSeen.add(type);
      typeFrequency[type] = (typeFrequency[type] || 0) + r.typeCounts[type];
    });
  });
  
  console.log(`\n📦 All Funding Types Seen (${allTypesSeen.size}):`);
  Array.from(allTypesSeen).sort().forEach((type) => {
    const category = 
      ALL_FUNDING_TYPES.financial.includes(type) ? 'Financial' :
      ALL_FUNDING_TYPES.support.includes(type) ? 'Support' :
      ALL_FUNDING_TYPES.specialized.includes(type) ? 'Specialized' :
      'Other';
    console.log(`   - ${type} (${category}) - ${typeFrequency[type]} mentions`);
  });
  
  console.log(`\n📋 Expected Types (${Object.values(ALL_FUNDING_TYPES).flat().length} total):`);
  console.log(`   Financial (${ALL_FUNDING_TYPES.financial.length}): ${ALL_FUNDING_TYPES.financial.join(', ')}`);
  console.log(`   Support (${ALL_FUNDING_TYPES.support.length}): ${ALL_FUNDING_TYPES.support.join(', ')}`);
  console.log(`   Specialized (${ALL_FUNDING_TYPES.specialized.length}): ${ALL_FUNDING_TYPES.specialized.join(', ')}`);
  
  const missingTypes = Object.values(ALL_FUNDING_TYPES).flat().filter(t => !allTypesSeen.has(t));
  if (missingTypes.length > 0) {
    console.log(`\n⚠️  Missing Types (${missingTypes.length}): ${missingTypes.join(', ')}`);
    console.log(`   These types are supported but not appearing in results - potential bias!`);
  } else {
    console.log(`\n✅ All types are being used!`);
  }
  
  // Check for bias
  console.log(`\n🔍 BIAS CHECK:`);
  const grantCount = typeFrequency['grant'] || 0;
  const loanCount = typeFrequency['loan'] || 0;
  const equityCount = typeFrequency['equity'] || 0;
  const guaranteeCount = typeFrequency['guarantee'] || 0;
  const supportCount = Object.keys(typeFrequency).filter(t => ALL_FUNDING_TYPES.support.includes(t)).reduce((sum, t) => sum + (typeFrequency[t] || 0), 0);
  const specializedCount = Object.keys(typeFrequency).filter(t => ALL_FUNDING_TYPES.specialized.includes(t)).reduce((sum, t) => sum + (typeFrequency[t] || 0), 0);
  
  const total = Object.values(typeFrequency).reduce((sum, count) => sum + count, 0);
  
  console.log(`   Grants: ${grantCount} (${total > 0 ? ((grantCount / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Loans: ${loanCount} (${total > 0 ? ((loanCount / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Equity: ${equityCount} (${total > 0 ? ((equityCount / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Guarantees: ${guaranteeCount} (${total > 0 ? ((guaranteeCount / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Support: ${supportCount} (${total > 0 ? ((supportCount / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Specialized: ${specializedCount} (${total > 0 ? ((specializedCount / total) * 100).toFixed(1) : 0}%)`);
  
  if (grantCount > total * 0.5) {
    console.log(`   ⚠️  GRANT BIAS: Grants are >50% of all types`);
  }
  if (supportCount === 0 && specializedCount === 0) {
    console.log(`   ⚠️  MISSING SUPPORT/SPECIALIZED: No support or specialized types found`);
  }
  
  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);




