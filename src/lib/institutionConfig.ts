export interface InstitutionConfig {
  name: string;
  baseUrl: string;
  programUrls: string[];
  selectors: {
    name: string[];
    description: string[];
    eligibility: string[];
    requirements: string[];
    contact: string[];
  };
  fundingTypes: string[]; // Only financial mechanisms
  programFocus: string[]; // Program categories/focus areas
  region: string;
  autoDiscovery: boolean; // Phase 4: Enable auto-discovery
  keywords: string[]; // Keywords for program detection
}

export const institutions: InstitutionConfig[] = [
  // === GOVERNMENT INSTITUTIONS (Multi-type) ===
  
  // Austrian Government Institutions
  {
    name: 'Austria Wirtschaftsservice (AWS)',
    baseUrl: 'https://aws.at',
    programUrls: [
      'https://aws.at/de/foerderungen'  // Let auto-discovery find the rest
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'loan', 'equity'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'grant', 'startup', 'innovation', 'investition', 'export']
  },
  {
    name: 'Austrian Research Promotion Agency (FFG)',
    baseUrl: 'https://www.ffg.at',
    programUrls: [
      'https://www.ffg.at/foerderungen'  // Let auto-discovery find the rest
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'research', 'innovation', 'development', 'trl', 'basisprogramm']
  },
  {
    name: 'Vienna Business Agency (VBA)',
    baseUrl: 'https://www.vba.at',
    programUrls: [
      'https://www.vba.at/foerderungen'  // Let auto-discovery find the rest
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Vienna',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'startup', 'innovation', 'business', 'vienna', 'export']
  },
  {
    name: 'AMS (Arbeitsmarktservice)',
    baseUrl: 'https://www.ams.at',
    programUrls: [
      'https://www.ams.at/foerderungen',
      'https://www.ams.at/startup-foerderungen',
      'https://www.ams.at/arbeitsmarkt-foerderungen',
      'https://www.ams.at/ausbildung-foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'employment', 'training', 'arbeitsmarkt', 'job', 'ausbildung']
  },
  {
    name: 'WKO (Wirtschaftskammer Österreich)',
    baseUrl: 'https://www.wko.at',
    programUrls: [
      'https://www.wko.at/foerderungen',
      'https://www.wko.at/startup-foerderungen',
      'https://www.wko.at/innovation-foerderungen',
      'https://www.wko.at/export-foerderungen',
      'https://www.wko.at/ausbildung-foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'business', 'innovation', 'export', 'ausbildung', 'wirtschaft']
  },
  {
    name: 'ÖBS (Österreichische Bundesbahnen)',
    baseUrl: 'https://www.oebb.at',
    programUrls: [
      'https://www.oebb.at/unternehmen/foerderungen',
      'https://www.oebb.at/innovation/foerderungen',
      'https://www.oebb.at/nachhaltigkeit/foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'innovation', 'nachhaltigkeit', 'transport', 'bahn', 'mobilität']
  },

  // === COMMERCIAL BANKS (Single-type) ===
  
  // Austrian Commercial Banks
  {
    name: 'Bank Austria',
    baseUrl: 'https://www.bankaustria.at',
    programUrls: [
      'https://www.bankaustria.at/unternehmen/kredite',
      'https://www.bankaustria.at/unternehmen/finanzierung',
      'https://www.bankaustria.at/unternehmen/startup-finanzierung',
      'https://www.bankaustria.at/unternehmen/export-finanzierung',
      'https://www.bankaustria.at/unternehmen/kredite/betriebsmittelkredit',
      'https://www.bankaustria.at/unternehmen/kredite/investitionskredit',
      'https://www.bankaustria.at/unternehmen/kredite/immobilienkredit',
      'https://www.bankaustria.at/unternehmen/kredite/leasing',
      'https://www.bankaustria.at/unternehmen/kredite/factoring',
      'https://www.bankaustria.at/unternehmen/kredite/buergschaft',
      'https://www.bankaustria.at/unternehmen/kredite/exportfinanzierung',
      'https://www.bankaustria.at/unternehmen/kredite/startup-kredit',
      'https://www.bankaustria.at/unternehmen/kredite/innovation-kredit',
      'https://www.bankaustria.at/unternehmen/kredite/nachhaltigkeits-kredit',
      'https://www.bankaustria.at/unternehmen/kredite/digitalisierungs-kredit'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['bank_loan'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'darlehen', 'finanzierung', 'startup', 'export', 'unternehmen']
  },
  {
    name: 'Erste Bank',
    baseUrl: 'https://www.erstebank.at',
    programUrls: [
      'https://www.erstebank.at/unternehmen/kredite',
      'https://www.erstebank.at/unternehmen/finanzierung',
      'https://www.erstebank.at/unternehmen/startup',
      'https://www.erstebank.at/unternehmen/leasing'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['bank_loan', 'leasing'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'darlehen', 'finanzierung', 'startup', 'leasing', 'unternehmen']
  },
  {
    name: 'Raiffeisen Bank',
    baseUrl: 'https://www.raiffeisen.at',
    programUrls: [
      'https://www.raiffeisen.at/unternehmen/kredite',
      'https://www.raiffeisen.at/unternehmen/finanzierung',
      'https://www.raiffeisen.at/unternehmen/startup',
      'https://www.raiffeisen.at/unternehmen/leasing'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['bank_loan', 'leasing'],
    programFocus: [], // Will be auto-detected
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'darlehen', 'finanzierung', 'startup', 'leasing', 'unternehmen']
  },

  // === SPECIALIZED PLATFORMS (Single-type) ===
  
  // Crowdfunding Platforms
  {
    name: 'Kickstarter',
    baseUrl: 'https://www.kickstarter.com',
    programUrls: [
      'https://www.kickstarter.com/help/hosting',
      'https://www.kickstarter.com/help/faq/kickstarter+basics'
    ],
    selectors: {
      name: ['h1', '.program-title', '.project-title'],
      description: ['.program-description', '.project-description', 'p'],
      eligibility: ['.eligibility', '.requirements', '.criteria'],
      requirements: ['.requirements', '.guidelines', '.rules'],
      contact: ['.contact', '.support', '.help']
    },
    fundingTypes: ['crowdfunding'],
    programFocus: [], // Will be auto-detected
    region: 'International',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['crowdfunding', 'kickstarter', 'project', 'funding', 'campaign']
  },
  {
    name: 'Indiegogo',
    baseUrl: 'https://www.indiegogo.com',
    programUrls: [
      'https://www.indiegogo.com/learn',
      'https://www.indiegogo.com/help'
    ],
    selectors: {
      name: ['h1', '.program-title', '.project-title'],
      description: ['.program-description', '.project-description', 'p'],
      eligibility: ['.eligibility', '.requirements', '.criteria'],
      requirements: ['.requirements', '.guidelines', '.rules'],
      contact: ['.contact', '.support', '.help']
    },
    fundingTypes: ['crowdfunding'],
    programFocus: [], // Will be auto-detected
    region: 'International',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['crowdfunding', 'indiegogo', 'project', 'funding', 'campaign']
  },

  // === INTERNATIONAL INSTITUTIONS ===
  
  // German Institutions
  {
    name: 'Bundesministerium für Wirtschaft und Klimaschutz (BMWK)',
    baseUrl: 'https://www.bmwk.de',
    programUrls: [
      'https://www.bmwk.de/Redaktion/DE/Artikel/Foerderprogramme/foerderprogramme.html',
      'https://www.bmwk.de/Redaktion/DE/Artikel/Innovation/innovation.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: [], // Will be auto-detected
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'innovation', 'forschung', 'startup', 'klimaschutz']
  },
  {
    name: 'KfW Bankengruppe',
    baseUrl: 'https://www.kfw.de',
    programUrls: [
      'https://www.kfw.de/inlandsfoerderung/',
      'https://www.kfw.de/inlandsfoerderung/Unternehmen/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'grant'],
    programFocus: [], // Will be auto-detected
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'darlehen', 'foerderung', 'investition', 'startup']
  },

  // French Institutions
  {
    name: 'Bpifrance',
    baseUrl: 'https://www.bpifrance.fr',
    programUrls: [
      'https://www.bpifrance.fr/nos-solutions/financement',
      'https://www.bpifrance.fr/nos-solutions/accompagnement'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'equity', 'grant'],
    programFocus: [], // Will be auto-detected
    region: 'France',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['financement', 'pret', 'investissement', 'startup', 'innovation']
  },

  // EU Institutions
  {
    name: 'Horizon Europe',
    baseUrl: 'https://ec.europa.eu',
    programUrls: [
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/eu-missions-horizon-europe_en'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'research', 'innovation'],
    programFocus: [], // Will be auto-detected
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['horizon', 'europe', 'research', 'innovation', 'grant']
  },

  // Spanish Institutions
  {
    name: 'CDTI (Centro para el Desarrollo Tecnológico Industrial)',
    baseUrl: 'https://www.cdti.es',
    programUrls: [
      'https://www.cdti.es/oportunidades/ayudas',
      'https://www.cdti.es/oportunidades/programas',
      'https://www.cdti.es/oportunidades/innovacion'
    ],
    selectors: {
      name: ['h1', '.program-title', '.titulo-programa'],
      description: ['.program-description', '.descripcion-programa', 'p'],
      eligibility: ['.eligibilidad', '.requisitos', '.criterios'],
      requirements: ['.requisitos', '.documentos', '.solicitud'],
      contact: ['.contacto', '.informacion', '.datos-contacto']
    },
    fundingTypes: ['grant', 'loan'],
    programFocus: [], // Will be auto-detected
    region: 'Spain',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['ayuda', 'subvencion', 'financiacion', 'innovacion', 'investigacion']
  },
  {
    name: 'ENISA (Empresa Nacional de Innovación)',
    baseUrl: 'https://www.enisa.es',
    programUrls: [
      'https://www.enisa.es/que-hacemos/financiacion',
      'https://www.enisa.es/que-hacemos/participaciones',
      'https://www.enisa.es/que-hacemos/garantias'
    ],
    selectors: {
      name: ['h1', '.program-title', '.titulo-programa'],
      description: ['.program-description', '.descripcion-programa', 'p'],
      eligibility: ['.eligibilidad', '.requisitos', '.criterios'],
      requirements: ['.requisitos', '.documentos', '.solicitud'],
      contact: ['.contacto', '.informacion', '.datos-contacto']
    },
    fundingTypes: ['equity', 'loan'],
    programFocus: [], // Will be auto-detected
    region: 'Spain',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['financiacion', 'participacion', 'garantia', 'inversion', 'startup']
  },

  // Italian Institutions
  {
    name: 'Invitalia (Agenzia Nazionale per l\'Attrazione degli Investimenti)',
    baseUrl: 'https://www.invitalia.it',
    programUrls: [
      'https://www.invitalia.it/incentivi',
      'https://www.invitalia.it/bandi',
      'https://www.invitalia.it/startup'
    ],
    selectors: {
      name: ['h1', '.program-title', '.titolo-programma'],
      description: ['.program-description', '.descrizione-programma', 'p'],
      eligibility: ['.eleggibilita', '.requisiti', '.criteri'],
      requirements: ['.requisiti', '.documenti', '.domanda'],
      contact: ['.contatto', '.informazioni', '.dati-contatto']
    },
    fundingTypes: ['grant', 'loan'],
    programFocus: [], // Will be auto-detected
    region: 'Italy',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['incentivo', 'bando', 'finanziamento', 'startup', 'innovazione']
  },
  {
    name: 'Cassa Depositi e Prestiti (CDP)',
    baseUrl: 'https://www.cdp.it',
    programUrls: [
      'https://www.cdp.it/sostenibilita/finanziamenti',
      'https://www.cdp.it/innovazione/progetti',
      'https://www.cdp.it/territorio/investimenti'
    ],
    selectors: {
      name: ['h1', '.program-title', '.titolo-programma'],
      description: ['.program-description', '.descrizione-programma', 'p'],
      eligibility: ['.eleggibilita', '.requisiti', '.criteri'],
      requirements: ['.requisiti', '.documenti', '.domanda'],
      contact: ['.contatto', '.informazioni', '.dati-contatto']
    },
    fundingTypes: ['loan'],
    programFocus: [], // Will be auto-detected
    region: 'Italy',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['finanziamento', 'investimento', 'sostenibilita', 'innovazione']
  },

  // Dutch Institutions
  {
    name: 'RVO (Rijksdienst voor Ondernemend Nederland)',
    baseUrl: 'https://www.rvo.nl',
    programUrls: [
      'https://www.rvo.nl/subsidies-regelingen',
      'https://www.rvo.nl/innovatie',
      'https://www.rvo.nl/startups'
    ],
    selectors: {
      name: ['h1', '.program-title', '.programma-titel'],
      description: ['.program-description', '.programma-beschrijving', 'p'],
      eligibility: ['.geschiktheid', '.vereisten', '.criteria'],
      requirements: ['.vereisten', '.documenten', '.aanvraag'],
      contact: ['.contact', '.informatie', '.contactgegevens']
    },
    fundingTypes: ['grant', 'subsidy'],
    programFocus: [], // Will be auto-detected
    region: 'Netherlands',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['subsidie', 'regeling', 'innovatie', 'startup', 'financiering']
  },
  {
    name: 'Invest-NL',
    baseUrl: 'https://www.invest-nl.nl',
    programUrls: [
      'https://www.invest-nl.nl/investments',
      'https://www.invest-nl.nl/ventures',
      'https://www.invest-nl.nl/impact'
    ],
    selectors: {
      name: ['h1', '.program-title', '.programma-titel'],
      description: ['.program-description', '.programma-beschrijving', 'p'],
      eligibility: ['.geschiktheid', '.vereisten', '.criteria'],
      requirements: ['.vereisten', '.documenten', '.aanvraag'],
      contact: ['.contact', '.informatie', '.contactgegevens']
    },
    fundingTypes: ['equity', 'venture_capital'],
    programFocus: [], // Will be auto-detected
    region: 'Netherlands',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['investering', 'venture', 'kapitaal', 'impact', 'startup']
  },
  
  // === GERMAN INSTITUTIONS ===
  
  {
    name: 'BMWK - German Federal Ministry for Economic Affairs',
    baseUrl: 'https://www.bmwk.de',
    programUrls: [
      'https://www.bmwk.de/Redaktion/DE/Artikel/Energie/foerderprogramme.html'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'subsidy'],
    programFocus: [],
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'energie', 'innovation', 'forschung']
  },
  
  {
    name: 'KfW - German Development Bank',
    baseUrl: 'https://www.kfw.de',
    programUrls: [
      'https://www.kfw.de/inlandsfoerderung/'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['loan', 'grant'],
    programFocus: [],
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'kredit', 'darlehen', 'finanzierung']
  },
  
  // === FRENCH INSTITUTIONS ===
  
  {
    name: 'Bpifrance - French Public Investment Bank',
    baseUrl: 'https://www.bpifrance.fr',
    programUrls: [
      'https://www.bpifrance.fr/nos-solutions/financement'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.conseiller']
    },
    fundingTypes: ['loan', 'equity', 'grant'],
    programFocus: [],
    region: 'France',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['financement', 'pret', 'investissement', 'innovation']
  },
  
  // === EU INSTITUTIONS ===
  
  {
    name: 'Horizon Europe',
    baseUrl: 'https://ec.europa.eu',
    programUrls: [
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.helpdesk']
    },
    fundingTypes: ['grant'],
    programFocus: [],
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['research', 'innovation', 'funding', 'grant']
  },
  
  // === MORE AUSTRIAN INSTITUTIONS ===
  
  {
    name: 'Österreichische Entwicklungsbank (OeEB)',
    baseUrl: 'https://www.oeeb.at',
    programUrls: [
      'https://www.oeeb.at/de/foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['loan', 'grant'],
    programFocus: [],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'kredit', 'finanzierung']
  },
  
  {
    name: 'Austrian Federal Economic Chamber (WKO)',
    baseUrl: 'https://www.wko.at',
    programUrls: [
      'https://www.wko.at/service/foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'subsidy'],
    programFocus: [],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'subvention', 'beihilfe']
  },
  
  // === MORE GERMAN INSTITUTIONS ===
  
  {
    name: 'Deutsche Bank',
    baseUrl: 'https://www.deutsche-bank.de',
    programUrls: [
      'https://www.deutsche-bank.de/de/unternehmen/kredite'
    ],
    selectors: {
      name: ['h1', '.product-title'],
      description: ['.product-description', 'p'],
      eligibility: ['.eligibility', '.requirements'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.beratung']
    },
    fundingTypes: ['bank_loan'],
    programFocus: [],
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'finanzierung', 'darlehen']
  },
  
  {
    name: 'Commerzbank',
    baseUrl: 'https://www.commerzbank.de',
    programUrls: [
      'https://www.commerzbank.de/unternehmen/kredite'
    ],
    selectors: {
      name: ['h1', '.product-title'],
      description: ['.product-description', 'p'],
      eligibility: ['.eligibility', '.requirements'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.beratung']
    },
    fundingTypes: ['bank_loan'],
    programFocus: [],
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'finanzierung', 'darlehen']
  },
  
  // === MORE EU INSTITUTIONS ===
  
  {
    name: 'European Investment Bank (EIB)',
    baseUrl: 'https://www.eib.org',
    programUrls: [
      'https://www.eib.org/en/products/loans/index.htm'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.helpdesk']
    },
    fundingTypes: ['loan', 'grant'],
    programFocus: [],
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['loan', 'funding', 'investment']
  },
  
  {
    name: 'European Investment Fund (EIF)',
    baseUrl: 'https://www.eif.org',
    programUrls: [
      'https://www.eif.org/what_we_offer/index.htm'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.helpdesk']
    },
    fundingTypes: ['equity', 'venture_capital'],
    programFocus: [],
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['equity', 'venture', 'capital', 'investment']
  }
];

export const fundingTypes = [
  // Financial Mechanisms Only
  'grant', 'loan', 'equity', 'bank_loan', 'leasing', 'crowdfunding',
  'subsidy', 'guarantee', 'incentive', 'investment', 'venture_capital',
  'angel_investment', 'government_support', 'tax_incentive'
];

export const programFocus = [
  // Program Categories/Focus Areas
  'innovation', 'research', 'startup', 'export', 'employment', 'training',
  'business', 'sustainability', 'transport', 'technology', 'digital',
  'environment', 'social', 'education', 'healthcare', 'manufacturing',
  'agriculture', 'tourism', 'culture', 'sports', 'energy', 'mobility'
];

export const regions = [
  'Austria', 'Vienna', 'Germany', 'France', 'Spain', 
  'Italy', 'Netherlands', 'EU', 'International',
  'Madrid', 'Barcelona', 'Rome', 'Milan', 'Amsterdam',
  'Rotterdam', 'Berlin', 'Munich', 'Hamburg', 'Paris',
  'Lyon', 'Marseille', 'Brussels', 'Luxembourg'
];

// Phase 4: Auto-discovery patterns
export const autoDiscoveryPatterns = {
  fundingKeywords: [
    'foerderung', 'grant', 'funding', 'financement', 'finanziamento',
    'loan', 'kredit', 'pret', 'prestito', 'darlehen',
    'equity', 'beteiligung', 'participation', 'partecipazione',
    'investment', 'investissement', 'investimento', 'investition',
    'crowdfunding', 'crowd', 'crowd-funding',
    'startup', 'neugründung', 'création', 'creazione',
    'innovation', 'innovazione', 'innovation', 'innovazione',
    'research', 'forschung', 'recherche', 'ricerca',
    'leasing', 'leasing', 'leasing', 'leasing',
    'bank_loan', 'bankkredit', 'prêt bancaire', 'prestito bancario',
    'subsidy', 'subvention', 'sussidio', 'subsidie'
  ],
  programKeywords: [
    'program', 'programme', 'programma', 'programm',
    'initiative', 'initiative', 'iniziativa',
    'scheme', 'regime', 'regime', 'regime',
    'call', 'aufruf', 'appel', 'bando'
  ],
  exclusionKeywords: [
    'newsletter', 'news', 'press', 'media', 'contact',
    'about', 'ueber', 'about', 'chi-siamo',
    'imprint', 'impressum', 'mentions-legales', 'note-legali',
    'privacy', 'datenschutz', 'confidentialite', 'privacy'
  ]
};