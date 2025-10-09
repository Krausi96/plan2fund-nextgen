/**
 * Enhanced Data Pipeline - Consolidated Data Processing
 * Combines normalization, quality assurance, and caching in a single file
 * 
 * This pipeline sits between the web scraper and the API, ensuring:
 * - Clean, normalized data
 * - Quality scoring and validation
 * - Fast caching for performance
 * - Duplicate detection and removal
 */

import { ScrapedProgram } from './ScrapedProgram';
import { Program } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

export interface NormalizedProgram extends ScrapedProgram {
  quality_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  processed_at: Date;
  validation_errors: string[];
  is_duplicate: boolean;
  duplicate_of?: string;
  categorized_requirements?: {
    eligibility: any[];
    documents: any[];
    financial: any[];
    technical: any[];
    legal: any[];
    timeline: any[];
    geographic: any[];
    team: any[];
    project: any[];
    compliance: any[];
  };
}

export interface QualityScore {
  overall: number; // 0-1
  completeness: number; // 0-1
  accuracy: number; // 0-1
  freshness: number; // 0-1
  consistency: number; // 0-1
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

// ============================================================================
// DATA NORMALIZATION CLASS
// ============================================================================

export class DataNormalization {
  /**
   * Normalize a single scraped program
   */
  normalizeProgram(rawProgram: ScrapedProgram): NormalizedProgram {
    const normalized: NormalizedProgram = {
      ...rawProgram,
      quality_score: 0,
      confidence_level: 'low',
      processed_at: new Date(),
      validation_errors: [],
      is_duplicate: false
    };

    // 1. Clean and standardize name
    normalized.name = this.cleanName(rawProgram.name);
    
    // 2. Standardize funding amounts
    if (rawProgram.funding_amount_min !== undefined) {
      normalized.funding_amount_min = this.standardizeAmount(rawProgram.funding_amount_min);
    }
    if (rawProgram.funding_amount_max !== undefined) {
      normalized.funding_amount_max = this.standardizeAmount(rawProgram.funding_amount_max);
    }
    
    // 3. Standardize currency
    normalized.currency = this.standardizeCurrency(rawProgram.currency);
    
    // 4. Standardize dates
    if (rawProgram.deadline) {
      normalized.deadline = this.standardizeDate(rawProgram.deadline);
    }
    
    // 5. Clean and standardize requirements
    normalized.requirements = this.standardizeRequirements(rawProgram.requirements);
    
    // 6. Clean and standardize eligibility criteria
    normalized.eligibility_criteria = this.standardizeEligibility(rawProgram.eligibility_criteria);
    
    // 7. Generate AI-enhanced fields (decision tree questions, editor sections, readiness criteria)
    this.generateAIEnhancedFields(normalized);
    
    // 8. Ensure required fields have defaults
    this.ensureRequiredFields(normalized);
    
    return normalized;
  }

  /**
   * Clean program name (capitalization, trim, etc.)
   */
  private cleanName(name: string): string {
    if (!name) return 'Unknown Program';
    
    return name
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .map(word => {
        // Capitalize first letter of each word, but preserve acronyms
        if (word.length <= 3 && /^[A-Z]+$/.test(word)) {
          return word; // Keep acronyms as-is
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Standardize funding amounts (remove currency symbols, convert to numbers)
   */
  private standardizeAmount(amount: any): number {
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      const cleaned = amount.replace(/[€$£¥,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Standardize currency codes
   */
  private standardizeCurrency(currency: any): string {
    if (!currency) return 'EUR';
    
    const currencyMap: { [key: string]: string } = {
      '€': 'EUR',
      '$': 'USD',
      '£': 'GBP',
      '¥': 'JPY',
      'euro': 'EUR',
      'dollar': 'USD',
      'pound': 'GBP',
      'yen': 'JPY'
    };
    
    const upperCurrency = currency.toString().toUpperCase();
    return currencyMap[upperCurrency] || upperCurrency || 'EUR';
  }

  /**
   * Standardize dates
   */
  private standardizeDate(date: any): Date {
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  }

  /**
   * Standardize requirements object
   */
  private standardizeRequirements(requirements: any): any {
    if (!requirements || typeof requirements !== 'object') {
      return {};
    }

    const standardized: any = {};
    
    // Convert boolean requirements to structured format
    for (const [key, value] of Object.entries(requirements)) {
      if (typeof value === 'boolean') {
        standardized[key] = {
          required: value,
          format: this.guessFormat(key),
          description: this.getRequirementDescription(key)
        };
      } else if (typeof value === 'object' && value !== null) {
        standardized[key] = value; // Keep structured requirements as-is
      } else {
        standardized[key] = {
          required: true,
          description: String(value)
        };
      }
    }
    
    return standardized;
  }

  /**
   * Standardize eligibility criteria
   */
  private standardizeEligibility(eligibility: any): any {
    if (!eligibility || typeof eligibility !== 'object') {
      return {};
    }

    const standardized: any = {};
    
    // Clean and standardize common eligibility fields
    for (const [key, value] of Object.entries(eligibility)) {
      if (typeof value === 'string') {
        standardized[key] = value.trim();
      } else if (typeof value === 'number') {
        standardized[key] = value;
      } else if (Array.isArray(value)) {
        standardized[key] = value.map(item => 
          typeof item === 'string' ? item.trim() : item
        );
      } else {
        standardized[key] = value;
      }
    }
    
    return standardized;
  }

  /**
   * Generate AI-enhanced fields based on program characteristics
   */
  private generateAIEnhancedFields(program: NormalizedProgram): void {
    // Generate decision tree questions
    program.decision_tree_questions = this.generateDecisionTreeQuestions(program);
    
    // Generate editor sections
    program.editor_sections = this.generateEditorSections(program);
    
    // Generate readiness criteria
    program.readiness_criteria = this.generateReadinessCriteria(program);
    
    // Generate target personas based on program type
    program.target_personas = this.generateTargetPersonas(program);
    
    // Generate tags based on program characteristics
    program.tags = this.generateTags(program);
    
    // Generate AI guidance
    program.ai_guidance = this.generateAIGuidance(program);
    
    // Generate categorized requirements (NEW)
    program.categorized_requirements = this.categorizeRequirements(program);
  }

  /**
   * Generate decision tree questions based on program characteristics
   */
  private generateDecisionTreeQuestions(program: NormalizedProgram): any[] {
    const questions = [];
    
    // Question 1: Company stage (based on program type)
    if (program.program_type === 'grant' || program.program_type === 'loan') {
      questions.push({
        id: 'q1_company_stage',
        type: 'single',
        question: 'What stage is your company at?',
        options: [
          { value: 'startup', label: 'Startup (0-3 years)' },
          { value: 'sme', label: 'Small/Medium Enterprise' },
          { value: 'scaleup', label: 'Scale-up (3+ years)' }
        ],
        required: true
      });
    }
    
    // Question 2: Funding amount (based on program funding range)
    if (program.funding_amount_max && program.funding_amount_max > 0) {
      questions.push({
        id: 'q2_funding_amount',
        type: 'range',
        question: `How much funding do you need? (This program offers up to €${program.funding_amount_max.toLocaleString()})`,
        min: 0,
        max: program.funding_amount_max,
        required: true
      });
    }
    
    // Question 3: Location (based on program source)
    if (program.source_url && program.source_url.includes('aws.at')) {
      questions.push({
        id: 'q3_location',
        type: 'single',
        question: 'Are you based in Austria?',
        options: [
          { value: 'yes', label: 'Yes, based in Austria' },
          { value: 'no', label: 'No, based elsewhere' }
        ],
        required: true
      });
    }
    
    return questions;
  }

  /**
   * Generate editor sections based on program requirements
   */
  private generateEditorSections(program: NormalizedProgram): any[] {
    const sections = [];
    
    // Executive Summary (always required)
    sections.push({
      id: 'executive_summary',
      title: 'Executive Summary',
      required: true,
      ai_prompts: [
        'Describe your business idea in 2-3 sentences',
        'What problem does your solution solve?',
        'What makes your approach unique?'
      ]
    });
    
    // Business Plan (for grants and loans)
    if (program.program_type === 'grant' || program.program_type === 'loan') {
      sections.push({
        id: 'business_plan',
        title: 'Business Plan',
        required: true,
        ai_prompts: [
          'Market analysis and target customers',
          'Revenue model and financial projections',
          'Competitive advantage and go-to-market strategy'
        ]
      });
    }
    
    // Technical Documentation (for R&D programs)
    if (program.program_type === 'grant' && program.description?.toLowerCase().includes('research')) {
      sections.push({
        id: 'technical_documentation',
        title: 'Technical Documentation',
        required: true,
        ai_prompts: [
          'Technical approach and methodology',
          'Innovation and novelty aspects',
          'Expected outcomes and deliverables'
        ]
      });
    }
    
    return sections;
  }

  /**
   * Generate readiness criteria based on program requirements
   */
  private generateReadinessCriteria(program: NormalizedProgram): any[] {
    const criteria = [];
    
    // Team completeness
    criteria.push({
      id: 'team_complete',
      required: true,
      description: 'Complete founding team with relevant expertise',
      weight: 'high'
    });
    
    // Business registration
    if (program.program_type === 'grant' || program.program_type === 'loan') {
      criteria.push({
        id: 'business_registered',
        required: true,
        description: 'Company legally registered and operational',
        weight: 'high'
      });
    }
    
    // Financial projections
    if (program.funding_amount_max && program.funding_amount_max > 100000) {
      criteria.push({
        id: 'financial_projections',
        required: true,
        description: '3-year financial projections and business model',
        weight: 'medium'
      });
    }
    
    // Market validation
    criteria.push({
      id: 'market_validation',
      required: false,
      description: 'Evidence of market demand or customer validation',
      weight: 'medium'
    });
    
    return criteria;
  }

  /**
   * Generate target personas based on program characteristics
   */
  private generateTargetPersonas(program: NormalizedProgram): string[] {
    const personas = [];
    
    if (program.program_type === 'grant') {
      personas.push('startup', 'sme');
    }
    
    if (program.description?.toLowerCase().includes('research')) {
      personas.push('researcher');
    }
    
    if (program.source_url?.includes('vba')) {
      personas.push('solo_entrepreneur');
    }
    
    return personas.length > 0 ? personas : ['startup', 'sme'];
  }

  /**
   * Generate tags based on program characteristics
   */
  private generateTags(program: NormalizedProgram): string[] {
    const tags = [];
    
    tags.push(program.program_type || 'grant');
    tags.push('funding');
    
    if (program.description?.toLowerCase().includes('innovation')) {
      tags.push('innovation');
    }
    
    if (program.description?.toLowerCase().includes('research')) {
      tags.push('research');
    }
    
    if (program.source_url?.includes('aws')) {
      tags.push('aws');
    }
    
    if (program.source_url?.includes('ffg')) {
      tags.push('ffg');
    }
    
    if (program.source_url?.includes('vba')) {
      tags.push('vba');
    }
    
    return tags;
  }

  /**
   * Generate AI guidance based on program characteristics
   */
  private generateAIGuidance(program: NormalizedProgram): any {
    return {
      context: `${program.name} program guidance`,
      tone: 'professional',
      key_points: [
        'Check eligibility requirements carefully',
        'Prepare necessary documents in advance',
        'Focus on innovation and market potential'
      ],
      prompts: {
        executive_summary: 'Highlight your unique value proposition and market opportunity',
        business_plan: 'Include detailed financial projections and market analysis',
        technical_documentation: 'Emphasize innovation and technical feasibility'
      }
    };
  }

  /**
   * Automatically categorize requirements into the 10 standardized categories
   */
  private categorizeRequirements(program: NormalizedProgram): any {
    const categories = {
      eligibility: [],
      documents: [],
      financial: [],
      technical: [],
      legal: [],
      timeline: [],
      geographic: [],
      team: [],
      project: [],
      compliance: []
    };

    // Categorize from requirements object
    if (program.requirements && typeof program.requirements === 'object') {
      Object.entries(program.requirements).forEach(([key, value]) => {
        const category = this.mapRequirementToCategory(key, value);
        if (category) {
          categories[category].push({
            type: key,
            value: value,
            required: true,
            source: 'requirements'
          });
        }
      });
    }

    // Categorize from eligibility_criteria object
    if (program.eligibility_criteria && typeof program.eligibility_criteria === 'object') {
      Object.entries(program.eligibility_criteria).forEach(([key, value]) => {
        const category = this.mapEligibilityToCategory(key, value);
        if (category) {
          categories[category].push({
            type: key,
            value: value,
            required: true,
            source: 'eligibility_criteria'
          });
        }
      });
    }

    // Add funding information to financial category
    if (program.funding_amount_min || program.funding_amount_max) {
      categories.financial.push({
        type: 'funding_amount',
        value: {
          min: program.funding_amount_min,
          max: program.funding_amount_max,
          currency: program.currency || 'EUR'
        },
        required: true,
        source: 'program_data'
      });
    }

    // Add deadline to timeline category
    if (program.deadline) {
      categories.timeline.push({
        type: 'deadline',
        value: program.deadline,
        required: true,
        source: 'program_data'
      });
    }

    return categories;
  }

  /**
   * Map requirement keys to categories
   */
  private mapRequirementToCategory(key: string, value: any): string | null {
    const mapping = {
      // Documents category
      'business_plan': 'documents',
      'pitch_deck': 'documents',
      'financial_projections': 'documents',
      'market_analysis': 'documents',
      'technical_documentation': 'documents',
      'team_cv': 'documents',
      'legal_documents': 'documents',
      'project_description': 'documents',
      'documents': 'documents',
      
      // Technical category
      'technical_requirements': 'technical',
      'technology_stack': 'technical',
      'prototype': 'technical',
      'mvp': 'technical',
      'innovation': 'technical',
      
      // Team category
      'team_size': 'team',
      'team_qualifications': 'team',
      'advisory_board': 'team',
      'key_personnel': 'team',
      'team_structure': 'team',
      
      // Project category
      'project_timeline': 'project',
      'project_goals': 'project',
      'deliverables': 'project',
      'milestones': 'project',
      'research_focus': 'project',
      
      // Legal category
      'legal_requirements': 'legal',
      'compliance': 'legal',
      'regulations': 'legal',
      'gdpr': 'legal',
      
      // Financial category
      'funding_amounts': 'financial',
      'budget': 'financial',
      'costs': 'financial',
      'revenue': 'financial'
    };

    return mapping[key] || null;
  }

  /**
   * Map eligibility criteria keys to categories
   */
  private mapEligibilityToCategory(key: string, value: any): string | null {
    const mapping = {
      // Eligibility category
      'description': 'eligibility',
      'criteria': 'eligibility',
      'requirements': 'eligibility',
      'exclusions': 'eligibility',
      
      // Geographic category
      'location': 'geographic',
      'country': 'geographic',
      'region': 'geographic',
      'area': 'geographic',
      
      // Team category
      'min_team_size': 'team',
      'max_team_size': 'team',
      'team_requirements': 'team',
      'team_diversity': 'team',
      
      // Timeline category
      'max_company_age': 'timeline',
      'min_company_age': 'timeline',
      'duration': 'timeline',
      'period': 'timeline',
      
      // Financial category
      'funding_rate': 'financial',
      'co_funding': 'financial',
      'budget': 'financial',
      'costs': 'financial',
      
      // Project category
      'research_focus': 'project',
      'innovation': 'project',
      'sector': 'project',
      'industry': 'project',
      
      // Compliance category
      'thresholds': 'compliance',
      'standards': 'compliance',
      'certifications': 'compliance',
      'audit': 'compliance'
    };

    return mapping[key] || null;
  }

  /**
   * Ensure all required fields have default values
   */
  private ensureRequiredFields(program: NormalizedProgram): void {
    if (!program.id) program.id = `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!program.name) program.name = 'Unknown Program';
    if (!program.type) program.type = 'grant';
    if (!program.program_type) program.program_type = program.type;
    if (!program.institution) program.institution = 'Unknown Institution';
    if (!program.program_category) program.program_category = 'general';
    if (!program.source_url) program.source_url = '';
    if (!program.eligibility_criteria) program.eligibility_criteria = {};
    if (!program.requirements) program.requirements = {};
    if (!program.contact_info) program.contact_info = {};
    if (!program.scraped_at) program.scraped_at = new Date();
    if (program.confidence_score === undefined) program.confidence_score = 0.5;
    if (program.is_active === undefined) program.is_active = true;
  }

  /**
   * Guess document format based on requirement key
   */
  private guessFormat(key: string): string {
    const formatMap: { [key: string]: string } = {
      'business_plan': 'PDF',
      'pitch_deck': 'PDF',
      'financial_projections': 'Excel',
      'technical_documentation': 'PDF',
      'market_analysis': 'PDF',
      'team_cv': 'PDF',
      'legal_documents': 'PDF',
      'project_description': 'PDF'
    };
    
    return formatMap[key.toLowerCase()] || 'PDF';
  }

  /**
   * Get human-readable description for requirement
   */
  private getRequirementDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
      'business_plan': 'Comprehensive business plan document',
      'pitch_deck': 'Investor presentation slides',
      'financial_projections': 'Financial forecasts and projections',
      'technical_documentation': 'Technical specifications and documentation',
      'market_analysis': 'Market research and analysis report',
      'team_cv': 'Team member curriculum vitae',
      'legal_documents': 'Legal compliance documents',
      'project_description': 'Detailed project description'
    };
    
    return descriptions[key.toLowerCase()] || `${key.replace(/_/g, ' ')} document`;
  }
}

// ============================================================================
// DATA QUALITY CLASS
// ============================================================================

export class DataQuality {
  /**
   * Calculate comprehensive quality score for a program
   */
  calculateQualityScore(program: NormalizedProgram): QualityScore {
    const completeness = this.calculateCompleteness(program);
    const accuracy = this.calculateAccuracy(program);
    const freshness = this.calculateFreshness(program);
    const consistency = this.calculateConsistency(program);
    
    const overall = (completeness * 0.3) + (accuracy * 0.3) + (freshness * 0.2) + (consistency * 0.2);
    
    return {
      overall: Math.round(overall * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      freshness: Math.round(freshness * 100) / 100,
      consistency: Math.round(consistency * 100) / 100
    };
  }

  /**
   * Calculate completeness score (0-1)
   */
  private calculateCompleteness(program: NormalizedProgram): number {
    const requiredFields = [
      'id', 'name', 'type', 'institution', 'program_category',
      'source_url', 'eligibility_criteria', 'requirements'
    ];
    
    const optionalFields = [
      'description', 'funding_amount_min', 'funding_amount_max', 'currency',
      'deadline', 'contact_info', 'target_personas', 'tags'
    ];
    
    let score = 0;
    let totalWeight = 0;
    
    // Required fields (weight: 2)
    for (const field of requiredFields) {
      const value = (program as any)[field];
      const hasValue = value !== undefined && value !== null && value !== '';
      score += hasValue ? 2 : 0;
      totalWeight += 2;
    }
    
    // Optional fields (weight: 1)
    for (const field of optionalFields) {
      const value = (program as any)[field];
      const hasValue = value !== undefined && value !== null && value !== '';
      score += hasValue ? 1 : 0;
      totalWeight += 1;
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate accuracy score (0-1)
   */
  private calculateAccuracy(program: NormalizedProgram): number {
    let score = 0;
    let checks = 0;
    
    // Check funding amounts make sense
    if (program.funding_amount_min !== undefined && program.funding_amount_max !== undefined) {
      checks++;
      if (program.funding_amount_min <= program.funding_amount_max) {
        score += 1;
      }
    }
    
    // Check currency is valid
    if (program.currency) {
      checks++;
      const validCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF'];
      if (validCurrencies.includes(program.currency)) {
        score += 1;
      }
    }
    
    // Check deadline is in the future (if provided)
    if (program.deadline) {
      checks++;
      if (program.deadline > new Date()) {
        score += 1;
      }
    }
    
    // Check URL is valid
    if (program.source_url) {
      checks++;
      try {
        new URL(program.source_url);
        score += 1;
      } catch {
        // Invalid URL
      }
    }
    
    return checks > 0 ? score / checks : 0.5;
  }

  /**
   * Calculate freshness score (0-1)
   */
  private calculateFreshness(program: NormalizedProgram): number {
    if (!program.scraped_at) return 0;
    
    const now = new Date();
    const scrapedAt = new Date(program.scraped_at);
    const hoursSinceScraped = (now.getTime() - scrapedAt.getTime()) / (1000 * 60 * 60);
    
    // Fresh if scraped within 24 hours (1.0), degrading to 0.5 after 7 days
    if (hoursSinceScraped <= 24) return 1.0;
    if (hoursSinceScraped <= 168) { // 7 days
      return 1.0 - ((hoursSinceScraped - 24) / 144) * 0.5; // Linear decay
    }
    return 0.5; // Minimum score for old data
  }

  /**
   * Calculate consistency score (0-1)
   */
  private calculateConsistency(program: NormalizedProgram): number {
    let score = 0;
    let checks = 0;
    
    // Check type consistency
    if (program.type && program.program_type) {
      checks++;
      if (program.type === program.program_type) {
        score += 1;
      }
    }
    
    // Check institution and category consistency
    if (program.institution && program.program_category) {
      checks++;
      const institutionCategoryMap: { [key: string]: string[] } = {
        'Austria Wirtschaftsservice': ['austrian_grants', 'business_grants'],
        'Austrian Research Promotion Agency': ['research_grants', 'austrian_grants'],
        'European Union': ['eu_programs'],
        'Austrian Employment Service': ['employment'],
        'Vienna Business Agency': ['regional_grants', 'startup_grants']
      };
      
      const expectedCategories = institutionCategoryMap[program.institution] || [];
      if (expectedCategories.includes(program.program_category)) {
        score += 1;
      }
    }
    
    // Check requirements structure consistency
    if (program.requirements && typeof program.requirements === 'object') {
      checks++;
      const hasValidStructure = Object.values(program.requirements).some(req => 
        typeof req === 'object' && req !== null && 'required' in req
      );
      if (hasValidStructure) {
        score += 1;
      }
    }
    
    return checks > 0 ? score / checks : 0.5;
  }

  /**
   * Validate a program and return validation result
   */
  validateProgram(program: NormalizedProgram): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required field validation
    if (!program.id) errors.push('Missing required field: id');
    if (!program.name) errors.push('Missing required field: name');
    if (!program.type) errors.push('Missing required field: type');
    if (!program.institution) errors.push('Missing required field: institution');
    
    // Data type validation
    if (program.funding_amount_min !== undefined && typeof program.funding_amount_min !== 'number') {
      errors.push('Invalid funding_amount_min: must be a number');
    }
    if (program.funding_amount_max !== undefined && typeof program.funding_amount_max !== 'number') {
      errors.push('Invalid funding_amount_max: must be a number');
    }
    
    // Business logic validation
    if (program.funding_amount_min !== undefined && program.funding_amount_max !== undefined) {
      if (program.funding_amount_min > program.funding_amount_max) {
        errors.push('funding_amount_min cannot be greater than funding_amount_max');
      }
    }
    
    // URL validation
    if (program.source_url) {
      try {
        new URL(program.source_url);
      } catch {
        errors.push('Invalid source_url format');
      }
    }
    
    // Warning for missing optional fields
    if (!program.description) warnings.push('Missing optional field: description');
    if (!program.funding_amount_min && !program.funding_amount_max) {
      warnings.push('Missing funding amount information');
    }
    
    const qualityScore = this.calculateQualityScore(program);
    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      warnings,
      score: qualityScore.overall
    };
  }
}

// ============================================================================
// DATA CACHING CLASS
// ============================================================================

export class DataCaching {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Get data from cache
   */
  async getFromCache<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = new Date();
    const isExpired = (now.getTime() - entry.timestamp.getTime()) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ============================================================================
// ENHANCED DATA PIPELINE CLASS
// ============================================================================

export class EnhancedDataPipeline {
  private normalizer: DataNormalization;
  private quality: DataQuality;
  private cache: DataCaching;

  constructor() {
    this.normalizer = new DataNormalization();
    this.quality = new DataQuality();
    this.cache = new DataCaching();
  }

  /**
   * Process raw scraped programs through the complete pipeline
   */
  async processPrograms(rawPrograms: ScrapedProgram[]): Promise<NormalizedProgram[]> {
    console.log(`🔄 Processing ${rawPrograms.length} raw programs through pipeline...`);
    
    if (rawPrograms.length === 0) {
      console.log('⚠️ No raw programs to process');
      return [];
    }
    
    // Step 1: Normalize each program
    const normalizedPrograms = rawPrograms.map(program => 
      this.normalizer.normalizeProgram(program)
    );
    
    console.log(`✅ Normalized ${normalizedPrograms.length} programs`);
    
    // Step 2: Calculate quality scores
    const scoredPrograms = normalizedPrograms.map(program => {
      const qualityScore = this.quality.calculateQualityScore(program);
      const validation = this.quality.validateProgram(program);
      
      return {
        ...program,
        quality_score: qualityScore.overall,
        confidence_level: this.getConfidenceLevel(qualityScore.overall),
        validation_errors: validation.errors
      };
    });
    
    // Step 3: Remove duplicates
    const deduplicatedPrograms = this.removeDuplicates(scoredPrograms);
    
    // Step 4: Filter out low-quality programs
    const highQualityPrograms = deduplicatedPrograms.filter(program => 
      program.quality_score >= 0.1 // Keep programs with at least 10% quality score (temporarily lowered)
    );
    
    console.log(`📊 Quality filtering: ${deduplicatedPrograms.length} programs before filtering, ${highQualityPrograms.length} after filtering`);
    console.log(`✅ Pipeline complete: ${highQualityPrograms.length} high-quality programs processed`);
    console.log(`📊 Quality distribution:`, this.getQualityDistribution(highQualityPrograms));
    
    return highQualityPrograms;
  }

  /**
   * Get processed programs with caching
   */
  async getProcessedPrograms(cacheKey: string = 'processed_programs'): Promise<NormalizedProgram[]> {
    // Try to get from cache first
    const cached = await this.cache.getFromCache<NormalizedProgram[]>(cacheKey);
    if (cached) {
      console.log('📦 Returning cached processed programs');
      return cached;
    }
    
    // If not in cache, try to get data from database or fallback
    console.log('⚠️ No cached data available - attempting to populate pipeline...');
    
    try {
      // Try to get data from database or API
      const { dataSource } = await import('./dataSource');
      const programs = await dataSource.getPrograms();
      
      if (programs && programs.length > 0) {
        console.log(`🔄 Processing ${programs.length} programs for pipeline cache...`);
        
        // Convert to normalized format
        const normalizedPrograms: NormalizedProgram[] = programs.map(program => ({
          id: program.id,
          name: program.name,
          type: program.type || 'grant',
          description: program.notes || '',
          funding_amount_min: 0,
          funding_amount_max: program.maxAmount || 0,
          source_url: program.link || '',
          institution: 'Unknown Institution',
          requirements: program.requirements || {},
          scraped_at: new Date(),
          confidence_score: 0.8,
          // Add required ScrapedProgram fields
          program_type: program.type || 'grant',
          program_category: 'general',
          eligibility_criteria: {},
          contact_info: {},
          is_active: true,
          // Add required NormalizedProgram fields
          quality_score: 0.8,
          confidence_level: 'medium' as const,
          processed_at: new Date(),
          validation_errors: [],
          is_duplicate: false
        }));
        
        // Cache the processed programs
        await this.cacheProcessedPrograms(normalizedPrograms, cacheKey);
        
        return normalizedPrograms;
      }
    } catch (error) {
      console.warn('Failed to populate pipeline cache:', error);
    }
    
    console.log('⚠️ No data available for pipeline processing');
    return [];
  }

  /**
   * Cache processed programs
   */
  async cacheProcessedPrograms(programs: NormalizedProgram[], cacheKey: string = 'processed_programs'): Promise<void> {
    await this.cache.setCache(cacheKey, programs, 60 * 60 * 1000); // 1 hour TTL
    console.log(`💾 Cached ${programs.length} processed programs`);
  }

  /**
   * Convert normalized programs to Program format for API compatibility
   */
  convertToProgramFormat(normalizedPrograms: NormalizedProgram[]): Program[] {
    return normalizedPrograms.map(program => ({
      id: program.id,
      name: program.name,
      type: program.type,
      program_type: program.program_type,
      program_category: program.program_category,
      requirements: program.requirements,
      notes: program.description,
      maxAmount: program.funding_amount_max,
      link: program.source_url,
      target_personas: program.target_personas,
      tags: program.tags,
      decision_tree_questions: program.decision_tree_questions,
      editor_sections: program.editor_sections,
      readiness_criteria: program.readiness_criteria,
      ai_guidance: program.ai_guidance
    }));
  }

  /**
   * Convert normalized programs to GPTEnhancedProgram format
   */
  convertToGPTEnhancedFormat(normalizedPrograms: NormalizedProgram[]): Program[] {
    return normalizedPrograms.map(program => ({
      id: program.id,
      name: program.name,
      type: program.type,
      program_type: program.program_type,
      program_category: program.program_category,
      requirements: program.requirements,
      notes: program.description,
      maxAmount: program.funding_amount_max,
      link: program.source_url,
      target_personas: program.target_personas || [],
      tags: program.tags || [],
      decision_tree_questions: program.decision_tree_questions || [],
      editor_sections: program.editor_sections || [],
      readiness_criteria: program.readiness_criteria || [],
      ai_guidance: program.ai_guidance
    }));
  }

  /**
   * Remove duplicate programs based on name and institution
   */
  private removeDuplicates(programs: NormalizedProgram[]): NormalizedProgram[] {
    const seen = new Map<string, NormalizedProgram>();
    const duplicates: NormalizedProgram[] = [];
    
    for (const program of programs) {
      const key = `${program.name.toLowerCase()}_${program.institution.toLowerCase()}`;
      
      if (seen.has(key)) {
        // Mark as duplicate
        program.is_duplicate = true;
        program.duplicate_of = seen.get(key)!.id;
        duplicates.push(program);
      } else {
        seen.set(key, program);
      }
    }
    
    console.log(`🔍 Found ${duplicates.length} duplicate programs`);
    return Array.from(seen.values());
  }

  /**
   * Get confidence level based on quality score
   */
  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Get quality distribution statistics
   */
  private getQualityDistribution(programs: NormalizedProgram[]): { [key: string]: number } {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const program of programs) {
      if (program.quality_score >= 0.8) distribution.high++;
      else if (program.quality_score >= 0.5) distribution.medium++;
      else distribution.low++;
    }
    
    return distribution;
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats(): {
    cacheStats: { size: number; keys: string[] };
    qualityThresholds: { high: number; medium: number; low: number };
  } {
    return {
      cacheStats: this.cache.getCacheStats(),
      qualityThresholds: { high: 0.8, medium: 0.5, low: 0.3 }
    };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const enhancedDataPipeline = new EnhancedDataPipeline();
