// ========= PLAN2FUND — EXAMPLES =========
// Sample content and templates for each section
// Based on GPT agent comprehensive instructions

export interface SectionExample {
  sectionId: string;
  examples: string[];
  industry?: string;
  fundingType?: string;
}

// ============================================================================
// SECTION EXAMPLES
// ============================================================================

export const SECTION_EXAMPLES: SectionExample[] = [
  {
    sectionId: 'executive_summary',
    examples: [
      `Our project addresses the lack of affordable carbon‑free heating by developing a modular heat‑pump system that reduces installation costs by 40% compared to existing solutions. This technology is at TRL 6 with prototypes tested in three Austrian households, demonstrating 60% energy savings. We seek €1.5 M of Horizon Europe funding covering 60% of the €2.5 M budget. Over 20 new jobs will be created within five years, contributing to Austria's climate neutrality goals.`,
      `We propose an AI-powered diagnostic tool for early cancer detection that reduces false positives by 40% while maintaining 95% accuracy. Our solution is at TRL 7 with clinical trials completed in two European hospitals. We request €2M in EIC Accelerator funding representing 70% of total costs. This will create 15 high-tech jobs and benefit 50,000 patients annually, generating €10M in healthcare cost savings.`,
      `Our fintech platform democratizes access to sustainable investment opportunities for retail investors, currently underserved by traditional wealth management. The platform uses AI to match investor preferences with verified green projects, achieving 25% higher returns than conventional portfolios. We seek €800K in AWS Seed funding to scale to 10,000 users across Austria and Germany, creating 12 jobs and facilitating €50M in green investments.`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'executive_summary',
    examples: [
      `TechFlow Solutions is a B2B SaaS company providing automated workflow optimization for manufacturing SMEs. We need €500K in bank financing to expand our sales team and develop our AI-powered analytics platform. With 150 paying customers and €2M ARR, we project €5M revenue by 2025. The loan will be repaid through increased subscription revenue, with a DSCR of 1.8x. Our collateral includes €300K in equipment and €200K in accounts receivable.`,
      `GreenBuild Construction specializes in sustainable building materials and has secured contracts worth €3M for 2024. We require €800K working capital loan to purchase materials and hire 15 additional workers. Our 5-year track record shows consistent profitability with 15% margins. The loan will be secured against our €1.2M equipment and guaranteed by our €500K property. Repayment through project cash flows over 3 years.`
    ],
    industry: 'general',
    fundingType: 'bankLoans'
  },
  {
    sectionId: 'executive_summary',
    examples: [
      `DataVault is a cybersecurity startup protecting sensitive enterprise data with zero-trust architecture. We've achieved €1M ARR with 200% YoY growth and 95% customer retention. Our TAM is €50B with 20% CAGR. We're raising €3M Series A to scale sales and expand to US market. With our experienced team and proven product-market fit, we project €20M ARR by 2026 and 10x return for investors through strategic acquisition.`,
      `MediScan develops AI-powered medical imaging software that detects early-stage diseases 30% faster than radiologists. We have 50 hospital customers, €2.5M ARR, and FDA approval pending. The $15B medical AI market grows 40% annually. We're raising $5M to accelerate FDA approval and scale sales. Our team includes former Google AI researchers and medical professionals, positioning us for rapid growth and potential IPO.`
    ],
    industry: 'general',
    fundingType: 'equity'
  },
  {
    sectionId: 'executive_summary',
    examples: [
      `I am a software engineer with 8 years of experience in fintech, seeking the Red-White-Red Card to establish a digital banking platform in Austria. My business will create 25 jobs over 3 years, focusing on financial inclusion for immigrants and SMEs. With €200K personal investment and €500K from Austrian partners, we'll develop innovative payment solutions. This aligns with Austria's digital transformation goals and will generate €2M annual revenue by year 3.`,
      `As a biotech researcher with a PhD from MIT, I plan to establish a personalized medicine company in Vienna. My business will create 15 high-skilled jobs and develop cancer treatment solutions using AI and genomics. With €300K personal funds and €1M from Austrian investors, we'll establish a research lab and clinical partnerships. This supports Austria's life sciences strategy and will create significant economic value through job creation and innovation.`
    ],
    industry: 'general',
    fundingType: 'visa'
  },
  {
    sectionId: 'market_analysis',
    examples: [
      `The European residential heating market is worth €40B with a CAGR of 4%, driven by climate regulations and energy cost concerns. Our primary customer segment consists of 15M homeowners in Central Europe seeking affordable heating solutions. We target a Serviceable Obtainable Market of €200M within five years, focusing on Austria, Germany, and Switzerland. Market research shows 60% of homeowners are willing to pay premium for sustainable heating, with average willingness to pay 20% above conventional systems.`,
      `The global medical AI market is valued at $15B and growing at 40% CAGR, driven by increasing healthcare costs and radiologist shortages. Our target market includes 2,000 hospitals in Europe with imaging capabilities, representing a €2B opportunity. Customer research reveals 80% of radiologists are overwhelmed with case volume and 70% would adopt AI tools that improve accuracy. We focus on mid-sized hospitals (200-500 beds) that lack in-house AI expertise but have budget for technology solutions.`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'market_analysis',
    examples: [
      `The Austrian SME market includes 340,000 companies, with 45% in manufacturing and 35% in services. Our target segment of manufacturing SMEs (50-500 employees) represents 50,000 companies with average IT spending of €50K annually. Market research shows 70% struggle with inefficient processes and 60% are interested in automation solutions. The Austrian government's digitalization initiative provides additional incentives, with €200M in funding available for SME technology adoption.`,
      `The European B2B SaaS market is worth €25B and growing 15% annually, with Austria representing €800M. Our target customers are mid-market companies (100-1000 employees) in professional services, representing 15,000 potential customers. Research shows 65% use multiple disconnected tools and 80% would pay for integrated solutions. The average deal size is €25K annually, with 90% customer retention and 20% expansion revenue.`
    ],
    industry: 'general',
    fundingType: 'bankLoans'
  },
  {
    sectionId: 'market_analysis',
    examples: [
      `The global cybersecurity market is $150B and growing 12% annually, with enterprise security representing $60B. Our target market includes 50,000 mid-to-large enterprises globally that handle sensitive data, with average security spending of $2M annually. Customer research shows 85% have experienced data breaches and 90% are increasing security budgets. We focus on financial services, healthcare, and government sectors where compliance drives adoption. Our TAM is $10B, SAM is $2B, and SOM is $200M within 5 years.`,
      `The global fintech market is $310B and growing 20% annually, with digital banking representing $50B. Our target includes 200M retail investors globally seeking sustainable investment options, with average investable assets of $25K. Research shows 60% want sustainable investments but find them complex, and 70% would use AI-powered recommendations. We focus on Europe and North America where ESG investing is mainstream, representing a $5B addressable market.`
    ],
    industry: 'general',
    fundingType: 'equity'
  },
  {
    sectionId: 'innovation_plan',
    examples: [
      `Our innovation combines advanced heat pump technology with AI-optimized control systems, achieving 40% higher efficiency than conventional systems. We're at TRL 6 with laboratory prototypes demonstrating 4.5 COP (Coefficient of Performance) compared to industry average of 3.2. Our modular design reduces installation complexity by 60% and costs by 40%. The technology builds on 3 years of research at TU Wien and includes 2 pending patents. We have validation from 3 pilot customers showing 60% energy savings and 18-month payback period.`,
      `Our AI diagnostic platform uses deep learning to analyze medical images with 95% accuracy, compared to 85% for human radiologists. We're at TRL 7 with FDA clinical trials completed, showing 30% faster diagnosis and 40% reduction in false positives. The technology combines computer vision with natural language processing to generate detailed reports. We have 2 granted patents and 3 pending applications, with validation from 5 hospitals across Europe. Our proprietary dataset includes 100,000+ anonymized images from diverse populations.`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'innovation_plan',
    examples: [
      `Our platform uses machine learning to optimize manufacturing workflows, reducing waste by 25% and improving efficiency by 30%. We're at TRL 8 with 50+ production deployments across Europe. The technology combines IoT sensors with predictive analytics to optimize production schedules and maintenance. We have 3 granted patents and 2 pending applications. Our competitive advantage includes proprietary algorithms trained on 10M+ production hours and real-time optimization capabilities that competitors lack.`,
      `Our cybersecurity solution uses zero-trust architecture with AI-powered threat detection, preventing 99.7% of attacks compared to 85% for traditional solutions. We're at TRL 9 with 200+ enterprise customers and $1M ARR. The technology includes behavioral analytics and automated response capabilities. We have 5 granted patents and 3 pending applications. Our competitive advantage is the combination of zero-trust principles with AI, which no competitor offers in an integrated solution.`
    ],
    industry: 'general',
    fundingType: 'equity'
  },
  {
    sectionId: 'financial_plan',
    examples: [
      `Total project budget: €2.5M over 36 months
- Personnel (60%): €1.5M for 8 FTE researchers and engineers
- Equipment (25%): €625K for laboratory equipment and testing facilities  
- Materials (10%): €250K for prototype development and testing
- Other costs (5%): €125K for travel, conferences, and administration

Funding structure:
- EU Horizon Europe: €1.5M (60%)
- Company co-financing: €750K (30%)
- Austrian FFG: €250K (10%)

Revenue projections:
- Year 1: €0 (R&D phase)
- Year 2: €200K (pilot sales)
- Year 3: €800K (commercial launch)
- Year 4: €2M (market expansion)
- Year 5: €5M (international expansion)`,
      `Total project budget: €1.8M over 24 months
- Personnel (70%): €1.26M for 6 FTE developers and researchers
- Equipment (20%): €360K for development infrastructure
- Subcontracting (8%): €144K for external testing and validation
- Other costs (2%): €36K for administration and legal

Funding structure:
- EIC Accelerator: €1.26M (70%)
- Company co-financing: €540K (30%)

Revenue projections:
- Year 1: €0 (development phase)
- Year 2: €500K (beta customers)
- Year 3: €2M (commercial launch)
- Year 4: €8M (scale-up)
- Year 5: €20M (market leadership)`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'financial_plan',
    examples: [
      `Loan request: €500K for 5 years at 4.5% interest
Monthly payment: €9,300
Use of funds:
- Equipment: €200K (40%)
- Working capital: €200K (40%)
- Marketing: €100K (20%)

Financial projections:
- Current revenue: €2M (2023)
- Projected revenue: €3.5M (2024), €5M (2025), €7M (2026)
- Current EBITDA: €400K (20% margin)
- Projected EBITDA: €700K (2024), €1M (2025), €1.4M (2026)

Debt service coverage:
- 2024: 1.8x (€700K EBITDA / €390K debt service)
- 2025: 2.1x (€1M EBITDA / €470K debt service)
- 2026: 2.4x (€1.4M EBITDA / €580K debt service)

Collateral: €300K equipment + €200K accounts receivable`,
      `Loan request: €800K for 3 years at 5.2% interest
Monthly payment: €24,000
Use of funds:
- Materials: €400K (50%)
- Equipment: €200K (25%)
- Working capital: €200K (25%)

Financial projections:
- Current revenue: €1.5M (2023)
- Projected revenue: €3M (2024), €4.5M (2025), €6M (2026)
- Current EBITDA: €300K (20% margin)
- Projected EBITDA: €600K (2024), €900K (2025), €1.2M (2026)

Debt service coverage:
- 2024: 2.1x (€600K EBITDA / €288K debt service)
- 2025: 2.5x (€900K EBITDA / €360K debt service)
- 2026: 2.8x (€1.2M EBITDA / €432K debt service)

Collateral: €500K property + €300K equipment`
    ],
    industry: 'general',
    fundingType: 'bankLoans'
  },
  {
    sectionId: 'team_management',
    examples: [
      `CEO & Co-founder: Dr. Sarah Mueller, PhD in Mechanical Engineering from TU Wien, 8 years at Siemens in heat pump R&D, led 3 successful product launches generating €50M revenue.

CTO & Co-founder: Marcus Weber, MS Computer Science from ETH Zurich, 10 years at Google in AI/ML, published 15 papers on energy optimization, holds 5 patents.

Head of Engineering: Dr. Anna Schmidt, PhD in Physics from University of Vienna, 6 years at ABB in power systems, expert in heat transfer and thermodynamics.

Advisory Board:
- Prof. Dr. Hans Gruber, Director of Energy Institute at TU Wien
- Dr. Lisa Fischer, former VP Engineering at Viessmann
- Dr. Thomas Berger, Investment Director at Energy Ventures`,
      `CEO & Co-founder: Dr. Michael Chen, MD PhD from Harvard Medical School, 12 years at Mayo Clinic in radiology, published 50+ papers on medical imaging, holds 8 patents.

CTO & Co-founder: Dr. Elena Rodriguez, PhD in Computer Science from Stanford, 8 years at Google DeepMind, expert in medical AI, published 30+ papers.

Head of Clinical Affairs: Dr. James Wilson, MD from Johns Hopkins, 10 years at Cleveland Clinic, specialist in diagnostic imaging and clinical trials.

Advisory Board:
- Prof. Dr. Maria Garcia, Director of Radiology at Charité Berlin
- Dr. Robert Kim, former CTO at GE Healthcare
- Dr. Susan Lee, Partner at HealthTech Ventures`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'team_management',
    examples: [
      `CEO & Co-founder: Alex Thompson, MBA from Wharton, 10 years at McKinsey in digital transformation, led 20+ B2B SaaS implementations, former VP at Salesforce.

CTO & Co-founder: Dr. Priya Patel, PhD in Computer Science from MIT, 8 years at Google in machine learning, published 25+ papers on optimization algorithms, holds 6 patents.

VP of Sales: Maria Gonzalez, 12 years at HubSpot and Salesforce, built sales teams from 0 to 100+ reps, achieved $50M+ ARR growth.

VP of Engineering: David Kim, MS Computer Science from Stanford, 10 years at Amazon and Microsoft, led development of enterprise platforms serving 1M+ users.

Advisory Board:
- John Smith, former CEO of Workday
- Dr. Lisa Wang, Partner at Andreessen Horowitz
- Mike Johnson, former CRO at Slack`,
      `CEO & Co-founder: Dr. Sarah Williams, PhD in Cybersecurity from Carnegie Mellon, 15 years at IBM Security, led incident response for Fortune 500 companies, holds 12 patents.

CTO & Co-founder: Dr. James Liu, PhD in Computer Science from Stanford, 10 years at Google in security research, expert in zero-trust architecture, published 40+ papers.

VP of Product: Rachel Green, 8 years at Okta and Auth0, built identity products used by 10M+ users, expert in enterprise security.

VP of Engineering: Tom Brown, MS Computer Science from MIT, 12 years at Microsoft and Amazon, led development of security platforms processing 1B+ events daily.

Advisory Board:
- Dr. Mark Davis, former CISO at JP Morgan
- Lisa Chen, Partner at Sequoia Capital
- Dr. Robert Taylor, former CTO at Symantec`
    ],
    industry: 'general',
    fundingType: 'equity'
  },
  {
    sectionId: 'impact_assessment',
    examples: [
      `Environmental Impact:
- CO2 reduction: 2,500 tons annually per 1,000 installations
- Energy savings: 60% compared to conventional heating
- Renewable energy integration: 80% of installations use solar/wind
- Lifecycle emissions: 70% lower than gas boilers

Economic Impact:
- Job creation: 20 direct jobs, 50 indirect jobs in supply chain
- Local manufacturing: 80% of components sourced in Austria
- Export potential: €50M annual exports to EU markets
- Cost savings: €2,000 annually per household

Social Impact:
- Energy poverty reduction: 30% lower heating costs for low-income households
- Health benefits: Improved air quality reduces respiratory diseases
- Education: Training programs for 200+ installers
- Innovation: 5 PhD students, 10 research collaborations`,
      `Environmental Impact:
- Medical waste reduction: 40% fewer unnecessary procedures
- Energy efficiency: 25% reduction in hospital energy consumption
- Paperless workflow: 90% reduction in printed reports
- Carbon footprint: 50% lower than traditional diagnostic methods

Economic Impact:
- Healthcare cost savings: €10M annually across 50 hospitals
- Job creation: 15 direct jobs, 30 indirect jobs
- Export potential: €100M annual exports to global markets
- Productivity gains: 30% faster diagnosis, 20% more patients treated

Social Impact:
- Early detection: 30% improvement in early-stage disease detection
- Access to care: 50% reduction in diagnostic wait times
- Medical education: Training programs for 500+ radiologists
- Research collaboration: 20+ academic partnerships`
    ],
    industry: 'general',
    fundingType: 'grants'
  },
  {
    sectionId: 'job_creation_plan',
    examples: [
      `Job Creation Timeline:
Year 1: 8 jobs (4 developers, 2 researchers, 1 marketing, 1 operations)
Year 2: 15 jobs (+4 developers, +2 sales, +1 customer success)
Year 3: 25 jobs (+5 developers, +3 sales, +2 marketing)

Job Types and Salaries:
- Software Engineers: €55K-€75K (8 positions)
- AI/ML Researchers: €65K-€85K (4 positions)
- Sales Representatives: €45K-€65K + commission (6 positions)
- Marketing Specialists: €40K-€60K (3 positions)
- Operations Manager: €50K-€70K (2 positions)
- Customer Success: €35K-€55K (2 positions)

Recruitment Strategy:
- University partnerships with TU Wien and University of Vienna
- International talent acquisition through LinkedIn and AngelList
- Employee referral program with €5K bonus
- Internship program for 10 students annually

Economic Impact:
- Total salaries: €1.2M annually by year 3
- Social security contributions: €300K annually
- Income tax contributions: €200K annually
- Local spending: €500K annually on services and supplies`,
      `Job Creation Timeline:
Year 1: 12 jobs (6 developers, 3 researchers, 2 sales, 1 operations)
Year 2: 20 jobs (+4 developers, +2 researchers, +2 sales)
Year 3: 30 jobs (+5 developers, +3 sales, +2 marketing)

Job Types and Salaries:
- Software Engineers: €60K-€80K (12 positions)
- AI/ML Researchers: €70K-€90K (6 positions)
- Sales Representatives: €50K-€70K + commission (8 positions)
- Marketing Specialists: €45K-€65K (4 positions)

Recruitment Strategy:
- Partnerships with technical universities across Europe
- International recruitment through specialized agencies
- Employee referral program with €8K bonus
- Graduate program for 15 students annually

Economic Impact:
- Total salaries: €1.8M annually by year 3
- Social security contributions: €450K annually
- Income tax contributions: €300K annually
- Local spending: €750K annually on services and supplies`
    ],
    industry: 'general',
    fundingType: 'visa'
  }
];

// ============================================================================
// INDUSTRY-SPECIFIC EXAMPLES
// ============================================================================

export const INDUSTRY_EXAMPLES: Record<string, SectionExample[]> = {
  technology: [
    {
      sectionId: 'innovation_plan',
      industry: 'technology',
      examples: [
        `Our AI-powered platform uses advanced machine learning algorithms to optimize software development workflows, reducing development time by 40% and bug rates by 60%. We're at TRL 8 with 100+ enterprise customers and $2M ARR. The technology combines natural language processing with code analysis to provide intelligent suggestions and automated testing. We have 3 granted patents and 5 pending applications, with validation from Fortune 500 companies showing 50% productivity gains.`,
        `Our blockchain-based identity verification system provides zero-knowledge proof authentication, ensuring privacy while maintaining security. We're at TRL 7 with pilot deployments in 3 countries. The technology uses advanced cryptography to verify identity without storing personal data, addressing GDPR compliance concerns. We have 2 granted patents and 4 pending applications, with validation from financial institutions showing 99.9% accuracy and 80% cost reduction.`
      ]
    }
  ],
  healthcare: [
    {
      sectionId: 'innovation_plan',
      industry: 'healthcare',
      examples: [
        `Our AI diagnostic platform uses deep learning to analyze medical images with 98% accuracy, compared to 85% for human radiologists. We're at TRL 7 with FDA clinical trials completed, showing 40% faster diagnosis and 50% reduction in false positives. The technology combines computer vision with natural language processing to generate detailed reports. We have 4 granted patents and 6 pending applications, with validation from 10 hospitals across Europe showing significant clinical benefits.`,
        `Our personalized medicine platform uses genomics and AI to predict drug responses, improving treatment efficacy by 35% and reducing side effects by 50%. We're at TRL 6 with clinical trials in 5 countries. The technology combines genetic analysis with machine learning to provide personalized treatment recommendations. We have 5 granted patents and 8 pending applications, with validation from oncologists showing improved patient outcomes.`
      ]
    }
  ],
  greenTech: [
    {
      sectionId: 'innovation_plan',
      industry: 'greenTech',
      examples: [
        `Our carbon capture technology uses advanced materials to remove CO2 from industrial emissions at 50% lower cost than existing solutions. We're at TRL 6 with pilot installations at 3 industrial sites, demonstrating 90% CO2 capture efficiency. The technology uses proprietary sorbents that can be regenerated multiple times, reducing operational costs. We have 6 granted patents and 4 pending applications, with validation from steel and cement manufacturers showing significant environmental impact.`,
        `Our renewable energy storage system uses innovative battery technology to store solar and wind energy for 24+ hours, addressing intermittency challenges. We're at TRL 7 with grid-scale deployments in 2 countries, demonstrating 95% round-trip efficiency. The technology uses sustainable materials and can be recycled, supporting circular economy principles. We have 8 granted patents and 6 pending applications, with validation from utility companies showing grid stability improvements.`
      ]
    }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get examples for a specific section
 */
export function getExamplesForSection(sectionId: string, industry?: string, fundingType?: string): string[] {
  let examples = SECTION_EXAMPLES.filter(example => 
    example.sectionId === sectionId &&
    (!industry || example.industry === industry || example.industry === 'general') &&
    (!fundingType || example.fundingType === fundingType || example.fundingType === 'general')
  ).flatMap(example => example.examples);

  // Add industry-specific examples if available
  if (industry && INDUSTRY_EXAMPLES[industry]) {
    const industryExamples = INDUSTRY_EXAMPLES[industry].filter(example => 
      example.sectionId === sectionId
    ).flatMap(example => example.examples);
    examples = [...examples, ...industryExamples];
  }

  return examples;
}

/**
 * Get a random example for a section
 */
export function getRandomExample(sectionId: string, industry?: string, fundingType?: string): string | null {
  const examples = getExamplesForSection(sectionId, industry, fundingType);
  if (examples.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * examples.length);
  return examples[randomIndex];
}

/**
 * Get all available section IDs
 */
export function getAvailableSectionIds(): string[] {
  return [...new Set(SECTION_EXAMPLES.map(example => example.sectionId))];
}

/**
 * Get all available industries
 */
export function getAvailableIndustries(): string[] {
  const industries = new Set<string>();
  SECTION_EXAMPLES.forEach(example => {
    if (example.industry) industries.add(example.industry);
  });
  Object.keys(INDUSTRY_EXAMPLES).forEach(industry => industries.add(industry));
  return Array.from(industries);
}

/**
 * Get all available funding types
 */
export function getAvailableFundingTypes(): string[] {
  return [...new Set(SECTION_EXAMPLES.map(example => example.fundingType).filter(Boolean) as string[])];
}

/**
 * Add a new example
 */
export function addExample(example: SectionExample): void {
  SECTION_EXAMPLES.push(example);
}

/**
 * Get examples by industry
 */
export function getExamplesByIndustry(industry: string): SectionExample[] {
  return SECTION_EXAMPLES.filter(example => example.industry === industry);
}

/**
 * Get examples by funding type
 */
export function getExamplesByFundingType(fundingType: string): SectionExample[] {
  return SECTION_EXAMPLES.filter(example => example.fundingType === fundingType);
}
