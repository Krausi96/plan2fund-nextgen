import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/shared/contexts/I18nContext';
import { 
  type ProductType,
  useConfiguratorState,
  useSectionsAndDocumentsCounts,
} from '@/features/editor/lib';
import { InfoTooltip } from '../../../Shared/InfoTooltip';

type ProductSelectionProps = {
  // Props removed - component uses store hooks directly
};

/**
 * ProductSelection component
 * Handles Step 1 of the configurator: Product selection with dropdown menu and preview
 * Optimized: Uses only useConfiguratorState (consolidated hook) + counts selector
 */
export default function ProductSelection({}: ProductSelectionProps = {}) {
  const { t } = useI18n();
  const { selectedProduct, productOptions, selectedProductMeta, actions } = useConfiguratorState();
  const { totalSectionsCount, totalDocumentsCount } = useSectionsAndDocumentsCounts();
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [productMenuPosition, setProductMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const productMenuRef = useRef<HTMLDivElement | null>(null);
  const productTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedMeta = selectedProductMeta ?? productOptions?.find((option) => option.value === selectedProduct) ?? productOptions?.[0] ?? null;

  const handleSelectProduct = (product: ProductType) => {
    actions.setSelectedProduct(product);
    setShowProductMenu(false);
    setProductMenuPosition(null);
  };

  const handleToggleProductMenu = () => {
    if (!showProductMenu && productTriggerRef.current) {
      const rect = productTriggerRef.current.getBoundingClientRect();
      setProductMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
    setShowProductMenu((prev) => !prev);
  };

  // Product menu positioning
  useEffect(() => {
    if (!showProductMenu) {
      setProductMenuPosition(null);
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
        setProductMenuPosition(null);
      }
    };
    const handleResize = () => {
      if (productTriggerRef.current) {
        const rect = productTriggerRef.current.getBoundingClientRect();
        setProductMenuPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showProductMenu]);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-sm font-bold text-white/90 uppercase">
          {t('editor.desktop.config.productSelection.title' as any) || 'Product selection'}
        </span>
        <InfoTooltip
          title={t('editor.desktop.config.productSelection.title' as any) || 'Product selection'}
          content={t('editor.desktop.config.productSelection.info' as any) || 'Product selection determines which sections and documents are available for your plan. Submission plans are optimized for grant applications, Review plans focus on revising existing documents, and Strategy plans are designed for strategic planning and business development.'}
        />
      </div>
      <button
        ref={productTriggerRef}
        type="button"
        onClick={handleToggleProductMenu}
        className="flex w-full items-center gap-2 rounded-xl border border-white/25 bg-gradient-to-br from-white/15 via-white/5 to-transparent px-3 py-2 text-left transition-all hover:border-white/60 focus-visible:border-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/60 shadow-xl"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-lg leading-none text-white shadow-inner shadow-blue-900/40 flex-shrink-0">
          {selectedMeta?.icon ?? '📄'}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xl font-semibold leading-tight text-white flex-shrink-0">{selectedMeta?.label}</span>
          {selectedMeta?.description && (
            <>
              <span className="text-white/40 flex-shrink-0">|</span>
              <span className="text-xs font-normal text-white/60 leading-tight flex-1 min-w-0 truncate" title={selectedMeta.description}>
                {selectedMeta.description}
              </span>
            </>
          )}
          <span className="flex items-center text-2xl font-bold flex-shrink-0 text-white/70 ml-auto leading-none">▾</span>
        </span>
      </button>
      {showProductMenu && productMenuPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={productMenuRef}
          className="fixed z-[10002] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
          style={{
            top: `${productMenuPosition.top}px`,
            left: `${productMenuPosition.left}px`,
            width: `${productMenuPosition.width}px`
          }}
        >
          <ul className="flex flex-col gap-1">
            {productOptions?.map((option) => {
              const isActive = option.value === selectedProduct;
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
        </div>,
        document.body
      )}
      
      {selectedProduct && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90 uppercase">
              {t('editor.desktop.config.step1.preview' as any) || 'Preview: Available Sections & Documents'}
            </span>
            <InfoTooltip
              title={t('editor.desktop.config.step1.preview' as any) || 'Preview'}
              content={t('editor.desktop.config.step1.previewInfo' as any) || 'These sections and documents are based on your product selection. Connecting a program (Step 2) will add program-specific sections.'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Sections Preview */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/70 font-semibold uppercase">
                  {t('editor.desktop.selection.sectionsLabel' as any) || 'SECTIONS'}
                </span>
              </div>
              <div className="text-sm font-bold text-white/90">
                {totalSectionsCount} {t('editor.desktop.config.step1.available' as any) || 'available'}
              </div>
            </div>
            
            {/* Documents Preview */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-white/70 font-semibold uppercase">
                  {t('editor.desktop.selection.documentsLabel' as any) || 'DOCUMENTS'}
                </span>
              </div>
              <div className="text-sm font-bold text-white/90">
                {totalDocumentsCount} {t('editor.desktop.config.step1.available' as any) || 'available'}
              </div>
            </div>
          </div>
          
          {/* Success Message */}
          <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <span className="text-green-300 text-sm flex-shrink-0">✓</span>
              <p className="text-xs text-white/90 leading-relaxed">
                {t('editor.desktop.config.step1.complete' as any) || 'Product selected'} - {t('editor.desktop.config.step2.skipMessage' as any) || 'You can proceed to Step 3 to edit sections/documents now, or connect a program to add program-specific content.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

