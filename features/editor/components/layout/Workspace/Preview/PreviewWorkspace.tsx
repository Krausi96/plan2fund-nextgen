// ========= PLAN2FUND — PREVIEW PANE =========
// Live document preview that mirrors the /preview experience inline.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BusinessPlan,
  PlanDocument,
  Route
} from '@/features/editor/lib/types';
import ExportRenderer from '@/features/editor/components/layout/Renderer/DocumentRenderer';
import {
  convertSectionToPlanSection
} from '@/features/editor/lib/helpers';

interface PreviewPanelProps {
  plan: BusinessPlan | null;
  focusSectionId?: string | null;
  onSectionClick?: (sectionId: string) => void;
  editingSectionId?: string | null;
  disabledSections?: Set<string>;
  onTitlePageChange?: (titlePage: any) => void;
  onAncillaryChange?: (updates: Partial<any>) => void;
  onReferenceAdd?: (reference: any) => void;
  onReferenceUpdate?: (reference: any) => void;
  onReferenceDelete?: (referenceId: string) => void;
  onAppendixAdd?: (item: any) => void;
  onAppendixUpdate?: (item: any) => void;
  onAppendixDelete?: (appendixId: string) => void;
  selectedProductMeta?: { value: string; label: string; description: string; icon?: string } | null;
  selectedDocumentName?: string | null; // Name of additional document if viewing one
  isNewUser?: boolean; // True if this is a new user (no plan content yet)
}


function PreviewPanel({ 
  plan, 
  onSectionClick,
  editingSectionId,
  disabledSections = new Set(),
  onTitlePageChange,
  onAncillaryChange,
  onReferenceAdd,
  onReferenceUpdate,
  onReferenceDelete,
  onAppendixAdd,
  onAppendixUpdate,
  onAppendixDelete,
  selectedProductMeta,
  selectedDocumentName,
  isNewUser = false
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'page' | 'fluid'>('page');
  const [showWatermark, setShowWatermark] = useState(true);
  const [zoomPreset, setZoomPreset] = useState<'100' | '120' | '140'>('100');
  const [fitScale, setFitScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  
  // Calculate responsive preview padding based on screen width
  // Use consistent default for SSR to avoid hydration mismatch
  const [previewPadding, setPreviewPadding] = useState(() => ({
    left: '40px',
    right: '20px',
    maxWidth: 'none'
  }));
  
  // Update padding on mount and resize (client-side only)
  useEffect(() => {
    const updatePadding = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      if (width > 1600) {
        setPreviewPadding({ left: 'auto', right: 'auto', maxWidth: '900px' });
      } else if (width > 1200) {
        setPreviewPadding({ left: '40px', right: '20px', maxWidth: 'none' });
      } else {
        setPreviewPadding({ left: '20px', right: '10px', maxWidth: 'none' });
      }
    };
    
    // Update on mount (client-side)
    updatePadding();
    
    // Update on resize
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, []);

  useEffect(() => {
    if (viewMode !== 'page') {
      setFitScale(1);
      return;
    }

    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }

    const node = viewportRef.current;
    if (!node) return;

    const A4_WIDTH_PX = 793.7; // 210mm translated to CSS px at 96dpi
    const A4_HEIGHT_PX = 1122.5; // 297mm translated to CSS px at 96dpi
    const MAX_BASE_SCALE = 1.15;
    const MIN_SCALE = 0.3; // Allow pages to shrink to 30% so full pages are visible

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      
      // Calculate scale based on both width and height to ensure full pages are visible
      const widthRatio = width / A4_WIDTH_PX;
      const heightRatio = height / A4_HEIGHT_PX;
      
      // Use the smaller ratio to ensure the page fits in both dimensions
      // But allow it to go below 1 to make pages smaller so full pages are visible
      const baseScale = Math.min(widthRatio, heightRatio * 0.9); // 0.9 factor to leave some margin
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_BASE_SCALE, baseScale));
      setFitScale(Number(nextScale.toFixed(3)));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [viewMode]);

  
  const planDocument = useMemo<PlanDocument | null>(() => {
    // Early return if no plan or new user
    // For new users, return null to show empty state
    // This ensures new users see the empty state instead of title page
    // CRITICAL: Check isNewUser first (more semantic than !plan)
    if (isNewUser || !plan) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PreviewWorkspace] isNewUser is true or plan is null, returning null for planDocument', { isNewUser, hasPlan: !!plan });
      }
      return null;
    }
    
    // Allow preview even with empty sections (for additional documents with just title page)
    // plan.sections can be an empty array, which is valid - we still want to show title page
    if (!Array.isArray(plan.sections)) return null;

    // Filter out disabled sections
    const enabledSections = plan.sections.filter(section => !disabledSections.has(section.id));

    // Assign section numbers: Executive Summary is unnumbered, others start at 1
    let sectionNumber = 0;
    const sections = enabledSections.map((section) => {
      const isExecutiveSummary = section.title.toLowerCase().includes('executive summary');
      const currentSectionNumber = isExecutiveSummary ? null : ++sectionNumber;
      return convertSectionToPlanSection(section, currentSectionNumber);
    });

    const inferredRoute: Route =
      plan.fundingProgram === 'loan' ? 'loan' :
      plan.fundingProgram === 'equity' ? 'equity' :
      plan.fundingProgram === 'visa' ? 'visa' :
      'grant';

    const planLanguage = (plan as any).language ?? 'en';
    const editorSettings = (plan as any).settings ?? {};
    const planTone = editorSettings.tone ?? 'neutral';
    const targetLength = editorSettings.targetLength ?? 'standard';
    const formatting = editorSettings.formatting;

    // Determine title: use document name if viewing additional document, otherwise use product name or fallback
    const titlePageTitle =
      selectedDocumentName || // Additional document name takes priority
      plan.titlePage?.planTitle ||
      plan.titlePage?.companyName ||
      selectedProductMeta?.label || // Use product name (e.g., "Submission", "Review", "Strategy")
      plan.programSummary?.name ||
      'Business Plan Draft';

    const subtitle = (plan.titlePage as any)?.subtitle || plan.titlePage?.valueProp || '';
    const teamHighlight = plan.titlePage?.teamHighlight || '';

    return {
      id: plan.id || 'preview_plan',
      ownerId: plan.metadata?.programId || 'user',
      product: plan.productType || 'submission',
      route: inferredRoute,
      language: planLanguage,
      tone: planTone,
      targetLength,
      settings: {
        includeTitlePage: true,
        includePageNumbers: true,
        citations: 'simple',
        captions: true,
        graphs: {},
        titlePage: {
          title: titlePageTitle,
          subtitle,
          author: plan.titlePage?.contactInfo?.name || plan.titlePage?.companyName || '',
          date: plan.titlePage?.date || new Date().toISOString().split('T')[0],
          teamHighlight,
          companyName: plan.titlePage?.companyName,
          logoUrl: plan.titlePage?.logoUrl,
          contactInfo: {
            email: plan.titlePage?.contactInfo?.email || '',
            phone: plan.titlePage?.contactInfo?.phone || '',
            website: plan.titlePage?.contactInfo?.website || '',
            address: plan.titlePage?.contactInfo?.address || ''
          },
          legalForm: plan.titlePage?.legalForm,
          headquartersLocation: plan.titlePage?.headquartersLocation,
          confidentialityStatement: plan.titlePage?.confidentialityStatement
        },
        formatting
      },
      sections,
      references: plan.references || [],
      appendices: plan.appendices || [],
      ancillary: plan.ancillary,
      addonPack: false,
      versions: []
    };
  }, [plan, disabledSections, isNewUser, selectedDocumentName, selectedProductMeta?.label]);

  const zoomMultiplier =
    zoomPreset === '100'
      ? 1.0
      : zoomPreset === '120'
        ? 1.3
        : 1.5; // 150%

  const viewportZoom =
    viewMode === 'page'
      ? Math.max(0.25, Math.min(1.5, zoomMultiplier * (fitScale || 1)))
      : 1;

  const zoomStyle = {
    '--page-zoom': '1',
    '--preview-viewport-zoom': viewportZoom.toString()
  } as React.CSSProperties;

  // If new user or no plan exists, show empty state (user hasn't selected a product yet)
  // Use isNewUser for consistency with other components (Sidebar, DocumentsBar)
  // TODO: Replace with shared EmptyState component
  if (isNewUser || !plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 rounded-lg border border-dashed border-white/20">
        <div className="text-white/60 text-sm">
          [Empty State - To be recreated as shared component]
        </div>
      </div>
    );
  }

  // Debug: Log the state to help diagnose issues
  if (process.env.NODE_ENV === 'development') {
    console.log('[PreviewWorkspace] Render state', {
      hasPlan: !!plan,
      planDocument: !!planDocument,
      isNewUser,
      shouldShowEmpty: isNewUser || !planDocument
    });
  }

  return (
    <>
      {planDocument ? (
        <div className="relative w-full h-full flex flex-col">
            <div className="flex-shrink-0 mb-2 flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-[11px] text-white/80">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wide text-white/60">View</span>
                <button
                  className={`rounded-md px-3 py-1 font-semibold ${viewMode === 'page' ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80'}`}
                  onClick={() => setViewMode('page')}
                >
                  Page
                </button>
                <button
                  className={`rounded-md px-3 py-1 font-semibold ${viewMode === 'fluid' ? 'bg-white text-slate-900' : 'border border-white/20 text-white/80'}`}
                  onClick={() => setViewMode('fluid')}
                >
                  Fluid
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded border-white/20 bg-transparent text-blue-400 focus:ring-blue-400"
                  />
                  Watermark
                </label>
                <div className="flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-0.5">
                  <span className="uppercase tracking-wide text-white/60">Zoom</span>
                  {[
                    { id: '100', label: '100%' },
                    { id: '120', label: '120%' },
                    { id: '140', label: '140%' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
                        zoomPreset === preset.id
                          ? 'bg-white text-slate-900'
                          : 'text-white/70 hover:text-white'
                      }`}
                      onClick={() => setZoomPreset(preset.id as typeof zoomPreset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 flex flex-col">
              <div 
                ref={viewportRef} 
                className="flex-1 w-full overflow-x-hidden flex"
                style={{
                  justifyContent: previewPadding.left === 'auto' ? 'center' : 'flex-start',
                  paddingLeft: previewPadding.left !== 'auto' ? previewPadding.left : undefined,
                  paddingRight: previewPadding.right,
                  maxWidth: previewPadding.maxWidth !== 'none' ? previewPadding.maxWidth : undefined,
                  marginLeft: previewPadding.left === 'auto' ? 'auto' : undefined,
                  marginRight: previewPadding.left === 'auto' ? 'auto' : undefined
                }}
              >
                <ExportRenderer
                  plan={planDocument}
                  previewMode={viewMode === 'page' ? 'formatted' : 'preview'}
                  previewSettings={{
                    showCompletionStatus: true,
                    showWordCount: false,
                    showCharacterCount: false,
                    enableRealTimePreview: true
                  }}
                  style={zoomStyle}
                  onSectionClick={onSectionClick}
                  editingSectionId={editingSectionId}
                  disabledSections={disabledSections}
                  onTitlePageChange={onTitlePageChange}
                  onAncillaryChange={onAncillaryChange}
                  onReferenceAdd={onReferenceAdd}
                  onReferenceUpdate={onReferenceUpdate}
                  onReferenceDelete={onReferenceDelete}
                  onAppendixAdd={onAppendixAdd}
                  onAppendixUpdate={onAppendixUpdate}
                  onAppendixDelete={onAppendixDelete}
                />
              </div>
            </div>
          </div>
        ) : isNewUser ? (
          // TODO: Replace with shared EmptyState component (duplicate removed)
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900/40 rounded-lg border border-dashed border-white/20">
            <div className="text-white/60 text-sm">
              [Empty State - To be recreated as shared component]
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-white/70">
            Start drafting your sections to see the live business plan preview here.
          </div>
        )}
    </>
  );
}

// Export as PreviewWorkspace to match import name
const PreviewWorkspace = PreviewPanel;
export default PreviewWorkspace;