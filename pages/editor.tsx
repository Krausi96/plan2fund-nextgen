// ========= PLAN2FUND — UNIFIED EDITOR PAGE =========
// Main editor page using the new unified editor architecture

import { useRouter } from 'next/router';
import { EditorProvider } from '@/components/editor/EditorState';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

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

  // Parse the encoded parameters
  let parsedAnswers = {};
  let parsedPayload = {};
  
  try {
    if (answers && typeof answers === 'string') {
      parsedAnswers = JSON.parse(decodeURIComponent(answers));
    }
    if (pf && typeof pf === 'string') {
      parsedPayload = JSON.parse(decodeURIComponent(pf));
    }
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
  }

  return (
    <EditorProvider>
        <UnifiedEditor 
          programId={programId as string}
          route={route as string}
          product={product as string}
          answers={parsedAnswers}
          payload={parsedPayload}
          restore={restore === 'true'}
        />
    </EditorProvider>
  );
}
