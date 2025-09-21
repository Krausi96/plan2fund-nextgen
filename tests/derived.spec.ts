import { deriveSignals } from '../src/lib/enhancedRecoEngine';
import { UserAnswers } from '../src/types';

describe('Derived Signals', () => {
  describe('deriveSignals', () => {
    it('should derive equity funding mode for early stage companies', () => {
      const answers: UserAnswers = {
        q2_entity_stage: 'PRE_COMPANY',
        q3_company_size: 'MICRO_0_9',
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const signals = deriveSignals(answers);
      
      expect(signals.fundingMode).toBe('equity');
      expect(signals.equityOk).toBe(true);
      expect(signals.companyAgeBucket).toBe('pre');
    });

    it('should derive loan funding mode for established companies with collateral', () => {
      const answers: UserAnswers = {
        q2_entity_stage: 'INC_GT_36M',
        q3_company_size: 'MEDIUM_50_249',
        q4_theme: ['MANUFACTURING']
      };

      const signals = deriveSignals(answers);
      
      expect(signals.fundingMode).toBe('loan');
      expect(signals.collateralOk).toBe(true);
      expect(signals.companyAgeBucket).toBe('3y+');
    });

    it('should derive grant funding mode for CAPEX projects with R&D in Austria', () => {
      const answers: UserAnswers = {
        q2_entity_stage: 'INC_6_36M',
        q3_company_size: 'SMALL_10_49',
        q4_theme: ['INNOVATION_DIGITAL', 'MANUFACTURING'],
        q6_rnd_in_at: 'YES'
      };

      const signals = deriveSignals(answers);
      
      expect(signals.fundingMode).toBe('grant');
      expect(signals.capexFlag).toBe(true);
      expect(signals.rdInAT).toBe(true);
    });

    it('should derive urgency buckets correctly', () => {
      const urgentAnswers: UserAnswers = {
        q2_entity_stage: 'PRE_COMPANY',
        q5_maturity_trl: 'TRL_3_4'
      };

      const urgentSignals = deriveSignals(urgentAnswers);
      expect(urgentSignals.urgencyBucket).toBe('urgent');

      const soonAnswers: UserAnswers = {
        q2_entity_stage: 'INC_6_36M',
        q5_maturity_trl: 'TRL_5_6'
      };

      const soonSignals = deriveSignals(soonAnswers);
      expect(soonSignals.urgencyBucket).toBe('soon');

      const normalAnswers: UserAnswers = {
        q2_entity_stage: 'INC_GT_36M',
        q5_maturity_trl: 'TRL_7_8'
      };

      const normalSignals = deriveSignals(normalAnswers);
      expect(normalSignals.urgencyBucket).toBe('normal');
    });

    it('should derive sector buckets correctly', () => {
      const healthAnswers: UserAnswers = {
        q4_theme: ['HEALTH_LIFE_SCIENCE']
      };

      const healthSignals = deriveSignals(healthAnswers);
      expect(healthSignals.sectorBucket).toBe('health');

      const sustainabilityAnswers: UserAnswers = {
        q4_theme: ['SUSTAINABILITY', 'ENERGY']
      };

      const sustainabilitySignals = deriveSignals(sustainabilityAnswers);
      expect(sustainabilitySignals.sectorBucket).toBe('sustainability');

      const techAnswers: UserAnswers = {
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const techSignals = deriveSignals(techAnswers);
      expect(techSignals.sectorBucket).toBe('tech');
    });

    it('should calculate fit scores', () => {
      const answers: UserAnswers = {
        q2_entity_stage: 'INC_6_36M',
        q3_company_size: 'SMALL_10_49',
        q4_theme: ['INNOVATION_DIGITAL']
      };

      const signals = deriveSignals(answers);
      
      expect(signals.amountFit).toBeGreaterThan(0);
      expect(signals.stageFit).toBeGreaterThan(0);
      expect(signals.timelineFit).toBeGreaterThan(0);
      expect(signals.amountFit).toBeLessThanOrEqual(100);
      expect(signals.stageFit).toBeLessThanOrEqual(100);
      expect(signals.timelineFit).toBeLessThanOrEqual(100);
    });

    it('should handle missing answers gracefully', () => {
      const emptyAnswers: UserAnswers = {};

      const signals = deriveSignals(emptyAnswers);
      
      expect(signals.fundingMode).toBe('grant'); // default
      expect(signals.companyAgeBucket).toBe('pre'); // default
      expect(signals.sectorBucket).toBe('general'); // default
      expect(signals.urgencyBucket).toBe('normal'); // default
    });
  });
});
