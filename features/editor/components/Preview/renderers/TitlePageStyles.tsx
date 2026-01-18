import React from 'react';

// Different title page layout styles
export type TitlePageStyle = 'minimal' | 'professional' | 'creative' | 'corporate';

// Color themes for title pages
export type TitlePageTheme = 'default' | 'blue' | 'green' | 'dark' | 'light';

// Style configuration
export interface TitlePageStyleConfig {
  layout: TitlePageStyle;
  theme: TitlePageTheme;
  showLogo: boolean;
  showProductType: boolean;
  textAlign: 'left' | 'center' | 'right';
}

// Default configuration
export const DEFAULT_TITLE_PAGE_CONFIG: TitlePageStyleConfig = {
  layout: 'professional',
  theme: 'default',
  showLogo: true,
  showProductType: true,
  textAlign: 'center'
};

// Theme color mappings
export const THEME_COLORS = {
  default: {
    primary: 'text-slate-900',
    secondary: 'text-gray-600',
    accent: 'text-blue-600',
    border: 'border-gray-300',
    background: 'bg-white'
  },
  blue: {
    primary: 'text-blue-900',
    secondary: 'text-blue-700',
    accent: 'text-blue-600',
    border: 'border-blue-200',
    background: 'bg-blue-50'
  },
  green: {
    primary: 'text-green-900',
    secondary: 'text-green-700',
    accent: 'text-green-600',
    border: 'border-green-200',
    background: 'bg-green-50'
  },
  dark: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    accent: 'text-blue-400',
    border: 'border-gray-600',
    background: 'bg-gray-900'
  },
  light: {
    primary: 'text-gray-900',
    secondary: 'text-gray-500',
    accent: 'text-gray-700',
    border: 'border-gray-200',
    background: 'bg-gray-50'
  }
};

// Simple, clean title page renderer
export function SimpleTitlePageRenderer({ 
  planDocument, 
  config = DEFAULT_TITLE_PAGE_CONFIG,
  getField
}: {
  planDocument: any;
  config?: TitlePageStyleConfig;
  getField: (key: string) => string | undefined;
}) {
  const colors = THEME_COLORS[config.theme];
  
  // Only show product type when selected and config allows it
  const showProductType = config.showProductType && planDocument.productType;
  
  return (
    <div className={`preview-title-page export-preview-page ${colors.background}`} 
         data-section-id="metadata">
      <div className="flex flex-col justify-between h-full pb-16 px-12">
        {/* Header - Logo */}
        {config.showLogo && getField('logoUrl') && (
          <div className="flex-shrink-0 pt-12 flex justify-center">
            <img 
              src={getField('logoUrl')} 
              alt="Company Logo" 
              className="max-h-16 object-contain"
            />
          </div>
        )}
        
        {/* Product Type */}
        {showProductType && (
          <div className="flex justify-center mt-4">
            <span className={`text-sm font-semibold uppercase tracking-wider ${colors.secondary}`}>
              {planDocument.productType === 'strategy' ? 'Strategy Document' :
               planDocument.productType === 'review' ? 'Upgrade & Review' :
               planDocument.productType === 'submission' ? 'Custom Business Plan' : ''}
            </span>
          </div>
        )}
        
        {/* Main Content */}
        <div className={`flex-1 flex flex-col justify-center ${config.textAlign === 'center' ? 'items-center text-center' : config.textAlign === 'right' ? 'items-end text-right' : 'items-start text-left'} px-8`}>
          <div className="max-w-2xl w-full">
            {/* Title */}
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 leading-tight ${colors.primary}`}>
              {getField('title') || 'Your Project Title'}
            </h1>
            
            {/* Subtitle */}
            {getField('subtitle') && (
              <p className={`text-xl mb-6 leading-relaxed ${colors.secondary}`}>
                {getField('subtitle')}
              </p>
            )}
            
            {/* Company Info */}
            <div className="mb-8">
              <h2 className={`text-2xl font-semibold mb-2 ${colors.primary}`}>
                {getField('companyName') || 'Your Company Name'}
              </h2>
              {getField('legalForm') && (
                <p className={colors.secondary}>
                  {getField('legalForm')}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer - Contact Info */}
        <div className="flex-shrink-0 w-full">
          <div className={`${colors.border} pt-8`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className={`font-semibold uppercase tracking-wide mb-2 ${colors.primary}`}>
                  Contact
                </h3>
                <div className={`space-y-1 ${colors.secondary}`}>
                  <p>{getField('author') || 'Your Name'}</p>
                  {getField('email') && <p>{getField('email')}</p>}
                  {getField('phone') && <p>{getField('phone')}</p>}
                </div>
              </div>
              
              <div>
                <h3 className={`font-semibold uppercase tracking-wide mb-2 ${colors.primary}`}>
                  Information
                </h3>
                <div className={`space-y-1 ${colors.secondary}`}>
                  {getField('date') && <p>Date: {getField('date')}</p>}
                  <p>Prepared: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}