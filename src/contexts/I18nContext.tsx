import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../../i18n/en.json';
import deTranslations from '../../i18n/de.json';

type Translations = typeof enTranslations;

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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('en');

  // Initialize locale from browser language or localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('plan2fund-locale');
    if (savedLocale && translations[savedLocale as keyof typeof translations]) {
      setLocaleState(savedLocale);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (translations[browserLang as keyof typeof translations]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('plan2fund-locale', newLocale);
  };

  const t = (key: keyof Translations): string => {
    const translation = translations[locale as keyof typeof translations]?.[key];
    return translation || translations.en[key] || key;
  };

  const availableLocales = Object.keys(translations);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, availableLocales }}>
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
