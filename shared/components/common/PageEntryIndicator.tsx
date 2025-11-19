import { useEffect, useState } from 'react';
import { Info, Lightbulb, X } from 'lucide-react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface PageEntryIndicatorProps {
  icon?: 'info' | 'hint' | string;
  text?: string; // Direct text (optional if using translationKey)
  translationKey?: string; // Translation key prefix (e.g., 'editor', 'reco', 'dashboard')
  duration?: number; // milliseconds (0 = don't auto-dismiss)
  position?: 'top-right' | 'top-left' | 'top-center' | 'center'; // 'center' for modal
  onDismiss?: () => void;
  title?: string; // Optional title (or use translationKey)
  showAsModal?: boolean; // Toggle between modal and toast
}

export default function PageEntryIndicator({
  icon = 'hint',
  text,
  translationKey,
  duration = 5000,
  position = 'center',
  onDismiss,
  title,
  showAsModal = true, // Default to modal
}: PageEntryIndicatorProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(true);

  // Resolve text and title from translations if translationKey is provided
  const resolvedTitle = translationKey 
    ? t(`pageEntry.${translationKey}.title` as any)
    : title;
  const resolvedText = translationKey
    ? t(`pageEntry.${translationKey}.text` as any)
    : text || '';

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showAsModal && visible) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showAsModal, visible]);

  if (!visible) return null;

  const IconComponent = icon === 'info' ? Info : Lightbulb;

  // Modal version (centered with backdrop)
  if (showAsModal || position === 'center') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        
        {/* Modal Content */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <IconComponent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {resolvedTitle && (
                <h3 id="modal-title" className="text-xl font-semibold text-slate-900 mb-3">
                  {resolvedTitle}
                </h3>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{resolvedText}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
              {duration > 0 && (
                <button
                  onClick={handleDismiss}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {t('pageEntry.button.dismiss' as any)}
                </button>
              )}
            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              {duration > 0 ? t('pageEntry.button.gotIt' as any) : t('pageEntry.button.continue' as any)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Toast version (original behavior for backward compatibility)
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 ${positionClasses[position as keyof typeof positionClasses]} bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-top-2 fade-in duration-200`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm flex-1">{resolvedText}</span>
        <button
          onClick={handleDismiss}
          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

