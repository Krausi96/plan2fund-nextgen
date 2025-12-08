import React from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';

type RequirementsStats = {
  overallPercentage: number;
  complete: number;
  needsWork: number;
  missing: number;
  total: number;
};

type InfoTooltipProps = {
  content: string;
  title?: string;
};

// Info tooltip component (extracted from CurrentSelection)
// Exported so it can be used in CurrentSelection for other tooltips
export const InfoTooltip = ({ content, title }: InfoTooltipProps) => {
  const { t } = useI18n();
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const iconRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!showTooltip) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(target) &&
        iconRef.current &&
        !iconRef.current.contains(target)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showTooltip]);

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={iconRef}
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className="text-white/60 hover:text-white/90 cursor-help transition-colors flex-shrink-0"
        aria-label={t('editor.desktop.config.infoIcon' as any) || 'Information'}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
      {showTooltip && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[10002] rounded-lg border border-white/40 bg-slate-950 px-3 py-2.5 text-[11px] font-normal text-white shadow-2xl backdrop-blur-md max-w-[280px] pointer-events-auto"
          style={{
            top: iconRef.current ? `${iconRef.current.getBoundingClientRect().bottom + 8}px` : '0',
            left: iconRef.current ? `${iconRef.current.getBoundingClientRect().left}px` : '0'
          }}
        >
          {title && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-1.5 font-semibold">{title}</p>
          )}
          <p className="text-white/95 leading-relaxed">{content}</p>
        </div>,
        document.body
      )}
    </div>
  );
};

type RequirementsDisplayProps = {
  requirementsStats: RequirementsStats;
  onRunRequirementsCheck?: () => void;
  variant?: 'collapsed' | 'expanded-base' | 'expanded-overlay';
};

/**
 * RequirementsDisplay component
 * Displays program readiness requirements stats in different variants:
 * - collapsed: Compact view for collapsed CurrentSelection
 * - expanded-base: Expanded view in base panel
 * - expanded-overlay: Expanded view in overlay/configurator
 */
export default function RequirementsDisplay({
  requirementsStats,
  onRunRequirementsCheck,
  variant = 'collapsed'
}: RequirementsDisplayProps) {
  const { t } = useI18n();

  // Don't render if no requirements
  if (requirementsStats.total === 0) {
    return null;
  }

  // Collapsed variant (compact view - ultra compact single line)
  if (variant === 'collapsed') {
    return (
      <div className="pt-1 border-t border-white/20">
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-[8px] font-semibold uppercase tracking leading-tight flex-shrink-0">
            {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
          </span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden min-w-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${requirementsStats.overallPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-[8px] flex-shrink-0">
            <span className="text-white font-bold">{requirementsStats.overallPercentage}%</span>
            <span className="text-green-400">✅{requirementsStats.complete}</span>
            <span className="text-yellow-400">⚠️{requirementsStats.needsWork}</span>
            <span className="text-red-400">❌{requirementsStats.missing}</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded-base variant (in base panel when expanded)
  if (variant === 'expanded-base') {
    return (
      <div className="mt-3 pt-3 border-t border-white/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-[9px] font-semibold uppercase tracking">
            {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
          </span>
          <span className="text-white font-bold text-xs">{requirementsStats.overallPercentage}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${requirementsStats.overallPercentage}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-green-400 font-semibold">✅ {requirementsStats.complete}</span>
          <span className="text-yellow-400 font-semibold">⚠️ {requirementsStats.needsWork}</span>
          <span className="text-red-400 font-semibold">❌ {requirementsStats.missing}</span>
        </div>
      </div>
    );
  }

  // Expanded-overlay variant (in overlay/configurator)
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-white/90">
          {t('editor.desktop.selection.requirements.title' as any) || 'PROGRAMM-READINESS'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.selection.requirements.title' as any) || 'Programm-Readiness'}
          content={t('editor.desktop.selection.requirements.info' as any) || 'Die Programm-Readiness zeigt an, wie vollständig Ihr Plan die Anforderungen des verbundenen Förderprogramms erfüllt. ✅ Komplett bedeutet 100% erfüllt, ⚠️ Braucht Arbeit bedeutet 50-99% erfüllt, und ❌ Fehlt bedeutet weniger als 50% erfüllt. Klicken Sie auf "Aktualisieren", um die neuesten Werte zu berechnen.'}
        />
      </div>
      {/* Overall percentage with progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white font-bold text-sm">
            {t('editor.desktop.selection.requirements.overall' as any) || 'Gesamt'}:
          </span>
          <span className="text-white font-bold text-sm">{requirementsStats.overallPercentage}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${requirementsStats.overallPercentage}%` }}
          />
        </div>
      </div>
      {/* Detailed stats */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <div className="text-green-400 font-bold text-lg">✅ {requirementsStats.complete}</div>
          <div className="text-white/70 text-[10px] uppercase tracking-wide">
            {t('editor.desktop.selection.requirements.complete' as any) || 'Komplett'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-bold text-lg">⚠️ {requirementsStats.needsWork}</div>
          <div className="text-white/70 text-[10px] uppercase tracking-wide">
            {t('editor.desktop.selection.requirements.needsWork' as any) || 'Braucht Arbeit'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-red-400 font-bold text-lg">❌ {requirementsStats.missing}</div>
          <div className="text-white/70 text-[10px] uppercase tracking-wide">
            {t('editor.desktop.selection.requirements.missing' as any) || 'Fehlt'}
          </div>
        </div>
      </div>
      {onRunRequirementsCheck && (
        <Button
          onClick={onRunRequirementsCheck}
          size="sm"
          className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white"
        >
          🔄 {t('editor.desktop.selection.requirements.refresh' as any) || 'Aktualisieren'}
        </Button>
      )}
    </div>
  );
}

