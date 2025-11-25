import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import type { SectionTemplate, DocumentTemplate } from '@/features/editor/templates/types';

export interface TemplateOverviewPanelProps {
  sections: SectionTemplate[];
  documents: DocumentTemplate[];
  programName?: string;
  onToggleSection: (sectionId: string, enabled: boolean) => void;
  onToggleDocument: (documentId: string, enabled: boolean) => void;
  onStartEditing: () => void;
  disabledSections?: Set<string>;
  disabledDocuments?: Set<string>;
}

export function TemplateOverviewPanel({
  sections,
  documents,
  programName,
  onToggleSection,
  onToggleDocument,
  onStartEditing,
  disabledSections = new Set(),
  disabledDocuments = new Set()
}: TemplateOverviewPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDocumentExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocuments(newExpanded);
  };

  // Separate sections by visibility
  const essentialSections = sections.filter(s => 
    !s.visibility || s.visibility === 'essential' || (s.visibility === 'advanced' && showAdvanced)
  );
  const programOnlySections = sections.filter(s => s.visibility === 'programOnly');
  const advancedSections = sections.filter(s => s.visibility === 'advanced' && !showAdvanced);

  const getOriginBadge = (origin?: string, programId?: string) => {
    if (origin === 'program') {
      return (
        <Badge variant="info" className="bg-blue-500/20 text-blue-100 border border-blue-400/30">
          {programName ? `Required by ${programName}` : 'Program-specific'}
        </Badge>
      );
    }
    if (origin === 'custom') {
      return (
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 border border-purple-400/30">
          Custom
        </Badge>
      );
    }
    return null;
  };

  const getSeverityBadge = (severity?: string, required?: boolean) => {
    if (severity === 'hard' || required) {
      return (
        <Badge variant="danger" className="bg-red-500/20 text-red-100 border border-red-400/30">
          Required
        </Badge>
      );
    }
    if (severity === 'soft') {
      return (
        <Badge variant="warning" className="bg-amber-500/20 text-amber-100 border border-amber-400/30">
          Recommended
        </Badge>
      );
    }
    return null;
  };

  const cardClasses = 'relative rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-xl overflow-visible';

  return (
    <div className="w-full space-y-4 mt-4">
      <Card className={cardClasses}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-3xl" />
        <div className="relative z-10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold uppercase tracking-wider text-white">
              Template Overview
            </h3>
            {programName && (
              <Badge variant="info" className="bg-blue-600/40 text-white border border-blue-400/50">
                {programName}
              </Badge>
            )}
          </div>

          {/* Sections Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Plan Sections</h4>
              {advancedSections.length > 0 && (
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-blue-300 hover:text-blue-100 transition-colors"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced ({advancedSections.length})
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {essentialSections.map((section) => {
                const isDisabled = disabledSections.has(section.id);
                const isExpanded = expandedSections.has(section.id);
                const canToggle = !section.required;

                return (
                  <div
                    key={section.id}
                    className={`rounded-xl border ${
                      isDisabled
                        ? 'border-white/5 bg-white/5 opacity-50'
                        : 'border-white/10 bg-white/5'
                    } p-3 transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      {canToggle && (
                        <div className="pt-1">
                          <Switch
                            checked={!isDisabled}
                            onCheckedChange={(checked) => onToggleSection(section.id, checked)}
                            size="sm"
                            className="bg-slate-700 data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-white truncate">
                              {section.title}
                            </h5>
                            <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                              {section.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {getOriginBadge(section.origin, section.programId)}
                            {getSeverityBadge(section.severity, section.required)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60 mt-2">
                          <span>{section.wordCountMin}-{section.wordCountMax} words</span>
                          {section.prompts && section.prompts.length > 0 && (
                            <button
                              onClick={() => toggleSectionExpanded(section.id)}
                              className="text-blue-300 hover:text-blue-100 transition-colors"
                            >
                              {isExpanded ? 'Hide' : 'Show'} prompts ({section.prompts.length})
                            </button>
                          )}
                        </div>
                        {isExpanded && section.prompts && section.prompts.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-blue-500/30 space-y-1">
                            {section.prompts.map((prompt, idx) => (
                              <p key={idx} className="text-xs text-white/70">
                                • {prompt}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {programOnlySections.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h5 className="text-sm font-semibold text-white/80 mb-2">
                    Program-Specific Sections
                  </h5>
                  <div className="space-y-2">
                    {programOnlySections.map((section) => {
                      const isDisabled = disabledSections.has(section.id);
                      const isExpanded = expandedSections.has(section.id);

                      return (
                        <div
                          key={section.id}
                          className={`rounded-xl border ${
                            isDisabled
                              ? 'border-white/5 bg-white/5 opacity-50'
                              : 'border-blue-500/30 bg-blue-500/10'
                          } p-3 transition-all`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-1">
                              <Switch
                                checked={!isDisabled}
                                onCheckedChange={(checked) => onToggleSection(section.id, checked)}
                                size="sm"
                                className="bg-slate-700 data-[state=checked]:bg-blue-600"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-white truncate">
                                    {section.title}
                                  </h5>
                                  <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                                    {section.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {getOriginBadge(section.origin, section.programId)}
                                  {getSeverityBadge(section.severity, section.required)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-lg font-semibold text-white">Required Attachments</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {documents.map((doc) => {
                const isDisabled = disabledDocuments.has(doc.id);
                const isExpanded = expandedDocuments.has(doc.id);
                const canToggle = !doc.required;

                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl border ${
                      isDisabled
                        ? 'border-white/5 bg-white/5 opacity-50'
                        : 'border-white/10 bg-white/5'
                    } p-3 transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      {canToggle && (
                        <div className="pt-1">
                          <Switch
                            checked={!isDisabled}
                            onCheckedChange={(checked) => onToggleDocument(doc.id, checked)}
                            size="sm"
                            className="bg-slate-700 data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-white truncate">
                              {doc.name}
                            </h5>
                            <p className="text-xs text-white/70 mt-0.5 line-clamp-1">
                              {doc.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {getOriginBadge(doc.origin, doc.programId)}
                            {getSeverityBadge(undefined, doc.required)}
                            <Badge variant="neutral" className="bg-slate-700/50 text-white/80 border border-slate-600/50">
                              {doc.format.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60 mt-2">
                          <span>Max size: {doc.maxSize}</span>
                          {doc.instructions && doc.instructions.length > 0 && (
                            <button
                              onClick={() => toggleDocumentExpanded(doc.id)}
                              className="text-blue-300 hover:text-blue-100 transition-colors"
                            >
                              {isExpanded ? 'Hide' : 'Show'} requirements
                            </button>
                          )}
                        </div>
                        {isExpanded && doc.instructions && doc.instructions.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-blue-500/30 space-y-1">
                            {doc.instructions.map((instruction, idx) => (
                              <p key={idx} className="text-xs text-white/70">
                                • {instruction}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Start Editing Button */}
          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={onStartEditing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Editing
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

