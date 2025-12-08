import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { mapProgramTypeToFunding, normalizeProgramInput } from './useEditorStore';
import { clearSelectedProgram, loadSelectedProgram, saveSelectedProgram } from '@/shared/user/storage/planStore';
import type { ProgramSummary } from '@/features/editor/lib/types/plan';

export function useProgramConnection() {
  const router = useRouter();
  const [programId, setProgramId] = useState<string | null>(null);
  const [programSummary, setProgramSummary] = useState<ProgramSummary | null>(null);
  const [programLoading, setProgramLoading] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const storedProgramChecked = useRef(false);

  // Load program from URL query or localStorage
  useEffect(() => {
    if (!router.isReady) return;
    const queryProgramId = router.query.programId as string | undefined;
    if (queryProgramId) {
      setProgramId(queryProgramId);
      return;
    }
    if (storedProgramChecked.current) return;
    if (typeof window !== 'undefined') {
      const saved = loadSelectedProgram();
      if (saved?.id) {
        setProgramId(saved.id);
      }
    }
    storedProgramChecked.current = true;
  }, [router.isReady, router.query.programId]);

  const fetchProgramDetails = useCallback(async (id: string) => {
    setProgramLoading(true);
    setProgramError(null);
    try {
      // Use localStorage data instead of database (no database needed)
      const saved = loadSelectedProgram();
      console.log('[useProgramConnection] Loading program details', { 
        requestedId: id, 
        savedId: saved?.id,
        hasSaved: !!saved,
        hasCategorizedRequirements: !!(saved as any)?.categorized_requirements
      });
      
      if (!saved || saved.id !== id) {
        throw new Error('Program not found in localStorage. Please select a program from ProgramFinder.');
      }
      
      // Use saved program data from localStorage
      const mapping = mapProgramTypeToFunding(saved.type || 'grant');
      const summary: ProgramSummary = {
        id: saved.id,
        name: saved.name || '',
        fundingType: mapping.templateFundingType,
        fundingProgramTag: mapping.fundingProgramTag,
        deadline: (saved as any).deadline || null,
        amountRange: (saved as any).funding_amount_min && (saved as any).funding_amount_max
          ? `${(saved as any).funding_amount_min} - ${(saved as any).funding_amount_max}`
          : null,
        region: (saved as any).region || null
      };
      
      console.log('[useProgramConnection] Program summary created', {
        id: summary.id,
        name: summary.name,
        fundingType: summary.fundingType,
        fundingProgramTag: summary.fundingProgramTag,
        hasCategorizedRequirements: !!(saved as any)?.categorized_requirements,
        categorizedRequirementsKeys: (saved as any)?.categorized_requirements ? Object.keys((saved as any).categorized_requirements) : []
      });
      
      setProgramSummary(summary);
      // Update localStorage with complete summary
      saveSelectedProgram({ id: saved.id, name: saved.name, type: summary.fundingProgramTag });
    } catch (err) {
      console.error('[useProgramConnection] Error loading program details', err);
      setProgramSummary(null);
      // Show user-friendly error, hide technical details
      const isDev = process.env.NODE_ENV === 'development';
      const technicalDetails = isDev && err instanceof Error ? ` (${err.message})` : '';
      setProgramError(`Program not found. Please select a program from ProgramFinder or paste a valid program link.${technicalDetails}`);
    } finally {
      setProgramLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!programId) {
      setProgramSummary(null);
      return;
    }
    fetchProgramDetails(programId);
  }, [programId, fetchProgramDetails]);

  const handleConnectProgram = useCallback(
    (rawInput: string | null) => {
      if (!rawInput) {
        console.log('[useProgramConnection] Disconnecting program');
        setProgramId(null);
        setProgramSummary(null);
        setProgramError(null);
        clearSelectedProgram();
        if (router.query.programId) {
          const nextQuery = { ...router.query };
          delete nextQuery.programId;
          router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
        }
        return;
      }
      const normalized = normalizeProgramInput(rawInput);
      if (!normalized) {
        console.warn('[useProgramConnection] Invalid program input', { rawInput });
        setProgramError('Please enter a valid program ID or paste a program URL. You can also select a program from ProgramFinder.');
        return;
      }
      console.log('[useProgramConnection] Connecting program', { rawInput, normalized });
      setProgramError(null);
      setProgramId(normalized);
      const nextQuery = { ...router.query, programId: normalized };
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true });
    },
    [router]
  );

  return {
    programId,
    programSummary,
    programLoading,
    programError,
    handleConnectProgram,
    setProgramSummary
  };
}

