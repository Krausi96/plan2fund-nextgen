// ========= PLAN2FUND — INDUSTRY VARIATIONS DATA =========
// Industry-specific template variations and customizations
// Enhanced with comprehensive GPT agent structure

// import { IndustryVariation } from '../standardSectionTemplates';

export interface IndustryVariation {
  industry: string;
  modifications: {
    description: string;
    prompts: string[];
    validationRules: Record<string, any>;
    tips: string[];
    commonMistakes: string[];
    sections?: Record<string, any>;
    requirements?: string[];
    customizations?: string[];
    [key: string]: any; // Allow additional properties
  };
}

export const INDUSTRY_VARIATIONS: IndustryVariation[] = [
  {
    industry: 'technology',
    modifications: {
      description: 'For technology projects, emphasise software architecture, scalability and IP protection.',
      prompts: [
        'Describe your software/hardware architecture',
        'Explain your intellectual property strategy',
        'How will your technology scale to millions of users?',
        'What development methodologies do you use?',
        'How do you ensure code quality and security?'
      ],
      validationRules: {
        requiredFields: ['tech_stack', 'ip_strategy', 'scalability_plan'],
        formatRequirements: ['technical_documentation', 'architecture_diagrams'],
        qualityChecks: [
          'Check for clear explanation of tech stack',
          'Ensure IP ownership is addressed',
          'Verify scalability claims with technical details',
          'Confirm security measures are documented'
        ]
      },
      tips: [
        'Focus on technical architecture and scalability',
        'Highlight intellectual property and competitive advantages',
        'Include performance metrics and benchmarks',
        'Address security and data protection concerns'
      ],
      commonMistakes: [
        'Not explaining technical architecture clearly',
        'Missing intellectual property strategy',
        'Unrealistic scalability claims without evidence',
        'Ignoring security and compliance requirements'
      ]
    }
  },
  {
    industry: 'manufacturing',
    modifications: {
      description: 'For manufacturing, detail production processes, facilities and supply‑chain partners.',
      prompts: [
        'What manufacturing processes will you use?',
        'Describe your facilities and equipment',
        'Who are your key suppliers and logistics partners?',
        'How will you ensure quality control?',
        'What certifications do you need (ISO 9001, etc.)?'
      ],
      validationRules: {
        requiredFields: ['production_processes', 'facilities', 'suppliers'],
        formatRequirements: ['production_documentation', 'certification_proof'],
        qualityChecks: [
          'Ensure production capacity matches forecast',
          'Include certifications (e.g., ISO 9001)',
          'Verify supply chain reliability',
          'Confirm quality control procedures'
        ]
      },
      tips: [
        'Detail production processes and capacity',
        'Include facility and equipment specifications',
        'Address supply chain and logistics',
        'Highlight quality control and certifications'
      ],
      commonMistakes: [
        'Not detailing production processes',
        'Missing facility and equipment information',
        'Unclear supply chain management',
        'Ignoring quality control requirements'
      ]
    }
  },
  {
    industry: 'services',
    modifications: {
      description: 'For service businesses, focus on service delivery model and customer experience.',
      prompts: [
        'What services do you offer and how are they delivered?',
        'Describe your customer experience and quality assurance',
        'How will you scale your service operations?',
        'What technology platforms do you use?',
        'How do you measure customer satisfaction?'
      ],
      validationRules: {
        requiredFields: ['service_offerings', 'delivery_model', 'customer_experience'],
        formatRequirements: ['service_documentation', 'quality_metrics'],
        qualityChecks: [
          'Ensure service delivery model is clear',
          'Include customer experience metrics',
          'Verify scalability plans',
          'Confirm quality assurance procedures'
        ]
      },
      tips: [
        'Focus on service delivery and customer experience',
        'Include technology platforms and tools',
        'Address scalability and operational efficiency',
        'Highlight customer satisfaction metrics'
      ],
      commonMistakes: [
        'Not explaining service delivery model',
        'Missing customer experience details',
        'Unclear scalability strategy',
        'Ignoring quality assurance measures'
      ]
    }
  },
  {
    industry: 'healthcare',
    modifications: {
      description: 'Healthcare projects must address clinical evidence, regulatory approvals and patient safety.',
      prompts: [
        'Summarise pre‑clinical and clinical trial results',
        'Detail your regulatory strategy (e.g., CE marking, EMA approvals)',
        'Explain your quality management and patient safety procedures',
        'What clinical evidence supports your claims?',
        'How do you ensure data privacy and security?'
      ],
      validationRules: {
        requiredFields: ['clinical_evidence', 'regulatory_strategy', 'patient_safety'],
        formatRequirements: ['regulatory_documentation', 'clinical_data'],
        qualityChecks: [
          'Verify compliance with medical regulations',
          'Include data privacy considerations',
          'Confirm clinical evidence is provided',
          'Ensure patient safety measures are documented'
        ]
      },
      tips: [
        'Emphasize clinical evidence and regulatory compliance',
        'Include patient safety and quality management',
        'Address data privacy and security requirements',
        'Highlight regulatory strategy and approvals'
      ],
      commonMistakes: [
        'Missing clinical evidence',
        'Not addressing regulatory requirements',
        'Ignoring patient safety concerns',
        'Insufficient data privacy measures'
      ]
    }
  },
  {
    industry: 'greenTech',
    modifications: {
      description: 'Green tech projects should highlight environmental benefits and alignment with EU Green Deal.',
      prompts: [
        'Quantify environmental benefits (e.g., CO₂ reduction)',
        'Describe how your project aligns with the EU Taxonomy for sustainable activities',
        'Identify any environmental certifications or labels you will pursue',
        'What is your carbon footprint and lifecycle impact?',
        'How do you measure and report environmental impact?'
      ],
      validationRules: {
        requiredFields: ['environmental_benefits', 'sustainability_metrics', 'eu_taxonomy'],
        formatRequirements: ['environmental_documentation', 'certification_proof'],
        qualityChecks: [
          'Ensure lifecycle assessment is included',
          'Verify sustainability claims with data',
          'Confirm EU Taxonomy alignment',
          'Include environmental impact metrics'
        ]
      },
      tips: [
        'Quantify environmental benefits with specific metrics',
        'Align with EU Green Deal and Taxonomy',
        'Include lifecycle assessment and carbon footprint',
        'Highlight environmental certifications and standards'
      ],
      commonMistakes: [
        'Not quantifying environmental benefits',
        'Missing EU Green Deal alignment',
        'Unclear environmental impact metrics',
        'Ignoring lifecycle assessment requirements'
      ]
    }
  }
];

// Legacy template configs for backward compatibility
export const LEGACY_INDUSTRY_VARIATIONS = [
  {
    id: 'tech-startup',
    name: 'Tech Startup Template',
    agency: 'Generic',
    description: 'Technology startup business plan template',
    industry: 'Technology',
    sections: ['execSummary', 'productDescription', 'marketAnalysis', 'businessModel', 'financialProjections', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'modern',
      tone: 'enthusiastic',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'biotech-research',
    name: 'Biotech Research Template',
    agency: 'Generic',
    description: 'Biotechnology research proposal template',
    industry: 'Biotechnology',
    sections: ['execSummary', 'researchObjectives', 'methodology', 'timeline', 'budget', 'team'],
    formatting: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'clean-energy',
    name: 'Clean Energy Template',
    agency: 'Generic',
    description: 'Clean energy project proposal template',
    industry: 'Clean Energy',
    sections: ['execSummary', 'projectDescription', 'environmentalImpact', 'implementation', 'budget', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'modern',
      tone: 'enthusiastic',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Template',
    agency: 'Generic',
    description: 'Manufacturing business plan template',
    industry: 'Manufacturing',
    sections: ['execSummary', 'businessDescription', 'marketAnalysis', 'operations', 'financialProjections', 'management'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'formal',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'fintech',
    name: 'FinTech Template',
    agency: 'Generic',
    description: 'Financial technology business plan template',
    industry: 'FinTech',
    sections: ['execSummary', 'productDescription', 'marketAnalysis', 'regulatoryCompliance', 'financialProjections', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'modern',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  },
  {
    id: 'healthcare',
    name: 'Healthcare Template',
    agency: 'Generic',
    description: 'Healthcare innovation proposal template',
    industry: 'Healthcare',
    sections: ['execSummary', 'projectDescription', 'clinicalImpact', 'implementation', 'budget', 'team'],
    formatting: {
      fontFamily: 'Arial',
      fontSize: 12,
      lineSpacing: 1.5,
      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      headerStyle: 'formal',
      tone: 'technical',
      language: 'en',
      pageNumbers: true,
      tableOfContents: true
    },
    isOfficial: false
  }
];
