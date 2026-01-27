import React from 'react';
import { useI18n } from './shared/contexts/I18nContext';

export default function TestTranslation() {
  const { t, locale, setLocale } = useI18n();
  
  // Test the specific translation key
  const testKey = 'reco.options.legal_form.foreign_entity';
  const translatedValue = t(testKey as any);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Translation Test</h2>
      <p><strong>Current Locale:</strong> {locale}</p>
      <p><strong>Test Key:</strong> {testKey}</p>
      <p><strong>Translated Value:</strong> {translatedValue}</p>
      <p><strong>Type of translated value:</strong> {typeof translatedValue}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => setLocale('en')} style={{ marginRight: '10px' }}>
          Switch to English
        </button>
        <button onClick={() => setLocale('de')}>
          Switch to German
        </button>
      </div>
    </div>
  );
}