import React, { useState, useEffect } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';

interface Program {
  id: string;
  name: string;
  type: string;
  organization: string;
  amountRange?: string;
  deadline?: string;
  decisionTime?: string;
  region?: string;
  companyStage?: string;
  focusAreas?: string[];
  description?: string;
  requirements?: string[];
  co_financing_required?: boolean;
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

// Use the individual program templates directly
const loadProgramCatalog = async (): Promise<Program[]> => {
  // Import program manager to get all programs
  const { programManager } = await import('@/features/editor/lib/templates');
  
  const allPrograms = programManager.getAllPrograms();
  
  return allPrograms.map((program: any) => ({
    id: program.id,
    name: program.name,
    type: program.type || 'grant',
    organization: program.organization || 'Unknown',
    amountRange: program.funding_range || (program.funding_amount_min && program.funding_amount_max 
      ? `${program.currency || '€'}${program.funding_amount_min.toLocaleString()} - ${program.currency || '€'}${program.funding_amount_max.toLocaleString()}`
      : undefined),
    deadline: program.timeline?.application_deadline || program.deadline || 'Ongoing',
    decisionTime: program.timeline?.decision_time || '~6 weeks',
    region: program.region || 'Global',
    companyStage: program.company_stage || program.eligible_stage || 'N/A',
    focusAreas: program.focus_areas || program.program_focus || [],
    description: program.description,
    requirements: program.requirements || [],
    co_financing_required: program.co_financing_required || false,
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
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedFundingSize, setSelectedFundingSize] = useState<string>('any');
// Funding type is now shown in the Type field, so this is no longer needed
  // const [selectedFundingType, setSelectedFundingType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Format funding amounts to show as €25k–€250k instead of EUR25.000 - EUR250.000
  const formatFundingAmount = (amountRange?: string): string | undefined => {
    if (!amountRange) return undefined;

    // Check if the amountRange already contains "Mio" format
    const mioRegex = /Mio\s*€([\d.,]+)\s*[-–]\s*Mio\s*€([\d.,]+)/;
    if (mioRegex.test(amountRange)) {
      const matches = amountRange.match(mioRegex);
      if (matches && matches.length >= 3) {
        const min = parseFloat(matches[1].replace(/,/g, '.'));
        const max = parseFloat(matches[2].replace(/,/g, '.'));
        return `€${min}M–€${max}M`;
      }
    }
    
    // Handle different currency formats and convert to desired format
    // Example: Convert "EUR25.000 - EUR250.000" to "€25k–€250k"
    const euroPattern = /(?:EUR|€)([\d.,]+)\s*[-–]\s*(?:EUR|€)([\d.,]+)/;
    const thousandPattern = /(?:EUR|€)([\d.,]+)\s*[-–]\s*(?:EUR|€)([\d.,]+)\s*\.000/;
    const millionPattern = /([\d.,]+)\s*M\s*EUR/;
    
    if (millionPattern.test(amountRange)) {
      const matches = amountRange.match(millionPattern);
      if (matches && matches.length >= 2) {
        // For million formats, we need to handle differently
        // This is a simplified approach - adjust as needed based on actual data
        return amountRange.replace(/M\s*EUR/g, 'M').replace(/EUR/g, '€');
      }
    } else if (thousandPattern.test(amountRange)) {
      // Handle "EUR25.000 - EUR250.000" format -> "€25k–€250k"
      const matches = amountRange.match(thousandPattern);
      if (matches && matches.length >= 3) {
        const min = parseFloat(matches[1].replace(/,/g, ''));
        const max = parseFloat(matches[2].replace(/,/g, ''));
        return `€${min}k–€${max}k`;
      }
    } else if (euroPattern.test(amountRange)) {
      const matches = amountRange.match(euroPattern);
      if (matches && matches.length >= 3) {
        const min = parseFloat(matches[1].replace(/,/g, ''));
        const max = parseFloat(matches[2].replace(/,/g, ''));
        return `€${formatCurrency(min)}–€${formatCurrency(max)}`;
      }
    }

    // Handle other formats that might already be in the right format
    let result = amountRange.replace(/EUR/g, '€').replace(/\.000/g, 'k');
    
    // Final check for any remaining Mio format
    const finalMioMatch = result.match(/Mio\s*€([\d.,]+)\s*[-–]\s*Mio\s*€([\d.,]+)/);
    if (finalMioMatch) {
      const min = parseFloat(finalMioMatch[1].replace(/,/g, '.'));
      const max = parseFloat(finalMioMatch[2].replace(/,/g, '.'));
      return `€${min}M–€${max}M`;
    }
    
    return result;
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${Math.round(value / 1000)}k`;
    }
    return value.toString();
  };

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
    
    // Stage filter
    if (selectedStage !== 'all') {
      filtered = filtered.filter(program => program.companyStage === selectedStage);
    }
    
    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(program => program.region === selectedRegion);
    }
    
    // Funding size filter
    if (selectedFundingSize !== 'any') {
      filtered = filtered.filter(program => {
        if (!program.amountRange) return true;
        
        // Extract numeric funding values from amountRange string
        const numbers = program.amountRange.match(/\d+/g);
        if (!numbers || numbers.length < 2) return true;
        
        const minAmount = parseInt(numbers[0], 10);
        const maxAmount = parseInt(numbers[numbers.length - 1], 10);
        
        switch(selectedFundingSize) {
          case 'under50k':
            return maxAmount < 50000;
          case '50kto250k':
            return minAmount >= 50000 && maxAmount <= 250000;
          case '250kto1m':
            return minAmount >= 250000 && maxAmount <= 1000000;
          case 'over1m':
            return minAmount > 1000000;
          default:
            return true;
        }
      });
    }
    

    
    setFilteredPrograms(filtered);
  }, [programs, searchTerm, selectedType, selectedFocus, selectedStage, selectedRegion, selectedFundingSize]);

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
  const stages = Array.from(new Set(programs.map(p => p.companyStage).filter(Boolean)));
  const regions = Array.from(new Set(programs.map(p => p.region).filter(Boolean)));

  return (
    <div className="bg-slate-800/40 rounded-xl border border-slate-600/50 overflow-hidden shadow-lg">
      {/* Filters - Centered layout with max-width */}
      <div className="mx-auto max-w-[1180px] p-2 border-b border-white/10 bg-slate-800/20">
        {/* Row 1 - Search only */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
          {/* Search */}
          <div className="flex-1 min-w-[300px] max-w-[600px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10"
            />
          </div>
        </div>
        
        {/* Row 2 - All filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Stage Filter */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10 min-w-[100px]"
            >
              <option value="all">Stage</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
          
          {/* Region Filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10 min-w-[100px]"
            >
              <option value="all">Region</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          {/* Funding Size Dropdown */}
          <div>
            <select
              value={selectedFundingSize}
              onChange={(e) => setSelectedFundingSize(e.target.value)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10 min-w-[100px]"
            >
              <option value="any">Funding</option>
              <option value="under50k">&lt;€50k</option>
              <option value="50kto250k">€50k–€250k</option>
              <option value="250kto1m">€250k–€1M</option>
              <option value="over1m">1M+</option>
            </select>
          </div>
          
          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10 min-w-[100px]"
            >
              <option value="all">Type</option>
              {types.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          
          {/* Focus Area Filter */}
          <div>
            <select
              value={selectedFocus}
              onChange={(e) => setSelectedFocus(e.target.value)}
              className="rounded border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/60 h-10 min-w-[100px]"
            >
              <option value="all">Focus</option>
              {focusAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
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
          <div className="mx-auto max-w-[1180px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map((program) => {
              // Format funding amount
              const formattedAmount = formatFundingAmount(program.amountRange);
              
              // Format focus areas
              let focusText = 'No focus';
              if (program.focusAreas && program.focusAreas.length > 0) {
                if (program.focusAreas.length === 1) {
                  focusText = program.focusAreas[0];
                } else {
                  focusText = `${program.focusAreas[0]} +${program.focusAreas.length - 1}`;
                }
              }
              
              return (
              <div 
                key={program.id}
                className="bg-slate-700/50 rounded-lg border border-slate-600 p-4 hover:border-blue-400/70 transition-all cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => handleProgramClick(program)}
              >
                <div className="font-bold text-white mb-2 text-[15px]">
                  {formattedAmount || 'Amount varies'}
                </div>
                
                <h4 className="text-white font-semibold text-sm mb-1 truncate">
                  {program.name}
                </h4>
                
                {(program.organization && program.organization !== 'Unknown') && (
                  <div className="text-xs text-white/70 mb-1 truncate">
                    {program.organization}
                  </div>
                )}
                
                <div className="mb-3">
                  <span className="font-medium text-xs text-white/70 mr-1">Deadline:</span>
                  <span className={`text-[11px] px-2 py-1 rounded-md ${program.deadline?.toLowerCase().includes('ongoing') || program.deadline?.toLowerCase().includes('rolling') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                    {program.deadline || 'N/A'}
                  </span>
                </div>
                
                <div className="text-xs text-white/70 mb-1">
                  <span className="font-medium">Region:</span> {program.region || 'No region'}
                </div>
                
                <div className="text-xs text-white/70 mb-1">
                  <span className="font-medium">Stage:</span> {program.companyStage || 'No stage'}
                </div>
                
                <div className="text-xs text-white/70 mb-3">
                  <span className="font-medium">Focus:</span> {focusText}
                </div>
                
                <div className="text-xs text-white/70 mb-3">
                  <span className="font-medium">Type:</span> {program.type.charAt(0).toUpperCase() + program.type.slice(1)}
                </div>
                
                <button className="w-full mt-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-md transition-colors font-medium">
                  {t('editor.desktop.program.finder.selectProgram' as any) || 'Select Program'}
                </button>
              </div>
            );})}
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