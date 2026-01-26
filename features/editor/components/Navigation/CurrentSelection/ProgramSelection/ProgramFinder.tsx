import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../../../../shared/contexts/I18nContext';

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

// Mock program data - would come from API in real implementation
const MOCK_PROGRAMS: Program[] = [
  {
    id: 'aws-2024-001',
    name: 'AWS Innovation Grant',
    type: 'grant',
    organization: 'Amazon Web Services',
    amountRange: '€10,000 - €100,000',
    deadline: '2024-12-31',
    focusAreas: ['Cloud Computing', 'AI/ML', 'Sustainability'],
    description: 'Support for innovative cloud-based solutions',
    requirements: ['Business plan', 'Technical documentation', 'Financial projections']
  },
  {
    id: 'eu-horizon-2024',
    name: 'Horizon Europe',
    type: 'grant',
    organization: 'European Commission',
    amountRange: '€50,000 - €2,000,000',
    deadline: '2024-11-15',
    focusAreas: ['Research', 'Innovation', 'Climate'],
    description: 'EU research and innovation funding program',
    requirements: ['Research proposal', 'Impact assessment', 'Budget breakdown']
  },
  {
    id: 'startup-loan-de',
    name: 'German Startup Loan',
    type: 'loan',
    organization: 'KfW Bank',
    amountRange: '€25,000 - €500,000',
    deadline: 'Ongoing',
    focusAreas: ['Technology', 'Green Tech', 'Healthcare'],
    description: 'Low-interest loans for German startups',
    requirements: ['Business plan', 'Market analysis', 'Repayment plan']
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
      setPrograms(MOCK_PROGRAMS);
      setFilteredPrograms(MOCK_PROGRAMS);
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
    onProgramSelect(program);
    onClose();
  };

  const focusAreas = Array.from(new Set(programs.flatMap(p => p.focusAreas || [])));
  const types = Array.from(new Set(programs.map(p => p.type)));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden">
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
              {filteredPrograms.map(program => (
                <div 
                  key={program.id}
                  className="bg-slate-800/50 rounded-lg border border-white/10 p-4 hover:border-blue-400/50 transition-colors cursor-pointer"
                  onClick={() => handleProgramClick(program)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg">{program.name}</h3>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full capitalize">
                      {program.type}
                    </span>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-3">{program.organization}</p>
                  
                  {program.amountRange && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-400 text-sm">💰</span>
                      <span className="text-white/90 text-sm">{program.amountRange}</span>
                    </div>
                  )}
                  
                  {program.deadline && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-400 text-sm">📅</span>
                      <span className="text-white/90 text-sm">Deadline: {program.deadline}</span>
                    </div>
                  )}
                  
                  {program.focusAreas && program.focusAreas.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-white/60 mb-1">Focus Areas:</div>
                      <div className="flex flex-wrap gap-1">
                        {program.focusAreas.map(area => (
                          <span key={area} className="px-2 py-1 bg-slate-700 text-white/80 text-xs rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {program.description && (
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-blue-400 text-sm font-medium">
                      {t('editor.desktop.program.finder.select' as any) || 'Select Program'}
                    </span>
                    <span className="text-white/50 text-xs">
                      {program.requirements?.length || 0} requirements
                    </span>
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