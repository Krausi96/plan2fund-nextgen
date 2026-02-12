import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/contexts/I18nContext';
import { generateProgramBlueprint, normalizeFundingProgram, generateDocumentStructureFromProfile } from '@/features/editor/lib';
import { enhanceWithSpecialSections } from '@/platform/analysis/internal/document-flows/document-flows/sections/enhancement/sectionEnhancement';
import { useProject } from '@/platform/core/context/hooks/useProject';
// import { generateBlueprint } from '@/platform/generation'; // Kept for future use
import { saveSelectedProgram } from '@/platform/analysis';

// Zod schema for manual program input validation
const ManualProgramInputSchema = z.object({
  id: z.string().min(1, 'Program ID is required').max(200, 'Program ID too long'),
  name: z.string().min(1, 'Program name is required').max(300, 'Program name too long'),
  funding_amount: z.number().positive('Funding amount must be positive').optional(),
  organization: z.string().optional(),
});

type ManualProgramInput = z.infer<typeof ManualProgramInputSchema>;

interface ProgramOptionProps {
  connectCopy?: any;
  programLoading?: boolean;
  programError?: string | null;
  onConnectProgram: (value: any) => void;
  onOpenProgramFinder?: () => void;
}

export function ProgramOption({
  connectCopy,
  programLoading,
  programError,
  onConnectProgram,
  onOpenProgramFinder
}: ProgramOptionProps) {
  const { t } = useI18n();
  const [manualValue, setManualValue] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputPosition, setManualInputPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  // Access platform store for document setup management
  const selectProgram = useProject((state) => state.selectProgram);
  const setDocumentStructure = useProject((state) => state.setDocumentStructure);
  const setSetupStatus = useProject((state) => state.setSetupStatus);
  const setSetupDiagnostics = useProject((state) => state.setSetupDiagnostics);
  
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleManualConnect = async () => {
    setManualError(null);
    
    // XSS Sanitization: Clean user input before processing
    const sanitizedInput = DOMPurify.sanitize(manualValue.trim());
    
    // Normalize program input (simple ID extraction)
    const normalized = sanitizedInput ? sanitizedInput.trim() : null;
    if (!normalized) {
      setManualError(connectCopy?.error || 'Invalid input');
      return;
    }
    
    // Validate manual program input with Zod
    const programInput: ManualProgramInput = {
      id: normalized,
      name: `Program: ${DOMPurify.sanitize(normalized)}`,
      organization: 'Manual Entry'
    };
    
    try {
      ManualProgramInputSchema.parse(programInput);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.issues.map(issue => issue.message).join(', ');
        setManualError(`Validation failed: ${fieldErrors}`);
        return;
      }
      setManualError('Invalid program input');
      return;
    }
    
    // Fetch all programs from the program manager
    const { programManager } = await import('@/features/editor/lib/templates');
    
    const individualTemplates = programManager.getAllPrograms();
    
    // Try to find a matching program in individual templates
    let programData = individualTemplates.find(
      (p: any) => p.id.toLowerCase().includes(normalized.toLowerCase()) || 
                 p.name.toLowerCase().includes(normalized.toLowerCase())
    );
    
    if (!programData) {
      // If no match found in individual templates, return error
      setManualError('No matching program found. Please select from ProgramFinder or enter a valid program identifier.');
      return;
    }
    
    // Use the found program with the user-provided ID
    programData = {
      ...programData,
      id: normalized,  // Use the user-provided ID
      name: `Program: ${DOMPurify.sanitize(normalized)}`,  // Use the user-provided name
    };
    
    // Save program selection using shared persistence helper
    saveSelectedProgram({
      id: programData.id,
      name: programData.name,
      type: programData.type,
      organization: programData.organization,
      application_requirements: programData.application_requirements
    });
    
    // Generate document structure using new pipeline
    try {
      // Step 1: Normalize to FundingProgram
      const fundingProgram = normalizeFundingProgram(programData);
      
      // Step 2: Generate DocumentStructure from parsed application requirements
      const documentStructure = await generateDocumentStructureFromProfile(fundingProgram);
      
      // Step 3: Enhance document structure with special sections (Title Page, TOC, References, etc.)
      const enhancedDocumentStructure = enhanceWithSpecialSections(documentStructure, t);
      
      // Update store with complete data
      // Store program as selectedProgram (not projectProfile - they are separate)
      selectProgram(fundingProgram as any); // Phase 7-8 will unify types properly
      setDocumentStructure(enhancedDocumentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: ['Program data entered manually - limited information available'],
        missingFields: ['Detailed requirements', 'Specific deadlines', 'Exact funding amounts'],
        confidence: fundingProgram.blueprintDiagnostics?.confidence || 60
      });
      
      // Step 5: Save the program selection and notify parent
      // The parent component (ProgramSelection) will handle the processing
      saveSelectedProgram({
        id: fundingProgram.id,
        name: fundingProgram.name,
        type: fundingProgram.type,
        organization: fundingProgram.organization,
        application_requirements: fundingProgram.applicationRequirements || programData.application_requirements
      });
      
      // Return the enhanced program data to the parent
      onConnectProgram(fundingProgram);
      
      setShowManualInput(false);
      setManualValue('');
      
    } catch (error) {
      console.error('Failed to generate blueprint:', error);
      setManualError('Failed to process program information. Please try again.');
    }
  };

  // Manual input positioning
  useEffect(() => {
    if (!showManualInput) {
      setManualInputPosition(null);
      return;
    }
    const updatePosition = () => {
      if (manualTriggerRef.current) {
        const rect = manualTriggerRef.current.getBoundingClientRect();
        const maxTop = window.innerHeight - 350;
        const top = Math.min(rect.bottom + 8, maxTop);
        const maxWidth = Math.min(rect.width, 420);
        const maxLeft = window.innerWidth - maxWidth - 20;
        const left = Math.min(Math.max(rect.left, 20), maxLeft);
        const finalTop = Math.min(Math.max(top, 20), window.innerHeight - 350);
        const finalLeft = Math.min(Math.max(left, 20), window.innerWidth - maxWidth - 20);
        
        setManualInputPosition({
          top: finalTop,
          left: finalLeft,
          width: maxWidth
        });
      }
    };
    updatePosition();
    
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        manualInputRef.current &&
        !manualInputRef.current.contains(target) &&
        manualTriggerRef.current &&
        !manualTriggerRef.current.contains(target)
      ) {
        setShowManualInput(false);
      }
    };
    const handleResize = () => {
      setTimeout(updatePosition, 100);
    };
    document.addEventListener('mousedown', handleClickAway);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showManualInput]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3">
        <p className="text-xs text-white/90 text-center">
          {t('editor.desktop.program.selectProgramHint' as any) || 'Choose a funding program to define your document structure'}
        </p>
      </div>
      
      <div className="w-full flex flex-col sm:flex-row gap-2">
        <button
          onClick={onOpenProgramFinder}
          className="inline-flex items-center justify-center px-3 py-2 h-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-xs flex-1 min-w-0"
        >
          {connectCopy?.openFinder || t('editor.desktop.config.connectProgram.openFinder' as any) || 'Open ProgramFinder'}
        </button>
        <button
          ref={manualTriggerRef}
          aria-expanded={showManualInput}
          aria-controls="manual-program-connect"
          onClick={() => setShowManualInput((prev) => !prev)}
          className="inline-flex items-center justify-center px-3 py-2 h-auto border border-white/30 hover:border-white/50 text-white font-medium rounded-lg transition-colors hover:bg-white/10 text-xs flex-1 min-w-0"
        >
          {connectCopy?.pasteLink || t('editor.desktop.config.connectProgram.pasteLink' as any) || 'Paste Link'}
        </button>

      </div>
      
      {showManualInput && typeof window !== 'undefined' && manualInputPosition && createPortal(
        <div
          id="manual-program-connect"
          ref={manualInputRef}
          className={`fixed rounded-2xl border border-blue-500/40 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-xl transition-all duration-200 z-[10002] pointer-events-auto opacity-100 translate-y-0`}
          style={{
            top: `${manualInputPosition.top}px`,
            left: `${manualInputPosition.left}px`,
            width: `${manualInputPosition.width}px`
          }}
        >
          <div className="space-y-1 text-white">
            <label className="text-[9px] font-semibold text-white/70 block">
              {connectCopy?.inputLabel || t('editor.desktop.config.connectProgram.inputLabel' as any) || 'Program Link or ID'}
            </label>
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <input
                value={manualValue}
                onChange={(event) => setManualValue(event.target.value)}
                placeholder={connectCopy?.placeholder || t('editor.desktop.config.connectProgram.placeholder' as any) || 'Enter program link or ID...'}
                className="flex-1 rounded border border-white/30 bg-white/10 px-2.5 py-1.5 h-8 text-xs text-white placeholder:text-white/40 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
              />
              <Button
                type="button"
                size="sm"
                className="sm:w-auto text-xs h-8 px-2.5 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={handleManualConnect}
                disabled={programLoading}
              >
                {programLoading ? '...' : (connectCopy?.submit || t('editor.desktop.config.connectProgram.submit' as any) || 'Connect')}
              </Button>
            </div>
            
            <p className="text-[9px] text-white/60">{connectCopy?.example || t('editor.desktop.config.connectProgram.example' as any) || 'e.g., AWS-2024-001 or https://...'}</p>
            {(manualError || programError) && (
              <p className="text-[9px] text-red-400">{manualError || programError}</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}