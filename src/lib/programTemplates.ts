// Program-Specific Templates System - Phase 3 Step 2
// Generates business plan sections tailored to each funding program

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  order: number;
  content_template: string;
  ai_prompts: string[];
  validation_rules: {
    min_words?: number;
    max_words?: number;
    required_fields?: string[];
    format_requirements?: string[];
  };
  program_specific: boolean;
  industry_hints?: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProgramTemplate {
  program_id: string;
  program_name: string;
  template_name: string;
  description: string;
  sections: TemplateSection[];
  total_sections: number;
  estimated_completion_time: number; // in hours
  difficulty: 'easy' | 'medium' | 'hard';
  industry_focus?: string[];
  target_audience: string[];
}

export class ProgramTemplateEngine {
  private programData: any;

  constructor(programData: any) {
    this.programData = programData;
  }

  /**
   * Generate program-specific template
   */
  generateTemplate(programId: string): ProgramTemplate {
    const program = this.programData.find((p: any) => p.id === programId);
    if (!program) {
      throw new Error(`Program ${programId} not found`);
    }

    const sections = this.buildTemplateSections(program);
    const totalSections = sections.length;
    const estimatedTime = this.calculateEstimatedTime(sections);
    const difficulty = this.calculateTemplateDifficulty(program);

    return {
      program_id: programId,
      program_name: program.name,
      template_name: `${program.name} Business Plan Template`,
      description: `Customized business plan template for ${program.name} application`,
      sections,
      total_sections: totalSections,
      estimated_completion_time: estimatedTime,
      difficulty,
      industry_focus: program.tags || [],
      target_audience: program.target_personas || []
    };
  }

  /**
   * Build template sections from program data
   */
  private buildTemplateSections(program: any): TemplateSection[] {
    const sections: TemplateSection[] = [];

    // 1. Executive Summary (always required)
    sections.push(this.createExecutiveSummarySection(program));

    // 2. Program-specific sections from editor_sections
    if (program.editor_sections && Array.isArray(program.editor_sections)) {
      program.editor_sections.forEach((section: any, index: number) => {
        sections.push({
          id: section.id || `section_${index}`,
          title: section.title || 'Untitled Section',
          description: section.description || 'Program-specific section',
          required: section.required || false,
          order: sections.length + 1,
          content_template: section.content_template || this.getDefaultTemplate(section.id),
          ai_prompts: section.ai_prompts || [],
          validation_rules: section.validation_rules || {},
          program_specific: true,
          industry_hints: program.tags || [],
          difficulty_level: 'intermediate'
        });
      });
    }

    // 3. Standard business plan sections
    sections.push(...this.createStandardSections(program));

    // 4. Innovation-specific sections for innovation programs
    if (program.tags && program.tags.includes('innovation')) {
      sections.push(...this.createInnovationSections(program));
    }

    // 5. Financial sections
    sections.push(...this.createFinancialSections(program));

    // 6. Compliance and legal sections
    sections.push(...this.createComplianceSections(program));

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Create executive summary section
   */
  private createExecutiveSummarySection(program: any): TemplateSection {
    return {
      id: 'executive_summary',
      title: 'Executive Summary',
      description: 'Brief overview of your business and funding request',
      required: true,
      order: 1,
      content_template: this.getExecutiveSummaryTemplate(program),
      ai_prompts: [
        'Summarize your business idea in 2-3 sentences',
        'Explain why you need funding and how much',
        'Highlight your team\'s key strengths',
        'Describe your target market and competitive advantage'
      ],
      validation_rules: {
        min_words: 200,
        max_words: 500,
        required_fields: ['business_concept', 'funding_request', 'team_strengths', 'market_opportunity']
      },
      program_specific: true,
      difficulty_level: 'beginner'
    };
  }

  /**
   * Create standard business plan sections
   */
  private createStandardSections(program: any): TemplateSection[] {
    return [
      {
        id: 'company_description',
        title: 'Company Description',
        description: 'Detailed description of your company and business model',
        required: true,
        order: 2,
        content_template: this.getCompanyDescriptionTemplate(program),
        ai_prompts: [
          'Describe your company\'s mission and vision',
          'Explain your business model and revenue streams',
          'Detail your legal structure and ownership',
          'Describe your location and facilities'
        ],
        validation_rules: {
          min_words: 300,
          max_words: 800,
          required_fields: ['mission', 'business_model', 'legal_structure']
        },
        program_specific: false,
        difficulty_level: 'beginner'
      },
      {
        id: 'market_analysis',
        title: 'Market Analysis',
        description: 'Analysis of your target market and competitive landscape',
        required: true,
        order: 3,
        content_template: this.getMarketAnalysisTemplate(program),
        ai_prompts: [
          'Define your target market and customer segments',
          'Analyze market size and growth potential',
          'Identify key competitors and their strengths/weaknesses',
          'Explain your competitive advantage'
        ],
        validation_rules: {
          min_words: 400,
          max_words: 1000,
          required_fields: ['target_market', 'market_size', 'competition', 'competitive_advantage']
        },
        program_specific: false,
        difficulty_level: 'intermediate'
      },
      {
        id: 'marketing_strategy',
        title: 'Marketing & Sales Strategy',
        description: 'How you will reach and acquire customers',
        required: true,
        order: 4,
        content_template: this.getMarketingStrategyTemplate(program),
        ai_prompts: [
          'Describe your marketing channels and strategies',
          'Explain your sales process and customer acquisition',
          'Detail your pricing strategy',
          'Outline your promotional activities'
        ],
        validation_rules: {
          min_words: 300,
          max_words: 800,
          required_fields: ['marketing_channels', 'sales_process', 'pricing_strategy']
        },
        program_specific: false,
        difficulty_level: 'intermediate'
      }
    ];
  }

  /**
   * Create innovation-specific sections
   */
  private createInnovationSections(program: any): TemplateSection[] {
    return [
      {
        id: 'innovation_description',
        title: 'Innovation & Technology',
        description: 'Detailed description of your innovation and technology',
        required: true,
        order: 5,
        content_template: this.getInnovationTemplate(program),
        ai_prompts: [
          'Describe your innovation and its uniqueness',
          'Explain the technology behind your solution',
          'Detail your intellectual property and patents',
          'Describe your R&D activities and future plans'
        ],
        validation_rules: {
          min_words: 400,
          max_words: 1200,
          required_fields: ['innovation_description', 'technology', 'ip_status', 'rd_plans']
        },
        program_specific: true,
        industry_hints: ['innovation', 'technology', 'research'],
        difficulty_level: 'advanced'
      },
      {
        id: 'technical_feasibility',
        title: 'Technical Feasibility',
        description: 'Technical analysis and feasibility study',
        required: true,
        order: 6,
        content_template: this.getTechnicalFeasibilityTemplate(program),
        ai_prompts: [
          'Explain the technical challenges and solutions',
          'Detail your development timeline and milestones',
          'Describe your technical team and expertise',
          'Address potential technical risks and mitigation'
        ],
        validation_rules: {
          min_words: 300,
          max_words: 1000,
          required_fields: ['technical_challenges', 'development_timeline', 'team_expertise', 'risk_mitigation']
        },
        program_specific: true,
        industry_hints: ['innovation', 'technology'],
        difficulty_level: 'advanced'
      }
    ];
  }

  /**
   * Create financial sections
   */
  private createFinancialSections(program: any): TemplateSection[] {
    return [
      {
        id: 'financial_projections',
        title: 'Financial Projections',
        description: 'Financial forecasts and funding requirements',
        required: true,
        order: 7,
        content_template: this.getFinancialProjectionsTemplate(program),
        ai_prompts: [
          'Provide 3-year financial projections',
          'Detail your funding requirements and use of funds',
          'Explain your revenue model and pricing',
          'Include break-even analysis and key assumptions'
        ],
        validation_rules: {
          min_words: 200,
          max_words: 600,
          required_fields: ['projections', 'funding_requirements', 'revenue_model', 'assumptions']
        },
        program_specific: true,
        difficulty_level: 'intermediate'
      },
      {
        id: 'funding_request',
        title: 'Funding Request',
        description: 'Detailed funding request and use of funds',
        required: true,
        order: 8,
        content_template: this.getFundingRequestTemplate(program),
        ai_prompts: [
          `Request exactly €${program.funding_amount_min?.toLocaleString() || 'X'} - €${program.funding_amount_max?.toLocaleString() || 'Y'}`,
          'Detail how you will use the funding',
          'Explain your repayment plan (if applicable)',
          'Describe your exit strategy (if applicable)'
        ],
        validation_rules: {
          min_words: 150,
          max_words: 400,
          required_fields: ['amount_requested', 'use_of_funds', 'repayment_plan']
        },
        program_specific: true,
        difficulty_level: 'beginner'
      }
    ];
  }

  /**
   * Create compliance sections
   */
  private createComplianceSections(program: any): TemplateSection[] {
    return [
      {
        id: 'compliance_requirements',
        title: 'Compliance & Requirements',
        description: 'Program-specific compliance and requirements',
        required: true,
        order: 9,
        content_template: this.getComplianceTemplate(program),
        ai_prompts: [
          'Address all program-specific requirements',
          'Explain how you meet eligibility criteria',
          'Detail any required certifications or licenses',
          'Describe your compliance monitoring plan'
        ],
        validation_rules: {
          min_words: 200,
          max_words: 500,
          required_fields: ['eligibility', 'requirements', 'compliance_plan']
        },
        program_specific: true,
        difficulty_level: 'intermediate'
      }
    ];
  }

  /**
   * Get executive summary template
   */
  private getExecutiveSummaryTemplate(_program: any): string {
    return `# Executive Summary

## Business Concept
[Describe your business idea and what problem it solves]

## Funding Request
- **Amount Requested**: €[AMOUNT] (within program range: €${_program.funding_amount_min?.toLocaleString() || 'X'} - €${_program.funding_amount_max?.toLocaleString() || 'Y'})
- **Use of Funds**: [How you will use the funding]
- **Program**: ${_program.name}

## Team Strengths
[Highlight your team's key qualifications and experience]

## Market Opportunity
[Describe your target market and competitive advantage]

## Key Milestones
[Outline your main business milestones and timeline]

---
*This executive summary should be 200-500 words and provide a compelling overview of your business and funding request.*`;
  }

  /**
   * Get company description template
   */
  private getCompanyDescriptionTemplate(_program: any): string {
    return `# Company Description

## Mission & Vision
**Mission**: [Your company's mission statement]
**Vision**: [Your company's vision for the future]

## Business Model
[Describe how your business operates and generates revenue]

## Legal Structure
- **Company Type**: [GmbH, AG, etc.]
- **Founded**: [Date]
- **Location**: [City, Country]
- **Ownership**: [Who owns the company]

## Facilities & Operations
[Describe your physical location, facilities, and operational setup]

---
*This section should be 300-800 words and provide a clear picture of your company.*`;
  }

  /**
   * Get marketing strategy template
   */
  private getMarketingStrategyTemplate(_program: any): string {
    return `# Marketing & Sales Strategy

## Marketing Channels
[Describe your marketing channels and strategies]

## Sales Process
[Explain your sales process and customer acquisition]

## Pricing Strategy
[Detail your pricing strategy]

## Promotional Activities
[Outline your promotional activities]

---
*This section should be 300-800 words and demonstrate your marketing approach.*`;
  }

  /**
   * Get market analysis template
   */
  private getMarketAnalysisTemplate(_program: any): string {
    return `# Market Analysis

## Target Market
**Primary Market**: [Define your main customer segment]
**Market Size**: [Total addressable market size]
**Growth Rate**: [Market growth rate and trends]

## Customer Analysis
**Customer Personas**: [Describe your ideal customers]
**Customer Needs**: [What problems do they have that you solve?]
**Buying Behavior**: [How do customers make purchasing decisions?]

## Competitive Analysis
**Direct Competitors**: [List main competitors]
**Competitive Advantages**: [What makes you different?]
**Market Position**: [Where do you fit in the market?]

## Market Entry Strategy
[How will you enter and capture market share?]

---
*This section should be 400-1000 words and demonstrate deep market understanding.*`;
  }

  /**
   * Get technical feasibility template
   */
  private getTechnicalFeasibilityTemplate(_program: any): string {
    return `# Technical Feasibility

## Technical Challenges
[Explain the technical challenges and solutions]

## Development Timeline
[Detail your development timeline and milestones]

## Technical Team
[Describe your technical team and expertise]

## Risk Mitigation
[Address potential technical risks and mitigation]

---
*This section should be 300-1000 words and demonstrate technical viability.*`;
  }

  /**
   * Get innovation template
   */
  private getInnovationTemplate(_program: any): string {
    return `# Innovation & Technology

## Innovation Description
[Describe your innovation and what makes it unique]

## Technology Overview
[Explain the technology behind your solution]

## Intellectual Property
- **Patents**: [List any patents or patent applications]
- **Trademarks**: [Trademark registrations]
- **Trade Secrets**: [Proprietary knowledge or processes]

## Research & Development
[Describe your R&D activities and future plans]

## Technical Team
[Highlight your technical team's expertise and qualifications]

---
*This section should be 400-1200 words and showcase your innovation.*`;
  }

  /**
   * Get financial projections template
   */
  private getFinancialProjectionsTemplate(_program: any): string {
    return `# Financial Projections

## 3-Year Financial Forecast
[Include revenue, expenses, and profit projections]

## Funding Requirements
- **Total Funding Needed**: €[AMOUNT]
- **Use of Funds**:
  - [Category 1]: €[Amount] - [Description]
  - [Category 2]: €[Amount] - [Description]
  - [Category 3]: €[Amount] - [Description]

## Revenue Model
[Explain how you generate revenue and pricing strategy]

## Key Assumptions
[List your key financial assumptions]

## Break-Even Analysis
[When will you break even?]

---
*Include detailed financial tables and charts.*`;
  }

  /**
   * Get funding request template
   */
  private getFundingRequestTemplate(_program: any): string {
    return `# Funding Request

## Requested Amount
**Amount**: €[AMOUNT] (within program range: €${_program.funding_amount_min?.toLocaleString() || 'X'} - €${_program.funding_amount_max?.toLocaleString() || 'Y'})

## Use of Funds
[Detailed breakdown of how you will use the funding]

## Repayment Plan
[If applicable, explain your repayment strategy]

## Exit Strategy
[If applicable, describe your exit strategy]

## Risk Mitigation
[How will you manage financial risks?]

---
*This section should be 150-400 words and clearly justify your funding request.*`;
  }

  /**
   * Get compliance template
   */
  private getComplianceTemplate(_program: any): string {
    return `# Compliance & Requirements

## Program Eligibility
[Explain how you meet the program's eligibility criteria]

## Required Documents
[List all required documents and their status]

## Certifications & Licenses
[Detail any required certifications or licenses]

## Compliance Plan
[How will you ensure ongoing compliance?]

---
*Address all program-specific requirements and demonstrate compliance.*`;
  }

  /**
   * Get default template for unknown sections
   */
  private getDefaultTemplate(sectionId: string): string {
    return `# ${sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

[Add your content here]

---
*This is a program-specific section. Please provide relevant content.*`;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedTime(sections: TemplateSection[]): number {
    const timePerSection = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3
    };

    return sections.reduce((total, section) => {
      return total + (timePerSection[section.difficulty_level] || 1);
    }, 0);
  }

  /**
   * Calculate template difficulty
   */
  private calculateTemplateDifficulty(program: any): 'easy' | 'medium' | 'hard' {
    let score = 0;

    // More funding = harder
    if (program.funding_amount_max > 500000) score += 2;
    else if (program.funding_amount_max > 100000) score += 1;

    // More requirements = harder
    if (program.requirements && Object.keys(program.requirements).length > 5) score += 2;
    else if (program.requirements && Object.keys(program.requirements).length > 3) score += 1;

    // Innovation focus = harder
    if (program.tags && program.tags.includes('innovation')) score += 1;

    // Complex eligibility = harder
    if (program.eligibility_criteria && Object.keys(program.eligibility_criteria).length > 3) score += 1;

    if (score >= 4) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
  }

  /**
   * Get template for specific program
   */
  getTemplateForProgram(programId: string): ProgramTemplate {
    return this.generateTemplate(programId);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): ProgramTemplate[] {
    return this.programData.map((program: any) => this.generateTemplate(program.id));
  }
}

/**
 * Factory function to create template engine
 */
export function createTemplateEngine(programData: any[]): ProgramTemplateEngine {
  return new ProgramTemplateEngine(programData);
}

/**
 * Utility function to get template for a specific program
 */
export async function getTemplateForProgram(programId: string): Promise<ProgramTemplate> {
  // This would fetch program data and create template
  // For now, return a mock template
  const mockProgram = {
    id: programId,
    name: 'Sample Program',
    funding_amount_min: 50000,
    funding_amount_max: 200000,
    tags: ['innovation'],
    target_personas: ['startup'],
    editor_sections: [],
    requirements: {},
    eligibility_criteria: {}
  };

  const engine = new ProgramTemplateEngine([mockProgram]);
  return engine.generateTemplate(programId);
}
