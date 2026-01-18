
// Document-wide styling configuration
export interface DocumentStyleConfig {
  // Global appearance
  theme: 'default' | 'professional' | 'modern' | 'minimal' | 'corporate';
  colorScheme: 'light' | 'dark' | 'blue' | 'green' | 'warm';
  
  // Typography
  fontFamily: 'sans' | 'serif' | 'mono' | 'system';
  fontSize: 'small' | 'normal' | 'large';
  
  // Layout
  pageMargins: 'narrow' | 'normal' | 'wide';
  lineHeight: 'compact' | 'normal' | 'relaxed';
  textAlign: 'left' | 'justify';
  
  // Sections
  showPageNumbers: boolean;
  showSectionNumbers: boolean;
  sectionSpacing: 'compact' | 'normal' | 'spacious';
  
  // Headers & Footers
  headerStyle: 'minimal' | 'detailed' | 'none';
  footerStyle: 'minimal' | 'detailed' | 'none';
  showDocumentTitle: boolean;
  
  // Special Elements
  titlePageStyle: 'minimal' | 'professional' | 'creative' | 'corporate';
  tableStyle: 'striped' | 'bordered' | 'minimal';
  figureCaptions: boolean;
}

// Default document style configuration
export const DEFAULT_DOCUMENT_STYLE: DocumentStyleConfig = {
  theme: 'professional',
  colorScheme: 'light',
  fontFamily: 'sans',
  fontSize: 'normal',
  pageMargins: 'normal',
  lineHeight: 'normal',
  textAlign: 'justify',
  showPageNumbers: true,
  showSectionNumbers: true,
  sectionSpacing: 'normal',
  headerStyle: 'minimal',
  footerStyle: 'minimal',
  showDocumentTitle: true,
  titlePageStyle: 'professional',
  tableStyle: 'striped',
  figureCaptions: true
};

// Theme color palettes
export const COLOR_THEMES = {
  light: {
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    background: 'bg-white',
    border: 'border-gray-200',
    accent: 'text-blue-600'
  },
  dark: {
    text: 'text-white',
    textSecondary: 'text-gray-300',
    background: 'bg-gray-900',
    border: 'border-gray-700',
    accent: 'text-blue-400'
  },
  blue: {
    text: 'text-blue-900',
    textSecondary: 'text-blue-700',
    background: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'text-blue-600'
  },
  green: {
    text: 'text-green-900',
    textSecondary: 'text-green-700',
    background: 'bg-green-50',
    border: 'border-green-200',
    accent: 'text-green-600'
  },
  warm: {
    text: 'text-amber-900',
    textSecondary: 'text-amber-700',
    background: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'text-amber-600'
  }
};

// Apply document styles to elements
export function applyDocumentStyles(config: DocumentStyleConfig) {
  const colors = COLOR_THEMES[config.colorScheme];
  
  return {
    // Text classes
    text: colors.text,
    textSecondary: colors.textSecondary,
    accent: colors.accent,
    
    // Background and borders
    background: colors.background,
    border: colors.border,
    
    // Typography
    fontFamily: getFontFamilyClass(config.fontFamily),
    fontSize: getFontSizeClass(config.fontSize),
    lineHeight: getLineHeightClass(config.lineHeight),
    textAlign: config.textAlign === 'justify' ? 'text-justify' : 'text-left',
    
    // Layout
    pageMargins: getPageMarginClass(config.pageMargins),
    sectionSpacing: getSectionSpacingClass(config.sectionSpacing),
    
    // Headers/Footers
    headerDisplay: config.headerStyle === 'none' ? 'hidden' : 'block',
    footerDisplay: config.footerStyle === 'none' ? 'hidden' : 'block'
  };
}

// Helper functions for CSS classes
function getFontFamilyClass(font: DocumentStyleConfig['fontFamily']): string {
  switch (font) {
    case 'sans': return 'font-sans';
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    case 'system': return 'font-sans';
    default: return 'font-sans';
  }
}

function getFontSizeClass(size: DocumentStyleConfig['fontSize']): string {
  switch (size) {
    case 'small': return 'text-sm';
    case 'normal': return 'text-base';
    case 'large': return 'text-lg';
    default: return 'text-base';
  }
}

function getLineHeightClass(height: DocumentStyleConfig['lineHeight']): string {
  switch (height) {
    case 'compact': return 'leading-tight';
    case 'normal': return 'leading-normal';
    case 'relaxed': return 'leading-relaxed';
    default: return 'leading-normal';
  }
}

function getPageMarginClass(margins: DocumentStyleConfig['pageMargins']): string {
  switch (margins) {
    case 'narrow': return 'px-6';
    case 'normal': return 'px-12';
    case 'wide': return 'px-20';
    default: return 'px-12';
  }
}

function getSectionSpacingClass(spacing: DocumentStyleConfig['sectionSpacing']): string {
  switch (spacing) {
    case 'compact': return 'space-y-4';
    case 'normal': return 'space-y-6';
    case 'spacious': return 'space-y-8';
    default: return 'space-y-6';
  }
}