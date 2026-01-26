import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface TemplateOptionProps {
  // Add props as needed
}

export function TemplateOption({}: TemplateOptionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="bg-purple-600/20 border border-purple-400/30 rounded-lg p-3">
        <p className="text-xs text-white/90 text-center mb-3">
          {t('editor.desktop.program.uploadTemplateHint' as any) || 'Upload your own template to define document structure'}
        </p>
        <div className="flex justify-center">
          <button className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm">
            <span className="mr-2">📁</span>
            {t('editor.desktop.program.uploadTemplate' as any) || 'Upload Template'}
          </button>
        </div>
      </div>
    </div>
  );
}