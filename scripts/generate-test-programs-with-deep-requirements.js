/**
 * Generate test programs with categorized_requirements
 * This simulates what the scraper SHOULD extract
 */

const fs = require('fs');
const path = require('path');

const testPrograms = [
  {
    id: 'aws_preseed_with_reqs',
    name: 'AWS Preseed Program',
    description: 'Funding for early-stage startups',
    type: 'grant',
    program_type: 'grant',
    funding_amount_min: 50000,
    funding_amount_max: 200000,
    currency: 'EUR',
    eligibility_criteria: {
      location: 'Austria',
      max_company_age: 5,
      min_team_size: 2,
      revenue_max: 500000
    },
    // CRITICAL: This is what makes questions profound
    categorized_requirements: {
      financial: [{
        type: 'co_financing',
        value: '50%',
        required: true,
        source: 'dynamic_patterns'
      }],
      technical: [{
        type: 'trl_level',
        value: '3-7',
        required: true,
        source: 'dynamic_patterns'
      }],
      impact: [{
        type: 'innovation',
        value: 'high',
        required: true,
        source: 'dynamic_patterns'
      }],
      consortium: [{
        type: 'required',
        value: 'no',
        required: false,
        source: 'dynamic_patterns'
      }],
      industry: [{
        type: 'technology',
        value: 'digital',
        required: true,
        source: 'dynamic_patterns'
      }]
    },
    source_url: 'https://aws.at',
    institution: 'AWS',
    program_category: 'startup_grants',
    scraped_at: new Date(),
    confidence_score: 0.9,
    is_active: true
  },
  {
    id: 'ffg_basisprogramm_with_reqs',
    name: 'FFG Basisprogramm',
    description: 'R&D funding for research projects',
    type: 'grant',
    program_type: 'grant',
    funding_amount_min: 100000,
    funding_amount_max: 1000000,
    currency: 'EUR',
    eligibility_criteria: {
      location: 'Austria',
      research_focus: true
    },
    categorized_requirements: {
      technical: [{
        type: 'trl_level',
        value: '5-9',
        required: true
      }],
      impact: [{
        type: 'scientific',
        value: 'high',
        required: true
      }],
      consortium: [{
        type: 'required',
        value: 'yes',
        required: true
      }],
      financial: [{
        type: 'co_financing',
        value: '30%',
        required: true
      }]
    },
    source_url: 'https://ffg.at',
    institution: 'FFG',
    program_category: 'research_grants',
    scraped_at: new Date(),
    confidence_score: 0.9,
    is_active: true
  },
  {
    id: 'aws_digitalization_with_reqs',
    name: 'AWS Digitalization Grant',
    description: 'Funding for digital transformation',
    type: 'grant',
    program_type: 'grant',
    funding_amount_min: 30000,
    funding_amount_max: 150000,
    currency: 'EUR',
    eligibility_criteria: {
      location: 'Austria',
      industry_focus: 'digital'
    },
    categorized_requirements: {
      industry: [{
        type: 'digital',
        value: 'services',
        required: true
      }],
      financial: [{
        type: 'co_financing',
        value: '20%',
        required: true
      }],
      impact: [{
        type: 'digital_transformation',
        value: 'high',
        required: true
      }],
      use_of_funds: [{
        type: 'software',
        value: 'digital_tools',
        required: true
      }]
    },
    source_url: 'https://aws.at',
    institution: 'AWS',
    program_category: 'digital_grants',
    scraped_at: new Date(),
    confidence_score: 0.9,
    is_active: true
  }
];

const output = {
  timestamp: new Date().toISOString(),
  totalPrograms: testPrograms.length,
  programs: testPrograms
};

const outputPath = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`✅ Generated ${testPrograms.length} test programs with categorized_requirements`);
console.log(`📝 File: ${outputPath}`);
console.log(`🎯 Now QuestionEngine will generate 10-15 profound questions!`);

