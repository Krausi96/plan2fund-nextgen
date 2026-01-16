import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../shared/components/ui/card';
import { useI18n } from '../../../../../../../shared/contexts/I18nContext';

interface GeneralInfoStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const GeneralInfoStep: React.FC<GeneralInfoStepProps> = ({ formData, onChange }) => {
  const { t } = useI18n();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-white">
          <span className="text-2xl">📋</span>
          <span>{t('editor.desktop.myProject.sections.generalInfo') || 'General Information'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {t('editor.desktop.setupWizard.fields.projectName')} *
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => onChange('projectName', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
              placeholder={t('editor.desktop.setupWizard.placeholders.projectName')}
              required
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {t('editor.metadata.field.legalForm') || 'Legal Form'}
            </label>
            <input
              type="text"
              value={formData.legalForm}
              onChange={(e) => onChange('legalForm', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
              placeholder={t('editor.metadata.field.legalForm') || 'e.g. GmbH, UG, AG'}
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              {t('editor.metadata.field.headquartersLocation') || 'Headquarters Location'}
            </label>
            <input
              type="text"
              value={formData.headquartersLocation}
              onChange={(e) => onChange('headquartersLocation', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
              placeholder={t('editor.metadata.field.headquartersLocation') || 'City, Country'}
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
      </CardContent>
    </Card>
  );
};

export default GeneralInfoStep;