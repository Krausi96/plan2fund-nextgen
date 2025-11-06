// ========= PLAN2FUND — SECTION-SPECIFIC EXPERT PROMPTS =========
// Domain-specific expert advice for each business plan section
// Provides Austrian/EU funding context and best practices

export interface SectionExpertPrompt {
  sectionId: string;
  sectionTitle: string;
  expertContext: string; // Context about this section for the AI
  keyAdvice: string[]; // Key pieces of expert advice
  commonMistakes: string[]; // What to avoid
  bestPractices: string[]; // What works well
  examples?: string[]; // Example references
  fundingTypeSpecific?: {
    grants?: string;
    bankLoans?: string;
    equity?: string;
    visa?: string;
  };
}

/**
 * Get expert prompt for a specific section
 */
export function getSectionExpertPrompt(
  sectionId: string,
  sectionTitle: string,
  fundingType?: string
): SectionExpertPrompt | null {
  // Normalize section identifier
  const normalizedId = sectionId.toLowerCase();
  const normalizedTitle = sectionTitle.toLowerCase();
  
  // Try to find by ID first, then by title keywords
  let prompt = SECTION_PROMPTS.find(p => 
    p.sectionId.toLowerCase() === normalizedId ||
    normalizedTitle.includes(p.sectionTitle.toLowerCase()) ||
    p.sectionTitle.toLowerCase().includes(normalizedTitle)
  );
  
  // If not found, try keyword matching
  if (!prompt) {
    for (const keyword of Object.keys(SECTION_KEYWORDS)) {
      if (normalizedId.includes(keyword) || normalizedTitle.includes(keyword)) {
        prompt = SECTION_PROMPTS.find(p => p.sectionId === SECTION_KEYWORDS[keyword]);
        if (prompt) break;
      }
    }
  }
  
  if (!prompt) {
    // Return generic prompt if section not found
    return GENERIC_PROMPT;
  }
  
  // Add funding-type-specific context if available
  if (fundingType && prompt.fundingTypeSpecific?.[fundingType as keyof typeof prompt.fundingTypeSpecific]) {
    return {
      ...prompt,
      expertContext: `${prompt.expertContext}\n\n${prompt.fundingTypeSpecific[fundingType as keyof typeof prompt.fundingTypeSpecific]}`
    };
  }
  
  return prompt;
}

/**
 * Build enhanced prompt for AI assistant
 */
export function buildExpertPrompt(
  sectionId: string,
  sectionTitle: string,
  userQuery: string,
  currentContent: string,
  fundingType?: string
): string {
  const expertPrompt = getSectionExpertPrompt(sectionId, sectionTitle, fundingType);
  
  if (!expertPrompt) {
    return userQuery;
  }
  
  return `You are an expert business plan advisor specializing in ${fundingType || 'Austrian and EU'} funding applications.

${expertPrompt.expertContext}

**Current Section:** ${sectionTitle}
**User Query:** ${userQuery}
**Current Content:** ${currentContent || 'No content yet'}

**Expert Advice for This Section:**
${expertPrompt.keyAdvice.map(a => `- ${a}`).join('\n')}

**Best Practices:**
${expertPrompt.bestPractices.map(p => `- ${p}`).join('\n')}

**Common Mistakes to Avoid:**
${expertPrompt.commonMistakes.map(m => `- ${m}`).join('\n')}

Please provide specific, actionable advice based on the user's query, incorporating the expert guidance above.`;
}

// ============================================================================
// SECTION-SPECIFIC PROMPTS
// ============================================================================

const SECTION_PROMPTS: SectionExpertPrompt[] = [
  {
    sectionId: 'executive_summary',
    sectionTitle: 'Executive Summary',
    expertContext: `The Executive Summary is the most critical section - reviewers often read only this section first. It must be compelling, concise, and demonstrate clear value proposition. For Austrian/EU funding, emphasize innovation, market potential, and alignment with program goals.`,
    keyAdvice: [
      'Keep it to 200-300 words maximum - reviewers have limited time',
      'Lead with the problem and your unique solution',
      'Include key numbers: funding amount, timeline, expected impact',
      'Mention alignment with program objectives (e.g., innovation, sustainability, job creation)',
      'End with a clear call to action or next steps'
    ],
    commonMistakes: [
      'Too long or too vague',
      'Missing specific numbers or metrics',
      'Not clearly stating the funding request',
      'Failing to connect to program goals',
      'Using jargon without explanation'
    ],
    bestPractices: [
      'Write it last, after completing all other sections',
      'Use active voice and strong verbs',
      'Include one compelling statistic or fact',
      'Test it: can someone understand your business in 60 seconds?',
      'Get feedback from someone unfamiliar with your project'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize research/innovation impact, technical feasibility, and potential for knowledge transfer.',
      bankLoans: 'For bank loans, focus on repayment capacity, collateral, and business stability.',
      equity: 'For equity, highlight growth potential, market opportunity, and team strength.',
      visa: 'For visa applications, emphasize job creation, economic contribution, and long-term commitment to Austria.'
    }
  },
  {
    sectionId: 'financial_projections',
    sectionTitle: 'Financial Projections',
    expertContext: `Financial projections must be realistic, well-justified, and aligned with Austrian accounting standards. Use appropriate depreciation methods (linear, declining balance), consider VAT implications, and ensure compliance with Austrian tax law.`,
    keyAdvice: [
      'Use Austrian depreciation methods: linear (linear) or declining balance (degressive)',
      'Depreciation type affects your final yearly result - choose based on your cash flow needs',
      'Include VAT calculations (20% standard rate, 10% reduced rate for certain goods/services)',
      'Consider Austrian social security contributions (employer portion ~21% of gross salary)',
      'Use conservative assumptions - reviewers prefer realistic over optimistic projections',
      'Break down costs by category: personnel, equipment, materials, overhead, etc.',
      'Show 3-5 year projections with clear assumptions for each year'
    ],
    commonMistakes: [
      'Unrealistic revenue growth without justification',
      'Missing or incorrect VAT calculations',
      'Not accounting for Austrian social security contributions',
      'Using wrong depreciation method for tax optimization',
      'Inconsistent assumptions across years',
      'Not explaining key assumptions'
    ],
    bestPractices: [
      'Start with bottom-up cost estimation, then validate with top-down market sizing',
      'Include sensitivity analysis for key variables',
      'Show break-even analysis',
      'Align financial projections with narrative sections',
      'Use Austrian accounting standards (UGB - Unternehmensgesetzbuch)',
      'Consider seasonal variations if applicable'
    ],
    examples: [
      'FFG Basisprogramm budget templates',
      'Horizon Europe cost categories',
      'Austrian startup grant financial models'
    ]
  },
  {
    sectionId: 'market_analysis',
    sectionTitle: 'Market Analysis',
    expertContext: `Market analysis must demonstrate deep understanding of the Austrian/EU market, competitive landscape, and customer needs. Use credible sources (Statistik Austria, Eurostat, industry reports) and show realistic market sizing.`,
    keyAdvice: [
      'Use TAM (Total Addressable Market), SAM (Serviceable Addressable Market), and SOM (Serviceable Obtainable Market) framework',
      'Cite credible sources: Statistik Austria, Eurostat, WKO market reports, industry associations',
      'Focus on Austrian market first, then expand to EU if applicable',
      'Identify specific customer segments with clear personas',
      'Show market trends and growth drivers',
      'Analyze competitive landscape: direct and indirect competitors',
      'Demonstrate understanding of Austrian business culture and buying behavior'
    ],
    commonMistakes: [
      'Inflated market size without credible sources',
      'Generic market analysis not specific to Austria/EU',
      'Missing competitive analysis or underestimating competition',
      'Not identifying specific customer segments',
      'Ignoring cultural differences in Austrian market'
    ],
    bestPractices: [
      'Start with primary research: interviews, surveys, focus groups',
      'Validate assumptions with industry experts or advisors',
      'Use multiple sources to triangulate market size',
      'Show understanding of Austrian regulatory environment',
      'Include case studies or examples from similar Austrian companies'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize market need for innovation and potential for knowledge transfer.',
      equity: 'For equity, focus on large addressable market and growth potential.',
      bankLoans: 'For bank loans, demonstrate stable market with predictable demand.'
    }
  },
  {
    sectionId: 'team',
    sectionTitle: 'Team',
    expertContext: `The team section must demonstrate that you have the right people to execute the plan. For Austrian funding, emphasize relevant experience, complementary skills, and commitment to the project.`,
    keyAdvice: [
      'Highlight relevant industry experience and track record',
      'Show complementary skills across team members',
      'Demonstrate commitment: full-time vs. part-time, equity stakes',
      'Include advisory board or mentors if applicable',
      'Address any skill gaps and how you plan to fill them',
      'For Austrian programs, mention language skills (German/English) if relevant',
      'Show understanding of Austrian business environment'
    ],
    commonMistakes: [
      'Vague descriptions without specific achievements',
      'Not addressing obvious skill gaps',
      'Overstating team experience or qualifications',
      'Missing key roles (e.g., technical lead, sales, finance)',
      'Not showing commitment or equity distribution'
    ],
    bestPractices: [
      'Use specific examples of past achievements',
      'Include LinkedIn profiles or professional backgrounds',
      'Show how team members complement each other',
      'Demonstrate cultural fit for Austrian market if applicable',
      'Include hiring plan for key positions'
    ]
  },
  {
    sectionId: 'impact',
    sectionTitle: 'Impact',
    expertContext: `Impact is crucial for grant applications, especially EU programs. You must demonstrate measurable social, economic, or environmental impact aligned with program objectives.`,
    keyAdvice: [
      'Define clear impact metrics: jobs created, CO2 reduced, lives improved, etc.',
      'Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound',
      'Show both direct and indirect impact',
      'Align with program objectives (e.g., Horizon Europe impact categories)',
      'Include baseline measurements and target outcomes',
      'Show long-term sustainability of impact',
      'For Austrian programs, emphasize local/regional economic impact'
    ],
    commonMistakes: [
      'Vague impact statements without metrics',
      'Not aligning with program impact categories',
      'Unrealistic impact claims without justification',
      'Focusing only on financial impact, ignoring social/environmental',
      'Not showing how impact will be measured or monitored'
    ],
    bestPractices: [
      'Use impact frameworks: Theory of Change, Logic Model',
      'Include stakeholder testimonials or letters of support',
      'Show alignment with UN Sustainable Development Goals if applicable',
      'Demonstrate scalability of impact',
      'Include monitoring and evaluation plan'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize research impact, knowledge transfer, and societal benefits.',
      visa: 'For visa applications, focus on job creation and economic contribution to Austria.'
    }
  },
  {
    sectionId: 'risk_assessment',
    sectionTitle: 'Risk Assessment',
    expertContext: `Risk assessment shows maturity and preparedness. Identify realistic risks, assess probability and impact, and provide concrete mitigation strategies.`,
    keyAdvice: [
      'Identify technical, financial, market, and operational risks',
      'Use risk matrix: probability (high/medium/low) × impact (high/medium/low)',
      'For each high-priority risk, provide specific mitigation strategy',
      'Assign risk owners and monitoring procedures',
      'Show understanding of Austrian/EU regulatory risks if applicable',
      'Include contingency plans for critical risks'
    ],
    commonMistakes: [
      'Ignoring obvious risks or being overly optimistic',
      'Vague mitigation strategies without specifics',
      'Not prioritizing risks by severity',
      'Missing regulatory or compliance risks',
      'Not showing how risks will be monitored'
    ],
    bestPractices: [
      'Be honest about risks - shows maturity',
      'Use risk register format: Risk | Probability | Impact | Mitigation | Owner',
      'Include both internal and external risks',
      'Show learning from similar projects or competitors',
      'Demonstrate risk management experience'
    ]
  },
  {
    sectionId: 'implementation_plan',
    sectionTitle: 'Implementation Plan',
    expertContext: `Implementation plan must show realistic timeline, clear milestones, and resource allocation. For Austrian programs, consider local regulations, holidays, and business practices.`,
    keyAdvice: [
      'Break down into phases with clear milestones',
      'Include realistic timelines considering Austrian holidays and business practices',
      'Show resource allocation: who does what, when',
      'Identify dependencies and critical path',
      'Include buffer time for unexpected delays',
      'Show alignment with funding program timeline',
      'Consider Austrian regulatory requirements (e.g., company registration, permits)'
    ],
    commonMistakes: [
      'Unrealistic timelines without justification',
      'Missing dependencies or critical path',
      'Not accounting for Austrian holidays or business practices',
      'Vague milestones without clear deliverables',
      'Not showing resource allocation'
    ],
    bestPractices: [
      'Use Gantt chart or timeline visualization',
      'Include key milestones with deliverables',
      'Show quarterly or monthly breakdown',
      'Identify critical path and dependencies',
      'Include risk buffer in timeline'
    ]
  }
];

// Keyword mapping for section detection
const SECTION_KEYWORDS: Record<string, string> = {
  'executive': 'executive_summary',
  'summary': 'executive_summary',
  'financial': 'financial_projections',
  'finance': 'financial_projections',
  'budget': 'financial_projections',
  'revenue': 'financial_projections',
  'market': 'market_analysis',
  'competition': 'market_analysis',
  'customer': 'market_analysis',
  'team': 'team',
  'management': 'team',
  'founder': 'team',
  'impact': 'impact',
  'sustainability': 'impact',
  'social': 'impact',
  'risk': 'risk_assessment',
  'mitigation': 'risk_assessment',
  'implementation': 'implementation_plan',
  'timeline': 'implementation_plan',
  'milestone': 'implementation_plan',
  'roadmap': 'implementation_plan'
};

// Generic prompt for sections not specifically covered
const GENERIC_PROMPT: SectionExpertPrompt = {
  sectionId: 'generic',
  sectionTitle: 'General Section',
  expertContext: `You are an expert business plan advisor specializing in Austrian and EU funding applications. Provide specific, actionable advice based on best practices for funding applications.`,
  keyAdvice: [
    'Be specific and concrete - avoid vague statements',
    'Use data and examples to support your points',
    'Align content with program objectives and requirements',
    'Ensure clarity and professional tone',
    'Address reviewer concerns proactively'
  ],
  commonMistakes: [
    'Vague or generic statements',
    'Missing specific examples or data',
    'Not aligning with program requirements',
    'Poor structure or unclear writing'
  ],
  bestPractices: [
    'Use clear structure with headings and subheadings',
    'Include specific examples and case studies',
    'Cite credible sources when making claims',
    'Get feedback from advisors or peers',
    'Proofread carefully for errors'
  ]
};

