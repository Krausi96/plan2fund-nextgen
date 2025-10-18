// ========= PLAN2FUND — UNIFIED EDITOR PAGE =========
// Main editor page using the new unified editor architecture

import { useRouter } from 'next/router';
import { EditorProvider } from '@/components/editor/EditorState';
import UnifiedEditor from '@/components/editor/UnifiedEditor';
import { EditorNormalization } from '@/lib/editor/EditorNormalization';

export default function EditorPage() {
  const router = useRouter();
  const { programId, route, product, answers, pf, restore } = router.query;

  // Show loading while router is ready
  if (!router.isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // If no programId and not restoring, redirect to reco
  if (!programId && !restore) {
    router.push('/reco');
    return null;
  }

  // Use normalization system to handle all entry points
  const normalizedData = EditorNormalization.normalizeInput({
    programId: programId as string,
    route: route as string,
    product: product as string,
    answers: answers ? JSON.parse(decodeURIComponent(answers as string)) : {},
    payload: pf ? JSON.parse(decodeURIComponent(pf as string)) : {},
    restore: restore === 'true',
    entryPoint: programId ? 'wizard-results' : 'direct'
  });

  return (
    <EditorProvider>
      <UnifiedEditor 
        programId={normalizedData.programId}
        route={normalizedData.route}
        product={normalizedData.product}
        answers={normalizedData.answers}
        payload={normalizedData.payload}
        restore={restore === 'true'}
      />
    </EditorProvider>
  );
}
