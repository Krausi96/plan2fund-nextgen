// ========= PLAN2FUND — READINESS ENGINE =========
// Evaluates plan completeness and alignment with program requirements

import { PlanDocument } from '../../types/plan';
import { ProgramProfile } from '../../types/reco';
import { ReadinessReport } from '../../types/readiness';

export function evaluate(plan: PlanDocument, profile?: ProgramProfile): ReadinessReport {
  const dimensions = [
    evaluateContentCompleteness(plan),
    evaluateRequiredSections(plan, profile),
    evaluateFinancialTables(plan, profile),
    evaluateUnitEconomics(plan),
    evaluateMilestones(plan),
    evaluateSources(plan),
    evaluateLanguageConsistency(plan),
    evaluateFormatting(plan)
  ];

  const score = Math.round(
    dimensions.reduce((sum, dim) => sum + (dim.status === 'aligned' ? 100 : dim.status === 'needs_fix' ? 50 : 0), 0) / dimensions.length
  );

  return {
    score,
    dimensions
  };
}

function evaluateContentCompleteness(plan: PlanDocument) {
  const totalSections = plan.sections.length;
  const completedSections = plan.sections.filter(s => 
    s.content && s.content.trim().length > 50
  ).length;
  
  const completionRate = totalSections > 0 ? completedSections / totalSections : 0;
  
  let status: 'aligned'|'needs_fix'|'missing';
  let notes: string | undefined;
  
  if (completionRate >= 0.8) {
    status = 'aligned';
    notes = `${Math.round(completionRate * 100)}% of sections completed`;
  } else if (completionRate >= 0.5) {
    status = 'needs_fix';
    notes = `${Math.round(completionRate * 100)}% of sections completed - add more content`;
  } else {
    status = 'missing';
    notes = `${Math.round(completionRate * 100)}% of sections completed - major content gaps`;
  }
  
  return {
    key: 'content_completeness',
    status,
    notes
  };
}

function evaluateRequiredSections(plan: PlanDocument, profile?: ProgramProfile) {
  if (!profile?.required?.sections) {
    return {
      key: 'required_sections',
      status: 'aligned' as const,
      notes: 'No specific section requirements'
    };
  }
  
  const requiredSections = profile.required.sections;
  const missingSections = requiredSections.filter(req => 
    !plan.sections.some(section => section.key === req.key)
  );
  
  if (missingSections.length === 0) {
    return {
      key: 'required_sections',
      status: 'aligned' as const,
      notes: 'All required sections present'
    };
  } else {
    return {
      key: 'required_sections',
      status: 'missing' as const,
      notes: `Missing sections: ${missingSections.map(s => s.key).join(', ')}`
    };
  }
}

function evaluateFinancialTables(plan: PlanDocument, profile?: ProgramProfile) {
  const requiredTables = profile?.required?.tables || ['revenue', 'costs', 'cashflow', 'useOfFunds'];
  const presentTables = plan.sections
    .filter(s => s.tables)
    .flatMap(s => Object.keys(s.tables || {}))
    .filter((table, index, arr) => arr.indexOf(table) === index); // unique
  
  const missingTables = requiredTables.filter(table => !presentTables.includes(table));
  
  if (missingTables.length === 0) {
    return {
      key: 'financial_tables',
      status: 'aligned' as const,
      notes: 'All required financial tables present'
    };
  } else {
    return {
      key: 'financial_tables',
      status: 'missing' as const,
      notes: `Missing tables: ${missingTables.join(', ')}`
    };
  }
}

function evaluateUnitEconomics(plan: PlanDocument) {
  const unitEcon = plan.unitEconomics;
  
  if (!unitEcon) {
    return {
      key: 'unit_economics',
      status: 'missing' as const,
      notes: 'Unit economics not defined'
    };
  }
  
  const hasRequired = unitEcon.price && unitEcon.unitCost && unitEcon.contributionMargin;
  
  if (hasRequired) {
    return {
      key: 'unit_economics',
      status: 'aligned' as const,
      notes: 'Unit economics complete'
    };
  } else {
    return {
      key: 'unit_economics',
      status: 'needs_fix' as const,
      notes: 'Unit economics incomplete - missing key metrics'
    };
  }
}

function evaluateMilestones(plan: PlanDocument) {
  const milestones = plan.milestones;
  
  if (!milestones || milestones.length === 0) {
    return {
      key: 'milestones',
      status: 'missing' as const,
      notes: 'No milestones defined'
    };
  }
  
  const hasDates = milestones.filter(m => m.date).length;
  const hasMetrics = milestones.filter(m => m.metric).length;
  
  if (hasDates >= milestones.length * 0.7 && hasMetrics >= milestones.length * 0.5) {
    return {
      key: 'milestones',
      status: 'aligned' as const,
      notes: 'Milestones well-defined with dates and metrics'
    };
  } else {
    return {
      key: 'milestones',
      status: 'needs_fix' as const,
      notes: 'Milestones need more dates and measurable outcomes'
    };
  }
}

function evaluateSources(plan: PlanDocument) {
  const sectionsWithSources = plan.sections.filter(s => s.sources && s.sources.length > 0);
  const totalSections = plan.sections.length;
  
  if (sectionsWithSources.length === 0) {
    return {
      key: 'sources',
      status: 'missing' as const,
      notes: 'No sources or references provided'
    };
  }
  
  const sourceRate = sectionsWithSources.length / totalSections;
  
  if (sourceRate >= 0.5) {
    return {
      key: 'sources',
      status: 'aligned' as const,
      notes: 'Good use of sources and references'
    };
  } else {
    return {
      key: 'sources',
      status: 'needs_fix' as const,
      notes: 'More sources and references needed'
    };
  }
}

function evaluateLanguageConsistency(plan: PlanDocument) {
  // Check if language is consistently set
  if (!plan.language) {
    return {
      key: 'language_consistency',
      status: 'missing' as const,
      notes: 'Language not specified'
    };
  }
  
  // Check if tone is set
  if (!plan.tone) {
    return {
      key: 'language_consistency',
      status: 'needs_fix' as const,
      notes: 'Tone not specified'
    };
  }
  
  return {
    key: 'language_consistency',
    status: 'aligned' as const,
    notes: `Language: ${plan.language}, Tone: ${plan.tone}`
  };
}

function evaluateFormatting(plan: PlanDocument) {
  const settings = plan.settings;
  
  if (!settings) {
    return {
      key: 'formatting',
      status: 'missing' as const,
      notes: 'Formatting settings not configured'
    };
  }
  
  const hasBasicFormatting = settings.includeTitlePage !== undefined && 
                           settings.includePageNumbers !== undefined &&
                           settings.citations !== undefined;
  
  if (hasBasicFormatting) {
    return {
      key: 'formatting',
      status: 'aligned' as const,
      notes: 'Formatting settings configured'
    };
  } else {
    return {
      key: 'formatting',
      status: 'needs_fix' as const,
      notes: 'Formatting settings incomplete'
    };
  }
}
