// ========= PLAN2FUND — TITLE PAGE RENDERER =========
// Renders the title page (metadata section) of the business plan

import React from 'react';
import { PlanDocument, TitlePage } from '@/features/editor/lib/types';
import { METADATA_SECTION_ID, renderEditableField, handleTitlePageFieldUpdate, getFieldValue } from '@/features/editor/lib/helpers';

interface TitlePageRendererProps {
  plan: PlanDocument;
  editingSectionId: string | null;
  editingField: string | null;
  editValue: string;
  setEditingField: (field: string | null) => void;
  setEditValue: (value: string) => void;
  onSectionClick?: (sectionId: string) => void;
  onTitlePageChange?: (titlePage: TitlePage) => void;
  disabledSections?: Set<string>;
}

export default function TitlePageRenderer({
  plan,
  editingSectionId,
  editingField,
  editValue,
  setEditingField,
  setEditValue,
  onSectionClick,
  onTitlePageChange,
  disabledSections = new Set()
}: TitlePageRendererProps) {
  const isEditingMetadata = editingSectionId === METADATA_SECTION_ID;
  const isGerman = plan.language === 'de';
  
  const t = {
    businessPlan: isGerman ? 'Geschäftsplan' : 'Business Plan',
    email: isGerman ? 'E-Mail' : 'Email',
    phone: isGerman ? 'Telefon' : 'Phone',
    website: isGerman ? 'Website' : 'Website'
  };

  if (!plan.settings.includeTitlePage || disabledSections.has(METADATA_SECTION_ID)) {
    return null;
  }

  const handleFieldUpdate = (path: (string | number)[], value: string) => {
    if (plan.settings.titlePage && onTitlePageChange) {
      // Convert PlanDocument.settings.titlePage to TitlePage format
      const titlePage: TitlePage = {
        planTitle: plan.settings.titlePage.title || '',
        valueProp: plan.settings.titlePage.subtitle,
        companyName: plan.settings.titlePage.companyName || '',
        legalForm: plan.settings.titlePage.legalForm,
        teamHighlight: plan.settings.titlePage.teamHighlight,
        date: plan.settings.titlePage.date || new Date().toISOString().split('T')[0],
        logoUrl: plan.settings.titlePage.logoUrl,
        confidentialityStatement: plan.settings.titlePage.confidentialityStatement,
        headquartersLocation: plan.settings.titlePage.headquartersLocation,
        contactInfo: {
          name: plan.settings.titlePage.contactInfo?.email ? plan.settings.titlePage.companyName || '' : '',
          email: plan.settings.titlePage.contactInfo?.email || '',
          phone: plan.settings.titlePage.contactInfo?.phone,
          website: plan.settings.titlePage.contactInfo?.website,
          address: plan.settings.titlePage.contactInfo?.address || plan.settings.titlePage.headquartersLocation
        }
      };
      handleTitlePageFieldUpdate(path, value, titlePage, onTitlePageChange);
    }
  };

  return (
    <div 
      className={`preview-title-page export-preview-page ${!isEditingMetadata ? 'cursor-pointer hover:bg-blue-50/30 transition-colors' : ''}`}
      data-section-id={METADATA_SECTION_ID}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (isEditingMetadata) {
          if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('input, button, a')) {
            return;
          }
        }
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
                                handleFieldUpdate(['logoUrl'], reader.result);
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
                          onClick={() => handleFieldUpdate(['logoUrl'], '')}
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
                            handleFieldUpdate(['logoUrl'], reader.result);
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
              {renderEditableField({
                fieldKey: 'title',
                value: getFieldValue(plan, 'title'),
                onSave: (value) => handleFieldUpdate(['planTitle'], value),
                targetSectionId: METADATA_SECTION_ID,
                editingSectionId,
                editingField,
                editValue,
                setEditingField,
                setEditValue,
                onSectionClick,
                className: 'text-3xl sm:text-4xl font-bold leading-tight text-slate-900 tracking-tight',
                placeholder: 'Plan Title'
              })}
            </h1>
            
            {renderEditableField({
              fieldKey: 'subtitle',
              value: getFieldValue(plan, 'subtitle'),
              onSave: (value) => handleFieldUpdate(['valueProp'], value),
              targetSectionId: METADATA_SECTION_ID,
              editingSectionId,
              editingField,
              editValue,
              setEditingField,
              setEditValue,
              onSectionClick,
              className: 'text-base text-gray-600 font-normal leading-relaxed mb-6 max-w-2xl block',
              placeholder: 'Subtitle / Value Proposition',
              multiline: true
            })}

            <div className="mb-4">
              {renderEditableField({
                fieldKey: 'companyName',
                value: getFieldValue(plan, 'companyName'),
                onSave: (value) => handleFieldUpdate(['companyName'], value),
                targetSectionId: METADATA_SECTION_ID,
                editingSectionId,
                editingField,
                editValue,
                setEditingField,
                setEditValue,
                onSectionClick,
                className: 'text-lg font-semibold text-gray-800 block',
                placeholder: 'Company Name'
              })}
              {renderEditableField({
                fieldKey: 'legalForm',
                value: getFieldValue(plan, 'legalForm'),
                onSave: (value) => handleFieldUpdate(['legalForm'], value),
                targetSectionId: METADATA_SECTION_ID,
                editingSectionId,
                editingField,
                editValue,
                setEditingField,
                setEditValue,
                onSectionClick,
                className: 'font-normal text-gray-600 ml-2',
                placeholder: 'Legal Form (e.g., GmbH)'
              })}
              {renderEditableField({
                fieldKey: 'teamHighlight',
                value: getFieldValue(plan, 'teamHighlight'),
                onSave: (value) => handleFieldUpdate(['teamHighlight'], value),
                targetSectionId: METADATA_SECTION_ID,
                editingSectionId,
                editingField,
                editValue,
                setEditingField,
                setEditValue,
                onSectionClick,
                className: 'text-sm text-gray-600 italic mt-2 block',
                placeholder: 'Team Highlight',
                multiline: true
              })}
            </div>
          </div>

          {/* Bottom Section: Author, Contact, Date */}
          <div className="flex-shrink-0 w-full mt-auto pt-10">
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                <span className="font-semibold">{isGerman ? 'Autor' : 'Author'}:</span>{' '}
                {renderEditableField({
                  fieldKey: 'author',
                  value: getFieldValue(plan, 'author'),
                  onSave: (value) => handleFieldUpdate(['companyName'], value),
                  targetSectionId: METADATA_SECTION_ID,
                  editingSectionId,
                  editingField,
                  editValue,
                  setEditingField,
                  setEditValue,
                  onSectionClick,
                  className: 'font-normal',
                  placeholder: 'Author / Company Name'
                })}
              </p>
              <div className="space-y-1.5 text-xs text-gray-600">
                <p>
                  <span className="font-medium text-gray-700">{t.email}:</span>{' '}
                  {renderEditableField({
                    fieldKey: 'email',
                    value: getFieldValue(plan, 'email'),
                    onSave: (value) => handleFieldUpdate(['contactInfo', 'email'], value),
                    targetSectionId: METADATA_SECTION_ID,
                    editingSectionId,
                    editingField,
                    editValue,
                    setEditingField,
                    setEditValue,
                    onSectionClick,
                    placeholder: 'email@example.com'
                  })}
                </p>
                <p>
                  <span className="font-medium text-gray-700">{t.phone}:</span>{' '}
                  {renderEditableField({
                    fieldKey: 'phone',
                    value: getFieldValue(plan, 'phone'),
                    onSave: (value) => handleFieldUpdate(['contactInfo', 'phone'], value),
                    targetSectionId: METADATA_SECTION_ID,
                    editingSectionId,
                    editingField,
                    editValue,
                    setEditingField,
                    setEditValue,
                    onSectionClick,
                    placeholder: '+49 123 456789'
                  })}
                </p>
                <p>
                  <span className="font-medium text-gray-700">{t.website}:</span>{' '}
                  {renderEditableField({
                    fieldKey: 'website',
                    value: getFieldValue(plan, 'website'),
                    onSave: (value) => handleFieldUpdate(['contactInfo', 'website'], value),
                    targetSectionId: METADATA_SECTION_ID,
                    editingSectionId,
                    editingField,
                    editValue,
                    setEditingField,
                    setEditValue,
                    onSectionClick,
                    className: 'text-blue-600 hover:text-blue-800 underline',
                    placeholder: 'https://example.com'
                  })}
                </p>
                <p className="mt-2">
                  <span className="font-medium text-gray-700">{isGerman ? 'Adresse' : 'Address'}:</span>{' '}
                  {renderEditableField({
                    fieldKey: 'address',
                    value: getFieldValue(plan, 'address'),
                    onSave: (value) => handleFieldUpdate(['contactInfo', 'address'], value),
                    targetSectionId: METADATA_SECTION_ID,
                    editingSectionId,
                    editingField,
                    editValue,
                    setEditingField,
                    setEditValue,
                    onSectionClick,
                    placeholder: 'City, Country'
                  })}
                </p>
              </div>
            </div>

            <div className="w-full flex justify-between items-end pt-4 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">{isGerman ? 'Datum' : 'Date'}:</span>{' '}
                  {renderEditableField({
                    fieldKey: 'date',
                    value: getFieldValue(plan, 'date'),
                    onSave: (value) => handleFieldUpdate(['date'], value),
                    targetSectionId: METADATA_SECTION_ID,
                    editingSectionId,
                    editingField,
                    editValue,
                    setEditingField,
                    setEditValue,
                    onSectionClick,
                    placeholder: 'YYYY-MM-DD'
                  })}
                </p>
              </div>
              <div className="text-right max-w-md">
                {renderEditableField({
                  fieldKey: 'confidentialityStatement',
                  value: getFieldValue(plan, 'confidentialityStatement'),
                  onSave: (value) => handleFieldUpdate(['confidentialityStatement'], value),
                  targetSectionId: METADATA_SECTION_ID,
                  editingSectionId,
                  editingField,
                  editValue,
                  setEditingField,
                  setEditValue,
                  onSectionClick,
                  className: 'text-xs text-gray-500 italic leading-relaxed block',
                  placeholder: 'Confidentiality Statement',
                  multiline: true
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

