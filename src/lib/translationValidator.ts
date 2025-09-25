// Translation validation utility
import enTranslations from '../../i18n/en.json';
import deTranslations from '../../i18n/de.json';

export function validateTranslations() {
  const enKeys = Object.keys(enTranslations);
  const deKeys = Object.keys(deTranslations);
  
  const missingInDe = enKeys.filter(key => !deKeys.includes(key));
  const missingInEn = deKeys.filter(key => !enKeys.includes(key));
  
  if (missingInDe.length > 0) {
    console.warn('Missing German translations:', missingInDe);
  }
  
  if (missingInEn.length > 0) {
    console.warn('Missing English translations:', missingInEn);
  }
  
  return {
    isValid: missingInDe.length === 0 && missingInEn.length === 0,
    missingInDe,
    missingInEn,
    totalKeys: enKeys.length
  };
}

// Run validation in development
if (process.env.NODE_ENV === 'development') {
  validateTranslations();
}
