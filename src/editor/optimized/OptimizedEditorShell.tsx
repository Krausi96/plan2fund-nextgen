// ========= PLAN2FUND — OPTIMIZED EDITOR SHELL =========
// Performance-optimized editor with multi-user support

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { PlanDocument, Route } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/contexts/I18nContext';

// Lazy load only essential components
const SectionEditor = React.lazy(() => import('@/components/editor/SectionEditor'));
const EnhancedAIChat = React.lazy(() => import('@/components/editor/EnhancedAIChat'));
const ExportSettings = React.lazy(() => import('@/components/editor/ExportSettings'));

interface OptimizedEditorShellProps {
  plan: PlanDocument;
  programProfile?: ProgramProfile | null;
  onSave: (plan: PlanDocument) => Promise<void>;
  onRouteChange: (route: Route) => void;
  onLanguageChange: (language: 'de'|'en') => void;
  onToneChange: (tone: 'neutral'|'formal'|'concise') => void;
  onTargetLengthChange: (length: 'short'|'standard'|'extended') => void;
  onSettingsChange: (settings: PlanDocument['settings']) => void;
  onAddonPackToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}

export default function OptimizedEditorShell({
  plan,
  programProfile,
  onSave,
  onRouteChange,
  onLanguageChange,
  onToneChange,
  onTargetLengthChange,
  onSettingsChange,
  onAddonPackToggle,
  children
}: OptimizedEditorShellProps) {
  const { userProfile } = useUser();
  const { setLocale } = useI18n();
  const router = useRouter();
  
  // Optimized state management
  const [saveStatus, setSaveStatus] = useState<'saved'|'saving'|'unsaved'>('saved');
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentSection, setCurrentSection] = useState(plan.sections[0]?.key || 'executive_summary');

  // Memoized values to prevent unnecessary re-renders
  const completedSections = useMemo(() => 
    plan.sections.filter(s => s.status === 'aligned').length,
    [plan.sections]
  );

  const totalSections = useMemo(() => 
    plan.sections.length,
    [plan.sections]
  );

  // Optimized save with debouncing
  const debouncedSave = useCallback(
    debounce(async (planToSave: PlanDocument) => {
      setSaveStatus('saving');
      try {
        await onSave(planToSave);
        setSaveStatus('saved');
      } catch (error) {
        console.error('Save failed:', error);
        setSaveStatus('unsaved');
      }
    }, 1000),
    [onSave]
  );

  // Auto-save when plan changes
  useEffect(() => {
    if (plan && userProfile) {
      debouncedSave(plan);
    }
  }, [plan, debouncedSave, userProfile]);

  const handleLanguageChange = useCallback((newLanguage: 'de'|'en') => {
    setLocale(newLanguage);
    onLanguageChange(newLanguage);
  }, [setLocale, onLanguageChange]);

  const handleExport = useCallback(async (options: any) => {
    setIsExporting(true);
    try {
      // Import export renderer dynamically
      const { exportRenderer } = await import('@/export/renderer');
      const result = await exportRenderer.renderPlan(plan, options);
      if (result.success) {
        console.log('Export successful:', result.downloadUrl);
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [plan]);

  // User-specific plan ID
  const userPlanId = useMemo(() => 
    userProfile ? `${userProfile.id}_${plan.id}` : plan.id,
    [userProfile, plan.id]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Optimized Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* User-specific document title */}
            <input
              type="text"
              value={userPlanId}
              readOnly
              className="text-xl font-semibold bg-transparent border-none outline-none text-gray-600"
              placeholder="Untitled Document"
            />
            
            {/* Route Selector */}
            <select
              value={plan.route}
              onChange={(e) => onRouteChange(e.target.value as Route)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="grant">Grant</option>
              <option value="bank">Bank</option>
              <option value="equity">Equity</option>
              <option value="visa">Visa</option>
              <option value="ams">AMS</option>
            </select>

            {/* Program Badge */}
            {programProfile && (
              <Badge variant="secondary">
                {programProfile.programId}
              </Badge>
            )}

            {/* User Badge */}
            {userProfile && (
              <Badge variant="outline">
                {userProfile.segment}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={plan.language}
              onChange={(e) => handleLanguageChange(e.target.value as 'de'|'en')}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
            </select>

            {/* Tone Selector */}
            <select
              value={plan.tone}
              onChange={(e) => onToneChange(e.target.value as 'neutral'|'formal'|'concise')}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="neutral">Neutral</option>
              <option value="formal">Formal</option>
              <option value="concise">Concise</option>
            </select>

            {/* Target Length */}
            <select
              value={plan.targetLength}
              onChange={(e) => onTargetLengthChange(e.target.value as 'short'|'standard'|'extended')}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="short">Short</option>
              <option value="standard">Standard</option>
              <option value="extended">Extended</option>
            </select>

            {/* Save Status */}
            <span className={`text-sm ${
              saveStatus === 'saved' ? 'text-green-600' : 
              saveStatus === 'saving' ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {saveStatus === 'saved' ? 'Saved' : 
               saveStatus === 'saving' ? 'Saving...' : 
               'Unsaved'}
            </span>

            {/* Export Button */}
            <Button 
              onClick={() => setShowExportSettings(true)} 
              variant="primary"
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>

      {/* Lazy-loaded Export Settings Modal */}
      {showExportSettings && (
        <React.Suspense fallback={<div>Loading export settings...</div>}>
          <ExportSettings
            isOpen={showExportSettings}
            onClose={() => setShowExportSettings(false)}
            onExport={handleExport}
            hasAddonPack={plan.addonPack || false}
          />
        </React.Suspense>
      )}
    </div>
  );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
