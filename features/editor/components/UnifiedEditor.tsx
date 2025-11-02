// ========= PLAN2FUND — UNIFIED EDITOR =========
// OPTIMIZED EDITOR - All components integrated with performance optimizations

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Removed EditorState - now using integrated state management in Phase4Integration
import { useI18n } from '@/shared/contexts/I18nContext';
import { normalizeEditorInput } from '@/features/editor/engine/EditorNormalization';

// Import core components
import ProgramSelector from './ProgramSelector';
import Phase4Integration from './Phase4Integration';
import ExportSettings from './ExportSettings';

interface UnifiedEditorProps {
  programId?: string | null;
  route?: string;
  product?: string;
  answers?: Record<string, any>;
  payload?: Record<string, any>;
  restore?: boolean;
  onSave?: (content: Record<string, string>) => void;
  onExport?: () => void;
}

export default function UnifiedEditor({
  programId: propProgramId,
  route: propRoute,
  product: propProduct,
  answers: propAnswers,
  payload: propPayload,
  restore: propRestore
}: UnifiedEditorProps) {
  const router = useRouter();
  const { t } = useI18n();
  // State management now integrated in Phase4Integration

  // Normalize all input data
  const normalizedData = useMemo(() => {
    return normalizeEditorInput({
      programId: propProgramId || undefined,
      route: propRoute,
      product: propProduct,
      answers: propAnswers,
      payload: propPayload,
      restore: propRestore,
      entryPoint: propProgramId ? 'wizard-results' : 'direct'
    });
  }, [propProgramId, propRoute, propProduct, propAnswers, propPayload, propRestore]);

  // State for filter selections (react to URL/query changes)
  const [filterProgramId, setFilterProgramId] = useState<string | null>(normalizedData.programId);
  useEffect(() => {
    setFilterProgramId(normalizedData.programId || null);
  }, [normalizedData.programId]);
  
  // UI State
  const [showExportSettings, setShowExportSettings] = useState(false);
  
  // Performance optimizations
  const [isInitialized, setIsInitialized] = useState(false);


  // Initialize with Phase4Integration for optimized performance
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      // Phase4Integration will handle template loading
    }
  }, [isInitialized]);

  // Load program sections when program is selected
  useEffect(() => {
    if (filterProgramId && isInitialized) {
      loadProgramSections();
    }
  }, [filterProgramId, isInitialized]);

  const loadProgramSections = async () => {
    if (!filterProgramId) return;
    
    try {
      console.log('Loading program sections for:', filterProgramId);
      // This will be handled by Phase4Integration when we pass the programId
    } catch (error) {
      console.error('Error loading program sections:', error);
    }
  };

  // If no program selected, show new ProgramSelector
  if (!filterProgramId) {
    return (
      <>
        <Head>
          <title>Choose Your Plan | Wähle deinen Pfad</title>
          <meta name="description" content={t('editor.description')} />
        </Head>
        <ProgramSelector
          onProgramSelect={(programId, product, route) => {
            router.push(`/editor?programId=${programId}&product=${product}&route=${route}`);
          }}
          onWizardRedirect={() => {
            router.push('/reco?product=submission');
          }}
        />
      </>
    );
  }

  // Main editor interface - Use Phase4Integration for optimized performance
  return (
    <>
      <Head>
        <title>{t('editor.title')}</title>
        <meta name="description" content={t('editor.description')} />
      </Head>
      
      <Phase4Integration
        initialPlan={undefined}
        programProfile={filterProgramId ? { programId: filterProgramId, route: 'grant' } : undefined}
        onPlanChange={(newPlan) => {
          console.log('Plan changed:', newPlan);
        }}
        onProgramProfileChange={(profile) => {
          console.log('Program profile changed:', profile);
        }}
      />
      
      {/* Modals */}
      {showExportSettings && (
        <ExportSettings
          onExport={(options) => {
            console.log('Export with options:', options);
            setShowExportSettings(false);
          }}
          onClose={() => setShowExportSettings(false)}
          isOpen={showExportSettings}
          hasAddonPack={false}
        />
      )}
    </>
  );
}