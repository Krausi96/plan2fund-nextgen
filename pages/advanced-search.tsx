import ProgramFinder from '@/features/reco/components/ProgramFinder';

// Redirect to unified ProgramFinder
export default function AdvancedSearch() {
  return <ProgramFinder initialMode="manual" />;
}

// Define Chip type locally since aiChipParser was deleted
interface Chip {
  id: string;
  text: string;
  value: string;
  label: string;
  type: 'keyword' | 'category' | 'filter';
  removable?: boolean;
  required?: boolean;
  confidence?: number;
}

export default function AdvancedSearch() {
  const { t } = useI18n();
  const { handleAdvancedSearch } = useRecommendation();
  
  // Add CSS styles for quality indicators
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .wizard-quality-indicator {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        font-weight: 600;
        font-size: 0.875rem;
      }
      .wizard-quality-green {
        background: linear-gradient(135deg, #d1fae5, #a7f3d0);
        border: 1px solid #10b981;
        color: #065f46;
      }
      .wizard-quality-blue {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        border: 1px solid #3b82f6;
        color: #1e40af;
      }
      .wizard-quality-orange {
        background: linear-gradient(135deg, #fed7aa, #fdba74);
        border: 1px solid #f59e0b;
        color: #92400e;
      }
      .wizard-quality-message {
        font-size: 1rem;
        font-weight: 700;
      }
      .wizard-quality-score {
        font-size: 0.875rem;
        opacity: 0.8;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [searchInput, setSearchInput] = useState('');
  const [chips, setChips] = useState<Chip[]>([]);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [programPreview, setProgramPreview] = useState<any[]>([]);
  const [previewQuality, setPreviewQuality] = useState<{ level: string; message: string; color: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    
    try {
      // Use the centralized recommendation context for advanced search
      const result = await handleAdvancedSearch(searchInput);
      
      // Dynamic Hybrid Preview - Show program matches in real-time
      if (result && Array.isArray(result) && result.length > 0) {
        const previewResults = result.slice(0, 3); // Top 3 programs
        setProgramPreview(previewResults);
        
        // Analyze preview quality for dynamic decision making
        const topScore = previewResults[0]?.score || 0;
        if (topScore >= 85) {
          setPreviewQuality({ level: 'excellent', message: '🎯 Excellent specialized matches found!', color: 'green' });
        } else if (topScore >= 60) {
          setPreviewQuality({ level: 'good', message: '📊 Good matches, more details could help', color: 'blue' });
        } else {
          setPreviewQuality({ level: 'poor', message: '❓ Need more specific requirements', color: 'orange' });
        }
        
        console.log('📊 Advanced Search Preview:', previewResults.length, 'programs, quality:', previewQuality?.level);
      }
      
      // The context will handle the search and routing
      console.log('Advanced Search completed via RecommendationContext');

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClarifications = async () => {
    // Proceed with current chips even if some required fields are missing
    const answers = convertChipsToAnswers(chips);
    // Use the recommendation context instead of direct import
    const recommendations = await handleAdvancedSearch(JSON.stringify(answers));
    
    // Store results in localStorage like wizard does
    localStorage.setItem("recoResults", JSON.stringify(recommendations));
    localStorage.setItem("userAnswers", JSON.stringify(answers));
    
    // Route to results page
    window.location.href = "/results";
    setClarifications([]);
  };

  const convertChipsToAnswers = (chips: Chip[]): Record<string, any> => {
    const answers: Record<string, any> = {};
    
    chips.forEach(chip => {
      switch (chip.id) {
        case 'location':
          if (chip.value.includes('Vienna')) answers.q1_country = 'AT';
          else if (chip.value.includes('Austria')) answers.q1_country = 'AT';
          else if (chip.value.includes('EU')) answers.q1_country = 'EU';
          else answers.q1_country = 'NON_EU';
          break;
        case 'stage':
          if (chip.value === 'Idea') answers.q2_entity_stage = 'PRE_COMPANY';
          else if (chip.value === 'MVP') answers.q2_entity_stage = 'INC_LT_6M';
          else if (chip.value === 'Revenue') answers.q2_entity_stage = 'INC_6_36M';
          else if (chip.value === 'Growth') answers.q2_entity_stage = 'INC_GT_36M';
          else if (chip.value === 'Scaleup') answers.q2_entity_stage = 'INC_GT_36M';
          break;
        case 'team_size':
          const size = parseInt(chip.value);
          if (size <= 9) answers.q3_company_size = 'MICRO_0_9';
          else if (size <= 49) answers.q3_company_size = 'SMALL_10_49';
          else if (size <= 249) answers.q3_company_size = 'MEDIUM_50_249';
          else answers.q3_company_size = 'LARGE_250_PLUS';
          break;
        case 'sector':
          if (chip.value === 'AI') answers.q4_theme = 'INNOVATION_DIGITAL';
          else if (chip.value === 'Health') answers.q4_theme = 'HEALTH_LIFE_SCIENCE';
          else if (chip.value === 'GreenTech') answers.q4_theme = 'SUSTAINABILITY';
          else if (chip.value === 'SaaS') answers.q4_theme = 'INNOVATION_DIGITAL';
          else answers.q4_theme = 'INNOVATION_DIGITAL';
          break;
        case 'funding_need':
          answers.q8_funding_types = 'GRANT'; // Default to grant for now
          break;
        case 'collaboration':
          if (chip.value === 'Yes') answers.q7_collaboration = 'WITH_RESEARCH';
          else if (chip.value === 'No') answers.q7_collaboration = 'NO';
          else answers.q7_collaboration = 'UNSURE';
          break;
      }
    });

    return answers;
  };

  const removeChip = (chipId: string) => {
    setChips(prev => prev.filter(chip => chip.id !== chipId));
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('advancedSearch.title')}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('advancedSearch.subtitle')}
          </p>
        </div>

        {/* Enhanced Search Input with SmartWizard Design */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-8">
            <div className="space-y-6">
            <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-900 mb-3">
                  {t('advancedSearch.projectDescriptionLabel')}
                </label>
                <textarea
                id="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('advancedSearch.placeholder')}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={5}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSearch()}
              />
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  {t('advancedSearch.whatToInclude')}
                </p>
                <ul className="text-sm text-gray-500 space-y-1 ml-4 list-disc">
                  <li>{t('advancedSearch.tip1')}</li>
                  <li>{t('advancedSearch.tip2')}</li>
                  <li>{t('advancedSearch.tip3')}</li>
                  <li>{t('advancedSearch.tip4')}</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleSearch}
              disabled={loading || !searchInput.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('advancedSearch.analyzing')}
                  </div>
                ) : (
                  t('advancedSearch.findPrograms')
                )}
            </Button>
          </div>
          </div>
        </div>

        {/* Enhanced Chips Display with AI Insights */}
        {chips.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                {t('advancedSearch.aiDetectedRequirements')}
              </h3>
              <span className="text-sm text-gray-600">
                {chips.length} {t('advancedSearch.requirementsFound')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chips.map((chip) => (
                <div
                  key={chip.id}
                  className={`animate-fade-in-up px-4 py-3 rounded-xl text-sm flex items-center justify-between ${
                    chip.required 
                      ? 'bg-blue-100 border border-blue-300 text-blue-800' 
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                  <span className="font-medium">{chip.label}:</span>
                    <span className="font-semibold">{chip.value}</span>
                    {chip.confidence && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {Math.round(chip.confidence * 100)}% {t('advancedSearch.confidence')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeChip(chip.id)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clarifications */}
        {clarifications.length > 0 && (
          <Card className="p-6 mb-6 border-orange-200 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              {t('advancedSearch.quickClarifications')}
            </h3>
            <div className="space-y-3">
              {clarifications.map((clarification, index) => (
                <div key={index} className="text-orange-700">
                  {clarification}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSkipClarifications}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  {t('advancedSearch.skipAndContinue')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Dynamic Hybrid Preview */}
        {programPreview.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-6 mb-6">
            {/* Preview Quality Indicator */}
            {previewQuality && (
              <div className={`wizard-quality-indicator wizard-quality-${previewQuality.color} mb-4`}>
                <span className="wizard-quality-message">{previewQuality.message}</span>
                <span className="wizard-quality-score">
                  {programPreview[0]?.score ? `${Math.round(programPreview[0].score)}% match` : ''}
                </span>
              </div>
            )}
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              {t('advancedSearch.aiPoweredPreview')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {programPreview.map((program) => (
                <div key={program.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-2">{program.name}</h4>
                    <div className="text-right ml-2">
                      <div className="text-lg font-bold text-blue-600">{Math.round(program.score)}%</div>
                      <div className="text-xs text-gray-500">{t('advancedSearch.match')}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{program.notes}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {program.maxAmount ? `€${program.maxAmount.toLocaleString()}` : 'N/A'}
                    </div>
                    <button 
                      onClick={() => window.open(program.link, '_blank')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      {t('advancedSearch.view')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => {
                  // Navigate to results page with full recommendations
                  localStorage.setItem("recoResults", JSON.stringify(programPreview));
                  window.location.href = '/results';
                }}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('advancedSearch.viewAllResults')}
              </button>
            </div>
          </div>
        )}

        {/* Smart Routing Navigation */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {t('advancedSearch.smartRouting')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{t('advancedSearch.detailedQuestions')}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('advancedSearch.detailedQuestionsDesc')}
              </p>
              <Link 
                href="/reco" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                {t('advancedSearch.startSmartWizard')}
          </Link>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{t('advancedSearch.aiPoweredSearch')}</h4>
              <p className="text-sm text-gray-600 mb-3">
                {t('advancedSearch.aiPoweredSearchDesc')}
              </p>
              <span className="inline-flex items-center text-green-600 font-medium">
                {t('advancedSearch.youreHere')}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
