// ========= PLAN2FUND — READINESS TYPES =========
// Readiness check and evaluation types

export type ReadinessReport = { 
  score: number, 
  dimensions: Array<{ 
    key: string, 
    status: 'aligned'|'needs_fix'|'missing', 
    notes?: string 
  }> 
};
