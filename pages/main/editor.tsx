// ========= PLAN2FUND — EDITOR PAGE =========
// Main editor page with proper provider wrapping

import { useRouter } from 'next/router';
import Editor from '@/features/editor/components/Editor';
import { withAuth } from '@/shared/user/auth/withAuth';
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

function EditorPage() {
  const router = useRouter();
  const { product } = router.query;

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

  return (
    <>
      <PageEntryIndicator 
        icon="hint"
        text="Build your business plan section by section."
        duration={5000}
        position="top-right"
      />
      <Editor
        product={(product as string) || 'submission'}
      />
    </>
  );
}

export default withAuth(EditorPage);