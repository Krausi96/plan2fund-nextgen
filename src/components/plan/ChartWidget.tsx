import React, { useState } from "react";
import { Button } from "@/components/ui/button";

type ChartWidgetProps = {
  onInsertChart: (chartData: ChartData) => void;
};

type ChartData = {
  type: "line" | "bar" | "pie";
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  width: number;
  height: number;
};

type TableRow = {
  label: string;
  value: string;
};

export default function ChartWidget({ onInsertChart }: ChartWidgetProps) {
  const [showWidget, setShowWidget] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([
    { label: "Q1 2024", value: "100" },
    { label: "Q2 2024", value: "150" },
    { label: "Q3 2024", value: "200" },
    { label: "Q4 2024", value: "250" }
  ]);
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");
  const [chartTitle, setChartTitle] = useState("Revenue Growth");
  const [chartWidth, setChartWidth] = useState(400);
  const [chartHeight, setChartHeight] = useState(300);

  const addRow = () => {
    setTableData([...tableData, { label: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    setTableData(tableData.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: "label" | "value", value: string) => {
    const newData = [...tableData];
    newData[index][field] = value;
    setTableData(newData);
  };

  const generateChart = () => {
    const data = tableData
      .filter(row => row.label && row.value)
      .map((row, index) => ({
        label: row.label,
        value: parseFloat(row.value) || 0,
        color: getColor(index)
      }));

    if (data.length === 0) {
      alert("Please add at least one row with data");
      return;
    }

    const chartData: ChartData = {
      type: chartType,
      title: chartTitle,
      data,
      width: chartWidth,
      height: chartHeight
    };

    onInsertChart(chartData);
    setShowWidget(false);
  };

  const getColor = (index: number) => {
    const colors = [
      "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
      "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"
    ];
    return colors[index % colors.length];
  };

  const renderChartPreview = () => {
    const data = tableData.filter(row => row.label && row.value);
    if (data.length === 0) return null;

    const maxValue = Math.max(...data.map(row => parseFloat(row.value) || 0));
    const minValue = Math.min(...data.map(row => parseFloat(row.value) || 0));
    const range = maxValue - minValue || 1;

    return (
      <div className="border rounded p-4 bg-white">
        <h4 className="font-medium mb-2">{chartTitle}</h4>
        <div className="relative" style={{ width: 200, height: 150 }}>
          {chartType === "line" && (
            <svg width="200" height="150" className="border">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={data.map((row, i) => {
                  const x = (i / (data.length - 1)) * 180 + 10;
                  const y = 140 - ((parseFloat(row.value) - minValue) / range) * 120;
                  return `${x},${y}`;
                }).join(" ")}
              />
              {data.map((row, i) => {
                const x = (i / (data.length - 1)) * 180 + 10;
                const y = 140 - ((parseFloat(row.value) - minValue) / range) * 120;
                return (
                  <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
                );
              })}
            </svg>
          )}
          {chartType === "bar" && (
            <svg width="200" height="150" className="border">
              {data.map((row, i) => {
                const barWidth = 180 / data.length;
                const x = i * barWidth + 10;
                const height = ((parseFloat(row.value) - minValue) / range) * 120;
                const y = 140 - height;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={y}
                    width={barWidth - 2}
                    height={height}
                    fill={getColor(i)}
                  />
                );
              })}
            </svg>
          )}
          {chartType === "pie" && (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-gray-500">Pie chart preview</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!showWidget) {
    return (
      <Button
        onClick={() => setShowWidget(true)}
        variant="outline"
        size="sm"
        className="text-xs"
      >
        📊 Add Chart
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Create Chart</h3>
          <button
            onClick={() => setShowWidget(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Data Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Title</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="w-full border rounded p-2"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Table</label>
              <div className="space-y-2">
                {tableData.map((row, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(index, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1 border rounded p-1 text-sm"
                    />
                    <input
                      type="number"
                      value={row.value}
                      onChange={(e) => updateRow(index, "value", e.target.value)}
                      placeholder="Value"
                      className="w-20 border rounded p-1 text-sm"
                    />
                    <button
                      onClick={() => removeRow(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <Button onClick={addRow} size="sm" variant="outline" className="text-xs">
                  + Add Row
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  value={chartWidth}
                  onChange={(e) => setChartWidth(parseInt(e.target.value) || 400)}
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  value={chartHeight}
                  onChange={(e) => setChartHeight(parseInt(e.target.value) || 300)}
                  className="w-full border rounded p-1 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <h4 className="font-medium mb-2">Preview</h4>
            {renderChartPreview()}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => setShowWidget(false)}
          >
            Cancel
          </Button>
          <Button onClick={generateChart}>
            Insert Chart
          </Button>
        </div>
      </div>
    </div>
  );
}

