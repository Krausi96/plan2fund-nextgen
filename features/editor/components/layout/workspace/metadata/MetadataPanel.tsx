import React, { useRef } from 'react';

import { BusinessPlan, TitlePage } from '@/features/editor/types/plan';
import { Card } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';
import { REQUIRED_METADATA_FIELDS } from '@/features/editor/hooks/useEditorStore';

interface MetadataPanelProps {
  plan: BusinessPlan;
  onTitlePageChange: (titlePage: TitlePage) => void;
}

const inputClasses =
  'mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/70 transition focus:outline-none focus:ring-2 focus:ring-sky-300/70 focus:border-transparent';
const labelClasses = 'block text-sm font-medium text-white/90';
const mutedText = 'text-white/70 text-xs';
const primaryButtonClasses =
  'rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15';

function TitleField({
  label,
  value,
  onChange,
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <label className={`${labelClasses} space-y-2`}>
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {required && (
          <span className="rounded-full bg-blue-600/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {(t('editor.ui.required' as any) as string) || 'Required'}
          </span>
        )}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClasses}
      />
    </label>
  );
}

export default function MetadataPanel({
  plan,
  onTitlePageChange
}: MetadataPanelProps) {
  const { t } = useI18n();
  const titlePage = plan.titlePage;
  const metadataLabel = (t('editor.section.metadataLabel' as any) as string) || 'Metadata';
  const metadataTitle =
    (t('editor.section.metadata' as any) as string) || 'Front Matter Metadata';
  const metadataIntro =
    (t('editor.section.metadata_intro' as any) as string) ||
    'Finalize your title page before writing the narrative. Once this information is complete, it flows automatically into previews, exports, and collaborator views.';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTitlePageUpdate = (path: (string | number)[], value: string) => {
    let updated: TitlePage = {
      ...titlePage,
      contactInfo: { ...titlePage.contactInfo }
    };

    if (path[0] === 'contactInfo' && typeof path[1] === 'string') {
      updated = {
        ...updated,
        contactInfo: {
          ...updated.contactInfo,
          [path[1]]: value
        }
      };
    } else if (typeof path[0] === 'string') {
      (updated as any)[path[0]] = value;
    }

    onTitlePageChange(updated);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleTitlePageUpdate(['logoUrl'], reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openLogoPicker = () => {
    fileInputRef.current?.click();
  };

  const isFieldRequired = (fieldId: string) => {
    return REQUIRED_METADATA_FIELDS.some((f) => f.id === fieldId);
  };

  return (
    <div className="space-y-3">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl lg:sticky lg:top-4 lg:z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-800" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xl" />
        <div className="relative z-10 space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
              {metadataLabel}
            </p>
            <h1 className="text-3xl font-semibold text-white drop-shadow-lg">{metadataTitle}</h1>
          </div>
          <p className="text-sm text-white/80 max-w-3xl">{metadataIntro}</p>
        </div>
      </Card>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/70 to-slate-800" />
      <div className="absolute inset-0 bg-black/15 backdrop-blur-xl" />
      <div className="relative z-10 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">
                {(t('editor.metadata.group.planIdentity' as any) as string) || 'Plan Identity'}
              </p>
              <div className="space-y-4">
                <TitleField
                  label={(t('editor.metadata.field.planTitle' as any) as string) || 'Plan title'}
                  value={titlePage.planTitle}
                  onChange={(value) => handleTitlePageUpdate(['planTitle'], value)}
                  required={isFieldRequired('planTitle')}
                />
                <label className={`${labelClasses} space-y-2`}>
                  <span>
                    {(t('editor.metadata.field.valueProp' as any) as string) || 'Mission & Value Proposition'}
                  </span>
                  <textarea
                    value={titlePage.valueProp ?? ''}
                    onChange={(event) => handleTitlePageUpdate(['valueProp'], event.target.value)}
                    rows={3}
                    className={`${inputClasses} resize-none`}
                    placeholder={
                      (t('editor.metadata.field.valuePropHint' as any) as string) ||
                      'What mission drives you and how do you deliver value?'
                    }
                  />
                </label>
                <TitleField
                  label={(t('editor.metadata.field.date' as any) as string) || 'Date'}
                  value={titlePage.date}
                  onChange={(value) => handleTitlePageUpdate(['date'], value)}
                  required={isFieldRequired('date')}
                />
                <TitleField
                  label={(t('editor.metadata.field.legalForm' as any) as string) || 'Legal form'}
                  value={titlePage.legalForm ?? ''}
                  onChange={(value) => handleTitlePageUpdate(['legalForm'], value)}
                  placeholder="GmbH, UG, e.K."
                />
                <TitleField
                  label={
                    (t('editor.metadata.field.headquartersLocation' as any) as string) || 'Headquarters location'
                  }
                  value={titlePage.headquartersLocation ?? ''}
                  onChange={(value) => handleTitlePageUpdate(['headquartersLocation'], value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            <label className={`${labelClasses} space-y-2`}>
              <span>{(t('editor.metadata.field.logo' as any) as string) || 'Logo'}</span>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                {titlePage.logoUrl ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-white/40 p-1 shadow-inner overflow-hidden">
                      <img
                        src={titlePage.logoUrl}
                        alt="Logo preview"
                        className="max-h-14 max-w-14 object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={mutedText}>
                        {(t('editor.metadata.field.logoHint' as any) as string) ||
                          'Appears on the title page and preview exports.'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={primaryButtonClasses} onClick={openLogoPicker}>
                          {(t('editor.ui.replace' as any) as string) || 'Replace'}
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white"
                          onClick={() => handleTitlePageUpdate(['logoUrl'], '')}
                        >
                          {(t('editor.ui.remove' as any) as string) || 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={titlePage.logoUrl ?? ''}
                      onChange={(event) => handleTitlePageUpdate(['logoUrl'], event.target.value)}
                      placeholder="https://..."
                      className={inputClasses}
                    />
                    <button type="button" className={primaryButtonClasses} onClick={openLogoPicker}>
                      {(t('editor.ui.upload' as any) as string) || 'Upload'}
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </label>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-3">
                {(t('editor.metadata.group.companyProfile' as any) as string) || 'Company Profile'}
              </p>
              <div className="space-y-4">
                <TitleField
                  label={(t('editor.metadata.field.companyName' as any) as string) || 'Company name'}
                  value={titlePage.companyName}
                  onChange={(value) => handleTitlePageUpdate(['companyName'], value)}
                  required={isFieldRequired('companyName')}
                />
                <TitleField
                  label={(t('editor.metadata.field.email' as any) as string) || 'Contact email'}
                  value={titlePage.contactInfo.email}
                  onChange={(value) => handleTitlePageUpdate(['contactInfo', 'email'], value)}
                  required={isFieldRequired('contactEmail')}
                />
                <TitleField
                  label={(t('editor.metadata.field.phone' as any) as string) || 'Phone'}
                  value={titlePage.contactInfo.phone ?? ''}
                  onChange={(value) => handleTitlePageUpdate(['contactInfo', 'phone'], value)}
                />
                <TitleField
                  label={(t('editor.metadata.field.website' as any) as string) || 'Website'}
                  value={titlePage.contactInfo.website ?? ''}
                  onChange={(value) => handleTitlePageUpdate(['contactInfo', 'website'], value)}
                />
                <label className={`${labelClasses} space-y-2`}>
                  <span>{(t('editor.metadata.field.address' as any) as string) || 'Address'}</span>
                  <textarea
                    value={titlePage.contactInfo.address ?? ''}
                    onChange={(event) => handleTitlePageUpdate(['contactInfo', 'address'], event.target.value)}
                    rows={2}
                    className={`${inputClasses} resize-none`}
                  />
                </label>
                <label className={`${labelClasses} space-y-2`}>
                  <span>{(t('editor.metadata.field.teamHighlight' as any) as string) || 'Team highlight'}</span>
                  <textarea
                    value={titlePage.teamHighlight ?? ''}
                    onChange={(event) => handleTitlePageUpdate(['teamHighlight'], event.target.value)}
                    rows={3}
                    className={`${inputClasses} resize-none`}
                    placeholder={
                      (t('editor.metadata.field.teamHighlightHint' as any) as string) ||
                      'Name key founders, advisors, or headcount.'
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className={`${labelClasses} space-y-2`}>
            <span>
              {(t('editor.metadata.field.confidentiality' as any) as string) || 'Confidentiality statement'}
            </span>
            <textarea
              value={titlePage.confidentialityStatement ?? ''}
              onChange={(event) => handleTitlePageUpdate(['confidentialityStatement'], event.target.value)}
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </label>
        </div>
      </div>
    </section>
    </div>
  );
}
