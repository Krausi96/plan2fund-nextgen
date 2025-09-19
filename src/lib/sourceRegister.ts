// Source Register - Top 20 Programs with Data Freshness Tracking
export interface SourceInfo {
  id: string;
  name: string;
  source: string;
  lastChecked: string;
  status: 'active' | 'inactive' | 'deprecated';
  priority: 'high' | 'medium' | 'low';
  programs: number;
  fields: string[];
}

export const sourceRegister: SourceInfo[] = [
  {
    id: 'aws_at',
    name: 'Austria Wirtschaftsservice (AWS)',
    source: 'https://www.aws.at/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'high',
    programs: 3,
    fields: ['q1_country', 'q2_entity_stage', 'q4_theme', 'q9_team_diversity']
  },
  {
    id: 'ffg_at',
    name: 'Austrian Research Promotion Agency (FFG)',
    source: 'https://www.ffg.at/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'high',
    programs: 4,
    fields: ['q1_country', 'q6_rnd_in_at', 'q7_collaboration']
  },
  {
    id: 'eic_europa',
    name: 'European Innovation Council (EIC)',
    source: 'https://eic.ec.europa.eu/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'high',
    programs: 1,
    fields: ['q1_country', 'q3_company_size', 'q4_theme', 'q8_funding_types']
  },
  {
    id: 'horizon_europe',
    name: 'Horizon Europe Programme',
    source: 'https://ec.europa.eu/info/research-and-innovation/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'high',
    programs: 1,
    fields: ['q1_country', 'q4_theme', 'q6_rnd_in_at']
  },
  {
    id: 'umweltfoerderung',
    name: 'Umweltförderung Betriebe',
    source: 'https://www.umweltfoerderung.at/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'medium',
    programs: 1,
    fields: ['q3_company_size', 'q10_env_benefit']
  },
  {
    id: 'clean_hydrogen',
    name: 'Clean Hydrogen Partnership',
    source: 'https://www.clean-hydrogen.europa.eu/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'medium',
    programs: 1,
    fields: ['q10_env_benefit']
  },
  {
    id: 'eit_health',
    name: 'EIT Health',
    source: 'https://eithealth.eu/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'medium',
    programs: 2,
    fields: ['q4_theme', 'q10_env_benefit']
  },
  {
    id: 'esa_bic',
    name: 'ESA Business Incubation Centre',
    source: 'https://www.esa.int/',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'medium',
    programs: 1,
    fields: ['q2_entity_stage']
  },
  {
    id: 'life_programme',
    name: 'LIFE Programme',
    source: 'https://cinea.ec.europa.eu/life_en',
    lastChecked: '2025-01-15',
    status: 'active',
    priority: 'medium',
    programs: 1,
    fields: ['q1_country', 'q4_theme']
  },
  {
    id: 'klimafonds',
    name: 'Klima- und Energiefonds',
    source: 'https://www.klimafonds.gv.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q10_env_benefit']
  },
  {
    id: 'wko_innovation',
    name: 'WKO Innovation Wien',
    source: 'https://www.wko.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q4_theme']
  },
  {
    id: 'incubator_wien',
    name: 'Incubator Wien',
    source: 'https://www.incubator.wien/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q2_entity_stage']
  },
  {
    id: 'raiffeisen',
    name: 'Raiffeisen Bank',
    source: 'https://www.raiffeisen.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q8_funding_types']
  },
  {
    id: 'sparkasse',
    name: 'Sparkasse',
    source: 'https://www.sparkasse.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q8_funding_types']
  },
  {
    id: 'unicredit',
    name: 'UniCredit Bank',
    source: 'https://www.unicredit.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q8_funding_types']
  },
  {
    id: 'volksbank',
    name: 'Volksbank',
    source: 'https://www.volksbank.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q8_funding_types']
  },
  {
    id: 'red_white_red_card',
    name: 'Red-White-Red Card',
    source: 'https://www.oesterreich.gv.at/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 2,
    fields: ['q1_country', 'q2_entity_stage']
  },
  {
    id: 'eu_blue_card',
    name: 'EU Blue Card',
    source: 'https://ec.europa.eu/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q1_country']
  },
  {
    id: 'eit_digital',
    name: 'EIT Digital',
    source: 'https://www.eitdigital.eu/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q4_theme']
  },
  {
    id: 'eit_manufacturing',
    name: 'EIT Manufacturing',
    source: 'https://www.eitmanufacturing.eu/',
    lastChecked: '2025-01-10',
    status: 'active',
    priority: 'low',
    programs: 1,
    fields: ['q4_theme']
  }
];

export function getTop20Sources(): SourceInfo[] {
  return sourceRegister
    .filter(source => source.status === 'active')
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 20);
}

export function getSourceCoverage(): { [key: string]: number } {
  const coverage: { [key: string]: number } = {};
  
  sourceRegister.forEach(source => {
    source.fields.forEach(field => {
      coverage[field] = (coverage[field] || 0) + 1;
    });
  });
  
  return coverage;
}

export function getLastUpdateInfo(): { lastChecked: string; totalSources: number; activeSources: number } {
  const activeSources = sourceRegister.filter(s => s.status === 'active');
  const lastChecked = activeSources.reduce((latest, source) => {
    return source.lastChecked > latest ? source.lastChecked : latest;
  }, '2025-01-01');
  
  return {
    lastChecked,
    totalSources: sourceRegister.length,
    activeSources: activeSources.length
  };
}