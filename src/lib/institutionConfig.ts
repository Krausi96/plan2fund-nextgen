export interface InstitutionConfig {
  id?: string;              // UNIQUE ID (per contract review) - optional for backward compatibility
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
  fundingTypes: string[]; // Only financial mechanisms (grant, loan, equity, etc.)
  programFocus?: string[]; // Optional: Program categories/focus areas (auto-detected if not provided)
  region: string | string[]; // Support array for multi-region institutions (per contract review)
  autoDiscovery: boolean; // Phase 4: Enable auto-discovery
  keywords: string[]; // Keywords for program detection
  lastUpdated?: string;    // Track staleness (per contract review)
}

export const institutions: InstitutionConfig[] = [
  // === GOVERNMENT INSTITUTIONS (Multi-type) ===
  
  // Austrian Government Institutions
  {
    id: 'institution_aws',  // Unique ID per contract review
    name: 'Austria Wirtschaftsservice (AWS)',
    baseUrl: 'https://aws.at',
    programUrls: [
      'https://www.aws.at/foerderungen/'  // Updated entry point per recommendation
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'loan', 'equity'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'grant', 'startup', 'innovation', 'investition', 'export']
  },
  {
    id: 'institution_ffg',
    name: 'Austrian Research Promotion Agency (FFG)',
    baseUrl: 'https://www.ffg.at',
    programUrls: [
      'https://www.ffg.at/foerderungen',
      'https://www.ffg.at/programm-suche'  // Added program search per recommendation
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
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
    region: 'Vienna',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'startup', 'innovation', 'business', 'vienna', 'export']
  },
  {
    name: 'AMS (Arbeitsmarktservice)',
    baseUrl: 'https://www.ams.at',
    programUrls: [
      'https://www.ams.at/unternehmen/personalsuche-und-foerderungen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'employment', 'training', 'arbeitsmarkt', 'job', 'ausbildung']
  },
  {
    id: 'institution_wko',
    name: 'WKO (Wirtschaftskammer Österreich)',
    baseUrl: 'https://www.wko.at',
    programUrls: [
      'https://www.wko.at/service/foerderungen.html'  // Updated seed URL per recommendation
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'business', 'innovation', 'export', 'ausbildung', 'wirtschaft']
  },
  {
    name: 'ÖBS (Österreichische Bundesbahnen)',
    baseUrl: 'https://www.oebb.at',
    programUrls: [
      // All removed - all return 404. Auto-discovery will try to find valid pages.
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
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
      'https://www.bankaustria.at/unternehmen/finanzierung'
      // Removed deep subpages - all return 404. Auto-discovery will find valid program pages from these seeds.
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['bank_loan'],
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
      'https://www.bmwk.de/Redaktion/DE/Artikel/Innovation/innovation.html',
      'https://www.bmwk.de/Redaktion/DE/Artikel/Energie/foerderprogramme.html'  // Merged from duplicate entry
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy'],  // Merged from duplicate entry
    region: 'Germany',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'innovation', 'forschung', 'startup', 'klimaschutz', 'energie']  // Added 'energie' from duplicate
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
    region: 'Netherlands',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['investering', 'venture', 'kapitaal', 'impact', 'startup']
  },
  
  // === GERMAN INSTITUTIONS ===
  
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
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['foerderung', 'kredit', 'finanzierung']
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
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['equity', 'venture', 'capital', 'investment']
  },
  
  // === ADDITIONAL AUSTRIAN INSTITUTIONS ===
  
  {
    name: 'Austrian Federal Ministry of Education, Science and Research (BMBWF)',
    baseUrl: 'https://www.bmbwf.gv.at',
    programUrls: [
      'https://www.bmbwf.gv.at/Themen/forschung/foerderungen.html',
      'https://www.bmbwf.gv.at/Themen/forschung/universitaeten.html',
      'https://www.bmbwf.gv.at/Themen/forschung/innovation.html'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'research'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['foerderung', 'forschung', 'innovation', 'universitaet', 'wissenschaft']
  },
  
  {
    name: 'Austrian Federal Ministry of Climate Action (BMK)',
    baseUrl: 'https://www.bmk.gv.at',
    programUrls: [
      'https://www.bmk.gv.at/themen/klima/foerderungen.html',
      'https://www.bmk.gv.at/themen/energie/foerderungen.html',
      'https://www.bmk.gv.at/themen/umwelt/foerderungen.html'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['foerderung', 'klima', 'energie', 'umwelt', 'nachhaltigkeit']
  },
  
  {
    name: 'Austrian Federal Ministry of Digital and Economic Affairs (BMDW)',
    baseUrl: 'https://www.bmdw.gv.at',
    programUrls: [
      'https://www.bmdw.gv.at/Themen/Digitalisierung/foerderungen.html',
      'https://www.bmdw.gv.at/Themen/Wirtschaft/foerderungen.html',
      'https://www.bmdw.gv.at/Themen/Tourismus/foerderungen.html'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['foerderung', 'digitalisierung', 'wirtschaft', 'tourismus', 'innovation']
  },
  
  {
    name: 'Austrian Research and Technology Development Fund (FWF)',
    baseUrl: 'https://www.fwf.ac.at',
    programUrls: [
      'https://www.fwf.ac.at/en/funding/',
      'https://www.fwf.ac.at/en/funding/programmes/',
      'https://www.fwf.ac.at/en/funding/calls/'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen'],
      requirements: ['.requirements', '.dokumente'],
      contact: ['.contact', '.ansprechpartner']
    },
    fundingTypes: ['grant', 'research'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['fwf', 'forschung', 'wissenschaft', 'research', 'wissenschaftsfonds']
  },
  
  // === ADDITIONAL EU INSTITUTIONS ===
  
  {
    name: 'European Regional Development Fund (ERDF)',
    baseUrl: 'https://ec.europa.eu',
    programUrls: [
      'https://ec.europa.eu/regional_policy/en/funding/erdf/',
      'https://ec.europa.eu/regional_policy/en/funding/erdf/2014-2020/',
      'https://ec.europa.eu/regional_policy/en/funding/erdf/2021-2027/'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.helpdesk']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'EU',
    autoDiscovery: true,
    keywords: ['erdf', 'regional', 'development', 'funding', 'cohesion']
  },
  
  {
    name: 'European Social Fund (ESF)',
    baseUrl: 'https://ec.europa.eu',
    programUrls: [
      'https://ec.europa.eu/esf/main.jsp?catId=1&langId=en',
      'https://ec.europa.eu/esf/main.jsp?catId=2&langId=en',
      'https://ec.europa.eu/esf/main.jsp?catId=3&langId=en'
    ],
    selectors: {
      name: ['h1', '.program-title'],
      description: ['.program-description', 'p'],
      eligibility: ['.eligibility', '.conditions'],
      requirements: ['.requirements', '.documents'],
      contact: ['.contact', '.helpdesk']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'EU',
    autoDiscovery: true,
    keywords: ['esf', 'social', 'employment', 'training', 'education']
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
    'subsidy', 'subvention', 'sussidio', 'subsidie',
    'stipendium', 'stipendien', 'zuschuss', 'förderquote'
  ],
  programKeywords: [
    'program', 'programme', 'programma', 'programm',
    'initiative', 'initiative', 'iniziativa',
    'scheme', 'regime', 'regime', 'regime',
    'call', 'aufruf', 'appel', 'bando',
    'ausschreibung', 'fördercall', 'förderschiene', 'fördermodell', 'stipendienprogramm'
  ],
  exclusionKeywords: [
    'newsletter', 'news', 'press', 'media', 'contact',
    'about', 'ueber', 'about', 'chi-siamo',
    'imprint', 'impressum', 'mentions-legales', 'note-legali',
    'privacy', 'datenschutz', 'confidentialite', 'privacy',
    'services', 'service', 'themen', 'aktuell'
  ]
};