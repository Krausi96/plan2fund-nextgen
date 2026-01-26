import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface Program {
  id: string;
  name: string;
  type: string;
  organization: string;
  amountRange?: string;
  deadline?: string;
  focusAreas?: string[];
  description?: string;
  requirements?: string[];
}

interface ProgramFinderProps {
  onProgramSelect: (program: Program) => void;
  onClose: () => void;
}

// Enhanced internal program catalog
const PROGRAM_CATALOG: Program[] = [
  // AWS Programs
  {
    id: 'aws-innovation-grant-2024',
    name: 'AWS Innovation Grant',
    type: 'grant',
    organization: 'Amazon Web Services',
    amountRange: '€10,000 - €100,000',
    deadline: '2024-12-31',
    focusAreas: ['Cloud Computing', 'AI/ML', 'Sustainability', 'Digital Transformation'],
    description: 'Support for innovative cloud-based solutions and digital transformation projects',
    requirements: ['Business plan', 'Technical documentation', 'Financial projections', 'Cloud architecture diagram']
  },
  {
    id: 'aws-startup-program',
    name: 'AWS Activate for Startups',
    type: 'grant',
    organization: 'Amazon Web Services',
    amountRange: '€1,000 - €10,000',
    deadline: 'Ongoing',
    focusAreas: ['Cloud Computing', 'SaaS', 'Developer Tools'],
    description: 'Credits and resources for early-stage startups building on AWS',
    requirements: ['Startup registration', 'Business pitch deck', 'Technical overview']
  },
  
  // EU Programs
  {
    id: 'horizon-europe-2024',
    name: 'Horizon Europe',
    type: 'grant',
    organization: 'European Commission',
    amountRange: '€50,000 - €2,000,000',
    deadline: '2024-11-15',
    focusAreas: ['Research', 'Innovation', 'Climate', 'Health', 'Digital'],
    description: 'EU flagship research and innovation funding program',
    requirements: ['Research proposal', 'Impact assessment', 'Budget breakdown', 'Consortium agreement']
  },
  {
    id: 'eic-accelerator',
    name: 'EIC Accelerator',
    type: 'grant',
    organization: 'European Innovation Council',
    amountRange: '€0.5M - €17.5M',
    deadline: 'Quarterly deadlines',
    focusAreas: ['Deep Tech', 'Breakthrough Innovation', 'Scale-up'],
    description: 'Funding for high-risk, high-impact deep tech innovations',
    requirements: ['Innovation dossier', 'Market analysis', 'IP strategy', 'Financial plan']
  },
  
  // German Programs
  {
    id: 'kfw-startup-loan',
    name: 'KfW Startup Loan',
    type: 'loan',
    organization: 'KfW Bank',
    amountRange: '€25,000 - €500,000',
    deadline: 'Ongoing',
    focusAreas: ['Technology', 'Green Tech', 'Healthcare', 'Manufacturing'],
    description: 'Low-interest loans for German startups and scale-ups',
    requirements: ['Business plan', 'Market analysis', 'Repayment plan', 'Financial projections']
  },
  {
    id: 'bmwi-grants-tech',
    name: 'BMWi Technology Grants',
    type: 'grant',
    organization: 'Federal Ministry for Economic Affairs',
    amountRange: '€100,000 - €1,000,000',
    deadline: 'Biannual',
    focusAreas: ['Industrial Technology', 'Digitalization', 'Energy Efficiency'],
    description: 'Government grants for technology development projects',
    requirements: ['Technical concept', 'Economic viability study', 'Implementation timeline']
  },
  
  // Austrian Programs
  {
    id: 'aws-innovation-grant-at',
    name: 'AWS Innovation Grant Austria',
    type: 'grant',
    organization: 'Austrian Federal Economic Chamber',
    amountRange: '€5,000 - €50,000',
    deadline: '2024-10-31',
    focusAreas: ['Innovation', 'Digitalization', 'SME Development'],
    description: 'Support for Austrian SMEs implementing innovative projects',
    requirements: ['Project description', 'Cost calculation', 'Implementation plan']
  },
  {
    id: 'ffg-research-funding',
    name: 'FFG Research Funding',
    type: 'grant',
    organization: 'Austrian Research Promotion Agency',
    amountRange: '€20,000 - €500,000',
    deadline: 'Rolling',
    focusAreas: ['Research', 'Technology Transfer', 'Applied Research'],
    description: 'Funding for research and development projects',
    requirements: ['Research proposal', 'Academic credentials', 'Budget plan']
  },
  
  // Venture Capital / Equity
  {
    id: 'seedcamp-pre-seed',
    name: 'Seedcamp Pre-Seed',
    type: 'equity',
    organization: 'Seedcamp',
    amountRange: '€0.25M - €2M',
    deadline: 'Rolling applications',
    focusAreas: ['Tech', 'SaaS', 'Marketplace', 'Fintech'],
    description: 'Early-stage venture capital for European startups',
    requirements: ['Pitch deck', 'Financial model', 'Market analysis', 'Team introduction']
  },
  {
    id: 'atomico-growth',
    name: 'Atomico Growth Fund',
    type: 'equity',
    organization: 'Atomico',
    amountRange: '€5M - €50M',
    deadline: 'By appointment',
    focusAreas: ['Scale-up', 'European Champions', 'Tech', 'Enterprise Software'],
    description: 'Growth capital for European tech companies scaling internationally',
    requirements: ['Investment memorandum', 'Due diligence materials', 'Cap table', 'Revenue projections']
  }
];

export function ProgramFinder({ onProgramSelect, onClose }: ProgramFinderProps) {
  const { t } = useI18n();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load programs (simulating API call)
  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setPrograms(PROGRAM_CATALOG);
      setFilteredPrograms(PROGRAM_CATALOG);
      setLoading(false);
    };
    
    loadPrograms();
  }, []);

  // Filter programs based on search and filters
  useEffect(() => {
    let filtered = [...programs];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(program => 
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(program => program.type === selectedType);
    }
    
    // Focus area filter
    if (selectedFocus !== 'all') {
      filtered = filtered.filter(program => 
        program.focusAreas?.includes(selectedFocus)
      );
    }
    
    setFilteredPrograms(filtered);
  }, [programs, searchTerm, selectedType, selectedFocus]);

  const handleProgramClick = (program: Program) => {
    // Enrich program data with document setup structure
    const enrichedProgram = {
      ...program,
      // Add document setup metadata
      setupReady: true,
      confidenceScore: 90, // High confidence for curated programs
      processingTime: 'instant', // Curated programs process quickly
      // Add mapping hints for document setup
      suggestedStructure: program.type === 'equity' ? 'investment-memo' : 
                         program.type === 'grant' ? 'grant-application' : 'business-plan',
      keyRequirements: program.requirements?.slice(0, 3) || [] // Top 3 requirements
    };
    
    onProgramSelect(enrichedProgram);
    onClose();
  };

  const focusAreas = Array.from(new Set(programs.flatMap(p => p.focusAreas || [])));
  const types = Array.from(new Set(programs.map(p => p.type)));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {t('editor.desktop.program.finder.title' as any) || 'Find Funding Programs'}
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Filters */}
        <div className="p-4 border-b border-white/10 bg-slate-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs text-white/70 mb-1">
                {t('editor.desktop.program.finder.search' as any) || 'Search Programs'}
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('editor.desktop.program.finder.searchPlaceholder' as any) || 'Name, organization, or keywords...'}
                className="w-full rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              />
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="block text-xs text-white/70 mb-1">
                {t('editor.desktop.program.finder.type' as any) || 'Program Type'}
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                <option value="all">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Focus Area Filter */}
            <div>
              <label className="block text-xs text-white/70 mb-1">
                {t('editor.desktop.program.finder.focus' as any) || 'Focus Area'}
              </label>
              <select
                value={selectedFocus}
                onChange={(e) => setSelectedFocus(e.target.value)}
                className="w-full rounded border border-white/30 bg-white/10 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              >
                <option value="all">All Focus Areas</option>
                {focusAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/60">
                {t('editor.desktop.program.finder.loading' as any) || 'Loading programs...'}
              </div>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/60">
                {t('editor.desktop.program.finder.noResults' as any) || 'No programs found matching your criteria'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrograms.map((program) => (
                <div 
                  key={program.id}
                  className="bg-slate-800/50 rounded-lg border border-white/10 p-4 hover:border-blue-400/50 transition-all cursor-pointer"
                  onClick={() => handleProgramClick(program)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-white font-bold text-lg">{program.name}</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full capitalize">
                      {program.type}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-white/80">
                      <span className="w-24 text-white/60">Organization:</span>
                      <span>{program.organization}</span>
                    </div>
                    
                    {program.amountRange && (
                      <div className="flex items-center text-sm text-white/80">
                        <span className="w-24 text-white/60">Funding:</span>
                        <span className="font-medium text-green-300">{program.amountRange}</span>
                      </div>
                    )}
                    
                    {program.deadline && (
                      <div className="flex items-center text-sm text-white/80">
                        <span className="w-24 text-white/60">Deadline:</span>
                        <span className={program.deadline === 'Ongoing' ? 'text-yellow-300' : 'text-orange-300'}>
                          {program.deadline}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {program.focusAreas && program.focusAreas.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-white/60 mb-1">Focus Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {program.focusAreas.slice(0, 3).map((area, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-700 text-white/80 text-xs rounded-full">
                            {area}
                          </span>
                        ))}
                        {program.focusAreas.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-white/60 text-xs rounded-full">
                            +{program.focusAreas.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {program.requirements && program.requirements.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-white/60 mb-1">Key Requirements:</div>
                      <ul className="text-xs text-white/80 space-y-1">
                        {program.requirements.slice(0, 2).map((req, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            {req}
                          </li>
                        ))}
                        {program.requirements.length > 2 && (
                          <li className="text-white/60">+{program.requirements.length - 2} more requirements</li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-xs text-white/70">Blueprint Ready</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors">
                      Select Program
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-800/30">
          <div className="flex justify-between items-center text-sm text-white/60">
            <span>
              {filteredPrograms.length} of {programs.length} programs shown
            </span>
            <button 
              onClick={onClose}
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              {t('editor.desktop.program.finder.cancel' as any) || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}