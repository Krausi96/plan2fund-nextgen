// Editor Templates - Central repository of writing prompts keyed by section names
import { EditorRequirement } from '../types/requirements';

export class EditorTemplates {
  /**
   * Get template for a specific section
   */
  static getTemplate(sectionName: string, programType: string): EditorRequirement {
    const templates = this.getTemplatesByProgramType(programType);
    return templates[sectionName] || this.getDefaultTemplate(sectionName);
  }

  /**
   * Get all templates for a program type
   */
  static getTemplatesByProgramType(programType: string): Record<string, EditorRequirement> {
    switch (programType) {
      case 'grant':
        return this.getGrantTemplates();
      case 'loan':
        return this.getLoanTemplates();
      case 'equity':
        return this.getEquityTemplates();
      case 'visa':
        return this.getVisaTemplates();
      case 'consulting':
        return this.getConsultingTemplates();
      case 'service':
        return this.getServiceTemplates();
      default:
        return this.getDefaultTemplates();
    }
  }

  /**
   * Grant program templates
   */
  private static getGrantTemplates(): Record<string, EditorRequirement> {
    return {
      'Executive Summary': {
        id: 'grant_exec_summary',
        program_id: 'grant_template',
        section_name: 'Executive Summary',
        prompt: 'Provide a compelling 2-3 paragraph summary of your project, highlighting the innovation, market opportunity, and expected impact. Focus on the research or development aspects that make your project unique.',
        hints: [
          'Start with the problem you\'re solving',
          'Explain your solution approach',
          'Highlight the innovation or research contribution',
          'Mention the expected outcomes and impact'
        ],
        word_count_min: 200,
        word_count_max: 500,
        required: true,
        ai_guidance: 'Focus on the research/innovation aspects and potential impact on your field.',
        template: 'Our project addresses [PROBLEM] through [SOLUTION]. The innovation lies in [INNOVATION]. We expect to achieve [OUTCOMES] with significant impact on [FIELD].'
      },
      'Project Description': {
        id: 'grant_project_desc',
        program_id: 'grant_template',
        section_name: 'Project Description',
        prompt: 'Describe your project in detail, including objectives, methodology, timeline, and deliverables. Explain the technical approach and research methods.',
        hints: [
          'Define clear project objectives',
          'Describe your methodology',
          'Include a realistic timeline',
          'List specific deliverables'
        ],
        word_count_min: 500,
        word_count_max: 1500,
        required: true,
        ai_guidance: 'Be specific about research methods and technical approaches.',
        template: 'Project Objectives: [OBJECTIVES]\n\nMethodology: [METHODOLOGY]\n\nTimeline: [TIMELINE]\n\nDeliverables: [DELIVERABLES]'
      },
      'Market Analysis': {
        id: 'grant_market_analysis',
        program_id: 'grant_template',
        section_name: 'Market Analysis',
        prompt: 'Analyze the market opportunity for your project, including target market size, competition, and market trends. Focus on the commercial potential.',
        hints: [
          'Define your target market',
          'Analyze market size and growth',
          'Identify key competitors',
          'Highlight market trends and opportunities'
        ],
        word_count_min: 300,
        word_count_max: 800,
        required: true,
        ai_guidance: 'Focus on the commercial viability and market potential of your research.',
        template: 'Target Market: [MARKET]\n\nMarket Size: [SIZE]\n\nCompetition: [COMPETITION]\n\nTrends: [TRENDS]'
      }
    };
  }

  /**
   * Loan program templates
   */
  private static getLoanTemplates(): Record<string, EditorRequirement> {
    return {
      'Business Plan': {
        id: 'loan_business_plan',
        program_id: 'loan_template',
        section_name: 'Business Plan',
        prompt: 'Provide a comprehensive business plan including market analysis, financial projections, and repayment strategy. Focus on the business viability and loan repayment capability.',
        hints: [
          'Include detailed financial projections',
          'Show clear revenue streams',
          'Demonstrate repayment capability',
          'Provide risk mitigation strategies'
        ],
        word_count_min: 1000,
        word_count_max: 3000,
        required: true,
        ai_guidance: 'Emphasize financial stability and repayment capacity.',
        template: 'Business Model: [MODEL]\n\nFinancial Projections: [PROJECTIONS]\n\nRepayment Plan: [REPAYMENT]\n\nRisk Analysis: [RISKS]'
      },
      'Financial Statements': {
        id: 'loan_financial',
        program_id: 'loan_template',
        section_name: 'Financial Statements',
        prompt: 'Provide detailed financial information including current financial position, cash flow projections, and collateral. Demonstrate your ability to repay the loan.',
        hints: [
          'Include current financial position',
          'Provide cash flow projections',
          'List available collateral',
          'Show debt service coverage ratio'
        ],
        word_count_min: 500,
        word_count_max: 1500,
        required: true,
        ai_guidance: 'Focus on financial stability and repayment capacity.',
        template: 'Current Position: [POSITION]\n\nCash Flow: [CASH_FLOW]\n\nCollateral: [COLLATERAL]\n\nDebt Service: [DEBT_SERVICE]'
      }
    };
  }

  /**
   * Equity program templates
   */
  private static getEquityTemplates(): Record<string, EditorRequirement> {
    return {
      'Investment Proposal': {
        id: 'equity_investment',
        program_id: 'equity_template',
        section_name: 'Investment Proposal',
        prompt: 'Create a compelling investment proposal highlighting growth potential, market opportunity, and return on investment. Focus on scalability and exit strategy.',
        hints: [
          'Highlight growth potential',
          'Show market opportunity',
          'Demonstrate scalability',
          'Include exit strategy'
        ],
        word_count_min: 800,
        word_count_max: 2000,
        required: true,
        ai_guidance: 'Emphasize growth potential and return on investment.',
        template: 'Growth Potential: [POTENTIAL]\n\nMarket Opportunity: [OPPORTUNITY]\n\nScalability: [SCALABILITY]\n\nExit Strategy: [EXIT]'
      }
    };
  }

  /**
   * Visa program templates
   */
  private static getVisaTemplates(): Record<string, EditorRequirement> {
    return {
      'Personal Statement': {
        id: 'visa_personal',
        program_id: 'visa_template',
        section_name: 'Personal Statement',
        prompt: 'Write a personal statement explaining your background, qualifications, and reasons for seeking the visa. Highlight your contributions to the host country.',
        hints: [
          'Explain your background',
          'Highlight qualifications',
          'Describe your contributions',
          'Show commitment to host country'
        ],
        word_count_min: 300,
        word_count_max: 800,
        required: true,
        ai_guidance: 'Focus on your unique contributions and value to the host country.',
        template: 'Background: [BACKGROUND]\n\nQualifications: [QUALIFICATIONS]\n\nContributions: [CONTRIBUTIONS]\n\nCommitment: [COMMITMENT]'
      }
    };
  }

  /**
   * Consulting program templates
   */
  private static getConsultingTemplates(): Record<string, EditorRequirement> {
    return {
      'Consulting Proposal': {
        id: 'consulting_proposal',
        program_id: 'consulting_template',
        section_name: 'Consulting Proposal',
        prompt: 'Create a detailed consulting proposal including your expertise, methodology, and expected outcomes. Focus on the value you can provide.',
        hints: [
          'Highlight your expertise',
          'Describe your methodology',
          'Show expected outcomes',
          'Demonstrate value proposition'
        ],
        word_count_min: 500,
        word_count_max: 1200,
        required: true,
        ai_guidance: 'Emphasize your expertise and the value you can provide.',
        template: 'Expertise: [EXPERTISE]\n\nMethodology: [METHODOLOGY]\n\nOutcomes: [OUTCOMES]\n\nValue: [VALUE]'
      }
    };
  }

  /**
   * Service program templates
   */
  private static getServiceTemplates(): Record<string, EditorRequirement> {
    return {
      'Service Application': {
        id: 'service_application',
        program_id: 'service_template',
        section_name: 'Service Application',
        prompt: 'Describe your service needs and how the program can help your business. Focus on the specific services you require.',
        hints: [
          'Describe your service needs',
          'Explain how services will help',
          'Show your commitment',
          'Highlight expected benefits'
        ],
        word_count_min: 300,
        word_count_max: 800,
        required: true,
        ai_guidance: 'Focus on specific service needs and expected benefits.',
        template: 'Service Needs: [NEEDS]\n\nExpected Help: [HELP]\n\nCommitment: [COMMITMENT]\n\nBenefits: [BENEFITS]'
      }
    };
  }

  /**
   * Default templates
   */
  private static getDefaultTemplates(): Record<string, EditorRequirement> {
    return {
      'General Application': {
        id: 'default_application',
        program_id: 'default_template',
        section_name: 'General Application',
        prompt: 'Provide a comprehensive application describing your project, goals, and how the program can help you achieve them.',
        hints: [
          'Describe your project',
          'Explain your goals',
          'Show how the program helps',
          'Demonstrate your commitment'
        ],
        word_count_min: 400,
        word_count_max: 1000,
        required: true,
        ai_guidance: 'Be clear and specific about your needs and goals.',
        template: 'Project: [PROJECT]\n\nGoals: [GOALS]\n\nProgram Help: [HELP]\n\nCommitment: [COMMITMENT]'
      }
    };
  }

  /**
   * Get default template for unknown sections
   */
  private static getDefaultTemplate(sectionName: string): EditorRequirement {
    return {
      id: `default_${sectionName.toLowerCase().replace(/\s+/g, '_')}`,
      program_id: 'default',
      section_name: sectionName,
      prompt: `Please provide detailed information for the ${sectionName} section.`,
      hints: ['Be specific and detailed', 'Provide relevant examples', 'Show your expertise'],
      word_count_min: 200,
      word_count_max: 800,
      required: true,
      ai_guidance: 'Focus on providing comprehensive and relevant information.',
      template: `Please describe your ${sectionName.toLowerCase()} in detail.`
    };
  }
}
