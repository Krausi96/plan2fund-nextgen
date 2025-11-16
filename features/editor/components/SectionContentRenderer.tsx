// ========= PLAN2FUND — SMART SECTION CONTENT RENDERER =========
// Renders appropriate UI (tables, charts, etc.) based on section category
// All component logic integrated inline (DataChart, FinancialAnalysis, ImageUpload, StructuredFields)

import React, { useState, useRef } from 'react';
import { PlanSection, Table } from '@/features/editor/types/plan';
import { SectionTemplate } from '@templates';
import { sectionNeedsCharts } from '@/features/editor/utils/tableInitializer';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

type ChartType = 'bar' | 'line' | 'pie' | 'donut';

interface SectionContentRendererProps {
  section: PlanSection;
  template: SectionTemplate;
  onTableChange?: (tableKey: string, table: Table) => void;
  onChartTypeChange?: (tableKey: string, chartType: ChartType) => void;
  onImageInsert?: (imageUrl: string, caption?: string, description?: string) => void;
  onFieldChange?: (fieldKey: string, value: any) => void;
}

/**
 * Get chart type for a table: user preference > formatRequirements > defaults
 */
function getChartTypeForTable(
  section: PlanSection,
  template: SectionTemplate,
  tableKey: string
): ChartType {
  // 1. Check user preference first (highest priority)
  if (section.chartTypes?.[tableKey]) {
    return section.chartTypes[tableKey];
  }
  
  // 2. Check formatRequirements
  const formatReqs = template.validationRules?.formatRequirements || [];
  if (formatReqs.some(req => req.includes('pie_chart') || req.includes('pie'))) {
    return 'pie';
  }
  if (formatReqs.some(req => req.includes('donut_chart') || req.includes('donut'))) {
    return 'donut';
  }
  if (formatReqs.some(req => req.includes('line_chart') || req.includes('line_graph'))) {
    return 'line';
  }
  if (formatReqs.some(req => req.includes('bar_chart') || req.includes('bar_graph'))) {
    return 'bar';
  }
  
  // 3. Fallback to sensible defaults
  if (tableKey === 'cashflow') return 'line';
  if (tableKey === 'useOfFunds') return 'pie';
  return 'bar';
}

/**
 * Simple inline chart type selector buttons
 */
function ChartTypeButtons({
  currentType,
  onChange
}: {
  currentType: ChartType;
  onChange: (type: ChartType) => void;
}) {
  const types: ChartType[] = ['bar', 'line', 'pie', 'donut'];
  const labels: Record<ChartType, string> = {
    bar: '📊 Bar',
    line: '📈 Line',
    pie: '🥧 Pie',
    donut: '🍩 Donut'
  };

  return (
    <div className="flex items-center gap-2 mb-2 text-xs">
      <span className="text-gray-500">Chart:</span>
      <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              currentType === type
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={`Switch to ${labels[type]} chart`}
          >
            {labels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SectionContentRenderer({
  section,
  template,
  onTableChange,
  onChartTypeChange,
  onImageInsert,
  onFieldChange
}: SectionContentRendererProps) {
  const category = template.category?.toLowerCase() || '';
  const formatReqs = template.validationRules?.formatRequirements || [];
  
  // Check if section needs diagrams/images
  const needsDiagrams = formatReqs.some(req => 
    req.includes('diagram') || req.includes('visual') || req.includes('image')
  ) || (category === 'general' && (section.key === 'product_idea' || section.key === 'business_system'));

  // Render diagrams/images if needed (before other content)
  const renderDiagrams = () => {
    if (!needsDiagrams || !onImageInsert) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Diagrams & Visuals</h3>
        <ImageUploadInline
          sectionId={section.key}
          onImageInsert={onImageInsert}
        />
        {/* Display existing images */}
        {section.figures && section.figures.length > 0 && (
          <div className="mt-4 space-y-4">
            {section.figures.map((figure, idx) => {
              const fig = figure as any;
              if (fig.url || fig.imageUrl) {
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <img
                      src={fig.url || fig.imageUrl}
                      alt={fig.caption || fig.altText || 'Diagram'}
                      className="w-full h-auto rounded-md mb-2"
                    />
                    {fig.caption && (
                      <p className="text-sm text-gray-600 italic">{fig.caption}</p>
                    )}
                    {fig.description && (
                      <p className="text-xs text-gray-500 mt-1">{fig.description}</p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  // Render financial section content
  if (category === 'financial') {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
        {/* Revenue Table & Chart */}
        {section.tables?.revenue && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Revenue Projections</h3>
            <FinancialTable
              table={section.tables.revenue}
              onUpdate={(table) => onTableChange?.('revenue', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'revenue')}
                  onChange={(type) => onChartTypeChange?.('revenue', type)}
                />
                <DataChartInline
                  table={section.tables.revenue}
                  chartType={getChartTypeForTable(section, template, 'revenue')}
                  title="Revenue Projections Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Costs Table & Chart */}
        {section.tables?.costs && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown</h3>
            <FinancialTable
              table={section.tables.costs}
              onUpdate={(table) => onTableChange?.('costs', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'costs')}
                  onChange={(type) => onChartTypeChange?.('costs', type)}
                />
                <DataChartInline
                  table={section.tables.costs}
                  chartType={getChartTypeForTable(section, template, 'costs')}
                  title="Cost Breakdown Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Cash Flow Table & Chart */}
        {section.tables?.cashflow && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cash Flow Projections</h3>
            <FinancialTable
              table={section.tables.cashflow}
              onUpdate={(table) => onTableChange?.('cashflow', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'cashflow')}
                  onChange={(type) => onChartTypeChange?.('cashflow', type)}
                />
                <DataChartInline
                  table={section.tables.cashflow}
                  chartType={getChartTypeForTable(section, template, 'cashflow')}
                  title="Cash Flow Projections Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Use of Funds Table & Chart */}
        {section.tables?.useOfFunds && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Use of Funds</h3>
            <FinancialTable
              table={section.tables.useOfFunds}
              onUpdate={(table) => onTableChange?.('useOfFunds', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'useOfFunds')}
                  onChange={(type) => onChartTypeChange?.('useOfFunds', type)}
                />
                <DataChartInline
                  table={section.tables.useOfFunds}
                  chartType={getChartTypeForTable(section, template, 'useOfFunds')}
                  title="Use of Funds Chart"
                />
              </div>
            )}
          </div>
        )}

        {/* Financial Analysis Cards */}
        <FinancialAnalysisInline
          revenue={section.tables?.revenue}
          costs={section.tables?.costs}
          cashflow={section.tables?.cashflow}
        />
      </div>
    );
  }

  // Render market section content
  if (category === 'market') {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
        
        {/* Structured Fields (TAM/SAM/SOM, Market Size, etc.) */}
        <StructuredFieldsInline
          section={section}
          requiredFields={template.validationRules?.requiredFields || []}
          onFieldChange={onFieldChange}
        />
        
        {section.tables?.competitors && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Competitor Analysis</h3>
            <DataTable
              table={section.tables.competitors}
              onUpdate={(table) => onTableChange?.('competitors', table)}
            />
            {sectionNeedsCharts(template) && (
              <div>
                <ChartTypeButtons
                  currentType={getChartTypeForTable(section, template, 'competitors')}
                  onChange={(type) => onChartTypeChange?.('competitors', type)}
                />
                <DataChartInline
                  table={section.tables.competitors}
                  chartType={getChartTypeForTable(section, template, 'competitors')}
                  title="Competitor Comparison Chart"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render risk section content
  if (category === 'risk') {
    return (
      <div className="space-y-6">
        {section.tables?.risks && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Analysis Matrix</h3>
            <DataTable
              table={section.tables.risks}
              onUpdate={(table) => onTableChange?.('risks', table)}
            />
          </div>
        )}
      </div>
    );
  }

  // Render team section content
  if (category === 'team') {
    return (
      <div className="space-y-6">
        {section.tables?.team && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Team Skills Matrix</h3>
            <DataTable
              table={section.tables.team}
              onUpdate={(table) => onTableChange?.('team', table)}
            />
          </div>
        )}
      </div>
    );
  }

  // Render project/timeline section content
  if (category === 'project') {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
        {section.tables?.timeline && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Project Timeline</h3>
            <DataTable
              table={section.tables.timeline}
              onUpdate={(table) => onTableChange?.('timeline', table)}
            />
            {/* Could add Gantt chart here later */}
          </div>
        )}
      </div>
    );
  }

  // Render technical section content (text only, but can have diagrams)
  if (category === 'technical') {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
        {/* Technical sections are text-only, no tables/charts */}
      </div>
    );
  }

  // Render impact section content (text only, but can have diagrams)
  if (category === 'impact') {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
        {/* Impact sections are text-only, no tables/charts */}
      </div>
    );
  }

  // Render general sections with diagrams (e.g., Product Idea, Business System)
  if (needsDiagrams) {
    return (
      <div className="space-y-6">
        {renderDiagrams()}
      </div>
    );
  }

  // All other sections (general, etc.) - no special rendering needed
  return null;
}

// ========= INLINE COMPONENT IMPLEMENTATIONS =========

// DataChart - Inline implementation
function DataChartInline({ 
  table, 
  chartType, 
  title
}: {
  table: Table;
  chartType: ChartType;
  title?: string;
}) {
  const chartData = React.useMemo(() => {
    if (!table || !table.columns || !table.rows || table.rows.length === 0) {
      return [];
    }

    if (chartType === 'pie' || chartType === 'donut') {
      return table.rows.map((row) => ({
        name: row.label,
        value: typeof row.values[0] === 'number' 
          ? row.values[0] 
          : (typeof row.values[0] === 'string' ? parseFloat(row.values[0]) || 0 : 0)
      }));
    }

    return table.columns.map((column, colIndex) => {
      const dataPoint: Record<string, string | number> = { name: column };
      table.rows.forEach((row) => {
        const value = row.values[colIndex];
        dataPoint[row.label] = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : 0);
      });
      return dataPoint;
    });
  }, [table, chartType]);

  if (chartData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-sm text-gray-500">
        No data available for chart
      </div>
    );
  }

  const seriesKeys = table.rows.map(row => row.label);
  const colors = getColorsForChart(seriesKeys.length);

  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index]} />
              ))}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {seriesKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={colors[index]} strokeWidth={2} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={chartType === 'donut' ? 80 : 100}
                innerRadius={chartType === 'donut' ? 40 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getColorsForChart(count: number): string[] {
  const colorPalette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  ];
  return Array.from({ length: count }, (_, i) => colorPalette[i % colorPalette.length]);
}

// FinancialAnalysis - Inline implementation
interface AnalysisResult {
  breakEvenYear?: number;
  breakEvenMonth?: number;
  growthRate?: number;
  grossMargin?: number;
  netMargin?: number;
  profitabilityYear?: number;
}

function calculateAnalysis(revenue?: Table, costs?: Table): AnalysisResult {
  const result: AnalysisResult = {};

  if (!revenue || !costs) return result;

  const revenueTotals: number[] = [];
  const costTotals: number[] = [];

  revenue.columns.forEach((_, colIndex) => {
    const revenueRow = revenue.rows.find(r => r.label.toLowerCase().includes('total'));
    const costRow = costs.rows.find(r => r.label.toLowerCase().includes('total'));
    
    if (revenueRow) {
      const val = revenueRow.values[colIndex];
      revenueTotals.push(typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0));
    } else {
      const sum = revenue.rows.reduce((acc, row) => {
        const val = row.values[colIndex];
        return acc + (typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0));
      }, 0);
      revenueTotals.push(sum);
    }

    if (costRow) {
      const val = costRow.values[colIndex];
      costTotals.push(typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0));
    } else {
      const sum = costs.rows.reduce((acc, row) => {
        const val = row.values[colIndex];
        return acc + (typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0));
      }, 0);
      costTotals.push(sum);
    }
  });

  for (let i = 0; i < revenueTotals.length; i++) {
    if (revenueTotals[i] >= costTotals[i] && revenueTotals[i] > 0) {
      result.breakEvenYear = i + 1;
      if (i > 0) {
        const prevRevenue = revenueTotals[i - 1];
        const prevCosts = costTotals[i - 1];
        const currRevenue = revenueTotals[i];
        const currCosts = costTotals[i];
        
        if (prevRevenue < prevCosts) {
          const revenueGrowth = currRevenue - prevRevenue;
          const costGrowth = currCosts - prevCosts;
          const netGrowth = revenueGrowth - costGrowth;
          
          if (netGrowth > 0) {
            const deficit = prevCosts - prevRevenue;
            const monthsToBreakEven = (deficit / netGrowth) * 12;
            result.breakEvenMonth = Math.ceil(monthsToBreakEven);
          }
        }
      }
      break;
    }
  }

  if (revenueTotals.length >= 2) {
    const firstYear = revenueTotals[0];
    const lastYear = revenueTotals[revenueTotals.length - 1];
    if (firstYear > 0) {
      const years = revenueTotals.length - 1;
      result.growthRate = ((Math.pow(lastYear / firstYear, 1 / years) - 1) * 100);
    }
  }

  if (revenueTotals.length > 0) {
    const lastIndex = revenueTotals.length - 1;
    const lastRevenue = revenueTotals[lastIndex];
    const lastCosts = costTotals[lastIndex];
    
    if (lastRevenue > 0) {
      const cogsRow = costs.rows.find(r => 
        r.label.toLowerCase().includes('cost') || 
        r.label.toLowerCase().includes('cogs') ||
        r.label.toLowerCase().includes('production')
      );
      if (cogsRow && lastIndex < cogsRow.values.length) {
        const cogs = typeof cogsRow.values[lastIndex] === 'number' 
          ? cogsRow.values[lastIndex] 
          : (typeof cogsRow.values[lastIndex] === 'string' ? parseFloat(cogsRow.values[lastIndex]) || 0 : 0);
        result.grossMargin = ((lastRevenue - cogs) / lastRevenue) * 100;
      }
      result.netMargin = ((lastRevenue - lastCosts) / lastRevenue) * 100;
    }
  }

  for (let i = 0; i < revenueTotals.length; i++) {
    if (revenueTotals[i] > costTotals[i] && revenueTotals[i] > 0) {
      result.profitabilityYear = i + 1;
      break;
    }
  }

  return result;
}

function FinancialAnalysisInline({ revenue, costs }: { revenue?: Table; costs?: Table; cashflow?: Table }) {
  const analysis = React.useMemo(() => calculateAnalysis(revenue, costs), [revenue, costs]);

  if (!revenue && !costs) {
    return null;
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {analysis.breakEvenYear && (
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Break-Even Point</h4>
          <p className="text-2xl font-bold text-blue-600">
            Year {analysis.breakEvenYear}
            {analysis.breakEvenMonth && analysis.breakEvenMonth < 12 && (
              <span className="text-lg">, Month {analysis.breakEvenMonth}</span>
            )}
          </p>
          <p className="text-xs text-gray-600 mt-1">When revenue covers all costs</p>
        </div>
      )}

      {analysis.growthRate !== undefined && (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Annual Growth Rate</h4>
          <p className="text-2xl font-bold text-green-600">
            {analysis.growthRate > 0 ? '+' : ''}{analysis.growthRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Year-over-year revenue growth</p>
        </div>
      )}

      {analysis.grossMargin !== undefined && (
        <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Gross Margin</h4>
          <p className="text-2xl font-bold text-purple-600">
            {analysis.grossMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Revenue minus cost of goods sold</p>
        </div>
      )}

      {analysis.netMargin !== undefined && (
        <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Net Margin</h4>
          <p className="text-2xl font-bold text-amber-600">
            {analysis.netMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Profit after all expenses</p>
        </div>
      )}

      {analysis.profitabilityYear && analysis.profitabilityYear !== analysis.breakEvenYear && (
        <div className="border border-gray-200 rounded-lg p-4 bg-emerald-50">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">First Profitable Year</h4>
          <p className="text-2xl font-bold text-emerald-600">
            Year {analysis.profitabilityYear}
          </p>
          <p className="text-xs text-gray-600 mt-1">When net profit becomes positive</p>
        </div>
      )}
    </div>
  );
}

// ImageUpload - Inline implementation
function ImageUploadInline({
  onImageInsert,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  sectionId
}: {
  onImageInsert: (imageUrl: string, caption?: string, description?: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  sectionId?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!acceptedFormats.includes(file.type)) {
      alert(`Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`);
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadImage(file);
      
      if (imageUrl) {
        onImageInsert(imageUrl, caption || undefined, description || undefined);
        setPreview(null);
        setCaption('');
        setDescription('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      alert(`Upload failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    if (sectionId) {
      formData.append('sectionId', sectionId);
    }

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleRemove = () => {
    setPreview(null);
    setCaption('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-900">Insert Image</h3>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${sectionId || 'default'}`}
        />
        <label
          htmlFor={`image-upload-${sectionId || 'default'}`}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Choose Image</span>
            </>
          )}
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Max size: {maxSizeMB}MB • Formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}
        </p>
      </div>

      {preview && (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-md border border-gray-200"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Image caption..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Image description..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              if (preview) {
                onImageInsert(preview, caption || undefined, description || undefined);
                handleRemove();
              }
            }}
            className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Insert Image
          </button>
        </div>
      )}
    </div>
  );
}

// StructuredFields - Inline implementation
function StructuredFieldsInline({ 
  section, 
  requiredFields = [],
  onFieldChange 
}: {
  section: PlanSection;
  requiredFields?: string[];
  onFieldChange?: (fieldKey: string, value: any) => void;
}) {
  const fields = section.fields || {};
  
  const hasRequiredMarketFields = requiredFields.some(f => 
    f.includes('tam') || f.includes('sam') || f.includes('som') || f.includes('market_size') ||
    f.includes('market_trends') || f.includes('target_customers') || f.includes('market_segments') || f.includes('growth_trends')
  );
  
  const hasExistingMarketFields = Object.keys(fields).some(key => 
    ['tam', 'sam', 'som', 'market_size', 'market_trends', 'target_customers', 'market_segments', 'growth_trends'].includes(key)
  );
  
  if (!hasRequiredMarketFields && !hasExistingMarketFields) {
    return null;
  }

  const handleFieldChange = (key: string, value: any) => {
    if (onFieldChange) {
      onFieldChange(key, value);
    }
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Market Data</h3>
      
      {(requiredFields.some(f => f.includes('tam')) || fields.tam) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              TAM (Total Addressable Market)
              {requiredFields.some(f => f.includes('tam')) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={fields.tam || ''}
              onChange={(e) => handleFieldChange('tam', e.target.value)}
              placeholder="e.g., $50B"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Total market size</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              SAM (Serviceable Addressable Market)
              {requiredFields.some(f => f.includes('sam')) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={fields.sam || ''}
              onChange={(e) => handleFieldChange('sam', e.target.value)}
              placeholder="e.g., $5B"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Addressable portion</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              SOM (Serviceable Obtainable Market)
              {requiredFields.some(f => f.includes('som')) && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={fields.som || ''}
              onChange={(e) => handleFieldChange('som', e.target.value)}
              placeholder="e.g., $500M"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Realistic capture</p>
          </div>
        </div>
      )}

      {requiredFields.includes('market_size') && !fields.tam && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Market Size <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.market_size || ''}
            onChange={(e) => handleFieldChange('market_size', e.target.value)}
            placeholder="e.g., $10B market"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(requiredFields.includes('market_trends') || fields.market_trends) && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Market Trends <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.market_trends || ''}
            onChange={(e) => handleFieldChange('market_trends', e.target.value)}
            placeholder="Describe key market trends..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(requiredFields.includes('target_customers') || fields.target_customers) && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Target Customers <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.target_customers || ''}
            onChange={(e) => handleFieldChange('target_customers', e.target.value)}
            placeholder="Describe your target customers..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(requiredFields.includes('market_segments') || fields.market_segments) && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Market Segments <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.market_segments || ''}
            onChange={(e) => handleFieldChange('market_segments', e.target.value)}
            placeholder="List key market segments..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(requiredFields.includes('growth_trends') || fields.growth_trends) && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Growth Trends <span className="text-red-500">*</span>
          </label>
          <textarea
            value={fields.growth_trends || ''}
            onChange={(e) => handleFieldChange('growth_trends', e.target.value)}
            placeholder="Describe market growth trends..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

// Reusable table component for financial data
function FinancialTable({ table, onUpdate }: { table: Table; onUpdate?: (table: Table) => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 border-b border-gray-200">Item</th>
            {table.columns.map((col: string, idx: number) => (
              <th key={idx} className="text-right p-3 border-b border-gray-200">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: any, rIdx: number) => (
            <tr key={rIdx} className="border-b border-gray-100">
              <td className="p-3 font-medium">{row.label}</td>
              {row.values.map((val: number | string, vIdx: number) => (
                <td key={vIdx} className="text-right p-3">
                  <input
                    type="number"
                    value={typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val) || 0 : 0)}
                    onChange={(e) => {
                      const updated = { ...table };
                      const newValue = Number(e.target.value) || 0;
                      updated.rows[rIdx].values[vIdx] = newValue;
                      onUpdate?.(updated);
                    }}
                    className="w-24 text-right border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Reusable table component for non-financial data (text/number mix)
function DataTable({ table, onUpdate }: { table: Table; onUpdate?: (table: Table) => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 border-b border-gray-200">Item</th>
            {table.columns.map((col: string, idx: number) => (
              <th key={idx} className="text-left p-3 border-b border-gray-200">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: any, rIdx: number) => (
            <tr key={rIdx} className="border-b border-gray-100">
              <td className="p-3 font-medium">{row.label}</td>
              {row.values.map((val: any, vIdx: number) => (
                <td key={vIdx} className="p-3">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const updated = { ...table };
                      const newValue: string | number = e.target.value;
                      updated.rows[rIdx].values[vIdx] = newValue;
                      onUpdate?.(updated);
                    }}
                    className="w-full border-0 bg-transparent focus:bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

