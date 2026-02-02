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
  application_requirements?: {
    documents?: Array<{
      document_name: string;
      required: boolean;
      format: string;
      authority: string;
      reuseable: boolean;
    }>;
    sections?: Array<{
      title: string;
      required: boolean;
      subsections: Array<{ title: string; required: boolean }>;
    }>;
    financial_requirements?: {
      financial_statements_required: string[];
      years_required: number[];
      co_financing_proof_required: boolean;
      own_funds_proof_required: boolean;
    };
  };
}

interface ProgramFinderProps {
  onProgramSelect: (program: Program) => void;
  onClose: () => void;
}

// Use the mock program repository instead of hardcoded catalog
const loadProgramCatalog = async (): Promise<Program[]> => {
  const { MOCK_FUNDING_PROGRAMS } = await import('@/features/editor/lib/templates/catalog/programs/mockPrograms');
  return MOCK_FUNDING_PROGRAMS.map(program => ({
    id: program.id,
    name: program.name,
    type: program.type || 'grant',
    organization: program.organization || 'Unknown',
    amountRange: program.funding_amount_min && program.funding_amount_max 
      ? `${program.currency || '€'}${program.funding_amount_min.toLocaleString()} - ${program.currency || '€'}${program.funding_amount_max.toLocaleString()}`
      : undefined,
    deadline: 'Ongoing',
    focusAreas: program.focus_areas || [],
    description: program.description,
    requirements: program.requirements || [],
    application_requirements: program.application_requirements || {
      documents: [],
      sections: [],
      financial_requirements: {
        financial_statements_required: [],
        years_required: [],
        co_financing_proof_required: false,
        own_funds_proof_required: false
      }
    }
  }));
};

export function ProgramFinder({ onProgramSelect, onClose }: ProgramFinderProps) {
  const { t } = useI18n();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Load programs from mock repository
  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        const programCatalog = await loadProgramCatalog();
        setPrograms(programCatalog);
        setFilteredPrograms(programCatalog);
      } catch (error) {
        console.error('Failed to load programs:', error);
        // Fallback to empty array
        setPrograms([]);
        setFilteredPrograms([]);
      } finally {
        setLoading(false);
      }
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

  const handleProgramClick = async (program: Program) => {
    // Save program selection
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('selectedProgram', JSON.stringify({
          id: program.id,
          name: program.name,
          type: program.type,
          organization: program.organization,
          description: program.description,
          application_requirements: program.application_requirements || {
            documents: [],
            sections: [],
            financial_requirements: {
              financial_statements_required: [],
              years_required: [],
              co_financing_proof_required: false,
              own_funds_proof_required: false
            }
          }
        }));
      } catch (error) {
        console.warn('Could not save program selection:', error);
      }
    }
    
    // Pass program directly to handler
    onProgramSelect(program);
    onClose();
  };

  const focusAreas = Array.from(new Set(programs.flatMap(p => p.focusAreas || [])));
  const types = Array.from(new Set(programs.map(p => p.type)));

  return (
    <div className="bg-slate-800/50 rounded-lg border border-white/10 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-white/10 bg-slate-800/30">
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
              <option value="all">{t('editor.desktop.program.finder.allTypes' as any) || 'All Types'}</option>
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
              <option value="all">{t('editor.desktop.program.finder.allFocusAreas' as any) || 'All Focus Areas'}</option>
              {focusAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-white/60 text-sm">
              {t('editor.desktop.program.finder.loading' as any) || 'Loading programs...'}
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/60 text-sm">
              {t('editor.desktop.program.finder.noResults' as any) || 'No programs found matching your criteria'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPrograms.map((program) => (
              <div 
                key={program.id}
                className="bg-slate-700/50 rounded border border-white/10 p-3 hover:border-blue-400/50 transition-all cursor-pointer"
                onClick={() => handleProgramClick(program)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium text-sm">{program.name}</h4>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full capitalize">
                    {program.type}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-white/80 mb-2">
                  <div className="flex items-center">
                    <span className="w-20 text-white/60">Org:</span>
                    <span>{program.organization}</span>
                  </div>
                  
                  {program.amountRange && (
                    <div className="flex items-center">
                      <span className="w-20 text-white/60">Funding:</span>
                      <span className="font-medium text-green-300">{program.amountRange}</span>
                    </div>
                  )}
                  
                  {program.deadline && (
                    <div className="flex items-center">
                      <span className="w-20 text-white/60">Deadline:</span>
                      <span className={program.deadline === 'Ongoing' ? 'text-yellow-300' : 'text-orange-300'}>
                        {program.deadline}
                      </span>
                    </div>
                  )}
                  
                  {/* Display requirements if available */}
                  {program.requirements && program.requirements.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="text-xs text-white/60 mb-1">Requirements:</div>
                      <div className="flex flex-wrap gap-1">
                        {program.requirements.slice(0, 3).map((req, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded">
                            {req}
                          </span>
                        ))}
                        {program.requirements.length > 3 && (
                          <span className="text-xs text-white/50">+{program.requirements.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <button className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors mt-2">
                  {t('editor.desktop.program.finder.selectProgram' as any) || 'Select Program'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-800/30 text-right">
        <button 
          onClick={onClose}
          className="px-3 py-1 text-white/80 hover:text-white text-sm transition-colors"
        >
          {t('editor.desktop.program.finder.cancel' as any) || 'Close'}
        </button>
      </div>
    </div>
  );
}