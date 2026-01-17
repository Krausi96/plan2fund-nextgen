import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../shared/components/ui/card';
import { useI18n } from '../../../../../../../shared/contexts/I18nContext';

interface GeneralInfoStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const GeneralInfoStep: React.FC<GeneralInfoStepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    documentInfo: false,
    contactInfo: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-white text-xl">
          <span className="text-xl">📋</span>
          <span>{t('editor.desktop.myProject.sections.generalInfo') || 'General Information'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {t('editor.desktop.setupWizard.fields.projectName') || 'Document Title'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => onChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                  placeholder={t('editor.desktop.setupWizard.placeholders.projectName') || 'Document Title'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {t('editor.desktop.setupWizard.fields.author') || 'Author / Organization'} *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => onChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                  placeholder={t('editor.desktop.setupWizard.placeholders.author') || 'Your name or organization'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  {t('editor.desktop.setupWizard.fields.confidentiality')}
                </label>
                <select
                  value={formData.confidentiality}
                  onChange={(e) => onChange('confidentiality', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                >
                  <option value="public">{t('editor.desktop.setupWizard.options.public')}</option>
                  <option value="confidential">{t('editor.desktop.setupWizard.options.confidential')}</option>
                  <option value="private">{t('editor.desktop.setupWizard.options.private')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Document Information Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('documentInfo')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>📑</span>
                <span className="text-white font-medium">{t('editor.desktop.setupWizard.fields.documentInfo') || 'Document Information'}</span>
                <span className="text-white/70 text-sm">({t('editor.desktop.setupWizard.optional') || 'Optional'})</span>
              </div>
              <span className={`transform transition-transform ${expandedSections.documentInfo ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.documentInfo && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.subtitle')}
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle || ''}
                      onChange={(e) => onChange('subtitle', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.subtitle')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.date')}
                    </label>
                    <input
                      type="date"
                      value={formData.date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => onChange('date', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.logo')}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange('logo', file);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Section - Expandable */}
          <div className="border border-slate-600 rounded-lg">
            <button
              type="button"
              onClick={() => toggleSection('contactInfo')}
              className="w-full px-4 py-3 text-left flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span>📞</span>
                <span className="text-white font-medium">{t('editor.desktop.setupWizard.fields.contactInfo') || 'Contact Information'}</span>
                <span className="text-white/70 text-sm">({t('editor.desktop.setupWizard.optional') || 'Optional'})</span>
              </div>
              <span className={`transform transition-transform ${expandedSections.contactInfo ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.contactInfo && (
              <div className="px-4 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.email')}
                    </label>
                    <input
                      type="email"
                      value={formData.contactInfo?.email || ''}
                      onChange={(e) => onChange('contactInfo.email', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.email')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.contactInfo?.phone || ''}
                      onChange={(e) => onChange('contactInfo.phone', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.phone')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.website')}
                    </label>
                    <input
                      type="url"
                      value={formData.contactInfo?.website || ''}
                      onChange={(e) => onChange('contactInfo.website', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.website')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      {t('editor.desktop.setupWizard.fields.address')}
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo?.address || ''}
                      onChange={(e) => onChange('contactInfo.address', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                      placeholder={t('editor.desktop.setupWizard.placeholders.address')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralInfoStep;