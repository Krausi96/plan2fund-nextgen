import React, { useState } from "react";
import Link from "next/link";
import featureFlags from "@/lib/featureFlags";
import { loadPlanSections, type PlanSection } from "@/lib/planStore";
import analytics from "@/lib/analytics";

export default function Export() {
  const EXPORT_ENABLED = featureFlags.isEnabled('EXPORT_ENABLED')
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [exporting, setExporting] = useState(false);
  
  // Load plan sections
  React.useEffect(() => {
    const loadedSections = loadPlanSections();
    setSections(loadedSections);
    
    // Track export page view
    analytics.trackEvent({ event: 'export_page_view', sections: loadedSections.length });
  }, []);

  if (!EXPORT_ENABLED) {
    return (
      <main className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-gray-600">Export is currently unavailable.</p>
        <div className="flex justify-between pt-8">
          <Link href="/checkout" className="text-blue-600 hover:underline">← Back to Checkout</Link>
          <Link href="/thank-you" className="text-blue-600 hover:underline">Continue to Success Hub →</Link>
        </div>
      </main>
    )
  }
  const [format, setFormat] = useState<"pdf" | "docx">("pdf");
  const isPaid = false; // stubbed payment state

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
              format, 
              sections: sections.length,
              isPaid 
            });

            // Generate content
            const content = sections.map(s => `# ${s.title}\n\n${s.content || 'No content yet'}`).join('\n\n---\n\n');
            
            if (format === 'pdf') {
              // For now, download as text file (PDF generation would require server-side implementation)
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `business-plan.${format}`;
              a.click();
              URL.revokeObjectURL(url);
            } else {
              // DOCX would require a library like docx
              alert('DOCX export not yet implemented. Please use PDF format.');
            }

            // Track successful export
            analytics.trackEvent({ 
              event: 'export_success', 
              format, 
              sections: sections.length,
              isPaid 
            });
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

