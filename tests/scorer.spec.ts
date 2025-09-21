import { scoreProgramsEnhanced, generateEligibilityTrace } from '../src/lib/enhancedRecoEngine';
import { UserAnswers } from '../src/types';

// Mock program data for testing
const mockProgram = {
  id: 'test-program',
  name: 'Test Grant Program',
  type: 'grant',
  requirements: {
    q1_country: ['AT'],
    q2_entity_stage: ['INC_6_36M', 'INC_GT_36M'],
    q4_theme: ['INNOVATION_DIGITAL'],
    q6_rnd_in_at: ['YES']
  }
};

describe('Enhanced Scorer', () => {
  describe('scoreProgramsEnhanced', () => {
    it('should score programs with derived signals', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INC_6_36M',
        q3_company_size: 'SMALL_10_49',
        q4_theme: ['INNOVATION_DIGITAL'],
        q5_maturity_trl: 'TRL_5_6',
        q6_rnd_in_at: 'YES'
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Check that each result has the required properties
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('eligibility');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('matchedCriteria');
        expect(result).toHaveProperty('gaps');
        expect(result).toHaveProperty('trace');
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });
    });

    it('should generate eligibility traces', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INC_6_36M',
        q4_theme: ['INNOVATION_DIGITAL'],
        q6_rnd_in_at: 'YES'
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      results.forEach(result => {
        if (result.trace) {
          expect(result.trace).toHaveProperty('passed');
          expect(result.trace).toHaveProperty('failed');
          expect(result.trace).toHaveProperty('warnings');
          expect(result.trace).toHaveProperty('counterfactuals');
          expect(Array.isArray(result.trace.passed)).toBe(true);
          expect(Array.isArray(result.trace.failed)).toBe(true);
          expect(Array.isArray(result.trace.warnings)).toBe(true);
          expect(Array.isArray(result.trace.counterfactuals)).toBe(true);
        }
      });
    });

    it('should handle strict mode correctly', () => {
      const answers: UserAnswers = {
        q1_country: 'NON_EU', // This should fail AT requirements
        q2_entity_stage: 'INC_6_36M',
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      // In strict mode, programs with failed requirements should be marked as not eligible
      const ineligibleResults = results.filter(r => r.eligibility === 'Not Eligible');
      expect(ineligibleResults.length).toBeGreaterThan(0);
    });

    it('should handle explorer mode correctly', () => {
      const answers: UserAnswers = {
        q1_country: 'NON_EU', // This should fail AT requirements
        q2_entity_stage: 'INC_6_36M',
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const results = scoreProgramsEnhanced(answers, 'explorer');
      
      // In explorer mode, programs should still be scored even with failed requirements
      expect(results.length).toBeGreaterThan(0);
      results.forEach(result => {
        expect(typeof result.score).toBe('number');
      });
    });

    it('should generate founder-friendly reasons', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INC_6_36M',
        q4_theme: ['INNOVATION_DIGITAL'],
        q6_rnd_in_at: 'YES'
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      results.forEach(result => {
        if (result.founderFriendlyReasons) {
          expect(Array.isArray(result.founderFriendlyReasons)).toBe(true);
          expect(result.founderFriendlyReasons.length).toBeGreaterThan(0);
          result.founderFriendlyReasons.forEach(reason => {
            expect(typeof reason).toBe('string');
            expect(reason.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should generate founder-friendly risks', () => {
      const answers: UserAnswers = {
        q1_country: 'NON_EU',
        q2_entity_stage: 'PRE_COMPANY',
        q4_theme: ['OTHER']
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      results.forEach(result => {
        if (result.founderFriendlyRisks) {
          expect(Array.isArray(result.founderFriendlyRisks)).toBe(true);
          result.founderFriendlyRisks.forEach(risk => {
            expect(typeof risk).toBe('string');
            expect(risk.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should sort results by score descending', () => {
      const answers: UserAnswers = {
        q1_country: 'AT',
        q2_entity_stage: 'INC_6_36M',
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const results = scoreProgramsEnhanced(answers, 'strict');
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('generateEligibilityTrace', () => {
    it('should generate trace with passed criteria', () => {
      const matchedCriteria = [
        { key: 'q1_country', value: 'AT', reason: 'Country matches requirement', status: 'passed' as const },
        { key: 'q2_entity_stage', value: 'INC_6_36M', reason: 'Stage matches requirement', status: 'passed' as const }
      ];
      const gaps: any[] = [];
      const derivedSignals = {
        fundingMode: 'grant',
        companyAgeBucket: '0-3y' as const,
        sectorBucket: 'tech',
        urgencyBucket: 'normal' as const,
        capexFlag: true,
        equityOk: false,
        collateralOk: false,
        rdInAT: true,
        amountFit: 80,
        stageFit: 85,
        timelineFit: 75
      };

      const trace = generateEligibilityTrace(mockProgram as any, matchedCriteria, gaps, derivedSignals);
      
      expect(trace.passed).toHaveLength(2);
      expect(trace.passed).toContain('Country matches requirement');
      expect(trace.passed).toContain('Stage matches requirement');
      expect(trace.failed).toHaveLength(0);
      expect(trace.warnings).toHaveLength(0);
      expect(Array.isArray(trace.counterfactuals)).toBe(true);
    });

    it('should generate trace with failed criteria', () => {
      const matchedCriteria = [
        { key: 'q1_country', value: 'NON_EU', reason: 'Country does not match requirement', status: 'failed' as const }
      ];
      const gaps = [
        { key: 'q1_country', description: 'Country mismatch', action: 'Consider relocating to Austria', priority: 'high' as const }
      ];
      const derivedSignals = {
        fundingMode: 'grant',
        companyAgeBucket: '0-3y' as const,
        sectorBucket: 'tech',
        urgencyBucket: 'normal' as const,
        capexFlag: true,
        equityOk: false,
        collateralOk: false,
        rdInAT: false,
        amountFit: 60,
        stageFit: 70,
        timelineFit: 65
      };

      const trace = generateEligibilityTrace(mockProgram as any, matchedCriteria, gaps, derivedSignals);
      
      expect(trace.failed).toHaveLength(1);
      expect(trace.failed).toContain('Country does not match requirement');
      expect(trace.counterfactuals).toContain('Consider relocating to Austria');
    });

    it('should generate funding mode counterfactuals', () => {
      const matchedCriteria: any[] = [];
      const gaps: any[] = [];
      const derivedSignals = {
        fundingMode: 'equity',
        companyAgeBucket: 'pre' as const,
        sectorBucket: 'tech',
        urgencyBucket: 'urgent' as const,
        capexFlag: false,
        equityOk: true,
        collateralOk: false,
        rdInAT: false,
        amountFit: 70,
        stageFit: 80,
        timelineFit: 90
      };

      const trace = generateEligibilityTrace({ ...mockProgram, type: 'grant' } as any, matchedCriteria, gaps, derivedSignals);
      
      expect(trace.counterfactuals).toContain('Consider equity funding programs instead');
    });

    it('should limit counterfactuals to 5 items', () => {
      const matchedCriteria: any[] = [];
      const gaps = Array.from({ length: 10 }, (_, i) => ({
        key: `q${i}`,
        description: `Gap ${i}`,
        action: `Action ${i}`,
        priority: 'high' as const
      }));
      const derivedSignals = {
        fundingMode: 'grant',
        companyAgeBucket: '0-3y' as const,
        sectorBucket: 'tech',
        urgencyBucket: 'normal' as const,
        capexFlag: true,
        equityOk: false,
        collateralOk: false,
        rdInAT: true,
        amountFit: 80,
        stageFit: 85,
        timelineFit: 75
      };

      const trace = generateEligibilityTrace(mockProgram as any, matchedCriteria, gaps, derivedSignals);
      
      expect(trace.counterfactuals.length).toBeLessThanOrEqual(5);
    });
  });
});
