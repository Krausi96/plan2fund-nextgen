/**
 * Financial Calculator Utility
 * Handles financial projections, KPIs, and calculations
 */

export interface FinancialProjection {
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  cumulativeCashFlow: number;
}

export interface KPIMetrics {
  revenue: {
    monthly: number;
    yearly: number;
    growthRate: number;
  };
  expenses: {
    monthly: number;
    yearly: number;
    growthRate: number;
  };
  profitability: {
    grossMargin: number;
    netMargin: number;
    breakEvenMonth: number;
  };
  cashFlow: {
    monthly: number;
    yearly: number;
    burnRate: number;
  };
  funding: {
    totalNeeded: number;
    runway: number;
    utilization: number;
  };
}

export interface FinancialAssumptions {
  initialRevenue: number;
  monthlyGrowthRate: number;
  initialExpenses: number;
  expenseGrowthRate: number;
  grossMargin: number;
  operatingMargin: number;
  fundingAmount: number;
  timeline: number; // months
}

export class FinancialCalculator {
  private assumptions: FinancialAssumptions;

  constructor(assumptions: FinancialAssumptions) {
    this.assumptions = assumptions;
  }

  /**
   * Generate financial projections for the specified timeline
   */
  generateProjections(timelineMonths: number = 36): FinancialProjection[] {
    const projections: FinancialProjection[] = [];
    let cumulativeCashFlow = this.assumptions.fundingAmount;

    for (let month = 1; month <= timelineMonths; month++) {
      const year = Math.ceil(month / 12);
      
      // Calculate revenue with compound growth
      const revenue = this.calculateRevenue(month);
      
      // Calculate expenses with growth
      const expenses = this.calculateExpenses(month);
      
      // Calculate profit
      const profit = revenue - expenses;
      
      // Calculate cash flow
      const cashFlow = profit;
      cumulativeCashFlow += cashFlow;
      
      projections.push({
        year,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        profit: Math.round(profit),
        cashFlow: Math.round(cashFlow),
        cumulativeCashFlow: Math.round(cumulativeCashFlow)
      });
    }

    return projections;
  }

  /**
   * Calculate revenue for a specific month
   */
  private calculateRevenue(month: number): number {
    const monthlyRate = this.assumptions.monthlyGrowthRate / 100;
    return this.assumptions.initialRevenue * Math.pow(1 + monthlyRate, month - 1);
  }

  /**
   * Calculate expenses for a specific month
   */
  private calculateExpenses(month: number): number {
    const monthlyRate = this.assumptions.expenseGrowthRate / 100;
    return this.assumptions.initialExpenses * Math.pow(1 + monthlyRate, month - 1);
  }

  /**
   * Calculate key performance indicators
   */
  calculateKPIs(projections: FinancialProjection[]): KPIMetrics {
    const latestProjection = projections[projections.length - 1];
    const monthlyProjections = projections.slice(-12); // Last 12 months
    
    // Revenue metrics
    const revenueGrowthRate = this.calculateGrowthRate(
      projections[0]?.revenue || 0,
      latestProjection.revenue
    );
    
    // Expense metrics
    const expenseGrowthRate = this.calculateGrowthRate(
      projections[0]?.expenses || 0,
      latestProjection.expenses
    );
    
    // Profitability metrics
    const grossMargin = this.assumptions.grossMargin;
    const netMargin = latestProjection.profit / latestProjection.revenue * 100;
    const breakEvenMonth = this.findBreakEvenMonth(projections);
    
    // Cash flow metrics
    const monthlyCashFlow = monthlyProjections.reduce((sum, p) => sum + p.cashFlow, 0) / 12;
    const burnRate = Math.abs(monthlyProjections.filter(p => p.cashFlow < 0).reduce((sum, p) => sum + p.cashFlow, 0) / 12);
    
    // Funding metrics
    const runway = this.calculateRunway(projections);
    const utilization = this.calculateUtilization(projections);

    return {
      revenue: {
        monthly: latestProjection.revenue,
        yearly: latestProjection.revenue * 12,
        growthRate: revenueGrowthRate
      },
      expenses: {
        monthly: latestProjection.expenses,
        yearly: latestProjection.expenses * 12,
        growthRate: expenseGrowthRate
      },
      profitability: {
        grossMargin,
        netMargin,
        breakEvenMonth
      },
      cashFlow: {
        monthly: monthlyCashFlow,
        yearly: latestProjection.cashFlow * 12,
        burnRate
      },
      funding: {
        totalNeeded: this.assumptions.fundingAmount,
        runway,
        utilization
      }
    };
  }

  /**
   * Calculate growth rate between two values
   */
  private calculateGrowthRate(initial: number, final: number): number {
    if (initial === 0) return 0;
    return ((final - initial) / initial) * 100;
  }

  /**
   * Find the month when the company breaks even
   */
  private findBreakEvenMonth(projections: FinancialProjection[]): number {
    for (let i = 0; i < projections.length; i++) {
      if (projections[i].cumulativeCashFlow >= 0) {
        return i + 1;
      }
    }
    return projections.length;
  }

  /**
   * Calculate runway in months
   */
  private calculateRunway(projections: FinancialProjection[]): number {
    const latestProjection = projections[projections.length - 1];
    if (latestProjection.cumulativeCashFlow >= 0) {
      return projections.length; // Already profitable
    }
    
    // Find when cash runs out
    for (let i = 0; i < projections.length; i++) {
      if (projections[i].cumulativeCashFlow <= 0) {
        return i;
      }
    }
    return projections.length;
  }

  /**
   * Calculate funding utilization percentage
   */
  private calculateUtilization(projections: FinancialProjection[]): number {
    const totalFunding = this.assumptions.fundingAmount;
    const usedFunding = Math.max(0, totalFunding - projections[projections.length - 1].cumulativeCashFlow);
    return Math.min(100, (usedFunding / totalFunding) * 100);
  }

  /**
   * Generate sensitivity analysis
   */
  generateSensitivityAnalysis(baseProjections: FinancialProjection[]): {
    optimistic: FinancialProjection[];
    realistic: FinancialProjection[];
    pessimistic: FinancialProjection[];
  } {
    // Optimistic scenario: 20% higher growth, 10% lower expenses
    const optimisticAssumptions = {
      ...this.assumptions,
      monthlyGrowthRate: this.assumptions.monthlyGrowthRate * 1.2,
      expenseGrowthRate: this.assumptions.expenseGrowthRate * 0.9
    };
    const optimisticCalc = new FinancialCalculator(optimisticAssumptions);
    const optimistic = optimisticCalc.generateProjections();

    // Realistic scenario: base assumptions
    const realistic = baseProjections;

    // Pessimistic scenario: 20% lower growth, 10% higher expenses
    const pessimisticAssumptions = {
      ...this.assumptions,
      monthlyGrowthRate: this.assumptions.monthlyGrowthRate * 0.8,
      expenseGrowthRate: this.assumptions.expenseGrowthRate * 1.1
    };
    const pessimisticCalc = new FinancialCalculator(pessimisticAssumptions);
    const pessimistic = pessimisticCalc.generateProjections();

    return { optimistic, realistic, pessimistic };
  }

  /**
   * Generate financial summary
   */
  generateSummary(projections: FinancialProjection[], kpis: KPIMetrics): {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    peakCashFlow: number;
    breakEvenMonth: number;
    keyInsights: string[];
  } {
    const totalRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
    const totalExpenses = projections.reduce((sum, p) => sum + p.expenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const peakCashFlow = Math.max(...projections.map(p => p.cumulativeCashFlow));
    const breakEvenMonth = kpis.profitability.breakEvenMonth;

    const insights = [];
    
    if (breakEvenMonth <= 12) {
      insights.push("Fast path to profitability - break-even within 12 months");
    } else if (breakEvenMonth <= 24) {
      insights.push("Moderate path to profitability - break-even within 24 months");
    } else {
      insights.push("Long-term path to profitability - break-even after 24 months");
    }

    if (kpis.revenue.growthRate > 20) {
      insights.push("High growth potential with strong revenue trajectory");
    } else if (kpis.revenue.growthRate > 10) {
      insights.push("Steady growth with consistent revenue increases");
    } else {
      insights.push("Conservative growth approach with stable revenue");
    }

    if (kpis.profitability.netMargin > 20) {
      insights.push("Excellent profitability with strong margins");
    } else if (kpis.profitability.netMargin > 10) {
      insights.push("Good profitability with healthy margins");
    } else if (kpis.profitability.netMargin > 0) {
      insights.push("Modest profitability with room for improvement");
    } else {
      insights.push("Focus needed on improving profitability");
    }

    return {
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      peakCashFlow: Math.round(peakCashFlow),
      breakEvenMonth,
      keyInsights: insights
    };
  }
}

/**
 * Default financial assumptions for different business types
 */
export const DEFAULT_ASSUMPTIONS: { [key: string]: Partial<FinancialAssumptions> } = {
  'saas': {
    initialRevenue: 5000,
    monthlyGrowthRate: 15,
    initialExpenses: 8000,
    expenseGrowthRate: 5,
    grossMargin: 80,
    operatingMargin: 20,
    fundingAmount: 500000,
    timeline: 36
  },
  'ecommerce': {
    initialRevenue: 10000,
    monthlyGrowthRate: 10,
    initialExpenses: 12000,
    expenseGrowthRate: 8,
    grossMargin: 40,
    operatingMargin: 10,
    fundingAmount: 300000,
    timeline: 36
  },
  'marketplace': {
    initialRevenue: 2000,
    monthlyGrowthRate: 25,
    initialExpenses: 15000,
    expenseGrowthRate: 10,
    grossMargin: 60,
    operatingMargin: 15,
    fundingAmount: 1000000,
    timeline: 36
  },
  'consulting': {
    initialRevenue: 15000,
    monthlyGrowthRate: 8,
    initialExpenses: 10000,
    expenseGrowthRate: 5,
    grossMargin: 70,
    operatingMargin: 25,
    fundingAmount: 200000,
    timeline: 24
  }
};

/**
 * Create financial calculator with default assumptions
 */
export function createFinancialCalculator(
  businessType: string = 'saas',
  customAssumptions: Partial<FinancialAssumptions> = {}
): FinancialCalculator {
  const defaults = DEFAULT_ASSUMPTIONS[businessType] || DEFAULT_ASSUMPTIONS['saas'];
  const assumptions = { ...defaults, ...customAssumptions } as FinancialAssumptions;
  return new FinancialCalculator(assumptions);
}
