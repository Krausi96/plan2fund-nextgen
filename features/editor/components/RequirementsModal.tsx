// ========= PLAN2FUND — REQUIREMENTS MODAL =========
// Simple checklist view: shows all sections, what's missing, and allows navigation/generation
// Includes program-specific requirements from reco
// NOW: Semantic validation using AI Business Expert with Template Knowledge

import React, { useEffect, useState } from 'react';
import { PlanSection } from '@/shared/types/plan';
import { SectionTemplate } from '@/features/editor/templates/types';
import { getTemplateKnowledge } from '@/features/editor/templates';

/**
 * Get program requirements for a section category
 * Extracts requirements from categorized_requirements by category
 */
function getProgramRequirementsForSection(
  categorizedRequirements: any,
  sectionCategory: string
): string[] {
  if (!categorizedRequirements || typeof categorizedRequirements !== 'object') {
    return [];
  }
  
  // Map section category to program requirement category
  const categoryMapping: Record<string, string> = {
    'financial': 'financial',
    'market': 'market_size',
    'risk': 'compliance',
    'team': 'team',
    'project': 'project',
    'technical': 'technical',
    'impact': 'impact',
    'general': 'eligibility'
  };
  
  const reqCategory = categoryMapping[sectionCategory] || 'eligibility';
  const requirements = categorizedRequirements[reqCategory] || [];
  
  // Extract values as strings
  return requirements
    .map((req: any) => {
      if (!req.value) return null;
      const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value);
      return value.length < 200 ? value : null; // Sanity check
    })
    .filter(Boolean) as string[];
}

interface RequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: PlanSection[];
  sectionTemplates: SectionTemplate[];
  onNavigateToSection: (sectionIndex: number) => void;
  onGenerateMissingContent: (sectionKey: string) => void;
  programId?: string;
  programData?: {
    categorized_requirements?: any;
    program_name?: string;
  };
}

export default function RequirementsModal({
  isOpen,
  onClose,
  sections,
  sectionTemplates,
  onNavigateToSection,
  onGenerateMissingContent,
  programId: _programId,
  programData
}: RequirementsModalProps) {

  // Semantic validation state
  const [_semanticValidation, setSemanticValidation] = useState<Record<string, any>>({});
  const [validatingSection, setValidatingSection] = useState<string | null>(null);
  const [sectionValidations, setSectionValidations] = useState<Record<string, any>>({});

  /**
   * Validate section semantically using AI Business Expert
   * This provides deep validation beyond keyword matching
   */
  const validateSectionSemantically = async (section: PlanSection, template: SectionTemplate) => {
    const content = section?.content || '';
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (textContent.length === 0) {
      return {
        status: 'missing' as const,
        issues: ['No content yet'],
        progress: 0,
        semanticAnalysis: null
      };
    }

    // Get template knowledge for semantic validation
    const templateKnowledge = getTemplateKnowledge(template.id);

    // Build validation prompt
    const validationPrompt = `
You are a business plan validator with deep expertise in business plan evaluation.

=== CONTENT TO VALIDATE ===
${textContent}

=== TEMPLATE REQUIREMENTS ===
Word count: ${template.wordCountMin || 0}-${template.wordCountMax || 'unlimited'}
Required fields: ${template.validationRules?.requiredFields?.join(', ') || 'None'}

=== TEMPLATE GUIDANCE ===
${templateKnowledge?.guidance || 'No specific guidance'}

Required elements:
${templateKnowledge?.requiredElements?.map((e: string) => `- ${e}`).join('\n') || 'None'}

${templateKnowledge?.frameworks ? `Frameworks that should be used:\n${templateKnowledge.frameworks.map((f: string) => `- ${f}`).join('\n')}\n` : ''}
${templateKnowledge?.expertQuestions ? `Expert questions:\n${templateKnowledge.expertQuestions.map((q: string) => `- ${q}`).join('\n')}\n` : ''}
${(templateKnowledge as any)?.qualityIndicators ? `Quality indicators:\n${(templateKnowledge as any).qualityIndicators.map((i: string) => `- ${i}`).join('\n')}\n` : ''}

=== VALIDATION TASK ===
1. Check word count (${template.wordCountMin || 0}-${template.wordCountMax || 'unlimited'})
2. Check if required elements are present (semantic check, not keyword matching)
3. Check if appropriate frameworks are used (if applicable)
4. Check professional quality
5. Check if best practices are followed
6. Check for common mistakes
7. Assess overall quality

=== OUTPUT FORMAT (JSON) ===
{
  "wordCount": {
    "actual": 152,
    "required": "150-300",
    "status": "pass"
  },
  "requiredElements": {
    "problem": {
      "present": true,
      "quality": "good",
      "notes": "Clearly defined with specific example"
    },
    "solution": {
      "present": true,
      "quality": "weak",
      "notes": "Mentioned but not detailed enough"
    }
  },
  "frameworks": {
    "Porter Five Forces": {
      "used": false,
      "notes": "Should be used for market analysis section"
    }
  },
  "professionalQuality": {
    "score": 7,
    "notes": "Good structure but could be more compelling"
  },
  "bestPractices": {
    "follows": ["Clear structure", "Specific examples"],
    "missing": ["Quantified impact", "Compelling hook"]
  },
  "commonMistakes": {
    "found": ["Vague target market definition"],
    "avoided": ["Overestimating market size"]
  },
  "issues": [
    "Missing impact quantification",
    "Solution needs more detail"
  ],
  "recommendations": [
    "Add quantified impact (e.g., 'will reach 10,000 users')",
    "Expand solution description"
  ]
}
`;

    try {
      setValidatingSection(section.key);
      
      // Call AI for semantic validation
      const response = await fetch('/api/ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: validationPrompt,
          context: {
            sectionId: template.id,
            sectionTitle: template.title,
            action: 'validate'
          },
          conversationHistory: []
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        const validation = JSON.parse(aiResponse.content || '{}');
        
        // Store semantic validation result
        setSemanticValidation(prev => ({
          ...prev,
          [section.key]: validation
        }));

        // Convert to issues format
        const issues: string[] = [];
        if (validation.wordCount?.status === 'fail') {
          issues.push(`Content ${validation.wordCount.actual < (template.wordCountMin || 0) ? 'too short' : 'too long'} (${validation.wordCount.actual}/${validation.wordCount.required} words)`);
        }
        
        // Add issues from semantic analysis
        if (validation.issues) {
          issues.push(...validation.issues);
        }

        // Check required elements
        if (validation.requiredElements) {
          Object.entries(validation.requiredElements).forEach(([key, elem]: [string, any]) => {
            if (!elem.present) {
              issues.push(`Missing: ${key.replace(/_/g, ' ')}`);
            } else if (elem.quality === 'weak') {
              issues.push(`${key.replace(/_/g, ' ')}: ${elem.notes}`);
            }
          });
        }

        // Check frameworks
        if (validation.frameworks) {
          Object.entries(validation.frameworks).forEach(([framework, info]: [string, any]) => {
            if (!info.used && info.notes) {
              issues.push(`Framework: ${framework} - ${info.notes}`);
            }
          });
        }

        // Determine status
        let status: 'complete' | 'in-progress' | 'missing' | 'needs-enhancement';
        if (issues.length === 0) {
          status = 'complete';
        } else {
          const hasFormatIssues = issues.some(i => 
            i.includes('tables') || i.includes('matrix') || i.includes('chart') || 
            i.includes('graph') || i.includes('timeline')
          );
          status = hasFormatIssues ? 'needs-enhancement' : 'in-progress';
        }

        // Calculate progress
        const totalChecks = 1 + 
          (template.validationRules?.requiredFields?.length || 0) +
          (template.validationRules?.formatRequirements?.length || 0) +
          (templateKnowledge?.requiredElements?.length || 0);
        const passedChecks = totalChecks - issues.length;
        const progress = totalChecks > 0 
          ? Math.round((passedChecks / totalChecks) * 100) 
          : (textContent.length > 0 ? 50 : 0);

        return {
          status,
          issues,
          progress,
          semanticAnalysis: validation
        };
      }
    } catch (error) {
      console.error('Semantic validation failed:', error);
      // Fall back to basic validation
    } finally {
      setValidatingSection(null);
    }

    // Fallback to basic validation if AI fails
    return validateSectionBasic(section, template);
  };

  /**
   * Basic validation (fallback when AI is unavailable)
   */
  const validateSectionBasic = (section: PlanSection, template: SectionTemplate) => {
    const issues: string[] = [];

    // 1. Check content (word count)
    const content = section?.content || '';
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount === 0) {
      issues.push('No content yet');
    } else if (template.wordCountMin && wordCount < template.wordCountMin) {
      issues.push(`Content too short (${wordCount}/${template.wordCountMin} words minimum)`);
    } else if (template.wordCountMax && wordCount > template.wordCountMax) {
      issues.push(`Content too long (${wordCount}/${template.wordCountMax} words maximum)`);
    }

    // 2. Check requiredFields from validationRules
    if (template.validationRules?.requiredFields) {
      template.validationRules.requiredFields.forEach(field => {
        const fieldValue = section.fields?.[field];
        if (!fieldValue || 
            fieldValue === '' || 
            fieldValue === null ||
            (Array.isArray(fieldValue) && fieldValue.length === 0)) {
          const readableName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          issues.push(`${readableName} is required`);
        }
      });
    }

    // 3. Check formatRequirements from validationRules
    if (template.validationRules?.formatRequirements) {
      template.validationRules.formatRequirements.forEach(format => {
        if (format === 'financial_tables' || format === 'tabular_budget' || format === 'clean_financial_tables') {
          if (!section.tables || Object.keys(section.tables).length === 0) {
            if (!issues.some(i => i.includes('Financial tables'))) {
              issues.push('Financial tables needed');
            }
          }
        }
        if (format === 'risk_matrix' || format === 'structured_risk_section') {
          if (!section.tables?.risks) {
            if (!issues.some(i => i.includes('Risk'))) {
              issues.push('Risk analysis matrix needed');
            }
          }
        }
        if (format === 'competitive_matrix' || format === 'competitive_positioning') {
          if (!section.tables?.competitors) {
            if (!issues.some(i => i.includes('Competitor'))) {
              issues.push('Competitor analysis table needed');
            }
          }
        }
        if (format === 'gantt_chart_or_table' || format === 'project_schedule') {
          const hasTimelineTable = !!section.tables?.timeline;
          const hasTimelineFigure = section.figures?.some(f => (f as any).dataRef === 'timeline' || (f as any).id === 'timeline' || (f as any).type === 'timeline');
          if (!hasTimelineTable && !hasTimelineFigure) {
            if (!issues.some(i => i.includes('timeline') || i.includes('schedule'))) {
              issues.push('Project timeline (Gantt chart or table) needed');
            }
          }
        }
        if (format === 'ratio_tables' || format === 'financial_ratios') {
          if (!section.tables?.ratios) {
            if (!issues.some(i => i.includes('ratio'))) {
              issues.push('Financial ratios table needed');
            }
          }
        }
        if (format === 'data_visualisation' || format === 'charts_or_graphs') {
          if (!section.figures || Object.keys(section.figures).length === 0) {
            if (!issues.some(i => i.includes('chart') || i.includes('graph'))) {
              issues.push('Charts or graphs needed');
            }
          }
        }
      });
    }

    // 4. Category-specific checks (fallback)
    if (template.category === 'financial') {
      if (!section.tables || Object.keys(section.tables).length === 0) {
        if (!issues.some(i => i.includes('Financial tables') || i.includes('tables'))) {
          issues.push('Financial tables needed');
        }
      }
    }
    if (template.category === 'team') {
      if (!section.fields?.teamMembers && !section.tables?.team) {
        if (!issues.some(i => i.includes('team') || i.includes('Team'))) {
          issues.push('Team member profiles needed');
        }
      }
    }
    if (template.category === 'market') {
      if (!section.tables?.competitors) {
        if (!issues.some(i => i.includes('Competitor') || i.includes('competitor'))) {
          issues.push('Competitor analysis table needed');
        }
      }
    }
    if (template.category === 'risk') {
      if (!section.tables?.risks) {
        if (!issues.some(i => i.includes('Risk') || i.includes('risk'))) {
          issues.push('Risk analysis matrix needed');
        }
      }
    }

    // Determine status
    let status: 'complete' | 'in-progress' | 'missing' | 'needs-enhancement';
    if (wordCount === 0) {
      status = 'missing';
    } else if (issues.length > 0) {
      const hasFormatIssues = issues.some(i => 
        i.includes('tables') || i.includes('matrix') || i.includes('chart') || 
        i.includes('graph') || i.includes('timeline')
      );
      status = hasFormatIssues ? 'needs-enhancement' : 'in-progress';
    } else {
      status = 'complete';
    }

    // Calculate progress
    const totalChecks = 1 + 
      (template.validationRules?.requiredFields?.length || 0) +
      (template.validationRules?.formatRequirements?.length || 0);
    const passedChecks = totalChecks - issues.length;
    const progress = totalChecks > 0 
      ? Math.round((passedChecks / totalChecks) * 100) 
      : (wordCount > 0 ? 50 : 0);

    return { status, issues, progress, semanticAnalysis: null };
  };

  // Main validation function - uses semantic validation when possible
  const validateSection = async (section: PlanSection, template: SectionTemplate) => {
    // Try semantic validation first (if content exists)
    const content = section?.content || '';
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (textContent.length > 50) {
      // Use semantic validation for content with sufficient length
      return await validateSectionSemantically(section, template);
    } else {
      // Use basic validation for empty or very short content
      return validateSectionBasic(section, template);
    }
  };

  // Load semantic validations on mount and when sections change
  useEffect(() => {
    const loadValidations = async () => {
      const validations: Record<string, any> = {};
      for (const section of sections) {
        const template = sectionTemplates.find(t => t.id === section.key);
        if (template) {
          const validation = await validateSection(section, template);
          validations[section.key] = validation;
        }
      }
      setSectionValidations(validations);
    };
    
    if (isOpen && sections.length > 0) {
      loadValidations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sections, sectionTemplates]);

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'complete':
        return { icon: '✓', label: 'Complete', color: 'green' };
      case 'in-progress':
        return { icon: '⚠', label: 'In Progress', color: 'yellow' };
      case 'needs-enhancement':
        return { icon: '📊', label: 'Needs Enhancement', color: 'orange' };
      case 'missing':
        return { icon: '○', label: 'Missing', color: 'red' };
      default:
        return { icon: '○', label: 'Unknown', color: 'gray' };
    }
  };

  // Calculate overall progress (based on validation)
  const calculateOverallProgress = () => {
    if (sections.length === 0) return { percentage: 0, completed: 0, total: 0 };
    
    let totalProgress = 0;
    let completedSections = 0;

    sections.forEach(section => {
      const validation = sectionValidations[section.key];
      if (validation) {
        totalProgress += validation.progress;
        if (validation.status === 'complete') {
          completedSections++;
        }
      }
    });

    const percentage = sections.length > 0 
      ? Math.round(totalProgress / sections.length)
      : 0;

    return {
      percentage,
      completed: completedSections,
      total: sections.length
    };
  };

  const overallProgress = calculateOverallProgress();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Requirements Checker</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Overall Progress */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Plan Progress</span>
            <span className="text-lg font-bold text-blue-600">{overallProgress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {overallProgress.completed} of {overallProgress.total} sections completed
          </div>
        </div>

        {/* All Sections Overview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Sections</h3>
          <div className="space-y-3">
            {sections.map((section, index) => {
              const template = sectionTemplates.find(t => t.id === section.key);
              if (!template) return null;

              // Get validation from state (loaded in useEffect)
              const validation = sectionValidations[section.key] || validateSectionBasic(section, template);
              const statusDisplay = getStatusDisplay(validation.status);
              const isValidating = validatingSection === section.key;
              
              return (
                <div
                  key={section.key}
                  className={`border rounded-lg p-4 transition-colors ${
                    validation.status === 'complete' 
                      ? 'bg-green-50 border-green-200' 
                      : validation.status === 'in-progress'
                      ? 'bg-yellow-50 border-yellow-200'
                      : validation.status === 'needs-enhancement'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h4 className="font-semibold text-gray-900">{section.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          validation.status === 'complete' 
                            ? 'bg-green-200 text-green-800'
                            : validation.status === 'in-progress'
                            ? 'bg-yellow-200 text-yellow-800'
                            : validation.status === 'needs-enhancement'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {statusDisplay.icon} {statusDisplay.label}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress: {validation.progress}%</span>
                          <span>{validation.issues.length === 0 ? 'All requirements met' : `${validation.issues.length} issue(s)`}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              validation.status === 'complete' 
                                ? 'bg-green-500'
                                : validation.status === 'in-progress'
                                ? 'bg-yellow-500'
                                : validation.status === 'needs-enhancement'
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${validation.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Validating Indicator */}
                      {isValidating && (
                        <div className="mb-2 text-xs text-blue-600 italic">
                          🔍 Analyzing content semantically...
                        </div>
                      )}

                      {/* Semantic Analysis Results */}
                      {validation.semanticAnalysis && !isValidating && (
                        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs font-semibold text-blue-700 mb-1">
                            📊 Semantic Analysis:
                          </div>
                          {validation.semanticAnalysis.professionalQuality && (
                            <div className="text-xs text-blue-600 mb-1">
                              Quality Score: {validation.semanticAnalysis.professionalQuality.score}/10
                              {validation.semanticAnalysis.professionalQuality.notes && (
                                <span className="text-gray-600 ml-1">
                                  - {validation.semanticAnalysis.professionalQuality.notes}
                                </span>
                              )}
                            </div>
                          )}
                          {validation.semanticAnalysis.recommendations && validation.semanticAnalysis.recommendations.length > 0 && (
                            <div className="text-xs text-blue-700 mt-1">
                              <div className="font-medium mb-1">Recommendations:</div>
                              <ul className="space-y-1">
                                {validation.semanticAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Missing Items */}
                      {validation.issues.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-red-700 mb-1">Missing:</div>
                          <ul className="text-xs text-red-600 space-y-1">
                            {validation.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Category Badge */}
                      {template.category && (
                        <div className="text-xs text-gray-500 mt-2">
                          Category: <span className="font-medium">{template.category}</span>
                        </div>
                      )}

                      {/* Program-Specific Requirements */}
                      {programData?.categorized_requirements && template.category && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold text-blue-700 mb-2">
                            🎯 Program-Specific Requirements
                            {programData.program_name && (
                              <span className="text-gray-600 font-normal ml-1">
                                ({programData.program_name})
                              </span>
                            )}
                          </div>
                          {(() => {
                            const programReqs = getProgramRequirementsForSection(
                              programData.categorized_requirements,
                              template.category
                            );
                            if (programReqs.length === 0) {
                              return (
                                <div className="text-xs text-gray-500 italic">
                                  No program-specific requirements for this section
                                </div>
                              );
                            }
                            return (
                              <ul className="text-xs text-blue-700 space-y-1">
                                {programReqs.slice(0, 3).map((req, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span>•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                                {programReqs.length > 3 && (
                                  <li className="text-gray-500 italic">
                                    +{programReqs.length - 3} more requirement(s)
                                  </li>
                                )}
                              </ul>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => {
                          onNavigateToSection(index);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Go to Section
                      </button>
                      {validation.issues.length > 0 && (
                        <button
                          onClick={() => {
                            onGenerateMissingContent(section.key);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Generate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

