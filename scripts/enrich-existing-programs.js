/**
 * Script to enrich existing scraped programs with categorized_requirements
 * This applies the new extraction logic to existing data
 */

const fs = require('fs');
const path = require('path');

// Mock the extraction functions (same logic as webScraperService.ts)
function extractRichEligibilityCriteria(description, content) {
  const criteria = {};
  const text = (description + ' ' + content).toLowerCase();
  
  try {
    // Extract team size requirements
    const teamMatch = text.match(/team\s+(?:size|of|minimum|at least|ab)\s*(?:is|von)?\s*(\d+)/i) ||
                     text.match(/(\d+)\s*(?:personen|person|people|team\s+members)/i) ||
                     text.match(/minimum\s*(\d+)\s*(?:personen|person|people)/i);
    if (teamMatch) {
      criteria.min_team_size = parseInt(teamMatch[1]);
    } else if (text.includes('team')) {
      criteria.min_team_size = 2; // Default minimum
    }
    
    // Extract company age requirements
    const ageMatch = text.match(/company\s+(?:age|foundation|gründung|besteht)\s*(?:maximum|max|maximal|bis|up to)\s*(\d+)\s*years?/i) ||
                    text.match(/(\d+)\s*years?\s*(?:old|alt|bestehend)/i) ||
                    text.match(/startup.*?(?:up to|bis|maximum)\s*(\d+)\s*years?/i);
    if (ageMatch) {
      criteria.max_company_age = parseInt(ageMatch[1]);
    } else if (text.includes('startup') || text.includes('jung')) {
      criteria.max_company_age = 5; // Default for startups
    }
    
    // Extract location requirements
    if (text.includes('austria') || text.includes('österreich') || text.includes('vienna') || text.includes('wien')) {
      criteria.location = 'Austria';
    }
    
    // Extract revenue requirements
    const revenueMatch = text.match(/revenue\s*(?:minimum|min|von|ab|at least)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*€/i) ||
                        text.match(/umsatz\s*(?:von|ab|minimum|min)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*€/i);
    if (revenueMatch) {
      criteria.revenue_min = parseFloat(revenueMatch[1].replace(/,/g, ''));
    }
    
    const revenueMaxMatch = text.match(/revenue\s*(?:maximum|max|bis|up to)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*€/i);
    if (revenueMaxMatch) {
      criteria.revenue_max = parseFloat(revenueMaxMatch[1].replace(/,/g, ''));
    }
    
    // Extract innovation/research focus
    const researchKeywords = ['forschung', 'research', 'innovation', 'develop', 'entwicklung', 'rd&i', 'r&d'];
    if (researchKeywords.some(keyword => text.includes(keyword))) {
      criteria.research_focus = true;
    }
    
    // Extract international collaboration requirement
    if (text.includes('international') || text.includes('european') || text.includes('europäisch') || 
        text.includes('collaboration') || text.includes('kooperation') || text.includes('partner')) {
      criteria.international_collaboration = true;
    }
    
    // Extract industry focus
    const industries = [
      { keyword: /technolog/i, type: 'technology' },
      { keyword: /health|gesundheit|medizin/i, type: 'healthcare' },
      { keyword: /energy|energie/i, type: 'energy' },
      { keyword: /digital|software|it/i, type: 'digital_services' },
      { keyword: /manufacturing|production|fertigung/i, type: 'manufacturing' },
      { keyword: /agriculture|landwirtschaft/i, type: 'agriculture' },
      { keyword: /biotech|biotechnologie/i, type: 'biotechnology' },
      { keyword: /fintech|financial/i, type: 'fintech' },
    ];
    
    for (const { keyword, type } of industries) {
      if (keyword.test(text)) {
        criteria.industry_focus = type;
        break;
      }
    }
    
    // Extract TRL (Technology Readiness Level)
    const trlMatch = text.match(/trl\s*(\d+)/i) || text.match(/readiness\s+level\s*(\d+)/i);
    if (trlMatch) {
      criteria.trl_level = parseInt(trlMatch[1]);
    }
    
    // Extract funding amount needed
    const fundingMatch = text.match(/funding\s*(?:needed|required|benötigt)\s*(?:up to|bis|von)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*€/i);
    if (fundingMatch) {
      criteria.funding_amount_needed = parseFloat(fundingMatch[1].replace(/,/g, ''));
    }
    
    // Extract co-financing requirement
    const coFinancingMatch = text.match(/(\d+)%\s*(?:co-?financing|eigenmittel|eigenkapital)/i);
    if (coFinancingMatch) {
      criteria.co_financing_percent = parseInt(coFinancingMatch[1]);
    }
    
    // Extract patent/IP requirement
    if (text.includes('patent') || text.includes('intellectual property') || text.includes('geistiges eigentum')) {
      criteria.intellectual_property_required = true;
    }
    
    // Extract market stage
    if (text.includes('prototype') || text.includes('early stage') || text.includes('frühe phase')) {
      criteria.market_stage = 'prototype';
    } else if (text.includes('pilot') || text.includes('test') || text.includes('validierung')) {
      criteria.market_stage = 'pilot';
    } else if (text.includes('launched') || text.includes('market') || text.includes('established') || text.includes('etabliert')) {
      criteria.market_stage = 'market';
    }
    
    // Extract project type
    if (text.includes('research') || text.includes('forschung') || text.includes('develop')) {
      criteria.project_type = 'research';
    } else if (text.includes('commercial') || text.includes('marketing') || text.includes('kommerziell')) {
      criteria.project_type = 'commercial';
    }
    
    return criteria;
    
  } catch (error) {
    console.warn('⚠️ Rich eligibility extraction failed:', error);
    return {
      min_team_size: 1,
      max_company_age: 10,
      location: 'Austria'
    };
  }
}

function generateCategorizedRequirements(description, eligibility) {
  const text = (description || '').toLowerCase();
  const categorized = {
    geographic: [],
    team: [],
    project: [],
    technical: [],
    financial: [],
    business: [],
    innovation: [],
    legal: [],
    compliance: [],
    documentation: [],
    consortium: [],
    ip: [],
    market: [],
    operational: [],
    strategic: [],
    training: [],
    risk: [],
    evaluation: []
  };
  
  try {
    // 1. Geographic
    if (eligibility.location) {
      categorized.geographic.push({
        type: 'location',
        value: eligibility.location,
        required: true
      });
    }
    
    // 2. Team
    if (eligibility.min_team_size) {
      categorized.team.push({
        type: 'min_team_size',
        value: eligibility.min_team_size,
        required: true
      });
    }
    
    // 3. Project Type
    const projectTypes = ['research', 'commercial', 'pilot', 'development'];
    for (const type of projectTypes) {
      if (text.includes(type)) {
        categorized.project.push({
          type: 'project_type',
          value: type,
          required: false
        });
        break;
      }
    }
    
    // 4. Technical (TRL, innovation level)
    if (eligibility.trl_level) {
      categorized.technical.push({
        type: 'trl_level',
        value: eligibility.trl_level,
        required: false
      });
    }
    
    if (text.includes('innovation') || text.includes('innovativ')) {
      categorized.innovation.push({
        type: 'innovation_level',
        value: 'high',
        required: true
      });
    }
    
    // 5. Financial
    if (eligibility.revenue_min || eligibility.revenue_max) {
      categorized.financial.push({
        type: 'revenue_range',
        value: {
          min: eligibility.revenue_min,
          max: eligibility.revenue_max
        },
        required: false
      });
    }
    
    if (eligibility.co_financing_percent) {
      categorized.financial.push({
        type: 'co_financing',
        value: eligibility.co_financing_percent,
        required: true
        });
    }
    
    if (eligibility.funding_amount_needed) {
      categorized.financial.push({
        type: 'funding_amount',
        value: eligibility.funding_amount_needed,
        required: true
      });
    }
    
    // 6. Business Model
    const businessModels = ['b2b', 'b2c', 'b2g', 'marketplace', 'saas', 'subscription'];
    for (const model of businessModels) {
      if (text.includes(model)) {
        categorized.business.push({
          type: 'business_model',
          value: model,
          required: false
        });
        break;
      }
    }
    
    // 7. Market Stage
    if (eligibility.market_stage) {
      categorized.market.push({
        type: 'market_stage',
        value: eligibility.market_stage,
        required: false
      });
    }
    
    // 8. IP/Patents
    if (eligibility.intellectual_property_required) {
      categorized.ip.push({
        type: 'intellectual_property',
        value: 'required',
        required: true
      });
    } else if (text.includes('patent') || text.includes('trademark')) {
      categorized.ip.push({
        type: 'intellectual_property',
        value: 'preferred',
        required: false
      });
    }
    
    // 9. Industry Focus
    if (eligibility.industry_focus) {
      categorized.project.push({
        type: 'industry_focus',
        value: eligibility.industry_focus,
        required: false
      });
    }
    
    // 10. Research Focus
    if (eligibility.research_focus) {
      categorized.project.push({
        type: 'research_focus',
        value: true,
        required: true
      });
    }
    
    // 11. International Collaboration
    if (eligibility.international_collaboration) {
      categorized.consortium.push({
        type: 'international_collaboration',
        value: true,
        required: true
      });
    }
    
    // 12. Documentation requirements
    if (text.includes('business plan') || text.includes('geschäftsplan')) {
      categorized.documentation.push({
        type: 'business_plan',
        value: true,
        required: true
      });
    }
    
    if (text.includes('pitch deck') || text.includes('präsentation')) {
      categorized.documentation.push({
        type: 'pitch_deck',
        value: true,
        required: true
      });
    }
    
    if (text.includes('financial projection') || text.includes('finanzplan')) {
      categorized.documentation.push({
        type: 'financial_projections',
        value: true,
        required: true
      });
    }
    
    // Remove empty categories
    Object.keys(categorized).forEach(key => {
      if (categorized[key].length === 0) {
        delete categorized[key];
      }
    });
    
    return categorized;
    
  } catch (error) {
    console.warn('⚠️ Categorized requirements generation failed:', error);
    return {};
  }
}

// Main script
async function main() {
  try {
    const inputFile = path.join(process.cwd(), 'data', 'scraped-programs-2025-10-23.json');
    const outputFile = path.join(process.cwd(), 'data', 'scraped-programs-2025-10-23-enriched.json');
    
    console.log('📖 Reading scraped programs...');
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    console.log(`🔄 Enriching ${data.programs.length} programs...`);
    
    let enrichedCount = 0;
    
    for (const program of data.programs) {
      // Extract rich eligibility criteria
      const enrichedCriteria = extractRichEligibilityCriteria(program.description || '', program.description || '');
      
      // Merge with existing eligibility_criteria
      program.eligibility_criteria = { ...program.eligibility_criteria, ...enrichedCriteria };
      
      // Generate categorized_requirements
      program.categorized_requirements = generateCategorizedRequirements(program.description || '', program.eligibility_criteria);
      
      enrichedCount++;
      
      if (enrichedCount % 50 === 0) {
        console.log(`  ✅ Enriched ${enrichedCount}/${data.programs.length} programs`);
      }
    }
    
    console.log(`✅ Enriched ${enrichedCount} programs`);
    
    // Write enriched data
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    console.log(`💾 Saved enriched programs to ${outputFile}`);
    
    // Show sample
    console.log('\n📊 Sample enriched program:');
    const sample = data.programs[0];
    console.log('- eligibility_criteria keys:', Object.keys(sample.eligibility_criteria));
    console.log('- categorized_requirements keys:', Object.keys(sample.categorized_requirements));
    console.log('- Sample categorized_requirements:', JSON.stringify(sample.categorized_requirements, null, 2));
    
  } catch (error) {
    console.error('❌ Error enriching programs:', error);
    process.exit(1);
  }
}

main();

