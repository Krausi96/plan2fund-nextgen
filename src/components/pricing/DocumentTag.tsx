// ========= PLAN2FUND — DOCUMENT TAG COMPONENT =========
// Small chip component with tooltip for document descriptions

import React, { useState } from 'react';
import { DocumentDescription } from '@/data/documentDescriptions';
import { useI18n } from '@/contexts/I18nContext';
import { Info, FileText } from 'lucide-react';

interface DocumentTagProps {
  document: DocumentDescription;
  variant?: 'default' | 'included' | 'optional';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function DocumentTag({ 
  document, 
  variant = 'default', 
  size = 'md',
  showTooltip = true,
  className = ''
}: DocumentTagProps) {
  const { t } = useI18n();
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    included: 'bg-blue-100 text-blue-700 border-blue-200',
    optional: 'bg-green-100 text-green-700 border-green-200'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="relative inline-block">
      <div
        className={`
          inline-flex items-center gap-2 rounded-full border transition-all duration-200 cursor-pointer
          hover:shadow-md hover:scale-105
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        onClick={() => showTooltip && setShowDetails(!showDetails)}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
      >
        <FileText className={iconSizes[size]} />
        <span className="font-medium">{t(document.i18nKey + '.title' as any)}</span>
        {showTooltip && (
          <Info className={`${iconSizes[size]} opacity-60`} />
        )}
      </div>

      {/* Tooltip */}
      {showDetails && showTooltip && (
        <div className="absolute z-50 w-80 p-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {t(document.i18nKey + '.title' as any)}
              </h4>
              <p className="text-sm text-gray-600">
                {t(document.i18nKey + '.short' as any)}
              </p>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-1">Details:</h5>
              <p className="text-sm text-gray-600">
                {t(document.i18nKey + '.details' as any)}
              </p>
            </div>

            {document.formatHints && document.formatHints.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Format:</h5>
                <div className="flex flex-wrap gap-1">
                  {document.formatHints.map((hint, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="capitalize">{document.category}</span>
                <span className="flex items-center gap-1">
                  {document.fundingTypes.map((type, index) => (
                    <span key={type}>
                      {type === 'grants' ? '🧾' : 
                       type === 'bankLoans' ? '🏦' : 
                       type === 'equity' ? '📈' : '🛂'}
                      {index < document.fundingTypes.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for lists
export function DocumentTagCompact({ 
  document, 
  variant = 'default',
  className = ''
}: Omit<DocumentTagProps, 'size' | 'showTooltip'>) {
  const { t } = useI18n();

  const variantClasses = {
    default: 'bg-gray-50 text-gray-600',
    included: 'bg-blue-50 text-blue-600',
    optional: 'bg-green-50 text-green-600'
  };

  return (
    <div className={`
      inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
      ${variantClasses[variant]}
      ${className}
    `}>
      <FileText className="w-3 h-3" />
      <span>{t(document.i18nKey + '.title' as any)}</span>
    </div>
  );
}
