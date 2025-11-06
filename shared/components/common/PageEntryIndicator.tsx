import { useEffect, useState } from 'react';
import { Info, Lightbulb, X } from 'lucide-react';

interface PageEntryIndicatorProps {
  icon?: 'info' | 'hint' | string;
  text: string;
  duration?: number; // milliseconds
  position?: 'top-right' | 'top-left' | 'top-center';
  onDismiss?: () => void;
}

export default function PageEntryIndicator({
  icon = 'hint',
  text,
  duration = 5000,
  position = 'top-right',
  onDismiss,
}: PageEntryIndicatorProps) {
  const [visible, setVisible] = useState(true);

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

  if (!visible) return null;

  const IconComponent = icon === 'info' ? Info : Lightbulb;
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 ${positionClasses[position]} bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg shadow-md animate-pulse max-w-sm`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm flex-1">{text}</span>
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

