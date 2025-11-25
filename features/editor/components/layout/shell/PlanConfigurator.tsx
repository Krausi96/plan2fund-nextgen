import React, { useEffect, useRef, useState } from 'react';

import {
  BusinessPlan,
  ProductType,
  ProgramSummary
} from '@/features/editor/types/plan';
import { normalizeProgramInput } from '@/features/editor/hooks/useEditorStore';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';

export type ConnectCopy = {
  badge: string;
  heading: string;
  description: string;
  openFinder: string;
  pasteLink: string;
  inputLabel: string;
  placeholder: string;
  example: string;
  submit: string;
  error: string;
};

export interface PlanConfiguratorProps {
  plan: BusinessPlan | null;
  programSummary: ProgramSummary | null;
  onChangeProduct: (product: ProductType) => void;
  onConnectProgram: (value: string | null) => void;
  onOpenProgramFinder: () => void;
  programLoading: boolean;
  programError: string | null;
  productOptions: Array<{ value: ProductType; label: string; description: string; icon?: string }>;
  connectCopy: ConnectCopy;
}

export function PlanConfigurator({
  plan,
  programSummary,
  onChangeProduct,
  onConnectProgram,
  onOpenProgramFinder,
  programLoading,
  programError,
  productOptions,
  connectCopy
}: PlanConfiguratorProps) {
  const { t } = useI18n();
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProgramTooltip, setShowProgramTooltip] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const productTriggerRef = useRef<HTMLButtonElement | null>(null);

  const headerCardClasses =
    'relative rounded-lg border border-blue-600/50 px-2.5 py-1.5 shadow-xl backdrop-blur-xl overflow-visible';

  const selectedProductMeta =
    productOptions.find((option) => option.value === (plan?.productType ?? 'submission')) ??
    productOptions[0] ??
    null;
  const selectedProductLabel = selectedProductMeta?.label ?? '';

  const handleSelectProduct = (product: ProductType) => {
    onChangeProduct(product);
    setShowProductMenu(false);
  };

  const handleManualConnect = () => {
    setManualError(null);
    const normalized = normalizeProgramInput(manualValue);
    if (!normalized) {
      setManualError(connectCopy.error);
      return;
    }
    onConnectProgram(normalized);
  };

  useEffect(() => {
    if (!showProductMenu) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        productTriggerRef.current &&
        !productTriggerRef.current.contains(target)
      ) {
        setShowProductMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showProductMenu]);

  useEffect(() => {
    if (!showManualInput) {
      return;
    }

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

    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showManualInput]);

  useEffect(() => {
    if (programSummary) {
      setShowManualInput(false);
    }
  }, [programSummary]);

  if (!selectedProductMeta) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 w-full md:grid-cols-2">
      <Card className={`${headerCardClasses} flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800 rounded-lg" />
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold uppercase tracking-wider text-white">
              {(t('editor.header.productType' as any) as string) || 'Plans'}
            </span>
          </div>
          <div className="relative">
            <button
              ref={productTriggerRef}
              type="button"
              onClick={() => setShowProductMenu((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/5 px-3 py-1.5 text-left text-sm font-semibold text-white transition-colors hover:border-white/60 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/50"
            >
              <span className="text-lg leading-none flex-shrink-0">
                {selectedProductMeta?.icon ?? '📄'}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 flex-1">
                <span className="text-sm font-semibold leading-tight truncate">{selectedProductLabel}</span>
                {selectedProductMeta?.description && (
                  <span className="text-[10px] font-normal text-white/70 leading-tight truncate">
                    {selectedProductMeta.description}
                  </span>
                )}
              </span>
              <span className="flex items-center text-xs font-bold flex-shrink-0">▾</span>
            </button>
            {showProductMenu && (
              <div
                ref={productMenuRef}
                className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
              >
                <ul className="flex flex-col gap-1">
                  {productOptions.map((option) => {
                    const isActive = option.value === (plan?.productType ?? 'submission');
                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(option.value)}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-blue-600/40 text-white'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="text-2xl leading-none">{option.icon ?? '📄'}</span>
                          <span className="flex flex-col">
                            <span className="text-sm font-semibold">{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-white/70 leading-snug">
                                {option.description}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className={`${headerCardClasses} flex-1 flex flex-col`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-800" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-1.5 h-6 mb-2">
            <p className="text-xl font-bold uppercase tracking-wider text-white">
              {connectCopy.badge}
            </p>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowProgramTooltip(true)}
                onMouseLeave={() => setShowProgramTooltip(false)}
                className="text-white hover:text-blue-100 text-xs font-bold w-4 h-4 rounded-full border border-white/50 bg-white/20 flex items-center justify-center"
              >
                ?
              </button>
              {showProgramTooltip && (
                <div className="absolute z-50 left-0 top-5 w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg border border-slate-700">
                  {connectCopy.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 flex items-center">
            {programSummary ? (
              <div className="w-full rounded-lg border border-blue-300 bg-blue-100/60 px-3 py-2.5 h-auto flex items-center">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-blue-900 truncate">{programSummary.name}</p>
                    {programSummary.amountRange && (
                      <p className="text-xs text-blue-800 mt-0.5">{programSummary.amountRange}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-800 hover:text-blue-900 text-sm h-7 px-2 flex-shrink-0"
                    onClick={() => onConnectProgram(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-wrap gap-2 relative">
                <button
                  onClick={onOpenProgramFinder}
                  className="inline-flex items-center justify-center px-5 py-2.5 h-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  {connectCopy.openFinder}
                </button>
                <button
                  ref={manualTriggerRef}
                  aria-expanded={showManualInput}
                  aria-controls="manual-program-connect"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="inline-flex items-center justify-center px-5 py-2.5 h-auto border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-colors duration-200 backdrop-blur-sm hover:bg-white/10 text-sm"
                >
                  {connectCopy.pasteLink}
                </button>

                <div
                  id="manual-program-connect"
                  ref={manualInputRef}
                  className={`absolute left-0 top-[calc(100%+0.75rem)] w-full max-w-[420px] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl transition-all duration-200 z-50 ${
                    showManualInput
                      ? 'pointer-events-auto opacity-100 translate-y-0'
                      : 'pointer-events-none opacity-0 -translate-y-2'
                  }`}
                >
                  <div className="space-y-1 text-white">
                    <label className="text-[10px] font-semibold text-white/70 block">
                      {connectCopy.inputLabel}
                    </label>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <input
                        value={manualValue}
                        onChange={(event) => setManualValue(event.target.value)}
                        placeholder={connectCopy.placeholder}
                        className="flex-1 rounded border border-white/30 bg-white/10 px-2 py-1.5 h-9 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="sm:w-auto text-xs h-9 px-3 bg-blue-600 hover:bg-blue-500 text-white"
                        onClick={handleManualConnect}
                        disabled={programLoading}
                      >
                        {programLoading ? '...' : connectCopy.submit}
                      </Button>
                    </div>
                    <p className="text-[10px] text-white/60">{connectCopy.example}</p>
                    {(manualError || programError) && (
                      <p className="text-[10px] text-red-400">{manualError || programError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

