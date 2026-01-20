import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../i18n/translations/en.json';
import deTranslations from '../i18n/translations/de.json';

export type Translations = typeof enTranslations;

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: keyof Translations) => string;
  availableLocales: string[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const translations = {
  en: enTranslations,
  de: deTranslations,
};

const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'plan2fund-locale';

// Safe localStorage access
const getStoredLocale = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read locale from localStorage:', error);
    return null;
  }
};

const setStoredLocale = (locale: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to save locale to localStorage:', error);
  }
};

// Validate locale exists in translations
const isValidLocale = (locale: string): locale is keyof typeof translations => {
  return locale in translations;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default, will be updated on client-side
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);

  // Hydrate locale from localStorage on client-side only
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedLocale = getStoredLocale();
    if (storedLocale && isValidLocale(storedLocale)) {
      setLocaleState(storedLocale);
    } else {
      // Detect browser language
      try {
        const browserLang = navigator.language.split('-')[0];
        if (isValidLocale(browserLang)) {
          setLocaleState(browserLang);
          setStoredLocale(browserLang);
        }
      } catch (error) {
        console.warn('Failed to detect browser language:', error);
      }
    }
  }, []);

  const setLocale = (newLocale: string) => {
    console.log('I18nContext: Attempting to set locale to', newLocale);
    if (!isValidLocale(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}. Falling back to ${DEFAULT_LOCALE}`);
      newLocale = DEFAULT_LOCALE;
    }
    console.log('I18nContext: Setting locale state to', newLocale);
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    console.log('I18nContext: Locale change completed');
  };

  const t = (key: keyof Translations): string => {
    // Ensure we have a valid locale
    const currentLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
    
    // Try current locale first
    const translation = translations[currentLocale]?.[key];
    if (translation && typeof translation === 'string') {
      return translation;
    }
    
    // Fallback to English
    const enTranslation = translations.en?.[key];
    if (enTranslation && typeof enTranslation === 'string') {
      return enTranslation;
    }
    
    // Last resort: return key as string
    return String(key);
  };

  const availableLocales = Object.keys(translations);

  // Debug logging for context provider
  useEffect(() => {
    console.log('I18nContext: Provider re-rendered with locale:', locale);
  }, [locale]);

  const contextValue = { locale, setLocale, t, availableLocales };
  console.log('I18nContext: Providing context value with locale:', contextValue.locale);
  
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
