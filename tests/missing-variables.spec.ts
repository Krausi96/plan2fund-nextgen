import { describe, it, expect } from '@jest/globals';
import { deriveSignals } from '../src/lib/enhancedRecoEngine';
import { UserAnswers } from '../src/types';

describe('Missing Variable Handling', () => {
  describe('deriveSignals with missing variables', () => {
    it('should handle completely missing answers gracefully', () => {
      const answers: UserAnswers = {};
      
      const signals = deriveSignals(answers);
      
      // Should not crash
      expect(signals).toBeDefined();
      expect(signals.unknowns).toBeDefined();
      expect(signals.counterfactuals).toBeDefined();
      
      // Should have many unknowns
      expect(signals.unknowns.length).toBeGreaterThan(0);
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
      
      // Should have default values
      expect(signals.fundingMode).toBe('grant');
      expect(signals.companyAgeBucket).toBe('pre');
      expect(signals.urgencyBucket).toBe('normal');
      expect(signals.sectorBucket).toBe('general');
    });

    it('should handle missing theme gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9'
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.unknowns).toContain('q4_theme');
      expect(signals.counterfactuals).toContain('Add project theme to unlock theme-specific programs');
      expect(signals.sectorBucket).toBe('general');
    });

    it('should handle missing stage and size gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q4_theme: ['INNOVATION_DIGITAL']
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.unknowns).toContain('q2_entity_stage');
      expect(signals.unknowns).toContain('q3_company_size');
      expect(signals.counterfactuals).toContain('Add company stage to qualify for stage-specific programs');
      expect(signals.counterfactuals).toContain('Add team size to unlock size-specific programs');
    });

    it('should handle missing R&D location gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: ['INNOVATION_DIGITAL']
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.unknowns).toContain('q6_rnd_in_at');
      expect(signals.counterfactuals).toContain('Specify R&D location to unlock location-specific programs');
    });

    it('should handle missing TRL gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: ['INNOVATION_DIGITAL']
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.unknowns).toContain('q5_maturity_trl');
      expect(signals.counterfactuals).toContain('Add technology readiness level to unlock TRL-specific programs');
      expect(signals.trlBucket).toBe('low'); // Default value
    });

    it('should handle null and undefined values gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: null,
        q3_company_size: undefined,
        q4_theme: null,
        q5_maturity_trl: undefined,
        q6_rnd_in_at: null
      };
      
      const signals = deriveSignals(answers);
      
      // Should not crash
      expect(signals).toBeDefined();
      expect(signals.unknowns.length).toBeGreaterThan(0);
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
    });

    it('should handle empty arrays gracefully', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: [],
        q8_funding_types: []
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.unknowns).toContain('q4_theme');
      expect(signals.sectorBucket).toBe('general');
    });

    it('should derive appropriate flags even with missing data', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: ['HEALTH_LIFE_SCIENCE'],
        q10_env_benefit: 'HIGH'
      };
      
      const signals = deriveSignals(answers);
      
      // Should derive flags from available data
      expect(signals.regulatoryFlag).toBe(true); // HEALTH_LIFE_SCIENCE
      expect(signals.socialImpactFlag).toBe(true); // HEALTH_LIFE_SCIENCE + env_benefit
      expect(signals.esgFlag).toBe(true); // env_benefit HIGH
      expect(signals.ipFlag).toBe(true); // HEALTH_LIFE_SCIENCE
      
      // Should still have unknowns
      expect(signals.unknowns.length).toBeGreaterThan(0);
    });

    it('should generate meaningful counterfactuals for missing variables', () => {
      const answers: UserAnswers = {
        q1_country: 'AT'
        // Missing most other fields
      };
      
      const signals = deriveSignals(answers);
      
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
      
      // Check for specific counterfactual patterns
      const hasThemeCounterfactual = signals.counterfactuals.some(c => 
        c.includes('theme') || c.includes('project focus')
      );
      expect(hasThemeCounterfactual).toBe(true);
      
      const hasStageCounterfactual = signals.counterfactuals.some(c => 
        c.includes('stage') || c.includes('company')
      );
      expect(hasStageCounterfactual).toBe(true);
    });

    it('should maintain funding mode logic even with missing data', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: ['INNOVATION_DIGITAL']
        // Missing other fields
      };
      
      const signals = deriveSignals(answers);
      
      // Should still derive funding mode
      expect(signals.fundingMode).toBeDefined();
      expect(['grant', 'equity', 'loan', 'mixed']).toContain(signals.fundingMode);
      
      // Should have unknowns but still function
      expect(signals.unknowns.length).toBeGreaterThan(0);
    });

    it('should handle mixed missing and present data correctly', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INC_GT_36M',
        q3_company_size: 'SMALL_10_49',
        q4_theme: ['SUSTAINABILITY', 'ENERGY'],
        q10_env_benefit: 'HIGH'
        // Missing: q5_maturity_trl, q6_rnd_in_at, q7_collaboration, q8_funding_types, q9_team_diversity
      };
      
      const signals = deriveSignals(answers);
      
      // Should derive what it can
      expect(signals.sectorBucket).toBe('sustainability');
      expect(signals.companyAgeBucket).toBe('3y+');
      expect(signals.esgFlag).toBe(true);
      expect(signals.socialImpactFlag).toBe(true);
      
      // Should track unknowns
      expect(signals.unknowns).toContain('q5_maturity_trl');
      expect(signals.unknowns).toContain('q6_rnd_in_at');
      expect(signals.unknowns.length).toBeGreaterThanOrEqual(5);
      
      // Should generate counterfactuals
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
    });

    it('should not crash with malformed data', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INVALID_STAGE',
        q3_company_size: 123, // Wrong type
        q4_theme: 'NOT_AN_ARRAY', // Wrong type
        q5_maturity_trl: {},
        q6_rnd_in_at: []
      };
      
      const signals = deriveSignals(answers);
      
      // Should not crash
      expect(signals).toBeDefined();
      expect(signals.unknowns).toBeDefined();
      expect(signals.counterfactuals).toBeDefined();
      
      // Should have defaults
      expect(signals.fundingMode).toBe('grant');
      expect(signals.companyAgeBucket).toBe('pre');
    });
  });

  describe('Eligibility Trace with unknowns', () => {
    it('should include unknowns in eligibility trace warnings', () => {
      const answers: UserAnswers = {
        q1_country: 'AT'
        // Missing other fields
      };
      
      const signals = deriveSignals(answers);
      
      // Should have unknowns
      expect(signals.unknowns.length).toBeGreaterThan(0);
      
      // Each unknown should have a description
      signals.unknowns.forEach(unknown => {
        expect(unknown).toMatch(/^q\d+_/);
      });
    });

    it('should generate counterfactuals for each unknown', () => {
      const answers: UserAnswers = {
        q1_country: 'AT'
        // Missing other fields
      };
      
      const signals = deriveSignals(answers);
      
      // Should have counterfactuals
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
      
      // Counterfactuals should be actionable
      signals.counterfactuals.forEach(counterfactual => {
        expect(counterfactual).toContain('Add');
        expect(counterfactual.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      const signals = deriveSignals({});
      
      expect(signals).toBeDefined();
      expect(signals.unknowns.length).toBeGreaterThan(0);
      expect(signals.counterfactuals.length).toBeGreaterThan(0);
    });

    it('should handle null input', () => {
      const signals = deriveSignals(null as any);
      
      expect(signals).toBeDefined();
      expect(signals.unknowns).toBeDefined();
      expect(signals.counterfactuals).toBeDefined();
    });

    it('should handle undefined input', () => {
      const signals = deriveSignals(undefined as any);
      
      expect(signals).toBeDefined();
      expect(signals.unknowns).toBeDefined();
      expect(signals.counterfactuals).toBeDefined();
    });
  });
});
