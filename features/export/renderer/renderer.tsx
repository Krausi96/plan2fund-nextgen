// ========= PLAN2FUND — EXPORT PREVIEW RENDERER =========
// Lightweight component that renders plan previews inside the editor

import React, { useState } from 'react';
import { PlanDocument, Table, TitlePage } from '@/features/editor/types/plan';
import { METADATA_SECTION_ID, ANCILLARY_SECTION_ID, REFERENCES_SECTION_ID, APPENDICES_SECTION_ID } from '@/features/editor/hooks/useEditorStore';

function formatTableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase());
}

function renderTable(table: Table) {
  if (!table.rows || table.rows.length === 0) {
    return null;
  }
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 border-b border-gray-200">Item</th>
            {table.columns.map((column, index) => (
              <th key={index} className="text-right px-3 py-2 border-b border-gray-200">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700">{row.label}</td>
              {row.values.map((value, valueIndex) => (
                <td key={valueIndex} className="px-3 py-2 text-right text-gray-600">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface PreviewOptions {
  showWatermark?: boolean;
  watermarkText?: string;
  previewMode?: 'preview' | 'formatted' | 'print';
  selectedSections?: Set<string>;
  previewSettings?: {
    showWordCount?: boolean;
    showCharacterCount?: boolean;
    showCompletionStatus?: boolean;
    enableRealTimePreview?: boolean;
  };
}

interface ExportRendererProps extends PreviewOptions {
  plan: PlanDocument;
  style?: React.CSSProperties;
  onSectionClick?: (sectionId: string) => void;
  editingSectionId?: string | null;
  onTitlePageChange?: (titlePage: TitlePage) => void;
  onAncillaryChange?: (updates: Partial<any>) => void;
  onReferenceAdd?: (reference: any) => void;
  onReferenceUpdate?: (reference: any) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onAppendixAdd?: (item: any) => void;
  onAppendixUpdate?: (item: any) => void;
  onAppendixDelete?: (appendixId: string) => void;
}

function ExportRenderer({
  plan,
  showWatermark = false,
  watermarkText = 'DRAFT',
  previewMode = 'preview',
  selectedSections,
  previewSettings = {},
  style,
  onSectionClick,
  editingSectionId = null,
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete
}: ExportRendererProps) {
  // Track which field is currently being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [pendingField, setPendingField] = useState<string | null>(null);

  const isEditingMetadata = editingSectionId === METADATA_SECTION_ID;
  const isEditingAncillary = editingSectionId === ANCILLARY_SECTION_ID;
  const isEditingReferences = editingSectionId === REFERENCES_SECTION_ID;
  const isEditingAppendices = editingSectionId === APPENDICES_SECTION_ID;

  // Auto-start editing pending field when edit mode is enabled
  React.useEffect(() => {
    if ((isEditingMetadata || isEditingAncillary || isEditingReferences || isEditingAppendices) && pendingField && !editingField) {
      setEditingField(pendingField);
      // Get current value from plan
      let currentValue = '';
      if (isEditingMetadata) {
        currentValue = pendingField === 'title' ? plan.settings.titlePage?.title || '' :
                        pendingField === 'subtitle' ? plan.settings.titlePage?.subtitle || '' :
                        pendingField === 'companyName' ? plan.settings.titlePage?.companyName || '' :
                        pendingField === 'legalForm' ? plan.settings.titlePage?.legalForm || '' :
                        pendingField === 'teamHighlight' ? plan.settings.titlePage?.teamHighlight || '' :
                        pendingField === 'author' ? plan.settings.titlePage?.author || plan.settings.titlePage?.companyName || '' :
                        pendingField === 'email' ? plan.settings.titlePage?.contactInfo?.email || '' :
                        pendingField === 'phone' ? plan.settings.titlePage?.contactInfo?.phone || '' :
                        pendingField === 'website' ? plan.settings.titlePage?.contactInfo?.website || '' :
                        pendingField === 'address' ? plan.settings.titlePage?.contactInfo?.address || plan.settings.titlePage?.headquartersLocation || '' :
                        pendingField === 'date' ? plan.settings.titlePage?.date || new Date().toISOString().split('T')[0] :
                        pendingField === 'confidentialityStatement' ? plan.settings.titlePage?.confidentialityStatement || '' : '';
      } else if (isEditingReferences && pendingField.startsWith('ref-')) {
        const [, type, id] = pendingField.split('-');
        const ref = plan.references?.find(r => r.id === id);
        if (ref) {
          currentValue = type === 'citation' ? ref.citation || '' : ref.url || '';
        }
      } else if (isEditingAncillary && pendingField.startsWith('toc-')) {
        const [, type, id] = pendingField.split('-');
        const entry = plan.ancillary?.tableOfContents?.find(e => e.id === id);
        if (entry) {
          currentValue = type === 'title' ? entry.title || '' :
                        type === 'page' ? String(entry.page || '') : '';
        }
      } else if (isEditingAncillary && pendingField.startsWith('table-')) {
        const [, type, id] = pendingField.split('-');
        const entry = plan.ancillary?.listOfTables?.find(e => e.id === id);
        if (entry) {
          currentValue = type === 'label' ? entry.label || '' :
                        type === 'page' ? String(entry.page || '') : '';
        }
      } else if (isEditingAncillary && pendingField.startsWith('figure-')) {
        const [, type, id] = pendingField.split('-');
        const entry = plan.ancillary?.listOfIllustrations?.find(e => e.id === id);
        if (entry) {
          currentValue = type === 'label' ? entry.label || '' :
                        type === 'page' ? String(entry.page || '') : '';
        }
      } else if (isEditingAppendices && pendingField.startsWith('appendix-')) {
        const [, type, id] = pendingField.split('-');
        const appendix = plan.appendices?.find(a => a.id === id);
        if (appendix) {
          currentValue = type === 'title' ? appendix.title || '' :
                        type === 'description' ? appendix.description || '' :
                        type === 'fileUrl' ? appendix.fileUrl || '' : '';
        }
      }
      setEditValue(currentValue);
      setPendingField(null);
    }
  }, [isEditingMetadata, isEditingAncillary, isEditingReferences, isEditingAppendices, pendingField, editingField, plan]);
  
  const sectionsToRender = selectedSections && selectedSections.size > 0
    ? plan.sections.filter(section => selectedSections.has(section.key))
    : plan.sections;

  // Language support
  const isGerman = plan.language === 'de';
  const t = {
    businessPlan: isGerman ? 'Geschäftsplan' : 'Business Plan',
    tableOfContents: isGerman ? 'Inhaltsverzeichnis' : 'Table of Contents',
    listOfTables: isGerman ? 'Tabellenverzeichnis' : 'List of Tables',
    listOfFigures: isGerman ? 'Abbildungsverzeichnis' : 'List of Figures',
    references: isGerman ? 'Referenzen' : 'References',
    appendices: isGerman ? 'Anhänge' : 'Appendices',
    email: isGerman ? 'E-Mail' : 'Email',
    phone: isGerman ? 'Telefon' : 'Phone',
    website: isGerman ? 'Website' : 'Website',
    page: isGerman ? 'Seite' : 'Page',
    noTablesYet: isGerman ? 'Noch keine Tabellen hinzugefügt. Tabellen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No tables added yet. Tables will appear here once you add them to your sections.',
    noFiguresYet: isGerman ? 'Noch keine Abbildungen hinzugefügt. Bilder und Abbildungen erscheinen hier, sobald Sie sie zu Ihren Abschnitten hinzufügen.' : 'No figures added yet. Images and figures will appear here once you add them to your sections.',
    noReferencesYet: isGerman ? 'Noch keine Referenzen hinzugefügt. Fügen Sie Zitate und Referenzen hinzu, um Ihren Geschäftsplan zu unterstützen.' : 'No references added yet. Add citations and references to support your business plan.',
    noAppendicesYet: isGerman ? 'Noch keine Anhänge hinzugefügt. Fügen Sie ergänzende Materialien, Dokumente oder zusätzliche Informationen hier hinzu.' : 'No appendices added yet. Add supplementary materials, documents, or additional information here.',
    figure: isGerman ? 'Abbildung' : 'Figure'
  };

  // Helper function to handle title page field updates
  const handleTitlePageFieldUpdate = (path: (string | number)[], value: string) => {
    if (!onTitlePageChange || !plan.settings.titlePage) return;
    
    const currentTitlePage = plan.settings.titlePage as any;
    const currentContactInfo = currentTitlePage.contactInfo || {};
    
    // Build updated contactInfo ensuring required fields
    const updatedContactInfo: any = {
      name: currentContactInfo.name || currentTitlePage.companyName || currentTitlePage.author || '',
      email: currentContactInfo.email || '',
      phone: currentContactInfo.phone,
      website: currentContactInfo.website,
      address: currentContactInfo.address
    };

    // Build updated title page
    let updated: any = {
      ...currentTitlePage,
      planTitle: currentTitlePage.planTitle || currentTitlePage.title || '',
      companyName: currentTitlePage.companyName || '',
      date: currentTitlePage.date || new Date().toISOString().split('T')[0],
      contactInfo: updatedContactInfo
    };

    if (path[0] === 'contactInfo' && typeof path[1] === 'string') {
      updated.contactInfo[path[1]] = value;
      // Ensure required fields are still present
      if (!updated.contactInfo.name) {
        updated.contactInfo.name = updated.companyName || '';
      }
      if (!updated.contactInfo.email) {
        updated.contactInfo.email = '';
      }
    } else if (typeof path[0] === 'string') {
      updated[path[0]] = value;
    }

    onTitlePageChange(updated as TitlePage);
  };

  // Helper function to render editable text field
  const renderEditableField = (
    fieldKey: string,
    value: string,
    onSave: (value: string) => void,
    className: string = '',
    placeholder?: string,
    multiline: boolean = false
  ) => {
    const isEditing = isEditingMetadata && editingField === fieldKey;
    
    if (isEditing) {
      const Component = multiline ? 'textarea' : 'input';
      const inputProps = {
        value: editValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setEditValue(e.target.value);
        },
        onBlur: () => {
          onSave(editValue);
          setEditingField(null);
          setEditValue('');
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Escape') {
            setEditingField(null);
            setEditValue('');
          } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            onSave(editValue);
            setEditingField(null);
            setEditValue('');
          }
        },
        autoFocus: true,
        className: `${className} border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300`,
        placeholder
      };
      
      return <Component {...inputProps} />;
    }
    
    return (
      <span
        className={`${className} cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all ${
          isEditingMetadata 
            ? 'bg-blue-50/30 border border-blue-300' 
            : 'bg-blue-50/20 border border-blue-200/50'
        }`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent page click handler
          if (isEditingMetadata) {
            // Already in edit mode, start editing this field
            setEditingField(fieldKey);
            setEditValue(value || '');
          } else {
            // Not in edit mode, set pending field and enable edit mode
            setPendingField(fieldKey);
            onSectionClick?.(METADATA_SECTION_ID);
          }
        }}
        title="Click to edit"
      >
        {value || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}
        <span className="absolute -top-1 -right-1 opacity-70">
          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </span>
      </span>
    );
  };

  const renderTocEntry = (
    label: React.ReactNode,
    pageNumber?: number | string,
    options?: { isSubEntry?: boolean }
  ) => {
    const isSubEntry = options?.isSubEntry ?? false;
    return (
      <div
        className={`flex items-center ${isSubEntry ? 'ml-6 text-sm text-gray-700 font-medium' : 'text-base font-semibold text-gray-900'} py-1.5`}
      >
        <span className="min-w-0 truncate">
          {label}
        </span>
        <span className="flex-1 border-b border-dotted border-gray-300 mx-2" />
        {plan.settings.includePageNumbers && pageNumber !== undefined && (
          <span
            className={`${isSubEntry ? 'text-xs text-gray-600' : 'text-sm text-gray-800'} font-medium whitespace-nowrap`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`export-preview ${previewMode}`} style={style}>
      {showWatermark && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0">
          <div className="text-6xl font-bold text-gray-200 opacity-30 transform -rotate-45 select-none">
            {watermarkText}
          </div>
        </div>
      )}
      
      <div className="relative z-10" style={{ margin: 0, padding: 0 }}>
        {plan.settings.includeTitlePage && (() => {
          return (
            <div 
              className={`preview-title-page export-preview-page ${!isEditingMetadata ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
              data-section-id={METADATA_SECTION_ID}
              onClick={(e) => {
                // Allow clicking on child elements, but not on input fields, buttons, or links when editing
                const target = e.target as HTMLElement;
                if (isEditingMetadata) {
                  // When editing, only allow clicks on non-interactive elements
                  if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                    return;
                  }
                }
                // Trigger section click if not already editing
                if (!isEditingMetadata) {
                  onSectionClick?.(METADATA_SECTION_ID);
                }
              }}
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white',
                margin: 0,
                marginTop: 0,
                marginBottom: 0
              }}
            >
              <div className="export-preview-page-scaler">
              <div className="flex flex-col justify-between h-full py-16 px-10">
              {/* Top Section: Logo and Document Type */}
              <div className="flex-shrink-0 flex flex-col items-center mb-12">
                <div className="mb-8 relative">
                  {plan.settings.titlePage?.logoUrl ? (
                    <div className="relative group">
                      <img 
                        src={plan.settings.titlePage.logoUrl} 
                        alt="Company Logo" 
                        className="mx-auto h-24 object-contain" 
                      />
                      {isEditingMetadata && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && onTitlePageChange) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    handleTitlePageFieldUpdate(['logoUrl'], reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <label
                              htmlFor="logo-upload"
                              className="px-3 py-1 bg-white text-gray-800 text-xs rounded cursor-pointer hover:bg-gray-100"
                            >
                              Replace
                            </label>
                            <button
                              onClick={() => handleTitlePageFieldUpdate(['logoUrl'], '')}
                              className="px-3 py-1 bg-white text-gray-800 text-xs rounded hover:bg-gray-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded p-4">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload-empty"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onTitlePageChange) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                handleTitlePageFieldUpdate(['logoUrl'], reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="logo-upload-empty"
                        className={`px-4 py-2 text-xs rounded cursor-pointer block text-center transition-colors ${
                          isEditingMetadata 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {isEditingMetadata ? 'Upload Logo' : 'Click to Upload Logo'}
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 letter-spacing-wide">
                  {t.businessPlan}
                </p>
              </div>

              {/* Center Section: Title and Company Info */}
              <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto px-6">
                <h1 className="preview-title mb-4 text-3xl sm:text-4xl font-bold leading-tight text-slate-900 tracking-tight">
                  {renderEditableField(
                    'title',
                    plan.settings.titlePage?.title || '',
                    (value) => handleTitlePageFieldUpdate(['planTitle'], value),
                    'text-3xl sm:text-4xl font-bold leading-tight text-slate-900 tracking-tight',
                    'Plan Title'
                  )}
                </h1>
                
                {renderEditableField(
                  'subtitle',
                  plan.settings.titlePage?.subtitle || '',
                  (value) => handleTitlePageFieldUpdate(['valueProp'], value),
                  'text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block',
                  'Subtitle / Value Proposition',
                  true
                )}

                <div className="mb-4">
                  {renderEditableField(
                    'companyName',
                    plan.settings.titlePage?.companyName || '',
                    (value) => handleTitlePageFieldUpdate(['companyName'], value),
                    'text-lg font-semibold text-gray-800 block',
                    'Company Name'
                  )}
                  {renderEditableField(
                    'legalForm',
                    plan.settings.titlePage?.legalForm || '',
                    (value) => handleTitlePageFieldUpdate(['legalForm'], value),
                    'font-normal text-gray-600 ml-2',
                    'Legal Form (e.g., GmbH)'
                  )}
                  {renderEditableField(
                    'teamHighlight',
                    plan.settings.titlePage?.teamHighlight || '',
                    (value) => handleTitlePageFieldUpdate(['teamHighlight'], value),
                    'text-sm text-gray-600 italic mt-2 block',
                    'Team Highlight',
                    true
                  )}
                </div>
              </div>

              {/* Bottom Section: Author, Contact, Date */}
              <div className="flex-shrink-0 w-full mt-auto pt-10">
                <div className="mb-6">
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-semibold">{isGerman ? 'Autor' : 'Author'}:</span>{' '}
                    {renderEditableField(
                      'author',
                      plan.settings.titlePage?.author || plan.settings.titlePage?.companyName || '',
                      (value) => handleTitlePageFieldUpdate(['companyName'], value),
                      'font-normal',
                      'Author / Company Name'
                    )}
                  </p>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p>
                      <span className="font-medium text-gray-700">{t.email}:</span>{' '}
                      {renderEditableField(
                        'email',
                        plan.settings.titlePage?.contactInfo?.email || '',
                        (value) => handleTitlePageFieldUpdate(['contactInfo', 'email'], value),
                        '',
                        'email@example.com'
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">{t.phone}:</span>{' '}
                      {renderEditableField(
                        'phone',
                        plan.settings.titlePage?.contactInfo?.phone || '',
                        (value) => handleTitlePageFieldUpdate(['contactInfo', 'phone'], value),
                        '',
                        '+49 123 456789'
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700">{t.website}:</span>{' '}
                      {renderEditableField(
                        'website',
                        plan.settings.titlePage?.contactInfo?.website || '',
                        (value) => handleTitlePageFieldUpdate(['contactInfo', 'website'], value),
                        'text-blue-600 hover:text-blue-800 underline',
                        'https://example.com'
                      )}
                    </p>
                    <p className="mt-2">
                      <span className="font-medium text-gray-700">{isGerman ? 'Adresse' : 'Address'}:</span>{' '}
                      {renderEditableField(
                        'address',
                        plan.settings.titlePage?.contactInfo?.address || plan.settings.titlePage?.headquartersLocation || '',
                        (value) => handleTitlePageFieldUpdate(['contactInfo', 'address'], value),
                        '',
                        'City, Country'
                      )}
                    </p>
                  </div>
                </div>

                <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">{isGerman ? 'Datum' : 'Date'}:</span>{' '}
                      {renderEditableField(
                        'date',
                        plan.settings.titlePage?.date || new Date().toISOString().split('T')[0],
                        (value) => handleTitlePageFieldUpdate(['date'], value),
                        '',
                        'YYYY-MM-DD'
                      )}
                    </p>
                  </div>
                  <div className="text-right max-w-md">
                    {renderEditableField(
                      'confidentialityStatement',
                      plan.settings.titlePage?.confidentialityStatement || '',
                      (value) => handleTitlePageFieldUpdate(['confidentialityStatement'], value),
                      'text-xs text-gray-500 italic leading-relaxed block',
                      'Confidentiality Statement',
                      true
                    )}
                  </div>
                </div>
              </div>
              </div>
              </div>
            </div>
          );
        })()}

        <div 
          className={`export-preview-page export-preview-toc-page ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={ANCILLARY_SECTION_ID}
          onClick={(e) => {
            // Allow clicking on child elements, but not on input fields, buttons, or links when editing
            const target = e.target as HTMLElement;
            if (isEditingAncillary) {
              // When editing, only allow clicks on non-interactive elements
              if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                return;
              }
            }
            // Trigger section click if not already editing
            if (!isEditingAncillary) {
              onSectionClick?.(ANCILLARY_SECTION_ID);
            }
          }}
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white',
            margin: 0,
            marginTop: 0,
            marginBottom: 0
          }}
        >
          <div className="export-preview-page-scaler">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.tableOfContents}
            </h2>
            <div className="space-y-1">
            {/* Auto-generated entries from sections - editable */}
            {sectionsToRender.map((section, sectionIndex) => {
              const sectionNumber = section.fields?.sectionNumber ?? null;
              const sectionLabel = sectionNumber !== null ? `${sectionNumber}. ${section.title}` : section.title;
              const subchapters = section.fields?.subchapters || [];
              const sectionWordCount = section.content ? section.content.split(' ').length : 0;
              // Calculate page number: TOC is page 1 (or 2 if title page exists), sections start from there
              const sectionPageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);
              
              const isEditingTitle = isEditingAncillary && editingField === `toc-section-title-${section.key}`;
              
              return (
                <div key={section.key} className="space-y-1 group">
                  {renderTocEntry(
                    <span className="flex flex-col">
                      <span className="truncate flex items-center gap-2">
                        {isEditingTitle ? (
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              // Update the section title in the plan - this would need to be handled by parent
                              // For now, we can update the TOC entry if it exists in ancillary
                              setEditingField(null);
                              setEditValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingField(null);
                                setEditValue('');
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                setEditingField(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                            className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                          />
                        ) : (
                          <span
                            className={`cursor-pointer group/title relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 ${isEditingAncillary ? '' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEditingAncillary) {
                                setEditingField(`toc-section-title-${section.key}`);
                                setEditValue(section.title || '');
                              } else {
                                setPendingField(`toc-section-title-${section.key}`);
                                onSectionClick?.(ANCILLARY_SECTION_ID);
                              }
                            }}
                            title="Click to edit"
                          >
                            {sectionLabel}
                            {isEditingAncillary && (
                              <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                            )}
                            <span className="absolute -top-1 -right-1 opacity-70">
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          </span>
                        )}
                      </span>
                      {previewSettings.showWordCount && section.content && (
                        <span className="text-[11px] font-normal text-gray-500">
                          {sectionWordCount} words
                        </span>
                      )}
                    </span>,
                    sectionPageNumber
                  )}
                  {subchapters.length > 0 && (
                    <div className="ml-4 space-y-0.5">
                      {subchapters.map((sub: { id: string; title: string; numberLabel: string }) => {
                        const isEditingSubTitle = isEditingAncillary && editingField === `toc-sub-title-${sub.id}`;
                        return (
                          <React.Fragment key={sub.id}>
                            {renderTocEntry(
                              <span className="flex items-center gap-2">
                                {isEditingSubTitle ? (
                                  <input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      setEditingField(null);
                                      setEditValue('');
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        setEditingField(null);
                                        setEditValue('');
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setEditingField(null);
                                        setEditValue('');
                                      }
                                    }}
                                    autoFocus
                                    className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                  />
                                ) : (
                                  <span
                                    className={`cursor-pointer group/sub relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 ${isEditingAncillary ? '' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isEditingAncillary) {
                                        setEditingField(`toc-sub-title-${sub.id}`);
                                        setEditValue(sub.title || '');
                                      } else {
                                        setPendingField(`toc-sub-title-${sub.id}`);
                                        onSectionClick?.(ANCILLARY_SECTION_ID);
                                      }
                                    }}
                                    title="Click to edit"
                                  >
                                    {`${sub.numberLabel ? `${sub.numberLabel}. ` : ''}${sub.title}`}
                                    {isEditingAncillary && (
                                      <span className="text-xs text-gray-400 italic ml-2">(auto)</span>
                                    )}
                                    <span className="absolute -top-1 -right-1 opacity-70">
                                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </span>
                                  </span>
                                )}
                              </span>,
                              sectionPageNumber,
                              { isSubEntry: true }
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Manual TOC entries - read-only display only (not editable in TOC) */}
            {plan.ancillary?.tableOfContents?.filter(entry => !entry.hidden).map((entry) => {
              return (
                <div key={entry.id} className="space-y-1">
                  {renderTocEntry(
                    <span className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {entry.title || 'Untitled'}
                        <span className="text-xs text-gray-400 italic ml-2">(manual entry - edit in metadata panel)</span>
                      </span>
                    </span>,
                    entry.page ? String(entry.page) : undefined
                  )}
                </div>
              );
            })}
            {/* List of Tables in TOC */}
            {(() => {
              const hasTables = sectionsToRender.some((section) => 
                section.tables && Object.keys(section.tables || {}).length > 0
              );
              if (hasTables) {
                const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);
                return (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {renderTocEntry(t.listOfTables, listOfTablesPageNumber)}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* List of Figures in TOC */}
            {(() => {
              const hasFigures = sectionsToRender.some((section) => 
                section.figures && section.figures.length > 0
              );
              if (hasFigures) {
                const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;
                return (
                  <div>
                    {renderTocEntry(t.listOfFigures, listOfFiguresPageNumber)}
                  </div>
                );
              }
              return null;
            })()}
            
            {/* References in TOC */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              {renderTocEntry(
                t.references,
                sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2
              )}
            </div>
            
            {/* Appendices in TOC */}
            <div>
              {renderTocEntry(
                t.appendices,
                sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3
              )}
            </div>
            
            {/* Add new TOC entry button */}
            {isEditingAncillary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAncillaryChange) {
                    const updated = [
                      ...(plan.ancillary?.tableOfContents || []),
                      { id: `toc_${Date.now()}`, title: 'New entry', hidden: false }
                    ];
                    onAncillaryChange({ tableOfContents: updated });
                  }
                }}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
              >
                + Add TOC Entry
              </button>
            )}
            </div>
          {/* Footer with page number for TOC */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{t.page} {plan.settings.includeTitlePage ? 2 : 1}</span>
            </div>
          )}
          </div>
          </div>
        </div>

        {sectionsToRender.map((section, sectionIndex) => {
          const hasContent = section.content && section.content.trim().length > 0;
          const wordCount = section.content ? section.content.split(' ').length : 0;
          const charCount = section.content ? section.content.length : 0;
          const displayTitle = section.fields?.displayTitle || section.title;
          const actualStatus = section.status || (hasContent ? 'aligned' : 'missing');
          const isComplete = actualStatus === 'aligned';
          // Calculate page number: TOC is page 1 (or 2 if title page exists), sections start from there
          const pageNumber = sectionIndex + (plan.settings.includeTitlePage ? 2 : 1);
          
          return (
            <div 
              key={section.key}
              data-section-id={section.key}
              onClick={(e) => {
                // Only trigger if clicking the section container itself, not child elements
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-section-id]') === e.currentTarget) {
                  console.log('Section div clicked:', section.key);
                  onSectionClick?.(section.key);
                }
              }}
              className={`export-preview-page export-preview-section ${onSectionClick ? 'cursor-pointer hover:bg-blue-50/30 transition-colors rounded-lg' : ''}`}
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white',
                margin: 0,
                marginTop: 0,
                marginBottom: 0,
                position: 'relative'
              }}
            >
            {/* Click overlay to ensure clicks work - only on empty areas */}
            {onSectionClick && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={(e) => {
                  // Only trigger if clicking empty space, not content
                  const target = e.target as HTMLElement;
                  if (target === e.currentTarget || target.classList.contains('export-preview-page')) {
                    console.log('Click overlay triggered for section:', section.key);
                    onSectionClick(section.key);
                  }
                }}
                onPointerDown={(e) => {
                  // Allow clicks to pass through to content
                  const target = e.target as HTMLElement;
                  if (target.tagName !== 'DIV' || target.classList.contains('export-preview-page')) {
                    return;
                  }
                  e.stopPropagation();
                }}
                style={{ zIndex: 10, pointerEvents: 'none' }}
              />
            )}
            <div 
              className="export-preview-page-scaler" 
              style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}
              onClick={(e) => {
                // Click on section header to edit
                if (onSectionClick && (e.target as HTMLElement).tagName === 'H2') {
                  console.log('Section header clicked:', section.key);
                  onSectionClick(section.key);
                }
              }}
            >
            <div className="flex h-full flex-col space-y-4">
              <div className="border-b border-gray-200 pb-2 flex-shrink-0 flex items-start justify-between">
                <h2 
                  className="text-2xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    if (onSectionClick) {
                      e.stopPropagation();
                      console.log('Section title clicked:', section.key);
                      onSectionClick(section.key);
                    }
                  }}
                >
                  {displayTitle}
                </h2>
                {previewSettings.showCompletionStatus && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 ml-4">
                    {isComplete ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span className="hidden sm:inline">Complete</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        <span className="hidden sm:inline">Incomplete</span>
                      </span>
                    )}
                    {previewSettings.showWordCount && <span className="text-gray-400">• {wordCount} words</span>}
                    {previewSettings.showCharacterCount && <span className="text-gray-400">• {charCount} chars</span>}
                  </div>
                )}
              </div>

              <div
                className={`prose max-w-none flex-1 overflow-y-auto min-h-0 ${
                  previewMode === 'formatted' ? 'font-serif' : 'font-sans'
                }`}
              >
                {hasContent ? (
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: section.content || '' }}
                  />
                ) : (
                  <div className="text-gray-400 italic py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    No content available for this section
                  </div>
                )}
              </div>

              {/* Render Tables & Charts if they exist */}
              {section.tables && Object.keys(section.tables).length > 0 && (
                <div className="mt-6 space-y-4">
                  {Object.entries(section.tables).map(([tableKey, table]) => {
                    if (!table || !table.rows || table.rows.length === 0) return null;
                    return (
                      <div key={tableKey}>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          {formatTableLabel(tableKey)}
                        </h4>
                        {renderTable(table)}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Render Figures if they exist */}
              {section.figures && section.figures.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.figures.map((figure: any, idx) => (
                    <div key={figure.id || idx} className="space-y-2">
                      {figure.uri && (
                        <img
                          src={figure.uri}
                          alt={figure.altText || figure.title || 'Figure'}
                          className="w-full rounded-lg border border-gray-200"
                        />
                      )}
                      {(figure.caption || figure.description || figure.source || (figure.tags && figure.tags.length > 0)) && (
                        <div className="text-sm text-gray-600 space-y-1 mt-2">
                          {figure.description && <p className="text-xs text-gray-600">{figure.description}</p>}
                          {figure.caption && <p className="italic text-sm">{figure.caption}</p>}
                          {figure.source && <p className="text-xs text-gray-500">Source: {figure.source}</p>}
                          {figure.tags && figure.tags.length > 0 && (
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tags: {figure.tags.join(', ')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{t.page} {pageNumber}</span>
                </div>
              )}
            </div>
            </div>
          );
        })}

        {/* List of Tables */}
        {(() => {
          const allTables: Array<{
            id: string;
            name: string;
            description?: string;
            source?: string;
            tags?: string[];
            sectionTitle: string;
            sectionNumber: number | null;
          }> = [];
          sectionsToRender.forEach((section) => {
            const sectionNumber = section.fields?.sectionNumber ?? null;
            if (section.tables && Object.keys(section.tables).length > 0) {
              Object.keys(section.tables).forEach((tableKey) => {
                const metadata = section.fields?.tableMetadata?.[tableKey] ?? null;
                allTables.push({
                  id: metadata?.id || tableKey,
                  name: metadata?.name || formatTableLabel(tableKey),
                  description: metadata?.description,
                  source: metadata?.source,
                  tags: metadata?.tags,
                  sectionTitle: section.title,
                  sectionNumber
                });
              });
            }
          });

          const listOfTablesPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1);

          // Combine auto-generated and manual entries
          const manualTables = plan.ancillary?.listOfTables || [];
          const allEntries = [
            ...allTables.map(t => ({ ...t, isAuto: true })),
            ...manualTables.map(t => ({ 
              id: t.id, 
              name: t.label, 
              description: undefined, 
              source: undefined, 
              tags: undefined,
              sectionTitle: '',
              sectionNumber: null,
              page: t.page,
              isAuto: false 
            }))
          ];

          return (
            <div 
              className={`export-preview-page export-preview-section ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
              data-section-id={ANCILLARY_SECTION_ID}
              onClick={(e) => {
                // Allow clicking on child elements, but not on input fields, buttons, or links when editing
                const target = e.target as HTMLElement;
                if (isEditingAncillary) {
                  // When editing, only allow clicks on non-interactive elements
                  if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                    return;
                  }
                }
                // Trigger section click if not already editing
                if (!isEditingAncillary) {
                  onSectionClick?.(ANCILLARY_SECTION_ID);
                }
              }}
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white',
                margin: 0,
                marginTop: 0,
                marginBottom: 0
              }}
            >
            <div className="export-preview-page-scaler">
              <div className="section-block space-y-4">
                <div className="section-heading border-b border-gray-200/80 pb-3">
                  <h2 
                    className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEditingAncillary) {
                        onSectionClick?.(ANCILLARY_SECTION_ID);
                      }
                    }}
                  >
                    {t.listOfTables}
                  </h2>
                </div>
                {allEntries.length > 0 ? (
                  <div className="space-y-3">
                    {allEntries.map((table: any) => {
                      const isEditingLabel = isEditingAncillary && !table.isAuto && editingField === `table-label-${table.id}`;
                      const isEditingPage = isEditingAncillary && !table.isAuto && editingField === `table-page-${table.id}`;
                      
                      return (
                        <div key={table.id} className={`text-sm text-gray-700 space-y-0.5 group ${table.isAuto ? '' : ''}`}>
                          <div className="flex items-center gap-2">
                            {isEditingLabel ? (
                              <input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => {
                                  if (onAncillaryChange && !table.isAuto) {
                                    const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                      t.id === table.id ? { ...t, label: editValue } : t
                                    );
                                    onAncillaryChange({ listOfTables: updated });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingField(null);
                                    setEditValue('');
                                  } else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (onAncillaryChange && !table.isAuto) {
                                      const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                        t.id === table.id ? { ...t, label: editValue } : t
                                      );
                                      onAncillaryChange({ listOfTables: updated });
                                    }
                                    setEditingField(null);
                                    setEditValue('');
                                  }
                                }}
                                autoFocus
                                className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                              />
                            ) : (
                              <span className={`font-semibold ${table.isAuto ? '' : 'cursor-pointer group/label relative inline-block rounded px-1 py-0.5 transition-all hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                                {table.isAuto ? (
                                  <>
                                    {table.name}
                                    {isEditingAncillary && (
                                      <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isEditingAncillary) {
                                          setEditingField(`table-label-${table.id}`);
                                          setEditValue(table.name || '');
                                        } else {
                                          setPendingField(`table-label-${table.id}`);
                                          onSectionClick?.(ANCILLARY_SECTION_ID);
                                        }
                                      }}
                                      title="Click to edit"
                                    >
                                      {table.name || 'Untitled'}
                                    </span>
                                    <span className="absolute -top-1 -right-1 opacity-70">
                                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </span>
                                  </>
                                )}
                              </span>
                            )}
                            {!table.isAuto && (
                              <>
                                {isEditingPage ? (
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => {
                                      if (onAncillaryChange) {
                                        const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                          t.id === table.id ? { ...t, page: parseInt(editValue) || undefined } : t
                                        );
                                        onAncillaryChange({ listOfTables: updated });
                                      }
                                      setEditingField(null);
                                      setEditValue('');
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        setEditingField(null);
                                        setEditValue('');
                                      } else if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (onAncillaryChange) {
                                          const updated = (plan.ancillary?.listOfTables || []).map(t => 
                                            t.id === table.id ? { ...t, page: parseInt(editValue) || undefined } : t
                                          );
                                          onAncillaryChange({ listOfTables: updated });
                                        }
                                        setEditingField(null);
                                        setEditValue('');
                                      }
                                    }}
                                    autoFocus
                                    className="w-16 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                    placeholder="Page"
                                  />
                                ) : (
                                  <span
                                    className="cursor-pointer group/page relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 text-gray-500 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isEditingAncillary) {
                                        setEditingField(`table-page-${table.id}`);
                                        setEditValue(String(table.page || ''));
                                      } else {
                                        setPendingField(`table-page-${table.id}`);
                                        onSectionClick?.(ANCILLARY_SECTION_ID);
                                      }
                                    }}
                                    title="Click to edit page"
                                  >
                                    {table.page ? `Page ${table.page}` : '+ Add page'}
                                  </span>
                                )}
                                {isEditingAncillary && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onAncillaryChange) {
                                        const updated = (plan.ancillary?.listOfTables || []).filter(t => t.id !== table.id);
                                        onAncillaryChange({ listOfTables: updated });
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                    title="Delete entry"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                            {table.isAuto && table.sectionTitle && (
                              <span className="text-gray-500 ml-2">
                                — {table.sectionNumber !== null ? `${table.sectionNumber}. ` : ''}{table.sectionTitle}
                              </span>
                            )}
                          </div>
                          {table.description && (
                            <p className="text-xs text-gray-500">{table.description}</p>
                          )}
                          {table.source && (
                            <p className="text-xs text-gray-500">Source: {table.source}</p>
                          )}
                          {table.tags && table.tags.length > 0 && (
                            <p className="text-[11px] text-gray-400 uppercase">Tags: {table.tags.join(', ')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    {t.noTablesYet}
                  </div>
                )}
                {isEditingAncillary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onAncillaryChange) {
                        const updated = [
                          ...(plan.ancillary?.listOfTables || []),
                          { id: `table_${Date.now()}`, label: 'New table', page: undefined, type: 'table' as const }
                        ];
                        onAncillaryChange({ listOfTables: updated });
                      }
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                  >
                    + Add Table Entry
                  </button>
                )}
              </div>
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{t.page} {listOfTablesPageNumber}</span>
                </div>
              )}
            </div>
            </div>
          );
        })()}

        {/* List of Figures */}
        {(() => {
          const allFigures: Array<{
            id?: string;
            name: string;
            caption?: string;
            description?: string;
            source?: string;
            tags?: string[];
            sectionTitle: string;
            sectionNumber: number | null;
            isAuto?: boolean;
            page?: number;
          }> = [];
          sectionsToRender.forEach((section) => {
            const sectionNumber = section.fields?.sectionNumber ?? null;
            if (section.figures && section.figures.length > 0) {
              section.figures.forEach((figure: any) => {
                  allFigures.push({
                    id: figure.id,
                    name: figure.title || t.figure,
                    caption: figure.caption,
                    description: figure.description,
                    source: figure.source,
                    tags: figure.tags,
                    sectionTitle: section.title,
                    sectionNumber,
                    isAuto: true
                  });
              });
            }
          });

          // Combine auto-generated and manual entries
          const manualFigures = plan.ancillary?.listOfIllustrations || [];
          const allEntries = [
            ...allFigures,
            ...manualFigures.map(f => ({ 
              id: f.id, 
              name: f.label, 
              caption: undefined, 
              description: undefined, 
              source: undefined, 
              tags: undefined,
              sectionTitle: '',
              sectionNumber: null,
              page: f.page,
              isAuto: false 
            }))
          ];

          const listOfFiguresPageNumber = sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 1;

          return (
            <div 
              className={`export-preview-page export-preview-section ${!isEditingAncillary ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
              data-section-id={ANCILLARY_SECTION_ID}
              onClick={(e) => {
                // Allow clicking on child elements, but not on input fields, buttons, or links when editing
                const target = e.target as HTMLElement;
                if (isEditingAncillary) {
                  // When editing, only allow clicks on non-interactive elements
                  if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                    return;
                  }
                }
                // Trigger section click if not already editing
                if (!isEditingAncillary) {
                  onSectionClick?.(ANCILLARY_SECTION_ID);
                }
              }}
              style={{
                width: '210mm',
                height: '297mm',
                backgroundColor: 'white',
                background: 'white',
                margin: 0,
                marginTop: 0,
                marginBottom: 0
              }}
            >
            <div className="export-preview-page-scaler">
              <div className="section-block space-y-4">
                <div className="section-heading border-b border-gray-200/80 pb-3">
                  <h2 
                    className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEditingAncillary) {
                        onSectionClick?.(ANCILLARY_SECTION_ID);
                      }
                    }}
                  >
                    {t.listOfFigures}
                  </h2>
                </div>
              {allEntries.length > 0 ? (
                <div className="space-y-3">
                  {allEntries.map((figure: any) => {
                    const isEditingLabel = isEditingAncillary && !figure.isAuto && editingField === `figure-label-${figure.id}`;
                    const isEditingPage = isEditingAncillary && !figure.isAuto && editingField === `figure-page-${figure.id}`;
                    
                    return (
                      <div key={figure.id || figure.name} className={`text-sm text-gray-700 space-y-0.5 group ${figure.isAuto ? '' : ''}`}>
                        <div className="flex items-center gap-2">
                          {isEditingLabel ? (
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => {
                                if (onAncillaryChange && !figure.isAuto) {
                                  const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                    f.id === figure.id ? { ...f, label: editValue } : f
                                  );
                                  onAncillaryChange({ listOfIllustrations: updated });
                                }
                                setEditingField(null);
                                setEditValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingField(null);
                                  setEditValue('');
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (onAncillaryChange && !figure.isAuto) {
                                    const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                      f.id === figure.id ? { ...f, label: editValue } : f
                                    );
                                    onAncillaryChange({ listOfIllustrations: updated });
                                  }
                                  setEditingField(null);
                                  setEditValue('');
                                }
                              }}
                              autoFocus
                              className="border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                            />
                          ) : (
                            <span className={`font-semibold ${figure.isAuto ? '' : 'cursor-pointer group/label relative inline-block rounded px-1 py-0.5 transition-all hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                              {figure.isAuto ? (
                                <>
                                  {figure.name}
                                  {isEditingAncillary && (
                                    <span className="text-xs text-gray-400 italic ml-2">(auto-generated)</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isEditingAncillary) {
                                        setEditingField(`figure-label-${figure.id}`);
                                        setEditValue(figure.name || '');
                                      } else {
                                        setPendingField(`figure-label-${figure.id}`);
                                        onSectionClick?.(ANCILLARY_SECTION_ID);
                                      }
                                    }}
                                    title="Click to edit"
                                  >
                                    {figure.name || 'Untitled'}
                                  </span>
                                  <span className="absolute -top-1 -right-1 opacity-0 group-hover/label:opacity-100 transition-opacity">
                                    <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                          {!figure.isAuto && (
                            <>
                              {isEditingPage ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => {
                                    if (onAncillaryChange) {
                                      const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                        f.id === figure.id ? { ...f, page: parseInt(editValue) || undefined } : f
                                      );
                                      onAncillaryChange({ listOfIllustrations: updated });
                                    }
                                    setEditingField(null);
                                    setEditValue('');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingField(null);
                                      setEditValue('');
                                    } else if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (onAncillaryChange) {
                                        const updated = (plan.ancillary?.listOfIllustrations || []).map(f => 
                                          f.id === figure.id ? { ...f, page: parseInt(editValue) || undefined } : f
                                        );
                                        onAncillaryChange({ listOfIllustrations: updated });
                                      }
                                      setEditingField(null);
                                      setEditValue('');
                                    }
                                  }}
                                  autoFocus
                                  className="w-16 border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                  placeholder="Page"
                                />
                              ) : (
                                  <span
                                    className="cursor-pointer group/page relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50 text-gray-500 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isEditingAncillary) {
                                        setEditingField(`figure-page-${figure.id}`);
                                        setEditValue(String(figure.page || ''));
                                      } else {
                                        setPendingField(`figure-page-${figure.id}`);
                                        onSectionClick?.(ANCILLARY_SECTION_ID);
                                      }
                                    }}
                                    title="Click to edit page"
                                  >
                                    {figure.page ? `Page ${figure.page}` : '+ Add page'}
                                  </span>
                              )}
                              {isEditingAncillary && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAncillaryChange) {
                                      const updated = (plan.ancillary?.listOfIllustrations || []).filter(f => f.id !== figure.id);
                                      onAncillaryChange({ listOfIllustrations: updated });
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                                  title="Delete entry"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                          {figure.isAuto && figure.sectionTitle && (
                            <span className="text-gray-500 ml-2">
                              — {figure.sectionNumber !== null ? `${figure.sectionNumber}. ` : ''}{figure.sectionTitle}
                            </span>
                          )}
                        </div>
                        {figure.description && (
                          <p className="text-xs text-gray-500">{figure.description}</p>
                        )}
                        {figure.caption && (
                          <p className="text-xs text-gray-500 italic">{figure.caption}</p>
                        )}
                        {figure.source && (
                          <p className="text-xs text-gray-500">Source: {figure.source}</p>
                        )}
                        {figure.tags && figure.tags.length > 0 && (
                          <p className="text-[11px] text-gray-400 uppercase">Tags: {figure.tags.join(', ')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  {t.noFiguresYet}
                </div>
              )}
              {isEditingAncillary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAncillaryChange) {
                      const updated = [
                        ...(plan.ancillary?.listOfIllustrations || []),
                        { id: `figure_${Date.now()}`, label: 'New figure', page: undefined, type: 'image' as const }
                      ];
                      onAncillaryChange({ listOfIllustrations: updated });
                    }
                  }}
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
                >
                  + Add Figure Entry
                </button>
              )}
              </div>
              {/* Footer with page number */}
              {plan.settings.includePageNumbers && (
                <div className="export-preview-page-footer">
                  <span>{t.page} {listOfFiguresPageNumber}</span>
                </div>
              )}
            </div>
            </div>
          );
        })()}

        {/* References section */}
        <div 
          className={`export-preview-page export-preview-section ${!isEditingReferences ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={REFERENCES_SECTION_ID}
          onClick={(e) => {
            // Allow clicking on child elements, but not on input fields, buttons, or links when editing
            const target = e.target as HTMLElement;
            if (isEditingReferences) {
              // When editing, only allow clicks on non-interactive elements
              if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                return;
              }
            }
            // Trigger section click if not already editing
            if (!isEditingReferences) {
              onSectionClick?.(REFERENCES_SECTION_ID);
            }
          }}
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white',
            margin: 0,
            marginTop: 0,
            marginBottom: 0
          }}
        >
        <div className="export-preview-page-scaler">
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 
                className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionClick?.(REFERENCES_SECTION_ID);
                }}
              >
                {t.references}
              </h2>
            </div>
          {plan.references && plan.references.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {plan.references.map((ref) => {
                const isEditingCitation = isEditingReferences && editingField === `ref-citation-${ref.id}`;
                const isEditingUrl = isEditingReferences && editingField === `ref-url-${ref.id}`;
                
                return (
                  <li key={ref.id} className="group">
                    <div className="space-y-2">
                      {isEditingCitation ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (onReferenceUpdate) {
                              onReferenceUpdate({ ...ref, citation: editValue });
                            }
                            setEditingField(null);
                            setEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          autoFocus
                          className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                          placeholder="Citation"
                        />
                      ) : (
                        <span
                          className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditingReferences) {
                              setEditingField(`ref-citation-${ref.id}`);
                              setEditValue(ref.citation || '');
                            } else {
                              setPendingField(`ref-citation-${ref.id}`);
                              onSectionClick?.(REFERENCES_SECTION_ID);
                            }
                          }}
                          title="Click to edit citation"
                        >
                          {ref.citation || <span className="text-gray-400 italic">Click to add citation</span>}
                          <span className="absolute -top-1 -right-1 opacity-70">
                            <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </span>
                        </span>
                      )}
                      {isEditingUrl ? (
                        <input
                          type="url"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (onReferenceUpdate) {
                              onReferenceUpdate({ ...ref, url: editValue });
                            }
                            setEditingField(null);
                            setEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (onReferenceUpdate) {
                                onReferenceUpdate({ ...ref, url: editValue });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          autoFocus
                          className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                          placeholder="URL"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {ref.url ? (
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                              [{ref.url}]
                            </a>
                          ) : (
                            <span
                              className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-dashed border-blue-200/50 text-gray-400 italic text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditingReferences) {
                                  setEditingField(`ref-url-${ref.id}`);
                                  setEditValue(ref.url || '');
                                } else {
                                  setPendingField(`ref-url-${ref.id}`);
                                  onSectionClick?.(REFERENCES_SECTION_ID);
                                }
                              }}
                              title="Click to add URL"
                            >
                              + Add URL
                            </span>
                          )}
                          {isEditingReferences && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onReferenceDelete) {
                                  onReferenceDelete(ref.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                              title="Delete reference"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noReferencesYet}
            </div>
          )}
          {isEditingReferences && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onReferenceAdd) {
                  onReferenceAdd({
                    id: `ref_${Date.now()}`,
                    citation: '',
                    url: '',
                    accessedDate: new Date().toISOString().split('T')[0]
                  });
                }
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
            >
              + Add Reference
            </button>
          )}
          </div>
          {/* Footer with page number */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{t.page} {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 2}</span>
            </div>
          )}
        </div>
        </div>

        {/* Appendices section */}
        <div 
          className={`export-preview-page export-preview-section ${!isEditingAppendices ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
          data-section-id={APPENDICES_SECTION_ID}
          onClick={(e) => {
            // Allow clicking on child elements, but not on input fields, buttons, or links when editing
            const target = e.target as HTMLElement;
            if (isEditingAppendices) {
              // When editing, only allow clicks on non-interactive elements
              if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
                return;
              }
            }
            // Trigger section click if not already editing
            if (!isEditingAppendices) {
              onSectionClick?.(APPENDICES_SECTION_ID);
            }
          }}
          style={{
            width: '210mm',
            height: '297mm',
            backgroundColor: 'white',
            background: 'white',
            margin: 0,
            marginTop: 0,
            marginBottom: 0
          }}
        >
        <div className="export-preview-page-scaler">
          <div className="section-block space-y-4">
            <div className="section-heading border-b border-gray-200/80 pb-3">
              <h2 
                className="text-[21px] font-semibold tracking-tight text-slate-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionClick?.(APPENDICES_SECTION_ID);
                }}
              >
                {t.appendices}
              </h2>
            </div>
          {plan.appendices && plan.appendices.length > 0 ? (
            <ul className="list-disc pl-5 space-y-3 text-sm text-gray-700">
              {plan.appendices.map((appendix) => {
                const isEditingTitle = isEditingAppendices && editingField === `appendix-title-${appendix.id}`;
                const isEditingDescription = isEditingAppendices && editingField === `appendix-description-${appendix.id}`;
                const isEditingFileUrl = isEditingAppendices && editingField === `appendix-fileUrl-${appendix.id}`;
                
                return (
                  <li key={appendix.id} className="group space-y-2">
                    {isEditingTitle ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (onAppendixUpdate) {
                            onAppendixUpdate({ ...appendix, title: editValue });
                          }
                          setEditingField(null);
                          setEditValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingField(null);
                            setEditValue('');
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (onAppendixUpdate) {
                              onAppendixUpdate({ ...appendix, title: editValue });
                            }
                            setEditingField(null);
                            setEditValue('');
                          }
                        }}
                        autoFocus
                        className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm font-semibold"
                        placeholder="Appendix title"
                      />
                    ) : (
                      <strong
                        className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditingAppendices) {
                            setEditingField(`appendix-title-${appendix.id}`);
                            setEditValue(appendix.title || '');
                          } else {
                            setPendingField(`appendix-title-${appendix.id}`);
                            onSectionClick?.(APPENDICES_SECTION_ID);
                          }
                        }}
                        title="Click to edit title"
                      >
                        {appendix.title || <span className="text-gray-400 italic">Click to add title</span>}
                        <span className="absolute -top-1 -right-1 opacity-70">
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </span>
                      </strong>
                    )}
                    {isEditingDescription ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          if (onAppendixUpdate) {
                            onAppendixUpdate({ ...appendix, description: editValue });
                          }
                          setEditingField(null);
                          setEditValue('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setEditingField(null);
                            setEditValue('');
                          }
                        }}
                        autoFocus
                        className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                        placeholder="Description"
                        rows={2}
                      />
                    ) : (
                      <span
                        className="cursor-pointer group relative inline-block rounded px-1 py-0.5 transition-all bg-blue-50/20 border border-blue-200/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditingAppendices) {
                            setEditingField(`appendix-description-${appendix.id}`);
                            setEditValue(appendix.description || '');
                          } else {
                            setPendingField(`appendix-description-${appendix.id}`);
                            onSectionClick?.(APPENDICES_SECTION_ID);
                          }
                        }}
                        title="Click to edit description"
                      >
                        {appendix.description || <span className="text-gray-400 italic">Click to add description</span>}
                        <span className="absolute -top-1 -right-1 opacity-70">
                          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </span>
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {isEditingFileUrl ? (
                        <input
                          type="url"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (onAppendixUpdate) {
                              onAppendixUpdate({ ...appendix, fileUrl: editValue });
                            }
                            setEditingField(null);
                            setEditValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (onAppendixUpdate) {
                                onAppendixUpdate({ ...appendix, fileUrl: editValue });
                              }
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          autoFocus
                          className="w-full border-2 border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                          placeholder="File URL"
                        />
                      ) : (
                        <>
                          {appendix.fileUrl ? (
                            <a href={appendix.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>
                              [Link]
                            </a>
                          ) : (
                            <span
                              className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors inline-block text-gray-400 italic text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isEditingAppendices) {
                                  setEditingField(`appendix-fileUrl-${appendix.id}`);
                                  setEditValue(appendix.fileUrl || '');
                                } else {
                                  setPendingField(`appendix-fileUrl-${appendix.id}`);
                                  onSectionClick?.(APPENDICES_SECTION_ID);
                                }
                              }}
                              title="Click to add file URL"
                            >
                              + Add File URL
                            </span>
                          )}
                          {isEditingAppendices && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAppendixDelete) {
                                  onAppendixDelete(appendix.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-opacity"
                              title="Delete appendix"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
              {t.noAppendicesYet}
            </div>
          )}
          {isEditingAppendices && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAppendixAdd) {
                  onAppendixAdd({
                    id: `appendix_${Date.now()}`,
                    title: '',
                    description: '',
                    fileUrl: ''
                  });
                }
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm font-semibold"
            >
              + Add Appendix
            </button>
          )}
          </div>
          {/* Footer with page number */}
          {plan.settings.includePageNumbers && (
            <div className="export-preview-page-footer">
              <span>{t.page} {sectionsToRender.length + (plan.settings.includeTitlePage ? 2 : 1) + 3}</span>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default ExportRenderer;
