// Internationalization support for DE/EN labels and tooltips
export type Language = 'en' | 'de';

export interface I18nConfig {
  language: Language;
  fallbackLanguage: Language;
}

// Default configuration
const defaultConfig: I18nConfig = {
  language: 'en',
  fallbackLanguage: 'en'
};

// Translation keys and values
const translations = {
  en: {
    // Common UI elements
    'ui.loading': 'Loading...',
    'ui.error': 'Error',
    'ui.success': 'Success',
    'ui.warning': 'Warning',
    'ui.info': 'Information',
    'ui.close': 'Close',
    'ui.cancel': 'Cancel',
    'ui.save': 'Save',
    'ui.edit': 'Edit',
    'ui.delete': 'Delete',
    'ui.export': 'Export',
    'ui.import': 'Import',
    
    // Navigation
    'nav.home': 'Home',
    'nav.recommendations': 'Recommendations',
    'nav.editor': 'Editor',
    'nav.about': 'About',
    
    // Recommendation system
    'reco.title': 'Your Funding Recommendations',
    'reco.subtitle': 'Find the best funding programs for your business',
    'reco.start_wizard': 'Start Wizard',
    'reco.try_ai_intake': 'Try AI Intake',
    'reco.eligibility': 'Eligibility',
    'reco.score': 'Match Score',
    'reco.amount': 'Funding Amount',
    'reco.timeline': 'Timeline',
    'reco.success_rate': 'Success Rate',
    'reco.apply_now': 'Apply Now',
    'reco.view_details': 'View Details',
    'reco.report_mismatch': 'Report Mismatch',
    
    // Editor
    'editor.title': 'Business Plan Editor',
    'editor.subtitle': 'Create a funding-ready business plan',
    'editor.sections': {
      'executive_summary': 'Executive Summary',
      'company_description': 'Company Description',
      'market_analysis': 'Market Analysis',
      'financial_projections': 'Financial Projections',
      'funding_request': 'Funding Request'
    },
    'editor.actions': {
      'rewrite': 'Rewrite',
      'review': 'Review',
      'export': 'Export',
      'save': 'Save'
    },
    'editor.checklist': 'Program Checklist',
    'editor.word_count': 'words',
    'editor.last_modified': 'Last modified',
    
    // Checklist status
    'checklist.passed': 'Requirement met',
    'checklist.warning': 'Requirement partially met',
    'checklist.failed': 'Requirement not met',
    'checklist.action': 'Action required',
    
    // Program types
    'program.types': {
      'grant': 'Grant',
      'loan': 'Loan',
      'equity': 'Equity',
      'visa': 'Visa',
      'incubator': 'Incubator',
      'mixed': 'Mixed',
      'grant_equity': 'Grant + Equity',
      'grant_support': 'Grant Support'
    },
    
    // Tooltips
    'tooltip.eligibility': 'Whether you meet the basic requirements for this program',
    'tooltip.score': 'How well this program matches your needs (0-100%)',
    'tooltip.amount': 'The funding amount available from this program',
    'tooltip.timeline': 'How long the application process typically takes',
    'tooltip.success_rate': 'Percentage of applicants who successfully receive funding',
    'tooltip.rewrite': 'Use AI to improve this section for the selected program',
    'tooltip.review': 'Get AI feedback and tips for this section',
    'tooltip.checklist': 'Requirements and gaps for the selected program',
    
    // Error messages
    'error.no_programs': 'No funding programs found for your criteria',
    'error.network': 'Network error. Please try again.',
    'error.validation': 'Please check your input and try again.',
    'error.llm_timeout': 'AI service timeout. Using fallback mode.',
    'error.llm_cap': 'AI service limit reached. Using fallback mode.',
    
    // Success messages
    'success.recommendations_loaded': 'Recommendations loaded successfully',
    'success.content_saved': 'Content saved successfully',
    'success.exported': 'Document exported successfully',
    
    // Placeholders
    'placeholder.search': 'Search programs...',
    'placeholder.answers': 'Enter your answers...',
    'placeholder.content': 'Start writing your content here...',
    
    // Questions (simplified for non-experts)
    'questions.q1_country': 'Which country is your business based in?',
    'questions.q2_entity_stage': 'What stage is your business at?',
    'questions.q4_theme': 'What is your business focus?',
    'questions.q5_maturity_trl': 'How developed is your product/service?',
    'questions.q8_funding_types': 'What types of funding are you interested in?',
    'questions.q9_collaboration': 'Are you open to collaborating with other companies?',
    'questions.q10_ip_control': 'How important is controlling your intellectual property?',
    'questions.q11_environmental_impact': 'Does your business have environmental benefits?',
    'questions.q12_co2_reduction': 'Does your business help reduce CO2 emissions?',
    'questions.q13_equity_willingness': 'Are you willing to give up equity in your company?',
    'questions.q14_loan_willingness': 'Are you willing to take on debt?',
    'questions.q15_partnership_experience': 'Do you have experience with business partnerships?',
    'questions.q16_research_collaboration': 'Are you interested in research collaborations?',
    'questions.q17_visa_required': 'Do you need a visa to work in Austria?',
    'questions.q18_work_permit': 'Do you have a work permit for Austria?',
    'questions.q19_eu_citizen': 'Are you an EU citizen?',
    
    // Context Chips
    'chips.bank_readiness.title': 'Bank Readiness',
    'chips.bank_readiness.description': 'Prepare for bank funding requirements',
    'chips.bank_readiness.step1.title': 'Financial Records',
    'chips.bank_readiness.step1.description': 'Ensure your financial records are up to date',
    'chips.bank_readiness.step1.action': 'Update records',
    'chips.bank_readiness.step2.title': 'Business Plan',
    'chips.bank_readiness.step2.description': 'Create a comprehensive business plan',
    'chips.bank_readiness.step2.action': 'Create plan',
    
    'chips.grant_coach.title': 'Grant Coach',
    'chips.grant_coach.description': 'Get help with grant applications',
    'chips.grant_coach.step1.title': 'Eligibility Check',
    'chips.grant_coach.step1.description': 'Verify you meet all eligibility requirements',
    'chips.grant_coach.step1.action': 'Check eligibility',
    
    'chips.ip_fto.title': 'IP & FTO',
    'chips.ip_fto.description': 'Protect your intellectual property',
    'chips.ip_fto.step1.title': 'IP Assessment',
    'chips.ip_fto.step1.description': 'Assess your intellectual property needs',
    'chips.ip_fto.step1.action': 'Start assessment',
    
    'chips.tax_accounting.title': 'Tax & Accounting',
    'chips.tax_accounting.description': 'Ensure proper tax and accounting setup',
    'chips.tax_accounting.step1.title': 'Tax Registration',
    'chips.tax_accounting.step1.description': 'Register for appropriate taxes',
    'chips.tax_accounting.step1.action': 'Register now',
    
    'chips.co_funding.title': 'Co-Funding',
    'chips.co_funding.description': 'Find co-funding opportunities',
    'chips.co_funding.step1.title': 'Co-Funding Search',
    'chips.co_funding.step1.description': 'Search for co-funding partners',
    'chips.co_funding.step1.action': 'Search partners',
    
    'chips.collaboration.title': 'Collaboration',
    'chips.collaboration.description': 'Build strategic partnerships',
    'chips.collaboration.step1.title': 'Partnership Strategy',
    'chips.collaboration.step1.description': 'Develop a partnership strategy',
    'chips.collaboration.step1.action': 'Create strategy',
    
    // Smart Prompts
    'prompts.precision.title': 'Quick Question',
    'prompts.precision.description': 'This could improve your funding options',
    'prompts.precision.questions.collaboration': 'Can you cover ~30% co-funding (cash or in-kind)?',
    'prompts.precision.questions.ip_control': 'How important is controlling your intellectual property?',
    'prompts.precision.questions.equity_willingness': 'Are you willing to give up equity in your company?',
    'prompts.precision.questions.loan_willingness': 'Are you willing to take on debt?',
    'prompts.precision.questions.default': 'Would you like to explore additional funding options?',
    'prompts.precision.options.yes': 'Yes',
    'prompts.precision.options.no': 'No',
    'prompts.precision.options.unsure': 'Unsure',
    
    'prompts.save_nudge.title': 'Missing Information',
    'prompts.save_nudge.description': 'This could strengthen your application',
    'prompts.save_nudge.questions.collaboration': 'Would you like to add information about partnerships?',
    'prompts.save_nudge.questions.ip_control': 'Would you like to add information about intellectual property?',
    'prompts.save_nudge.questions.equity_willingness': 'Would you like to add information about equity?',
    'prompts.save_nudge.questions.loan_willingness': 'Would you like to add information about debt?',
    'prompts.save_nudge.questions.default': 'Would you like to add more information?',
    'prompts.save_nudge.options.add': 'Add now',
    'prompts.save_nudge.options.skip': 'Skip',
    
    'prompts.pre_export.title': 'Final Check',
    'prompts.pre_export.description': 'One more thing to improve your plan',
    'prompts.pre_export.questions.grant': 'Add 2-line milestone plan?',
    'prompts.pre_export.questions.loan': 'Add repayment timeline?',
    'prompts.pre_export.questions.default': 'Add key milestones?',
    'prompts.pre_export.options.add': 'Add now',
    'prompts.pre_export.options.skip': 'Skip'
  },
  
  de: {
    // Common UI elements
    'ui.loading': 'Lädt...',
    'ui.error': 'Fehler',
    'ui.success': 'Erfolg',
    'ui.warning': 'Warnung',
    'ui.info': 'Information',
    'ui.close': 'Schließen',
    'ui.cancel': 'Abbrechen',
    'ui.save': 'Speichern',
    'ui.edit': 'Bearbeiten',
    'ui.delete': 'Löschen',
    'ui.export': 'Exportieren',
    'ui.import': 'Importieren',
    
    // Navigation
    'nav.home': 'Startseite',
    'nav.recommendations': 'Empfehlungen',
    'nav.editor': 'Editor',
    'nav.about': 'Über uns',
    
    // Recommendation system
    'reco.title': 'Ihre Fördermittel-Empfehlungen',
    'reco.subtitle': 'Finden Sie die besten Förderprogramme für Ihr Unternehmen',
    'reco.start_wizard': 'Assistent starten',
    'reco.try_ai_intake': 'KI-Eingabe versuchen',
    'reco.eligibility': 'Berechtigung',
    'reco.score': 'Übereinstimmung',
    'reco.amount': 'Förderbetrag',
    'reco.timeline': 'Zeitrahmen',
    'reco.success_rate': 'Erfolgsrate',
    'reco.apply_now': 'Jetzt bewerben',
    'reco.view_details': 'Details anzeigen',
    'reco.report_mismatch': 'Fehler melden',
    
    // Editor
    'editor.title': 'Businessplan-Editor',
    'editor.subtitle': 'Erstellen Sie einen förderfähigen Businessplan',
    'editor.sections': {
      'executive_summary': 'Zusammenfassung',
      'company_description': 'Unternehmensbeschreibung',
      'market_analysis': 'Marktanalyse',
      'financial_projections': 'Finanzprognosen',
      'funding_request': 'Förderantrag'
    },
    'editor.actions': {
      'rewrite': 'Umschreiben',
      'review': 'Überprüfen',
      'export': 'Exportieren',
      'save': 'Speichern'
    },
    'editor.checklist': 'Programm-Checkliste',
    'editor.word_count': 'Wörter',
    'editor.last_modified': 'Zuletzt geändert',
    
    // Checklist status
    'checklist.passed': 'Anforderung erfüllt',
    'checklist.warning': 'Anforderung teilweise erfüllt',
    'checklist.failed': 'Anforderung nicht erfüllt',
    'checklist.action': 'Aktion erforderlich',
    
    // Program types
    'program.types': {
      'grant': 'Zuschuss',
      'loan': 'Darlehen',
      'equity': 'Eigenkapital',
      'visa': 'Visum',
      'incubator': 'Inkubator',
      'mixed': 'Gemischt',
      'grant_equity': 'Zuschuss + Eigenkapital',
      'grant_support': 'Zuschuss-Unterstützung'
    },
    
    // Tooltips
    'tooltip.eligibility': 'Ob Sie die Grundvoraussetzungen für dieses Programm erfüllen',
    'tooltip.score': 'Wie gut dieses Programm zu Ihren Bedürfnissen passt (0-100%)',
    'tooltip.amount': 'Der verfügbare Förderbetrag aus diesem Programm',
    'tooltip.timeline': 'Wie lange der Bewerbungsprozess typischerweise dauert',
    'tooltip.success_rate': 'Prozentsatz der Antragsteller, die erfolgreich Förderung erhalten',
    'tooltip.rewrite': 'KI verwenden, um diesen Abschnitt für das ausgewählte Programm zu verbessern',
    'tooltip.review': 'KI-Feedback und Tipps für diesen Abschnitt erhalten',
    'tooltip.checklist': 'Anforderungen und Lücken für das ausgewählte Programm',
    
    // Error messages
    'error.no_programs': 'Keine Förderprogramme für Ihre Kriterien gefunden',
    'error.network': 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    'error.validation': 'Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.',
    'error.llm_timeout': 'KI-Service-Timeout. Fallback-Modus wird verwendet.',
    'error.llm_cap': 'KI-Service-Limit erreicht. Fallback-Modus wird verwendet.',
    
    // Success messages
    'success.recommendations_loaded': 'Empfehlungen erfolgreich geladen',
    'success.content_saved': 'Inhalt erfolgreich gespeichert',
    'success.exported': 'Dokument erfolgreich exportiert',
    
    // Placeholders
    'placeholder.search': 'Programme suchen...',
    'placeholder.answers': 'Geben Sie Ihre Antworten ein...',
    'placeholder.content': 'Beginnen Sie hier mit dem Schreiben Ihres Inhalts...',
    
    // Questions (simplified for non-experts)
    'questions.q1_country': 'In welchem Land ist Ihr Unternehmen ansässig?',
    'questions.q2_entity_stage': 'In welcher Phase befindet sich Ihr Unternehmen?',
    'questions.q4_theme': 'Worauf konzentriert sich Ihr Unternehmen?',
    'questions.q5_maturity_trl': 'Wie entwickelt ist Ihr Produkt/Service?',
    'questions.q8_funding_types': 'Welche Arten von Förderung interessieren Sie?',
    'questions.q9_collaboration': 'Sind Sie offen für Zusammenarbeit mit anderen Unternehmen?',
    'questions.q10_ip_control': 'Wie wichtig ist die Kontrolle über Ihr geistiges Eigentum?',
    'questions.q11_environmental_impact': 'Hat Ihr Unternehmen Umweltvorteile?',
    'questions.q12_co2_reduction': 'Hilft Ihr Unternehmen bei der CO2-Reduktion?',
    'questions.q13_equity_willingness': 'Sind Sie bereit, Anteile an Ihrem Unternehmen abzugeben?',
    'questions.q14_loan_willingness': 'Sind Sie bereit, Schulden aufzunehmen?',
    'questions.q15_partnership_experience': 'Haben Sie Erfahrung mit Geschäftspartnerschaften?',
    'questions.q16_research_collaboration': 'Interessieren Sie sich für Forschungskooperationen?',
    'questions.q17_visa_required': 'Benötigen Sie ein Visum, um in Österreich zu arbeiten?',
    'questions.q18_work_permit': 'Haben Sie eine Arbeitserlaubnis für Österreich?',
    'questions.q19_eu_citizen': 'Sind Sie EU-Bürger?',
    
    // Context Chips
    'chips.bank_readiness.title': 'Bank-Bereitschaft',
    'chips.bank_readiness.description': 'Vorbereitung auf Bank-Finanzierung',
    'chips.bank_readiness.step1.title': 'Finanzunterlagen',
    'chips.bank_readiness.step1.description': 'Stellen Sie sicher, dass Ihre Finanzunterlagen aktuell sind',
    'chips.bank_readiness.step1.action': 'Unterlagen aktualisieren',
    'chips.bank_readiness.step2.title': 'Businessplan',
    'chips.bank_readiness.step2.description': 'Erstellen Sie einen umfassenden Businessplan',
    'chips.bank_readiness.step2.action': 'Plan erstellen',
    
    'chips.grant_coach.title': 'Förderberatung',
    'chips.grant_coach.description': 'Hilfe bei Förderanträgen',
    'chips.grant_coach.step1.title': 'Eligibility-Check',
    'chips.grant_coach.step1.description': 'Überprüfen Sie alle Förderbedingungen',
    'chips.grant_coach.step1.action': 'Bedingungen prüfen',
    
    'chips.ip_fto.title': 'IP & FTO',
    'chips.ip_fto.description': 'Schützen Sie Ihr geistiges Eigentum',
    'chips.ip_fto.step1.title': 'IP-Bewertung',
    'chips.ip_fto.step1.description': 'Bewerten Sie Ihre IP-Bedürfnisse',
    'chips.ip_fto.step1.action': 'Bewertung starten',
    
    'chips.tax_accounting.title': 'Steuern & Buchhaltung',
    'chips.tax_accounting.description': 'Sorgen Sie für ordnungsgemäße Steuer- und Buchhaltungsstruktur',
    'chips.tax_accounting.step1.title': 'Steuerregistrierung',
    'chips.tax_accounting.step1.description': 'Registrieren Sie sich für entsprechende Steuern',
    'chips.tax_accounting.step1.action': 'Jetzt registrieren',
    
    'chips.co_funding.title': 'Co-Finanzierung',
    'chips.co_funding.description': 'Finden Sie Co-Finanzierungsmöglichkeiten',
    'chips.co_funding.step1.title': 'Co-Finanzierungssuche',
    'chips.co_funding.step1.description': 'Suchen Sie nach Co-Finanzierungspartnern',
    'chips.co_funding.step1.action': 'Partner suchen',
    
    'chips.collaboration.title': 'Zusammenarbeit',
    'chips.collaboration.description': 'Bauen Sie strategische Partnerschaften auf',
    'chips.collaboration.step1.title': 'Partnerschaftsstrategie',
    'chips.collaboration.step1.description': 'Entwickeln Sie eine Partnerschaftsstrategie',
    'chips.collaboration.step1.action': 'Strategie erstellen',
    
    // Smart Prompts
    'prompts.precision.title': 'Schnelle Frage',
    'prompts.precision.description': 'Das könnte Ihre Fördermöglichkeiten verbessern',
    'prompts.precision.questions.collaboration': 'Können Sie ~30% Co-Finanzierung (Bargeld oder Sachleistungen) aufbringen?',
    'prompts.precision.questions.ip_control': 'Wie wichtig ist die Kontrolle über Ihr geistiges Eigentum?',
    'prompts.precision.questions.equity_willingness': 'Sind Sie bereit, Anteile an Ihrem Unternehmen abzugeben?',
    'prompts.precision.questions.loan_willingness': 'Sind Sie bereit, Schulden aufzunehmen?',
    'prompts.precision.questions.default': 'Möchten Sie zusätzliche Fördermöglichkeiten erkunden?',
    'prompts.precision.options.yes': 'Ja',
    'prompts.precision.options.no': 'Nein',
    'prompts.precision.options.unsure': 'Unsicher',
    
    'prompts.save_nudge.title': 'Fehlende Informationen',
    'prompts.save_nudge.description': 'Das könnte Ihre Bewerbung stärken',
    'prompts.save_nudge.questions.collaboration': 'Möchten Sie Informationen über Partnerschaften hinzufügen?',
    'prompts.save_nudge.questions.ip_control': 'Möchten Sie Informationen über geistiges Eigentum hinzufügen?',
    'prompts.save_nudge.questions.equity_willingness': 'Möchten Sie Informationen über Eigenkapital hinzufügen?',
    'prompts.save_nudge.questions.loan_willingness': 'Möchten Sie Informationen über Schulden hinzufügen?',
    'prompts.save_nudge.questions.default': 'Möchten Sie weitere Informationen hinzufügen?',
    'prompts.save_nudge.options.add': 'Jetzt hinzufügen',
    'prompts.save_nudge.options.skip': 'Überspringen',
    
    'prompts.pre_export.title': 'Finale Überprüfung',
    'prompts.pre_export.description': 'Noch eine Sache, um Ihren Plan zu verbessern',
    'prompts.pre_export.questions.grant': '2-Zeilen Meilensteinplan hinzufügen?',
    'prompts.pre_export.questions.loan': 'Rückzahlungszeitplan hinzufügen?',
    'prompts.pre_export.questions.default': 'Wichtige Meilensteine hinzufügen?',
    'prompts.pre_export.options.add': 'Jetzt hinzufügen',
    'prompts.pre_export.options.skip': 'Überspringen'
  }
};

// Current language state
let currentConfig: I18nConfig = { ...defaultConfig };

// Set language
export function setLanguage(language: Language): void {
  currentConfig.language = language;
}

// Get current language
export function getCurrentLanguage(): Language {
  return currentConfig.language;
}

// Get translation
export function t(key: string, params?: Record<string, string | number>): string {
  const translation = (translations[currentConfig.language] as any)?.[key] ||
                     (translations[currentConfig.fallbackLanguage] as any)?.[key] ||
                     key;
  
  // Simple parameter replacement
  if (params) {
    return Object.entries(params).reduce((str: string, [param, value]) =>
      str.replace(new RegExp(`{${param}}`, 'g'), String(value)), translation);
  }
  
  return translation;
}

// Get nested translation (e.g., 'editor.sections.executive_summary')
export function tn(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let translation = translations[currentConfig.language];
  
  for (const k of keys) {
    translation = (translation as any)?.[k];
    if (!translation) {
      // Fallback to fallback language
      translation = translations[currentConfig.fallbackLanguage] as any;
      for (const k2 of keys) {
        translation = (translation as any)?.[k2];
        if (!translation) break;
      }
      break;
    }
  }
  
  if (typeof translation !== 'string') {
    return key; // Return key if translation not found
  }
  
  // Simple parameter replacement
  if (params) {
    return Object.entries(params).reduce((str: string, [param, value]) =>
      str.replace(new RegExp(`{${param}}`, 'g'), String(value)), translation);
  }
  
  return translation;
}

// Check if translation exists
export function hasTranslation(key: string): boolean {
  const keys = key.split('.');
  let translation = translations[currentConfig.language];
  
  for (const k of keys) {
    translation = (translation as any)?.[k];
    if (!translation) return false;
  }
  
  return typeof translation === 'string';
}

// Get all available languages
export function getAvailableLanguages(): Language[] {
  return Object.keys(translations) as Language[];
}

// Initialize i18n
export function initI18n(config?: Partial<I18nConfig>): void {
  currentConfig = { ...defaultConfig, ...config };
}

// Export default instance
export default {
  setLanguage,
  getCurrentLanguage,
  t,
  tn,
  hasTranslation,
  getAvailableLanguages,
  initI18n
};
