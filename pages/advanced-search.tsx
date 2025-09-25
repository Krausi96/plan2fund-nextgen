import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { aiChipParser, Chip } from '@/lib/aiChipParser';
import { scoreProgramsEnhanced } from '@/lib/enhancedRecoEngine';
import { useI18n } from '@/contexts/I18nContext';

export default function AdvancedSearch() {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState('');
  const [chips, setChips] = useState<Chip[]>([]);
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    
    try {
      // Parse input into chips
      const parsed = aiChipParser.parseInput(searchInput);
      setChips(parsed.chips);
      setClarifications(parsed.clarifications);

      // Convert chips to answers format for recommendation engine
      const answers = convertChipsToAnswers(parsed.chips);
      
      // Get recommendations using the same engine as wizard
      const recommendations = scoreProgramsEnhanced(answers, "strict");
      
      // Store results in localStorage like wizard does
      localStorage.setItem("recoResults", JSON.stringify(recommendations));
      localStorage.setItem("userAnswers", JSON.stringify(answers));
      
      // Route to results page
      window.location.href = "/results";

      // Log analytics
      console.log('Advanced Search Analytics:', {
        ai_help_opened: true,
        chips_generated: parsed.chips.length,
        clarifications_asked: parsed.clarifications.length,
        advanced_search_run: 1
      });

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipClarifications = () => {
    // Proceed with current chips even if some required fields are missing
    const answers = convertChipsToAnswers(chips);
    const recommendations = scoreProgramsEnhanced(answers, "explorer");
    
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

        {/* Search Input */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your project
              </label>
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="e.g. Vienna, MVP, team 3, healthtech, €150k staff funding"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <p className="text-sm text-gray-500 mt-2">
                Add these 5 items for best results: location, stage, team size, sector, funding need.
              </p>
            </div>

            <Button 
              onClick={handleSearch}
              disabled={loading || !searchInput.trim()}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Find Funding Programs'}
            </Button>
          </div>
        </Card>

        {/* Chips Display */}
        {chips.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Information</h3>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <motion.div
                  key={chip.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                    chip.required 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{chip.label}:</span>
                  <span>{chip.value}</span>
                  <button
                    onClick={() => removeChip(chip.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {/* Clarifications */}
        {clarifications.length > 0 && (
          <Card className="p-6 mb-6 border-orange-200 bg-orange-50">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              Quick Clarifications
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
                  Skip and Continue
                </Button>
              </div>
            </div>
          </Card>
        )}


        {/* Back to Wizard */}
        <div className="text-center mt-8">
          <Link href="/reco" className="text-blue-600 hover:text-blue-800">
            ← Back to Detailed Wizard
          </Link>
        </div>
      </div>

    </div>
  );
}
