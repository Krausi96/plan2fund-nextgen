/**
 * Program-aware sidebar for editor
 * Embeds existing Results card component
 * Adds Adopt template action → calls Prefill and switches template variant
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Program {
  id: string;
  name: string;
  type: string;
  amount: string;
  eligibility: string[];
  requirements: string[];
  score: number;
  reasons: string[];
  risks: string[];
  template?: string;
}

interface SidebarProgramsProps {
  programs: Program[];
  selectedProgram?: Program;
  onProgramSelect: (program: Program) => void;
  onAdoptTemplate: (program: Program) => void;
}

export default function SidebarPrograms({
  programs,
  selectedProgram,
  onProgramSelect,
  onAdoptTemplate
}: SidebarProgramsProps) {
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const handleProgramClick = (program: Program) => {
    setExpandedProgram(expandedProgram === program.id ? null : program.id);
    onProgramSelect(program);
  };

  const handleAdoptTemplate = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    onAdoptTemplate(program);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 text-success';
    if (score >= 60) return 'bg-warning/10 text-warning';
    return 'bg-error/10 text-error';
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'grant':
        return 'bg-primary/10 text-primary';
      case 'loan':
        return 'bg-accent/10 text-accent';
      case 'equity':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-textMuted/10 text-textMuted';
    }
  };

  return (
    <div className="w-80 bg-backgroundAlt border-l border-border p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-2">Recommended Programs</h2>
        <p className="text-sm text-textSecondary">
          Based on your answers, here are the best funding options for your business.
        </p>
      </div>

      <div className="space-y-4">
        {programs.map((program) => (
          <div
            key={program.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedProgram?.id === program.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-surface'
            }`}
            onClick={() => handleProgramClick(program)}
          >
            <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-textPrimary text-sm mb-1">
                  {program.name}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTypeColor(program.type)}>
                    {program.type}
                  </Badge>
                  <Badge className={getScoreColor(program.score)}>
                    {program.score}% match
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {program.amount}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleAdoptTemplate(program, e)}
                className="ml-2 text-xs"
              >
                Adopt Template
              </Button>
            </div>

            {expandedProgram === program.id && (
              <div className="mt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Eligibility</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {program.eligibility.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {program.requirements.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Why This Program</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {program.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">+</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {program.risks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Considerations</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {program.risks.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-500 mr-2">⚠</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200">
                  <Button
                    size="sm"
                    onClick={(e) => handleAdoptTemplate(program, e)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Use This Template
                  </Button>
                </div>
              </div>
            )}
            </Card>
          </div>
        ))}
      </div>

      {programs.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Programs Found</h3>
          <p className="text-xs text-gray-500">
            Complete the setup questions to see recommended funding programs.
          </p>
        </Card>
      )}
    </div>
  );
}
