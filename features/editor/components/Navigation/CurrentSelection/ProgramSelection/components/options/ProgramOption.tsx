import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/shared/components/ui/button';
import { useI18n } from '@/shared/contexts/I18nContext';
import { normalizeProgramInput, generateProgramBlueprint, normalizeFundingProgram, generateDocumentStructureFromProfile, enhanceWithSpecialSections } from '@/features/editor/lib';
import { useEditorStore } from '@/features/editor/lib/store/editorStore';
import { createFallbackBlueprint } from '@/features/ai/lib/blueprintUtils';
import { saveSelectedProgram } from '@/features/reco/lib/programPersistence';

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
  // Access editor store for document setup management
  const setProgramProfile = useEditorStore((state) => state.setProgramProfile);
  const setDocumentStructure = useEditorStore((state) => state.setDocumentStructure);
  const setSetupStatus = useEditorStore((state) => state.setSetupStatus);
  const setSetupDiagnostics = useEditorStore((state) => state.setSetupDiagnostics);
  
  const manualInputRef = useRef<HTMLDivElement | null>(null);
  const manualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const handleManualConnect = async () => {
    setManualError(null);
    
    // XSS Sanitization: Clean user input before processing
    const sanitizedInput = DOMPurify.sanitize(manualValue.trim());
    
    const normalized = normalizeProgramInput(sanitizedInput);
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
    
    // Fetch from individual templates if available
    const { awsSeedfinancing, ffgBasisprogramm, eicAccelerator } = await import('@/features/editor/lib/templates');
    
    const individualTemplates = [awsSeedfinancing, ffgBasisprogramm, eicAccelerator];
    
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
      const documentStructure = generateDocumentStructureFromProfile(fundingProgram);
      
      // Step 3: Generate blueprint using shared fallback utility
      try {
        // First attempt to get enhanced blueprint from API
        const blueprintResponse = await fetch('/api/programs/blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fundingProgram: fundingProgram,
            userContext: {
              organisation_type: 'startup', // Default for manual entry
              company_stage: 'idea',
              location: 'austria',
              funding_amount: 50000,
              industry_focus: ['technology'],
              co_financing: 'co_yes'
            }
          })
        });
        
        if (blueprintResponse.ok) {
          const { blueprint } = await blueprintResponse.json();
          console.log('[ProgramOption] Enhanced blueprint generated:', blueprint);
          
          // Store enhanced blueprint
          Object.assign(fundingProgram, {
            blueprint: blueprint,
            blueprintVersion: '1.0',
            blueprintStatus: 'draft' as const,
            blueprintSource: 'myproject' as const,
            blueprintDiagnostics: {
              warnings: [],
              missingFields: [],
              confidence: blueprint.diagnostics?.confidenceScore || 85
            }
          });
          
          // Merge with document structure
          Object.assign(documentStructure, {
            enhancedRequirements: blueprint.structuredRequirements || [],
            financialDetails: blueprint.financial || {},
            marketAnalysis: blueprint.market || {},
            teamRequirements: blueprint.team || {},
            riskAssessment: blueprint.risk || {},
            formattingRules: blueprint.formatting || {},
            aiGuidance: blueprint.aiGuidance || {},
            diagnostics: blueprint.diagnostics || {}
          });
        } else {
          throw new Error(`Blueprint API returned status ${blueprintResponse.status}`);
        }
      } catch (blueprintError) {
        console.warn('[ProgramOption] Blueprint generation failed, using shared fallback:', blueprintError);
        
        // Use shared fallback blueprint utility with enhanced error handling
        const fallbackBlueprint = createFallbackBlueprint({
          id: fundingProgram.id,
          name: fundingProgram.name,
          description: fundingProgram.rawData?.description,
          funding_types: fundingProgram.fundingTypes
        });
        
        // Store fallback blueprint with proper typing
        Object.assign(fundingProgram, {
          blueprint: fallbackBlueprint,
          blueprintVersion: '1.0',
          blueprintStatus: 'fallback' as const,
          blueprintSource: 'myproject' as const,
          blueprintDiagnostics: {
            warnings: ['Enhanced blueprint generation failed - using available program template structure'],
            missingFields: ['Detailed program requirements from official sources'],
            confidence: fallbackBlueprint.diagnostics.confidenceScore
          }
        });
        
        // Merge fallback structure with document structure
        Object.assign(documentStructure, {
          enhancedRequirements: fallbackBlueprint.structuredRequirements || [],
          financialDetails: fallbackBlueprint.financial || {},
          marketAnalysis: fallbackBlueprint.market || {},
          teamRequirements: fallbackBlueprint.team || {},
          riskAssessment: fallbackBlueprint.risk || {},
          formattingRules: fallbackBlueprint.formatting || {},
          aiGuidance: fallbackBlueprint.aiGuidance || {},
          diagnostics: fallbackBlueprint.diagnostics || {}
        });
        
        // Show user-friendly feedback
        setManualError('Program connected successfully. Enhanced details will be available when official program data is accessible.');
        setTimeout(() => setManualError(null), 8000); // Clear after 8 seconds
      }
      
      // Step 4: Enhance document structure with special sections (Title Page, TOC, References, etc.)
      const enhancedDocumentStructure = enhanceWithSpecialSections(documentStructure, t);
      
      // Update store with complete data
      setProgramProfile(fundingProgram);
      setDocumentStructure(enhancedDocumentStructure);
      setSetupStatus('draft');
      setSetupDiagnostics({
        warnings: ['Program data entered manually - limited information available'],
        missingFields: ['Detailed requirements', 'Specific deadlines', 'Exact funding amounts'],
        confidence: fundingProgram.blueprintDiagnostics?.confidence || 60
      });
      
      // Step 5: Create legacy-compatible ProgramSummary for backward compatibility
      const programSummary = generateProgramBlueprint(programData);
      onConnectProgram(programSummary);
      
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