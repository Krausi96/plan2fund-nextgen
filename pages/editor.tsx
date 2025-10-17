// ========= PLAN2FUND — UNIFIED EDITOR PAGE =========
// Main editor page using the new unified editor architecture

import { useRouter } from 'next/router';
import { EditorProvider } from '@/components/editor/EditorState';
import UnifiedEditor from '@/components/editor/UnifiedEditor';

export default function EditorPage() {
  const router = useRouter();
  const { programId } = router.query;

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

  // If no programId, redirect to reco
  if (!programId) {
    router.push('/reco');
    return null;
  }

  return (
    <EditorProvider>
      <UnifiedEditor 
        programId={programId as string}
      />
    </EditorProvider>
  );
}
