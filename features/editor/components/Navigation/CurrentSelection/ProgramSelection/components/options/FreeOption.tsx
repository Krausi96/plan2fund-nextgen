import React from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface FreeOptionProps {
  // Add props as needed
}

export function FreeOption({}: FreeOptionProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-300 text-sm flex-shrink-0">✓</span>
          <p className="text-xs text-white/90 leading-relaxed font-medium">
            {t('editor.desktop.program.freeSelected' as any) || 'Free structure selected'}
          </p>
        </div>
        <p className="text-[10px] text-white/80 text-center">
          {t('editor.desktop.program.proceedToNext' as any) || 'Proceed to the next section to define your document structure manually'}
        </p>
      </div>
    </div>
  );
}