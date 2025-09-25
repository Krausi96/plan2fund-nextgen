/**
 * Financial Dashboard Component
 * Comprehensive financial projections and KPIs
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target,
  BarChart3,
  PieChart,
  Calculator,
  Download,
  Edit3
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FinancialCalculator, 
  FinancialProjection, 
  KPIMetrics, 
  FinancialAssumptions,
  createFinancialCalculator 
} from '@/lib/financialCalculator';

interface FinancialDashboardProps {
  businessType?: string;
  initialAssumptions?: Partial<FinancialAssumptions>;
  onAssumptionsChange?: (assumptions: FinancialAssumptions) => void;
  onExport?: (data: any) => void;
}

export default function FinancialDashboard({ 
  businessType = 'saas',
  initialAssumptions = {},
  onAssumptionsChange,
  onExport
}: FinancialDashboardProps) {
  const [calculator, setCalculator] = useState<FinancialCalculator | null>(null);
  const [projections, setProjections] = useState<FinancialProjection[]>([]);
  const [kpis, setKpis] = useState<KPIMetrics | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [sensitivity, setSensitivity] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>({
    initialRevenue: 5000,
    monthlyGrowthRate: 15,
    initialExpenses: 8000,
    expenseGrowthRate: 5,
    grossMargin: 80,
    operatingMargin: 20,
    fundingAmount: 500000,
    timeline: 36,
    ...initialAssumptions
  });

  useEffect(() => {
    const calc = createFinancialCalculator(businessType, assumptions);
    setCalculator(calc);
    
    const proj = calc.generateProjections();
    setProjections(proj);
    
    const kpiMetrics = calc.calculateKPIs(proj);
    setKpis(kpiMetrics);
    
    const summaryData = calc.generateSummary(proj, kpiMetrics);
    setSummary(summaryData);
    
    const sensitivityData = calc.generateSensitivityAnalysis(proj);
    setSensitivity(sensitivityData);
    
    onAssumptionsChange?.(assumptions);
  }, [assumptions, businessType, onAssumptionsChange]);

  const handleAssumptionChange = (key: keyof FinancialAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!calculator || !kpis || !summary) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <Calculator className="h-6 w-6 animate-spin mr-2" />
            <span>Calculating financial projections...</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Dashboard</h2>
          <p className="text-sm text-gray-600">Comprehensive financial projections and KPIs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {isEditing ? 'Done' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.({ projections, kpis, summary, sensitivity })}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(kpis.revenue.monthly)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(kpis.revenue.growthRate)}
                  <span className={`text-sm ${getGrowthColor(kpis.revenue.growthRate)}`}>
                    {formatPercentage(kpis.revenue.growthRate)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Break-Even</p>
                <p className="text-2xl font-bold text-gray-900">
                  Month {kpis.profitability.breakEvenMonth}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    {kpis.profitability.breakEvenMonth <= 12 ? 'Fast' : 'Moderate'}
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(kpis.profitability.netMargin)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-600">
                    {kpis.profitability.netMargin > 20 ? 'Excellent' : 'Good'}
                  </span>
                </div>
              </div>
              <PieChart className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Runway</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis.funding.runway} months
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Progress value={kpis.funding.utilization} />
                  <span className="text-sm text-gray-600">
                    {formatPercentage(kpis.funding.utilization)} used
                  </span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content div */}
      <div defaultValue="projections" className="space-y-4">
        <div className="grid w-full grid-cols-4">
          <div className="px-4 py-2 text-center border-b-2 border-blue-500">Projections</div>      
          <div className="px-4 py-2 text-center border-b border-gray-200">Assumptions</div>      
          <div className="px-4 py-2 text-center border-b border-gray-200">Sensitivity</div>      
          <div className="px-4 py-2 text-center border-b border-gray-200">Insights</div>
        </div>

        {/* Projections Tab */}
        <div className="space-y-4">
          <Card>
            <div>
              <div>Financial Projections (36 Months)</div>
            </div>
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Expenses</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Cash Flow</th>
                      <th className="text-right p-2">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.slice(0, 12).map((proj, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{index + 1}</td>
                        <td className="text-right p-2 font-medium text-green-600">
                          {formatCurrency(proj.revenue)}
                        </td>
                        <td className="text-right p-2 text-red-600">
                          {formatCurrency(proj.expenses)}
                        </td>
                        <td className={`text-right p-2 font-medium ${
                          proj.profit > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(proj.profit)}
                        </td>
                        <td className={`text-right p-2 ${
                          proj.cashFlow > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(proj.cashFlow)}
                        </td>
                        <td className={`text-right p-2 font-medium ${
                          proj.cumulativeCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(proj.cumulativeCashFlow)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Assumptions Tab */}
        <div className="space-y-4">
          <Card>
            <div>
              <div>Financial Assumptions</div>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Monthly Revenue
                    </label>
                    <input
                      type="number"
                      value={assumptions.initialRevenue}
                      onChange={(e) => handleAssumptionChange('initialRevenue', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Growth Rate (%)
                    </label>
                    <input
                      type="number"
                      value={assumptions.monthlyGrowthRate}
                      onChange={(e) => handleAssumptionChange('monthlyGrowthRate', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Monthly Expenses
                    </label>
                    <input
                      type="number"
                      value={assumptions.initialExpenses}
                      onChange={(e) => handleAssumptionChange('initialExpenses', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expense Growth Rate (%)
                    </label>
                    <input
                      type="number"
                      value={assumptions.expenseGrowthRate}
                      onChange={(e) => handleAssumptionChange('expenseGrowthRate', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gross Margin (%)
                    </label>
                    <input
                      type="number"
                      value={assumptions.grossMargin}
                      onChange={(e) => handleAssumptionChange('grossMargin', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funding Amount
                    </label>
                    <input
                      type="number"
                      value={assumptions.fundingAmount}
                      onChange={(e) => handleAssumptionChange('fundingAmount', Number(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sensitivity Tab */}
        <div className="space-y-4">
          <Card>
            <div>
              <div>Sensitivity Analysis</div>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Optimistic Scenario</h3>
                  <p className="text-sm text-green-700 mb-2">20% higher growth, 10% lower expenses</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Break-even:</span> Month {sensitivity?.optimistic.find((p: any) => p.cumulativeCashFlow >= 0)?.year || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Year 3 Revenue:</span> {formatCurrency(sensitivity?.optimistic[35]?.revenue || 0)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Realistic Scenario</h3>
                  <p className="text-sm text-blue-700 mb-2">Base assumptions</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Break-even:</span> Month {kpis.profitability.breakEvenMonth}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Year 3 Revenue:</span> {formatCurrency(projections[35]?.revenue || 0)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Pessimistic Scenario</h3>
                  <p className="text-sm text-red-700 mb-2">20% lower growth, 10% higher expenses</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Break-even:</span> Month {sensitivity?.pessimistic.find((p: any) => p.cumulativeCashFlow >= 0)?.year || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Year 3 Revenue:</span> {formatCurrency(sensitivity?.pessimistic[35]?.revenue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Insights Tab */}
        <div className="space-y-4">
          <Card>
            <div>
              <div>Key Insights & Recommendations</div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Financial Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Revenue (3Y)</p>
                      <p className="font-semibold">{formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Expenses (3Y)</p>
                      <p className="font-semibold">{formatCurrency(summary.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Profit (3Y)</p>
                      <p className="font-semibold text-green-600">{formatCurrency(summary.netProfit)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Peak Cash Flow</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(summary.peakCashFlow)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Insights</h3>
                  <ul className="space-y-2">
                    {summary.keyInsights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
