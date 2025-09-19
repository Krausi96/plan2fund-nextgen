// Coverage Checker - Validates Programs × Fields × Questions coverage
import rawPrograms from '@/data/programs';
import rawQuestions from '@/data/questions';

export interface CoverageGap {
  programId: string;
  programName: string;
  field: string;
  fieldLabel: string;
  hasCoverage: boolean;
  coverageType: 'HARD' | 'SOFT' | 'UNCERTAIN' | 'NONE';
  evidence: string;
}

export interface CoverageReport {
  totalPrograms: number;
  totalFields: number;
  totalCoverage: number;
  coveragePercentage: number;
  gaps: CoverageGap[];
  criticalGaps: CoverageGap[];
  fieldCoverage: Record<string, number>;
}

export class CoverageChecker {
  private programs: any[];
  private questions: any[];

  constructor() {
    this.programs = rawPrograms.programs;
    this.questions = rawQuestions.universal;
  }

  /**
   * Generate comprehensive coverage report
   */
  generateCoverageReport(): CoverageReport {
    const gaps: CoverageGap[] = [];
    const fieldCoverage: Record<string, number> = {};
    
    // Initialize field coverage counters
    this.questions.forEach(q => {
      fieldCoverage[q.id] = 0;
    });

    // Check each program's coverage of each field
    for (const program of this.programs) {
      for (const question of this.questions) {
        const coverage = this.checkFieldCoverage(program, question.id);
        
        if (!coverage.hasCoverage) {
          gaps.push({
            programId: program.id,
            programName: program.name,
            field: question.id,
            fieldLabel: question.label,
            hasCoverage: false,
            coverageType: 'NONE',
            evidence: 'No rules found for this field'
          });
        } else {
          fieldCoverage[question.id]++;
        }
      }
    }

    const totalPrograms = this.programs.length;
    const totalFields = this.questions.length;
    const totalCoverage = totalPrograms * totalFields;
    const actualCoverage = totalCoverage - gaps.length;
    const coveragePercentage = Math.round((actualCoverage / totalCoverage) * 100);

    // Identify critical gaps (fields with <50% coverage)
    const criticalGaps = gaps.filter(gap => {
      const fieldCoverageCount = fieldCoverage[gap.field];
      return fieldCoverageCount < totalPrograms * 0.5;
    });

    return {
      totalPrograms,
      totalFields,
      totalCoverage,
      coveragePercentage,
      gaps,
      criticalGaps,
      fieldCoverage
    };
  }

  /**
   * Check if a program has coverage for a specific field
   */
  private checkFieldCoverage(program: any, fieldId: string): {
    hasCoverage: boolean;
    coverageType: 'HARD' | 'SOFT' | 'UNCERTAIN' | 'NONE';
    evidence: string;
  } {
    // Check overlays for field coverage
    if (program.overlays) {
      for (const overlay of program.overlays) {
        if (overlay.ask_if && overlay.ask_if.includes(fieldId)) {
          return {
            hasCoverage: true,
            coverageType: overlay.decisiveness || 'UNCERTAIN',
            evidence: overlay.rationale || 'Field referenced in overlay'
          };
        }
      }
    }

    // Check eligibility array for field references
    if (program.eligibility) {
      for (const rule of program.eligibility) {
        const lowerRule = rule.toLowerCase();
        const fieldKeywords = this.getFieldKeywords(fieldId);
        
        for (const keyword of fieldKeywords) {
          if (lowerRule.includes(keyword)) {
            return {
              hasCoverage: true,
              coverageType: 'SOFT',
              evidence: `Field referenced in eligibility: ${rule}`
            };
          }
        }
      }
    }

    return {
      hasCoverage: false,
      coverageType: 'NONE',
      evidence: 'No rules found for this field'
    };
  }

  /**
   * Get keywords that indicate field coverage
   */
  private getFieldKeywords(fieldId: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'q1_country': ['austria', 'at', 'eu', 'europe', 'country', 'location'],
      'q2_entity_stage': ['startup', 'company', 'incorporated', 'months', 'age', 'stage'],
      'q3_company_size': ['micro', 'small', 'medium', 'large', 'employees', 'fte', 'size'],
      'q4_theme': ['innovation', 'digital', 'sustainability', 'health', 'space', 'theme'],
      'q5_maturity_trl': ['trl', 'maturity', 'prototype', 'proof', 'concept', 'development'],
      'q6_rnd_in_at': ['r&d', 'research', 'development', 'austria', 'experimental'],
      'q7_collaboration': ['collaboration', 'partnership', 'research', 'institution', 'university'],
      'q8_funding_types': ['grant', 'loan', 'equity', 'funding', 'finance'],
      'q9_team_diversity': ['diversity', 'women', 'gender', 'team', 'shares'],
      'q10_env_benefit': ['environment', 'emissions', 'energy', 'waste', 'climate', 'sustainability']
    };
    
    return keywords[fieldId] || [];
  }

  /**
   * Generate coverage table for display
   */
  generateCoverageTable(): string {
    const report = this.generateCoverageReport();
    let table = '| Program | ' + this.questions.map(q => q.id).join(' | ') + ' |\n';
    table += '|---------|' + this.questions.map(() => '--------').join('|') + '|\n';

    for (const program of this.programs) {
      const row = [program.name];
      
      for (const question of this.questions) {
        const coverage = this.checkFieldCoverage(program, question.id);
        const symbol = coverage.hasCoverage ? 
          (coverage.coverageType === 'HARD' ? '✅ HARD' : 
           coverage.coverageType === 'SOFT' ? '✅ SOFT' : '✅ UNCERTAIN') : '❌';
        row.push(symbol);
      }
      
      table += '| ' + row.join(' | ') + ' |\n';
    }

    return table;
  }

  /**
   * Check if coverage meets minimum requirements
   */
  validateCoverage(): { passed: boolean; errors: string[] } {
    const report = this.generateCoverageReport();
    const errors: string[] = [];

    // Check overall coverage percentage
    if (report.coveragePercentage < 70) {
      errors.push(`Overall coverage ${report.coveragePercentage}% is below minimum 70%`);
    }

    // Check critical gaps
    if (report.criticalGaps.length > 0) {
      const criticalFields = [...new Set(report.criticalGaps.map(g => g.field))];
      errors.push(`Critical gaps in fields: ${criticalFields.join(', ')}`);
    }

    // Check field-specific coverage
    for (const [field, count] of Object.entries(report.fieldCoverage)) {
      const coveragePercent = Math.round((count / report.totalPrograms) * 100);
      if (coveragePercent < 50) {
        errors.push(`Field ${field} has only ${coveragePercent}% coverage (minimum 50%)`);
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const coverageChecker = new CoverageChecker();
