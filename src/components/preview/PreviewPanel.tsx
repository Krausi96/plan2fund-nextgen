import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface PreviewPanelProps {
  completeness: number; // % complete
  complexity: number;   // scale 1-100
}

export default function PreviewPanel({ completeness, complexity }: PreviewPanelProps) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm mb-6">
      <h2 className="text-xl font-semibold mb-4">Preview</h2>
      <div className="bg-gray-100 p-4 rounded-md text-gray-400 italic mb-4">
        [Preview masked content — unlock with purchase]
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Completeness</p>
          <Progress value={completeness} />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Complexity Score</p>
          <div className="h-2 rounded bg-gray-200">
            <div
              className="h-2 rounded bg-purple-500"
              style={{ width: `${complexity}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
