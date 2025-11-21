// ========= PLAN2FUND — EDITOR PAGE =========
// Main editor page - simplified: always loads, defaults to 'submission' product

import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@/features/editor/components/Editor';
import type { ProductType } from '@/features/editor/types/plan';
import PageEntryIndicator from '@/shared/components/common/PageEntryIndicator';
import { useI18n } from '@/shared/contexts/I18nContext';

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
  const { t } = useI18n();
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualProgramInput, setManualProgramInput] = useState('');
  const [manualProgramError, setManualProgramError] = useState<string | null>(null);

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

  const selectedProduct: ProductType = useMemo(() => {
    const value = typeof product === 'string' ? product : undefined;
    return value && isProductType(value) ? value : 'submission';
  }, [product]);
  const connectMode = typeof router.query.connect === 'string' ? router.query.connect : undefined;
  const hasProgramParam = typeof router.query.programId === 'string' && router.query.programId.trim().length > 0;

  useEffect(() => {
    if (connectMode === 'manual') {
      setShowManualInput(true);
    }
  }, [connectMode]);

  const handleOpenProgramFinder = useCallback(() => {
    router.push('/reco?source=editor');
  }, [router]);

  const connectCopy = useMemo(() => ({
    badge: (t('editor.connect.badge' as any) as string) || 'Program options',
    heading: (t('editor.connect.heading' as any) as string) || 'Pick a program or paste a link',
    description: (t('editor.connect.description' as any) as string) ||
      'ProgramFinder can suggest matches from your answers. Already have an official funding URL (AWS, FFG, EU call)? Paste it and we’ll pull the requirements automatically.',
    openFinder: (t('editor.connect.openFinder' as any) as string) || 'Open ProgramFinder',
    pasteLink: (t('editor.connect.pasteLink' as any) as string) || 'Paste program link',
    inputLabel: (t('editor.connect.inputLabel' as any) as string) || 'Official program URL',
    placeholder: (t('editor.connect.placeholder' as any) as string) || 'e.g. https://www.aws.at/funding/...',
    example: (t('editor.connect.example' as any) as string) ||
      'Example: https://www.aws.at/funding/aws-preseed/page_123 or https://www.ffg.at/calls/page_456',
    submit: (t('editor.connect.submit' as any) as string) || 'Load program',
    error: (t('editor.connect.error' as any) as string) || 'Please enter a valid program URL.',
  }), [t]);

  const handleManualSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualProgramError(null);
    const normalized = normalizeProgramInput(manualProgramInput);
    if (!normalized) {
      setManualProgramError(connectCopy.error);
      return;
    }
    const nextQuery = { ...router.query, programId: normalized };
    router.push({ pathname: router.pathname, query: nextQuery });
  }, [connectCopy.error, manualProgramInput, router]);

  const manualPlaceholder = connectCopy.placeholder;

  return (
    <ErrorBoundary>
      <PageEntryIndicator 
        icon="hint"
        translationKey="editor"
        duration={0}
      />
      {!hasProgramParam && (
        <div className="mx-auto mb-8 w-full max-w-5xl px-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 shadow-sm">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  {connectCopy.badge}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {connectCopy.heading}
                </h2>
                <p className="mt-2 text-sm text-gray-700">
                  {connectCopy.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleOpenProgramFinder}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  {connectCopy.openFinder}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="rounded-lg border border-blue-300 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-white"
                >
                  {connectCopy.pasteLink}
                </button>
              </div>
              {showManualInput && (
                <form className="mt-2 space-y-2" onSubmit={handleManualSubmit}>
                  <label className="text-sm font-medium text-gray-800">
                    {connectCopy.inputLabel}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={manualProgramInput}
                      onChange={(event) => setManualProgramInput(event.target.value)}
                      placeholder={manualPlaceholder}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black"
                    >
                      {connectCopy.submit}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    {connectCopy.example}
                  </p>
                  {manualProgramError && (
                    <p className="text-sm text-red-600">{manualProgramError}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
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

function normalizeProgramInput(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('page_')) {
    return trimmed;
  }
  const directIdMatch = trimmed.match(/^(\d{2,})$/);
  if (directIdMatch) {
    return `page_${directIdMatch[1]}`;
  }
  const embeddedMatch = trimmed.match(/page[_-]?(\d{2,})/i);
  if (embeddedMatch) {
    return `page_${embeddedMatch[1]}`;
  }
  const numericMatch = trimmed.match(/(\d{2,})/);
  if (numericMatch) {
    return `page_${numericMatch[1]}`;
  }
  return null;
}
