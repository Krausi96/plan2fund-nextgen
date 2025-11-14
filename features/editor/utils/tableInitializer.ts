// ========= PLAN2FUND — TABLE INITIALIZER =========
// Initialize default table structures based on section category

import { Table, PlanSection } from '@/shared/types/plan';
import { SectionTemplate } from '@/shared/templates/types';

/**
 * Create default revenue table structure
 */
function createDefaultRevenueTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Product Sales', values: [0, 0, 0, 0, 0] },
      { label: 'Service Revenue', values: [0, 0, 0, 0, 0] },
      { label: 'Other Revenue', values: [0, 0, 0, 0, 0] },
      { label: 'Total Revenue', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default costs table structure
 */
function createDefaultCostsTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Personnel', values: [0, 0, 0, 0, 0] },
      { label: 'Marketing', values: [0, 0, 0, 0, 0] },
      { label: 'Operations', values: [0, 0, 0, 0, 0] },
      { label: 'R&D', values: [0, 0, 0, 0, 0] },
      { label: 'Other Costs', values: [0, 0, 0, 0, 0] },
      { label: 'Total Costs', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default cash flow table structure
 */
function createDefaultCashflowTable(): Table {
  return {
    columns: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    rows: [
      { label: 'Operating Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Investing Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Financing Cash Flow', values: [0, 0, 0, 0, 0] },
      { label: 'Net Cash Flow', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Create default use of funds table structure
 */
function createDefaultUseOfFundsTable(): Table {
  return {
    columns: ['Category', 'Amount', 'Percentage'],
    rows: [
      { label: 'Product Development', values: [0, 0, 0] },
      { label: 'Marketing', values: [0, 0, 0] },
      { label: 'Operations', values: [0, 0, 0] },
      { label: 'Personnel', values: [0, 0, 0] },
      { label: 'Other', values: [0, 0, 0] },
      { label: 'Total', values: [0, 0, 0] }
    ]
  };
}

/**
 * Create default competitor analysis table
 */
function createDefaultCompetitorTable(): Table {
  return {
    columns: ['Feature 1', 'Feature 2', 'Feature 3', 'Price', 'Market Share %'],
    rows: [
      { label: 'Competitor A', values: ['Yes', 'No', 'Yes', 99, 25] },
      { label: 'Competitor B', values: ['Yes', 'Yes', 'No', 149, 15] },
      { label: 'Our Product', values: ['Yes', 'Yes', 'Yes', 129, 5] }
    ]
  };
}

/**
 * Create default risk matrix table
 */
function createDefaultRiskTable(): Table {
  return {
    columns: ['Risk', 'Probability', 'Impact', 'Mitigation', 'Owner'],
    rows: [
      { label: 'Market Risk', values: ['Market Risk', 'High', 'High', 'Diversify', 'CEO'] },
      { label: 'Technical Risk', values: ['Technical Risk', 'Medium', 'High', 'Backup plan', 'CTO'] },
      { label: 'Financial Risk', values: ['Financial Risk', 'Low', 'Medium', 'Reserve fund', 'CFO'] },
      { label: 'Operational Risk', values: ['Operational Risk', 'Medium', 'Medium', 'Process improvement', 'COO'] }
    ]
  };
}

/**
 * Create default team skills matrix table
 */
function createDefaultTeamTable(): Table {
  return {
    columns: ['Name', 'Role', 'Experience (years)', 'Key Skills', 'Education'],
    rows: [
      { label: 'Team Member 1', values: ['John Doe', 'CEO', 10, 'Business, Strategy', 'MBA'] },
      { label: 'Team Member 2', values: ['Jane Smith', 'CTO', 8, 'Tech, Development', 'MSc'] },
      { label: 'Team Member 3', values: ['Bob Johnson', 'CFO', 12, 'Finance, Accounting', 'CPA'] }
    ]
  };
}

/**
 * Create default timeline table
 */
function createDefaultTimelineTable(): Table {
  return {
    columns: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'],
    rows: [
      { label: 'Product Development', values: [0, 0, 0, 0, 0] },
      { label: 'Market Launch', values: [0, 0, 0, 0, 0] },
      { label: 'Fundraising', values: [0, 0, 0, 0, 0] },
      { label: 'Team Building', values: [0, 0, 0, 0, 0] }
    ]
  };
}

/**
 * Initialize tables for a section based on formatRequirements first, then category
 * Priority: formatRequirements > category
 */
export function initializeTablesForSection(template: SectionTemplate): PlanSection['tables'] {
  const formatReqs = template.validationRules?.formatRequirements || [];
  const category = template.category?.toLowerCase() || '';
  const tables: PlanSection['tables'] = {};
  
  // Check formatRequirements first (highest priority)
  if (formatReqs.some(req => req.includes('financial_tables') || req.includes('tabular_budget') || req.includes('clean_financial_tables'))) {
    tables.revenue = createDefaultRevenueTable();
    tables.costs = createDefaultCostsTable();
    tables.cashflow = createDefaultCashflowTable();
    if (formatReqs.some(req => req.includes('use_of_funds') || req.includes('fund_allocation'))) {
      tables.useOfFunds = createDefaultUseOfFundsTable();
    }
  }
  
  if (formatReqs.some(req => req.includes('risk_matrix') || req.includes('structured_risk_section'))) {
    tables.risks = createDefaultRiskTable();
  }
  
  if (formatReqs.some(req => req.includes('competitive_matrix') || req.includes('competitive_positioning'))) {
    tables.competitors = createDefaultCompetitorTable();
  }
  
  if (formatReqs.some(req => req.includes('gantt_chart_or_table') || req.includes('project_schedule'))) {
    tables.timeline = createDefaultTimelineTable();
  }
  
  if (formatReqs.some(req => req.includes('team') || req.includes('team_members'))) {
    tables.team = createDefaultTeamTable();
  }
  
  if (formatReqs.some(req => req.includes('ratio_tables') || req.includes('financial_ratios'))) {
    // Could add ratios table here if needed
  }
  
  // Fallback to category-based initialization if no formatRequirements matched
  if (Object.keys(tables).length === 0) {
    switch (category) {
      case 'financial':
        return {
          revenue: createDefaultRevenueTable(),
          costs: createDefaultCostsTable(),
          cashflow: createDefaultCashflowTable(),
          useOfFunds: createDefaultUseOfFundsTable()
        };
      
      case 'market':
        return {
          competitors: createDefaultCompetitorTable()
        };
      
      case 'risk':
        return {
          risks: createDefaultRiskTable()
        };
      
      case 'team':
        return {
          team: createDefaultTeamTable()
        };
      
      case 'project':
        return {
          timeline: createDefaultTimelineTable()
        };
      
      default:
        return undefined;
    }
  }
  
  return tables;
}

/**
 * Check if section needs tables based on template
 */
export function sectionNeedsTables(template: SectionTemplate): boolean {
  const category = template.category?.toLowerCase() || '';
  const needsTables = ['financial', 'market', 'risk', 'team', 'project'].includes(category);
  
  // Also check formatRequirements
  const formatNeeds = template.validationRules?.formatRequirements?.some(req => 
    req.includes('table') || req.includes('matrix') || req.includes('chart')
  );
  
  return needsTables || !!formatNeeds;
}

/**
 * Check if section needs charts based on template
 */
export function sectionNeedsCharts(template: SectionTemplate): boolean {
  const category = template.category?.toLowerCase() || '';
  
  if (category === 'financial') return true;
  if (category === 'market') return true;
  
  // Check formatRequirements
  const formatNeeds = template.validationRules?.formatRequirements?.some(req => 
    req.includes('chart') || req.includes('graph') || req.includes('visualisation')
  );
  
  return !!formatNeeds;
}

