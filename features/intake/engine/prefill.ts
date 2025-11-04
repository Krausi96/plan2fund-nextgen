/**
 * Prefill functionality for templates
 * Maps user answers and program data to document state
 */

import { DocumentState } from '@/features/reco/engine/payload';

export interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
  sections: TemplateSection[];
  metadata: {
    version: string;
    created: string;
    updated: string;
    author: string;
    category: string;
    tags: string[];
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  required: boolean;
  template: string;
  placeholders: Record<string, string>;
}

export interface Program {
  id: string;
  name: string;
  type: string;
  amount: string;
  eligibility: string[];
  requirements: string[];
  score: number;
  reasons: string[];
  risks: string[];
  template?: string;
}

/**
 * Load template from data/templates directory
 */
export async function loadTemplate(templateType: string): Promise<Template | null> {
  try {
    const templatePath = `data/templates/${templateType}.json`;
    const response = await fetch(`/${templatePath}`);
    
    if (!response.ok) {
      console.error(`Failed to load template: ${templatePath}`);
      return null;
    }
    
    const template = await response.json();
    return template as Template;
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
  }
}

/**
 * Prefill document state from user answers and program
 */
export async function prefillDocumentState(
  answers_v1: Record<string, any>,
  program: Program
): Promise<Partial<DocumentState>> {
  const templateType = program.template || program.type;
  
  return {
    answers_v1,
    fundingMode: program.type,
    top3: [program], // Single program for now
    trace: [],
    program,
    content: generatePrefilledContent(answers_v1, program, templateType),
    metadata: {
      createdAt: new Date().toISOString(),
      source: 'prefill',
      template: templateType,
      programId: program.id
    }
  };
}

/**
 * Generate prefilled content based on template and user answers
 */
function generatePrefilledContent(
  answers: Record<string, any>,
  program: Program,
  _templateType: string
): string {
  // Basic content generation based on answers
  const content = `
# Business Plan

## Executive Summary

Our business, ${answers.business_name || '[Business Name]'}, is seeking ${answers.funding_amount || '[Funding Amount]'} in ${program.type} funding to ${answers.use_of_funds || '[Use of Funds]'}.

## Business Description

${answers.business_description || '[Business Description]'}

## Target Market

${answers.target_market || '[Target Market]'}

## Revenue Model

${answers.revenue_model || '[Revenue Model]'}

## Team

Our team consists of ${answers.team_size || '[Team Size]'} professionals.

## Funding Request

- **Amount**: ${answers.funding_amount || '[Funding Amount]'}
- **Use**: ${answers.use_of_funds || '[Use of Funds]'}
- **Timeline**: ${answers.timeline || '[Timeline]'}

## Program-Specific Information

This application is tailored for the ${program.name} program, which offers ${program.amount} in ${program.type} funding.

### Eligibility Requirements

${program.eligibility.map(req => `- ${req}`).join('\n')}

### Program Requirements

${program.requirements.map(req => `- ${req}`).join('\n')}

### Why This Program

${program.reasons.map(reason => `- ${reason}`).join('\n')}

${program.risks.length > 0 ? `### Considerations\n\n${program.risks.map(risk => `- ${risk}`).join('\n')}` : ''}
`;

  return content.trim();
}

/**
 * Replace placeholders in template with user answers
 */
export function replacePlaceholders(
  template: string,
  answers: Record<string, any>,
  program: Program
): string {
  let content = template;
  
  // Replace common placeholders
  const placeholders = {
    'BUSINESS_NAME': answers.business_name || '[Business Name]',
    'BUSINESS_DESCRIPTION': answers.business_description || '[Business Description]',
    'TARGET_MARKET': answers.target_market || '[Target Market]',
    'REVENUE_MODEL': answers.revenue_model || '[Revenue Model]',
    'TEAM_SIZE': answers.team_size || '[Team Size]',
    'FUNDING_AMOUNT': answers.funding_amount || '[Funding Amount]',
    'USE_OF_FUNDS': answers.use_of_funds || '[Use of Funds]',
    'TIMELINE': answers.timeline || '[Timeline]',
    'PROGRAM_NAME': program.name,
    'PROGRAM_TYPE': program.type,
    'PROGRAM_AMOUNT': program.amount,
    'PROGRAM_ELIGIBILITY': program.eligibility.join(', '),
    'PROGRAM_REQUIREMENTS': program.requirements.join(', '),
    'PROGRAM_REASONS': program.reasons.join(', '),
    'PROGRAM_RISKS': program.risks.join(', ')
  };
  
  // Replace placeholders in template
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    const regex = new RegExp(`\\[${placeholder}\\]`, 'g');
    content = content.replace(regex, value);
  });
  
  return content;
}

/**
 * Get template suggestions based on program type
 */
export function getTemplateSuggestions(programType: string): string[] {
  const suggestions: Record<string, string[]> = {
    'grant': ['grant_template'],
    'loan': ['loan_template'],
    'equity': ['equity_template', 'grant_template'],
    'mixed': ['grant_template', 'loan_template']
  };
  
  return suggestions[programType] || ['grant_template'];
}

/**
 * Validate prefill data
 */
export function validatePrefillData(
  answers: Record<string, any>,
  program: Program
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required answers
  const requiredFields = ['business_name', 'business_description', 'target_market', 'revenue_model'];
  requiredFields.forEach(field => {
    if (!answers[field] || answers[field].trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Check program data
  if (!program || !program.id) {
    errors.push('Invalid program data');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate prefill summary
 */
export function generatePrefillSummary(
  answers: Record<string, any>,
  program: Program
): string {
  const summary = `
Prefill Summary:
- Business: ${answers.business_name || 'Not specified'}
- Type: ${program.type}
- Amount: ${answers.funding_amount || 'Not specified'}
- Program: ${program.name}
- Template: ${program.template || program.type}
- Answers: ${Object.keys(answers).length} fields completed
`;

  return summary.trim();
}

/**
 * Map wizard answers (QuestionEngine format) to prefill format
 * 
 * Wizard format: { location: 'austria', company_age: '0_2_years', team_size: '1_2_people' }
 * Prefill format: { business_name, business_description, target_market, funding_amount, team_size }
 */
export function mapWizardAnswersToPrefillFormat(
  wizardAnswers: Record<string, any>
): Record<string, any> {
  const prefillAnswers: Record<string, any> = {};
  
  // Business name - generate from location/industry if available
  if (wizardAnswers.industry_focus) {
    const industry = wizardAnswers.industry_focus;
    const location = wizardAnswers.location || 'Austria';
    prefillAnswers.business_name = `${industry} Startup in ${location}`;
  } else if (wizardAnswers.location) {
    prefillAnswers.business_name = `Business in ${wizardAnswers.location}`;
  }
  
  // Business description - generate from industry, location, and company age
  const descriptionParts: string[] = [];
  if (wizardAnswers.industry_focus) {
    descriptionParts.push(`We are a ${wizardAnswers.industry_focus} company`);
  }
  if (wizardAnswers.location) {
    descriptionParts.push(`based in ${wizardAnswers.location}`);
  }
  if (wizardAnswers.company_age) {
    const age = wizardAnswers.company_age;
    if (age.includes('0_2') || age.includes('under_2')) {
      descriptionParts.push('in the early stages of development');
    } else if (age.includes('2_5')) {
      descriptionParts.push('with 2-5 years of experience');
    } else if (age.includes('5_10')) {
      descriptionParts.push('with 5-10 years of experience');
    } else if (age.includes('over_10')) {
      descriptionParts.push('with over 10 years of experience');
    }
  }
  if (descriptionParts.length > 0) {
    prefillAnswers.business_description = descriptionParts.join('. ') + '.';
  }
  
  // Target market - generate from industry and location
  if (wizardAnswers.industry_focus) {
    prefillAnswers.target_market = `We target customers in the ${wizardAnswers.industry_focus} sector`;
    if (wizardAnswers.location) {
      prefillAnswers.target_market += ` in ${wizardAnswers.location}`;
    }
    prefillAnswers.target_market += '.';
  }
  
  // Revenue model - infer from industry and company stage
  if (wizardAnswers.industry_focus) {
    const industry = wizardAnswers.industry_focus.toLowerCase();
    if (industry.includes('saas') || industry.includes('software')) {
      prefillAnswers.revenue_model = 'Subscription-based SaaS model with recurring revenue';
    } else if (industry.includes('marketplace') || industry.includes('platform')) {
      prefillAnswers.revenue_model = 'Marketplace commission model';
    } else if (industry.includes('product') || industry.includes('manufacturing')) {
      prefillAnswers.revenue_model = 'Product sales with direct-to-consumer and B2B channels';
    } else {
      prefillAnswers.revenue_model = 'Revenue generated through our core business activities';
    }
  }
  
  // Team size - direct mapping
  if (wizardAnswers.team_size) {
    const size = wizardAnswers.team_size;
    if (size.includes('1_2') || size.includes('1-2')) {
      prefillAnswers.team_size = '1-2 people';
    } else if (size.includes('3_5') || size.includes('3-5')) {
      prefillAnswers.team_size = '3-5 people';
    } else if (size.includes('6_10') || size.includes('6-10')) {
      prefillAnswers.team_size = '6-10 people';
    } else if (size.includes('over_10') || size.includes('10+')) {
      prefillAnswers.team_size = '10+ people';
    } else {
      prefillAnswers.team_size = size;
    }
  }
  
  // Funding amount - infer from current revenue and company age
  if (wizardAnswers.current_revenue) {
    const revenue = wizardAnswers.current_revenue.toLowerCase();
    if (revenue.includes('under_100') || revenue.includes('0')) {
      // Early stage, needs seed funding
      prefillAnswers.funding_amount = '€50,000 - €250,000';
      prefillAnswers.use_of_funds = 'Product development, market research, and initial team expansion';
    } else if (revenue.includes('100k_500') || revenue.includes('100-500')) {
      // Growing, needs Series A
      prefillAnswers.funding_amount = '€250,000 - €1,000,000';
      prefillAnswers.use_of_funds = 'Scaling operations, expanding market reach, and team growth';
    } else if (revenue.includes('500k_2m') || revenue.includes('500k-2m')) {
      // Established, needs growth funding
      prefillAnswers.funding_amount = '€1,000,000 - €5,000,000';
      prefillAnswers.use_of_funds = 'Market expansion, product diversification, and infrastructure scaling';
    } else if (revenue.includes('over_2m') || revenue.includes('2m+')) {
      // Mature, needs expansion funding
      prefillAnswers.funding_amount = '€5,000,000+';
      prefillAnswers.use_of_funds = 'International expansion, strategic acquisitions, and technology investments';
    }
  } else if (wizardAnswers.company_age) {
    const age = wizardAnswers.company_age.toLowerCase();
    if (age.includes('0_2') || age.includes('under_2')) {
      prefillAnswers.funding_amount = '€50,000 - €250,000';
      prefillAnswers.use_of_funds = 'Initial product development and market validation';
    } else if (age.includes('2_5')) {
      prefillAnswers.funding_amount = '€250,000 - €1,000,000';
      prefillAnswers.use_of_funds = 'Product refinement and market expansion';
    } else {
      prefillAnswers.funding_amount = '€1,000,000+';
      prefillAnswers.use_of_funds = 'Scaling operations and market leadership';
    }
  }
  
  // Timeline - infer from company age and funding needs
  if (wizardAnswers.company_age) {
    const age = wizardAnswers.company_age.toLowerCase();
    if (age.includes('0_2') || age.includes('under_2')) {
      prefillAnswers.timeline = '18-24 months for product development and market entry';
    } else if (age.includes('2_5')) {
      prefillAnswers.timeline = '12-18 months for market expansion and growth';
    } else {
      prefillAnswers.timeline = '6-12 months for scaling and optimization';
    }
  }
  
  return prefillAnswers;
}

/**
 * Map user answers to document sections with TBD markers
 */
export function mapAnswersToSections(
  answers: Record<string, any>,
  program: Program
): Record<string, { content: string; hasTBD: boolean; counterfactuals: string[] }> {
  const sections: Record<string, { content: string; hasTBD: boolean; counterfactuals: string[] }> = {};
  
  // Executive Summary
  sections.executive_summary = {
    content: generateExecutiveSummary(answers, program),
    hasTBD: !answers.business_name || !answers.funding_amount,
    counterfactuals: generateCounterfactuals(['business_name', 'funding_amount'], answers)
  };
  
  // Business Description
  sections.business_description = {
    content: generateBusinessDescription(answers, program),
    hasTBD: !answers.business_description,
    counterfactuals: generateCounterfactuals(['business_description'], answers)
  };
  
  // Market Analysis
  sections.market_analysis = {
    content: generateMarketAnalysis(answers, program),
    hasTBD: !answers.target_market,
    counterfactuals: generateCounterfactuals(['target_market'], answers)
  };
  
  // Financial Projections
  sections.financial_projections = {
    content: generateFinancialProjections(answers, program),
    hasTBD: !answers.funding_amount || !answers.use_of_funds,
    counterfactuals: generateCounterfactuals(['funding_amount', 'use_of_funds'], answers)
  };
  
  // Team
  sections.team = {
    content: generateTeamSection(answers, program),
    hasTBD: !answers.team_size,
    counterfactuals: generateCounterfactuals(['team_size'], answers)
  };
  
  // Timeline
  sections.timeline = {
    content: generateTimelineSection(answers, program),
    hasTBD: !answers.timeline,
    counterfactuals: generateCounterfactuals(['timeline'], answers)
  };
  
  return sections;
}

/**
 * Generate executive summary section
 */
function generateExecutiveSummary(answers: Record<string, any>, program: Program): string {
  const businessName = answers.business_name || '[TBD: Business Name]';
  const fundingAmount = answers.funding_amount || '[TBD: Funding Amount]';
  const useOfFunds = answers.use_of_funds || '[TBD: Use of Funds]';
  
  return `# Executive Summary

${businessName} is seeking ${fundingAmount} in ${program.type} funding to ${useOfFunds}.

**Program**: ${program.name}
**Amount Available**: ${program.amount}
**Eligibility**: ${program.eligibility.join(', ')}

${answers.business_description || '[TBD: Business Description]'}

**Target Market**: ${answers.target_market || '[TBD: Target Market]'}
**Revenue Model**: ${answers.revenue_model || '[TBD: Revenue Model]'}
**Team Size**: ${answers.team_size || '[TBD: Team Size]'}

This application demonstrates our eligibility for the ${program.name} program and outlines our plan for success.`;
}

/**
 * Generate business description section
 */
function generateBusinessDescription(answers: Record<string, any>, _program: Program): string {
  return `# Business Description

${answers.business_description || '[TBD: Business Description - Describe what your business does, your unique value proposition, and how you solve customer problems]'}

## Business Model
${answers.revenue_model || '[TBD: Revenue Model - Explain how you make money and your pricing strategy]'}

## Competitive Advantage
[TBD: Competitive Advantage - What makes you different from competitors?]

## Legal Structure
[TBD: Legal Structure - What type of business entity are you?]

## Location
[TBD: Location - Where is your business located and why?]`;
}

/**
 * Generate market analysis section
 */
function generateMarketAnalysis(answers: Record<string, any>, _program: Program): string {
  return `# Market Analysis

## Target Market
${answers.target_market || '[TBD: Target Market - Who are your customers and what are their needs?]'}

## Market Size
[TBD: Market Size - What is the total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM)?]

## Market Trends
[TBD: Market Trends - What trends support your business opportunity?]

## Competitive Landscape
[TBD: Competitive Landscape - Who are your main competitors and how do you compare?]

## Customer Acquisition
[TBD: Customer Acquisition - How will you reach and acquire customers?]`;
}

/**
 * Generate financial projections section
 */
function generateFinancialProjections(answers: Record<string, any>, _program: Program): string {
  const fundingAmount = answers.funding_amount || '[TBD: Funding Amount]';
  const useOfFunds = answers.use_of_funds || '[TBD: Use of Funds]';
  
  return `# Financial Projections

## Funding Request
- **Amount**: ${fundingAmount}
- **Use of Funds**: ${useOfFunds}
- **Timeline**: ${answers.timeline || '[TBD: Timeline]'}

## Revenue Projections
[TBD: Revenue Projections - 3-year revenue forecast with assumptions]

## Expense Projections
[TBD: Expense Projections - 3-year expense forecast with breakdown]

## Cash Flow
[TBD: Cash Flow - Monthly cash flow projections for first year]

## Break-even Analysis
[TBD: Break-even Analysis - When will you break even?]

## Funding Requirements
[TBD: Funding Requirements - Detailed breakdown of how funding will be used]`;
}

/**
 * Generate team section
 */
function generateTeamSection(answers: Record<string, any>, _program: Program): string {
  const teamSize = answers.team_size || '[TBD: Team Size]';
  
  return `# Team

## Team Overview
Our team consists of ${teamSize} professionals with diverse backgrounds and expertise.

## Key Team Members
[TBD: Key Team Members - Bios of founders and key team members]

## Advisory Board
[TBD: Advisory Board - Industry experts and advisors]

## Hiring Plan
[TBD: Hiring Plan - Who will you hire and when?]

## Organizational Structure
[TBD: Organizational Structure - How is your team organized?]`;
}

/**
 * Generate timeline section
 */
function generateTimelineSection(answers: Record<string, any>, _program: Program): string {
  const timeline = answers.timeline || '[TBD: Timeline]';
  
  return `# Timeline

## Project Timeline
${timeline}

## Key Milestones
[TBD: Key Milestones - Major project milestones and deliverables]

## Funding Timeline
[TBD: Funding Timeline - When do you need funding and for how long?]

## Go-to-Market Timeline
[TBD: Go-to-Market Timeline - When will you launch and scale?]

## Risk Mitigation
[TBD: Risk Mitigation - How will you handle potential delays or issues?]`;
}

/**
 * Generate counterfactuals for missing information
 */
function generateCounterfactuals(missingFields: string[], answers: Record<string, any>): string[] {
  const counterfactuals: string[] = [];
  
  missingFields.forEach(field => {
    if (!answers[field] || answers[field].trim() === '') {
      const fieldDescriptions: Record<string, string> = {
        'business_name': 'Business name is required for professional presentation',
        'business_description': 'Business description helps reviewers understand your concept',
        'target_market': 'Target market analysis shows market opportunity',
        'revenue_model': 'Revenue model demonstrates business viability',
        'funding_amount': 'Funding amount shows financial planning',
        'use_of_funds': 'Use of funds demonstrates fund utilization strategy',
        'team_size': 'Team size indicates organizational capacity',
        'timeline': 'Timeline shows project planning and urgency'
      };
      
      counterfactuals.push(fieldDescriptions[field] || `Missing ${field} information`);
    }
  });
  
  return counterfactuals;
}

/**
 * Load programs from data
 */
export async function loadPrograms(): Promise<Program[]> {
  try {
    const response = await fetch('/api/programs-ai?action=programs');
    if (!response.ok) {
      throw new Error('Failed to load programs');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading programs:', error);
    return [];
  }
}