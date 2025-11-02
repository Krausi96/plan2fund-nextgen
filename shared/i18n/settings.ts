// ========= PLAN2FUND — I18N SETTINGS =========
// Single source of truth for language and tone management

export type AppLanguage = 'de' | 'en';
export type TonePreset = 'neutral' | 'formal' | 'concise';

export interface I18nSettings {
  language: AppLanguage;
  tone: TonePreset;
  availableLanguages: AppLanguage[];
  availableTones: TonePreset[];
}

// Language detection and management
export function getAppLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  
  const saved = localStorage.getItem('plan2fund-locale');
  if (saved === 'de' || saved === 'en') {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'de' ? 'de' : 'en';
}

export function setAppLanguage(language: AppLanguage): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('plan2fund-locale', language);
  // Trigger language change event for components to react
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
}

// Tone management
export function getTonePreset(): TonePreset {
  if (typeof window === 'undefined') return 'neutral';
  
  const saved = localStorage.getItem('plan2fund-tone');
  if (saved === 'neutral' || saved === 'formal' || saved === 'concise') {
    return saved;
  }
  
  return 'neutral';
}

export function setTonePreset(tone: TonePreset): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('plan2fund-tone', tone);
  // Trigger tone change event for components to react
  window.dispatchEvent(new CustomEvent('toneChanged', { detail: { tone } }));
}

// Export labels (language-dependent)
export function getExportLabels(language: AppLanguage) {
  const labels = {
    en: {
      figure: 'Figure',
      table: 'Table',
      sources: 'Sources',
      accessedDate: 'Accessed',
      pageNumber: 'Page'
    },
    de: {
      figure: 'Abbildung',
      table: 'Tabelle',
      sources: 'Quellen',
      accessedDate: 'Abgerufen',
      pageNumber: 'Seite'
    }
  };
  
  return labels[language];
}
