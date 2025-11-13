// Script to display Q&A questions, answers, and extraction mapping
import * as fs from 'fs';
import * as path from 'path';

interface QuestionInfo {
  id: string;
  question: string;
  description: string;
  exampleAnswers: string[];
  extracts: string[];
  exampleExtracted: any;
}

const QUESTIONS: QuestionInfo[] = [
  {
    id: 'location',
    question: 'Where is your company based?',
    description: 'Geographic eligibility requirements',
    exampleAnswers: ['Austria', 'EU', 'Germany', 'Vienna', 'Austria or EU'],
    extracts: ['geographic.location', 'geographic.specific_location'],
    exampleExtracted: {
      category: 'geographic',
      type: 'location',
      value: 'Companies must be based in Austria, Germany, or EU member states with headquarters in Vienna',
    },
  },
  {
    id: 'company_type',
    question: 'What type of company are you?',
    description: 'Company type requirements (SME, startup, etc.)',
    exampleAnswers: ['startup', 'SME', 'large company', 'non-profit', 'research institution'],
    extracts: ['eligibility.company_type'],
    exampleExtracted: {
      category: 'eligibility',
      type: 'company_type',
      value: 'Small and medium-sized enterprises (SMEs) with less than 250 employees',
    },
  },
  {
    id: 'company_stage',
    question: 'What stage is your company at?',
    description: 'Company stage/age requirements',
    exampleAnswers: ['early', 'growth', 'mature', 'startup', 'scale-up', 'established'],
    exampleExtracted: {
      category: 'eligibility',
      type: 'company_stage',
      value: 'Companies must be less than 3 years old',
    },
    extracts: ['eligibility.company_stage', 'team.company_age', 'team.max_company_age'],
  },
  {
    id: 'team_size',
    question: 'How many people are in your team?',
    description: 'Team size requirements',
    exampleAnswers: ['1', '2-5', '6-10', '11-50', '50+', 'solo founder'],
    extracts: ['team.team_size', 'team.min_team_size'],
    exampleExtracted: {
      category: 'team',
      type: 'team_size',
      value: 'Minimum 2 team members required',
    },
  },
  {
    id: 'revenue_status',
    question: 'What is your current revenue status?',
    description: 'Revenue requirements',
    exampleAnswers: ['pre-revenue', '0-50k', '50k-250k', '250k-1M', '1M+', 'not applicable'],
    extracts: ['financial.revenue', 'financial.revenue_range'],
    exampleExtracted: {
      category: 'financial',
      type: 'revenue',
      value: { min: 0, max: 500000 },
    },
  },
  {
    id: 'co_financing',
    question: 'Can you provide co-financing?',
    description: 'Co-financing requirements',
    exampleAnswers: ['yes', 'no', 'up to 30%', 'up to 50%', 'flexible'],
    extracts: ['financial.co_financing', 'financial.own_contribution'],
    exampleExtracted: {
      category: 'financial',
      type: 'co_financing',
      value: 'Minimum 30% own contribution required',
    },
  },
  {
    id: 'industry_focus',
    question: 'What industry are you in?',
    description: 'Industry/sector focus',
    exampleAnswers: ['technology', 'healthcare', 'green energy', 'manufacturing', 'services', 'biotech'],
    extracts: ['project.industry_focus', 'project.sector_focus'],
    exampleExtracted: {
      category: 'project',
      type: 'industry_focus',
      value: 'Technology, healthcare, or green energy sectors',
    },
  },
  {
    id: 'funding_amount',
    question: 'How much funding do you need?',
    description: 'Funding amount range',
    exampleAnswers: ['10k', '50k', '100k', '250k', '500k', '1M+', 'flexible'],
    extracts: ['metadata.funding_amount_min', 'metadata.funding_amount_max', 'metadata.currency'],
    exampleExtracted: {
      metadata: {
        funding_amount_min: 10000,
        funding_amount_max: 500000,
        currency: 'EUR',
      },
    },
  },
  {
    id: 'use_of_funds',
    question: 'How will you use the funds?',
    description: 'How funds can be used',
    exampleAnswers: ['R&D', 'personnel', 'equipment', 'marketing', 'working capital', 'infrastructure'],
    extracts: ['funding_details.use_of_funds'],
    exampleExtracted: {
      category: 'funding_details',
      type: 'use_of_funds',
      value: 'Funds can be used for personnel costs, equipment, and R&D infrastructure',
    },
  },
  {
    id: 'impact',
    question: 'What impact does your project have?',
    description: 'Impact requirements',
    exampleAnswers: ['environmental', 'social', 'economic', 'innovation', 'climate', 'sustainability'],
    extracts: ['impact.environmental_impact', 'impact.social_impact', 'impact.economic_impact'],
    exampleExtracted: {
      category: 'impact',
      type: 'environmental_impact',
      value: 'Projects must demonstrate positive environmental impact',
    },
  },
  {
    id: 'deadline_urgency',
    question: 'When do you need funding by?',
    description: 'Deadline information',
    exampleAnswers: ['urgent', 'within 3 months', 'within 6 months', 'flexible', 'rolling deadline'],
    extracts: ['timeline.deadline', 'timeline.open_deadline'],
    exampleExtracted: {
      metadata: {
        deadline: '2025-03-15',
        open_deadline: false,
      },
    },
  },
  {
    id: 'project_duration',
    question: 'How long is your project?',
    description: 'Project duration requirements',
    exampleAnswers: ['3-6 months', '6-12 months', '12-24 months', '24-36 months', 'flexible'],
    extracts: ['timeline.duration', 'timeline.project_duration'],
    exampleExtracted: {
      category: 'timeline',
      type: 'duration',
      value: 'Project duration must be between 12 and 36 months',
    },
  },
];

function displayQuestions() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 Q&A QUESTIONS & EXTRACTION MAPPING');
  console.log('='.repeat(80));
  console.log(`\nTotal Questions: ${QUESTIONS.length}\n`);

  QUESTIONS.forEach((q, index) => {
    console.log('\n' + '-'.repeat(80));
    console.log(`\n${index + 1}. ${q.id.toUpperCase()}`);
    console.log(`   Question: "${q.question}"`);
    console.log(`   Description: ${q.description}`);
    console.log(`\n   Example Answers:`);
    q.exampleAnswers.forEach((answer, i) => {
      console.log(`      ${i + 1}. ${answer}`);
    });
    console.log(`\n   What We Extract:`);
    q.extracts.forEach((extract, i) => {
      console.log(`      ${i + 1}. ${extract}`);
    });
    console.log(`\n   Example Extracted Data:`);
    console.log(`      ${JSON.stringify(q.exampleExtracted, null, 8).split('\n').join('\n      ')}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('\nQuestion Flow:');
  QUESTIONS.forEach((q, i) => {
    console.log(`   ${i + 1}. ${q.id} → ${q.extracts.length} field(s)`);
  });

  console.log('\n\nExtraction Categories:');
  const allCategories = new Set<string>();
  QUESTIONS.forEach(q => {
    q.extracts.forEach(extract => {
      const category = extract.split('.')[0];
      allCategories.add(category);
    });
  });
  Array.from(allCategories).sort().forEach((cat, i) => {
    console.log(`   ${i + 1}. ${cat}`);
  });
}

function displayExampleFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 EXAMPLE FLOW');
  console.log('='.repeat(80));

  const exampleAnswers = {
    location: 'Austria',
    company_type: 'startup',
    company_stage: 'early',
    funding_amount: '50000',
  };

  console.log('\n1. User Answers:');
  Object.entries(exampleAnswers).forEach(([key, value]) => {
    const question = QUESTIONS.find(q => q.id === key);
    console.log(`   ${key}: "${value}" (${question?.question})`);
  });

  console.log('\n2. Filter Seed URLs:');
  console.log('   → Keep Austrian institutions (.at domains)');
  console.log('   → Keep grant/loan programs');
  console.log('   → Result: 5-10 relevant seed URLs');

  console.log('\n3. Fetch & Extract:');
  console.log('   → Fetch HTML from seed URLs');
  console.log('   → LLM extracts:');
  exampleAnswers.location && console.log('      - geographic.location: "Companies must be based in Austria"');
  exampleAnswers.company_type && console.log('      - eligibility.company_type: "Small and medium-sized enterprises"');
  exampleAnswers.company_stage && console.log('      - eligibility.company_stage: "Early-stage companies"');
  exampleAnswers.funding_amount && console.log('      - metadata.funding_amount_max: 500000');

  console.log('\n4. Match Filter:');
  console.log('   → Check if extracted data matches user answers');
  console.log('   → Location: ✅ Match');
  console.log('   → Company type: ✅ Match');
  console.log('   → Company stage: ✅ Match');
  console.log('   → Funding amount: ✅ Match (50000 < 500000)');

  console.log('\n5. Return Results:');
  console.log('   → Programs that pass all filters');
  console.log('   → Extraction details for each');
}

function displayJSONFormat() {
  console.log('\n' + '='.repeat(80));
  console.log('📝 JSON FORMAT');
  console.log('='.repeat(80));

  console.log('\nRequest Format:');
  console.log(JSON.stringify({
    answers: {
      location: 'Austria',
      company_type: 'startup',
      company_stage: 'early',
      funding_amount: '50000',
    },
    max_results: 10,
    extract_all: false,
  }, null, 2));

  console.log('\n\nResponse Format:');
  console.log(JSON.stringify({
    success: true,
    programs: [{
      id: 'seed_aws',
      name: 'Austria Wirtschaftsservice (aws)',
      url: 'https://www.aws.at/foerderungen/',
      metadata: {
        funding_amount_max: 500000,
        currency: 'EUR',
      },
      categorized_requirements: {
        geographic: [{
          type: 'location',
          value: 'Companies must be based in Austria',
        }],
        eligibility: [{
          type: 'company_stage',
          value: 'Early-stage companies',
        }],
      },
    }],
    count: 1,
    question_mapping: QUESTIONS.reduce((acc, q) => {
      acc[q.id] = {
        extracts: q.extracts,
        description: q.description,
      };
      return acc;
    }, {} as any),
  }, null, 2));
}

// Main
function main() {
  displayQuestions();
  displayExampleFlow();
  displayJSONFormat();
  console.log('\n' + '='.repeat(80));
  console.log('✅ Done!');
  console.log('='.repeat(80) + '\n');
}

if (require.main === module) {
  main();
}

