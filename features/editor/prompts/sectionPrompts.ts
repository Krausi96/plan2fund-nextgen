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
 * Build enhanced prompt for AI assistant with comprehensive knowledge
 */
export function buildExpertPrompt(
  sectionId: string,
  sectionTitle: string,
  userQuery: string,
  currentContent: string,
  fundingType?: string,
  programRequirements?: any,
  allPlanContent?: Record<string, string>,
  programProfile?: any
): string {
  const expertPrompt = getSectionExpertPrompt(sectionId, sectionTitle, fundingType);
  
  // Build comprehensive knowledge base
  let knowledgeBase = '';
  
  // Add program requirements if available
  if (programRequirements?.categorized_requirements) {
    const reqs = programRequirements.categorized_requirements;
    knowledgeBase += `\n**Program Requirements (from scraper):**\n`;
    if (reqs.eligibility?.length) knowledgeBase += `- Eligibility: ${reqs.eligibility.map((r: any) => r.value).join(', ')}\n`;
    if (reqs.financial?.length) knowledgeBase += `- Financial: ${reqs.financial.map((r: any) => r.value).join(', ')}\n`;
    if (reqs.timeline?.length) knowledgeBase += `- Timeline: ${reqs.timeline.map((r: any) => r.value).join(', ')}\n`;
    if (reqs.team?.length) knowledgeBase += `- Team: ${reqs.team.map((r: any) => r.value).join(', ')}\n`;
    if (reqs.impact?.length) knowledgeBase += `- Impact: ${reqs.impact.map((r: any) => r.value).join(', ')}\n`;
    if (reqs.documents?.length) knowledgeBase += `- Required Documents: ${reqs.documents.map((r: any) => r.value).join(', ')}\n`;
  }
  
  // Add program profile information
  if (programProfile) {
    knowledgeBase += `\n**Program Information:**\n`;
    if (programProfile.programName) knowledgeBase += `- Program: ${programProfile.programName}\n`;
    if (programProfile.programId) knowledgeBase += `- Program ID: ${programProfile.programId}\n`;
    if (programProfile.route) knowledgeBase += `- Funding Type: ${programProfile.route}\n`;
  }
  
  // Add other sections context (for cross-section advice)
  if (allPlanContent && Object.keys(allPlanContent).length > 0) {
    knowledgeBase += `\n**Other Business Plan Sections (for context):**\n`;
    Object.entries(allPlanContent).forEach(([key, content]) => {
      if (key !== sectionId && content && content.trim().length > 50) {
        const preview = content.replace(/<[^>]*>/g, '').substring(0, 200);
        knowledgeBase += `- ${key}: ${preview}...\n`;
      }
    });
  }
  
  // Build base prompt
  let prompt = `You are an expert business plan advisor specializing in ${fundingType || 'Austrian and EU'} funding applications. You have deep knowledge of:
- Austrian funding programs (FFG, AWS, WKO, etc.)
- EU funding programs (Horizon Europe, EIC, etc.)
- Austrian business practices, regulations, and tax law
- Bank loan requirements and evaluation criteria
- Equity investment standards and investor expectations
- Business visa requirements and job creation plans
- Best practices from successful funding applications

${knowledgeBase}

**Current Section:** ${sectionTitle}
**User Query:** ${userQuery}
**Current Content:** ${currentContent || 'No content yet'}`;

  // Add section-specific expert guidance if available
  if (expertPrompt) {
    prompt += `\n\n${expertPrompt.expertContext}\n\n**Expert Advice for This Section:**\n${expertPrompt.keyAdvice.map(a => `- ${a}`).join('\n')}\n\n**Best Practices:**\n${expertPrompt.bestPractices.map(p => `- ${p}`).join('\n')}\n\n**Common Mistakes to Avoid:**\n${expertPrompt.commonMistakes.map(m => `- ${m}`).join('\n')}`;
  } else {
    prompt += `\n\n**General Expert Guidance:**\n- Be specific and concrete - avoid vague statements\n- Use data and examples to support your points\n- Align content with program objectives and requirements\n- Ensure clarity and professional tone\n- Address reviewer concerns proactively`;
  }
  
  prompt += `\n\n**Your Task:** Provide comprehensive, actionable business advice based on the user's query. Leverage ALL available knowledge:
- Program-specific requirements and criteria
- Austrian/EU funding best practices
- Cross-section insights from other parts of the business plan
- Domain expertise in funding applications
- Real-world examples and case studies

Give specific, practical advice that helps the user improve their business plan and increase their chances of funding success.`;
  
  return prompt;
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
    sectionId: 'financial_plan',
    sectionTitle: 'Financial Plan',
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
    sectionId: 'market_opportunity',
    sectionTitle: 'Market Opportunity',
    expertContext: `Market opportunity sections must demonstrate the size and attractiveness of the market. Use credible sources and show realistic market sizing.`,
    keyAdvice: [
      'Use TAM (Total Addressable Market), SAM (Serviceable Addressable Market), and SOM (Serviceable Obtainable Market) framework',
      'Cite credible sources: Statistik Austria, Eurostat, WKO market reports',
      'Focus on Austrian market first, then expand to EU if applicable',
      'Identify specific customer segments with clear personas',
      'Show market trends and growth drivers',
      'Demonstrate why now is the right time for this opportunity'
    ],
    commonMistakes: [
      'Inflated market size without credible sources',
      'Generic market analysis not specific to Austria/EU',
      'Not identifying specific customer segments',
      'Missing market trends or growth drivers',
      'Not explaining why now is the right time'
    ],
    bestPractices: [
      'Start with primary research: interviews, surveys, focus groups',
      'Validate assumptions with industry experts',
      'Use multiple sources to triangulate market size',
      'Show understanding of Austrian regulatory environment',
      'Include case studies from similar Austrian companies'
    ],
    fundingTypeSpecific: {
      equity: 'For equity, focus on large addressable market and growth potential.',
      grants: 'For grants, emphasize market need for innovation.'
    }
  },
  {
    sectionId: 'competitive_landscape',
    sectionTitle: 'Competitive Landscape',
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
    sectionId: 'team_qualifications',
    sectionTitle: 'Team & Qualifications',
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
    sectionId: 'project_description',
    sectionTitle: 'Project Description',
    expertContext: `The Project Description is the core of your funding application. It must clearly articulate objectives, methodology, and expected outcomes. For Austrian/EU programs, emphasize innovation, feasibility, and alignment with program goals.`,
    keyAdvice: [
      'Clearly state project objectives using SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)',
      'Explain the current state of the art and how your project advances it',
      'Detail your methodology and approach with clear steps',
      'Show how the project aligns with program objectives (e.g., innovation, sustainability, job creation)',
      'Include measurable outcomes and success criteria',
      'Demonstrate feasibility and technical soundness'
    ],
    commonMistakes: [
      'Vague objectives without clear deliverables',
      'Not explaining how project advances state of the art',
      'Missing methodology or unclear approach',
      'Not aligning with program objectives',
      'Unrealistic timelines or outcomes',
      'Lack of measurable success criteria'
    ],
    bestPractices: [
      'Use structured approach: Objectives → Methodology → Outcomes',
      'Cite relevant research and prior art',
      'Show clear innovation or advancement',
      'Include work packages or phases',
      'Link to program evaluation criteria',
      'Demonstrate technical and commercial feasibility'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize research/innovation aspects, technical feasibility, and knowledge transfer potential.',
      bankLoans: 'For bank loans, focus on business viability, revenue potential, and repayment capacity.',
      equity: 'For equity, highlight growth potential, scalability, and market opportunity.',
      visa: 'For visa applications, emphasize job creation, economic contribution, and long-term commitment to Austria.'
    }
  },
  {
    sectionId: 'innovation_technology',
    sectionTitle: 'Innovation & Technology',
    expertContext: `Innovation and technology sections must demonstrate novelty, technical feasibility, and protection strategy. For Austrian/EU programs, Technology Readiness Level (TRL) is crucial.`,
    keyAdvice: [
      'Clearly state what is novel compared to existing solutions',
      'Provide evidence of prior art and competitive analysis',
      'Specify Technology Readiness Level (TRL) at start and end',
      'Explain intellectual property protection strategy (patents, know-how, trade secrets)',
      'Address technical risks and mitigation strategies',
      'Show technical feasibility and proof of concept if available'
    ],
    commonMistakes: [
      'Claiming innovation without evidence or comparison',
      'Not specifying TRL level',
      'Missing IP protection strategy',
      'Ignoring technical risks',
      'Overstating technical capabilities',
      'Not showing proof of concept or prototype'
    ],
    bestPractices: [
      'Use TRL framework (1-9) to show progression',
      'Compare with state-of-the-art solutions',
      'Include patent searches or prior art analysis',
      'Show technical validation or prototypes',
      'Address scalability and commercialization path',
      'Link innovation to market need'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize research innovation, TRL progression, and knowledge transfer.',
      equity: 'For equity, focus on technological moat, scalability, and competitive advantage.'
    }
  },
  {
    sectionId: 'consortium_partners',
    sectionTitle: 'Consortium Partners',
    expertContext: `Consortium sections must demonstrate strong partnerships, complementary expertise, and effective collaboration. For EU programs, consortium composition is critical.`,
    keyAdvice: [
      'List all partners with clear roles and responsibilities',
      'Show complementary expertise across partners',
      'Explain governance structure and decision-making process',
      'Demonstrate existing relationships or agreements (MoU, LOI)',
      'Show how each partner contributes to project objectives',
      'Address coordination and communication mechanisms'
    ],
    commonMistakes: [
      'Vague partner roles without clear responsibilities',
      'Missing governance structure',
      'No evidence of existing relationships',
      'Partners not aligned with project objectives',
      'Missing coordination mechanisms',
      'Unclear value proposition of each partner'
    ],
    bestPractices: [
      'Use partner matrix showing roles and contributions',
      'Include letters of intent or MoUs',
      'Show track record of collaboration if available',
      'Demonstrate geographic or sector diversity if relevant',
      'Include conflict resolution mechanisms',
      'Show how partners complement each other'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize research collaboration, knowledge transfer, and complementary expertise.'
    }
  },
  {
    sectionId: 'business_model_value_proposition',
    sectionTitle: 'Business Model & Value Proposition',
    expertContext: `The business model must clearly explain how value is created, delivered, and captured. For funding applications, demonstrate revenue potential and sustainability.`,
    keyAdvice: [
      'Clearly explain revenue streams and pricing model',
      'Show value proposition for each customer segment',
      'Demonstrate unit economics and profitability potential',
      'Explain cost structure and scalability',
      'Show competitive advantage and differentiation',
      'Include go-to-market strategy if applicable'
    ],
    commonMistakes: [
      'Unclear revenue model or pricing strategy',
      'Weak value proposition not differentiated from competitors',
      'Missing unit economics or financial projections',
      'Not explaining cost structure',
      'Vague competitive advantage',
      'Missing go-to-market strategy'
    ],
    bestPractices: [
      'Use business model canvas framework',
      'Show customer segments and value propositions',
      'Include pricing strategy and revenue streams',
      'Demonstrate unit economics (CAC, LTV, margins)',
      'Show scalability and growth potential',
      'Link to market opportunity'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, emphasize innovation commercialization and market impact.',
      bankLoans: 'For bank loans, focus on revenue stability and repayment capacity.',
      equity: 'For equity, highlight growth potential and scalability.'
    }
  },
  {
    sectionId: 'timeline_milestones',
    sectionTitle: 'Timeline & Milestones',
    expertContext: `Timeline sections must show realistic schedules with clear milestones and deliverables. For Austrian programs, consider local holidays and business practices.`,
    keyAdvice: [
      'Break down into phases with clear milestones',
      'Include realistic timelines considering dependencies',
      'Show deliverables for each milestone',
      'Identify critical path and dependencies',
      'Include buffer time for unexpected delays',
      'Consider Austrian holidays and business practices'
    ],
    commonMistakes: [
      'Unrealistic timelines without justification',
      'Missing dependencies or critical path',
      'Vague milestones without clear deliverables',
      'Not accounting for Austrian holidays',
      'Missing buffer time for delays',
      'Not showing resource allocation'
    ],
    bestPractices: [
      'Use Gantt chart or timeline visualization',
      'Include quarterly or monthly breakdown',
      'Show key milestones with deliverables',
      'Identify critical path and dependencies',
      'Include risk buffer in timeline',
      'Align with funding program timeline'
    ],
    fundingTypeSpecific: {
      grants: 'For grants, align with program reporting periods and evaluation cycles.',
      bankLoans: 'For bank loans, show repayment schedule and key business milestones.'
    }
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

