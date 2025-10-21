// ========= PLAN2FUND — ENHANCED FINANCIAL TABLES =========
// Financial tables widget with KPI cards for revenue, costs, cashflow, and use of funds

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, FigureRef } from '@/types/plan';
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, BarChart3 } from 'lucide-react';

interface FinancialTablesProps {
  tables: {
    revenue?: Table;
    costs?: Table;
    cashflow?: Table;
    useOfFunds?: Table;
  };
  onTablesChange: (tables: any) => void;
  onFiguresChange?: (figures: FigureRef[]) => void;
  graphSettings?: {
    revenueCosts?: boolean;
    cashflow?: boolean;
    useOfFunds?: boolean;
  };
  showKPICards?: boolean;
}

interface KPIMetrics {
  monthlyRevenue: number;
  breakEvenMonth: number;
  netMargin: number;
  runway: number;
  growthRate: number;
}

export default function FinancialTables({ 
  tables, 
  onTablesChange, 
  onFiguresChange, 
  graphSettings,
  showKPICards = true
}: FinancialTablesProps) {
  const [activeTable, setActiveTable] = useState<keyof typeof tables>('revenue');
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);

  // Calculate KPI metrics from tables
  useEffect(() => {
    if (tables.revenue && tables.costs) {
      calculateKPIMetrics();
    }
  }, [tables]);

  const calculateKPIMetrics = () => {
    if (!tables.revenue || !tables.costs) return;

    // Calculate monthly revenue (average of last 3 months)
    const revenueValues = tables.revenue.rows
      .flatMap(row => row.values)
      .filter(val => typeof val === 'number' && !isNaN(val));
    const monthlyRevenue = revenueValues.length > 0 
      ? revenueValues.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, revenueValues.length)
      : 0;

    // Calculate break-even month
    const costsValues = tables.costs.rows
      .flatMap(row => row.values)
      .filter(val => typeof val === 'number' && !isNaN(val));
    const monthlyCosts = costsValues.length > 0 
      ? costsValues.slice(-3).reduce((sum, val) => sum + val, 0) / Math.min(3, costsValues.length)
      : 0;

    const breakEvenMonth = monthlyCosts > 0 && monthlyRevenue > 0 
      ? Math.ceil(monthlyCosts / monthlyRevenue)
      : 0;

    // Calculate net margin
    const netMargin = monthlyRevenue > 0 
      ? ((monthlyRevenue - monthlyCosts) / monthlyRevenue) * 100
      : 0;

    // Calculate runway (simplified)
    const runway = monthlyCosts > 0 ? Math.floor(100000 / monthlyCosts) : 0;

    // Calculate growth rate (simplified)
    const growthRate = revenueValues.length > 1 
      ? ((revenueValues[revenueValues.length - 1] - revenueValues[0]) / revenueValues[0]) * 100
      : 0;

    setKpiMetrics({
      monthlyRevenue,
      breakEvenMonth,
      netMargin,
      runway,
      growthRate
    });
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

  // Generate figures when tables or graph settings change
  useEffect(() => {
    if (!onFiguresChange || !graphSettings) return;

    const figures: FigureRef[] = [];

    // Generate revenue & costs chart
    if (graphSettings.revenueCosts && tables.revenue && tables.costs) {
      figures.push({
        type: 'line',
        dataRef: 'revenue',
        caption: 'Revenue and Costs Projection',
        altText: 'Line chart showing revenue and costs over time'
      });
    }

    // Generate cashflow chart
    if (graphSettings.cashflow && tables.cashflow) {
      figures.push({
        type: 'bar',
        dataRef: 'cashflow',
        caption: 'Cash Flow Projection',
        altText: 'Bar chart showing cash flow by period'
      });
    }

    // Generate use of funds chart
    if (graphSettings.useOfFunds && tables.useOfFunds) {
      figures.push({
        type: 'donut',
        dataRef: 'useOfFunds',
        caption: 'Use of Funds Breakdown',
        altText: 'Donut chart showing fund allocation'
      });
    }

    onFiguresChange(figures);
  }, [tables, graphSettings, onFiguresChange]);

  const addRow = (tableType: keyof typeof tables) => {
    const table = tables[tableType];
    if (!table) return;

    const newRow = {
      label: 'New Item',
      values: new Array(table.columns.length).fill(0)
    };

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: [...table.rows, newRow]
      }
    });
  };

  const addPeriod = (tableType: keyof typeof tables) => {
    const table = tables[tableType];
    if (!table) return;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        columns: [...table.columns, `Period ${table.columns.length + 1}`],
        rows: table.rows.map(row => ({
          ...row,
          values: [...row.values, 0]
        }))
      }
    });
  };

  const updateCell = (tableType: keyof typeof tables, rowIndex: number, colIndex: number, value: number) => {
    const table = tables[tableType];
    if (!table) return;

    const newRows = [...table.rows];
    newRows[rowIndex].values[colIndex] = value;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: newRows
      }
    });
  };

  const updateRowLabel = (tableType: keyof typeof tables, rowIndex: number, label: string) => {
    const table = tables[tableType];
    if (!table) return;

    const newRows = [...table.rows];
    newRows[rowIndex].label = label;

    onTablesChange({
      ...tables,
      [tableType]: {
        ...table,
        rows: newRows
      }
    });
  };

  const renderTable = (tableType: keyof typeof tables, title: string) => {
    const table = tables[tableType];
    if (!table) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addRow(tableType)}
            >
              Add Row
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addPeriod(tableType)}
            >
              Add Period
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2 text-left">Item</th>
                {table.columns.map((col, index) => (
                  <th key={index} className="border border-gray-200 px-4 py-2 text-center">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-200 px-4 py-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRowLabel(tableType, rowIndex, e.target.value)}
                      className="w-full border-none outline-none bg-transparent"
                    />
                  </td>
                  {row.values.map((value, colIndex) => (
                    <td key={colIndex} className="border border-gray-200 px-4 py-2">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateCell(tableType, rowIndex, colIndex, parseFloat(e.target.value) || 0)}
                        className="w-full border-none outline-none bg-transparent text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {showKPICards && kpiMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(kpiMetrics.monthlyRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(kpiMetrics.growthRate)}
                    <span className={`text-sm ${getGrowthColor(kpiMetrics.growthRate)}`}>
                      {formatPercentage(kpiMetrics.growthRate)}
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
                    Month {kpiMetrics.breakEvenMonth}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      {kpiMetrics.breakEvenMonth <= 12 ? 'Fast' : 'Moderate'}
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
                    {formatPercentage(kpiMetrics.netMargin)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      {kpiMetrics.netMargin > 20 ? 'Excellent' : 'Good'}
                    </span>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Runway</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpiMetrics.runway} months
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Progress value={Math.min(100, (kpiMetrics.runway / 24) * 100)} />
                    <span className="text-sm text-gray-600">
                      {kpiMetrics.runway > 12 ? 'Healthy' : 'Short'}
                    </span>
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table Selector */}
      <div className="flex space-x-2 border-b">
        {Object.entries({
          revenue: 'Revenue',
          costs: 'Costs',
          cashflow: 'Cash Flow',
          useOfFunds: 'Use of Funds'
        }).map(([key, title]) => (
          <button
            key={key}
            onClick={() => setActiveTable(key as keyof typeof tables)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTable === key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {title}
          </button>
        ))}
      </div>

      {/* Active Table */}
      {renderTable(activeTable, {
        revenue: 'Revenue Model',
        costs: 'Cost Structure',
        cashflow: 'Cash Flow Projection',
        useOfFunds: 'Use of Funds'
      }[activeTable] || 'Financial Table')}
    </div>
  );
}

