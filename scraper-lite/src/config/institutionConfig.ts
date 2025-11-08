// Login configuration (imported from login.ts to avoid duplication)
import type { LoginConfig } from '../utils/login';

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
  loginConfig?: LoginConfig; // Optional: Login configuration for protected pages
}

export const institutions: InstitutionConfig[] = [
  // === GOVERNMENT INSTITUTIONS (Multi-type) ===
  
  // Austrian Government Institutions
  {
    id: 'institution_aws',  // Unique ID per contract review
    name: 'Austria Wirtschaftsservice (AWS)',
    baseUrl: 'https://aws.at',
    programUrls: [
      'https://www.aws.at/en/aws-digitalisierung/ai-unternehmen-wachstum/ai-adoption/',
      'https://www.aws.at/en/aws-digitalization/',
      'https://www.aws.at/en/aws-digitalization/ai-start/',
      'https://www.aws.at/en/aws-equity/',
      'https://www.aws.at/en/aws-growth-investment/',
      'https://www.aws.at/en/aws-equity/venture-capital/',
      'https://www.aws.at/en/aws-equity/equity-investment/',
      'https://www.aws.at/en/aws-wachstumsinvestition/',
      'https://www.aws.at/en/aws-seedfinancing-deep-tech/',
      'https://www.aws.at/en/aws-seedfinancing-innovative-solutions/',
      'https://www.aws.at/en/aws-preseed-deep-tech/',
      'https://www.aws.at/en/aws-preseed-innovative-solutions/',
      'https://www.aws.at/en/aws-erp-kredit/tourismus/',
      'https://www.aws.at/en/aws-erp-loan/',
      'https://www.aws.at/en/aws-first-incubator/',
      'https://www.aws.at/en/aws-guarantee/',
      'https://www.aws.at/en/aws-guarantee/consolidation/',
      'https://www.aws.at/en/aws-guarantee/equity-leverage/',
      'https://www.aws.at/en/aws-guarantee/internationalisation/',
      'https://www.aws.at/en/aws-guarantee/young-enterprises/',
      'https://www.aws.at/en/aws-innovation-protection/',
      'https://www.aws.at/en/aws-innovation-protection/schluesseltechnologien/',
      'https://www.aws.at/en/aws-preseed-deep-tech/',
      'https://www.aws.at/en/aws-preseed-innovative-solutions/',
      'https://www.aws.at/en/aws-seedfinancing-deep-tech/',
      'https://www.aws.at/en/aws-seedfinancing-innovative-solutions/',
      'https://www.aws.at/en/aws-wachstumsinvestition/frontrunner-unternehmen/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'loan', 'bank_loan', 'equity', 'guarantee'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['aws', 'growth investment', 'preseed', 'seedfinancing', 'guarantee', 'erp loan', 'innovation protection', 'equity', 'digitalization', 'ai start', 'Förderung', 'innovation', 'startup']
  },
  {
    id: 'institution_ffg',
    name: 'Austrian Research Promotion Agency (FFG)',
    baseUrl: 'https://www.ffg.at',
    programUrls: [
      'https://www.ffg.at/en/program/r-d-infrastructure-funding',
      'https://www.ffg.at/en/ausschreibung/comet-zentren-ausschreibung-2025',
      'https://www.ffg.at/ausschreibung/comet-zentren-ausschreibung-2025',
      'https://www.ffg.at/en/call/spin-fellowship-2nd-call-applications-4th-application-deadline',
      'https://www.ffg.at/en/diversityscheck',
      'https://www.ffg.at/en/diversitec/ausschreibung',
      'https://www.ffg.at/en/callindustrienahe-dissertationen-2026-industrial-phd',
      'https://www.ffg.at/en/programme/innovation-voucher',
      'https://www.ffg.at/en/spin-off-fellowships',
      'https://www.ffg.at/en/programme/bridge',
      'https://www.ffg.at/en/programme/collective-research',
      'https://www.ffg.at/en/irasme'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['R&D infrastructure funding', 'research infrastructure', 'FFG', 'Forschungsförderung', 'innovation voucher', 'startup funding']
  },
  {
    name: 'Vienna Business Agency (VBA)',
    baseUrl: 'https://viennabusinessagency.at',
    programUrls: [
      'https://viennabusinessagency.at/current-funding/startup-grant/',
      'https://viennabusinessagency.at/current-funding/innovation-funding/',
      'https://viennabusinessagency.at/current-funding/innovation/',
      'https://viennabusinessagency.at/current-funding/foerderung-digitalisierung/',
      'https://viennabusinessagency.at/current-funding/creative-industry-project-funding/',
      'https://viennabusinessagency.at/current-funding/creative-projects/',
      'https://viennabusinessagency.at/current-funding/creative-industry/',
      'https://viennabusinessagency.at/current-funding/creative-workspaces/',
      'https://viennabusinessagency.at/current-funding/vienna-quality-of-life-funding/',
      'https://viennabusinessagency.at/current-funding/international-market-entry/',
      'https://viennabusinessagency.at/current-funding/internationalization/',
      'https://viennabusinessagency.at/current-funding/real-estate/',
      'https://viennabusinessagency.at/current-funding/media-start-funding-under-the-vienna-media-initiative/',
      'https://viennabusinessagency.at/current-funding/production-funding/',
      'https://viennabusinessagency.at/current-funding/business-location-funding/',
      'https://viennabusinessagency.at/current-funding/tech4people-funding/',
      'https://viennabusinessagency.at/current-funding/vienna-planet-fund/',
      'https://viennabusinessagency.at/current-funding/city-of-advancement/',
      'https://viennabusinessagency.at/current-funding/urban-tech-labs/',
      'https://viennabusinessagency.at/current-funding/female-entrepreneurship/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'Vienna, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['startup grant', 'innovation funding', 'digitalisation', 'creative industry', 'quality of life']
  },
  {
    name: 'Steirische Wirtschaftsförderung (SFG Styria)',
    baseUrl: 'https://www.sfg.at',
    programUrls: [
      'https://www.sfg.at/en/f/startups-vor-dem-ersten-investment-professionell-planen-mit-mas-und-geld/',
      'https://www.sfg.at/en/fundings/#Start!Klar',
      'https://www.sfg.at/en/fundings/#Ideen!Reich',
      'https://www.sfg.at/en/fundings/#Wachstums!Schritt',
      'https://www.sfg.at/foerderung/ideenreich/',
      'https://www.sfg.at/foerderung/lebensnah/',
      'https://www.sfg.at/foerderung/greensinvest/',
      'https://www.sfg.at/foerderung/cybersicher/',
      'https://www.sfg.at/foerderung/startklar/',
      'https://www.sfg.at/f/finanzierung-fuer-kmu/',
      'https://www.sfg.at/f/risikokapital/',
      'https://www.sfg.at/f/stille-beteiligung/',
      'https://www.sfg.at/f/venture-capital/',
      'https://www.sfg.at/f/equity-finanzierung/',
      'https://www.sfg.at/f/investment-foerderung/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy', 'equity', 'venture_capital'],
    region: 'Styria, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['SFG', 'Steiermark', 'Förderung', 'KMU', 'Startup', 'Start!Klar', 'Ideen!Reich', 'Wachstums!Schritt']
  },
  {
    name: 'AMS (Arbeitsmarktservice)',
    baseUrl: 'https://www.ams.at',
    programUrls: [
      'https://www.ams.at/arbeitsuchende/aus-and-weiterbildung/so-foerdern-wir-ihre-aus--und-weiterbildung-/unternehmensgruendungs-programm',
      'https://www.ams.at/unternehmen/foerderungen/eingliederungsbeihilfe',
      'https://www.ams.at/unternehmen/foerderungen/qualifizierungsfoerderung-fuer-beschaeftigte'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'wage-subsidy'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['business startup program', 'unternehmensgründungs-programm', 'AMS', 'Eingliederungsbeihilfe', 'Qualifizierungsförderung', 'Beschäftigung', 'Zuschuss']
  },
  {
    id: 'institution_wko',
    name: 'WKO (Wirtschaftskammer Österreich)',
    baseUrl: 'https://www.wko.at',
    programUrls: [
      'https://www.wko.at/service/foerderungen.html',
      'https://www.wko.at/service/foerderungen/innovationsfoerderungen.html',
      'https://www.wko.at/service/foerderungen/exportfoerderungen.html',
      'https://www.wko.at/service/foerderungen/ausbildungsfoerderungen.html',
      'https://www.wko.at/site/kmu-digital/beratung.html',
      'https://www.wko.at/site/kmu-digital/umsetzung.html'
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
      'https://www.bankaustria.at/unternehmen/finanzierung',
      'https://www.bankaustria.at/en/microcredit.jsp',
      'https://www.bankaustria.at/en/investment-loan.jsp',
      'https://www.bankaustria.at/en/online-funding-finder.jsp',
      'https://www.bankaustria.at/en/export-subsidies.jsp',
      'https://www.bankaustria.at/startercenter/unternehmensgruendung-finanzierung.jsp',
      'https://www.bankaustria.at/firmenkunden-finanzierungen-leasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-neu-fahrzeugleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-neu-green-lease.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-neu-mobilienleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-neu-strukturiertes-leasing.jsp',
      'https://www.bankaustria.at/firmenkunden-investitionskredit.jsp',
      'https://www.bankaustria.at/firmenkunden-betriebsmittelkredit.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-fahrzeugleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-mobilienleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-absatzleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-leasing-kommunalleasing.jsp',
      'https://www.bankaustria.at/firmenkunden-kredit-energieeinsparung.jsp'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['bank_loan', 'subsidy', 'loan', 'leasing'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['kredit', 'darlehen', 'finanzierung', 'startup', 'export', 'unternehmen', 'microcredit', 'investment loan', 'export subsidies', 'leasing', 'fahrzeugleasing', 'green lease', 'mobilienleasing', 'strukturiertes leasing']
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
    name: 'Erste Bank und Sparkasse',
    baseUrl: 'https://www.sparkasse.at',
    programUrls: [
      'https://www.sparkasse.at/sgruppe/gruender/finanzierung-und-foerderung/leasing-fuer-unternehmerinnen',
      'https://www.sparkasse.at/sgruppe/unternehmen/produkte-firmenkunden/finanzieren/leasing/kfz-leasing',
      'https://www.sparkasse.at/sgruppe/unternehmen/produkte-firmenkunden/finanzieren/kredite-investitionen',
      'https://www.sparkasse.at/sgruppe/unternehmen/produkte-firmenkunden/finanzieren/investitionsfinanzierung/investitionskredit',
      'https://www.sparkasse.at/sgruppe/unternehmen/produkte-firmenkunden/finanzieren/betriebsmittelfinanzierung/s-betriebsmittelkredit',
      'https://www.sparkasse.at/sgruppe/gruender/finanzierung-und-foerderung/bankkredite-fuer-unternehmensgruendungen',
      'https://www.sparkasse.at/oberoesterreich/unternehmen/produkte-firmenkunden/finanzieren/investitionsfinanzierung/s-klima-investkredit',
      'https://www.sparkasse.at/sgruppe/unternehmen/produkte-firmenkunden/finanzieren/mikrokredit'
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
    keywords: ['sparkasse', 'kredit', 'darlehen', 'finanzierung', 'leasing', 'gründer', 'KMU']
  },
  {
    name: 'Raiffeisen Bank',
    baseUrl: 'https://www.raiffeisen.at',
    programUrls: [
      'https://www.raiffeisen.at/unternehmen/kredite',
      'https://www.raiffeisen.at/unternehmen/finanzierung',
      'https://www.raiffeisen.at/unternehmen/startup',
      'https://www.raiffeisen.at/unternehmen/leasing',
      'https://www.raiffeisen.at/ooe/rlb/de/firmenkunden/finanzieren-foerdern/investitionskredit.html',
      'https://www.raiffeisen.at/ooe/rlb/de/firmenkunden/finanzieren-foerdern/betriebsmittelkredit.html',
      'https://www.raiffeisen-leasing.at/produkte/firmenkunden/fahrzeug-und-fuhrpark-leasing.html',
      'https://www.raiffeisen-leasing.at/produkte/firmenkunden/maschinen-und-anlagenleasing.html',
      'https://www.raiffeisen-leasing.at/produkte/immobilien/immobilienleasing.html',
      'https://www.raiffeisen.at/ooe/rlb/de/firmenkunden/finanzieren-foerdern/eib-globalarlehen.html'
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
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/eu-missions-horizon-europe_en',
      'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search',
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/health_en',
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/climate-energy-mobility_en',
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/digital-industry-space_en'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research', 'innovation'],
    region: 'EU',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['horizon', 'europe', 'research', 'innovation', 'grant']
  },
  {
    name: 'European Innovation Council (EIC)',
    baseUrl: 'https://eic.ec.europa.eu',
    programUrls: [
      'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
      'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator-open_en',
      'https://www.eurekanetwork.org/programmes/eurostars/',
      'https://cinea.ec.europa.eu/life_en'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'equity'],
    region: 'European Union',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['EIC', 'EIC Accelerator', 'Horizon Europe', 'EU funding', 'startup', 'equity', 'grant', 'Eurostars', 'LIFE', 'SME', 'EU Grants']
  },
  {
    name: 'KMU.DIGITAL (Digitalisation Initiative by BMWET & WKO)',
    baseUrl: 'https://kmudigital.at',
    programUrls: [
      'https://www.wko.at/site/kmu-digital/beratung.html',
      'https://www.wko.at/site/kmu-digital/umsetzung.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['subsidy', 'grant'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Digitalisierung', 'KMU.Digital', 'WKO', 'Förderung', 'Beratung', 'Umsetzung']
  },
  {
    name: 'Speedinvest (VC fund)',
    baseUrl: 'https://www.speedinvest.com',
    programUrls: [
      'https://www.speedinvest.com/funds/seed-fund/',
      'https://www.speedinvest.com/funds/early-stage-fund/',
      'https://www.speedinvest.com/funds/',
      'https://www.speedinvest.com/funds/pre-seed-fund/',
      'https://www.speedinvest.com/funds/venture-capital/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.funding-title'],
      description: ['.program-description', '.funding-description', 'p'],
      eligibility: ['.eligibility', '.requirements', '.criteria'],
      requirements: ['.requirements', '.application', '.process'],
      contact: ['.contact', '.application', '.funding']
    },
    fundingTypes: ['equity'],
    region: 'Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Venture Capital', 'Startup Investment', 'Speedinvest', 'Seed Funding', 'Pre-Seed', 'VC']
  },
  {
    name: 'Kommunalkredit Public Consulting – Umweltförderung im Inland (KPC/UFI)',
    baseUrl: 'https://www.umweltfoerderung.at',
    programUrls: [
      'https://www.umweltfoerderung.at/betriebe/photovoltaik-in-betrieben',
      'https://www.umweltfoerderung.at/betriebe/e-lkw-und-infrastruktur',
      'https://www.umweltfoerderung.at/betriebe/energieeffizienz-in-unternehmen',
      'https://www.umweltfoerderung.at/betriebe/erneuerbare-waerme-in-betrieben',
      'https://www.umweltfoerderung.at/betriebe/raus-aus-oel-und-gas-betriebe',
      'https://www.umweltfoerderung.at/betriebe/ladestationen-fuer-betriebe'
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
    keywords: ['Umweltförderung', 'Energieeffizienz', 'Photovoltaik', 'E-Mobilität', 'Unternehmen', 'Zuschuss']
  },
  {
    name: 'Kärntner Wirtschaftsförderungs Fonds (KWF)',
    baseUrl: 'https://www.kwf.at',
    programUrls: [
      'https://www.kwf.at/foerderung/start-fei/',
      'https://www.kwf.at/foerderung/umsetzung-fei/',
      'https://www.kwf.at/foerderung/innovations-talent/',
      'https://www.kwf.at/foerderung/vor-gruenden/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Carinthia, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Kärnten', 'Forschung', 'Entwicklung', 'Innovation', 'Gründung', 'Zuschuss']
  },
  {
    name: 'Land Tirol / Standortagentur Tirol – Landesprogramme',
    baseUrl: 'https://www.standort-tirol.at',
    programUrls: [
      // Note: All original URLs were anchor links (#initiat, #fei, etc.) - these need to be discovered or replaced with actual detail pages
      'https://www.standort-tirol.at/unternehmen/foerderungen/landesprogramme'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Tyrol, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled - will try to find actual detail pages
    keywords: ['Tirol', 'K-Regio', 'Innovation', 'Kooperation', 'KMU', 'Zuschuss']
  },
  {
    name: 'Amt der Oö. Landesregierung – Wirtschaftsförderungen (Oberösterreich)',
    baseUrl: 'https://www.land-oberoesterreich.gv.at',
    programUrls: [
      'https://www.land-oberoesterreich.gv.at/525687.htm',
      'https://www.land-oberoesterreich.gv.at/542460.htm',
      'https://www.land-oberoesterreich.gv.at/229290.htm'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Upper Austria, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Oberösterreich', 'Investitionsförderung', 'Digitalisierung', 'Weiterbildung', 'KMU', 'Zuschuss']
  },
  {
    name: 'Land Salzburg – Wirtschaftsförderung',
    baseUrl: 'https://www.salzburg.gv.at',
    programUrls: [
      'https://www.salzburg.gv.at/wachstumsprogramm',
      'https://www.salzburg.gv.at/digitalisierungsoffensive',
      'https://www.salzburg.gv.at/jungunternehmen',
      'https://www.salzburg.gv.at/themen/wirtschaft/wirtschaftsfoerderung/umweltinvestitionen',
      'https://www.salzburg.gv.at/themen/wirtschaft/wirtschaftsfoerderung/kooperationen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Salzburg, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Salzburg', 'Wirtschaftsförderung', 'Digitalisierung', 'Jungunternehmen', 'Kooperation', 'Zuschuss']
  },
  {
    name: 'Wirtschaftsagentur Burgenland (WIBAG)',
    baseUrl: 'https://wirtschaftsagentur-burgenland.at',
    programUrls: [
      'https://wirtschaftsagentur-burgenland.at/foerderungen/betriebliche-investitionsfoerderung',
      'https://wirtschaftsagentur-burgenland.at/foerderungen/innovationsfoerderung',
      'https://wirtschaftsagentur-burgenland.at/foerderungen/gruenderfoerderung'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Burgenland, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Burgenland', 'Investition', 'Innovation', 'Gründung', 'Förderung']
  },
  {
    name: 'Amt der NÖ Landesregierung – Wirtschaftsförderungen (Niederösterreich)',
    baseUrl: 'https://www.noe.gv.at',
    programUrls: [
      'https://www.noe.gv.at/noe/Wirtschaft-Tourismus-Technologie/Unternehmerische_Investition.html',
      'https://www.noe.gv.at/noe/Wirtschaft-Tourismus-Technologie/Innovation_in_KMU.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    region: 'Lower Austria, Austria',
    autoDiscovery: true,  // ✅ Auto-discovery enabled
    keywords: ['Niederösterreich', 'Investition', 'Innovation', 'KMU', 'Zuschuss']
  },
  {
    name: 'Klima- und Energiefonds (KLIEN)',
    baseUrl: 'https://www.klimafonds.gv.at',
    programUrls: [
      'https://www.klimafonds.gv.at/foerderung/fti-initiative-fuer-die-transformation-der-industrie-2025/',
      'https://www.klimafonds.gv.at/foerderung/energieforschung-2025-potenziale-nutzen-zukunft-gestalten/',
      'https://www.klimafonds.gv.at/foerderung/innovative-klimaneutrale-prozesswaerme-und-kaelte-in-betrieben/',
      'https://www.klimafonds.gv.at/foerderung/dtmr4c-2025/',
      'https://www.klimafonds.gv.at/foerderung/tiefengeothermie/'
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
    keywords: ['Klima- und Energiefonds', 'Energieforschung', 'Industrie', 'Dekarbonisierung', 'Unternehmen', 'Förderung']
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
      'https://www.eib.org/en/products/loans/index.htm',
      'https://www.eib.org/en/products/loans/sme-mid-caps/index.htm',
      'https://www.eib.org/en/products/equity/index.htm',
      'https://www.eib.org/en/products/guarantees/index.htm',
      'https://www.eib.org/en/projects/topics/index.htm'
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
    fundingTypes: ['grant'],
    programFocus: ['research'],
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
    fundingTypes: ['grant'],
    programFocus: ['research'],
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
  },
  
  // === NEW AUSTRIAN INSTITUTIONS (Added from funding_programs_updated.txt) ===
  
  {
    name: 'Austrian Economic Chambers / BMK (KMU.DIGITAL)',
    baseUrl: 'https://www.kmudigital.at',
    programUrls: [
      'https://www.kmudigital.at/the-austrian-digitalization-initiative-for-smes.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['KMU.DIGITAL', 'digitalization', 'consulting', 'implementation', 'Green']
  },
  
  {
    name: 'Federal Ministry of Economy, Energy and Tourism (BMWET)',
    baseUrl: 'https://www.bmwet.gv.at',
    programUrls: [
      'https://www.bmwet.gv.at/en/Topics/International/go-international.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['go-international', 'internationalization', 'export', 'voucher', 'digital internationalization']
  },
  
  {
    name: 'Austrian Hotel and Tourism Bank (ÖHT)',
    baseUrl: 'https://www.oeht.at',
    programUrls: [
      'https://www.usp.gv.at/en/themen/brancheninformationen/gastronomie-und-tourismus/gewerbliche-tourismusfoerderung-des-bundes/tourismus-investitionsfoerderung.html',
      'https://www.usp.gv.at/en/themen/brancheninformationen/gastronomie-und-tourismus/gewerbliche-tourismusfoerderung-des-bundes/tourismus-unternehmensstabilisierung.html',
      'https://www.usp.gv.at/en/themen/brancheninformationen/gastronomie-und-tourismus/gewerbliche-tourismusfoerderung-des-bundes/tourismus-uebernahme-von-haftungen.html',
      'https://www.usp.gv.at/en/themen/brancheninformationen/gastronomie-und-tourismus/gewerbliche-tourismusfoerderung-des-bundes/tourismus-jungunternehmerfoerderung.html',
      'https://www.oeht.at/produkte/oeht-investitionskredit/',
      'https://www.oeht.at/produkte/erp-tourismuskredit-bis-eur-1-mio/',
      'https://www.oeht.at/produkte/erp-tourismuskredit-ab-eur-1-mio/',
      'https://www.oeht.at/produkte/haftungen/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'bank_loan', 'subsidy', 'grant'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['OeHT', 'investment loan', 'sustainability bonus', 'business stabilisation', 'liability', 'young entrepreneurs', 'tourism', 'ÖHT', 'Tourismusbank', 'ERP-Tourismuskredit', 'Haftung']
  },
  {
    name: 's Leasing GmbH (Erste Group)',
    baseUrl: 'https://www.s-leasing.at',
    programUrls: [
      'https://www.s-leasing.at/unternehmen/fahrzeugleasing',
      'https://www.s-leasing.at/unternehmen/maschinen-mobilien-leasing',
      'https://www.s-leasing.at/unternehmen/immobilien-leasing',
      'https://www.s-leasing.at/unternehmen/sale-and-rent-back'
    ],
    selectors: {
      name: ['h1', '.program-title', '.leasing-title'],
      description: ['.program-description', '.leasing-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['leasing'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['Leasing', 'Fahrzeugleasing', 'Mobilien', 'Immobilien', 'Sale-and-rent-back', 'KMU', 'Startup']
  },
  {
    name: 'Oberbank AG',
    baseUrl: 'https://www.oberbank.at',
    programUrls: [
      'https://www.oberbank.at/investitionsfinanzierung',
      'https://www.oberbank.at/jetztunternehmen/investitionsfoerderung'
      // Note: PDF link removed - need to find web page equivalent
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['Investitionsfinanzierung', 'EIB-Darlehen', 'KMU', 'MidCap', 'Förderkredit', 'Kredit']
  },
  {
    name: 'Volksbank (Verbund)',
    baseUrl: 'https://www.volksbank.at',
    programUrls: [
      'https://www.volksbankwien.at/zib/kommerz/finanzieren_foerdern/investitionskredit.page?main=2&nav=3&sub=1&vbbranch=wien',
      'https://www.volksbank.at/zib/kommerz/finanzieren_foerdern/betriebsmittelrahmen.page?main=&vbbranch=verbund',
      'https://www.volksbanksalzburg.at/unternehmer/finanzierung/investitionskredit',
      'https://www.vr.de/firmenkunden/produkte/finanzierung/investitionskredit.html',
      'https://www.vr.de/firmenkunden/produkte/finanzierung/firmenleasing.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'leasing'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['Investitionskredit', 'Betriebsmittelrahmen', 'Leasing', 'KMU', 'Startup']
  },
  {
    name: 'HYPO NOE Landesbank für Niederösterreich und Wien',
    baseUrl: 'https://www.hyponoe.at',
    programUrls: [
      'https://www.hyponoe.at/unternehmen/gruener-investitionskredit',
      'https://www.hyponoe.at/unternehmen/grossunternehmen',
      'https://www.hyponoe.at/oeffentliche-hand/leasing',
      'https://www.hyponoe.at/immobilienprojekte/wohn-und-gewerbeimmobilien'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'leasing'],
    region: 'Lower Austria/Vienna, Austria',
    autoDiscovery: true,
    keywords: ['Grüner Investitionskredit', 'Investitionskredit', 'Leasing', 'Immobilienleasing', 'KMU', 'Startup']
  },
  {
    name: 'Hypo Tirol Bank AG',
    baseUrl: 'https://www.hypotirol.com',
    programUrls: [
      'https://www.hypotirol.com/product/firmenkunden/investitionskredit/',
      'https://www.hypotirol.com/product/firmenkunden/betriebsmittelkredit/',
      'https://www.hypotirol.com/product/firmenkunden/leasing/',
      'https://www.hypotirol.com/product/firmenkunden/eib-global-darlehen/',
      'https://www.hypotirol.com/product/firmenkunden/gruendungsfinanzierung/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'leasing'],
    region: 'Tyrol, Austria',
    autoDiscovery: true,
    keywords: ['Investitionskredit', 'Betriebsmittelkredit', 'EIB Globaldarlehen', 'Leasing', 'Gründung', 'KMU', 'Startup']
  },
  {
    name: 'HYPO-Bank Burgenland AG',
    baseUrl: 'https://www.bank-bgld.at',
    programUrls: [
      'https://www.bank-bgld.at/de/firmenkunden/finanzieren-firmenkunden/investitionsmittelkredit',
      'https://www.bank-bgld.at/de/firmenkunden/finanzieren-firmenkunden/betriebsmittelkredit',
      'https://www.bank-bgld.at/de/firmenkunden/finanzieren-firmenkunden/kontokorrentkredit',
      'https://www.bank-bgld.at/de/firmenkunden/finanzieren-firmenkunden/leasing-fuer-unternehmen',
      'https://www.bank-bgld.at/de/firmenkunden/finanzieren-firmenkunden/eib-globaldarlehen'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'leasing'],
    region: 'Burgenland, Austria',
    autoDiscovery: true,
    keywords: ['Investitionskredit', 'Betriebsmittelkredit', 'Kontokorrent', 'Leasing', 'EIB', 'KMU', 'Startup']
  },
  {
    name: 'Oesterreichische Kontrollbank (OeKB) – Export Services',
    baseUrl: 'https://www.oekb.at',
    programUrls: [
      'https://www.oekb.at/en/export-services/financing-of-working-capital-loan/framework-credit-for-smes-exportfonds-credit.html',
      'https://www.oekb.at/en/export-services/financing-of-working-capital-loan/framework-credit-for-large-enterprises-krr.html',
      'https://www.oekb.at/en/export-services/financing-of-working-capital-loan/vorratsinvest.html',
      'https://www.oekb.at/export-services/zinssaetze-fuer-exportfinanzierungen.html'
    ],
    selectors: {
      name: ['h1', '.program-title', '.kredit-title'],
      description: ['.program-description', '.kredit-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan'],
    region: 'Austria (EU-backed export financing)',
    autoDiscovery: true,
    keywords: ['Exportfonds-Kredit', 'KRR', 'Vorratsinvest', 'Exportfinanzierung', 'KMU', 'MidCap', 'Loan']
  },
  
  {
    name: 'Austrian Academy of Sciences (OeAW)',
    baseUrl: 'https://www.oeaw.ac.at',
    programUrls: [
      'https://www.oeaw.ac.at/en/funding/funding-programmes/subsites/anniversary-fund-of-the-city-of-vienna-for-the-oeaw/call-2025'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['Anniversary Fund', 'Call 2025', 'research', 'OeAW']
  },
  
  {
    name: 'Austrian Agency for Education and Internationalisation (OeAD)',
    baseUrl: 'https://oead.at',
    programUrls: [
      'https://oead.at/en/kooperationen/internationale-hochschulkooperationen/kooperation-entwicklungsforschung/koef-6th-call-2025'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['KoEF', 'cooperation development research', '6th call', 'Global South', 'OeAD']
  },
  
  {
    name: 'Vienna Science and Technology Fund (WWTF)',
    baseUrl: 'https://www.wwtf.at',
    programUrls: [
      'https://www.wwtf.at/funding/open-calls/index.php#me-cfs-2026',
      'https://www.wwtf.at/funding/open-calls/index.php#vrg-2026'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research'],
    region: 'Vienna, Austria',
    autoDiscovery: true,
    keywords: ['ME/CFS fellowships', 'Vienna Research Groups', 'environmental systems research', 'WWTF open calls']
  },
  
  {
    name: 'Austrian Government Migration Service',
    baseUrl: 'https://www.migration.gv.at',
    programUrls: [
      'https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/start-up-founders/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['visa_application'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['Red-White-Red Card', 'start-up founders', 'visa', 'immigration']
  },
  
  // === NEW INSTITUTIONS (Step 2) ===
  
  {
    id: 'institution_noebeg',
    name: 'NÖBEG – NÖ Bürgschaften und Beteiligungen GmbH',
    baseUrl: 'https://www.noebeg.at',
    programUrls: [
      'https://www.noebeg.at/leistung/die-buergschaft/',
      'https://www.noebeg.at/leistung/noe-beteiligung/',
      'https://www.noebeg.at/leistung/noe-beteiligung-kompakt/',
      'https://www.noebeg.at/leistung/die-beteiligung-fuer-wachstumsfinanzierung/',
      'https://www.noebeg.at/leistung/beteiligung-fuer-investitionen/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['guarantee', 'equity'],
    region: 'Lower Austria, Austria',
    autoDiscovery: true,
    keywords: ['loan guarantee', 'silent partnership', 'mezzanine capital', 'Niederösterreich', 'bürgschaft', 'beteiligung']
  },
  {
    id: 'institution_wkbg',
    name: 'WKBG – Wiener Kreditbürgschafts- und Beteiligungsbank AG',
    baseUrl: 'https://www.wkbg.at',
    programUrls: [
      'https://www.wkbg.at/beteiligungen-unternehmensbeteiligung-wien/',
      'https://www.wkbg.at/buergschaftsbank-wien-kredite/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['guarantee', 'equity'],
    region: 'Vienna, Austria',
    autoDiscovery: true,
    keywords: ['Bürgschaft', 'stille Beteiligung', 'SME financing', 'Vienna', 'Wien', 'Kreditbürgschaft']
  },
  {
    id: 'institution_conda',
    name: 'CONDA Crowdinvesting',
    baseUrl: 'https://www.conda.at',
    programUrls: [
      'https://www.conda.at/en/about-crowdinvesting/',
      'https://www.conda.at/en/unternehmen-finanzieren-en/'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['crowdfunding', 'equity_crowdfunding'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['crowdinvesting', 'crowdfunding platform', 'startup financing', 'SME funding', 'crowd investment']
  },
  {
    id: 'institution_tecnet',
    name: 'Tecnet Equity (NÖ Technologiebeteiligungs-Invest GmbH)',
    baseUrl: 'https://tecnet.at',
    programUrls: [
      'https://tecnet.at/en/venture-capital#safe'
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['equity', 'convertible_loan'],
    region: 'Lower Austria, Austria',
    autoDiscovery: true,
    keywords: ['venture capital', 'SAFE convertible loan', 'tech startups', 'Lower Austria', 'Niederösterreich', 'Tecnet']
  },
  
  // === INDUSTRY-SPECIFIC INSTITUTIONS ===
  
  // AWS - Technology & Digitalization Programs
  {
    id: 'institution_aws_tech',
    name: 'AWS - Technology & Digitalization',
    baseUrl: 'https://aws.at',
    programUrls: [
      'https://www.aws.at/en/aws-digitalisierung/ai-unternehmen-wachstum/',
      'https://www.aws.at/en/aws-digitalization/',
      'https://www.aws.at/en/aws-digitalization/ai-start/',
      'https://www.aws.at/en/aws-digitalisierung/',
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'equity'],
    programFocus: ['technology', 'AI', 'digitalization', 'software', 'IT'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['AI', 'digitalization', 'software', 'tech', 'startup', 'innovation', 'IT']
  },
  
  // AWS - Green Energy & Sustainability Programs
  {
    id: 'institution_aws_green',
    name: 'AWS - Green Energy & Sustainability',
    baseUrl: 'https://aws.at',
    programUrls: [
      // Add green energy specific URLs when available
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant', 'subsidy'],
    programFocus: ['green_energy', 'sustainability', 'renewable', 'climate', 'environment'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['green', 'energy', 'sustainability', 'renewable', 'climate', 'environment', 'eco']
  },
  
  // FFG - Research & Innovation Programs
  {
    id: 'institution_ffg_research',
    name: 'FFG - Research & Innovation',
    baseUrl: 'https://www.ffg.at',
    programUrls: [
      'https://www.ffg.at/en/programme/bridge',
      'https://www.ffg.at/en/programme/collective-research',
      'https://www.ffg.at/en/program/r-d-infrastructure-funding',
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research', 'innovation', 'R&D', 'science', 'technology'],
    region: 'Austria',
    autoDiscovery: true,
    keywords: ['research', 'innovation', 'R&D', 'science', 'technology', 'development']
  },
  
  // === EXPANDED REGIONS ===
  
  // Germany - KfW Bankengruppe
  {
    id: 'institution_kfw',
    name: 'KfW Bankengruppe',
    baseUrl: 'https://www.kfw.de',
    programUrls: [
      'https://www.kfw.de/inlandsfoerderung/Unternehmen/',
      'https://www.kfw.de/inlandsfoerderung/Unternehmen/Innovation/',
      'https://www.kfw.de/inlandsfoerderung/Unternehmen/Gruendung/',
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['loan', 'grant', 'guarantee'],
    programFocus: ['SME', 'startup', 'innovation', 'export'],
    region: 'Germany',
    autoDiscovery: true,
    keywords: ['KfW', 'Förderung', 'Kredit', 'Darlehen', 'Start-up', 'Innovation', 'Export']
  },
  
  // Switzerland - Innosuisse
  {
    id: 'institution_innosuisse',
    name: 'Innosuisse',
    baseUrl: 'https://www.innosuisse.ch',
    programUrls: [
      'https://www.innosuisse.ch/inno/en/home/support/innovation-projects.html',
      'https://www.innosuisse.ch/inno/en/home/support/start-up-coaching.html',
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['innovation', 'research', 'startup', 'technology'],
    region: 'Switzerland',
    autoDiscovery: true,
    keywords: ['Innosuisse', 'innovation', 'research', 'startup', 'technology', 'Förderung']
  },
  
  // EU - Horizon Europe
  {
    id: 'institution_horizon',
    name: 'Horizon Europe',
    baseUrl: 'https://ec.europa.eu',
    programUrls: [
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
      'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/eu-missions-horizon-europe_en',
    ],
    selectors: {
      name: ['h1', '.program-title', '.foerderung-title'],
      description: ['.program-description', '.foerderung-description', 'p'],
      eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
      requirements: ['.requirements', '.dokumente', '.unterlagen'],
      contact: ['.contact', '.ansprechpartner', '.kontakt']
    },
    fundingTypes: ['grant'],
    programFocus: ['research', 'innovation', 'climate', 'health', 'digital'],
    region: 'EU',
    autoDiscovery: true,
    keywords: ['Horizon Europe', 'EU funding', 'research', 'innovation', 'climate', 'health', 'digital']
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
    // Generic unwanted pages - INFO/FAQ/ABOUT pages (CRITICAL: Exclude these!)
    'newsletter', 'news', 'press', 'media', 'contact',
    'about', 'ueber', 'über', 'chi-siamo', 'info', 'information', 'informations',
    'faq', 'frequently-asked', 'fragen', 'questions', 'help', 'hilfe',
    'imprint', 'impressum', 'mentions-legales', 'note-legali',
    'privacy', 'datenschutz', 'confidentialite',
    'aktuell', 'karriere', 'career', 'jobs', 'stellen',
    // Guidelines/Policy pages (not funding programs)
    'richtlinien', 'guidelines', 'policy', 'policies', 'richtlinie',
    'bestimmungen', 'bedingungen', 'terms', 'conditions', 'terms-and-conditions',
    'regulations', 'regeln', 'vorschriften', 'standards', 'normen',
    'anleitung', 'instructions', 'handbuch', 'manual', 'dokumentation',
    // Obsolete/non-program pages
    'overview', 'übersicht', 'uebersicht', 'general', 'allgemein',
    'home', 'startseite', 'index', 'main',
    'sitemap', 'navigation', 'menu',
    // Housing/Real Estate exclusions (important!)
    'wohnbau', 'wohnbauförderung', 'wohnung', 'wohnungsbau', 'wohnungsförderung',
    'wohnbeihilfe', 'bauen-wohnen', 'raumplanung',
    'housing', 'real estate', 'immobilie', 'immobilien', 'baufinanzierung',
    'hypothek', 'mortgage', 'privatkunden', 'private',
    // Agriculture/Forestry exclusions (not startup/SME funding)
    'landwirtschaft', 'forstwirtschaft', 'agriculture', 'forestry',
    'pflanzenschutz', 'gentechnik', 'almwirtschaft', 'agrarbehoerde',
    'bodenschutz', 'schutzwald', 'forstliche', 'walderschliessung',
    // Infrastructure exclusions (not business funding)
    'verkehrsinfrastruktur', 'traffic', 'bahninfrastruktur', 'eisenbahn',
    'bau-neubau', 'bauordnung', 'baurecht', 'gestalten', 'bauprojekt',
    // Category/listing pages (common patterns)
    'brancheninformationen', 'gastronomie-und-tourismus', 'themen/', 
    'programm/', 'programme/', 'foerderungen/', 'ausschreibungen/', 'calls/',
    // Service/Event/Case pages (not funding programs)
    'service/cases',           // Success stories
    'success-stories',         // Success stories (English)
    'success-story',           // Success story (singular)
    'web-services',           // Tools and web services
    'events/kalender',         // Event calendar
    'event-tipps',             // Event tips
    'events-workshops',        // Workshops/events
    'veranstaltung',           // Event (German)
    'veranstaltungen',         // Events (German plural)
    'geförderte-projekte',     // Funded projects showcase (German)
    'gefoerderte-projekte',    // Alternative spelling
    // Info/About/Discovery pages
    '/info/',                  // Info/about pages
    'descubre-',               // Discovery/info (Spanish)
    'discover/',               // Discovery pages
    'discoveries/',            // Success stories
    'awards/',                 // Award pages
    'impact-stories/',         // Impact stories
    'portfolio/',              // Portfolio pages
    'topics/',                 // Topic overview pages
    'organizacion',            // Organization info
    'transparencia',          // Transparency
    'valores',                // Values/about
    // Note: 'service' and 'themen' removed - too generic, match legitimate Austrian URLs
    // Use specific patterns instead: '/service/about', '/themen/news' would be caught by 'about'/'news'
  ]
};