import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useI18n } from '@/shared/contexts/I18nContext';

interface PlanningContextStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const PlanningContextStep: React.FC<PlanningContextStepProps> = ({ 
  formData, 
  onChange 
}) => {
  const { t } = useI18n();
  
  const businessObjectives = [
    { 
      value: 'launch', 
      label: t('editor.desktop.myProject.objectives.launch' as any) || 'Launch a new product / company' 
    },
    { 
      value: 'grow', 
      label: t('editor.desktop.myProject.objectives.grow' as any) || 'Grow an existing business' 
    },
    { 
      value: 'improve', 
      label: t('editor.desktop.myProject.objectives.improve' as any) || 'Improve or restructure operations' 
    },
    { 
      value: 'explore', 
      label: t('editor.desktop.myProject.objectives.explore' as any) || 'Explore a new market / idea' 
    },
    { 
      value: 'internal', 
      label: t('editor.desktop.myProject.objectives.internal' as any) || 'Internal planning / strategy' 
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="space-y-6">
          
          {/* Planning Horizon Section */}
          <div className="border border-slate-600 rounded-lg bg-slate-800/50">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📅</span>
                <h4 className="text-white font-bold text-sm">
                  {t('editor.desktop.myProject.fields.planningHorizon') || 'Planning Horizon'}
                </h4>
                <span className="text-red-400 font-bold text-sm">*</span>
              </div>
              <p className="text-white/70 text-sm mb-3">
                {t('editor.desktop.myProject.descriptions.planningHorizon' as any) || 'Select your planning timeframe'}
              </p>
              
              <div className="w-full">
                <select
                  value={formData.financialBaseline?.planningHorizon || 12}
                  onChange={(e) => onChange('financialBaseline.planningHorizon', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors text-sm"
                >
                  <option value={12}>{t('editor.desktop.myProject.months.12') || '12 months'}</option>
                  <option value={24}>{t('editor.desktop.myProject.months.24') || '24 months'}</option>
                  <option value={36}>{t('editor.desktop.myProject.months.36') || '36 months'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Business Objective Section */}
          <div className="border border-slate-600 rounded-lg bg-slate-800/50">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎯</span>
                <h4 className="text-white font-bold text-sm">
                  {t('editor.desktop.myProject.fields.mainObjective' as any) || 'Main Business Objective'}
                </h4>
                <span className="text-red-400 font-bold text-sm">*</span>
              </div>
              <p className="text-white/70 text-sm mb-3">
                {t('editor.desktop.myProject.descriptions.mainObjective' as any) || 'What is your primary business goal?'}
              </p>
              
              <div className="space-y-2">
                {businessObjectives.map((objective) => (
                  <button
                    key={objective.value}
                    type="button"
                    onClick={() => onChange('mainObjective', objective.value)}
                    className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all duration-150 flex items-center gap-3 ${
                      formData.mainObjective === objective.value
                        ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                        : 'bg-slate-700 border-slate-600 hover:border-blue-400 hover:bg-slate-600'
                    }`}
                  >
                    <span className="text-lg">
                      {formData.mainObjective === objective.value ? '●' : '○'}
                    </span>
                    <span className="font-medium">{objective.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanningContextStep;