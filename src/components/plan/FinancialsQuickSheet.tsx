import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type FinancialsQuickSheetProps = {
  onInsertSummary: (summary: string) => void;
};

type FinancialInputs = {
  price: number;
  volume: number;
  conversionRate: number;
  fixedCosts: number;
  variableCostsPercent: number;
  hiring: Array<{ role: string; grossPerMonth: number; months: number }>;
  capex: Array<{ item: string; cost: number; depreciationYears: number }>;
};

type MonthlyProjection = {
  month: number;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  personnelCosts: number;
  depreciation: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  cumulativeCash: number;
};

export default function FinancialsQuickSheet({ onInsertSummary }: FinancialsQuickSheetProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [inputs, setInputs] = useState<FinancialInputs>({
    price: 100,
    volume: 1000,
    conversionRate: 5,
    fixedCosts: 5000,
    variableCostsPercent: 30,
    hiring: [
      { role: "Developer", grossPerMonth: 5000, months: 12 },
      { role: "Sales", grossPerMonth: 4000, months: 6 }
    ],
    capex: [
      { item: "Equipment", cost: 10000, depreciationYears: 3 },
      { item: "Software", cost: 5000, depreciationYears: 2 }
    ]
  });

  const calculateProjections = (): MonthlyProjection[] => {
    const projections: MonthlyProjection[] = [];
    let cumulativeCash = 0;

    for (let month = 1; month <= 24; month++) {
      // Revenue calculation
      const monthlyVolume = inputs.volume * (1 + (month - 1) * 0.1); // 10% growth per month
      const revenue = monthlyVolume * (inputs.conversionRate / 100) * inputs.price;

      // Cost calculations
      const variableCosts = revenue * (inputs.variableCostsPercent / 100);
      const fixedCosts = inputs.fixedCosts;

      // Personnel costs
      const personnelCosts = inputs.hiring.reduce((total, hire) => {
        return total + (month <= hire.months ? hire.grossPerMonth : 0);
      }, 0);

      // Depreciation
      const depreciation = inputs.capex.reduce((total, item) => {
        const monthlyDepreciation = item.cost / (item.depreciationYears * 12);
        return total + (month <= item.depreciationYears * 12 ? monthlyDepreciation : 0);
      }, 0);

      const totalCosts = variableCosts + fixedCosts + personnelCosts + depreciation;
      const grossProfit = revenue - variableCosts;
      const netProfit = revenue - totalCosts;
      cumulativeCash += netProfit;

      projections.push({
        month,
        revenue,
        variableCosts,
        fixedCosts,
        personnelCosts,
        depreciation,
        totalCosts,
        grossProfit,
        netProfit,
        cumulativeCash
      });
    }

    return projections;
  };

  const updateInput = (field: keyof FinancialInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const updateHiring = (index: number, field: keyof FinancialInputs['hiring'][0], value: string | number) => {
    const newHiring = [...inputs.hiring];
    (newHiring[index] as any)[field] = value;
    setInputs(prev => ({ ...prev, hiring: newHiring }));
  };

  const addHiring = () => {
    setInputs(prev => ({
      ...prev,
      hiring: [...prev.hiring, { role: "", grossPerMonth: 0, months: 12 }]
    }));
  };

  const removeHiring = (index: number) => {
    setInputs(prev => ({
      ...prev,
      hiring: prev.hiring.filter((_, i) => i !== index)
    }));
  };

  const updateCapex = (index: number, field: keyof FinancialInputs['capex'][0], value: string | number) => {
    const newCapex = [...inputs.capex];
    (newCapex[index] as any)[field] = value;
    setInputs(prev => ({ ...prev, capex: newCapex }));
  };

  const addCapex = () => {
    setInputs(prev => ({
      ...prev,
      capex: [...prev.capex, { item: "", cost: 0, depreciationYears: 3 }]
    }));
  };

  const removeCapex = (index: number) => {
    setInputs(prev => ({
      ...prev,
      capex: prev.capex.filter((_, i) => i !== index)
    }));
  };

  const generateSummary = () => {
    const projections = calculateProjections();
    const year1 = projections.slice(0, 12);
    const year2 = projections.slice(12, 24);

    const year1Revenue = year1.reduce((sum, p) => sum + p.revenue, 0);
    const year1Costs = year1.reduce((sum, p) => sum + p.totalCosts, 0);
    const year1Profit = year1Revenue - year1Costs;

    const year2Revenue = year2.reduce((sum, p) => sum + p.revenue, 0);
    const year2Costs = year2.reduce((sum, p) => sum + p.totalCosts, 0);
    const year2Profit = year2Revenue - year2Costs;

    const breakEvenMonth = projections.find(p => p.cumulativeCash > 0)?.month || 24;

    const summary = `## Financial Projections Summary

### Key Metrics
- **Year 1 Revenue:** €${year1Revenue.toLocaleString()}
- **Year 1 Costs:** €${year1Costs.toLocaleString()}
- **Year 1 Profit:** €${year1Profit.toLocaleString()}
- **Year 2 Revenue:** €${year2Revenue.toLocaleString()}
- **Year 2 Costs:** €${year2Costs.toLocaleString()}
- **Year 2 Profit:** €${year2Profit.toLocaleString()}
- **Break-even:** Month ${breakEvenMonth}

### Revenue Model
- **Price per unit:** €${inputs.price}
- **Monthly volume:** ${inputs.volume} units
- **Conversion rate:** ${inputs.conversionRate}%
- **Growth rate:** 10% per month

### Cost Structure
- **Fixed costs:** €${inputs.fixedCosts.toLocaleString()}/month
- **Variable costs:** ${inputs.variableCostsPercent}% of revenue
- **Personnel:** €${inputs.hiring.reduce((sum, h) => sum + h.grossPerMonth, 0).toLocaleString()}/month
- **Depreciation:** €${inputs.capex.reduce((sum, c) => sum + c.cost / (c.depreciationYears * 12), 0).toFixed(0)}/month

### Funding Requirements
- **Initial investment needed:** €${Math.abs(projections[0].cumulativeCash).toLocaleString()}
- **Runway:** ${Math.floor(projections.find(p => p.cumulativeCash < 0)?.month || 24)} months`;

    onInsertSummary(summary);
    setShowSheet(false);
  };

  if (!showSheet) {
    return (
      <Button
        onClick={() => setShowSheet(true)}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        💰 Financials
      </Button>
    );
  }

  const projections = calculateProjections();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Financials QuickSheet</h3>
          <button
            onClick={() => setShowSheet(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close financials sheet"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">Revenue Model</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price per unit (€)</label>
                  <input
                    type="number"
                    value={inputs.price}
                    onChange={(e) => updateInput('price', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly volume</label>
                  <input
                    type="number"
                    value={inputs.volume}
                    onChange={(e) => updateInput('volume', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Conversion rate (%)</label>
                  <input
                    type="number"
                    value={inputs.conversionRate}
                    onChange={(e) => updateInput('conversionRate', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">Costs</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fixed costs (€/month)</label>
                  <input
                    type="number"
                    value={inputs.fixedCosts}
                    onChange={(e) => updateInput('fixedCosts', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Variable costs (%)</label>
                  <input
                    type="number"
                    value={inputs.variableCostsPercent}
                    onChange={(e) => updateInput('variableCostsPercent', parseFloat(e.target.value) || 0)}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">Hiring Plan</h4>
              <div className="space-y-2">
                {inputs.hiring.map((hire, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={hire.role}
                      onChange={(e) => updateHiring(index, 'role', e.target.value)}
                      placeholder="Role"
                      className="flex-1 border rounded p-1 text-sm"
                    />
                    <input
                      type="number"
                      value={hire.grossPerMonth}
                      onChange={(e) => updateHiring(index, 'grossPerMonth', parseFloat(e.target.value) || 0)}
                      placeholder="€/month"
                      className="w-24 border rounded p-1 text-sm"
                    />
                    <input
                      type="number"
                      value={hire.months}
                      onChange={(e) => updateHiring(index, 'months', parseInt(e.target.value) || 0)}
                      placeholder="Months"
                      className="w-20 border rounded p-1 text-sm"
                    />
                    <button
                      onClick={() => removeHiring(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <Button onClick={addHiring} size="sm" variant="outline" className="text-xs">
                  + Add Role
                </Button>
              </div>
            </div>

            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">CAPEX & Depreciation</h4>
              <div className="space-y-2">
                {inputs.capex.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => updateCapex(index, 'item', e.target.value)}
                      placeholder="Item"
                      className="flex-1 border rounded p-1 text-sm"
                    />
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => updateCapex(index, 'cost', parseFloat(e.target.value) || 0)}
                      placeholder="€"
                      className="w-24 border rounded p-1 text-sm"
                    />
                    <input
                      type="number"
                      value={item.depreciationYears}
                      onChange={(e) => updateCapex(index, 'depreciationYears', parseInt(e.target.value) || 0)}
                      placeholder="Years"
                      className="w-20 border rounded p-1 text-sm"
                    />
                    <button
                      onClick={() => removeCapex(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <Button onClick={addCapex} size="sm" variant="outline" className="text-xs">
                  + Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Projections */}
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">24-Month P&L</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Month</th>
                      <th className="text-right p-1">Revenue</th>
                      <th className="text-right p-1">Costs</th>
                      <th className="text-right p-1">Profit</th>
                      <th className="text-right p-1">Cash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.slice(0, 12).map((p) => (
                      <tr key={p.month} className="border-b">
                        <td className="p-1">{p.month}</td>
                        <td className="text-right p-1">€{p.revenue.toFixed(0)}</td>
                        <td className="text-right p-1">€{p.totalCosts.toFixed(0)}</td>
                        <td className={`text-right p-1 ${p.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{p.netProfit.toFixed(0)}
                        </td>
                        <td className={`text-right p-1 ${p.cumulativeCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{p.cumulativeCash.toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded p-4">
              <h4 className="font-medium mb-3">Key Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Year 1 Revenue:</span>
                  <span>€{projections.slice(0, 12).reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Year 1 Profit:</span>
                  <span>€{projections.slice(0, 12).reduce((sum, p) => sum + p.netProfit, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Break-even:</span>
                  <span>Month {projections.find(p => p.cumulativeCash > 0)?.month || 24}</span>
                </div>
                <div className="flex justify-between">
                  <span>Runway:</span>
                  <span>{Math.floor(projections.find(p => p.cumulativeCash < 0)?.month || 24)} months</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => setShowSheet(false)}
          >
            Cancel
          </Button>
          <Button onClick={generateSummary}>
            Insert Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
