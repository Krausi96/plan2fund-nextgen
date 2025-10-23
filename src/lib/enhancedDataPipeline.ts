/**
 * Enhanced Data Pipeline - SIMPLIFIED VERSION
 * Focuses on core 18 categories with efficient processing
 * 
 * This pipeline ensures:
 * - Clean, normalized data for core 18 categories
 * - Essential quality checks
 * - Efficient categorization
 * - Simple duplicate detection
 */

import { ScrapedProgram } from './ScrapedProgram';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// INTERFACES
// ============================================================================

export interface NormalizedProgram extends Omit<ScrapedProgram, 'description' | 'quality_score' | 'confidence_level' | 'processed_at' | 'validation_errors' | 'is_duplicate' | 'categorized_requirements'> {
  description: string;
  categorized_requirements?: any; // ← CRITICAL: Preserve this from raw data
  decision_tree_questions?: any[];
  editor_sections?: any[];
  readiness_criteria?: any[];
  target_personas?: string[];
  tags?: string[];
  ai_guidance?: any;
  quality_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  processed_at: Date;
  validation_errors: string[];
  is_duplicate: boolean;
  duplicate_of?: string;
}

// CORE 18 CATEGORIES - SIMPLIFIED PATTERNS
const CORE_18_CATEGORIES = {
  // 1. Eligibility
  eligibility: {
    keywords: ['eligible', 'qualification', 'criteria', 'requirements', 'bedingungen'],
    patterns: [/eligible/i, /qualification/i, /criteria/i]
  },
  
  // 2. Documents  
  documents: {
    keywords: ['business plan', 'pitch deck', 'financial', 'documentation', 'unterlagen'],
    patterns: [/business plan/i, /pitch deck/i, /financial/i]
  },
  
  // 3. Financial
  financial: {
    keywords: ['funding', 'budget', 'costs', 'finanzierung', 'kosten'],
    patterns: [/funding/i, /budget/i, /costs/i]
  },
  
  // 4. Technical
  technical: {
    keywords: ['technology', 'innovation', 'prototype', 'technical', 'technologie'],
    patterns: [/technology/i, /innovation/i, /prototype/i]
  },
  
  // 5. Legal
  legal: {
    keywords: ['legal', 'compliance', 'regulations', 'rechtlich', 'vorschriften'],
    patterns: [/legal/i, /compliance/i, /regulations/i]
  },
  
  // 6. Timeline
  timeline: {
    keywords: ['deadline', 'duration', 'timeline', 'frist', 'dauer'],
    patterns: [/deadline/i, /duration/i, /timeline/i]
  },
  
  // 7. Geographic
  geographic: {
    keywords: ['location', 'country', 'region', 'standort', 'region'],
    patterns: [/location/i, /country/i, /region/i]
  },
  
  // 8. Team
  team: {
    keywords: ['team', 'personnel', 'staff', 'team', 'personal'],
    patterns: [/team/i, /personnel/i, /staff/i]
  },
  
  // 9. Project
  project: {
    keywords: ['project', 'deliverables', 'milestones', 'projekt', 'lieferungen'],
    patterns: [/project/i, /deliverables/i, /milestones/i]
  },
  
  // 10. Compliance
  compliance: {
    keywords: ['compliance', 'standards', 'certification', 'konformität', 'standards'],
    patterns: [/compliance/i, /standards/i, /certification/i]
  },
  
  // 11. Impact
  impact: {
    keywords: ['impact', 'benefit', 'outcome', 'wirkung', 'nutzen'],
    patterns: [/impact/i, /benefit/i, /outcome/i]
  },
  
  // 12. Capex/Opex
  capex_opex: {
    keywords: ['capex', 'opex', 'capital', 'operating', 'investition', 'betrieb'],
    patterns: [/capex/i, /opex/i, /capital/i, /operating/i]
  },
  
  // 13. Use of Funds
  use_of_funds: {
    keywords: ['use of funds', 'budget allocation', 'funding purpose', 'mittelverwendung'],
    patterns: [/use of funds/i, /budget allocation/i, /funding purpose/i]
  },
  
  // 14. Revenue Model
  revenue_model: {
    keywords: ['revenue', 'business model', 'monetization', 'umsatz', 'geschäftsmodell'],
    patterns: [/revenue/i, /business model/i, /monetization/i]
  },
  
  // 15. Market Size
  market_size: {
    keywords: ['market size', 'market potential', 'target market', 'marktgröße', 'marktpotential'],
    patterns: [/market size/i, /market potential/i, /target market/i]
  },
  
  // 16. Co-financing
  co_financing: {
    keywords: ['co-financing', 'own contribution', 'eigenbeitrag', 'mitfinanzierung'],
    patterns: [/co-financing/i, /own contribution/i, /eigenbeitrag/i]
  },
  
  // 17. TRL Level
  trl_level: {
    keywords: ['trl', 'technology readiness', 'maturity', 'reifegrad'],
    patterns: [/trl/i, /technology readiness/i, /maturity/i]
  },
  
  // 18. Consortium
  consortium: {
    keywords: ['consortium', 'partnership', 'collaboration', 'konsortium', 'partnerschaft'],
    patterns: [/consortium/i, /partnership/i, /collaboration/i]
  }
};

export interface NormalizedProgram extends ScrapedProgram {
  quality_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  processed_at: Date;
  validation_errors: string[];
  is_duplicate: boolean;
  duplicate_of?: string;
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
   * Normalize a single scraped program using DYNAMIC patterns
   */
  async normalizeProgram(rawProgram: ScrapedProgram): Promise<NormalizedProgram> {
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
      normalized.deadline = this.standardizeDate(rawProgram.deadline) as any;
    }
    
    // 5. Clean and standardize requirements
    normalized.requirements = this.standardizeRequirements(rawProgram.requirements);
    
    // 6. Clean and standardize eligibility criteria
    normalized.eligibility_criteria = this.standardizeEligibility(rawProgram.eligibility_criteria);
    
    // 7. CRITICAL: Preserve categorized_requirements from raw data
    if ((rawProgram as any).categorized_requirements) {
      normalized.categorized_requirements = (rawProgram as any).categorized_requirements;
      console.log(`✅ Preserved categorized_requirements for ${normalized.id}`);
    }
    
    // 7. Generate AI-enhanced fields (decision tree questions, editor sections, readiness criteria)
    await this.generateAIEnhancedFields(normalized);
    
    // 8. Ensure required fields have defaults
    this.ensureRequiredFields(normalized);
    
    return normalized;
  }

  /**
   * Generate AI-enhanced fields for the program
   */

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
  private async generateAIEnhancedFields(program: NormalizedProgram): Promise<void> {
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
    
    // Generate categorized requirements using DYNAMIC patterns
    program.categorized_requirements = await this.categorizeRequirements(program);
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
   * DYNAMIC: Categorize requirements into core 18 categories with learning
   */
  private async categorizeRequirements(program: NormalizedProgram): Promise<any> {
    const categories: { [key: string]: any[] } = {
      eligibility: [],
      documents: [],
      financial: [],
      technical: [],
      legal: [],
      timeline: [],
      geographic: [],
      team: [],
      project: [],
      compliance: [],
      impact: [],
      capex_opex: [],
      use_of_funds: [],
      revenue_model: [],
      market_size: [],
      co_financing: [],
      trl_level: [],
      consortium: []
    };

    // Extract all text content for pattern matching
    const textContent = this.extractTextContent(program);
    
    // DYNAMIC: Use enhanced scraper's learning patterns if available
    try {
      const { dynamicPatternEngine } = await import('./dynamicPatternEngine');
      const institution = this.extractInstitution(program);
      
      // Use dynamic pattern engine for enhanced categorization
      const extractedRequirements = await dynamicPatternEngine.extractRequirements(
        textContent,
        institution,
        Object.keys(CORE_18_CATEGORIES) as any
      );
      
      // Add extracted requirements to categories
      extractedRequirements.forEach((requirements, category) => {
        if (requirements.length > 0) {
          categories[category].push({
            type: category,
            value: requirements,
            required: true,
            source: 'dynamic_patterns',
            confidence: this.calculateAverageConfidence(requirements),
            evidence: requirements.flatMap(req => req.evidence),
            institutions: Array.from(new Set(requirements.map(req => req.institution)))
          });
        }
      });
    } catch (error) {
      console.warn('Dynamic pattern engine not available, using static patterns');
      
      // FALLBACK: Simple pattern matching for each of the 18 categories
      Object.keys(CORE_18_CATEGORIES).forEach(categoryKey => {
        const categoryConfig = (CORE_18_CATEGORIES as any)[categoryKey];
        const matches = this.findSimpleMatches(textContent, categoryConfig.patterns);
        
        if (matches.length > 0) {
          categories[categoryKey].push({
            type: categoryKey,
            value: matches,
            required: true,
            source: 'static_patterns',
            confidence: Math.min(matches.length / 3, 1.0)
          });
        }
      });
    }

    // Add basic program data to relevant categories
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
   * SIMPLIFIED: Find simple pattern matches in text
   */
  private findSimpleMatches(text: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    
    for (const pattern of patterns) {
      const patternMatches = text.match(pattern);
      if (patternMatches) {
        matches.push(patternMatches[0]);
      }
    }
    
    return matches;
  }


  /**
   * DYNAMIC: Extract text content from program
   */
  private extractTextContent(program: NormalizedProgram): string {
    const textParts = [];
    
    if (program.description) textParts.push(program.description);
    if (program.name) textParts.push(program.name);
    
    // Extract from requirements
    if (program.requirements && typeof program.requirements === 'object') {
      Object.values(program.requirements).forEach(req => {
        if (typeof req === 'string') {
          textParts.push(req);
        } else if (typeof req === 'object' && req !== null) {
          if ((req as any).description) textParts.push((req as any).description);
          if ((req as any).value && typeof (req as any).value === 'string') textParts.push((req as any).value);
        }
      });
    }
    
    // Extract from eligibility criteria
    if (program.eligibility_criteria && typeof program.eligibility_criteria === 'object') {
      Object.values(program.eligibility_criteria).forEach(criteria => {
        if (typeof criteria === 'string') {
          textParts.push(criteria);
        } else if (Array.isArray(criteria)) {
          criteria.forEach(item => {
            if (typeof item === 'string') textParts.push(item);
          });
        }
      });
    }
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * Extract institution from program data
   */
  private extractInstitution(program: NormalizedProgram): string {
    if (program.institution) {
      return program.institution.toLowerCase();
    }
    
    if (program.source_url) {
      if (program.source_url.includes('aws.at')) return 'aws';
      if (program.source_url.includes('ffg.at')) return 'ffg';
      if (program.source_url.includes('viennabusinessagency.at')) return 'vba';
      if (program.source_url.includes('ec.europa.eu')) return 'eu';
      if (program.source_url.includes('ams.at')) return 'ams';
    }
    
    return 'general';
  }

  /**
   * Calculate average confidence from dynamic pattern results
   */
  private calculateAverageConfidence(requirements: any[]): number {
    if (requirements.length === 0) return 0;
    
    const totalConfidence = requirements.reduce((sum, req) => sum + req.confidence, 0);
    return totalConfidence / requirements.length;
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
    if (!program.scraped_at) program.scraped_at = new Date() as any;
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
   * SIMPLIFIED: Calculate completeness score (0-1)
   */
  private calculateCompleteness(program: NormalizedProgram): number {
    const requiredFields = ['id', 'name', 'type', 'institution'];
    let score = 0;
    
    for (const field of requiredFields) {
      const value = (program as any)[field];
      if (value !== undefined && value !== null && value !== '') {
        score += 1;
      }
    }
    
    return score / requiredFields.length;
  }

  /**
   * SIMPLIFIED: Calculate accuracy score (0-1)
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
   * SIMPLIFIED: Calculate consistency score (0-1)
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
    
    return checks > 0 ? score / checks : 0.5;
  }

  /**
   * ENHANCED: Validate a program with advanced validation rules
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
    
    // ENHANCED: Advanced program validation rules
    this.validateProgramContent(program, errors, warnings);
    this.validateProgramStructure(program, errors, warnings);
    this.validateProgramCompleteness(program, errors, warnings);
    
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

  /**
   * NEW: Validate program content quality
   */
  private validateProgramContent(program: NormalizedProgram, _errors: string[], warnings: string[]): void {
    // Description quality
    if (program.description) {
      const descLength = program.description.trim().length;
      if (descLength < 50) {
        warnings.push('Program description is very short - consider adding more details');
      }
      if (descLength > 2000) {
        warnings.push('Program description is very long - consider summarizing');
      }
      
      // Check for essential information in description
      const hasEligibility = /eligible|qualification|criteria|requirements/i.test(program.description);
      const hasDeadline = /deadline|application|due|frist/i.test(program.description);
      const hasAmount = /funding|amount|budget|€|\$/i.test(program.description);
      
      if (!hasEligibility) {
        warnings.push('Description should mention eligibility criteria');
      }
      if (!hasDeadline) {
        warnings.push('Description should mention application deadline');
      }
      if (!hasAmount) {
        warnings.push('Description should mention funding amount');
      }
    }
    
    // Institution validation
    if (program.institution) {
      const institutionLength = program.institution.trim().length;
      if (institutionLength < 3) {
        warnings.push('Institution name seems too short');
      }
      if (institutionLength > 100) {
        warnings.push('Institution name seems too long');
      }
    }
  }

  /**
   * NEW: Validate program structure and consistency
   */
  private validateProgramStructure(program: NormalizedProgram, errors: string[], warnings: string[]): void {
    // Type consistency
    if (program.type && program.program_type && program.type !== program.program_type) {
      warnings.push('Program type and program_type fields are inconsistent');
    }
    
    // Funding amount consistency
    if (program.funding_amount_min && program.funding_amount_max) {
      const range = program.funding_amount_max - program.funding_amount_min;
      if (range < 0) {
        errors.push('Funding amount range is invalid (max < min)');
      } else if (range > program.funding_amount_max) {
        warnings.push('Funding amount range is very wide - consider if this is accurate');
      }
    }
    
    // Currency consistency
    if (program.currency && program.currency !== 'EUR' && program.source_url?.includes('.at')) {
      warnings.push('Non-EUR currency for Austrian program - verify this is correct');
    }
    
    // Deadline validation
    if (program.deadline) {
      const deadline = new Date(program.deadline);
      const now = new Date();
      if (deadline < now) {
        warnings.push('Program deadline is in the past');
      }
      if (deadline > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
        warnings.push('Program deadline is more than 1 year away - verify accuracy');
      }
    }
  }

  /**
   * NEW: Validate program completeness for different program types
   */
  private validateProgramCompleteness(program: NormalizedProgram, errors: string[], warnings: string[]): void {
    const programType = program.type || program.program_type;
    
    switch (programType) {
      case 'grant':
        this.validateGrantProgram(program, errors, warnings);
        break;
      case 'loan':
        this.validateLoanProgram(program, errors, warnings);
        break;
      case 'equity':
        this.validateEquityProgram(program, errors, warnings);
        break;
      default:
        this.validateGenericProgram(program, errors, warnings);
    }
  }

  /**
   * NEW: Validate grant-specific requirements
   */
  private validateGrantProgram(program: NormalizedProgram, _errors: string[], warnings: string[]): void {
    // Grants typically need eligibility criteria
    if (!program.eligibility_criteria || Object.keys(program.eligibility_criteria).length === 0) {
      warnings.push('Grant program should have eligibility criteria');
    }
    
    // Grants often have specific requirements
    if (!program.requirements || Object.keys(program.requirements).length === 0) {
      warnings.push('Grant program should have specific requirements');
    }
    
    // Grants typically have application deadlines
    if (!program.deadline) {
      warnings.push('Grant program should have application deadline');
    }
  }

  /**
   * NEW: Validate loan-specific requirements
   */
  private validateLoanProgram(program: NormalizedProgram, errors: string[], warnings: string[]): void {
    // Loans need financial information
    if (!program.funding_amount_min && !program.funding_amount_max) {
      errors.push('Loan program must have funding amount information');
    }
    
    // Loans typically need repayment terms
    if (!program.description?.toLowerCase().includes('repay') && 
        !program.description?.toLowerCase().includes('interest')) {
      warnings.push('Loan program should mention repayment terms');
    }
  }

  /**
   * NEW: Validate equity-specific requirements
   */
  private validateEquityProgram(program: NormalizedProgram, _errors: string[], warnings: string[]): void {
    // Equity programs need company stage information
    if (!program.description?.toLowerCase().includes('stage') && 
        !program.description?.toLowerCase().includes('startup') &&
        !program.description?.toLowerCase().includes('scale')) {
      warnings.push('Equity program should specify target company stage');
    }
    
    // Equity programs typically need valuation information
    if (!program.description?.toLowerCase().includes('valuation') && 
        !program.description?.toLowerCase().includes('equity')) {
      warnings.push('Equity program should mention valuation or equity terms');
    }
  }

  /**
   * NEW: Validate generic program requirements
   */
  private validateGenericProgram(program: NormalizedProgram, errors: string[], warnings: string[]): void {
    // All programs should have basic information
    if (!program.description) {
      errors.push('Program must have a description');
    }
    
    if (!program.institution) {
      errors.push('Program must have an institution');
    }
    
    // Check for contact information
    if (!program.contact_info || Object.keys(program.contact_info).length === 0) {
      warnings.push('Program should have contact information');
    }
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
    
    for (const key of Array.from(this.cache.keys())) {
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
  private cache: DataCaching;

  constructor() {
    this.normalizer = new DataNormalization();
    this.cache = new DataCaching();
  }

  /**
   * SIMPLIFIED: Process raw scraped programs through the pipeline
   */

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
    
    // If not in cache, try to load latest scraped JSON and process
    console.log('⚠️ No cached data available - attempting to populate pipeline...');
    const dataDir = path.join(process.cwd(), 'data');
    const latestPath = path.join(dataDir, 'scraped-programs-latest.json');
    
    try {
      if (fs.existsSync(latestPath)) {
        const raw = fs.readFileSync(latestPath, 'utf-8');
        const parsed = JSON.parse(raw);
        const rawPrograms: ScrapedProgram[] = Array.isArray(parsed?.programs)
          ? parsed.programs
          : Array.isArray(parsed)
            ? parsed
            : [];
        if (rawPrograms.length > 0) {
          console.log(`🔄 Processing ${rawPrograms.length} programs from scraped-programs-latest.json...`);
          const processed = await this.processPrograms(rawPrograms);
          await this.cacheProcessedPrograms(processed, cacheKey);
          console.log(`✅ Pipeline populated with ${processed.length} programs`);
          return processed;
        }
      }
    } catch (e) {
      console.warn('Failed reading scraped-programs-latest.json:', e);
    }

    // Fallback: attempt to read most recent dated file in data/
    try {
      const files = fs.readdirSync(dataDir)
        .filter(f => /^scraped-programs-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse();
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
          const parsed = JSON.parse(raw);
          const rawPrograms: ScrapedProgram[] = Array.isArray(parsed?.programs)
            ? parsed.programs
            : Array.isArray(parsed)
              ? parsed
              : [];
          if (rawPrograms.length > 0) {
            console.log(`🔄 Processing ${rawPrograms.length} programs from ${file}...`);
            const processed = await this.processPrograms(rawPrograms);
            await this.cacheProcessedPrograms(processed, cacheKey);
            console.log(`✅ Pipeline populated with ${processed.length} programs`);
            return processed;
          }
        } catch (_) {
          // try next file
        }
      }
    } catch (_) {
      // ignore
    }

    console.log('⚠️ No data available for pipeline processing - returning empty array');
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
   * Remove duplicate programs based on name and institution
   */
  private removeDuplicates(programs: NormalizedProgram[]): NormalizedProgram[] {
    const seen = new Map<string, NormalizedProgram>();
    const duplicates: NormalizedProgram[] = [];
    
    for (const program of programs) {
      const key = `${program.name.toLowerCase()}_${program.institution?.toLowerCase() || 'unknown'}`;
      
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

  /**
   * Generate target personas based on program characteristics
   */

  /**
   * Generate tags based on program characteristics
   */

  /**
   * Generate AI guidance for the program
   */


  /**
   * Load raw programs from data files
   */

  /**
   * Process programs through the pipeline
   */
  private async processPrograms(rawPrograms: ScrapedProgram[]): Promise<NormalizedProgram[]> {
    console.log('🔄 Processing programs through pipeline...');
    
    // Step 1: Filter out low-quality programs BEFORE normalization
    const filteredPrograms = this.filterLowQualityPrograms(rawPrograms);
    console.log(`📊 Data quality filter: ${rawPrograms.length} → ${filteredPrograms.length} programs`);
    
    // Step 2: Normalize programs
    const normalizedPrograms: NormalizedProgram[] = [];
    for (const rawProgram of filteredPrograms) {
      try {
        const normalized = await this.normalizer.normalizeProgram(rawProgram);
        normalizedPrograms.push(normalized);
      } catch (error) {
        console.warn(`⚠️ Failed to normalize program ${rawProgram.id}:`, error);
      }
    }
    
    // Step 3: Remove duplicates
    const uniquePrograms = this.removeDuplicates(normalizedPrograms);
    
    // Step 4: Sort by quality score
    const sortedPrograms = uniquePrograms.sort((a, b) => b.quality_score - a.quality_score);
    
    console.log(`✅ Pipeline processing complete: ${sortedPrograms.length} programs`);
    return sortedPrograms;
  }

  /**
   * Filter out low-quality programs (error pages, navigation, etc.)
   */
  private filterLowQualityPrograms(programs: ScrapedProgram[]): ScrapedProgram[] {
    return programs.filter(program => {
      const name = program.name?.toLowerCase() || '';
      const description = program.description?.toLowerCase() || '';
      
      // Filter out error pages
      const isErrorPage = 
        name.includes('newsletter') ||
        name.includes('metanavigation') ||
        name.includes('not found') ||
        name.includes('error') ||
        name.includes('bad gateway') ||
        name.includes('404') ||
        name.includes('500') ||
        description.includes('seite wurde nicht gefunden') ||
        description.includes('page not found') ||
        description.includes('error occurred');
      
      // Filter out navigation pages
      const isNavigationPage = 
        name.includes('navigation') ||
        name.includes('menu') ||
        name.includes('footer') ||
        name.includes('header') ||
        name.includes('sidebar');
      
      // Filter out programs with very short descriptions (likely not real programs)
      // More lenient filtering - only filter out truly minimal content
      const hasMinimalContent = 
        !description || 
        description.length < 20 ||  // Reduced from 50 to 20
        description.split(' ').length < 5;  // Reduced from 10 to 5
      
      // Filter out programs without meaningful data
      // More lenient - only filter if truly no data at all
      const hasNoMeaningfulData = 
        !program.funding_amount_min && 
        !program.funding_amount_max && 
        !program.requirements &&
        !program.eligibility_criteria &&
        !program.name &&  // Also check if name exists
        description.length < 10;  // And description is truly minimal
      
      const isValid = !isErrorPage && !isNavigationPage && !hasMinimalContent && !hasNoMeaningfulData;
      
      if (!isValid) {
        console.log(`🚫 Filtered out program: ${program.name} (${isErrorPage ? 'error page' : isNavigationPage ? 'navigation' : hasMinimalContent ? 'minimal content' : 'no meaningful data'})`);
      }
      
      return isValid;
    });
  }

}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const enhancedDataPipeline = new EnhancedDataPipeline();
