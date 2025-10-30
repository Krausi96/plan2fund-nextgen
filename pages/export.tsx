import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import featureFlags from "@/lib/featureFlags";
import { loadPlanSections, type PlanSection } from "@/lib/planStore";
import analytics from "@/lib/analytics";
import { getDocumentBundle } from "@/data/documentBundles";
import { getDocumentById } from "@/data/documentDescriptions";
import { exportManager } from "@/lib/export";

export default function Export() {
  const EXPORT_ENABLED = featureFlags.isEnabled('EXPORT_ENABLED')
  const router = useRouter();
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const isPaid = false; // stubbed payment state
  const [additionalDocuments, setAdditionalDocuments] = useState<any[]>([]);
  const [product] = useState<string>('submission');
  const [route] = useState<string>('grants');
  
  // Load plan sections and additional documents
  React.useEffect(() => {
    const loadedSections = loadPlanSections();
    setSections(loadedSections);
    
    // Load additional documents
    loadAdditionalDocuments();
    const { programId } = router.query as { programId?: string };
    if (programId) {
      fetch(`/api/programmes/${programId}/requirements`).then(r => r.ok ? r.json() : null).then((data) => {
        if (data && Array.isArray(data.additionalDocuments)) {
          setAdditionalDocuments((prev) => mergeDocs(prev, data.additionalDocuments));
        }
      }).catch(() => {});
    }
    
    // Track export page view
    analytics.trackEvent({ 
      event: 'export_page_view', 
      properties: { sections_count: loadedSections.length } 
    });
  }, [router.query]);

  const loadAdditionalDocuments = () => {
    try {
      // Get document bundle for current product/route
      const bundle = getDocumentBundle(product as any, route as any);
      if (bundle) {
        // Get document details for each document ID
        const documents = bundle.documents.map((docId: string) => {
          const docSpec = getDocumentById(docId);
          return {
            id: docId,
            title: docSpec?.title || docId,
            description: docSpec?.short || '',
            format: docSpec?.formatHints?.[0] || 'PDF',
            status: 'ready' // Mock status
          };
        });
        setAdditionalDocuments(documents);
      }
    } catch (error) {
      console.error('Error loading additional documents:', error);
      setAdditionalDocuments([]);
    }
  };

  function mergeDocs(staticDocs: any[], programDocs: any[]) {
    const byId: Record<string, any> = {};
    [...programDocs, ...staticDocs].forEach(d => { if (!byId[d.id]) byId[d.id] = d; else byId[d.id] = { ...byId[d.id], ...d }; });
    return Object.values(byId);
  }

  if (!EXPORT_ENABLED) {
    return (
      <main className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-gray-600">Export is currently unavailable.</p>
        <div className="flex justify-between pt-8">
          <Link href="/confirm" className="text-blue-600 hover:underline">← Back to Payment</Link>
          <Link href="/thank-you" className="text-blue-600 hover:underline">Continue to Success Hub →</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-gray-600">
        Download your business plan as PDF or DOCX.
      </p>

      {/* Content Preview */}
      {sections.length > 0 && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Content Preview</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Total sections: {sections.length}</p>
            <p>Completed sections: {sections.filter(s => s.content && s.content.trim().length > 0).length}</p>
            <p>Total words: {sections.reduce((acc, s) => acc + (s.content?.split(' ').length || 0), 0)}</p>
          </div>
        </div>
      )}

      {/* Additional Documents Section */}
      {additionalDocuments.length > 0 && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📄 Additional Documents
            <span className="text-sm text-gray-600">({additionalDocuments.length} documents)</span>
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            The following additional documents will be included in your export package:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {additionalDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span className="font-medium">{doc.title}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {doc.format}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export format toggle */}
      <div className="flex gap-6 items-center">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={format === "pdf"}
            onChange={() => setFormat("pdf")}
          />
          PDF
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={format === "docx"}
            onChange={() => setFormat("docx")}
          />
          DOCX
        </label>
      </div>

      {/* Download functionality */}
      <button 
        className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={exporting || sections.length === 0}
        onClick={async () => {
          setExporting(true);
          try {
            // Track export attempt
            analytics.trackEvent({ 
              event: 'export_attempt', 
              properties: {
                format, 
                sections_count: sections.length,
                is_paid: isPaid 
              }
            });

            // Build PlanDocument-like object from sections
            const plan = {
              id: `export_${Date.now()}`,
              ownerId: 'user',
              product: 'submission' as const,
              route: 'grant' as const,
              language: 'en' as const,
              tone: 'neutral' as const,
              targetLength: 'standard' as const,
              settings: {
                includeTitlePage: true,
                includePageNumbers: true,
                citations: 'simple' as const,
                captions: true,
                graphs: {}
              },
              sections: sections.map(s => ({ key: s.id, title: s.title, content: s.content || '', status: 'missing' as const, tables: (s as any).tables, figures: (s as any).figures })),
              addonPack: false,
              versions: []
            };

            const result = await exportManager.exportPlan(plan as any, {
              format: (format.toUpperCase() as any),
              includeWatermark: !isPaid,
              isPaid,
              quality: 'standard',
              includeToC: true,
              includeListOfFigures: true
            });
            if (!result.success) throw new Error(result.error || 'Export failed');

            // Track successful export
            analytics.trackEvent({ 
              event: 'export_success', 
              properties: {
                format, 
                sections_count: sections.length,
                is_paid: isPaid 
              }
            });

            // After successful export, redirect to thank-you page
            setTimeout(() => {
              window.location.href = '/thank-you';
            }, 2000);
          } catch (error) {
            analytics.trackError(error as Error, 'export_download');
            alert('Export failed. Please try again.');
          } finally {
            setExporting(false);
          }
        }}
      >
        {exporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}
      </button>

      {/* Watermark stub if unpaid */}
      {!isPaid && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-100 text-sm text-gray-600">
          ⚠️ Unpaid version – Export will include watermark until payment is
          completed.
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        <Link
          href="/checkout"
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          ← Back to Checkout
        </Link>
        <Link
          href="/thank-you"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Continue to Success Hub →
        </Link>
      </div>
    </main>
  );
}

