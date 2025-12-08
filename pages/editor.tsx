// ========= PLAN2FUND — EDITOR PAGE =========
// Main editor page - simplified: always loads, defaults to 'submission' product

import { useRouter } from 'next/router';
import React, { useMemo } from 'react';
import Editor from '@/features/editor/components/Editor';
import type { ProductType } from '@/features/editor/lib/types/plan';
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center max-w-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An error occurred while loading the editor.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function EditorPage() {
  const router = useRouter();
  const { product } = router.query;

  const selectedProduct: ProductType | null = useMemo(() => {
    const value = typeof product === 'string' ? product : undefined;
    return value && isProductType(value) ? value : null;
  }, [product]);

  // Always render Editor component to ensure consistent SSR/client rendering
  // The Editor component will handle its own loading states
  return (
    <ErrorBoundary>
      <PageEntryIndicator 
        icon="hint"
        translationKey="editor"
        duration={0}
      />
      <Editor
        product={selectedProduct}
      />
    </ErrorBoundary>
  );
}

export default EditorPage;

function isProductType(value: string): value is ProductType {
  return (
    value === 'submission' ||
    value === 'review' ||
    value === 'strategy'
  );
}
