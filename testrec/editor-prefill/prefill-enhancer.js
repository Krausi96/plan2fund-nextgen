// ========= PLAN2FUND — PREFILL ENHANCER =========
// Enhances your existing prefill system with requirements-based logic

// This builds on your existing src/lib/prefill.ts
// and shows how to enhance it with requirements data

class PrefillEnhancer {
  constructor() {
    this.requirements = null;
    this.userAnswers = {};
    this.program = null;
  }

  // Load requirements data
  async loadRequirements() {
    try {
      const response = await fetch('../requirements/sample-requirements.json');
      this.requirements = await response.json();
      console.log('✅ Requirements loaded for prefill enhancement');
      return true;
    } catch (error) {
      console.error('❌ Failed to load requirements:', error);
      return false;
    }
  }

  // Enhance existing prefill with requirements
  enhancePrefill(userAnswers, program, requirements) {
    this.userAnswers = userAnswers;
    this.program = program;
    this.requirements = requirements;

    // Get program requirements
    const programRequirements = this.getProgramRequirements(program.id);
    if (!programRequirements) {
      console.warn('⚠️ No requirements found for program:', program.id);
      return this.generateBasicPrefill(userAnswers, program);
    }

    // Generate enhanced prefill
    return this.generateEnhancedPrefill(userAnswers, program, programRequirements);
  }

  // Get program requirements
  getProgramRequirements(programId) {
    if (!this.requirements) return null;
    return this.requirements.programs.find(p => p.programId === programId);
  }

  // Generate basic prefill (fallback to existing logic)
  generateBasicPrefill(userAnswers, program) {
    // This simulates your existing prefill logic
    return {
      content: this.generateBasicContent(userAnswers, program),
      sections: this.generateBasicSections(userAnswers, program),
      metadata: {
        source: 'basic_prefill',
        programId: program.id,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Generate enhanced prefill with requirements
  generateEnhancedPrefill(userAnswers, program, requirements) {
    const sections = [];
    const prefillData = {};
    const missingInfo = [];
    const suggestions = [];

    // Process each editor section from requirements
    requirements.editorSections.forEach(section => {
      const enhancedSection = this.enhanceSection(section, userAnswers, requirements);
      sections.push(enhancedSection);
      
      // Collect prefill data
      Object.assign(prefillData, enhancedSection.prefillData);
      
      // Check for missing information
      if (enhancedSection.missingInfo.length > 0) {
        missingInfo.push(...enhancedSection.missingInfo);
      }
      
      // Collect suggestions
      if (enhancedSection.suggestions.length > 0) {
        suggestions.push(...enhancedSection.suggestions);
      }
    });

    // Generate readiness check
    const readiness = this.generateReadinessCheck(requirements, userAnswers);

    return {
      content: this.generateEnhancedContent(sections),
      sections,
      prefillData,
      missingInfo,
      suggestions,
      readiness,
      metadata: {
        source: 'enhanced_prefill',
        programId: program.id,
        requirementsId: requirements.programId,
        timestamp: new Date().toISOString(),
        confidence: this.calculateConfidence(requirements, userAnswers)
      }
    };
  }

  // Enhance a single section
  enhanceSection(section, userAnswers, requirements) {
    const enhancedSection = {
      id: section.id,
      title: section.title,
      required: section.required,
      template: section.template,
      guidance: section.guidance,
      content: '',
      prefillData: {},
      missingInfo: [],
      suggestions: [],
      requirements: section.requirements || []
    };

    // Generate content from template
    enhancedSection.content = this.processTemplate(section.template, userAnswers, section.prefillData);
    
    // Generate prefill data
    enhancedSection.prefillData = this.generatePrefillData(section.prefillData, userAnswers);
    
    // Check for missing information
    enhancedSection.missingInfo = this.checkMissingInfo(section, userAnswers);
    
    // Generate suggestions
    enhancedSection.suggestions = this.generateSuggestions(section, userAnswers, requirements);

    return enhancedSection;
  }

  // Process template with user answers
  processTemplate(template, userAnswers, prefillData) {
    let content = template;
    
    // Replace placeholders with user answers
    if (prefillData) {
      Object.entries(prefillData).forEach(([placeholder, answerKey]) => {
        const value = this.getAnswerValue(answerKey, userAnswers);
        content = content.replace(new RegExp(`\\[${placeholder}\\]`, 'g'), value);
      });
    }
    
    // Replace remaining placeholders with TBD markers
    content = content.replace(/\[([A-Z_]+)\]/g, '[TBD: $1]');
    
    return content;
  }

  // Get answer value from user answers
  getAnswerValue(answerKey, userAnswers) {
    if (answerKey.startsWith('answers.')) {
      const key = answerKey.replace('answers.', '');
      return userAnswers[key] || `[TBD: ${key}]`;
    }
    return answerKey;
  }

  // Generate prefill data
  generatePrefillData(prefillData, userAnswers) {
    const data = {};
    
    if (prefillData) {
      Object.entries(prefillData).forEach(([key, value]) => {
        data[key] = this.getAnswerValue(value, userAnswers);
      });
    }
    
    return data;
  }

  // Check for missing information
  checkMissingInfo(section, userAnswers) {
    const missing = [];
    
    if (section.prefillData) {
      Object.entries(section.prefillData).forEach(([placeholder, answerKey]) => {
        const key = answerKey.replace('answers.', '');
        if (!userAnswers[key] || userAnswers[key] === '') {
          missing.push({
            placeholder,
            answerKey: key,
            description: `Missing information for ${placeholder}`,
            suggestion: `Please provide ${key} to complete this section`
          });
        }
      });
    }
    
    return missing;
  }

  // Generate suggestions
  generateSuggestions(section, userAnswers, requirements) {
    const suggestions = [];
    
    // Add guidance from section
    if (section.guidance) {
      suggestions.push({
        type: 'guidance',
        text: section.guidance,
        priority: 'medium'
      });
    }
    
    // Add suggestions from requirements
    if (section.requirements) {
      section.requirements.forEach(reqId => {
        const requirement = this.findRequirement(reqId, requirements);
        if (requirement && requirement.guidance) {
          suggestions.push({
            type: 'requirement',
            text: requirement.guidance,
            priority: requirement.priority === 'critical' ? 'high' : 'medium'
          });
        }
      });
    }
    
    return suggestions;
  }

  // Find requirement by ID
  findRequirement(reqId, requirements) {
    const allRequirements = [
      ...(requirements.eligibility || []),
      ...(requirements.documents || []),
      ...(requirements.financial || []),
      ...(requirements.technical || []),
      ...(requirements.legal || []),
      ...(requirements.timeline || []),
      ...(requirements.geographic || []),
      ...(requirements.team || []),
      ...(requirements.project || []),
      ...(requirements.compliance || [])
    ];
    
    return allRequirements.find(req => req.id === reqId);
  }

  // Generate readiness check
  generateReadinessCheck(requirements, userAnswers) {
    const readiness = {
      overallScore: 0,
      criteria: [],
      missingRequirements: [],
      suggestions: []
    };
    
    if (requirements.readinessCriteria) {
      let totalScore = 0;
      
      requirements.readinessCriteria.forEach(criterion => {
        const isMet = this.checkCriterionMet(criterion, userAnswers);
        const score = isMet ? 100 : 0;
        
        readiness.criteria.push({
          id: criterion.id,
          title: criterion.title,
          description: criterion.description,
          score,
          met: isMet,
          weight: criterion.weight || 1
        });
        
        totalScore += score * (criterion.weight || 1);
        
        if (!isMet) {
          readiness.missingRequirements.push({
            id: criterion.id,
            title: criterion.title,
            description: criterion.description
          });
        }
      });
      
      const totalWeight = readiness.criteria.reduce((sum, c) => sum + c.weight, 0);
      readiness.overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }
    
    return readiness;
  }

  // Check if criterion is met
  checkCriterionMet(criterion, userAnswers) {
    // This is a simplified version - in reality, you'd evaluate the validator function
    const answerKey = criterion.requirementId.replace('elig_', 'q_').replace('fin_', 'q_');
    return userAnswers[answerKey] !== undefined && userAnswers[answerKey] !== '';
  }

  // Calculate confidence
  calculateConfidence(requirements, userAnswers) {
    const totalRequirements = [
      ...(requirements.eligibility || []),
      ...(requirements.documents || []),
      ...(requirements.financial || []),
      ...(requirements.technical || [])
    ].length;
    
    if (totalRequirements === 0) return 'low';
    
    const metRequirements = totalRequirements - this.countMissingRequirements(requirements, userAnswers);
    const percentage = metRequirements / totalRequirements;
    
    if (percentage >= 0.8) return 'high';
    if (percentage >= 0.5) return 'medium';
    return 'low';
  }

  // Count missing requirements
  countMissingRequirements(requirements, userAnswers) {
    let missing = 0;
    
    const allRequirements = [
      ...(requirements.eligibility || []),
      ...(requirements.documents || []),
      ...(requirements.financial || []),
      ...(requirements.technical || [])
    ];
    
    allRequirements.forEach(req => {
      if (!this.checkRequirementMet(req, userAnswers)) {
        missing++;
      }
    });
    
    return missing;
  }

  // Check if requirement is met
  checkRequirementMet(requirement, userAnswers) {
    // Simplified requirement checking
    const answerKey = requirement.id.replace('elig_', 'q_').replace('fin_', 'q_');
    return userAnswers[answerKey] !== undefined && userAnswers[answerKey] !== '';
  }

  // Generate enhanced content
  generateEnhancedContent(sections) {
    let content = '# Business Plan\n\n';
    
    sections.forEach(section => {
      content += `## ${section.title}\n\n`;
      content += section.content + '\n\n';
      
      if (section.missingInfo.length > 0) {
        content += '### Missing Information\n\n';
        section.missingInfo.forEach(info => {
          content += `- **${info.placeholder}**: ${info.suggestion}\n`;
        });
        content += '\n';
      }
      
      if (section.suggestions.length > 0) {
        content += '### Suggestions\n\n';
        section.suggestions.forEach(suggestion => {
          content += `- ${suggestion.text}\n`;
        });
        content += '\n';
      }
    });
    
    return content;
  }

  // Generate basic content (fallback)
  generateBasicContent(userAnswers, program) {
    return `# Business Plan

## Executive Summary

Our business, ${userAnswers.business_name || '[Business Name]'}, is seeking ${userAnswers.funding_amount || '[Funding Amount]'} in ${program.type} funding.

## Business Description

${userAnswers.business_description || '[Business Description]'}

## Target Market

${userAnswers.target_market || '[Target Market]'}

## Revenue Model

${userAnswers.revenue_model || '[Revenue Model]'}

## Team

Our team consists of ${userAnswers.team_size || '[Team Size]'} professionals.

## Funding Request

- **Amount**: ${userAnswers.funding_amount || '[Funding Amount]'}
- **Use**: ${userAnswers.use_of_funds || '[Use of Funds]'}
- **Timeline**: ${userAnswers.timeline || '[Timeline]'}

## Program-Specific Information

This application is tailored for the ${program.name} program.
`;
  }

  // Generate basic sections (fallback)
  generateBasicSections(userAnswers, program) {
    return [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        required: true,
        content: `Our business, ${userAnswers.business_name || '[Business Name]'}, is seeking ${userAnswers.funding_amount || '[Funding Amount]'} in ${program.type} funding.`,
        prefillData: {},
        missingInfo: [],
        suggestions: []
      },
      {
        id: 'business_description',
        title: 'Business Description',
        required: true,
        content: userAnswers.business_description || '[Business Description]',
        prefillData: {},
        missingInfo: [],
        suggestions: []
      }
    ];
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PrefillEnhancer;
} else {
  window.PrefillEnhancer = PrefillEnhancer;
}
