import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
const USER_SELECTED_KEY = 'plan2fund-user-selected';

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

const getUserSelected = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(USER_SELECTED_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read user selection from localStorage:', error);
    return false;
  }
};

const setUserSelected = (selected: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_SELECTED_KEY, selected.toString());
  } catch (error) {
    console.warn('Failed to save user selection to localStorage:', error);
  }
};

// Validate locale exists in translations
const isValidLocale = (locale: string): locale is keyof typeof translations => {
  return locale in translations;
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Initialize with English as default, will be updated on client-side
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);
  const hasUserSelected = useRef<boolean>(getUserSelected());
  
  // Load stored user preference on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedLocale = getStoredLocale();
    if (storedLocale && isValidLocale(storedLocale) && storedLocale !== locale) {
      setLocaleState(storedLocale);
    }
  }, []);

  // Override setLocale to track user selections
  const setUserLocale = (newLocale: string) => {
    // Clear any conflicting stored locale
    const storedLocale = getStoredLocale();
    if (storedLocale && storedLocale !== newLocale) {
      localStorage.removeItem(STORAGE_KEY);
    }
    
    hasUserSelected.current = true; // Mark that user made a selection (synchronous)
    setUserSelected(true); // Persist to localStorage
    
    // Update state and storage
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  };

  const setLocale = setUserLocale;

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
