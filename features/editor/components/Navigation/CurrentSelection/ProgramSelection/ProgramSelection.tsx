import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { Button } from '@/shared/components/ui/button';
import { 
  normalizeProgramInput, 
  type ConnectCopy,
  useConfiguratorState,
} from '@/features/editor/lib';
import { InfoTooltip } from '../../../Shared/InfoTooltip';

type ProgramSelectionProps = {
  connectCopy?: ConnectCopy;
  onConnectProgram?: (value: string | null) => void;
  onOpenProgramFinder?: () => void;
};

/**
 * ProgramSelection component
 * Handles Step 2 of the configurator: Program connection with finder and manual input
 * Optimized: Uses only useConfiguratorState (now includes programError and programLoading)
 */
export default function ProgramSelection({
  connectCopy,
  onConnectProgram,
  onOpenProgramFinder
}: ProgramSelectionProps) {
  const configuratorState = useConfiguratorState();
  
  // Use provided handler or fallback to store action
  const handleConnectProgram = onConnectProgram ?? configuratorState.actions.setProgramSummary;
  const programSummary = configuratorState.programSummary;
  const programError = configuratorState.programError;
  const programLoading = configuratorState.programLoading;
  const { t } = useI18n();
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputPosition, setManualInputPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy?.error || 'Invalid input');
      return;
    }
    handleConnectProgram(normalized);
    setShowManualInput(false);
    // Don't auto-advance - let user manually navigate between steps
  };

  // Manual input positioning
  useEffect(() => {
    if (!showManualInput) {
      setManualInputPosition(null);
      return;
    }
    const updatePosition = () => {
      if (manualTriggerRef.current) {
        const rect = manualTriggerRef.current.getBoundingClientRect();
        // Ensure the dropdown doesn't go below the viewport
        const maxTop = window.innerHeight - 350; // Leave more space for the dropdown
        const top = Math.min(rect.bottom + 8, maxTop);
        
        // Ensure the dropdown doesn't go beyond the right edge of the viewport
        const maxWidth = Math.min(rect.width, 420);
        const maxLeft = window.innerWidth - maxWidth - 20;
        const left = Math.min(Math.max(rect.left, 20), maxLeft); // Also ensure minimum left spacing
        
        // Ensure the dropdown doesn't go beyond the bottom of the viewport
        const finalTop = Math.min(Math.max(top, 20), window.innerHeight - 350);
        
        // Ensure the dropdown doesn't go beyond the right edge of the viewport
        const finalLeft = Math.min(Math.max(left, 20), window.innerWidth - maxWidth - 20);
        
        setManualInputPosition({
          top: finalTop,
          left: finalLeft,
          width: maxWidth
        });
      }
    };
    updatePosition();
    
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        manualInputRef.current &&
        !manualInputRef.current.contains(target) &&
        manualTriggerRef.current &&
        !manualTriggerRef.current.contains(target)
      ) {
        setShowManualInput(false);
      }
    };
    const handleResize = () => {
      // Small delay to ensure DOM is updated after resize
      setTimeout(updatePosition, 100);
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showManualInput]);

  return (
    <div className="mb-3 pb-3">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-white/90 uppercase">
          {t('editor.desktop.config.connectProgram.title' as any) || 'Connect Program'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-600/30 text-yellow-300 rounded uppercase font-semibold">
          {t('editor.desktop.config.step2.optional' as any) || 'Optional'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.config.connectProgram.title' as any) || 'Connect Program'}
          content={t('editor.desktop.config.connectProgram.info' as any) || 'Connecting a funding program automatically loads the specific requirements, sections, and documents for that program. ProgramFinder helps you find matching programs based on your answers. Alternatively, you can paste a direct program link (e.g., from AWS, FFG, or EU calls).'}
        />
      </div>
      
      {/* Optional Step Message */}
      {!programSummary && (
        <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-2.5 mb-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-300 text-sm flex-shrink-0">ℹ️</span>
            <p className="text-xs text-white/90 leading-relaxed">
              {t('editor.desktop.config.step2.optionalInfo' as any) || 'Program connection is optional. You can proceed to Step 3 to edit sections/documents now, or connect a program to add program-specific content.'}
            </p>
          </div>
        </div>
      )}
      {programSummary ? (
        <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-blue-900 leading-tight">{programSummary.name}</p>
              {programSummary.amountRange && (
                <p className="text-sm text-blue-800 mt-1">{programSummary.amountRange}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-800 hover:text-blue-900 text-xs h-6 px-1.5 flex-shrink-0"
              onClick={() => {
                handleConnectProgram(null);
              }}
            >
              ×
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col sm:flex-row gap-2 relative">
          <button
            onClick={onOpenProgramFinder}
            className="inline-flex items-center justify-center px-4 py-2.5 h-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm flex-1 min-w-0"
          >
            {connectCopy?.openFinder}
          </button>
          <button
            ref={manualTriggerRef}
            aria-expanded={showManualInput}
            aria-controls="manual-program-connect"
            onClick={() => setShowManualInput((prev) => !prev)}
            className="inline-flex items-center justify-center px-4 py-2.5 h-auto border border-white/30 hover:border-white/50 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-sm flex-1 min-w-0"
          >
            {connectCopy?.pasteLink}
          </button>

          {showManualInput && typeof window !== 'undefined' && manualInputPosition && createPortal(
            <div
              id="manual-program-connect"
              ref={manualInputRef}
              className={`fixed rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 z-[10002] pointer-events-auto opacity-100 translate-y-0`}
              style={{
                top: `${manualInputPosition.top}px`,
                left: `${manualInputPosition.left}px`,
                width: `${manualInputPosition.width}px`
              }}
            >
              <div className="space-y-1 text-white">
                <label className="text-[10px] font-semibold text-white/70 block">
                  {connectCopy?.inputLabel}
                </label>
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                    placeholder={connectCopy?.placeholder}
                    className="flex-1 rounded border border-white/30 bg-white/10 px-3 py-2 h-10 text-sm text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="sm:w-auto text-xs h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white"
                    onClick={handleManualConnect}
                    disabled={programLoading}
                  >
                    {programLoading ? '...' : connectCopy?.submit}
                  </Button>
                </div>
                <p className="text-[10px] text-white/60">{connectCopy?.example}</p>
                {(manualError || programError) && (
                  <p className="text-[10px] text-red-400">{manualError || programError}</p>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

