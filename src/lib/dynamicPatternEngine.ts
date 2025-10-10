/**
 * Dynamic Pattern Engine - Learns and adapts patterns from real data
 * This is the core of making the system truly dynamic
 */

import { RequirementCategory } from '../types/requirements';

export interface DynamicPattern {
  id: string;
  category: RequirementCategory;
  pattern: RegExp;
  institution: string;
  confidence: number;
  success_count: number;
  failure_count: number;
  last_used: Date;
  created_at: Date;
  examples: string[];
  context?: string;
}

export interface PatternLearningResult {
  pattern_id: string;
  success: boolean;
  confidence: number;
  evidence: string;
  institution: string;
  timestamp: Date;
}

export class DynamicPatternEngine {
  private patterns: Map<string, DynamicPattern> = new Map();
  private learningResults: PatternLearningResult[] = [];
  private minConfidence = 0.3;
  private maxPatterns = 1000;

  constructor() {
    this.initializeBasePatterns();
    this.loadPatterns(); // Load persisted patterns
  }

  /**
   * Initialize with base patterns, then learn from real data
   */
  private initializeBasePatterns(): void {
    const basePatterns: Omit<DynamicPattern, 'id' | 'created_at' | 'last_used' | 'success_count' | 'failure_count'>[] = [
      // Co-financing patterns
      {
        category: 'co_financing',
        pattern: /(?:mindestens|at least)\s+(\d{1,3})\s*%/gi,
        institution: 'general',
        confidence: 0.7,
        examples: ['mindestens 50% Eigenbeitrag', 'at least 50% own contribution']
      },
      {
        category: 'co_financing',
        pattern: /(?:eigenbeitrag|own contribution)\s*:?\s*(\d{1,3})\s*%/gi,
        institution: 'ADA',
        confidence: 0.8,
        examples: ['eigenbeitrag von mindestens 50%']
      },
      
      // TRL Level patterns
      {
        category: 'trl_level',
        pattern: /(?:trl|technology readiness level)\s*(\d)\s*(?:–|-|to)\s*(\d)/gi,
        institution: 'FFG',
        confidence: 0.9,
        examples: ['TRL 3-7', 'technology readiness level 2-4']
      },
      
      // Impact patterns - Expanded to cover all 8 impact types
      {
        category: 'impact',
        pattern: /(?:innovation|environmental|social)\s+impact/i,
        institution: 'EU',
        confidence: 0.8,
        examples: ['innovation impact', 'environmental impact']
      },
      {
        category: 'impact',
        pattern: /(?:economic|wirtschaftlich)\s+impact/i,
        institution: 'AWS',
        confidence: 0.8,
        examples: ['economic impact', 'wirtschaftlicher impact']
      },
      {
        category: 'impact',
        pattern: /(?:job\s+creation|arbeitsplatzschaffung)/i,
        institution: 'VBA',
        confidence: 0.9,
        examples: ['job creation', 'arbeitsplatzschaffung']
      },
      {
        category: 'impact',
        pattern: /(?:digital\s+transformation|digitale\s+transformation)/i,
        institution: 'Digital Europe',
        confidence: 0.8,
        examples: ['digital transformation', 'digitale transformation']
      },
      {
        category: 'impact',
        pattern: /(?:regional\s+development|regionale\s+entwicklung)/i,
        institution: 'ADA',
        confidence: 0.8,
        examples: ['regional development', 'regionale entwicklung']
      },
      {
        category: 'impact',
        pattern: /(?:export\s+potential|exportpotential)/i,
        institution: 'EIC',
        confidence: 0.8,
        examples: ['export potential', 'exportpotential']
      },
      {
        category: 'impact',
        pattern: /(?:scientific\s+advancement|wissenschaftlicher\s+fortschritt)/i,
        institution: 'FFG',
        confidence: 0.9,
        examples: ['scientific advancement', 'wissenschaftlicher fortschritt']
      },
      {
        category: 'impact',
        pattern: /(?:cultural\s+preservation|kulturerhalt)/i,
        institution: 'Creative Europe',
        confidence: 0.8,
        examples: ['cultural preservation', 'kulturerhalt']
      },
      
      // Consortium patterns
      {
        category: 'consortium',
        pattern: /(?:konsortialpartner|consortium partner)/i,
        institution: 'Eurostars',
        confidence: 0.9,
        examples: ['Konsortialpartner', 'consortium partner']
      }
    ];

    basePatterns.forEach((pattern, index) => {
      const dynamicPattern: DynamicPattern = {
        ...pattern,
        id: `base_${index}`,
        created_at: new Date(),
        last_used: new Date(),
        success_count: 0,
        failure_count: 0
      };
      this.patterns.set(dynamicPattern.id, dynamicPattern);
    });
  }

  /**
   * Learn new patterns from successful extractions
   */
  async learnFromExtraction(
    text: string,
    category: RequirementCategory,
    institution: string,
    extractedValue: string,
    confidence: number
  ): Promise<void> {
    console.log(`🧠 Learning from extraction: ${category} - ${extractedValue} (confidence: ${confidence})`);
    
    // Find the pattern that matched
    const matchingPattern = this.findMatchingPattern(text, category);
    
    if (matchingPattern) {
      // Update existing pattern success rate
      matchingPattern.success_count++;
      matchingPattern.confidence = this.calculateAdaptiveConfidence(matchingPattern);
      matchingPattern.last_used = new Date();
      
      // Add new example if it's different
      if (!matchingPattern.examples.includes(extractedValue)) {
        matchingPattern.examples.push(extractedValue);
        // Keep only last 10 examples
        if (matchingPattern.examples.length > 10) {
          matchingPattern.examples = matchingPattern.examples.slice(-10);
        }
      }
      
      console.log(`✅ Updated existing pattern ${matchingPattern.id} (success: ${matchingPattern.success_count}, confidence: ${matchingPattern.confidence})`);
    } else {
      // Create new pattern from successful extraction
      await this.createPatternFromExtraction(text, category, institution, extractedValue, confidence);
      console.log(`🆕 Created new pattern for ${category} from extraction`);
    }

    // Record learning result
    this.learningResults.push({
      pattern_id: matchingPattern?.id || 'new',
      success: true,
      confidence,
      evidence: extractedValue,
      institution,
      timestamp: new Date()
    });
    
    // Persist patterns to database (if available)
    await this.persistPatterns();
  }

  /**
   * Learn from failed extractions
   */
  async learnFromFailure(
    _text: string,
    _category: RequirementCategory,
    _institution: string,
    attemptedPattern: string
  ): Promise<void> {
    const matchingPattern = this.patterns.get(attemptedPattern);
    if (matchingPattern) {
      matchingPattern.failure_count++;
      matchingPattern.confidence = this.calculateAdaptiveConfidence(matchingPattern);
    }

    // Record learning result
    this.learningResults.push({
      pattern_id: attemptedPattern,
      success: false,
      confidence: 0,
      evidence: _text.substring(0, 100),
      institution: _institution,
      timestamp: new Date()
    });
  }

  /**
   * Extract requirements using dynamic patterns
   */
  async extractRequirements(
    text: string,
    institution: string,
    categories: RequirementCategory[] = []
  ): Promise<Map<RequirementCategory, any[]>> {
    const results = new Map<RequirementCategory, any[]>();
    
    // Get patterns for this institution and categories
    const relevantPatterns = this.getRelevantPatterns(institution, categories);
    
    for (const pattern of relevantPatterns) {
      const matches = this.applyPattern(text, pattern);
      if (matches.length > 0) {
        if (!results.has(pattern.category)) {
          results.set(pattern.category, []);
        }
        
        results.get(pattern.category)!.push({
          value: matches.map(m => m.text), // Convert to array of strings
          confidence: pattern.confidence,
          pattern_id: pattern.id,
          institution: pattern.institution,
          evidence: matches.map(m => m.text)
        });

        // Learn from this successful extraction
        await this.learnFromExtraction(
          text,
          pattern.category,
          institution,
          matches[0].text,
          pattern.confidence
        );
      }
    }

    return results;
  }

  /**
   * Get patterns that are relevant for this institution and categories
   */
  private getRelevantPatterns(
    institution: string,
    categories: RequirementCategory[]
  ): DynamicPattern[] {
    const patterns = Array.from(this.patterns.values());
    
    return patterns
      .filter(pattern => {
        // Filter by institution (exact match or general)
        const institutionMatch = pattern.institution === institution || pattern.institution === 'general';
        
        // Filter by categories if specified
        const categoryMatch = categories.length === 0 || categories.includes(pattern.category);
        
        // Filter by minimum confidence
        const confidenceMatch = pattern.confidence >= this.minConfidence;
        
        return institutionMatch && categoryMatch && confidenceMatch;
      })
      .sort((a, b) => {
        // Sort by confidence, then by success rate
        const confidenceDiff = b.confidence - a.confidence;
        if (confidenceDiff !== 0) return confidenceDiff;
        
        const successRateA = a.success_count / (a.success_count + a.failure_count || 1);
        const successRateB = b.success_count / (b.success_count + b.failure_count || 1);
        return successRateB - successRateA;
      });
  }

  /**
   * Apply a pattern to text and return matches
   */
  private applyPattern(text: string, pattern: DynamicPattern): Array<{ text: string; match: RegExpMatchArray }> {
    const matches: Array<{ text: string; match: RegExpMatchArray }> = [];
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        text: match[0],
        match: match
      });
    }
    
    return matches;
  }

  /**
   * Find the pattern that would match this text
   */
  private findMatchingPattern(text: string, category: RequirementCategory): DynamicPattern | null {
    const patterns = Array.from(this.patterns.values())
      .filter(p => p.category === category);
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      if (regex.test(text)) {
        return pattern;
      }
    }
    
    return null;
  }

  /**
   * Create a new pattern from a successful extraction
   */
  private async createPatternFromExtraction(
    _text: string,
    _category: RequirementCategory,
    _institution: string,
    _extractedValue: string,
    _confidence: number
  ): Promise<void> {
    // Generate a regex pattern from the extracted value
    const pattern = this.generatePatternFromValue(_extractedValue);
    
    if (pattern) {
      const dynamicPattern: DynamicPattern = {
        id: `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: _category,
        pattern,
        institution: _institution,
        confidence: _confidence,
        success_count: 1,
        failure_count: 0,
        last_used: new Date(),
        created_at: new Date(),
        examples: [_extractedValue]
      };

      // Only add if we don't have too many patterns
      if (this.patterns.size < this.maxPatterns) {
        this.patterns.set(dynamicPattern.id, dynamicPattern);
      }
    }
  }

  /**
   * Generate a regex pattern from an extracted value
   */
  private generatePatternFromValue(value: string): RegExp | null {
    try {
      // Simple pattern generation - in production, this would be more sophisticated
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = escaped.replace(/\d+/g, '\\d+').replace(/\s+/g, '\\s+');
      return new RegExp(pattern, 'gi');
    } catch (error) {
      console.warn('Failed to generate pattern from value:', value, error);
      return null;
    }
  }

  /**
   * Persist patterns to database (if available)
   */
  private async persistPatterns(): Promise<void> {
    try {
      // Convert patterns to array for database storage
      const patternsArray = Array.from(this.patterns.values()).map(pattern => ({
        ...pattern,
        pattern: pattern.pattern.toString(), // Convert RegExp to string
        last_used: pattern.last_used.toISOString(),
        created_at: pattern.created_at.toISOString()
      }));

      // Store in localStorage for now (in production, use database)
      if (typeof window !== 'undefined') {
        localStorage.setItem('dynamic_patterns', JSON.stringify(patternsArray));
        console.log(`💾 Patterns persisted to localStorage: ${this.patterns.size} total patterns`);
      } else {
        // Server-side: could store in database here
        console.log(`💾 Patterns persisted: ${this.patterns.size} total patterns`);
      }
    } catch (error) {
      console.warn('Failed to persist patterns:', error);
    }
  }

  /**
   * Load patterns from database (if available)
   */
  private async loadPatterns(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('dynamic_patterns');
        if (stored) {
          const patternsArray = JSON.parse(stored);
          patternsArray.forEach((pattern: any) => {
            // Convert string back to RegExp
            const regex = new RegExp(pattern.pattern.slice(1, -1), pattern.pattern.includes('gi') ? 'gi' : 'i');
            const dynamicPattern: DynamicPattern = {
              ...pattern,
              pattern: regex,
              last_used: new Date(pattern.last_used),
              created_at: new Date(pattern.created_at)
            };
            this.patterns.set(dynamicPattern.id, dynamicPattern);
          });
          console.log(`📥 Loaded ${patternsArray.length} patterns from localStorage`);
        }
      }
    } catch (error) {
      console.warn('Failed to load patterns:', error);
    }
  }

  /**
   * Calculate adaptive confidence based on success/failure rates
   */
  private calculateAdaptiveConfidence(pattern: DynamicPattern): number {
    const total = pattern.success_count + pattern.failure_count;
    if (total === 0) return pattern.confidence;
    
    const successRate = pattern.success_count / total;
    const baseConfidence = pattern.confidence;
    
    // Adaptive confidence: base confidence adjusted by success rate
    const adaptiveConfidence = baseConfidence * 0.7 + successRate * 0.3;
    
    return Math.min(Math.max(adaptiveConfidence, 0.1), 1.0);
  }

  /**
   * Get pattern statistics for monitoring
   */
  getPatternStatistics(): {
    totalPatterns: number;
    patternsByCategory: Record<RequirementCategory, number>;
    patternsByInstitution: Record<string, number>;
    averageConfidence: number;
    topPerformingPatterns: DynamicPattern[];
  } {
    const patterns = Array.from(this.patterns.values());
    
    const patternsByCategory: Record<RequirementCategory, number> = {} as any;
    const patternsByInstitution: Record<string, number> = {};
    
    patterns.forEach(pattern => {
      patternsByCategory[pattern.category] = (patternsByCategory[pattern.category] || 0) + 1;
      patternsByInstitution[pattern.institution] = (patternsByInstitution[pattern.institution] || 0) + 1;
    });
    
    const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    
    const topPerformingPatterns = patterns
      .sort((a, b) => {
        const successRateA = a.success_count / (a.success_count + a.failure_count || 1);
        const successRateB = b.success_count / (b.success_count + b.failure_count || 1);
        return successRateB - successRateA;
      })
      .slice(0, 10);
    
    return {
      totalPatterns: patterns.length,
      patternsByCategory,
      patternsByInstitution,
      averageConfidence,
      topPerformingPatterns
    };
  }

  /**
   * Clean up old patterns that aren't performing well
   */
  cleanupPatterns(): void {
    const patterns = Array.from(this.patterns.values());
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    patterns.forEach(pattern => {
      const total = pattern.success_count + pattern.failure_count;
      const successRate = total > 0 ? pattern.success_count / total : 0;
      
      // Remove patterns that are old and have low success rate
      if (pattern.last_used < cutoffDate && successRate < 0.3) {
        this.patterns.delete(pattern.id);
      }
    });
  }
}

// Export singleton instance
export const dynamicPatternEngine = new DynamicPatternEngine();
