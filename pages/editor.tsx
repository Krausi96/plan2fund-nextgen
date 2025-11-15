// ========= PLAN2FUND — EDITOR PAGE =========
// Main editor page with proper provider wrapping

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Editor from '@/features/editor/components/Editor';
import ProductSelectionModal from '@/features/editor/components/ProductSelectionModal';
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

function EditorPage() {
  const router = useRouter();
  const { programId, product } = router.query;
  const [showProductModal, setShowProductModal] = useState(false);

  // Check if we need to show product selection modal
  useEffect(() => {
    if (router.isReady) {
      // Show modal if no product specified
      if (!product) {
        setShowProductModal(true);
      }
    }
  }, [router.isReady, product]);

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
      
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        currentProduct={(product as string) || 'submission'}
      />
      
      {!showProductModal && (
        <Editor
          programId={programId as string}
          product={(product as string) || 'submission'}
        />
      )}
    </>
  );
}

export default EditorPage;