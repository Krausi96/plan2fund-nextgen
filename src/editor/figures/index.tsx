// ========= PLAN2FUND — FIGURES & GRAPHS =========
// Figures and graphs rendering component

import { FigureRef, Table } from '@/types/plan';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FiguresProps {
  figures: FigureRef[];
  onFiguresChange: (figures: FigureRef[]) => void;
  tables?: {
    revenue?: Table;
    costs?: Table;
    cashflow?: Table;
    useOfFunds?: Table;
  };
}

function Figures({ figures, tables }: FiguresProps) {
  // Convert table data to chart format
  const convertTableToChartData = (table: Table) => {
    if (!table) return [];
    
    return table.columns.map((col, index) => {
      const dataPoint: any = { period: col };
      
      table.rows.forEach(row => {
        dataPoint[row.label] = row.values[index] || 0;
      });
      
      return dataPoint;
    });
  };

  const renderChart = (figure: FigureRef) => {
    const { type, dataRef } = figure;
    const table = tables?.[dataRef as keyof typeof tables];
    
    if (!table) {
      return (
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-gray-500">
            <div className="text-2xl mb-2">
              {type === 'line' ? '📈' : type === 'bar' ? '📊' : '🍩'}
            </div>
            <div className="text-sm">No data available</div>
          </div>
        </div>
      );
    }

    const chartData = convertTableToChartData(table);
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              {table.rows.map((row, i) => (
                <Line
                  key={row.label}
                  type="monotone"
                  dataKey={row.label}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          ) : type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              {table.rows.map((row, i) => (
                <Bar
                  key={row.label}
                  dataKey={row.label}
                  fill={colors[i % colors.length]}
                />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={table.rows.map(row => ({
                  name: row.label,
                  value: row.values.reduce((sum, val) => sum + val, 0)
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {table.rows.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderFigure = (figure: FigureRef, index: number) => {
    const { type, dataRef, caption, altText } = figure;
    
    return (
      <div key={index} className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Figure {index + 1}: {type.toUpperCase()} Chart</h4>
          <span className="text-sm text-gray-500">{dataRef}</span>
        </div>
        
        {renderChart(figure)}
        
        {caption && (
          <div className="text-sm text-gray-600 italic">
            {caption}
          </div>
        )}
        
        {altText && (
          <div className="text-xs text-gray-400">
            Alt: {altText}
          </div>
        )}
      </div>
    );
  };

  if (figures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <div>No figures added yet</div>
        <div className="text-sm">Add figures from the financial tables</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Figures & Graphs</h3>
      {figures.map((figure, index) => renderFigure(figure, index))}
    </div>
  );
}

// Export as default with lazy loading
export default Figures;
