// ========= PLAN2FUND — EDITOR SHELL =========
// Main editor container with top bar, left rail, center editor, and right rail

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/contexts/I18nContext';
import { PlanDocument, Route } from '@/types/plan';
import { ProgramProfile } from '@/types/reco';

interface EditorShellProps {
  plan: PlanDocument;
  programProfile?: ProgramProfile | null;
  onSave: () => void;
  onExport: () => void;
  onRouteChange: (route: Route) => void;
  onLanguageChange: (language: 'de'|'en') => void;
  onToneChange: (tone: 'neutral'|'formal'|'concise') => void;
  onTargetLengthChange: (length: 'short'|'standard'|'extended') => void;
  onSettingsChange: (settings: PlanDocument['settings']) => void;
  onAddonPackToggle: (enabled: boolean) => void;
  children: React.ReactNode;
}

export default function EditorShell({
  plan,
  programProfile,
  // onSave,
  onExport,
  onRouteChange,
  onLanguageChange,
  onToneChange,
  onTargetLengthChange,
  onSettingsChange: _onSettingsChange, // Passed to children
  onAddonPackToggle: _onAddonPackToggle, // Passed to children
  children
}: EditorShellProps) {
  const { setLocale } = useI18n();
  const [saveStatus] = useState<'saved'|'saving'|'unsaved'>('saved');

  const handleLanguageChange = (newLanguage: 'de'|'en') => {
    setLocale(newLanguage);
    onLanguageChange(newLanguage);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Document Title */}
            <input
              type="text"
              value={plan.id}
              onChange={() => {/* Handle title change */}}
              className="text-xl font-semibold bg-transparent border-none outline-none"
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
            <Button onClick={onExport} variant="primary">
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
