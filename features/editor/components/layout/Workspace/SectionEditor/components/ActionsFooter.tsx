import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/contexts/I18nContext';

type ActionsFooterProps = {
  answeredCount: number;
  totalQuestions: number;
  completionPercentage: number;
  isUnknown: boolean;
  onSkip: () => void;
  onComplete: () => void;
};

export function ActionsFooter({
  answeredCount,
  totalQuestions,
  completionPercentage,
  isUnknown,
  onSkip,
  onComplete
}: ActionsFooterProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 border-t border-white/20 bg-slate-800/50 flex-shrink-0">
      <div className="text-xs text-white/70">
        {answeredCount}/{totalQuestions} ({completionPercentage}%)
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onSkip}
          className="text-white/80 border-white/20 bg-slate-700/50 hover:bg-slate-700 text-xs px-3 py-1.5 rounded"
        >
          {isUnknown ? (t('editor.panel.clear' as any) || 'Clear') : (t('editor.panel.skip' as any) || 'Skip')}
        </Button>
        <Button
          variant="success"
          onClick={onComplete}
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-1.5 rounded"
        >
          ✓ {t('editor.panel.complete' as any) || 'Complete'}
        </Button>
      </div>
    </div>
  );
}

