import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { DesktopEditForm } from './DesktopEditForm';
import type { SectionTemplate, DocumentTemplate } from '@templates';

type DesktopTemplateColumnsProps = {
  // Documents column
  filteredDocuments: DocumentTemplate[];
  disabledDocuments: Set<string>;
  enabledDocumentsCount: number;
  expandedDocumentId: string | null;
  editingDocument: DocumentTemplate | null;
  selectedProductMeta: { value: string; label: string; description: string; icon?: string } | null;
  clickedDocumentId: string | null;
  showAddDocument: boolean;
  newDocumentName: string;
  newDocumentDescription: string;
  onToggleDocument: (id: string) => void;
  onSelectDocument: (id: string | null) => void;
  onEditDocument: (doc: DocumentTemplate, e: React.MouseEvent) => void;
  onSaveDocument: (item: SectionTemplate | DocumentTemplate) => void;
  onCancelEdit: () => void;
  onToggleAddDocument: () => void;
  onAddCustomDocument: () => void;
  onSetNewDocumentName: (name: string) => void;
  onSetNewDocumentDescription: (desc: string) => void;
  onRemoveCustomDocument: (id: string) => void;
  getOriginBadge: (origin?: string, isSelected?: boolean) => React.ReactNode;
  // Sections column
  filteredSections: SectionTemplate[];
  disabledSections: Set<string>;
  expandedSectionId: string | null;
  editingSection: SectionTemplate | null;
  showAddSection: boolean;
  newSectionTitle: string;
  newSectionDescription: string;
  onToggleSection: (id: string) => void;
  onEditSection: (section: SectionTemplate, e: React.MouseEvent) => void;
  onSaveSection: (item: SectionTemplate | DocumentTemplate) => void;
  onToggleAddSection: () => void;
  onAddCustomSection: () => void;
  onSetNewSectionTitle: (title: string) => void;
  onSetNewSectionDescription: (desc: string) => void;
  onRemoveCustomSection: (id: string) => void;
};

export function DesktopTemplateColumns({
  filteredDocuments,
  disabledDocuments,
  enabledDocumentsCount,
  expandedDocumentId,
  editingDocument,
  selectedProductMeta,
  clickedDocumentId,
  showAddDocument,
  newDocumentName,
  newDocumentDescription,
  onToggleDocument,
  onSelectDocument,
  onEditDocument,
  onSaveDocument,
  onCancelEdit,
  onToggleAddDocument,
  onAddCustomDocument,
  onSetNewDocumentName,
  onSetNewDocumentDescription,
  onRemoveCustomDocument,
  getOriginBadge,
  filteredSections,
  disabledSections,
  expandedSectionId,
  editingSection,
  showAddSection,
  newSectionTitle,
  newSectionDescription,
  onToggleSection,
  onEditSection,
  onSaveSection,
  onToggleAddSection,
  onAddCustomSection,
  onSetNewSectionTitle,
  onSetNewSectionDescription,
  onRemoveCustomSection
}: DesktopTemplateColumnsProps) {
  return (
    <>
      {/* Column 2: Documents */}
      <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
        <div className="flex-shrink-0" data-column="documents">
          <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
            Deine Dokumente ({enabledDocumentsCount})
          </h2>
        </div>
        <p className="text-[10px] text-white/50 mb-1 flex-shrink-0 -mt-2">
          Entscheide welche zusätzlichen Dokumente zu deinem Plan hinzufügt werden.
        </p>
        <div className="text-[9px] text-white/40 mb-2 flex-shrink-0 flex items-center gap-3 -mt-1">
          <span className="flex items-center gap-1">
            <span>✏️</span>
            <span>Bearbeiten</span>
          </span>
          <span className="flex items-center gap-1">
            <input type="checkbox" className="w-2.5 h-2.5" disabled />
            <span>Hinzufügen/Deselektieren</span>
          </span>
          <span className="flex items-center gap-1">
            <span>👆</span>
            <span>Inhalte Öffnen</span>
          </span>
        </div>
        
        {expandedDocumentId && editingDocument ? (
          <DesktopEditForm
            type="document"
            item={editingDocument}
            onSave={onSaveDocument}
            onCancel={onCancelEdit}
            getOriginBadge={getOriginBadge}
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min pb-2">
            {/* Add Document Button - moved to left of product card */}
            {!expandedDocumentId && (
              <button
                type="button"
                onClick={onToggleAddDocument}
                className={`relative w-full border rounded-lg p-2.5 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                  showAddDocument
                    ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                    : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
                }`}
              >
                <span className="text-2xl leading-none">＋</span>
                <span>Dokument hinzufügen</span>
              </button>
            )}
            
            {/* Main Document Card - Core Product */}
            {selectedProductMeta && !expandedDocumentId && (
              <div 
                onClick={() => {
                  // Select core product (null) to show all sections
                  onSelectDocument(null);
                }}
                className={`relative border rounded-lg p-2.5 cursor-pointer transition-all group ${
                  clickedDocumentId === null
                    ? 'border-blue-400/60 bg-blue-600/20 ring-2 ring-blue-400/40' // Selected
                    : clickedDocumentId
                    ? 'border-blue-300/30 bg-blue-500/5 opacity-50' // Unselected when another is selected
                    : 'border-blue-500/50 bg-blue-500/10' // Normal blue when no selection
                } hover:border-blue-400/60`}
              >
                <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                  <div className={`w-3.5 h-3.5 rounded border-2 ${
                    clickedDocumentId === null
                      ? 'border-blue-500 bg-blue-600/30' 
                      : clickedDocumentId
                      ? 'border-blue-300/50 bg-blue-600/20'
                      : 'border-blue-500 bg-blue-600/30'
                  } flex items-center justify-center`}>
                    <svg className="w-2 h-2 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 pt-4 min-h-[50px]">
                  <span className="text-2xl leading-none flex-shrink-0">
                    {selectedProductMeta.icon ?? '📄'}
                  </span>
                  <div className="w-full text-center min-h-[28px] flex items-center justify-center">
                    <h4 className="text-[11px] font-semibold leading-snug text-white break-words line-clamp-2">
                      {selectedProductMeta.label}
                    </h4>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add Document Form */}
            {showAddDocument && !expandedDocumentId && (
              <div className="col-span-3 border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                <p className="text-xs text-white/80 font-semibold mb-2">Ein benutzerdefiniertes Dokument zu Ihrem Plan hinzufügen</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">Name *</label>
                    <input
                      type="text"
                      value={newDocumentName}
                      onChange={(e) => onSetNewDocumentName(e.target.value)}
                      placeholder="z.B. Finanzplan"
                      className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">Beschreibung</label>
                    <textarea
                      value={newDocumentDescription}
                      onChange={(e) => onSetNewDocumentDescription(e.target.value)}
                      placeholder="Optionale Beschreibung des Dokuments"
                      rows={2}
                      className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={onAddCustomDocument}
                    disabled={!newDocumentName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    onClick={onToggleAddDocument}
                    variant="ghost"
                    className="text-white/60 hover:text-white text-xs px-3 py-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
            
            {/* Document Cards */}
            {filteredDocuments.map((doc) => {
              const isDisabled = disabledDocuments.has(doc.id);
              const isRequired = doc.required;
              
              const isSelected = clickedDocumentId === doc.id;
              const isUnselected = clickedDocumentId && clickedDocumentId !== doc.id;
              
              return (
                <div
                  key={doc.id}
                  onClick={(e) => {
                    // Clicking the card body selects the document (filters sections) but doesn't open edit form
                    // Only the pencil button opens the edit form
                    const target = e.target as HTMLElement;
                    
                    // Don't trigger card click for checkbox, buttons, or badges
                    if (
                      target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox'
                    ) {
                      return; // Let checkbox handle its own click
                    }
                    if (
                      target.closest('button') || 
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[data-badge="true"]') || // Badge wrapper
                      target.closest('[class*="Badge"]') || // Badge element
                      target.getAttribute('data-badge') === 'true'
                    ) {
                      return; // Don't trigger card click for buttons, checkboxes, or badges
                    }
                    // Select document to filter sections (but don't open edit form)
                    onSelectDocument(doc.id);
                  }}
                  className={`relative border rounded-lg p-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-400/60 bg-blue-600/20 ring-2 ring-blue-400/40' // Selected document
                      : isUnselected
                      ? 'border-white/10 bg-white/5 opacity-50' // Unselected when another is selected
                      : isDisabled 
                      ? 'border-white/10 bg-white/5 opacity-60' 
                      : isRequired
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/20 bg-white/10'
                  } hover:border-white/40 group`}
                >
                  <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditDocument(doc, e);
                      }}
                      className="text-white/60 hover:text-white text-xs transition-opacity"
                    >
                      ✏️
                    </button>
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        // Toggle document - the toggle function will check if it's required
                        onToggleDocument(doc.id);
                      }}
                      onMouseDown={(e) => {
                        // Stop propagation to prevent card click
                        e.stopPropagation();
                      }}
                      className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                        isDisabled
                          ? 'border-white/30 bg-white/10'
                          : isRequired
                          ? 'border-amber-500 bg-amber-600/30 opacity-90'
                          : 'border-blue-500 bg-blue-600/30'
                      } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                    />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full">
                    <span className="text-2xl leading-none flex-shrink-0">📄</span>
                    <div className="w-full text-center min-h-[28px] flex items-center justify-center gap-1">
                      <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                        {doc.name}
                      </h4>
                      {/* Badge - non-clickable, shows selection state */}
                      {getOriginBadge(doc.origin, isSelected) && (
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Badge is not clickable - don't open card or select document
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="inline-block select-none"
                          data-badge="true"
                        >
                          {getOriginBadge(doc.origin, isSelected)}
                        </span>
                      )}
                    </div>
                    {doc.origin === 'custom' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveCustomDocument(doc.id);
                        }}
                        className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Column 3: Sections */}
      <div className="flex flex-col gap-2 border-r border-white/10 pr-4 h-full overflow-hidden">
        <div className="flex-shrink-0" data-column="sections">
          <h2 className="text-base font-bold uppercase tracking-wide text-white mb-2 pb-2 border-b border-white/10">
            Deine Abschnitte ({filteredSections.length})
          </h2>
        </div>
        <p className="text-[10px] text-white/50 mb-1 flex-shrink-0 -mt-2">
          Entscheide welche Abschnitte du in dein Dokument miteinbeziehst.
        </p>
        <div className="text-[9px] text-white/40 mb-2 flex-shrink-0 flex items-center gap-3 -mt-1">
          <span className="flex items-center gap-1">
            <span>✏️</span>
            <span>Bearbeiten</span>
          </span>
          <span className="flex items-center gap-1">
            <input type="checkbox" className="w-2.5 h-2.5" disabled />
            <span>Zu Dokument hinzufügen</span>
          </span>
        </div>
        
        {expandedSectionId && editingSection ? (
          <DesktopEditForm
            type="section"
            item={editingSection}
            onSave={onSaveSection}
            onCancel={onCancelEdit}
            getOriginBadge={getOriginBadge}
          />
        ) : filteredSections.length === 0 && clickedDocumentId ? (
          // If document has no related sections, show only "Abschnitt hinzufügen"
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleAddSection}
              className={`relative w-full max-w-[200px] border rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                showAddSection
                  ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                  : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
              }`}
            >
              <span className="text-2xl leading-none">＋</span>
              <span>Abschnitt hinzufügen</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto min-h-0 pr-1 auto-rows-min pb-2">
            {!expandedSectionId && (
              <button
                type="button"
                onClick={onToggleAddSection}
                className={`relative w-full border rounded-lg p-2.5 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-semibold tracking-tight transition-all ${
                  showAddSection
                    ? 'border-blue-400/60 bg-blue-600/30 text-white shadow-lg shadow-blue-900/40'
                    : 'border-white/20 bg-white/10 text-white/70 hover:border-white/40 hover:text-white'
                }`}
              >
                <span className="text-2xl leading-none">＋</span>
                <span>Abschnitt hinzufügen</span>
              </button>
            )}
            {showAddSection && !expandedSectionId && (
              <div className="col-span-3 border border-white/20 bg-white/10 rounded-lg p-3 space-y-2">
                <p className="text-xs text-white/80 font-semibold mb-2">Einen benutzerdefinierten Abschnitt zu Ihrem Plan hinzufügen</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">Titel *</label>
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => onSetNewSectionTitle(e.target.value)}
                      placeholder="z.B. Executive Summary"
                      className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/70 block mb-1">Beschreibung</label>
                    <textarea
                      value={newSectionDescription}
                      onChange={(e) => onSetNewSectionDescription(e.target.value)}
                      placeholder="Optionale Beschreibung des Abschnitts"
                      rows={2}
                      className="w-full rounded border border-white/30 bg-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60 resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={onAddCustomSection}
                    disabled={!newSectionTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hinzufügen
                  </Button>
                  <Button
                    onClick={onToggleAddSection}
                    variant="ghost"
                    className="text-white/60 hover:text-white text-xs px-3 py-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}
            {filteredSections.map((section) => {
              const isDisabled = disabledSections.has(section.id);
              const isRequired = section.required;
              
              return (
                <div
                  key={section.id}
                  onClick={(e) => {
                    // Clicking the card expands it for editing (ONLY when clicking the pencil button)
                    // All other clicks (badge, checkbox, card body) should NOT open the card
                    const target = e.target as HTMLElement;
                    
                    // Don't trigger card click for anything except the pencil button
                    if (
                      target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox'
                    ) {
                      return; // Let checkbox handle its own click
                    }
                    if (
                      target.closest('button') || 
                      target.closest('input[type="checkbox"]') ||
                      target.closest('[data-badge="true"]') || // Badge wrapper
                      target.closest('[class*="Badge"]') || // Badge element
                      target.getAttribute('data-badge') === 'true'
                    ) {
                      return; // Don't trigger card click for buttons, checkboxes, or badges
                    }
                    // Don't open card on card body click - only pencil button opens it
                    return;
                  }}
                  className={`relative border rounded-lg p-2.5 cursor-pointer ${
                    isDisabled 
                      ? 'border-white/10 bg-white/5 opacity-60' 
                      : isRequired
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/20 bg-white/10'
                  } hover:border-white/40 group`}
                >
                  <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditSection(section, e);
                      }}
                      className="text-white/60 hover:text-white text-xs transition-opacity"
                    >
                      ✏️
                    </button>
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        // Toggle section - the toggle function will check if it's required
                        onToggleSection(section.id);
                      }}
                      onMouseDown={(e) => {
                        // Stop propagation to prevent card click
                        e.stopPropagation();
                      }}
                      className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                        isDisabled
                          ? 'border-white/30 bg-white/10'
                          : isRequired
                          ? 'border-amber-500 bg-amber-600/30 opacity-90'
                          : 'border-blue-500 bg-blue-600/30'
                      } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                    />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full">
                    <span className="text-2xl leading-none flex-shrink-0">📋</span>
                    <div className="w-full text-center min-h-[28px] flex items-center justify-center gap-1">
                      <h4 className={`text-[11px] font-semibold leading-snug ${isDisabled ? 'text-white/50 line-through' : 'text-white'} break-words line-clamp-2`}>
                        {section.title}
                      </h4>
                      {/* Badge - non-clickable */}
                      {getOriginBadge(section.origin, false) && (
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Badge is not clickable - don't open card
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="inline-block select-none"
                          data-badge="true"
                        >
                          {getOriginBadge(section.origin, false)}
                        </span>
                      )}
                    </div>
                    {section.origin === 'custom' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemoveCustomSection(section.id);
                        }}
                        className="text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

